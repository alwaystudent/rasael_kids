import { useState } from 'react';
import { CheckCircle2, AlertCircle, Lightbulb, ArrowLeft, RotateCcw } from 'lucide-react';
import { SEASONAL_CHALLENGES } from '../../data/channelContent';
import { soundFX } from '../../utils/soundEffects';

interface SeasonalQuizArenaProps {
  educatorMode: boolean;
  completedIds: string[];
  onCompleteItem: (itemId: string, starsEarned: number, celebrationTitle?: string) => void;
}

export function SeasonalQuizArena({
  educatorMode,
  completedIds,
  onCompleteItem,
}: SeasonalQuizArenaProps) {
  const [questionIdx, setQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [streak, setStreak] = useState(0);

  const current = SEASONAL_CHALLENGES[questionIdx];
  const isAnswered = selectedOption !== null;
  const isCorrect = selectedOption === current.correctIndex;

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    if (idx === current.correctIndex) {
      setStreak((s) => s + 1);
      onCompleteItem(current.id, 15, `ممتاز! إجابة صحيحة في ${current.category}`);
    } else {
      setStreak(0);
      soundFX.playNudge();
    }
  };

  const handleNext = () => {
    soundFX.playClick();
    setSelectedOption(null);
    setShowHint(false);
    setQuestionIdx((prev) => (prev + 1) % SEASONAL_CHALLENGES.length);
  };

  const handleRetry = () => {
    soundFX.playClick();
    setSelectedOption(null);
  };

  const solvedCount = SEASONAL_CHALLENGES.filter((q) =>
    completedIds.includes(q.id)
  ).length;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Main Quiz Stage */}
      <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6">
        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="text-xs font-medium text-slate-500">
              <span>{current.programName}</span>
              <span aria-hidden="true" className="mx-2">·</span>
              <span>{current.category}</span>
              <span aria-hidden="true" className="mx-2">·</span>
              <span className="tabular-nums">
                السؤال {questionIdx + 1} من {SEASONAL_CHALLENGES.length}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {SEASONAL_CHALLENGES.map((q, idx) => {
                const done = completedIds.includes(q.id);
                const active = idx === questionIdx;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setQuestionIdx(idx);
                      setSelectedOption(null);
                      setShowHint(false);
                    }}
                    className={`min-h-[34px] min-w-[34px] rounded-xl px-2 text-xs font-bold tabular-nums transition-all active:scale-95 cursor-pointer ${
                      active
                        ? 'bg-emerald-700 text-white border-b-2 border-emerald-900'
                        : done
                          ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <h3 className="font-display text-base sm:text-lg font-bold leading-relaxed text-emerald-950 mb-5">
            {current.question}
          </h3>

          <div className="space-y-3">
            {current.options.map((opt, idx) => {
              const picked = selectedOption === idx;
              const rightOpt = idx === current.correctIndex;
              let style =
                'border-slate-200 border-b-2 bg-slate-50/70 text-slate-800 hover:border-emerald-400 hover:bg-emerald-50/40';
              if (isAnswered && rightOpt) {
                style = 'border-emerald-600 border-b-4 bg-emerald-50 text-emerald-950 font-semibold';
              } else if (picked && !rightOpt) {
                style = 'border-amber-500 border-b-4 bg-amber-50 text-amber-950';
              }

              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelect(idx)}
                  disabled={isAnswered}
                  className={`w-full min-h-[48px] rounded-xl border px-4 py-3 text-right text-sm transition-all duration-150 active:scale-[0.99] flex items-center justify-between gap-3 ${
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
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setShowHint((h) => !h);
              }}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-slate-200 border-b-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Lightbulb className="h-4 w-4 text-amber-600" aria-hidden="true" />
              {showHint ? 'إخفاء التلميح' : 'عرض تلميح'}
            </button>
            {isAnswered && !isCorrect && (
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 border-b-2 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                حاول مجدداً
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border-b-4 border-emerald-900 bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800 active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer"
          >
            السؤال التالي
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Right Score & Guidance Deck */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">أسئلة 2026 المنجزة</p>
            <p className="mt-1 font-mono text-xl font-bold text-slate-900 tabular-nums">
              {solvedCount}/{SEASONAL_CHALLENGES.length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">سلسلة الإجابات الصحيحة</p>
            <p className="mt-1 font-mono text-xl font-bold text-emerald-700 tabular-nums">
              {streak}
            </p>
          </div>
        </div>

        {showHint && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-950">
            <p className="font-bold mb-1">تلميح مساعد</p>
            <p className="leading-relaxed">{current.hint}</p>
          </div>
        )}

        <div
          aria-live="polite"
          className={`rounded-2xl border p-5 ${
            isAnswered
              ? isCorrect
                ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950'
                : 'border-amber-200 bg-amber-50/70 text-amber-950'
              : 'border-slate-200 bg-white text-slate-700'
          }`}
        >
          {isAnswered ? (
            <div className="space-y-1.5">
              <p className="text-sm font-bold">
                {isCorrect ? '✓ إجابة موفقة (+١٥ نجمة)' : '✕ إجابة غير صحيحة — راجع التلميح'}
              </p>
              <p className="text-sm leading-relaxed">{current.explanation}</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-slate-900">تحدي موسم 2026</p>
              <p className="text-sm leading-relaxed text-slate-600">
                اختر الإجابة الصحيحة في مسابقات البرنامج الربيعي والصيفي ورمضان 2026 لترفع رصيدك من النجوم.
              </p>
            </div>
          )}
        </div>

        {educatorMode && (
          <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-5 space-y-1.5">
            <p className="text-xs font-bold text-sky-900">دليل المربي — نشاط المسابقة</p>
            <p className="text-sm leading-relaxed text-sky-950">{current.educatorTip}</p>
          </div>
        )}
      </div>
    </div>
  );
}
