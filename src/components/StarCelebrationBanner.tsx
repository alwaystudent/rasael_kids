import { AnimatePresence, motion } from 'motion/react';
import { Award, Star } from 'lucide-react';

export interface CelebrationEvent {
  id: number;
  title: string;
  starsEarned: number;
}

interface StarCelebrationBannerProps {
  event: CelebrationEvent | null;
}

export function StarCelebrationBanner({ event }: StarCelebrationBannerProps) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4 no-print"
    >
      <AnimatePresence>
        {event && (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto flex items-center gap-3 rounded-2xl border-2 border-amber-300 bg-white px-5 py-3.5 shadow-lg"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Award className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="text-right">
              <p className="font-display text-sm font-bold text-slate-900">
                {event.title}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-emerald-700 tabular-nums">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" aria-hidden="true" />
                +{event.starsEarned} نجمة جديدة في حصادك
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
