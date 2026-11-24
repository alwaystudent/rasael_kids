import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, MailCheck, Sparkles, Star, X } from 'lucide-react';

interface WelcomeMemberBannerProps {
  visible: boolean;
  memberName: string;
  isEmailVerified: boolean;
  onDismiss: () => void;
  onReloadVerification: () => void;
  onResendVerification: () => void;
}

export function WelcomeMemberBanner({
  visible,
  memberName,
  isEmailVerified,
  onDismiss,
  onReloadVerification,
  onResendVerification,
}: WelcomeMemberBannerProps) {
  const displayName = memberName.trim() || 'بطلنا الجديد';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="welcome-member-banner"
          initial={{ opacity: 0, y: -24, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -18, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          dir="rtl"
          role="status"
          aria-live="polite"
          className="relative overflow-hidden rounded-2xl border-2 border-amber-400 bg-gradient-to-l from-emerald-50 via-amber-50/90 to-white p-4 sm:p-5 shadow-lg shadow-amber-500/15 ring-4 ring-amber-300/40"
        >
          {/* Subtle Animated Shimmer Sweep */}
          <motion.div
            aria-hidden="true"
            initial={{ x: '100%' }}
            animate={{ x: '-120%' }}
            transition={{ duration: 1.6, ease: 'easeInOut', repeat: 1, repeatDelay: 0.6 }}
            className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent"
          />

          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <motion.div
                initial={{ rotate: -14, scale: 0.7 }}
                animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.12, 1] }}
                transition={{ duration: 0.75, ease: 'easeOut' }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-300 bg-amber-400 text-white shadow-sm"
              >
                <Sparkles className="h-6 w-6" aria-hidden="true" />
              </motion.div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                    تم تسجيل عضويتك بنجاح!
                  </span>
                </div>

                <h2 className="font-display text-base sm:text-lg font-bold text-emerald-950 leading-snug">
                  أهلاً ومرحباً بك يا {displayName} في منصة رسائل إماراتية للأطفال!
                </h2>

                <p className="text-xs sm:text-sm leading-relaxed text-slate-700">
                  {isEmailVerified
                    ? 'حسابك مفعّل وجاهز الآن — اجمع النجوم من الأنشطة اليومية وسيتألق اسمك في لوحة الشرف.'
                    : 'أرسلنا رابط التفعيل إلى بريدك الإلكتروني؛ افتح الرابط لتظهر نجومك وإنجازاتك مع أصدقائك في لوحة الشرف.'}
                </p>

                {!isEmailVerified && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={onReloadVerification}
                      className="inline-flex min-h-[34px] items-center gap-1.5 rounded-xl border-b-2 border-emerald-900 bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 cursor-pointer"
                    >
                      <MailCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      تم التفعيل؟ حدّث الحالة الآن
                    </button>
                    <button
                      type="button"
                      onClick={onResendVerification}
                      className="min-h-[34px] rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-50 cursor-pointer"
                    >
                      إعادة إرسال رابط التفعيل
                    </button>
                  </div>
                )}

                {isEmailVerified && (
                  <p className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-500" aria-hidden="true" />
                    <span>كل نشاط تكمله الآن يُضاف مباشرة إلى رصيد نجومك!</span>
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onDismiss}
              aria-label="إغلاق الرسالة الترحيبية"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-white/80 text-slate-600 hover:bg-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
