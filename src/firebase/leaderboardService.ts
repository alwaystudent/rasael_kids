import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
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

export function subscribePublicCompetitors(
  onData: (competitors: CloudCompetitor[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'competitors';
  const q = query(
    collection(db, path),
    where('isPublic', '==', true),
    limit(100)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: CloudCompetitor[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (
          typeof data.id === 'string' &&
          typeof data.name === 'string' &&
          typeof data.stars === 'number' &&
          typeof data.completedCount === 'number'
        ) {
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
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
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

  let exists = false;
  try {
    const snap = await getDoc(ref);
    exists = snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
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
    }
  } catch (error) {
    handleFirestoreError(
      error,
      exists ? OperationType.UPDATE : OperationType.CREATE,
      path
    );
  }
}

export async function renameCompetitor(
  competitorId: string,
  name: string
): Promise<void> {
  const safeId = sanitizeId(competitorId);
  const path = `competitors/${safeId}`;
  const ref = doc(db, 'competitors', safeId);

  try {
    await updateDoc(ref, {
      name: sanitizeCompetitorName(name),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
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

  let exists = false;
  try {
    const snap = await getDoc(ref);
    exists = snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
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
    }
  } catch (error) {
    handleFirestoreError(
      error,
      exists ? OperationType.UPDATE : OperationType.CREATE,
      path
    );
  }
}
