import { useEffect, useState } from 'react';
import {
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  MapPin,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { SEERAH_MILESTONES } from '../../data/channelContent';
import { soundFX } from '../../utils/soundEffects';

interface SeerahJourneyExplorerProps {
  selectedMilestoneId?: string;
  educatorMode: boolean;
  completedIds: string[];
  onCompleteItem: (itemId: string, starsEarned: number, celebrationTitle?: string) => void;
}

export function SeerahJourneyExplorer({
  selectedMilestoneId,
  educatorMode,
  completedIds,
  onCompleteItem,
}: SeerahJourneyExplorerProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  useEffect(() => {
    if (selectedMilestoneId) {
      const idx = SEERAH_MILESTONES.findIndex((m) => m.id === selectedMilestoneId);
      if (idx !== -1) {
        setStepIndex(idx);
        setSelectedOption(null);
        setAutoPlay(false);
      }
    }
  }, [selectedMilestoneId]);

  useEffect(() => {
    if (!autoPlay) return;
    const timer = window.setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= SEERAH_MILESTONES.length - 1) {
          setAutoPlay(false);
          return prev;
        }
        setSelectedOption(null);
        return prev + 1;
      });
    }, 5000);
    return () => window.clearInterval(timer);
  }, [autoPlay]);

  const milestone = SEERAH_MILESTONES[stepIndex];
  const isCorrect = selectedOption === milestone.correctIndex;
  const isAnswered = selectedOption !== null;
  const isCompleted = completedIds.includes(milestone.id);

  const handleAnswer = (idx: number) => {
    setSelectedOption(idx);
    setAutoPlay(false);
    if (idx === milestone.correctIndex) {
      onCompleteItem(milestone.id, 15, `اجتزت محطة: ${milestone.title}`);
    } else {
      soundFX.playNudge();
    }
  };

  const goToStep = (idx: number) => {
    soundFX.playClick();
    setStepIndex(idx);
    setSelectedOption(null);
    setAutoPlay(false);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Main Interactive Timeline & Story Stage */}
      <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6">
        <div>
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
              <span>محطة {milestone.stepNumber} من {SEERAH_MILESTONES.length}</span>
              <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                <MapPin className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                {milestone.location}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8" role="tablist" aria-label="محطات السيرة والمعجزات">
              {SEERAH_MILESTONES.map((item, idx) => {
                const active = idx === stepIndex;
                const done = completedIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => goToStep(idx)}
                    className={`min-h-[44px] rounded-xl border px-1.5 py-2 text-center transition-all duration-150 active:scale-95 cursor-pointer ${
                      active
                        ? 'border-emerald-700 border-b-4 bg-emerald-700 text-white'
                        : done
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block text-xs font-bold tabular-nums">
                      0{item.stepNumber}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px]">
                      {done ? '✓' : 'محطة'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-xs font-medium text-slate-500">
              <span>{milestone.eraLabel}</span>
              {isCompleted && (
                <>
                  <span aria-hidden="true" className="mx-2">·</span>
                  <span className="font-semibold text-emerald-700">✓ تم اجتياز المحطة</span>
                </>
              )}
            </div>

            <h3 className="font-display text-lg sm:text-xl font-bold text-emerald-950">
              {milestone.title}
            </h3>

            <p className="text-sm sm:text-[0.95rem] leading-[1.85] text-slate-700">
              {milestone.story}
            </p>

            <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4">
              <p className="text-xs font-semibold text-amber-900 mb-1">القيمة المستفادة</p>
              <p className="text-sm font-semibold text-slate-900">{milestone.moralLesson}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToStep(Math.max(0, stepIndex - 1))}
              disabled={stepIndex === 0}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 border-b-2 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
              السابق
            </button>
            <button
              type="button"
              onClick={() => goToStep(Math.min(SEERAH_MILESTONES.length - 1, stepIndex + 1))}
              disabled={stepIndex === SEERAH_MILESTONES.length - 1}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 border-b-2 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              التالي
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setAutoPlay((p) => !p);
              }}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border-b-4 border-emerald-900 bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer"
            >
              {autoPlay ? (
                <>
                  <Pause className="h-4 w-4" aria-hidden="true" />
                  إيقاف العرض
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" aria-hidden="true" />
                  عرض تلقائي
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => goToStep(0)}
              aria-label="العودة للمحطة الأولى"
              className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Control & Checkpoint Deck */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">تحقق من فهمك</p>
            <h4 className="font-display text-base font-bold text-slate-900">
              {milestone.question}
            </h4>
          </div>

          <div className="space-y-2.5">
            {milestone.options.map((opt, idx) => {
              const picked = selectedOption === idx;
              const rightOpt = idx === milestone.correctIndex;
              let btnClass =
                'border-slate-200 border-b-2 bg-slate-50/70 text-slate-800 hover:border-emerald-400 hover:bg-emerald-50/40';
              if (picked && rightOpt) {
                btnClass = 'border-emerald-600 border-b-4 bg-emerald-50 text-emerald-950 font-semibold';
              } else if (picked && !rightOpt) {
                btnClass = 'border-amber-500 border-b-4 bg-amber-50 text-amber-950';
              }

              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleAnswer(idx)}
                  className={`w-full min-h-[48px] rounded-xl border px-4 py-3 text-right text-sm transition-all duration-150 active:scale-[0.99] cursor-pointer ${btnClass}`}
                >
                  {opt}
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
              <div className="mb-1 flex items-center gap-2 font-bold">
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" aria-hidden="true" />
                    <span>إجابة صحيحة! (+١٥ نجمة)</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-amber-700 shrink-0" aria-hidden="true" />
                    <span>ليست هذه الإجابة — اقرأ القصة وجرب ثانية</span>
                  </>
                )}
              </div>
              {isCorrect && <p className="leading-relaxed">{milestone.explanation}</p>}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            <label htmlFor="seerah-slider">شريط التقدم الزمني للمحطات</label>
            <span className="font-mono tabular-nums text-slate-900">
              {stepIndex + 1} / {SEERAH_MILESTONES.length}
            </span>
          </div>
          <input
            id="seerah-slider"
            type="range"
            min={0}
            max={SEERAH_MILESTONES.length - 1}
            value={stepIndex}
            onChange={(e) => goToStep(Number(e.target.value))}
            className="w-full accent-emerald-700 cursor-pointer"
          />
        </div>

        {educatorMode && (
          <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-5 space-y-1.5">
            <p className="text-xs font-bold text-sky-900">دليل المربي — ربط السيرة بالواقع</p>
            <p className="text-sm leading-relaxed text-sky-950">{milestone.educatorTip}</p>
          </div>
        )}
      </div>
    </div>
  );
}
