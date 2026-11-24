import { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Flame,
  Shuffle,
  Star,
  Users,
  Clock,
  Share2,
  Check,
} from 'lucide-react';
import {
  ETIQUETTE_SCENARIOS,
  SEASONAL_CHALLENGES,
  SEERAH_MILESTONES,
  type ActivityEngineId,
} from '../data/channelContent';
import type { LeaderboardEntry } from './LeaderboardSection';
import { soundFX } from '../utils/soundEffects';

export interface DailyChallengeItem {
  id: string;
  seriesId: ActivityEngineId;
  seriesTitle: string;
  title: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  baseStars: number;
}

const DAILY_POOL: DailyChallengeItem[] = [
  ...ETIQUETTE_SCENARIOS.map((item) => ({
    id: `daily-${item.id}`,
    seriesId: 'etiquette' as ActivityEngineId,
    seriesTitle: 'سلسلة آداب الطفل المسلم',
    title: item.title,
    prompt: item.situation,
    options: item.choices.map((c) => c.text),
    correctIndex: item.choices.findIndex((c) => c.isCorrect),
    explanation:
      item.choices.find((c) => c.isCorrect)?.feedbackDetail || item.wisdomQuote,
    baseStars: 10,
  })),
  ...SEERAH_MILESTONES.map((item) => ({
    id: `daily-${item.id}`,
    seriesId: 'seerah' as ActivityEngineId,
    seriesTitle: 'السيرة ومعجزات الرسول ﷺ',
    title: item.title,
    prompt: item.question,
    options: item.options,
    correctIndex: item.correctIndex,
    explanation: item.explanation,
    baseStars: 15,
  })),
  ...SEASONAL_CHALLENGES.map((item) => ({
    id: `daily-${item.id}`,
    seriesId: 'seasonal' as ActivityEngineId,
    seriesTitle: item.programName,
    title: item.category,
    prompt: item.question,
    options: item.options,
    correctIndex: item.correctIndex,
    explanation: item.explanation,
    baseStars: 15,
  })),
  {
    id: 'daily-wudu-order',
    seriesId: 'faith',
    seriesTitle: 'علمي طفلك · الطهارة والصلاة',
    title: 'ترتيب الوضوء الصحيح',
    prompt: 'بعد المضمضة والاستنشاق في الوضوء، ما الخطوة التالية التي نغسلها ثلاث مرات؟',
    options: [
      'غسل الوجه من منبت الشعر إلى الذقن',
      'غسل الرجلين إلى الكعبين',
      'مسح الرأس والأذنين',
    ],
    correctIndex: 0,
    explanation: 'في الوضوء نغسل الوجه ثلاث مرات بعد المضمضة والاستنشاق ثم اليدين إلى المرفقين.',
    baseStars: 15,
  },
  {
    id: 'daily-values-honesty',
    seriesId: 'values',
    seriesTitle: 'نور في دربي · الأذكار والقيم',
    title: 'قيمة الصدق والأمانة',
    prompt: 'إذا وجدت أداةً مفقودةً لزميلك في الصف، فما التصرف الذي يثقل كفة الحسنات في ميزانك؟',
    options: [
      'أعيدها لصاحبها أو أسلمها للمعلم بأمانة',
      'أحتفظ بها حتى يسأل عنها أحد',
      'أتركها تحت المقعد',
    ],
    correctIndex: 0,
    explanation: 'رد الأمانات لأصحابها من أجمل صفات النبي الصادق الأمين ﷺ.',
    baseStars: 10,
  },
];

export function getTodayDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDailySeedIndex(dateKey: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0;
  }
  return hash % length;
}

interface DailyChallengeSectionProps {
  todayKey: string;
  childName: string;
  currentStars: number;
  completedDate: string | null;
  friends: LeaderboardEntry[];
  onCompleteDailyChallenge: (starsDoubled: number, title: string) => void;
  onExploreSeries: (seriesId: ActivityEngineId) => void;
}

