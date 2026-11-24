import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ExternalLink, Volume2, VolumeX } from 'lucide-react';
import {
  onAuthStateChanged,
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
import { soundFX } from './utils/soundEffects';
import { auth, googleProvider } from './firebase/config';
import {
  fetchUserProgress,
  saveUserProgress,
  subscribePublicCompetitors,
  upsertCompetitor,
  type CloudCompetitor,
} from './firebase/leaderboardService';
import { sanitizeId } from './firebase/validation';

interface SavedProgress {
  childName: string;
  stars: number;
  completedIds: string[];
  adhkarProgress: Record<string, number>;
  familyPeers: LeaderboardEntry[];
  dailyChallengeCompletedDate: string | null;
  activeCompetitorId: string | null;
}

const STORAGE_KEY = 'rasael_children_platform_v2';

const DEFAULT_PROGRESS: SavedProgress = {
  childName: '',
  stars: 0,
  completedIds: [],
  adhkarProgress: {},
  familyPeers: [],
  dailyChallengeCompletedDate: null,
  activeCompetitorId: null,
};

const LEGACY_SEED_IDS = new Set(['peer-1', 'peer-2', 'peer-3', 'peer-4']);

export default function App() {
  const [progress, setProgress] = useState<SavedProgress>(() => {
    try {
      const raw =
        localStorage.getItem(STORAGE_KEY) ||
        localStorage.getItem('rasael_children_platform_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_PROGRESS,
          ...parsed,
          familyPeers: Array.isArray(parsed.familyPeers)
            ? parsed.familyPeers.filter(
                (peer: LeaderboardEntry) =>
                  !LEGACY_SEED_IDS.has(peer.id) && !peer.isPeer
              )
            : [],
        };
      }
    } catch {
      // Ignore storage read failures
    }
    return DEFAULT_PROGRESS;
  });

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [cloudCompetitors, setCloudCompetitors] = useState<CloudCompetitor[]>([]);

  const [activeEngine, setActiveEngine] = useState<ActivityEngineId>('etiquette');
  const [focusTargetId, setFocusTargetId] = useState<string | undefined>(undefined);
  const [educatorMode, setEducatorMode] = useState(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => soundFX.isMuted());
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [celebration, setCelebration] = useState<CelebrationEvent | null>(null);
  const celebrationTimerRef = useRef<number | null>(null);
  const progressRef = useRef<SavedProgress>(progress);
  progressRef.current = progress;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Ignore storage write failures
    }
  }, [progress]);

  useEffect(() => {
    return () => {
      if (celebrationTimerRef.current) {
        window.clearTimeout(celebrationTimerRef.current);
      }
    };
  }, []);

  const syncSnapshotToCloud = async (user: User, snapshot: SavedProgress) => {
    const activeId = sanitizeId(snapshot.activeCompetitorId || user.uid);
    const kind = activeId === sanitizeId(user.uid) ? 'primary' : 'companion';
    const fallbackName = user.displayName?.trim() || 'البطل الصغير';
    const resolvedName = snapshot.childName.trim() || fallbackName;

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
  };

  // Auth listener + initial cloud hydration
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      setAuthReady(true);

      if (!user) return;

      try {
        const currentLocal = progressRef.current;
        const cloudProgress = await fetchUserProgress(user.uid);
        const safeUid = sanitizeId(user.uid);

        // Migrate any locally added family/class competitors to cloud
        const localCompanions = currentLocal.familyPeers.filter(
          (p) => !p.isPeer && !p.isCloud
        );
        for (let i = 0; i < localCompanions.length; i++) {
          const companion = localCompanions[i];
          const compId = sanitizeId(`comp_${safeUid.slice(0, 12)}_${Date.now()}_${i}`);
          await upsertCompetitor({
            id: compId,
            name: companion.name,
            stars: companion.stars,
            completedCount: companion.completedCount,
            lastDailyChallengeDate: companion.lastDailyChallengeDate || '',
            ownerUid: user.uid,
            kind: 'companion',
          });
        }

        let merged: SavedProgress;
        if (cloudProgress) {
          const unionIds = Array.from(
            new Set([...cloudProgress.completedIds, ...currentLocal.completedIds])
          );
          const mergedAdhkar: Record<string, number> = {
            ...cloudProgress.adhkarProgress,
          };
          for (const [k, v] of Object.entries(currentLocal.adhkarProgress)) {
            mergedAdhkar[k] = Math.max(mergedAdhkar[k] || 0, v);
          }
          const resolvedName =
            currentLocal.childName.trim() ||
            cloudProgress.childName.trim() ||
            user.displayName?.trim() ||
            '';
          merged = {
            ...currentLocal,
            childName: resolvedName,
            stars: Math.max(currentLocal.stars, cloudProgress.stars),
            completedIds: unionIds,
            adhkarProgress: mergedAdhkar,
            dailyChallengeCompletedDate:
              currentLocal.dailyChallengeCompletedDate ||
              cloudProgress.dailyChallengeCompletedDate ||
              null,
            activeCompetitorId: cloudProgress.activeCompetitorId || safeUid,
            familyPeers: currentLocal.familyPeers.filter((p) => p.isPeer),
          };
        } else {
          merged = {
            ...currentLocal,
            childName:
              currentLocal.childName.trim() || user.displayName?.trim() || '',
            activeCompetitorId: currentLocal.activeCompetitorId || safeUid,
            familyPeers: currentLocal.familyPeers.filter((p) => p.isPeer),
          };
        }

        setProgress(merged);
        await syncSnapshotToCloud(user, merged);
        setAuthNotice(null);
      } catch (err) {
        console.error('Cloud hydration failed:', err);
        setAuthNotice('تعذر إكمال المزامنة السحابية الآن، سيتم حفظ تقدمك محلياً.');
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time public leaderboard subscription across all devices
  useEffect(() => {
    if (!authReady) return;
    const unsubscribe = subscribePublicCompetitors(
      (list) => {
        setCloudCompetitors(list);
      },
      (err) => {
        console.error('Public leaderboard listener error:', err);
      }
    );
    return () => unsubscribe();
  }, [authReady]);

  const visiblePeers: LeaderboardEntry[] = useMemo(() => {
    const activeCloudId = authUser
      ? sanitizeId(progress.activeCompetitorId || authUser.uid)
      : null;

    const mappedCloud: LeaderboardEntry[] = cloudCompetitors
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

    const seenIds = new Set(mappedCloud.map((c) => c.id));
    const localExtra = progress.familyPeers.filter((p) => !seenIds.has(p.id));

    return [...mappedCloud, ...localExtra];
  }, [authUser, cloudCompetitors, progress.activeCompetitorId, progress.familyPeers]);

  const handleSignInWithGoogle = async () => {
    setIsAuthLoading(true);
    setAuthNotice(null);
    try {
      await signInWithPopup(auth, googleProvider);
      soundFX.playCelebration();
    } catch (error) {
      console.error('Google sign-in failed:', error);
      setAuthNotice('لم تكتمل عملية تسجيل الدخول عبر Google. يمكنك المحاولة مرة أخرى.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    soundFX.playClick();
    try {
      await signOut(auth);
      setAuthNotice(null);
    } catch (error) {
      console.error('Sign out failed:', error);
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

  const handleCompleteItem = (
    itemId: string,
    starsEarned: number,
    celebrationTitle = 'إنجاز رائع يا بطل!'
  ) => {
    const prev = progressRef.current;
    if (prev.completedIds.includes(itemId)) {
      soundFX.playSuccess();
      return;
    }

    const next: SavedProgress = {
      ...prev,
      stars: prev.stars + starsEarned,
      completedIds: [...prev.completedIds, itemId],
    };
    setProgress(next);
    triggerCelebration(celebrationTitle, starsEarned);

    if (authUser) {
      void syncSnapshotToCloud(authUser, next).catch((err) =>
        console.error('Sync after activity failed:', err)
      );
    }
  };

  const todayKey = getTodayDateKey();

  const handleCompleteDailyChallenge = (starsDoubled: number, title: string) => {
    const prev = progressRef.current;
    if (prev.dailyChallengeCompletedDate === todayKey) {
      triggerCelebration(title, starsDoubled);
      return;
    }

    const next: SavedProgress = {
      ...prev,
      stars: prev.stars + starsDoubled,
      completedIds: prev.completedIds.includes(`daily-${todayKey}`)
        ? prev.completedIds
        : [...prev.completedIds, `daily-${todayKey}`],
      dailyChallengeCompletedDate: todayKey,
    };
    setProgress(next);
    triggerCelebration(title, starsDoubled);

    if (authUser) {
      void syncSnapshotToCloud(authUser, next).catch((err) =>
        console.error('Sync after daily challenge failed:', err)
      );
    }
  };

  const handleIncrementDhikr = (dhikrId: string, target: number) => {
    const prev = progressRef.current;
    const current = prev.adhkarProgress[dhikrId] || 0;
    if (current >= target) return;
    const nextCount = current + 1;
    const reachedTarget = nextCount === target;
    const alreadyRewarded = prev.completedIds.includes(dhikrId);

    const next: SavedProgress = {
      ...prev,
      adhkarProgress: {
        ...prev.adhkarProgress,
        [dhikrId]: nextCount,
      },
      stars: reachedTarget && !alreadyRewarded ? prev.stars + 10 : prev.stars,
      completedIds:
        reachedTarget && !alreadyRewarded
          ? [...prev.completedIds, dhikrId]
          : prev.completedIds,
    };
    setProgress(next);

    if (reachedTarget && !alreadyRewarded) {
      triggerCelebration('بارك الله فيك! أتممت الذكر اليومي', 10);
      if (authUser) {
        void syncSnapshotToCloud(authUser, next).catch((err) =>
          console.error('Sync after dhikr failed:', err)
        );
      }
    } else {
      soundFX.playClick();
    }
  };

  const handleCommitChildName = (cleanedName: string) => {
    const prev = progressRef.current;
    const next: SavedProgress = {
      ...prev,
      childName: cleanedName,
    };
    setProgress(next);

    if (authUser) {
      void syncSnapshotToCloud(authUser, next).catch((err) =>
        console.error('Sync after name save failed:', err)
      );
    } else {
      setAuthNotice('تم حفظ اسمك محلياً؛ سجّل الدخول بحساب Google ليظهر اسمك على جميع الأجهزة.');
    }
  };

  const handleAddFamilyMember = (name: string) => {
    if (authUser) {
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
      }).catch((err) => console.error('Add cloud competitor failed:', err));
      return;
    }

    setProgress((prev) => ({
      ...prev,
      familyPeers: [
        ...prev.familyPeers,
        {
          id: `family-${Date.now()}`,
          name,
          stars: 0,
          completedCount: 0,
          isPeer: false,
        },
      ],
    }));
    setAuthNotice('تمت إضافة المتنافس محلياً؛ سجّل الدخول بحساب Google ليظهر للجميع عبر الأجهزة.');
  };

  const handleSelectActiveProfile = (entryId: string) => {
    if (authUser) {
      const targetCloud = cloudCompetitors.find((c) => c.id === entryId);
      if (!targetCloud) return;
      const prev = progressRef.current;
      void syncSnapshotToCloud(authUser, prev).then(() => {
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
        void saveUserProgress(authUser.uid, {
          childName: next.childName,
          stars: next.stars,
          completedIds: next.completedIds,
          adhkarProgress: next.adhkarProgress,
          dailyChallengeCompletedDate: next.dailyChallengeCompletedDate || '',
          activeCompetitorId: next.activeCompetitorId || authUser.uid,
        });
      });
      return;
    }

    setProgress((prev) => {
      const target = prev.familyPeers.find((p) => p.id === entryId);
      if (!target) return prev;
      const currentEntry: LeaderboardEntry = {
        id: `family-${Date.now()}`,
        name: prev.childName.trim() || 'البطل الصغير',
        stars: prev.stars,
        completedCount: prev.completedIds.length,
        isPeer: false,
        lastDailyChallengeDate: prev.dailyChallengeCompletedDate,
      };
      return {
        ...prev,
        childName: target.name,
        stars: target.stars,
        completedIds: [],
        adhkarProgress: {},
        dailyChallengeCompletedDate: target.lastDailyChallengeDate || null,
        familyPeers: [
          ...prev.familyPeers.filter((p) => p.id !== entryId),
          currentEntry,
        ],
      };
    });
  };

  const handleResetProgress = () => {
    soundFX.playClick();
    const prev = progressRef.current;
    const next: SavedProgress = {
      ...DEFAULT_PROGRESS,
      childName: prev.childName,
      familyPeers: prev.familyPeers,
      activeCompetitorId: prev.activeCompetitorId,
    };
    setProgress(next);

    if (authUser) {
      void syncSnapshotToCloud(authUser, next).catch((err) =>
        console.error('Sync after reset failed:', err)
      );
    }
  };

  return (
    <div
      dir="rtl"
      className="flex min-h-screen w-full max-w-full flex-col overflow-x-clip bg-[#F7F9FC] text-slate-900"
    >
      {/* Always-Visible Sticky Top Header Bar */}
      <TopHeaderBar
        activeSection={activeSection}
        stars={progress.stars}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onStartActivity={() => handleLaunchActivity(activeEngine)}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        onNavigate={(id) => setActiveSection(id)}
      />

      <div className="w-full flex-1 md:flex">
        {/* Right-hand Sidebar (in RTL, first flex child sits on the Right) */}
        <SidebarNav
          activeSection={activeSection}
          stars={progress.stars}
          isMuted={isMuted}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          onToggleMute={handleToggleMute}
          onStartActivity={() => handleLaunchActivity(activeEngine)}
          onNavigate={(id) => setActiveSection(id)}
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

                  <p className="text-sm leading-[1.85] text-slate-600">
                    استكشف جميع سلاسل وأنشطة عام 2026 في الآداب النبوية، السيرة ومعجزات الرسول ﷺ، الوضوء والطهارة، الأذكار اليومية، ومسابقات البرنامج الصيفي والرمضاني بخطوات تفاعلية مباشرة.
                  </p>

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
                    بيئة طفولة آمنة خالية من الإعلانات
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
            onChangeChildName={(name) =>
              setProgress((prev) => ({ ...prev, childName: name }))
            }
            onCommitChildName={handleCommitChildName}
            currentStars={progress.stars}
            currentCompletedCount={progress.completedIds.length}
            familyPeers={visiblePeers}
            onAddFamilyMember={handleAddFamilyMember}
            onSelectActiveProfile={handleSelectActiveProfile}
            isSignedIn={Boolean(authUser)}
            isAuthLoading={isAuthLoading}
            authDisplayLabel={authUser?.displayName || authUser?.email || 'حسابك'}
            authNotice={authNotice}
            onSignInWithGoogle={handleSignInWithGoogle}
            onSignOut={handleSignOut}
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
            onChangeChildName={(name) =>
              setProgress((prev) => ({ ...prev, childName: name }))
            }
            stars={progress.stars}
            completedIds={progress.completedIds}
            adhkarProgress={progress.adhkarProgress}
            onResetProgress={handleResetProgress}
          />
        </main>

        <StarCelebrationBanner event={celebration} />

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
