import { useEffect, useState } from 'react';
import { CheckCircle2, Droplets, RotateCcw, Sparkles } from 'lucide-react';
import {
  IMAN_PILLARS,
  ISLAM_PILLARS,
  QURAN_SURAH_MATCHES,
  WUDU_STEPS,
  type PillarItem,
  type WuduStep,
} from '../../data/channelContent';
import { soundFX } from '../../utils/soundEffects';

interface FaithAndQuranLabProps {
  initialSubTab?: 'pillars' | 'surahs' | 'wudu';
  educatorMode: boolean;
  completedIds: string[];
  onCompleteItem: (itemId: string, starsEarned: number, celebrationTitle?: string) => void;
}

export function FaithAndQuranLab({
  initialSubTab,
  educatorMode,
  completedIds,
  onCompleteItem,
}: FaithAndQuranLabProps) {
  const [subTab, setSubTab] = useState<'pillars' | 'surahs' | 'wudu'>(
    initialSubTab || 'pillars'
  );
  const [pillarSet, setPillarSet] = useState<'iman' | 'islam'>('iman');
  const [assembledIds, setAssembledIds] = useState<string[]>([]);
  const [activePillar, setActivePillar] = useState<PillarItem>(IMAN_PILLARS[0]);

  // Surah matching game state
  const [selectedAyahId, setSelectedAyahId] = useState<string | null>(null);
  const [matchedSurahIds, setMatchedSurahIds] = useState<string[]>([]);
  const [matchErrorId, setMatchErrorId] = useState<string | null>(null);

  // Wudu step-by-step interactive lab state
  const [wuduCompletedStep, setWuduCompletedStep] = useState<number>(0);
  const [activeWuduStep, setActiveWuduStep] = useState<WuduStep>(WUDU_STEPS[0]);
  const [wuduErrorMsg, setWuduErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const currentPillars = pillarSet === 'iman' ? IMAN_PILLARS : ISLAM_PILLARS;

  const handleTogglePillar = (pillar: PillarItem) => {
    setActivePillar(pillar);
    if (!assembledIds.includes(pillar.id)) {
      const next = [...assembledIds, pillar.id];
      setAssembledIds(next);

      const allCurrentDone = currentPillars.every((p) => next.includes(p.id));
      if (allCurrentDone) {
        onCompleteItem(
          `faith-${pillarSet}`,
          20,
          pillarSet === 'iman'
            ? 'أكملت بنيان أركان الإيمان الستة!'
            : 'أكملت بنيان أركان الإسلام الخمسة!'
        );
      } else {
        soundFX.playClick();
      }
    } else {
      soundFX.playClick();
    }
  };

  const handleSwitchPillarSet = (nextSet: 'iman' | 'islam') => {
    soundFX.playClick();
    setPillarSet(nextSet);
    setActivePillar(nextSet === 'iman' ? IMAN_PILLARS[0] : ISLAM_PILLARS[0]);
  };

  const orderedMeanings = [
    QURAN_SURAH_MATCHES[2],
    QURAN_SURAH_MATCHES[0],
    QURAN_SURAH_MATCHES[3],
    QURAN_SURAH_MATCHES[1],
  ];

  const handlePickMeaning = (meaningPairId: string) => {
    if (!selectedAyahId) return;
    if (selectedAyahId === meaningPairId) {
      if (!matchedSurahIds.includes(meaningPairId)) {
        const nextMatched = [...matchedSurahIds, meaningPairId];
        setMatchedSurahIds(nextMatched);
        if (nextMatched.length === QURAN_SURAH_MATCHES.length) {
          onCompleteItem('faith-surahs-all', 15, 'أتممت مطابقة جميع معاني قصار السور!');
        } else {
          onCompleteItem(`surah-${meaningPairId}`, 5, 'مطابقة قرآنية صحيحة!');
        }
      }
      setSelectedAyahId(null);
      setMatchErrorId(null);
    } else {
      soundFX.playNudge();
      setMatchErrorId(meaningPairId);
    }
  };

  // Shuffled visual order for Wudu challenge so child actively picks next step in order
  const wuduChallengeOrder = [
    WUDU_STEPS[2],
    WUDU_STEPS[0],
    WUDU_STEPS[4],
    WUDU_STEPS[1],
    WUDU_STEPS[6],
    WUDU_STEPS[3],
    WUDU_STEPS[5],
  ];

  const handlePickWuduStep = (step: WuduStep) => {
    const expectedOrder = wuduCompletedStep + 1;
    if (step.stepOrder === expectedOrder) {
      setWuduCompletedStep(expectedOrder);
      setActiveWuduStep(step);
      setWuduErrorMsg(null);
      if (expectedOrder === WUDU_STEPS.length) {
        onCompleteItem('wudu-sequence-complete', 20, 'أحسنت! أتقنت ترتيب خطوات الوضوء كاملة');
      } else {
        soundFX.playSuccess();
      }
    } else if (step.stepOrder <= wuduCompletedStep) {
      soundFX.playClick();
      setActiveWuduStep(step);
      setWuduErrorMsg(null);
    } else {
      soundFX.playNudge();
      setWuduErrorMsg(
        `نبحث الآن عن الخطوة رقم (${expectedOrder}) قبل «${step.title}».`
      );
    }
  };

  const assembledCountInSet = currentPillars.filter((p) =>
    assembledIds.includes(p.id)
  ).length;
  const setCompleted =
    assembledCountInSet === currentPillars.length ||
    completedIds.includes(`faith-${pillarSet}`);

  return (
    <div className="space-y-4">
      {/* Sub-mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="inline-flex flex-wrap items-center gap-1 rounded-xl bg-slate-200/70 p-1"
          role="tablist"
          aria-label="أنشطة برنامج علمي طفلك 2026"
        >
          <button
            type="button"
            role="tab"
            aria-selected={subTab === 'pillars'}
            onClick={() => {
              soundFX.playClick();
              setSubTab('pillars');
            }}
            className={`min-h-[38px] rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'pillars'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            أركان الإيمان والإسلام
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={subTab === 'wudu'}
            onClick={() => {
              soundFX.playClick();
              setSubTab('wudu');
            }}
            className={`min-h-[38px] rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'wudu'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            مختبر الوضوء والطهارة
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={subTab === 'surahs'}
            onClick={() => {
              soundFX.playClick();
              setSubTab('surahs');
            }}
            className={`min-h-[38px] rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'surahs'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            معاني قصار السور
          </button>
        </div>

        <span className="text-xs font-medium text-slate-500 tabular-nums">
          {subTab === 'pillars'
            ? `تم تركيب ${assembledCountInSet} من ${currentPillars.length} أركان`
            : subTab === 'wudu'
              ? `خطوات الوضوء المنجزة: ${wuduCompletedStep} من ${WUDU_STEPS.length}`
              : `تمت مطابقة ${matchedSurahIds.length} من ${QURAN_SURAH_MATCHES.length} آيات`}
        </span>
      </div>

      {subTab === 'pillars' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-display text-base sm:text-lg font-bold text-emerald-950">
                  {pillarSet === 'iman' ? 'بناء أركان الإيمان الستة' : 'بناء أركان الإسلام الخمسة'}
                </h3>
                <p className="text-sm text-slate-600">
                  اضغط على كل ركن لإضافته إلى البنيان واستكشاف معناه العملي.
                </p>
              </div>

              <div className="inline-flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => handleSwitchPillarSet('iman')}
                  className={`min-h-[34px] rounded-lg px-3 text-xs font-semibold transition-colors cursor-pointer ${
                    pillarSet === 'iman'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  أركان الإيمان (6)
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchPillarSet('islam')}
                  className={`min-h-[34px] rounded-lg px-3 text-xs font-semibold transition-colors cursor-pointer ${
                    pillarSet === 'islam'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  أركان الإسلام (5)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {currentPillars.map((pillar) => {
                const placed = assembledIds.includes(pillar.id);
                const selected = activePillar.id === pillar.id;
                return (
                  <button
                    key={pillar.id}
                    type="button"
                    onClick={() => handleTogglePillar(pillar)}
                    className={`min-h-[68px] rounded-xl border p-4 text-right transition-all duration-150 active:scale-[0.98] flex items-center justify-between gap-3 cursor-pointer ${
                      selected
                        ? 'border-emerald-700 border-b-4 bg-emerald-50 text-emerald-950'
                        : placed
                          ? 'border-emerald-200 border-b-2 bg-emerald-50/40 text-slate-900 hover:bg-emerald-50'
                          : 'border-dashed border-slate-300 bg-slate-50/60 text-slate-700 hover:border-emerald-400 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums ${
                          placed
                            ? 'bg-emerald-700 text-white'
                            : 'border border-slate-300 bg-white text-slate-600'
                        }`}
                      >
                        0{pillar.order}
                      </span>
                      <span className="font-semibold text-sm sm:text-base">
                        {pillar.title}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-emerald-700 shrink-0">
                      {placed ? '✓ مُركّب' : 'اضغط'}
                    </span>
                  </button>
                );
              })}
            </div>

            {setCompleted && (
              <div
                aria-live="polite"
                className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
              >
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0" aria-hidden="true" />
                  <span>
                    أحسنت! اكتمل بناء جميع {pillarSet === 'iman' ? 'أركان الإيمان' : 'أركان الإسلام'} (+٢٠ نجمة)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setAssembledIds((prev) =>
                      prev.filter((id) => !currentPillars.some((p) => p.id === id))
                    );
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  إعادة التركيب
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3.5">
              <div className="text-xs font-medium text-slate-500">
                الركن 0{activePillar.order} · شرح مبسط للطفل
              </div>
              <h4 className="font-display text-base sm:text-lg font-bold text-emerald-950">
                {activePillar.title}
              </h4>
              <p className="text-sm sm:text-[0.95rem] leading-[1.8] text-slate-700">
                {activePillar.shortDesc}
              </p>

              <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 space-y-1.5">
                <p className="text-xs font-semibold text-amber-900">كيف أطبقه في يومي؟</p>
                <p className="text-sm leading-relaxed text-slate-800">
                  {activePillar.childExample}
                </p>
              </div>
            </div>

            {educatorMode && (
              <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-5 space-y-1.5">
                <p className="text-xs font-bold text-sky-900">دليل المربي — غرس العقيدة</p>
                <p className="text-sm leading-relaxed text-sky-950">
                  اربط كل ركن بملاحظة الكون والطبيعة من حول الطفل (السماء، المطر، النبات) لتتحول العقيدة إلى محبة ويقين حي في قلبه.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === 'wudu' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Interactive Wudu Sequencer */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-display text-base sm:text-lg font-bold text-sky-950">
                  رتّب خطوات الوضوء الصحيح بالترتيب
                </h3>
                <p className="text-sm text-slate-600">
                  اضغط على الخطوات من 1 إلى 7 بالترتيب لتساعد البطل على إتمام وضوئه!
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setWuduCompletedStep(0);
                  setActiveWuduStep(WUDU_STEPS[0]);
                  setWuduErrorMsg(null);
                }}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                إعادة الترتيب
              </button>
            </div>

            {/* Progress Bar of 7 Wudu Steps */}
            <div className="grid grid-cols-7 gap-1.5">
              {WUDU_STEPS.map((s) => {
                const done = s.stepOrder <= wuduCompletedStep;
                return (
                  <div
                    key={s.id}
                    className={`rounded-lg py-2 text-center text-xs font-bold tabular-nums transition-colors ${
                      done
                        ? 'bg-sky-600 text-white'
                        : 'border border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                  >
                    {done ? '✓' : s.stepOrder}
                  </div>
                );
              })}
            </div>

            {/* Shuffled Step Cards to Click in Order */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {wuduChallengeOrder.map((step) => {
                const done = step.stepOrder <= wuduCompletedStep;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => handlePickWuduStep(step)}
                    className={`min-h-[58px] rounded-xl border p-3.5 text-right transition-all duration-150 active:scale-[0.98] flex items-center justify-between gap-2 cursor-pointer ${
                      done
                        ? 'border-sky-300 border-b-2 bg-sky-50 text-sky-950'
                        : 'border-slate-200 border-b-2 bg-white text-slate-800 hover:border-sky-400 hover:bg-sky-50/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Droplets
                        className={`h-4 w-4 shrink-0 ${
                          done ? 'text-sky-600' : 'text-slate-400'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="text-sm font-semibold">{step.title}</span>
                    </div>
                    <span className="font-mono text-xs font-bold tabular-nums text-sky-700 shrink-0">
                      {done ? `خطوة ${step.stepOrder}` : 'اختر'}
                    </span>
                  </button>
                );
              })}
            </div>

            {wuduErrorMsg && (
              <div
                aria-live="polite"
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950"
              >
                {wuduErrorMsg}
              </div>
            )}

            {wuduCompletedStep === WUDU_STEPS.length && (
              <div
                aria-live="polite"
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 flex items-center gap-2"
              >
                <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0" aria-hidden="true" />
                <span>بارك الله فيك! أتممت خطوات الوضوء كاملةً (+٢٠ نجمة)</span>
              </div>
            )}
          </div>

          {/* Active Wudu Step Details */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
              <div className="text-xs font-semibold text-sky-700">
                الخطوة {activeWuduStep.stepOrder} من {WUDU_STEPS.length} · كتاب الطهارة والصلاة
              </div>
              <h4 className="font-display text-base sm:text-lg font-bold text-sky-950">
                {activeWuduStep.title}
              </h4>
              <p className="text-sm sm:text-[0.95rem] leading-[1.8] text-slate-700">
                {activeWuduStep.detail}
              </p>
              <div className="rounded-xl border border-sky-200/80 bg-sky-50/50 p-4 space-y-1">
                <p className="text-xs font-bold text-sky-900">آداب وسنن الوضوء</p>
                <p className="text-sm leading-relaxed text-sky-950">
                  {activeWuduStep.sunnahTip}
                </p>
              </div>
            </div>

            {educatorMode && (
              <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-5 space-y-1.5">
                <p className="text-xs font-bold text-sky-900">دليل المربي — الطهارة وترشيد الماء</p>
                <p className="text-sm leading-relaxed text-sky-950">
                  طبّق خطوات الوضوء عملياً مع الطفل أمام المغسلة مع تذكيره بوصية النبي ﷺ بعدم الإسراف في الماء ولو كان على نهر جارٍ.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === 'surahs' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-display text-base sm:text-lg font-bold text-teal-950">
                  وصّل الآية بمعناها الصحيح (العربية لغة القرآن)
                </h3>
                <p className="text-sm text-slate-600">
                  اختر بطاقة الآية من اليمين، ثم اضغط على معناها المناسب من اليسار.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setMatchedSurahIds([]);
                  setSelectedAyahId(null);
                  setMatchErrorId(null);
                }}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                إعادة اللعبة
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-500">١. اختر الآية الكريمة</p>
                {QURAN_SURAH_MATCHES.map((pair) => {
                  const matched = matchedSurahIds.includes(pair.id);
                  const active = selectedAyahId === pair.id;
                  return (
                    <button
                      key={pair.id}
                      type="button"
                      disabled={matched}
                      onClick={() => {
                        soundFX.playClick();
                        setSelectedAyahId(pair.id);
                        setMatchErrorId(null);
                      }}
                      className={`w-full min-h-[76px] rounded-xl border p-4 text-right transition-all duration-150 cursor-pointer ${
                        matched
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-900 opacity-80 cursor-default'
                          : active
                            ? 'border-emerald-700 border-b-4 bg-emerald-50 text-slate-900'
                            : 'border-slate-200 border-b-2 bg-slate-50/70 text-slate-900 hover:border-emerald-300 hover:bg-white'
                      }`}
                    >
                      <span className="block text-xs text-slate-500 mb-1">
                        {pair.surahName} {matched ? '· ✓ تمت المطابقة' : ''}
                      </span>
                      <span className="font-display text-base font-bold">{pair.ayah}</span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-500">٢. اختر المعنى المطابق</p>
                {orderedMeanings.map((pair) => {
                  const matched = matchedSurahIds.includes(pair.id);
                  const wrong = matchErrorId === pair.id;
                  return (
                    <button
                      key={pair.id}
                      type="button"
                      disabled={matched || !selectedAyahId}
                      onClick={() => handlePickMeaning(pair.id)}
                      className={`w-full min-h-[76px] rounded-xl border p-4 text-right text-sm leading-relaxed transition-all duration-150 ${
                        matched
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-900 font-medium cursor-default'
                          : wrong
                            ? 'border-amber-500 border-b-4 bg-amber-50 text-amber-950 cursor-pointer'
                            : selectedAyahId
                              ? 'border-slate-300 border-b-2 bg-white text-slate-800 hover:border-emerald-600 hover:bg-emerald-50/40 cursor-pointer'
                              : 'border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {pair.meaning}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Sparkles className="h-4 w-4 text-amber-600" aria-hidden="true" />
                <span>تطبيق عملي للآيات المطابقة</span>
              </div>
              {matchedSurahIds.length === 0 ? (
                <p className="text-sm leading-relaxed text-slate-600">
                  عند مطابقة كل آية بمعناها، سيظهر هنا العمل اليومي الجميل الذي نطبقه من الآية.
                </p>
              ) : (
                <div className="space-y-3">
                  {QURAN_SURAH_MATCHES.filter((m) => matchedSurahIds.includes(m.id)).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-sm"
                    >
                      <p className="font-bold text-emerald-900 mb-0.5">{item.surahName}</p>
                      <p className="text-slate-700 leading-relaxed">{item.dailyAction}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {educatorMode && (
              <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-5 space-y-1.5">
                <p className="text-xs font-bold text-sky-900">دليل المربي — تدبر قصار السور</p>
                <p className="text-sm leading-relaxed text-sky-950">
                  الطفل الذي يفهم معنى «الصمد» و«الكوثر» يحب تلاوتها في صلاته أكثر من الحفظ المجرد.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
