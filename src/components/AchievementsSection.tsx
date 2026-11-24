import {
  Award,
  BookOpen,
  Compass,
  Heart,
  Lock,
  Mail,
  Printer,
  RotateCcw,
  Sparkles,
  Star,
  Sun,
} from 'lucide-react';
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
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 sm:p-7 space-y-6 print:border-0 print:bg-white print:p-0 print:space-y-0">
          {/* Compact Top Customization Bar */}
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 lg:flex-row lg:items-end lg:justify-between no-print">
            <div className="space-y-1 max-w-xl">
              <h3 className="font-display text-base font-bold text-slate-900">
                خصص شهادة إنجاز طفلك
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                اكتب اسم الطفل ليظهر بخط كبير على الشهادة بمقاس <span className="font-semibold text-emerald-800">A4 أفقي</span>، ويمكنك طباعتها مباشرة لتشجيعه في المنزل.
              </p>
              {!isSignedIn && (
                <p className="inline-flex items-center gap-1.5 pt-1 text-xs font-medium text-amber-800">
                  <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>يتطلب حفظ التقدم وتسجيل الاسم تسجيل الدخول أولاً.</span>
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="sm:w-64">
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
                  className="min-h-[42px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70"
                />
              </div>

              {!isSignedIn ? (
                <button
                  type="button"
                  onClick={() =>
                    onOpenEmailAuth('سجّل دخولك بالبريد الإلكتروني لحفظ نجومك وتخصيص شهادتك باسمك!')
                  }
                  className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border-b-2 border-emerald-900 bg-emerald-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-800 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  <span>تسجيل الدخول بالبريد</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border-b-2 border-amber-700 bg-amber-500 px-5 py-2 text-xs sm:text-sm font-bold text-slate-950 hover:bg-amber-400 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Printer className="h-4 w-4" aria-hidden="true" />
                  طباعة الشهادة (A4 أفقي)
                </button>
              )}
            </div>
          </div>

          {/* Full-Width Child-Friendly Festive Certificate Canvas (A4 Landscape 297:210) */}
          <div
            style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
            className="certificate-a4-landscape relative mx-auto flex w-full max-w-[1000px] flex-col overflow-hidden rounded-3xl border-4 border-amber-300 bg-gradient-to-br from-amber-100 via-emerald-50 to-sky-100 p-3 sm:aspect-[297/210] sm:p-4 shadow-md print:max-w-none print:shadow-none"
          >
            <div
              style={{
                backgroundImage:
                  'radial-gradient(rgba(245, 158, 11, 0.16) 1.5px, transparent 1.5px)',
                backgroundSize: '24px 24px',
              }}
              className="relative flex flex-1 flex-col justify-between overflow-hidden rounded-[22px] border-[3px] border-dashed border-emerald-500/50 bg-[#FFFDF7] px-5 py-4 sm:px-10 sm:py-6 text-center"
            >
              {/* Large Playful Corner Decorative Clusters */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute right-4 top-4 flex items-center gap-1.5 opacity-90"
              >
                <Star className="h-7 w-7 sm:h-8 sm:w-8 fill-amber-300 text-amber-500" />
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" />
              </div>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-4 flex items-center gap-1.5 opacity-90"
              >
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
                <Star className="h-7 w-7 sm:h-8 sm:w-8 fill-sky-300 text-sky-500" />
              </div>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-12 right-5 hidden sm:flex items-center gap-1 opacity-80"
              >
                <Star className="h-6 w-6 fill-emerald-300 text-emerald-500" />
              </div>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-12 left-5 hidden sm:flex items-center gap-1 opacity-80"
              >
                <Star className="h-6 w-6 fill-rose-300 text-rose-400" />
              </div>

              {/* Top Header: Bold Celebration Bunting + Large Logo + Certificate Title */}
              <div>
                <svg
                  viewBox="0 0 800 46"
                  aria-hidden="true"
                  className="pointer-events-none mx-auto -mt-4 mb-2 h-9 sm:h-11 w-full max-w-3xl"
                  fill="none"
                >
                  <path
                    d="M10 4 Q400 34 790 4"
                    stroke="#D97706"
                    strokeWidth="3"
                    strokeDasharray="6 5"
                  />
                  <polygon points="50,10 92,15 66,39" fill="#10B981" />
                  <polygon points="135,16 177,20 152,43" fill="#F59E0B" />
                  <polygon points="225,20 267,22 243,44" fill="#0EA5E9" />
                  <polygon points="320,22 362,23 339,45" fill="#F43F5E" />
                  <polygon points="438,23 480,22 461,45" fill="#8B5CF6" />
                  <polygon points="533,22 575,20 557,44" fill="#0EA5E9" />
                  <polygon points="623,20 665,16 648,43" fill="#F59E0B" />
                  <polygon points="708,15 750,10 734,39" fill="#10B981" />
                </svg>

                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                  <div className="rounded-2xl border-2 border-amber-300 bg-white p-1.5 shadow-sm">
                    <PlatformLogo size={64} />
                  </div>
                  <div className="text-center sm:text-right">
                    <p className="text-xs sm:text-sm font-bold text-amber-700">
                      منصة رسائل إماراتية للأطفال · شهادة إنجاز رسمية
                    </p>
                    <h4 className="mt-0.5 font-display text-xl font-extrabold text-emerald-950 sm:text-2xl lg:text-[1.75rem] leading-tight">
                      شهادة تقدير وتشجيع للبطل المبدع
                    </h4>
                  </div>
                </div>
              </div>

              {/* Large Spotlight Name Ribbon + Appreciation Message */}
              <div className="my-2 space-y-2.5">
                <div className="mx-auto w-full max-w-3xl rounded-2xl border-2 border-amber-300 bg-gradient-to-l from-amber-50 via-white to-emerald-50 px-6 py-3 shadow-xs">
                  <p className="text-xs sm:text-sm font-semibold text-slate-600">
                    تُمنح هذه الشهادة بكل فخر واعتزاز إلى البطل
                  </p>
                  <div className="mt-1 flex items-center justify-center gap-3.5">
                    <Star
                      className="h-6 w-6 sm:h-8 sm:w-8 shrink-0 fill-amber-400 text-amber-500"
                      aria-hidden="true"
                    />
                    <span className="font-display text-3xl font-extrabold text-emerald-950 sm:text-4xl lg:text-[2.5rem] leading-tight">
                      {displayName}
                    </span>
                    <Star
                      className="h-6 w-6 sm:h-8 sm:w-8 shrink-0 fill-amber-400 text-amber-500"
                      aria-hidden="true"
                    />
                  </div>
                </div>

                <p className="mx-auto max-w-3xl text-sm sm:text-base font-medium leading-relaxed text-slate-700">
                  تقديراً لمشاركته المتميزة وتفاعله الجميل في رحلة تعلّم الآداب النبوية، السيرة العطرة، تدبر قصار السور، والمواظبة على الأذكار اليومية.
                </p>
              </div>

              {/* Full-Width 4-Series Accomplishment Tiles with Larger Icons & Typography */}
              <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="flex flex-col items-center rounded-2xl border-2 border-emerald-200 bg-emerald-50/90 px-3 py-2.5">
                  <BookOpen className="mb-1 h-5 w-5 sm:h-6 sm:w-6 text-emerald-700" aria-hidden="true" />
                  <p className="text-xs sm:text-sm font-bold text-emerald-900">الآداب النبوية</p>
                  <p className="mt-0.5 font-mono text-base sm:text-lg font-extrabold text-emerald-950 tabular-nums">
                    {etiquetteDone}/{ETIQUETTE_SCENARIOS.length}
                  </p>
                </div>

                <div className="flex flex-col items-center rounded-2xl border-2 border-sky-200 bg-sky-50/90 px-3 py-2.5">
                  <Compass className="mb-1 h-5 w-5 sm:h-6 sm:w-6 text-sky-700" aria-hidden="true" />
                  <p className="text-xs sm:text-sm font-bold text-sky-900">السيرة العطرة</p>
                  <p className="mt-0.5 font-mono text-base sm:text-lg font-extrabold text-sky-950 tabular-nums">
                    {seerahDone}/{SEERAH_MILESTONES.length}
                  </p>
                </div>

                <div className="flex flex-col items-center rounded-2xl border-2 border-amber-200 bg-amber-50/90 px-3 py-2.5">
                  <Heart className="mb-1 h-5 w-5 sm:h-6 sm:w-6 text-amber-700" aria-hidden="true" />
                  <p className="text-xs sm:text-sm font-bold text-amber-900">الأذكار اليومية</p>
                  <p className="mt-0.5 font-mono text-base sm:text-lg font-extrabold text-amber-950 tabular-nums">
                    {adhkarDone}/{DAILY_ADHKAR.length}
                  </p>
                </div>

                <div className="flex flex-col items-center rounded-2xl border-2 border-rose-200 bg-rose-50/90 px-3 py-2.5">
                  <Sun className="mb-1 h-5 w-5 sm:h-6 sm:w-6 text-rose-600" aria-hidden="true" />
                  <p className="text-xs sm:text-sm font-bold text-rose-900">البرنامج الصيفي</p>
                  <p className="mt-0.5 font-mono text-base sm:text-lg font-extrabold text-rose-950 tabular-nums">
                    {seasonalDone}/{SEASONAL_CHALLENGES.length}
                  </p>
                </div>
              </div>

              {/* Large Medal Crest + 5-Star Celebration Row */}
              <div className="mt-2.5 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-center gap-3.5 rounded-2xl border-2 border-emerald-200 bg-white/95 px-4 py-2.5 shadow-2xs">
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-amber-400 bg-amber-300 text-amber-950 shadow-xs">
                    <Award className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden="true" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-emerald-800">
                      الوسام المستحق
                    </p>
                    <p className="font-display text-base sm:text-lg font-extrabold text-emerald-950">
                      {rankTitle}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-amber-200 bg-white/95 px-4 py-2.5 shadow-2xs">
                  <div
                    className="flex items-center justify-center gap-1.5"
                    aria-label={`${filledBadgesCount} من 5 نجوم تميز`}
                  >
                    {[1, 2, 3, 4, 5].map((index) => (
                      <Star
                        key={index}
                        className={`h-6 w-6 sm:h-7 sm:w-7 ${
                          index <= filledBadgesCount
                            ? 'fill-amber-400 text-amber-500'
                            : 'fill-slate-100 text-slate-300'
                        }`}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-xs sm:text-sm font-bold text-amber-900 tabular-nums">
                    {stars} نجمة مكتسبة · {completedIds.length} نشاطاً مكتملًا
                  </p>
                </div>
              </div>

              {/* Bottom Official Seal, Date & Platform Signature Strip */}
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t-2 border-dashed border-amber-300/80 pt-2.5 text-xs sm:text-sm font-bold text-slate-700">
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
    </section>
  );
}
