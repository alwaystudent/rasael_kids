import { Users, Star, Volume2, VolumeX, Trophy } from 'lucide-react';
import type { ActivityEngineId } from '../data/channelContent';
import { EtiquetteSimulator } from './activities/EtiquetteSimulator';
import { SeerahJourneyExplorer } from './activities/SeerahJourneyExplorer';
import { FaithAndQuranLab } from './activities/FaithAndQuranLab';
import { ValuesBalanceAndAdhkar } from './activities/ValuesBalanceAndAdhkar';
import { SeasonalQuizArena } from './activities/SeasonalQuizArena';
import { soundFX } from '../utils/soundEffects';

interface InteractiveStageProps {
  activeEngine: ActivityEngineId;
  onSelectEngine: (engine: ActivityEngineId) => void;
  focusTargetId?: string;
  educatorMode: boolean;
  onToggleEducatorMode: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  stars: number;
  completedIds: string[];
  adhkarProgress: Record<string, number>;
  onCompleteItem: (itemId: string, starsEarned: number, celebrationTitle?: string) => void;
  onIncrementDhikr: (dhikrId: string, target: number) => void;
}

const ENGINE_TABS: { id: ActivityEngineId; label: string }[] = [
  { id: 'etiquette', label: 'مواقف الآداب' },
  { id: 'seerah', label: 'رحلة السيرة والمعجزات' },
  { id: 'faith', label: 'العقيدة والوضوء والسور' },
  { id: 'values', label: 'ميزان القيم والأذكار' },
  { id: 'seasonal', label: 'تحدي موسم 2026' },
];

export function InteractiveStage({
  activeEngine,
  onSelectEngine,
  focusTargetId,
  educatorMode,
  onToggleEducatorMode,
  isMuted,
  onToggleMute,
  stars,
  completedIds,
  adhkarProgress,
  onCompleteItem,
  onIncrementDhikr,
}: InteractiveStageProps) {
  const nextMilestone = stars < 50 ? 50 : stars < 120 ? 120 : 250;
  const progressPct = Math.min(100, Math.round((stars / nextMilestone) * 100));
  const rankLabel =
    stars >= 120
      ? 'نجم الرسائل الإماراتية المتميز'
      : stars >= 50
        ? 'سفير القيم والآداب'
        : 'مستكشف المعرفة الصغير';

  const faithInitialSubTab =
    focusTargetId === 'surah-match'
      ? 'surahs'
      : focusTargetId === 'wudu-lab'
        ? 'wudu'
        : 'pillars';

  return (
    <section
      id="interactive-stage"
      aria-labelledby="interactive-stage-title"
      className="border-y border-slate-200 bg-slate-50/80 py-10 sm:py-12"
    >
      <div className="w-full px-5 sm:px-8 lg:px-10">
        {/* Section Heading & Workspace Toolbar */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1.5 max-w-2xl">
            <p className="text-xs font-semibold text-emerald-800">
              مساحة اللعب والتعلم التفاعلي · إصدار 2026
            </p>
            <h2
              id="interactive-stage-title"
              className="font-display text-lg font-bold text-sky-950 sm:text-xl leading-snug"
            >
              الأنشطة التفاعلية من{' '}
              <span className="text-emerald-700">سلاسل القناة</span>
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              اختر السلسلة وابدأ اللعب والاستكشاف مع مؤثرات صوتية ممتعة واجمع النجوم لترتقي بمرتبتك.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onToggleMute}
              aria-pressed={isMuted}
              className={`inline-flex min-h-[40px] items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isMuted
                  ? 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
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
                  <span>الصوت: مفعّل</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                onToggleEducatorMode();
              }}
              aria-pressed={educatorMode}
              className={`inline-flex min-h-[40px] items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                educatorMode
                  ? 'border-sky-600 bg-sky-50 text-sky-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              <span>{educatorMode ? 'دليل المربي: مفعّل' : 'إظهار دليل المربي'}</span>
            </button>
          </div>
        </div>

        {/* Playful Child Adventurer Progress Bar */}
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Trophy className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-slate-500">مرتبتك الحالية في المنصة</p>
              <p className="font-display text-sm font-bold text-slate-900">
                {rankLabel}
              </p>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-1.5 sm:max-w-sm">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="inline-flex items-center gap-1 text-amber-700 tabular-nums">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" aria-hidden="true" />
                {stars} نجمة مكتسبة
              </span>
              <span className="text-slate-500 tabular-nums">
                الهدف التالي: {nextMilestone} نجمة
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Segmented Engine Selector Tabs */}
        <div
          className="mb-6 flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5"
          role="tablist"
          aria-label="أقسام الأنشطة التفاعلية"
        >
          {ENGINE_TABS.map((tab) => {
            const active = activeEngine === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  soundFX.playClick();
                  onSelectEngine(tab.id);
                }}
                className={`min-h-[40px] flex-1 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'border-b-4 border-emerald-900 bg-emerald-700 text-white'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Active Interactive Engine */}
        <div>
          {activeEngine === 'etiquette' && (
            <EtiquetteSimulator
              selectedScenarioId={
                focusTargetId?.startsWith('etq-') ? focusTargetId : undefined
              }
              educatorMode={educatorMode}
              completedIds={completedIds}
              onCompleteItem={onCompleteItem}
            />
          )}

          {activeEngine === 'seerah' && (
            <SeerahJourneyExplorer
              selectedMilestoneId={
                focusTargetId?.startsWith('seerah-') ? focusTargetId : undefined
              }
              educatorMode={educatorMode}
              completedIds={completedIds}
              onCompleteItem={onCompleteItem}
            />
          )}

          {activeEngine === 'faith' && (
            <FaithAndQuranLab
              initialSubTab={faithInitialSubTab}
              educatorMode={educatorMode}
              completedIds={completedIds}
              onCompleteItem={onCompleteItem}
            />
          )}

          {activeEngine === 'values' && (
            <ValuesBalanceAndAdhkar
              initialFocus={focusTargetId === 'values-adhkar' ? 'adhkar' : 'balance'}
              educatorMode={educatorMode}
              adhkarProgress={adhkarProgress}
              onIncrementDhikr={onIncrementDhikr}
              onCompleteItem={onCompleteItem}
            />
          )}

          {activeEngine === 'seasonal' && (
            <SeasonalQuizArena
              educatorMode={educatorMode}
              completedIds={completedIds}
              onCompleteItem={onCompleteItem}
            />
          )}
        </div>
      </div>
    </section>
  );
}
