import { useEffect, useState } from 'react';
import { CheckCircle2, RotateCcw, Plus } from 'lucide-react';
import { BALANCE_BEHAVIORS, DAILY_ADHKAR } from '../../data/channelContent';
import { soundFX } from '../../utils/soundEffects';

interface ValuesBalanceAndAdhkarProps {
  initialFocus?: 'balance' | 'adhkar';
  educatorMode: boolean;
  adhkarProgress: Record<string, number>;
  onIncrementDhikr: (dhikrId: string, target: number) => void;
  onCompleteItem: (itemId: string, starsEarned: number, celebrationTitle?: string) => void;
}

export function ValuesBalanceAndAdhkar({
  initialFocus,
  educatorMode,
  adhkarProgress,
  onIncrementDhikr,
  onCompleteItem,
}: ValuesBalanceAndAdhkarProps) {
  const [activeIds, setActiveIds] = useState<string[]>(['beh-1']);

  useEffect(() => {
    if (initialFocus === 'adhkar') {
      const el = document.getElementById('adhkar-tracker-panel');
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [initialFocus]);

  const toggleBehavior = (id: string) => {
    const beh = BALANCE_BEHAVIORS.find((b) => b.id === id);
    const adding = !activeIds.includes(id);

    setActiveIds((prev) => {
      const next = adding ? [...prev, id] : prev.filter((x) => x !== id);
      const nextScore = BALANCE_BEHAVIORS.filter((b) => next.includes(b.id)).reduce(
        (sum, b) => sum + b.impact,
        0
      );
      if (nextScore >= 50) {
        onCompleteItem('values-balance-mastery', 15, 'رجحت كفة الصدق والأخلاق في ميزانك!');
      } else if (adding && beh?.category === 'positive') {
        soundFX.playSuccess();
      } else if (adding && beh?.category === 'negative') {
        soundFX.playNudge();
      } else {
        soundFX.playClick();
      }
      return next;
    });
  };

  const selectedBehaviors = BALANCE_BEHAVIORS.filter((b) => activeIds.includes(b.id));
  const goodWeight = selectedBehaviors
    .filter((b) => b.category === 'positive')
    .reduce((acc, b) => acc + b.impact, 0);
  const badWeight = Math.abs(
    selectedBehaviors
      .filter((b) => b.category === 'negative')
      .reduce((acc, b) => acc + b.impact, 0)
  );
  const netBalance = goodWeight - badWeight;

  const tiltAngle = Math.max(-18, Math.min(18, (badWeight - goodWeight) * 0.28));

  const latestBehavior =
    selectedBehaviors.length > 0 ? selectedBehaviors[selectedBehaviors.length - 1] : null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Interactive SVG Moral Balance Scale */}
      <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-display text-base sm:text-lg font-bold text-emerald-950">
              ميزان القيم والسلوك التفاعلي
            </h3>
            <p className="text-sm text-slate-600">
              أضف التصرفات إلى الميزان لترى كيف ترجح كفة الصدق والأمانة على السلوك الخاطئ.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setActiveIds([]);
            }}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            تصفير الميزان
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold">
            <span className="text-emerald-800 tabular-nums">
              كفة الحسنات والصدق: {goodWeight} نقطة
            </span>
            <span className="text-amber-800 tabular-nums">
              كفة الأخطاء: {badWeight} نقطة
            </span>
          </div>

          <svg
            viewBox="0 0 420 210"
            className="mx-auto h-48 w-full max-w-md"
            role="img"
            aria-label={`ميزان القيم: كفة الصدق ${goodWeight} وكفة الأخطاء ${badWeight}`}
          >
            <rect x="165" y="184" width="90" height="12" rx="4" fill="#334155" />
            <rect x="204" y="54" width="12" height="132" rx="4" fill="#475569" />
            <circle cx="210" cy="54" r="9" fill="#047857" />

            <g
              style={{
                transform: `rotate(${tiltAngle}deg)`,
                transformOrigin: '210px 54px',
                transition: 'transform 350ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <rect x="60" y="50" width="300" height="8" rx="4" fill="#1E293B" />
              <line x1="80" y1="56" x2="55" y2="120" stroke="#64748B" strokeWidth="2" />
              <line x1="80" y1="56" x2="105" y2="120" stroke="#64748B" strokeWidth="2" />
              <path d="M44 120 Q80 144 116 120 Z" fill="#059669" />
              <text x="80" y="112" textAnchor="middle" fontSize="12" fontWeight="700" fill="#065F46">
                القيم الطيبة
              </text>

              <line x1="340" y1="56" x2="315" y2="120" stroke="#64748B" strokeWidth="2" />
              <line x1="340" y1="56" x2="365" y2="120" stroke="#64748B" strokeWidth="2" />
              <path d="M304 120 Q340 144 376 120 Z" fill="#D97706" />
              <text x="340" y="112" textAnchor="middle" fontSize="12" fontWeight="700" fill="#92400E">
                عادات نتركها
              </text>
            </g>
          </svg>

          <div className="mt-2 text-center text-sm font-semibold">
            {netBalance > 0 ? (
              <span className="text-emerald-800">
                ✓ كفة الصدق والأخلاق راجحة بفارق {netBalance} نقطة
              </span>
            ) : netBalance < 0 ? (
              <span className="text-amber-800">
                ! انتبه: نحتاج لإضافة سلوكيات صادقة لإعادة التوازن
              </span>
            ) : (
              <span className="text-slate-600">
                اختر تصرفات من القائمة أدناه لتحريك الميزان
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {BALANCE_BEHAVIORS.map((beh) => {
            const active = activeIds.includes(beh.id);
            const isPositive = beh.category === 'positive';
            return (
              <button
                key={beh.id}
                type="button"
                onClick={() => toggleBehavior(beh.id)}
                className={`min-h-[52px] rounded-xl border px-4 py-3 text-right text-sm font-medium transition-all duration-150 active:scale-[0.98] flex items-center justify-between gap-2 cursor-pointer ${
                  active
                    ? isPositive
                      ? 'border-emerald-600 border-b-4 bg-emerald-50 text-emerald-950'
                      : 'border-amber-500 border-b-4 bg-amber-50 text-amber-950'
                    : 'border-slate-200 border-b-2 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{beh.label}</span>
                <span
                  className={`font-mono text-xs font-bold tabular-nums shrink-0 ${
                    isPositive ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {beh.impact > 0 ? `+${beh.impact}` : beh.impact}
                </span>
              </button>
            );
          })}
        </div>

        {latestBehavior && (
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 px-4 py-3 text-sm text-slate-700">
            <span className="font-bold text-slate-900">الدرس التربوي: </span>
            {latestBehavior.lesson}
          </div>
        )}
      </div>

      {/* Daily Adhkar Counter */}
      <div id="adhkar-tracker-panel" className="lg:col-span-5 flex flex-col gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <p className="text-xs font-semibold text-slate-500 mb-1">حصن الطفل المسلم</p>
            <h4 className="font-display text-base font-bold text-emerald-950">
              عداد الأذكار اليومية التفاعلي
            </h4>
          </div>

          <div className="space-y-3">
            {DAILY_ADHKAR.map((dhikr) => {
              const count = adhkarProgress[dhikr.id] || 0;
              const completed = count >= dhikr.targetCount;
              return (
                <div
                  key={dhikr.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    completed
                      ? 'border-emerald-200 bg-emerald-50/50'
                      : 'border-slate-200 bg-slate-50/40'
                  }`}
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900">{dhikr.title}</span>
                    <span className="text-xs text-slate-500">{dhikr.timing}</span>
                  </div>
                  <p className="mb-3 text-sm leading-relaxed text-slate-800">
                    {dhikr.dhikrText}
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-600">{dhikr.rewardNote}</span>
                    <button
                      type="button"
                      onClick={() => onIncrementDhikr(dhikr.id, dhikr.targetCount)}
                      disabled={completed}
                      className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold tabular-nums transition-all active:scale-95 shrink-0 ${
                        completed
                          ? 'bg-emerald-700 text-white cursor-default'
                          : 'border-b-2 border-slate-950 bg-slate-900 text-white hover:bg-slate-800 cursor-pointer'
                      }`}
                    >
                      {completed ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          مكتمل ({count}/{dhikr.targetCount})
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                          سبّح ({count}/{dhikr.targetCount})
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {educatorMode && (
          <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-5 space-y-1.5">
            <p className="text-xs font-bold text-sky-900">دليل المربي — علاج الكذب وبناء الصدق</p>
            <p className="text-sm leading-relaxed text-sky-950">
              استخدم الميزان مع طفلك نهاية اليوم لمناقشة موقف حقيقي بهدوء، واحتفل بتسجيل الأذكار دون إجبار.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
