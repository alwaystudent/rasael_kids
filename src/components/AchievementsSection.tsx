import { Lock, Mail, Printer, RotateCcw, Star } from 'lucide-react';
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
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 sm:p-7">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-4 space-y-3.5 no-print">
              <h3 className="font-display text-base font-bold text-slate-900">
                خصص شهادة إنجاز طفلك
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                اكتب اسم الطفل ليظهر على الشهادة التفاعلية، ويمكنك طباعتها لتشجيعه في المنزل.
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
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 cursor-pointer"
                >
                  <Printer className="h-4 w-4" aria-hidden="true" />
                  طباعة الشهادة
                </button>
              )}
              {!isSignedIn && (
                <p className="inline-flex items-center gap-1.5 text-xs text-amber-800">
                  <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>يتطلب حفظ التقدم وتسجيل الاسم تسجيل الدخول أولاً.</span>
                </p>
              )}
            </div>

            <div className="lg:col-span-8 rounded-2xl border-2 border-emerald-700/20 bg-white p-6 sm:p-7 text-center">
              <div className="mx-auto mb-3 flex justify-center">
                <PlatformLogo size={64} />
              </div>

              <p className="text-xs font-semibold text-emerald-800">
                منصة رسائل إماراتية للأطفال · شهادة تقدير وتشجيع
              </p>

              <h4 className="mt-2.5 font-display text-xl font-bold text-slate-900 sm:text-2xl">
                {displayName}
              </h4>

              <p className="mx-auto mt-2.5 max-w-lg text-sm leading-relaxed text-slate-600">
                تقديراً لمشاركته المتميزة في أنشطة الآداب النبوية، السيرة العطرة، تدبر قصار السور، ومتابعة الأذكار اليومية، وحصوله على وسام:
              </p>

              <p className="mt-2.5 font-display text-base font-bold text-emerald-800">
                {rankTitle}
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-6 border-t border-slate-100 pt-4 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 tabular-nums">
                  <Star className="h-4 w-4 text-amber-500" aria-hidden="true" />
                  {stars} نجمة مكتسبة
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  {completedIds.length} نشاطاً مكتملًا
                </span>
                <span aria-hidden="true">·</span>
                <span>مشروع رسائل إماراتية</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
