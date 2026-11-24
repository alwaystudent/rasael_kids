import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { PlatformLogo } from './PlatformLogo';

interface SplashScreenProps {
  visible: boolean;
  isDataReady: boolean;
  onFinish: () => void;
}

export function SplashScreen({
  visible,
  isDataReady,
  onFinish,
}: SplashScreenProps) {
  const [percent, setPercent] = useState(0);
  const isDataReadyRef = useRef(isDataReady);
  const onFinishRef = useRef(onFinish);

  isDataReadyRef.current = isDataReady;
  onFinishRef.current = onFinish;

  useEffect(() => {
    if (!visible) return;

    const startTime = performance.now();
    const minDuration = 1250;
    const maxWaitDuration = 2200;
    let rafId = 0;
    let finishTimer: number | null = null;
    let completed = false;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const ratio = Math.min(1, elapsed / minDuration);
      const eased = 1 - Math.pow(1 - ratio, 2.2);

      let nextPercent = Math.round(eased * 100);
      if (!isDataReadyRef.current && elapsed < maxWaitDuration && nextPercent > 92) {
        nextPercent = 92;
      }

      setPercent(nextPercent);

      if (nextPercent >= 100 && !completed) {
        completed = true;
        finishTimer = window.setTimeout(() => {
          onFinishRef.current();
        }, 200);
        return;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      if (finishTimer) {
        window.clearTimeout(finishTimer);
      }
    };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="platform-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          dir="rtl"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F7F9FC] px-6 text-center no-print"
          aria-busy="true"
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex w-full max-w-sm flex-col items-center space-y-5"
          >
            {/* Official Platform Logo */}
            <div className="rounded-3xl border-2 border-emerald-200 bg-white p-2.5 shadow-md shadow-emerald-900/10">
              <PlatformLogo
                size={96}
                className="rounded-2xl border-0"
              />
            </div>

            {/* Platform Name & Subtitle */}
            <div className="space-y-1.5">
              <h1 className="font-display text-2xl font-bold text-emerald-950 sm:text-3xl">
                منصة رسائل إماراتية للأطفال
              </h1>
              <p className="text-sm font-semibold text-amber-700">
                سلاسل وأنشطة تفاعلية ممتعة · موسم 2026
              </p>
            </div>

            {/* Loading Progress Bar Indicator */}
            <div className="w-full max-w-xs space-y-2 pt-2">
              <div
                role="progressbar"
                aria-label="جاري تحميل المنصة"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                className="h-3.5 w-full overflow-hidden rounded-full border border-emerald-200 bg-white p-0.5 shadow-inner"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-l from-emerald-700 via-emerald-600 to-amber-500 transition-[width] duration-100 ease-out"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                <span>جاري تجهيز الأنشطة والسلاسل...</span>
                <span className="font-mono font-bold text-emerald-800 tabular-nums">
                  {percent}%
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
