import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, RotateCcw, ArrowLeft, BookOpen } from 'lucide-react';
import { ETIQUETTE_SCENARIOS, type EtiquetteChoice } from '../../data/channelContent';
import { soundFX } from '../../utils/soundEffects';

interface EtiquetteSimulatorProps {
  selectedScenarioId?: string;
  educatorMode: boolean;
  completedIds: string[];
  onCompleteItem: (itemId: string, starsEarned: number, celebrationTitle?: string) => void;
}

export function EtiquetteSimulator({
  selectedScenarioId,
  educatorMode,
  completedIds,
  onCompleteItem,
}: EtiquetteSimulatorProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [chosenId, setChosenId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedScenarioId) {
      const idx = ETIQUETTE_SCENARIOS.findIndex((s) => s.id === selectedScenarioId);
      if (idx !== -1) {
        setActiveIndex(idx);
        setChosenId(null);
      }
    }
  }, [selectedScenarioId]);

  const scenario = ETIQUETTE_SCENARIOS[activeIndex];
  const selectedChoice: EtiquetteChoice | undefined = scenario.choices.find(
    (c) => c.id === chosenId
  );

  const handleSelectChoice = (choice: EtiquetteChoice) => {
    setChosenId(choice.id);
    if (choice.isCorrect) {
      onCompleteItem(scenario.id, 10, `أحسنت! أتقنت ${scenario.title}`);
    } else {
      soundFX.playNudge();
    }
  };

  const handleNext = () => {
    soundFX.playClick();
    setChosenId(null);
    setActiveIndex((prev) => (prev + 1) % ETIQUETTE_SCENARIOS.length);
  };

  const handleReset = () => {
    soundFX.playClick();
    setChosenId(null);
  };

  const isDone = completedIds.includes(scenario.id);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Main Interactive Stage */}
      <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6">
        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="text-xs font-medium text-slate-500">
              <span>موقف {activeIndex + 1} من {ETIQUETTE_SCENARIOS.length}</span>
              <span aria-hidden="true" className="mx-2">·</span>
              <span>{scenario.context}</span>
              {isDone && (
                <>
                  <span aria-hidden="true" className="mx-2">·</span>
                  <span className="font-semibold text-emerald-700">✓ مكتمل</span>
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {ETIQUETTE_SCENARIOS.map((item, idx) => {
                const completed = completedIds.includes(item.id);
                const active = idx === activeIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setActiveIndex(idx);
                      setChosenId(null);
                    }}
                    aria-label={`الموقف ${idx + 1}: ${item.title}`}
                    className={`min-h-[36px] min-w-[36px] rounded-xl px-2.5 text-xs font-bold tabular-nums transition-transform duration-150 active:scale-95 cursor-pointer ${
                      active
                        ? 'bg-emerald-700 text-white border-b-2 border-emerald-900'
                        : completed
                          ? 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <h3 className="font-display text-base sm:text-lg font-bold text-emerald-950 mb-2.5">
            {scenario.title}
          </h3>
          <div className="mb-5 rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 text-sm sm:text-[0.95rem] leading-[1.8] text-slate-800">
            {scenario.situation}
          </div>

          {/* Interactive Choice Cards */}
          <div className="space-y-2.5" role="radiogroup" aria-label="اختر التصرف المناسب">
            {scenario.choices.map((choice) => {
              const isSelected = chosenId === choice.id;
              let stateStyle =
                'border-slate-200 border-b-2 bg-slate-50/60 text-slate-800 hover:border-emerald-400 hover:bg-emerald-50/40';
              if (isSelected && choice.isCorrect) {
                stateStyle = 'border-emerald-600 border-b-4 bg-emerald-50 text-emerald-950';
              } else if (isSelected && !choice.isCorrect) {
                stateStyle = 'border-amber-500 border-b-4 bg-amber-50 text-amber-950';
              }

              return (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => handleSelectChoice(choice)}
                  className={`w-full min-h-[48px] rounded-xl border p-3.5 text-right text-sm font-medium transition-all duration-150 active:scale-[0.99] flex items-start gap-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${stateStyle}`}
                >
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                      isSelected
                        ? choice.isCorrect
                          ? 'border-emerald-700 bg-emerald-700 text-white'
                          : 'border-amber-600 bg-amber-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected ? (choice.isCorrect ? '✓' : '!') : ''}
                  </span>
                  <span className="leading-relaxed">{choice.text}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Action Row */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={handleReset}
            disabled={!chosenId}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-slate-200 border-b-2 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            إعادة المحاولة
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border-b-4 border-emerald-900 bg-emerald-700 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-800 active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer"
          >
            الموقف التالي
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Control & Concept Deck */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div
          aria-live="polite"
          className={`rounded-2xl border p-5 transition-colors duration-150 ${
            selectedChoice
              ? selectedChoice.isCorrect
                ? 'border-emerald-200 bg-emerald-50/70'
                : 'border-amber-200 bg-amber-50/70'
              : 'border-slate-200 bg-white'
          }`}
        >
          {selectedChoice ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold">
                {selectedChoice.isCorrect ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0" aria-hidden="true" />
                    <span className="text-emerald-900">{selectedChoice.feedbackTitle}</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-amber-700 shrink-0" aria-hidden="true" />
                    <span className="text-amber-900">{selectedChoice.feedbackTitle}</span>
                  </>
                )}
              </div>
              <p className="text-sm leading-relaxed text-slate-700">
                {selectedChoice.feedbackDetail}
              </p>
              {selectedChoice.isCorrect && (
                <p className="pt-1 text-xs font-semibold text-emerald-800 tabular-nums">
                  +١٠ نجوم في حصاد البطل
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-slate-900">توجيه التفاعل</p>
              <p className="text-sm leading-relaxed text-slate-600">
                اقرأ الموقف بتركيز ثم اختر التصرف الأفضل لاكتشاف الحكمة النبوية وسماع نغمة الفوز!
              </p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <BookOpen className="h-4 w-4 text-emerald-700" aria-hidden="true" />
            <span>المرجع التربوي من السلسلة</span>
          </div>
          <blockquote className="font-display text-base font-semibold leading-relaxed text-slate-900">
            {scenario.wisdomQuote}
          </blockquote>
          <p className="text-xs text-slate-500">{scenario.wisdomSource}</p>
        </div>

        {educatorMode && (
          <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-5 space-y-2">
            <p className="text-xs font-bold text-sky-900">دليل المربي — نصيحة عملية</p>
            <p className="text-sm leading-relaxed text-sky-950">{scenario.educatorTip}</p>
          </div>
        )}
      </div>
    </div>
  );
}
