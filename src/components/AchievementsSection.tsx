import { Award, Lock, Mail, Printer, RotateCcw, Sparkles, Star } from 'lucide-react';
import { PlatformLogo } from './PlatformLogo';
import {
  DAILY_ADHKAR,
  ETIQUETTE_SCENARIOS,
  SEASONAL_CHALLENGES,
  SEERAH_MILESTONES,
} from '../data/channelContent';

interface AchievementsSectionProps {
  childName: string;
  onChangeChildName: (name: string) => void;
  stars: number;
  completedIds: string[];
  adhkarProgress: Record<string, number>;
  onResetProgress: () => void;
  isSignedIn: boolean;
  onOpenEmailAuth: (reason?: string) => void;
}

export function AchievementsSection({
  childName,
  onChangeChildName,
  stars,
  completedIds,
  adhkarProgress,
  onResetProgress,
  isSignedIn,
  onOpenEmailAuth,
}: AchievementsSectionProps) {
  const etiquetteDone = ETIQUETTE_SCENARIOS.filter((i) =>
    completedIds.includes(i.id)
  ).length;
  const seerahDone = SEERAH_MILESTONES.filter((i) =>
    completedIds.includes(i.id)
  ).length;
  const seasonalDone = SEASONAL_CHALLENGES.filter((i) =>
    completedIds.includes(i.id)
  ).length;
  const adhkarDone = DAILY_ADHKAR.filter(
    (d) => (adhkarProgress[d.id] || 0) >= d.targetCount
  ).length;

  const rankTitle =
    stars >= 120
      ? 'نجم الرسائل الإماراتية المتميز'
      : stars >= 50
        ? 'سفير القيم والآداب'
        : 'مستكشف المعرفة الصغير';

  const filledBadgesCount =
    stars >= 120 ? 5 : stars >= 75 ? 4 : stars >= 40 ? 3 : stars >= 15 ? 2 : 1;

  const displayName = childName.trim() || 'البطل الصغير';

  return (
    <section
      id="achievements"
      aria-labelledby="achievements-title"
      className="border-t border-slate-200 bg-white py-10 sm:py-12"
    >
      <div className="w-full px-5 sm:px-8 lg:px-10">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4 no-print">
          <div className="space-y-1.5 max-w-2xl">
            <p className="text-xs font-semibold text-emerald-800">
              سجل الإنجاز الشخصي · يُحفظ لحسابك بعد تسجيل الدخول
            </p>
            <h2
              id="achievements-title"
              className="font-display text-lg font-bold text-emerald-950 sm:text-xl leading-snug"
            >
              حصاد النجوم و<span className="text-amber-700">شهادة البطل</span>
            </h2>
          </div>

          <button
            type="button"
            onClick={onResetProgress}
            className="inline-flex min-h-[38px] items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            بدء رحلة جديدة
          </button>
        </div>

        {/* 4 Progress Summary Metrics */}
        <div className="mb-7 grid grid-cols-2 gap-4 lg:grid-cols-4 no-print">
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
            <p className="text-xs text-slate-500">مجموع النجوم</p>
            <p className="mt-1 font-mono text-xl sm:text-2xl font-bold text-amber-600 tabular-nums">
              {stars}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-700">{rankTitle}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
            <p className="text-xs text-slate-500">مواقف الآداب</p>
            <p className="mt-1 font-mono text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
              {etiquetteDone}/{ETIQUETTE_SCENARIOS.length}
            </p>
            <p className="mt-1 text-xs text-slate-600">سلسلة آداب الطفل المسلم</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
            <p className="text-xs text-slate-500">محطات السيرة</p>
            <p className="mt-1 font-mono text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
              {seerahDone}/{SEERAH_MILESTONES.length}
            </p>
            <p className="mt-1 text-xs text-slate-600">سلسلة السيرة النبوية</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
            <p className="text-xs text-slate-500">تحديات المسابقة والأذكار</p>
            <p className="mt-1 font-mono text-xl sm:text-2xl font-bold text-emerald-700 tabular-nums">
              {seasonalDone + adhkarDone}/{SEASONAL_CHALLENGES.length + DAILY_ADHKAR.length}
            </p>
            <p className="mt-1 text-xs text-slate-600">البرنامج الصيفي والأذكار</p>
          </div>
        </div>

        {/* Printable Hero Certificate */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 sm:p-7 print:border-0 print:bg-white print:p-0">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center print:block">
            <div className="lg:col-span-4 space-y-3.5 no-print">
              <h3 className="font-display text-base font-bold text-slate-900">
                خصص شهادة إنجاز طفلك
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                اكتب اسم الطفل ليظهر على الشهادة التفاعلية بمقاس <span className="font-semibold text-emerald-800">A4 أفقي</span>، ويمكنك طباعتها مباشرة لتشجيعه في المنزل.
              </p>
              <div>
                <label
                  htmlFor="child-name-input"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  اسم الطفل أو الطفلة
                </label>
                <input
                  id="child-name-input"
                  type="text"
                  maxLength={32}
                  disabled={!isSignedIn}
                  value={isSignedIn ? childName : ''}
                  onChange={(e) => onChangeChildName(e.target.value)}
                  placeholder={isSignedIn ? 'مثال: زايد أو مريم' : 'سجّل دخولك أولاً لتسجيل الاسم'}
                  className="min-h-[40px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70"
                />
              </div>

              {!isSignedIn ? (
                <button
                  type="button"
                  onClick={() =>
                    onOpenEmailAuth('سجّل دخولك بالبريد الإلكتروني لحفظ نجومك وتخصيص شهادتك باسمك!')
                  }
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border-b-2 border-emerald-900 bg-emerald-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-800 cursor-pointer"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  <span>تسجيل الدخول بالبريد</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border-b-2 border-amber-700 bg-amber-500 px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 hover:bg-amber-400 cursor-pointer"
                >
                  <Printer className="h-4 w-4" aria-hidden="true" />
                  طباعة الشهادة (A4 أفقي)
                </button>
              )}
              {!isSignedIn && (
                <p className="inline-flex items-center gap-1.5 text-xs text-amber-800">
                  <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>يتطلب حفظ التقدم وتسجيل الاسم تسجيل الدخول أولاً.</span>
                </p>
              )}
            </div>

            {/* Child-Friendly Festive Certificate Canvas (A4 Landscape 297:210) */}
            <div
              style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
              className="certificate-a4-landscape lg:col-span-8 relative flex flex-col overflow-hidden rounded-3xl border-4 border-amber-300 bg-gradient-to-br from-amber-100 via-emerald-50 to-sky-100 p-2.5 sm:aspect-[297/210] sm:p-3.5 shadow-md print:shadow-none"
            >
              <div
                style={{
                  backgroundImage:
                    'radial-gradient(rgba(245, 158, 11, 0.14) 1.2px, transparent 1.2px)',
                  backgroundSize: '20px 20px',
                }}
                className="relative flex flex-1 flex-col justify-between overflow-hidden rounded-[20px] border-2 border-dashed border-emerald-500/50 bg-[#FFFDF7] px-4 py-3.5 sm:px-7 sm:py-4 text-center"
              >
                {/* Playful Corner Decorative Clusters */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 top-3 flex items-center gap-1 opacity-85"
                >
                  <Star className="h-5 w-5 fill-amber-300 text-amber-500" />
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                </div>
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-3 flex items-center gap-1 opacity-85"
                >
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <Star className="h-5 w-5 fill-sky-300 text-sky-500" />
                </div>
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-10 right-3 flex items-center gap-1 opacity-75"
                >
                  <Star className="h-4 w-4 fill-emerald-300 text-emerald-500" />
                </div>
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-10 left-3 flex items-center gap-1 opacity-75"
                >
                  <Star className="h-4 w-4 fill-rose-300 text-rose-400" />
                </div>

                {/* Top Header: Wide Celebration Bunting + Logo + Title */}
                <div>
                  <svg
                    viewBox="0 0 700 32"
                    aria-hidden="true"
                    className="pointer-events-none mx-auto -mt-3 mb-1 h-6 w-full max-w-2xl"
                    fill="none"
                  >
                    <path
                      d="M10 3 Q350 24 690 3"
                      stroke="#D97706"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                    <polygon points="45,7 75,10 56,27" fill="#10B981" />
                    <polygon points="120,11 150,14 133,30" fill="#F59E0B" />
                    <polygon points="200,14 230,15 214,31" fill="#0EA5E9" />
                    <polygon points="285,15 315,15 300,32" fill="#F43F5E" />
                    <polygon points="370,15 400,15 385,32" fill="#8B5CF6" />
                    <polygon points="455,15 485,14 470,31" fill="#0EA5E9" />
                    <polygon points="535,14 565,11 551,30" fill="#F59E0B" />
                    <polygon points="615,10 645,7 632,27" fill="#10B981" />
                  </svg>

                  <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3.5">
                    <div className="rounded-2xl border-2 border-amber-300 bg-white p-1 shadow-xs">
                      <PlatformLogo size={46} />
                    </div>
                    <div className="text-center sm:text-right">
                      <p className="text-[11px] font-bold text-amber-700">
                        منصة رسائل إماراتية للأطفال · شهادة إنجاز رسمية
                      </p>
                      <h4 className="font-display text-lg font-extrabold text-emerald-950 sm:text-xl leading-tight">
                        شهادة تقدير وتشجيع للبطل المبدع
                      </h4>
                    </div>
                  </div>
                </div>

                {/* Full-Width Spotlight Name Ribbon + Appreciation Message */}
                <div className="my-1.5 space-y-2">
                  <div className="mx-auto w-full max-w-2xl rounded-2xl border-2 border-amber-300 bg-gradient-to-l from-amber-50 via-white to-emerald-50 px-5 py-2 shadow-xs">
                    <p className="text-[11px] font-semibold text-slate-500">
                      تُمنح هذه الشهادة بكل فخر واعتزاز إلى البطل
                    </p>
                    <div className="mt-0.5 flex items-center justify-center gap-3">
                      <Star
                        className="h-5 w-5 shrink-0 fill-amber-400 text-amber-500"
                        aria-hidden="true"
                      />
                      <span className="font-display text-2xl font-extrabold text-emerald-950 sm:text-[1.75rem]">
                        {displayName}
                      </span>
                      <Star
                        className="h-5 w-5 shrink-0 fill-amber-400 text-amber-500"
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  <p className="mx-auto max-w-2xl text-xs sm:text-[13px] leading-relaxed text-slate-700">
                    تقديراً لمشاركته المتميزة وتفاعله الجميل في رحلة تعلّم الآداب النبوية، السيرة العطرة، تدبر قصار السور، والمواظبة على الأذكار اليومية.
                  </p>
                </div>

                {/* Full-Width 4-Series Accomplishment Tiles (Fills Landscape Width) */}
                <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/85 px-2.5 py-1.5">
                    <p className="text-[10px] font-semibold text-emerald-800">الآداب النبوية</p>
                    <p className="font-mono text-sm font-extrabold text-emerald-950 tabular-nums">
                      {etiquetteDone}/{ETIQUETTE_SCENARIOS.length}
                    </p>
                  </div>
                  <div className="rounded-xl border border-sky-200 bg-sky-50/85 px-2.5 py-1.5">
                    <p className="text-[10px] font-semibold text-sky-800">السيرة العطرة</p>
                    <p className="font-mono text-sm font-extrabold text-sky-950 tabular-nums">
                      {seerahDone}/{SEERAH_MILESTONES.length}
                    </p>
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-amber-50/85 px-2.5 py-1.5">
                    <p className="text-[10px] font-semibold text-amber-800">الأذكار اليومية</p>
                    <p className="font-mono text-sm font-extrabold text-amber-950 tabular-nums">
                      {adhkarDone}/{DAILY_ADHKAR.length}
                    </p>
                  </div>
                  <div className="rounded-xl border border-rose-200 bg-rose-50/85 px-2.5 py-1.5">
                    <p className="text-[10px] font-semibold text-rose-800">البرنامج الصيفي</p>
                    <p className="font-mono text-sm font-extrabold text-rose-950 tabular-nums">
                      {seasonalDone}/{SEASONAL_CHALLENGES.length}
                    </p>
                  </div>
                </div>

                {/* Full-Width Medal Crest + 5-Star Celebration Row */}
                <div className="mt-2 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="flex items-center justify-center gap-3 rounded-2xl border border-emerald-200 bg-white/90 px-3.5 py-2 shadow-2xs">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-amber-400 bg-amber-300 text-amber-950 shadow-xs">
                      <Award className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-semibold text-emerald-800">
                        الوسام المستحق
                      </p>
                      <p className="font-display text-sm font-extrabold text-emerald-950">
                        {rankTitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-200 bg-white/90 px-3.5 py-2 shadow-2xs">
                    <div
                      className="flex items-center justify-center gap-1"
                      aria-label={`${filledBadgesCount} من 5 نجوم تميز`}
                    >
                      {[1, 2, 3, 4, 5].map((index) => (
                        <Star
                          key={index}
                          className={`h-5 w-5 ${
                            index <= filledBadgesCount
                              ? 'fill-amber-400 text-amber-500'
                              : 'fill-slate-100 text-slate-300'
                          }`}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <p className="mt-0.5 text-[11px] font-bold text-amber-900 tabular-nums">
                      {stars} نجمة مكتسبة · {completedIds.length} نشاطاً مكتملًا
                    </p>
                  </div>
                </div>

                {/* Bottom Official Seal, Date & Platform Signature Strip */}
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t-2 border-dashed border-amber-300/70 pt-2 text-[11px] font-semibold text-slate-600">
                  <span className="text-emerald-900">
                    تاريخ الإصدار:{' '}
                    {new Intl.DateTimeFormat('ar-AE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }).format(new Date())}
                  </span>
                  <span aria-hidden="true" className="text-amber-500">★</span>
                  <span className="text-amber-800">إدارة منصة رسائل إماراتية للأطفال</span>
                  <span aria-hidden="true" className="text-amber-500">★</span>
                  <span className="text-sky-900">ختم التميز · 2026</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
