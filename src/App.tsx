import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  LogIn,
  Mail,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  onAuthStateChanged,
  sendEmailVerification,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  HERO_IMAGE,
  SERIES_LIST,
  type ActivityEngineId,
} from './data/channelContent';
import { SidebarNav, TopHeaderBar } from './components/Header';
import { PlatformLogo } from './components/PlatformLogo';
import { ResilientImage } from './components/ResilientImage';
import {
  DailyChallengeSection,
  getTodayDateKey,
} from './components/DailyChallengeSection';
import { InteractiveStage } from './components/InteractiveStage';
import {
  LeaderboardSection,
  type LeaderboardEntry,
} from './components/LeaderboardSection';
import { ChannelFeedSection } from './components/ChannelFeedSection';
import { AchievementsSection } from './components/AchievementsSection';
import {
  StarCelebrationBanner,
  type CelebrationEvent,
} from './components/StarCelebrationBanner';
import { SplashScreen } from './components/SplashScreen';
import { EmailAuthModal } from './components/EmailAuthModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { DailyHintPopup } from './components/DailyHintPopup';
import { WelcomeMemberBanner } from './components/WelcomeMemberBanner';
import { soundFX } from './utils/soundEffects';
import { auth, googleProvider } from './firebase/config';
import {
  fetchPublicCompetitors,
  fetchUserProgress,
  readCachedCompetitors,
  saveUserProgress,
  upsertCompetitor,
  type CloudCompetitor,
} from './firebase/leaderboardService';
import {
  clampStars,
  sanitizeAdhkarProgress,
  sanitizeCompletedIds,
  sanitizeId,
} from './firebase/validation';

interface SavedProgress {
  childName: string;
  stars: number;
  completedIds: string[];
  adhkarProgress: Record<string, number>;
  dailyChallengeCompletedDate: string | null;
  activeCompetitorId: string | null;
}

const USER_CACHE_PREFIX = 'rasael_user_cache_v1_';
const BROWSE_STATE_KEY = 'rasael_browse_state_v1';
const LEGACY_KEYS = ['rasael_children_platform_v1', 'rasael_children_platform_v2'];

const DEFAULT_PROGRESS: SavedProgress = {
  childName: '',
  stars: 0,
  completedIds: [],
  adhkarProgress: {},
  dailyChallengeCompletedDate: null,
  activeCompetitorId: null,
};

