import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Lightbulb, RefreshCw, X } from 'lucide-react';
import type { ActivityEngineId } from '../data/channelContent';
import { getTodayDateKey } from './DailyChallengeSection';
import { soundFX } from '../utils/soundEffects';

export interface DailyHintItem {
  id: string;
  seriesId: ActivityEngineId;
  seriesTitle: string;
  headline: string;
  message: string;
  actionLabel: string;
}

const DAILY_HINTS_POOL: DailyHintItem[] = [
  {
    id: 'hint-etiquette-greetings',
    seriesId: 'etiquette',
    seriesTitle: 'سلسلة آداب الطفل المسلم',
    headline: 'تلميح اليوم · خلقٌ جميل يبدأ بابتسامة',
    message:
      'هل جربت اليوم موقف «إفشاء السلام وآداب الاستئذان»؟ خطوة بسيطة منك تنشر المحبة في البيت وتكسبك نجوماً جديدة!',
    actionLabel: 'جرّب مواقف الآداب الآن',
  },
  {
    id: 'hint-seerah-miracles',
    seriesId: 'seerah',
    seriesTitle: 'السيرة ومعجزات الرسول ﷺ',
    headline: 'تلميح اليوم · رحلة مشوقة في السيرة',
    message:
      'تعالَ نستكشف اليوم قصة حنين الجذع ومعجزة نبع الماء بين أصابع النبي ﷺ، واكتشف كيف كان الصبر مفتاح النجاح.',
    actionLabel: 'استكشف محطات السيرة',
  },
  {
    id: 'hint-faith-wudu',
    seriesId: 'faith',
    seriesTitle: 'علمي طفلك · الوضوء والعقيدة',
    headline: 'تلميح اليوم · خطوات الوضوء الصحيح',
    message:
      'رتّب خطوات الوضوء السبع بالترتيب الصحيح في المختبر التفاعلي، وتعرّف على معاني كلمات القرآن الجميلة!',
    actionLabel: 'ابدأ مختبر الوضوء والعقيدة',
  },
  {
    id: 'hint-values-adhkar',
    seriesId: 'values',
    seriesTitle: 'نور في دربي · الأذكار والقيم',
    headline: 'تلميح اليوم · ذكرٌ يملأ قلبك طمأنينة',
    message:
      'لا تنسَ أذكار الصباح والمساء اليوم! اضغط عدّاد التسبيح في سلسلة نور في دربي وارفع كفة الحسنات بمواقفك الطيبة.',
    actionLabel: 'افتح الأذكار وميزان القيم',
  },
  {
    id: 'hint-seasonal-quiz',
    seriesId: 'seasonal',
    seriesTitle: 'المسابقات الصيفية والرمضانية 2026',
    headline: 'تلميح اليوم · تحدّي أبطال 2026',
    message:
      'تحدٍّ سريع بانتظارك في ساحة المسابقات الموسمية لعام 2026! اختبر معلوماتك التراثية والتربوية واجمع 15 نجمة.',
    actionLabel: 'ادخل ساحة المسابقات',
  },
];

const HINT_DISMISSED_KEY = 'rasael_daily_hint_dismissed_v1';

function getTodayHintIndex(dateKey: string): number {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 33 + dateKey.charCodeAt(i)) >>> 0;
  }
  return hash % DAILY_HINTS_POOL.length;
}

interface DailyHintPopupProps {
  readyToShow: boolean;
  onLaunchSeries: (seriesId: ActivityEngineId) => void;
}

export function DailyHintPopup({
  readyToShow,
  onLaunchSeries,
}: DailyHintPopupProps) {
  const todayKey = getTodayDateKey();
  const [hintIndex, setHintIndex] = useState<number>(() =>
    getTodayHintIndex(todayKey)
  );
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!readyToShow) return;

    let dismissedToday = false;
    try {
      dismissedToday = sessionStorage.getItem(HINT_DISMISSED_KEY) === todayKey;
    } catch {
      dismissedToday = false;
    }

    if (dismissedToday) return;

    const timer = window.setTimeout(() => {
      setIsOpen(true);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [readyToShow, todayKey]);

  const handleDismiss = () => {
    soundFX.playClick();
    setIsOpen(false);
    try {
      sessionStorage.setItem(HINT_DISMISSED_KEY, todayKey);
    } catch {
      // Ignore sessionStorage error
    }
  };

  const handleNextHint = () => {
    soundFX.playClick();
    setHintIndex((prev) => (prev + 1) % DAILY_HINTS_POOL.length);
  };

  const handleOpenFromTrigger = () => {
    soundFX.playClick();
    setIsOpen(true);
  };

  const currentHint = DAILY_HINTS_POOL[hintIndex];

  if (!readyToShow) return null;

  return (
    <div
      dir="rtl"
      className="pointer-events-none fixed bottom-5 left-4 sm:left-5 z-40 flex flex-col items-end gap-2 max-w-[calc(100vw-2rem)] no-print"
    >
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.aside
            key="daily-hint-card"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            aria-label="تلميح اليوم التربوي"
            className="pointer-events-auto w-full max-w-sm rounded-2xl border-2 border-emerald-200 bg-white p-4 shadow-xl shadow-emerald-950/10 text-right space-y-3"
          >
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <Lightbulb className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-emerald-800">
                    {currentHint.seriesTitle}
                  </p>
                  <h3 className="font-display text-sm font-bold text-slate-900 leading-snug">
                    {currentHint.headline}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDismiss}
                aria-label="إغلاق التلميح اليومي"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm leading-relaxed text-slate-700">
              {currentHint.message}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  handleDismiss();
                  onLaunchSeries(currentHint.seriesId);
                }}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border-b-2 border-emerald-900 bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 cursor-pointer"
              >
                <span>{currentHint.actionLabel}</span>
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={handleNextHint}
                className="inline-flex min-h-[36px] items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 cursor-pointer"
              >
                <RefreshCw className="h-3 w-3 text-amber-700" aria-hidden="true" />
                <span>تلميح آخر</span>
              </button>
            </div>
          </motion.aside>
        ) : (
          <motion.button
            key="daily-hint-trigger"
            type="button"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            onClick={handleOpenFromTrigger}
            className="pointer-events-auto inline-flex min-h-[40px] items-center gap-2 rounded-2xl border border-amber-300 bg-white px-3.5 py-2 text-xs font-bold text-amber-950 shadow-md hover:bg-amber-50 cursor-pointer"
            aria-label="عرض تلميح اليوم التربوي"
          >
            <Lightbulb className="h-4 w-4 text-amber-600" aria-hidden="true" />
            <span>تلميح اليوم</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
