import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  db,
  handleFirestoreError,
  OperationType,
} from './config';
import {
  clampCompletedCount,
  clampStars,
  sanitizeAdhkarProgress,
  sanitizeCompetitorName,
  sanitizeCompletedIds,
  sanitizeDateKey,
  sanitizeId,
  MAX_USER_NAME_LENGTH,
} from './validation';

export type CompetitorKind = 'primary' | 'companion';

export interface CloudCompetitor {
  id: string;
  name: string;
  stars: number;
  completedCount: number;
  lastDailyChallengeDate: string;
  ownerUid: string;
  kind: CompetitorKind;
  isPublic: true;
}

export interface CloudUserProgress {
  uid: string;
  childName: string;
  stars: number;
  completedIds: string[];
  adhkarProgress: Record<string, number>;
  dailyChallengeCompletedDate: string;
  activeCompetitorId: string;
}

const PUBLIC_CACHE_KEY = 'rasael_public_competitors_cache_v1';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL to minimize Firebase reads
const MAX_CACHED_COMPETITORS = 50;

const knownExistingCompetitorIds = new Set<string>();
const knownExistingUserIds = new Set<string>();

interface CachedCompetitorsPayload {
  fetchedAt: number;
  items: CloudCompetitor[];
}

export function readCachedCompetitors(): CloudCompetitor[] {
  try {
    const raw = localStorage.getItem(PUBLIC_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CachedCompetitorsPayload;
    if (Array.isArray(parsed?.items)) {
      return parsed.items.slice(0, MAX_CACHED_COMPETITORS);
    }
  } catch {
    // Ignore storage parse failure
  }
  return [];
}

function writeCachedCompetitors(items: CloudCompetitor[]) {
  try {
    const compact = items.slice(0, MAX_CACHED_COMPETITORS);
    const payload: CachedCompetitorsPayload = {
      fetchedAt: Date.now(),
      items: compact,
    };
    localStorage.setItem(PUBLIC_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota failure safely without harming device
  }
}

function isCacheFresh(): boolean {
  try {
    const raw = localStorage.getItem(PUBLIC_CACHE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as CachedCompetitorsPayload;
    return (
      typeof parsed?.fetchedAt === 'number' &&
      Date.now() - parsed.fetchedAt < CACHE_TTL_MS
    );
  } catch {
    return false;
  }
}

/**
 * Lightweight one-shot fetch with local TTL caching to avoid continuous server load
 * and support seamless offline browsing.
 */
export async function fetchPublicCompetitors(
  forceRefresh = false
): Promise<CloudCompetitor[]> {
  const cached = readCachedCompetitors();

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return cached;
  }

  if (!forceRefresh && cached.length > 0 && isCacheFresh()) {
    return cached;
  }

  const path = 'competitors';
  const q = query(
    collection(db, path),
    where('isPublic', '==', true),
    limit(MAX_CACHED_COMPETITORS)
  );

  try {
    const snapshot = await getDocs(q);
    const list: CloudCompetitor[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (
        typeof data.id === 'string' &&
        typeof data.name === 'string' &&
        typeof data.stars === 'number' &&
        typeof data.completedCount === 'number'
      ) {
        knownExistingCompetitorIds.add(data.id);
        list.push({
          id: data.id,
          name: data.name,
          stars: data.stars,
          completedCount: data.completedCount,
          lastDailyChallengeDate:
            typeof data.lastDailyChallengeDate === 'string'
              ? data.lastDailyChallengeDate
              : '',
          ownerUid: typeof data.ownerUid === 'string' ? data.ownerUid : '',
          kind: data.kind === 'companion' ? 'companion' : 'primary',
          isPublic: true,
        });
      }
    });
    writeCachedCompetitors(list);
    return list;
  } catch (error) {
    if (cached.length > 0) {
      return cached;
    }
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function upsertCompetitor(params: {
  id: string;
  name: string;
  stars: number;
  completedCount: number;
  lastDailyChallengeDate: string | null | undefined;
  ownerUid: string;
  kind: CompetitorKind;
}): Promise<void> {
  const safeId = sanitizeId(params.id);
  const path = `competitors/${safeId}`;
  const ref = doc(db, 'competitors', safeId);

  const safeName = sanitizeCompetitorName(params.name);
  const safeStars = clampStars(params.stars);
  const safeCount = clampCompletedCount(params.completedCount);
  const safeDate = sanitizeDateKey(params.lastDailyChallengeDate);

  let exists = knownExistingCompetitorIds.has(safeId);
  if (!exists) {
    try {
      const snap = await getDoc(ref);
      exists = snap.exists();
      if (exists) {
        knownExistingCompetitorIds.add(safeId);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  }

  try {
    if (exists) {
      await updateDoc(ref, {
        name: safeName,
        stars: safeStars,
        completedCount: safeCount,
        lastDailyChallengeDate: safeDate,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        id: safeId,
        name: safeName,
        stars: safeStars,
        completedCount: safeCount,
        lastDailyChallengeDate: safeDate,
        ownerUid: sanitizeId(params.ownerUid),
        kind: params.kind,
        isPublic: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      knownExistingCompetitorIds.add(safeId);
    }
  } catch (error) {
    handleFirestoreError(
      error,
      exists ? OperationType.UPDATE : OperationType.CREATE,
      path
    );
  }
}

export async function fetchUserProgress(
  uid: string
): Promise<CloudUserProgress | null> {
  const safeUid = sanitizeId(uid);
  const path = `users/${safeUid}`;
  const ref = doc(db, 'users', safeUid);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    knownExistingUserIds.add(safeUid);
    const data = snap.data();
    return {
      uid: safeUid,
      childName: typeof data.childName === 'string' ? data.childName : '',
      stars: typeof data.stars === 'number' ? data.stars : 0,
      completedIds: Array.isArray(data.completedIds) ? data.completedIds : [],
      adhkarProgress:
        data.adhkarProgress && typeof data.adhkarProgress === 'object'
          ? (data.adhkarProgress as Record<string, number>)
          : {},
      dailyChallengeCompletedDate:
        typeof data.dailyChallengeCompletedDate === 'string'
          ? data.dailyChallengeCompletedDate
          : '',
      activeCompetitorId:
        typeof data.activeCompetitorId === 'string'
          ? data.activeCompetitorId
          : safeUid,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserProgress(
  uid: string,
  progress: Omit<CloudUserProgress, 'uid'>
): Promise<void> {
  const safeUid = sanitizeId(uid);
  const path = `users/${safeUid}`;
  const ref = doc(db, 'users', safeUid);

  const safeChildName = progress.childName.trim().slice(0, MAX_USER_NAME_LENGTH);
  const safeStars = clampStars(progress.stars);
  const safeCompletedIds = sanitizeCompletedIds(progress.completedIds);
  const safeAdhkar = sanitizeAdhkarProgress(progress.adhkarProgress);
  const safeDate = sanitizeDateKey(progress.dailyChallengeCompletedDate);
  const safeActiveId = sanitizeId(progress.activeCompetitorId || safeUid);

  let exists = knownExistingUserIds.has(safeUid);
  if (!exists) {
    try {
      const snap = await getDoc(ref);
      exists = snap.exists();
      if (exists) {
        knownExistingUserIds.add(safeUid);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  }

  try {
    if (exists) {
      await updateDoc(ref, {
        childName: safeChildName,
        stars: safeStars,
        completedIds: safeCompletedIds,
        adhkarProgress: safeAdhkar,
        dailyChallengeCompletedDate: safeDate,
        activeCompetitorId: safeActiveId,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        uid: safeUid,
        childName: safeChildName,
        stars: safeStars,
        completedIds: safeCompletedIds,
        adhkarProgress: safeAdhkar,
        dailyChallengeCompletedDate: safeDate,
        activeCompetitorId: safeActiveId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      knownExistingUserIds.add(safeUid);
    }
  } catch (error) {
    handleFirestoreError(
      error,
      exists ? OperationType.UPDATE : OperationType.CREATE,
      path
    );
  }
}