function readUserCache(uid: string): SavedProgress | null {
  try {
    const raw = localStorage.getItem(`${USER_CACHE_PREFIX}${sanitizeId(uid)}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      childName: typeof parsed.childName === 'string' ? parsed.childName.slice(0, 32) : '',
      stars: clampStars(typeof parsed.stars === 'number' ? parsed.stars : 0),
      completedIds: Array.isArray(parsed.completedIds)
        ? sanitizeCompletedIds(parsed.completedIds)
        : [],
      adhkarProgress:
        parsed.adhkarProgress && typeof parsed.adhkarProgress === 'object'
          ? sanitizeAdhkarProgress(parsed.adhkarProgress)
          : {},
      dailyChallengeCompletedDate:
        typeof parsed.dailyChallengeCompletedDate === 'string'
          ? parsed.dailyChallengeCompletedDate
          : null,
      activeCompetitorId:
        typeof parsed.activeCompetitorId === 'string'
          ? parsed.activeCompetitorId
          : null,
    };
  } catch {
    return null;
  }
}

function writeUserCache(uid: string, snapshot: SavedProgress) {
  try {
    const compact: SavedProgress = {
      childName: snapshot.childName.trim().slice(0, 32),
      stars: clampStars(snapshot.stars),
      completedIds: sanitizeCompletedIds(snapshot.completedIds),
      adhkarProgress: sanitizeAdhkarProgress(snapshot.adhkarProgress),
      dailyChallengeCompletedDate: snapshot.dailyChallengeCompletedDate,
      activeCompetitorId: snapshot.activeCompetitorId,
    };
    localStorage.setItem(
      `${USER_CACHE_PREFIX}${sanitizeId(uid)}`,
      JSON.stringify(compact)
    );
  } catch {
    // Ignore storage quota errors safely
  }
}

function readBrowseState(): { activeEngine: ActivityEngineId; activeSection: string } {
  try {
    const raw = sessionStorage.getItem(BROWSE_STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        activeEngine: parsed.activeEngine || 'etiquette',
        activeSection: parsed.activeSection || 'hero',
      };
    }
  } catch {
    // Ignore sessionStorage errors
  }
  return { activeEngine: 'etiquette', activeSection: 'hero' };
}

export default function App() {
  const initialBrowse = useMemo(() => readBrowseState(), []);

  const [progress, setProgress] = useState<SavedProgress>(DEFAULT_PROGRESS);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  const [emailAuthOpen, setEmailAuthOpen] = useState(false);
  const [authPromptReason, setAuthPromptReason] = useState<string | null>(null);
  const [welcomeBannerVisible, setWelcomeBannerVisible] = useState(false);
  const [welcomeMemberName, setWelcomeMemberName] = useState('');

  const [cloudCompetitors, setCloudCompetitors] = useState<CloudCompetitor[]>(() =>
    readCachedCompetitors()
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshCooldown, setRefreshCooldown] = useState(0);

  const [activeEngine, setActiveEngine] = useState<ActivityEngineId>(
    initialBrowse.activeEngine
  );
  const [focusTargetId, setFocusTargetId] = useState<string | undefined>(undefined);
  const [educatorMode, setEducatorMode] = useState(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => soundFX.isMuted());
  const [activeSection, setActiveSection] = useState<string>(
    initialBrowse.activeSection
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [celebration, setCelebration] = useState<CelebrationEvent | null>(null);

  const celebrationTimerRef = useRef<number | null>(null);
  const localSaveTimerRef = useRef<number | null>(null);
  const cloudSyncTimerRef = useRef<number | null>(null);
  const lastSyncedDigestRef = useRef<string>('');
  const progressRef = useRef<SavedProgress>(progress);
  progressRef.current = progress;

  // Cleanup legacy bloated unauthenticated localStorage keys once
  useEffect(() => {
    try {
      for (const key of LEGACY_KEYS) {
        localStorage.removeItem(key);
      }
    } catch {
      // Ignore cleanup errors
    }
  }, []);

  // Lightweight browsing state persistence in sessionStorage for offline continuity
  useEffect(() => {
    try {
      sessionStorage.setItem(
        BROWSE_STATE_KEY,
        JSON.stringify({ activeEngine, activeSection })
      );
    } catch {
      // Ignore sessionStorage errors
    }
  }, [activeEngine, activeSection]);

  // Debounced lightweight browser save ONLY when signed in
  useEffect(() => {
    if (!authUser) return;
    if (localSaveTimerRef.current) {
      window.clearTimeout(localSaveTimerRef.current);
    }
    localSaveTimerRef.current = window.setTimeout(() => {
      writeUserCache(authUser.uid, progress);
    }, 400);

    return () => {
      if (localSaveTimerRef.current) {
        window.clearTimeout(localSaveTimerRef.current);
      }
    };
  }, [authUser, progress]);

  useEffect(() => {
    return () => {
      if (celebrationTimerRef.current) {
        window.clearTimeout(celebrationTimerRef.current);
      }
      if (cloudSyncTimerRef.current) {
        window.clearTimeout(cloudSyncTimerRef.current);
      }
    };
  }, []);

  // Cooldown timer for manual leaderboard refresh
  useEffect(() => {
    if (refreshCooldown <= 0) return;
    const timer = window.setTimeout(() => {
      setRefreshCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [refreshCooldown]);

  const syncSnapshotToCloudNow = useCallback(
    async (user: User, snapshot: SavedProgress) => {
      if (!user.emailVerified) {
        return;
      }
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return;
      }

      const activeId = sanitizeId(snapshot.activeCompetitorId || user.uid);
      const kind = activeId === sanitizeId(user.uid) ? 'primary' : 'companion';
      const fallbackName = user.displayName?.trim() || 'البطل الصغير';
      const resolvedName = snapshot.childName.trim() || fallbackName;

      const digest = JSON.stringify({
        activeId,
        resolvedName,
        stars: snapshot.stars,
        count: snapshot.completedIds.length,
        adhkar: snapshot.adhkarProgress,
        daily: snapshot.dailyChallengeCompletedDate || '',
      });
      if (digest === lastSyncedDigestRef.current) {
        return;
      }

      await Promise.all([
        upsertCompetitor({
          id: activeId,
          name: resolvedName,
          stars: snapshot.stars,
          completedCount: snapshot.completedIds.length,
          lastDailyChallengeDate: snapshot.dailyChallengeCompletedDate || '',
          ownerUid: user.uid,
          kind,
        }),
        saveUserProgress(user.uid, {
          childName: resolvedName,
          stars: snapshot.stars,
          completedIds: snapshot.completedIds,
          adhkarProgress: snapshot.adhkarProgress,
          dailyChallengeCompletedDate: snapshot.dailyChallengeCompletedDate || '',
          activeCompetitorId: activeId,
        }),
      ]);

      lastSyncedDigestRef.current = digest;
    },
    []
  );

  // Debounced cloud sync to avoid spamming Firebase servers
  const scheduleCloudSync = useCallback(
    (user: User, snapshot: SavedProgress) => {
      if (!user.emailVerified) return;
      if (cloudSyncTimerRef.current) {
        window.clearTimeout(cloudSyncTimerRef.current);
      }
      cloudSyncTimerRef.current = window.setTimeout(() => {
        void syncSnapshotToCloudNow(user, snapshot).catch((err) =>
          console.error('Deferred cloud sync error:', err)
        );
      }, 2500);
    },
    [syncSnapshotToCloudNow]
  );

  // Auth listener + lightweight initial hydration
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      setAuthReady(true);

      if (!user) {
        setProgress(DEFAULT_PROGRESS);
        lastSyncedDigestRef.current = '';
        return;
      }

      const safeUid = sanitizeId(user.uid);
      const localUserCache = readUserCache(user.uid);

      if (localUserCache) {
        setProgress(localUserCache);
      }

      try {
        const cloudProgress =
          user.emailVerified && (typeof navigator === 'undefined' || navigator.onLine)
            ? await fetchUserProgress(user.uid)
            : null;

        let hydrated: SavedProgress;
        if (cloudProgress) {
          const base = localUserCache || DEFAULT_PROGRESS;
          const unionIds = Array.from(
            new Set([...cloudProgress.completedIds, ...base.completedIds])
          );
          const mergedAdhkar: Record<string, number> = {
            ...cloudProgress.adhkarProgress,
          };
          for (const [k, v] of Object.entries(base.adhkarProgress)) {
            mergedAdhkar[k] = Math.max(mergedAdhkar[k] || 0, v);
          }
          hydrated = {
            childName:
              cloudProgress.childName.trim() ||
              base.childName.trim() ||
              user.displayName?.trim() ||
              '',
            stars: Math.max(cloudProgress.stars, base.stars),
            completedIds: unionIds,
            adhkarProgress: mergedAdhkar,
            dailyChallengeCompletedDate:
              cloudProgress.dailyChallengeCompletedDate ||
              base.dailyChallengeCompletedDate ||
              null,
            activeCompetitorId: cloudProgress.activeCompetitorId || safeUid,
          };
        } else {
          const base = localUserCache || DEFAULT_PROGRESS;
          hydrated = {
            ...base,
            childName: base.childName.trim() || user.displayName?.trim() || '',
            activeCompetitorId: base.activeCompetitorId || safeUid,
          };
        }

        setProgress(hydrated);
        writeUserCache(user.uid, hydrated);

        if (user.emailVerified) {
          await syncSnapshotToCloudNow(user, hydrated);
          setAuthNotice(null);
        } else {
          setAuthNotice(
            'تم تسجيل دخولك؛ فعّل رابط التأكيد في بريدك الإلكتروني لتظهر نتيجتك في لوحة الشرف عبر جميع الأجهزة.'
          );
        }
      } catch (err) {
        console.error('User hydration notice:', err);
      }
    });

    return () => unsubscribe();
  }, [syncSnapshotToCloudNow]);

  // One-shot TTL-cached public leaderboard load (no continuous listener)
  useEffect(() => {
    if (!authReady) return;
    let active = true;
    void fetchPublicCompetitors(false)
      .then((list) => {
        if (active) setCloudCompetitors(list);
      })
      .catch((err) => {
        console.error('Cached leaderboard load notice:', err);
      });
    return () => {
      active = false;
    };
  }, [authReady]);

  const handleRefreshLeaderboard = async () => {
    if (isRefreshing || refreshCooldown > 0) return;
    setIsRefreshing(true);
    setRefreshCooldown(15);
    try {
      const fresh = await fetchPublicCompetitors(true);
      setCloudCompetitors(fresh);
    } catch (err) {
      console.error('Manual leaderboard refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const visiblePeers: LeaderboardEntry[] = useMemo(() => {
    const activeCloudId = authUser
      ? sanitizeId(progress.activeCompetitorId || authUser.uid)
      : null;

    return cloudCompetitors
      .filter((c) => !activeCloudId || c.id !== activeCloudId)
      .map((c) => ({
        id: c.id,
        name: c.name,
        stars: c.stars,
        completedCount: c.completedCount,
        isPeer: !authUser || c.ownerUid !== authUser.uid,
        isCloud: true,
        lastDailyChallengeDate: c.lastDailyChallengeDate || null,
      }));
  }, [authUser, cloudCompetitors, progress.activeCompetitorId]);

  const openEmailAuth = (reason?: string) => {
    setAuthPromptReason(reason || null);
    setEmailAuthOpen(true);
  };

  const handleSignInWithGoogle = async () => {
    setIsAuthLoading(true);
    setAuthNotice(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      soundFX.playCelebration();
      setWelcomeMemberName(cred.user.displayName || 'بطلنا');
      setWelcomeBannerVisible(true);
    } catch (error) {
      console.error('Google sign-in failed:', error);
      setAuthNotice('لم تكتمل عملية تسجيل الدخول عبر Google. يمكنك المحاولة مرة أخرى.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    soundFX.playClick();
    if (cloudSyncTimerRef.current && authUser && authUser.emailVerified) {
      window.clearTimeout(cloudSyncTimerRef.current);
      await syncSnapshotToCloudNow(authUser, progressRef.current).catch(() => {});
    }
    try {
      await signOut(auth);
      setProgress(DEFAULT_PROGRESS);
      setWelcomeBannerVisible(false);
      setAuthNotice(null);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const handleResendVerification = async () => {
    if (!authUser) return;
    try {
      await sendEmailVerification(authUser);
      setAuthNotice('تم إرسال رابط التفعيل إلى بريدك الإلكتروني. تفقّد البريد الوارد أو الرسائل غير المرغوب فيها.');
    } catch {
      setAuthNotice('تم إرسال رابط التفعيل مؤخراً؛ يرجى التحقق من بريدك الإلكتروني.');
    }
  };

  const handleReloadVerification = async () => {
    if (!authUser) return;
    try {
      await authUser.reload();
      const refreshed = auth.currentUser;
      setAuthUser(refreshed);
      if (refreshed?.emailVerified) {
        setAuthNotice(null);
        await syncSnapshotToCloudNow(refreshed, progressRef.current);
        const freshList = await fetchPublicCompetitors(true);
        setCloudCompetitors(freshList);
        soundFX.playCelebration();
      } else {
        setAuthNotice('لم يتم تأكيد البريد بعد؛ افتح رابط التفعيل في بريدك ثم اضغط تحديث الحالة.');
      }
    } catch (err) {
      console.error('Reload verification error:', err);
    }
  };

  const triggerCelebration = (title: string, starsEarned: number) => {
    if (starsEarned >= 15) {
      soundFX.playCelebration();
    } else {
      soundFX.playStar();
    }

    setCelebration({
      id: Date.now(),
      title,
      starsEarned,
    });

    if (celebrationTimerRef.current) {
      window.clearTimeout(celebrationTimerRef.current);
    }
    celebrationTimerRef.current = window.setTimeout(() => {
      setCelebration(null);
    }, 3200);
  };

  const handleToggleMute = () => {
    const nextMuted = soundFX.toggleMuted();
    setIsMuted(nextMuted);
  };

  const scrollToStage = () => {
    setActiveSection('interactive-stage');
    const el = document.getElementById('interactive-stage');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleLaunchActivity = (engine: ActivityEngineId, targetItemId?: string) => {
    soundFX.playClick();
    setActiveEngine(engine);
    setFocusTargetId(targetItemId);
    scrollToStage();
  };

  // GATED: Progress & Stars only saved after sign-in
  const handleCompleteItem = (
    itemId: string,
    starsEarned: number,
    celebrationTitle = 'إنجاز رائع يا بطل!'
  ) => {
    if (!authUser) {
      soundFX.playNudge();
      openEmailAuth(
        'سجّل دخولك بالبريد الإلكتروني أولاً لتُحتسب نجومك ويُحفظ تقدمك في لوحة الشرف!'
      );
      return;
    }

    const prev = progressRef.current;
    if (prev.completedIds.includes(itemId)) {
      soundFX.playSuccess();
      return;
    }

    const next: SavedProgress = {
      ...prev,
      stars: clampStars(prev.stars + starsEarned),
      completedIds: sanitizeCompletedIds([...prev.completedIds, itemId]),
    };
    setProgress(next);
    triggerCelebration(celebrationTitle, starsEarned);
    scheduleCloudSync(authUser, next);
  };

  const todayKey = getTodayDateKey();

  // GATED: Daily challenge reward only saved after sign-in
  const handleCompleteDailyChallenge = (starsDoubled: number, title: string) => {
    if (!authUser) {
      soundFX.playNudge();
      openEmailAuth(
        'سجّل دخولك بالبريد الإلكتروني لتُحتسب مضاعفة النجوم (×2) ويظهر إنجازك مع أصدقائك!'
      );
      return;
    }

    const prev = progressRef.current;
    if (prev.dailyChallengeCompletedDate === todayKey) {
      triggerCelebration(title, starsDoubled);
      return;
    }

    const next: SavedProgress = {
      ...prev,
      stars: clampStars(prev.stars + starsDoubled),
      completedIds: sanitizeCompletedIds(
        prev.completedIds.includes(`daily-${todayKey}`)
          ? prev.completedIds
          : [...prev.completedIds, `daily-${todayKey}`]
      ),
      dailyChallengeCompletedDate: todayKey,
    };
    setProgress(next);
    triggerCelebration(title, starsDoubled);
    scheduleCloudSync(authUser, next);
  };

  // GATED: Adhkar progress only saved after sign-in
  const handleIncrementDhikr = (dhikrId: string, target: number) => {
    if (!authUser) {
      soundFX.playNudge();
      openEmailAuth('سجّل دخولك بالبريد الإلكتروني لحفظ عداد الأذكار وكسب النجوم!');
      return;
    }

    const prev = progressRef.current;
    const current = prev.adhkarProgress[dhikrId] || 0;
    if (current >= target) return;
    const nextCount = current + 1;
    const reachedTarget = nextCount === target;
    const alreadyRewarded = prev.completedIds.includes(dhikrId);

    const next: SavedProgress = {
      ...prev,
      adhkarProgress: sanitizeAdhkarProgress({
        ...prev.adhkarProgress,
        [dhikrId]: nextCount,
      }),
      stars: reachedTarget && !alreadyRewarded ? clampStars(prev.stars + 10) : prev.stars,
      completedIds:
        reachedTarget && !alreadyRewarded
          ? sanitizeCompletedIds([...prev.completedIds, dhikrId])
          : prev.completedIds,
    };
    setProgress(next);

    if (reachedTarget && !alreadyRewarded) {
      triggerCelebration('بارك الله فيك! أتممت الذكر اليومي', 10);
      scheduleCloudSync(authUser, next);
    } else {
      soundFX.playClick();
    }
  };

  const handleCommitChildName = (cleanedName: string) => {
    if (!authUser) {
      openEmailAuth('سجّل دخولك بالبريد الإلكتروني أولاً لتثبيت اسمك في لوحة الشرف.');
      return;
    }

    const prev = progressRef.current;
    const next: SavedProgress = {
      ...prev,
      childName: cleanedName.slice(0, 32),
    };
    setProgress(next);

    if (authUser.emailVerified) {
      void syncSnapshotToCloudNow(authUser, next).then(() => {
        void fetchPublicCompetitors(true).then(setCloudCompetitors).catch(() => {});
      });
    } else {
      setAuthNotice('تم حفظ اسمك في حسابك؛ فعّل رابط بريدك الإلكتروني ليظهر لجميع الأجهزة.');
    }
  };

  const handleAddFamilyMember = (name: string) => {
    if (!authUser) {
      openEmailAuth('سجّل دخولك أولاً لتتمكن من إضافة متنافسين جدد.');
      return;
    }
    if (!authUser.emailVerified) {
      setAuthNotice('يرجى تأكيد البريد الإلكتروني أو الدخول بحساب Google لإضافة متنافسين مشتركين.');
      return;
    }

    const compId = sanitizeId(
      `comp_${sanitizeId(authUser.uid).slice(0, 12)}_${Date.now()}`
    );
    void upsertCompetitor({
      id: compId,
      name,
      stars: 0,
      completedCount: 0,
      lastDailyChallengeDate: '',
      ownerUid: authUser.uid,
      kind: 'companion',
    })
      .then(() => fetchPublicCompetitors(true))
      .then(setCloudCompetitors)
      .catch((err) => console.error('Add cloud competitor failed:', err));
  };

  const handleSelectActiveProfile = (entryId: string) => {
    if (!authUser) return;
    const targetCloud = cloudCompetitors.find((c) => c.id === entryId);
    if (!targetCloud) return;
    const prev = progressRef.current;

    void syncSnapshotToCloudNow(authUser, prev).then(() => {
      const next: SavedProgress = {
        ...prev,
        childName: targetCloud.name,
        stars: targetCloud.stars,
        completedIds: [],
        adhkarProgress: {},
        dailyChallengeCompletedDate: targetCloud.lastDailyChallengeDate || null,
        activeCompetitorId: targetCloud.id,
      };
      setProgress(next);
      lastSyncedDigestRef.current = '';
      if (authUser.emailVerified) {
        void saveUserProgress(authUser.uid, {
          childName: next.childName,
          stars: next.stars,
          completedIds: next.completedIds,
          adhkarProgress: next.adhkarProgress,
          dailyChallengeCompletedDate: next.dailyChallengeCompletedDate || '',
          activeCompetitorId: next.activeCompetitorId || authUser.uid,
        });
      }
    });
  };

  const handleResetProgress = () => {
    soundFX.playClick();
    if (!authUser) {
      openEmailAuth('سجّل دخولك أولاً لبدء رحلتك وحفظ تقدمك.');
      return;
    }

    const prev = progressRef.current;
    const next: SavedProgress = {
      ...DEFAULT_PROGRESS,
      childName: prev.childName,
      activeCompetitorId: prev.activeCompetitorId,
    };
    setProgress(next);
    scheduleCloudSync(authUser, next);
  };

  return (
    <div
      dir="rtl"
      className="flex min-h-screen w-full max-w-full flex-col overflow-x-clip bg-[#F7F9FC] text-slate-900"
    >
      <SplashScreen
        visible={showSplash}
        isDataReady={authReady}
        onFinish={() => setShowSplash(false)}
      />

      {/* Always-Visible Sticky Top Header Bar */}
      <TopHeaderBar
        activeSection={activeSection}
        stars={progress.stars}
        isMuted={isMuted}
        isSignedIn={Boolean(authUser)}
        onToggleMute={handleToggleMute}
        onStartActivity={() => handleLaunchActivity(activeEngine)}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        onNavigate={(id) => setActiveSection(id)}
        onOpenEmailAuth={() => openEmailAuth()}
        onSignOut={handleSignOut}
      />

      <div className="w-full flex-1 md:flex">
        {/* Right-hand Sidebar (in RTL, first flex child sits on the Right) */}
        <SidebarNav
          activeSection={activeSection}
          stars={progress.stars}
          isMuted={isMuted}
          isSignedIn={Boolean(authUser)}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          onToggleMute={handleToggleMute}
          onStartActivity={() => handleLaunchActivity(activeEngine)}
          onNavigate={(id) => setActiveSection(id)}
          onOpenEmailAuth={() => openEmailAuth()}
        />

        {/* Full-Width Fluid Main Content Area */}
        <div className="flex w-full min-w-0 flex-1 flex-col">
          <main className="w-full flex-1">
            {/* Hero Section */}
            <section id="hero" className="py-8 sm:py-12 no-print">
              <div className="w-full px-5 sm:px-8 lg:px-10">
                <div className="grid grid-cols-1 items-stretch gap-7 lg:grid-cols-12">
                  <div className="lg:col-span-6 flex flex-col justify-center space-y-4">
                    <div className="flex items-center gap-3.5">
                      <PlatformLogo size={58} />
                      <div>
                        <p className="font-display text-base font-bold text-emerald-900">
                          منصة رسائل إماراتية للأطفال
                        </p>
                        <p className="text-xs font-semibold text-amber-700">
                          إصدار السلاسل والأنشطة التفاعلية · 2026
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border-2 border-emerald-200 bg-white px-5 py-4 shadow-sm shadow-emerald-900/5">
                      <h1 className="font-sans text-base font-normal leading-[1.9] text-slate-800 sm:text-[1.05rem]">
                        <span className="font-medium text-emerald-800">مغامرات تفاعلية ممتعة</span> من سلاسل قناة{' '}
                        <span className="font-medium text-amber-800">رسائل إماراتية للأطفال</span>، تجمع بين القصص التربوية والألعاب التعليمية المبسطة لتغرس الآداب النبوية وحب المعرفة في نفوس الصغار بأسلوب هادئ ومشوّق.
                      </h1>
                    </div>

                    {/* Prominent Email Sign-In Callout Card */}
                    {!authUser ? (
                      <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-l from-amber-50 via-white to-emerald-50/70 p-4 shadow-sm space-y-3">
                        <div className="flex items-start gap-2.5">
                          <Sparkles
                            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
                            aria-hidden="true"
                          />
                          <p className="text-sm font-semibold leading-relaxed text-emerald-950">
                            سجّل الآن لحفظ نجومك وإنجازاتك، وتخليد اسمك في لوحة الشرف والمنافسة مع أصدقائك!
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              soundFX.playClick();
                              openEmailAuth(
                                'ابدأ بجمع النجوم واحفظ تقدمك واسمك في لوحة الشرف عبر تسجيل الدخول بالبريد الإلكتروني!'
                              );
                            }}
                            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border-b-4 border-amber-800 bg-amber-600 px-4 py-2 text-xs sm:text-sm font-bold text-white transition-all hover:bg-amber-700 active:scale-[0.98] whitespace-nowrap cursor-pointer"
                          >
                            <Mail className="h-4 w-4" aria-hidden="true" />
                            <span>تسجيل الدخول بالبريد الإلكتروني</span>
                          </button>

                          <button
                            type="button"
                            disabled={isAuthLoading}
                            onClick={() => {
                              soundFX.playClick();
                              void handleSignInWithGoogle();
                            }}
                            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60 whitespace-nowrap cursor-pointer"
                          >
                            <LogIn className="h-3.5 w-3.5 text-sky-700" aria-hidden="true" />
                            <span>
                              {isAuthLoading ? 'جاري الدخول...' : 'أو بحساب Google'}
                            </span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <WelcomeMemberBanner
                        visible={welcomeBannerVisible || !authUser.emailVerified}
                        memberName={
                          welcomeMemberName ||
                          progress.childName ||
                          authUser.displayName ||
                          'بطلنا الجديد'
                        }
                        isEmailVerified={Boolean(authUser.emailVerified)}
                        onDismiss={() => setWelcomeBannerVisible(false)}
                        onReloadVerification={() => void handleReloadVerification()}
                        onResendVerification={() => void handleResendVerification()}
                      />
                    )}

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => handleLaunchActivity('etiquette')}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border-b-4 border-emerald-900 bg-emerald-700 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-800 active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        ابدأ المغامرة التفاعلية
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                      </button>

                      <button
                        type="button"
                        onClick={handleToggleMute}
                        aria-pressed={isMuted}
                        className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          isMuted
                            ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                            : 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100/80'
                        }`}
                      >
                        {isMuted ? (
                          <>
                            <VolumeX className="h-4 w-4 text-slate-500" aria-hidden="true" />
                            <span>الصوت: مكتوم</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-4 w-4 text-amber-600" aria-hidden="true" />
                            <span>المؤثرات الصوتية: مفعّلة</span>
                          </>
                        )}
                      </button>

                      <a
                        href="#leaderboard"
                        onClick={() => setActiveSection('leaderboard')}
                        className="inline-flex min-h-[42px] items-center gap-1.5 px-2 py-2 text-sm font-semibold text-amber-800 underline-offset-4 hover:text-amber-950 hover:underline whitespace-nowrap shrink-0"
                      >
                        لوحة الشرف
                      </a>
                    </div>
                  </div>

                  <div className="lg:col-span-6">
                    <div className="h-full overflow-hidden rounded-2xl border-2 border-amber-200/80 bg-white">
                      <ResilientImage
                        src={HERO_IMAGE}
                        alt="فناء تعليمي إماراتي مشمس يجمع الكتب المفتوحة والفانوس التراثي"
                        aspectClassName="aspect-[16/9]"
                        className="h-full w-full object-cover min-h-[240px] lg:min-h-[310px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Full-Width 4-Column Platform Highlights Strip Below Hero Split */}
                <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-200 pt-6 lg:grid-cols-4">
                  <div>
                    <p className="font-mono text-xl font-bold text-emerald-800 tabular-nums">2026</p>
                    <p className="mt-1 text-xs sm:text-sm font-medium text-slate-600">
                      جميع سلاسل وبرامج العام محدثة
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-xl font-bold text-sky-800 tabular-nums">40+</p>
                    <p className="mt-1 text-xs sm:text-sm font-medium text-slate-600">
                      موقفاً ومحطة وخطوة تفاعلية
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-xl font-bold text-amber-600 tabular-nums">5</p>
                    <p className="mt-1 text-xs sm:text-sm font-medium text-slate-600">
                      ألعاب ومحاكيات تربوية بمؤثرات صوتية
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-xl font-bold text-emerald-700 tabular-nums">100%</p>
                    <p className="mt-1 text-xs sm:text-sm font-medium text-slate-600">
                      تصفح محفوظ بدون إنترنت وبيئة آمنة
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Daily Challenge Section (Random Activity + 2x Stars Today + Friends Challenge) */}
            <DailyChallengeSection
              todayKey={todayKey}
              childName={progress.childName}
              currentStars={progress.stars}
              completedDate={progress.dailyChallengeCompletedDate}
              friends={visiblePeers}
              onCompleteDailyChallenge={handleCompleteDailyChallenge}
              onExploreSeries={(seriesId) => handleLaunchActivity(seriesId)}
            />

            {/* Series Showcase Grid */}
            <section
              id="series"
              aria-labelledby="series-title"
              className="border-t border-slate-200 bg-white py-10 sm:py-12 no-print"
            >
              <div className="w-full px-5 sm:px-8 lg:px-10">
                <div className="mb-8 max-w-2xl space-y-1.5">
                  <p className="text-xs font-semibold text-amber-700">
                    سلاسل موسم 2026 · محتوى قناة التلجرام والموقع الرسمي
                  </p>
                  <h2
                    id="series-title"
                    className="font-display text-lg font-bold text-emerald-950 sm:text-xl leading-snug"
                  >
                    اختر <span className="text-emerald-700">السلسلة</span> وابدأ{' '}
                    <span className="text-amber-700">المغامرة</span>
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    كل سلسلة تقدم تجربة تفاعلية ممتعة مصممة بروح القصص التربوية لتناسب الأطفال.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  {SERIES_LIST.map((series) => (
                    <article
                      key={series.id}
                      className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-150 hover:-translate-y-0.5 hover:border-emerald-300"
                    >
                      <div>
                        <div className="aspect-[4/3] overflow-hidden border-b border-slate-100 bg-slate-50">
                          <ResilientImage
                            src={series.image}
                            alt={series.imageAlt}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="p-4 sm:p-5">
                          <div className="mb-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                            <span className="font-semibold text-emerald-800">{series.seasonTag}</span>
                            <span aria-hidden="true">·</span>
                            <span>{series.ageRange}</span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">{series.activitiesCount} أنشطة</span>
                          </div>
                          <h3 className="font-display text-base font-bold text-emerald-950 mb-1.5 leading-snug">
                            {series.title}
                          </h3>
                          <p className="text-sm leading-relaxed text-slate-600">
                            {series.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                        <button
                          type="button"
                          onClick={() => handleLaunchActivity(series.id)}
                          className="inline-flex min-h-[40px] w-full items-center justify-between rounded-xl border border-slate-200 border-b-2 bg-slate-50 px-3.5 py-2 text-xs sm:text-sm font-semibold text-emerald-900 transition-colors hover:border-emerald-800 hover:bg-emerald-700 hover:text-white cursor-pointer"
                        >
                          <span>ابدأ أنشطة السلسلة</span>
                          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            {/* Main Two-Zone Interactive Activity Stage */}
            <div className="no-print">
              <InteractiveStage
                activeEngine={activeEngine}
                onSelectEngine={(eng) => {
                  setActiveEngine(eng);
                  setFocusTargetId(undefined);
                }}
                focusTargetId={focusTargetId}
                educatorMode={educatorMode}
                onToggleEducatorMode={() => setEducatorMode((m) => !m)}
                isMuted={isMuted}
                onToggleMute={handleToggleMute}
                stars={progress.stars}
                completedIds={progress.completedIds}
                adhkarProgress={progress.adhkarProgress}
                onCompleteItem={handleCompleteItem}
                onIncrementDhikr={handleIncrementDhikr}
              />
            </div>

            {/* Honor Roll Leaderboard Section */}
            <LeaderboardSection
              childName={progress.childName}
              onChangeChildName={(name) => {
                if (!authUser) return;
                setProgress((prev) => ({ ...prev, childName: name }));
              }}
              onCommitChildName={handleCommitChildName}
              currentStars={progress.stars}
              currentCompletedCount={progress.completedIds.length}
              familyPeers={visiblePeers}
              onAddFamilyMember={handleAddFamilyMember}
              onSelectActiveProfile={handleSelectActiveProfile}
              isSignedIn={Boolean(authUser)}
              isEmailVerified={Boolean(authUser?.emailVerified)}
              isAuthLoading={isAuthLoading}
              authDisplayLabel={authUser?.displayName || authUser?.email || 'حسابك'}
              authNotice={authNotice}
              onOpenEmailAuth={openEmailAuth}
              onSignInWithGoogle={handleSignInWithGoogle}
              onSignOut={handleSignOut}
              onRefreshLeaderboard={() => void handleRefreshLeaderboard()}
              isRefreshing={isRefreshing}
              refreshCooldownSeconds={refreshCooldown}
            />

            {/* Channel Posts Feed Explorer */}
            <div className="no-print">
              <ChannelFeedSection
                educatorMode={educatorMode}
                onLaunchPostActivity={handleLaunchActivity}
              />
            </div>

            {/* Achievements & Printable Certificate */}
            <AchievementsSection
              childName={progress.childName}
              onChangeChildName={(name) => {
                if (!authUser) return;
                setProgress((prev) => ({ ...prev, childName: name }));
              }}
              stars={progress.stars}
              completedIds={progress.completedIds}
              adhkarProgress={progress.adhkarProgress}
              onResetProgress={handleResetProgress}
              isSignedIn={Boolean(authUser)}
              onOpenEmailAuth={openEmailAuth}
            />
          </main>

          <StarCelebrationBanner event={celebration} />
          <OfflineIndicator />
          <DailyHintPopup
            readyToShow={!showSplash}
            onLaunchSeries={(seriesId) => handleLaunchActivity(seriesId)}
          />

          <EmailAuthModal
            open={emailAuthOpen}
            onClose={() => setEmailAuthOpen(false)}
            onGoogleSignIn={handleSignInWithGoogle}
            onRegistrationComplete={(memberName) => {
              setWelcomeMemberName(memberName);
              setWelcomeBannerVisible(true);
            }}
            isGoogleLoading={isAuthLoading}
            promptReason={authPromptReason}
          />

          <footer className="border-t border-slate-200 bg-slate-50 py-6 no-print">
            <div className="flex w-full flex-col items-start justify-between gap-4 px-5 sm:flex-row sm:items-center sm:px-8 lg:px-10">
              <div className="flex items-center gap-3">
                <PlatformLogo size={46} />
                <div className="space-y-0.5">
                  <p className="font-display text-sm font-bold text-emerald-950">
                    منصة رسائل إماراتية للأطفال
                  </p>
                  <p className="text-xs text-slate-500">
                    تطبيق تفاعلي تعليمي مستلهم من السلاسل والأنشطة المنشورة في قناة رسائل إماراتية للأطفال — موسم 2026.
                  </p>
                </div>
              </div>

              <a
                href="https://t.me/rasael_emaratia_children"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[38px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-emerald-600 hover:text-emerald-800 whitespace-nowrap shrink-0"
              >
                <span>زيارة القناة الرسمية على تيليجرام</span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