export function DailyChallengeSection({
  todayKey,
  childName,
  currentStars,
  completedDate,
  friends,
  onCompleteDailyChallenge,
  onExploreSeries,
}: DailyChallengeSectionProps) {
  const initialIndex = getDailySeedIndex(todayKey, DAILY_POOL.length);
  const [challengeIndex, setChallengeIndex] = useState<number>(initialIndex);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const challenge = DAILY_POOL[challengeIndex];
  const doubledStars = challenge.baseStars * 2;
  const completedToday = completedDate === todayKey;
  const isAnswered = selectedOption !== null;
  const isCorrect = selectedOption === challenge.correctIndex;

  const displayName = childName.trim() || 'البطل الصغير (أنت)';

  const friendChallengeStatuses = [
    {
      id: 'current-user-daily',
      name: displayName,
      stars: currentStars,
      doneToday: completedToday,
      isCurrentUser: true,
    },
    ...friends.map((friend) => ({
      id: friend.id,
      name: friend.name,
      stars: friend.stars,
      doneToday: friend.lastDailyChallengeDate === todayKey,
      isCurrentUser: false,
    })),
  ];

  const completedFriendsCount = friendChallengeStatuses.filter(
    (f) => f.doneToday
  ).length;
  const totalFriendsCount = friendChallengeStatuses.length;
  const teamProgressPct = Math.round(
    (completedFriendsCount / Math.max(1, totalFriendsCount)) * 100
  );

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    if (idx === challenge.correctIndex) {
      if (!completedToday) {
        onCompleteDailyChallenge(
          doubledStars,
          `أنجزت تحدي اليوم وحصلت على ${doubledStars} نجمة مضاعفة!`
        );
      } else {
        soundFX.playSuccess();
      }
    } else {
      soundFX.playNudge();
    }
  };

  const handlePickRandomAnother = () => {
    soundFX.playClick();
    setSelectedOption(null);
    setChallengeIndex((prev) => {
      if (DAILY_POOL.length <= 1) return 0;
      let next = Math.floor(Math.random() * DAILY_POOL.length);
      if (next === prev) {
        next = (prev + 1) % DAILY_POOL.length;
      }
      return next;
    });
  };

  const handleShareChallenge = async () => {
    soundFX.playClick();
    const message = `تحدي اليوم في منصة رسائل إماراتية للأطفال (${challenge.title}) يمنح ${doubledStars} نجمة مضاعفة! هل تستطيع حلّه معي؟`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(message);
      }
    } catch {
      // Clipboard fallback ignored cleanly
    }
    setCopiedInvite(true);
    window.setTimeout(() => setCopiedInvite(false), 2500);
  };

  return (
    <section
      id="daily-challenge"
      aria-labelledby="daily-challenge-title"
      className="border-t border-slate-200 bg-amber-50/35 py-10 sm:py-12 no-print"
    >
      <div className="w-full px-5 sm:px-8 lg:px-10">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1.5 max-w-2xl">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800">
              <Flame className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
              <span>تحدي اليوم · مضاعفة النجوم (×2) عند الإكمال اليوم</span>
            </p>
            <h2
              id="daily-challenge-title"
              className="font-display text-lg font-bold text-amber-950 sm:text-xl leading-snug"
            >
              <span className="text-emerald-800">تحدي اليوم</span> وتحدي الأصدقاء الجماعي
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              أجب عن التحدي المختار اليوم لتحصل على ضعف النجوم، وتابع من من أصدقائك في لوحة الشرف أكمل التحدي معك اليوم.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handlePickRandomAnother}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Shuffle className="h-4 w-4 text-amber-600" aria-hidden="true" />
              تحدٍ عشوائي آخر
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Interactive Daily Challenge Card */}
          <div className="lg:col-span-7 rounded-2xl border-2 border-amber-200 bg-white p-5 sm:p-6 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
                <div className="text-xs text-slate-500">
                  <span className="font-semibold text-emerald-800">{challenge.seriesTitle}</span>
                  <span aria-hidden="true" className="mx-2">·</span>
                  <span>{challenge.title}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 tabular-nums">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-500" aria-hidden="true" />
                  <span>
                    المكافأة اليوم: {doubledStars} نجمة (بدلاً من {challenge.baseStars})
                  </span>
                </div>
              </div>

              <h3 className="font-display text-base sm:text-lg font-bold leading-relaxed text-slate-900">
                {challenge.prompt}
              </h3>

              <div className="space-y-2.5">
                {challenge.options.map((opt, idx) => {
                  const picked = selectedOption === idx;
                  const rightOpt = idx === challenge.correctIndex;
                  let style =
                    'border-slate-200 border-b-2 bg-slate-50/70 text-slate-800 hover:border-amber-400 hover:bg-amber-50/40';
                  if (isAnswered && rightOpt) {
                    style = 'border-emerald-600 border-b-4 bg-emerald-50 text-emerald-950 font-semibold';
                  } else if (picked && !rightOpt) {
                    style = 'border-amber-500 border-b-4 bg-amber-50 text-amber-950';
                  }

                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleSelectOption(idx)}
                      disabled={isAnswered}
                      className={`w-full min-h-[46px] rounded-xl border px-4 py-3 text-right text-sm transition-all duration-150 flex items-center justify-between gap-3 ${
                        isAnswered ? 'cursor-default' : 'cursor-pointer'
                      } ${style}`}
                    >
                      <span>{opt}</span>
                      {isAnswered && rightOpt && (
                        <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0" aria-hidden="true" />
                      )}
                      {picked && !rightOpt && (
                        <AlertCircle className="h-5 w-5 text-amber-700 shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>

              {isAnswered && (
                <div
                  aria-live="polite"
                  className={`rounded-xl border p-4 text-sm ${
                    isCorrect
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                      : 'border-amber-200 bg-amber-50 text-amber-950'
                  }`}
                >
                  <p className="font-bold mb-1">
                    {isCorrect
                      ? completedToday
                        ? '✓ إجابة صحيحة! تم احتساب مضاعفة نجوم اليوم'
                        : `✓ أحسنت! تم مضاعفة نجومك (+${doubledStars} نجمة)`
                      : '✕ إجابة غير صحيحة — جرّب سحب تحدٍ آخر أو راجع الإجابة الصحيحة أعلاه'}
                  </p>
                  <p className="leading-relaxed">{challenge.explanation}</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <span className="text-xs font-medium text-slate-500">
                تاريخ التحدي: <span className="font-mono tabular-nums">{todayKey}</span>
              </span>

              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  onExploreSeries(challenge.seriesId);
                }}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border-b-4 border-emerald-900 bg-emerald-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-800 cursor-pointer"
              >
                <span>استكشف المزيد في {challenge.seriesTitle}</span>
                <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Friends Challenge Collective Panel */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4 rounded-2xl border border-amber-200 bg-white p-5">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2 text-emerald-800">
                    <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <h4 className="font-display text-base font-bold text-emerald-950">
                      تحدي الأصدقاء اليوم
                    </h4>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    أبطال لوحة الشرف المشاركون في تحدي اليوم
                  </p>
                </div>

                <span className="font-mono text-xs font-bold text-emerald-800 tabular-nums">
                  {completedFriendsCount}/{totalFriendsCount} أنجزوه
                </span>
              </div>

              {/* Collective Team Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>روح الفريق الجماعية اليوم</span>
                  <span className="font-mono font-semibold text-emerald-800 tabular-nums">
                    {teamProgressPct}%
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                    style={{ width: `${teamProgressPct}%` }}
                  />
                </div>
              </div>

              {/* Friends Completion List */}
              <ul className="divide-y divide-slate-100" aria-label="قائمة الأصدقاء في تحدي اليوم">
                {friendChallengeStatuses.map((friend) => (
                  <li
                    key={friend.id}
                    className={`flex items-center justify-between gap-3 py-2.5 px-2 rounded-lg ${
                      friend.isCurrentUser ? 'bg-emerald-50/60' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {friend.name}{' '}
                        {friend.isCurrentUser && (
                          <span className="text-xs font-bold text-emerald-700">(أنت)</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 tabular-nums">
                        {friend.stars} نجمة في لوحة الشرف
                        {!friend.isCurrentUser &&
                        friends.find((item) => item.id === friend.id)?.isCloud ? (
                          <span className="text-sky-700"> · متزامن عبر الأجهزة</span>
                        ) : null}
                      </p>
                    </div>

                    {friend.doneToday ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 whitespace-nowrap shrink-0">
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        أكمل التحدي
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 whitespace-nowrap shrink-0">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        في الانتظار
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              {friends.length === 0 && (
                <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-500">
                  لم ينضم أصدقاء بعد — سجّل الدخول في لوحة الشرف أو أضف أسماء الإخوة والزملاء لتتابعوا إنجاز التحدي معاً.
                </p>
              )}
            </div>

            <div className="border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={handleShareChallenge}
                className="inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50/70 px-4 py-2 text-xs font-semibold text-amber-950 hover:bg-amber-100/70 cursor-pointer"
              >
                {copiedInvite ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                    <span>تم نسخ رسالة التحدي لدعوة أصدقائك</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 text-amber-700" aria-hidden="true" />
                    <span>انسخ دعوة التحدي لمشاركتها مع الأصدقاء</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
