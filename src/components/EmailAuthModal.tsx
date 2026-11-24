import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  Lock,
  Mail,
  PartyPopper,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { sanitizeCompetitorName } from '../firebase/validation';
import { soundFX } from '../utils/soundEffects';

interface EmailAuthModalProps {
  open: boolean;
  onClose: () => void;
  onGoogleSignIn: () => Promise<void>;
  onRegistrationComplete: (memberName: string) => void;
  isGoogleLoading: boolean;
  promptReason?: string | null;
}

function translateAuthError(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'صيغة البريد الإلكتروني غير صحيحة، يرجى التحقق منها.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
    case 'auth/email-already-in-use':
      return 'هذا البريد مسجّل مسبقاً، اختر "تسجيل الدخول" للمتابعة.';
    case 'auth/weak-password':
      return 'كلمة المرور قصيرة جداً، يُرجى كتابة 6 أحرف أو أكثر.';
    case 'auth/operation-not-allowed':
      return 'تسجيل الدخول بالبريد الإلكتروني غير مفعّل بعد في إعدادات المشروع على Firebase؛ يمكنك استخدام حساب Google حالياً أو تفعيل Email/Password من لوحة Firebase.';
    case 'auth/too-many-requests':
      return 'تم إرسال محاولات كثيرة متتالية، انتظر قليلاً ثم أعد المحاولة.';
    case 'auth/network-request-failed':
      return 'يلزم اتصال بالإنترنت لإتمام تسجيل الدخول لأول مرة.';
    default:
      return 'تعذر إتمام تسجيل الدخول حالياً، يرجى المحاولة مرة أخرى.';
  }
}

export function EmailAuthModal({
  open,
  onClose,
  onGoogleSignIn,
  onRegistrationComplete,
  isGoogleLoading,
  promptReason,
}: EmailAuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [childName, setChildName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [welcomeName, setWelcomeName] = useState<string | null>(null);

  if (!open) return null;

  const handleCloseModal = () => {
    setWelcomeName(null);
    setErrorMsg(null);
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanedEmail = email.trim();
    if (!cleanedEmail || !cleanedEmail.includes('@')) {
      setErrorMsg('يرجى إدخال بريد إلكتروني صحيح.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('كلمة المرور يجب أن تتكون من 6 أحرف على الأقل.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'register') {
        const cleanName = sanitizeCompetitorName(childName, 'البطل الصغير');
        const cred = await createUserWithEmailAndPassword(
          auth,
          cleanedEmail,
          password
        );
        await updateProfile(cred.user, { displayName: cleanName });
        soundFX.playCelebration();
        setPassword('');
        setWelcomeName(cleanName);
        onRegistrationComplete(cleanName);
      } else {
        const cred = await signInWithEmailAndPassword(
          auth,
          cleanedEmail,
          password
        );
        soundFX.playCelebration();
        setPassword('');
        onRegistrationComplete(cred.user.displayName || 'بطلنا');
        onClose();
      }
    } catch (error) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code: unknown }).code)
          : '';
      setErrorMsg(translateAuthError(code));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]"
    >
      <div className="w-full max-w-md rounded-2xl border border-emerald-200 bg-white p-5 sm:p-6 shadow-xl space-y-4">
        {welcomeName ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 20 }}
            className="text-center space-y-4 py-2"
          >
            <motion.div
              initial={{ scale: 0.6, rotate: -15 }}
              animate={{ scale: [1, 1.15, 1], rotate: [0, 8, -8, 0] }}
              transition={{ duration: 0.7 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border-2 border-amber-300 bg-amber-100 text-amber-600 shadow-md shadow-amber-500/20"
            >
              <PartyPopper className="h-8 w-8" aria-hidden="true" />
            </motion.div>

            <div className="space-y-1.5">
              <p className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>تم تسجيل عضويتك بنجاح</span>
              </p>
              <h2
                id="email-auth-modal-title"
                className="font-display text-xl font-bold text-emerald-950"
              >
                مرحباً بك يا {welcomeName}!
              </h2>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl border-2 border-amber-300 bg-amber-50/80 p-4 text-xs sm:text-sm leading-relaxed text-amber-950 shadow-sm"
            >
              حسابك جاهز الآن! يمكنك بدء الأنشطة وجمع النجوم وتخليد اسمك في لوحة الشرف على جميع الأجهزة فوراً.
            </motion.div>

            <button
              type="button"
              onClick={handleCloseModal}
              className="min-h-[44px] w-full rounded-xl border-b-4 border-emerald-900 bg-emerald-700 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-800 cursor-pointer"
            >
              ابدأ المغامرة الآن!
            </button>
          </motion.div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="space-y-1">
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                  <span>ابدأ رحلتك واحفظ نجومك</span>
                </p>
                <h2
                  id="email-auth-modal-title"
                  className="font-display text-lg font-bold text-emerald-950"
                >
                  تسجيل الدخول بالبريد الإلكتروني
                </h2>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                aria-label="إغلاق نافذة تسجيل الدخول"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed text-emerald-950">
              {promptReason ||
                'سجّل دخولك الآن لتُحتسب نجومك، ويُحفظ تقدمك في الأنشطة، ويظهر اسمك في لوحة الشرف وتحدي الأصدقاء!'}
            </p>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
                className={`min-h-[36px] rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white text-emerald-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                لدي حساب بالفعل
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                }}
                className={`min-h-[36px] rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white text-emerald-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                إنشاء حساب جديد
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'register' && (
                <div>
                  <label
                    htmlFor="auth-child-name"
                    className="mb-1 block text-xs font-semibold text-slate-700"
                  >
                    اسم البطل في لوحة الشرف
                  </label>
                  <div className="relative">
                    <User
                      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <input
                      id="auth-child-name"
                      type="text"
                      maxLength={32}
                      required
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      placeholder="مثال: زايد أو مريم"
                      className="min-h-[42px] w-full rounded-xl border border-slate-300 bg-slate-50 pr-9 pl-3 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="auth-email"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="auth-email"
                    type="email"
                    dir="ltr"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="min-h-[42px] w-full rounded-xl border border-slate-300 bg-slate-50 pr-9 pl-3 text-left text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="auth-password"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  كلمة المرور (6 أحرف فأكثر)
                </label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="auth-password"
                    type="password"
                    dir="ltr"
                    required
                    minLength={6}
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    className="min-h-[42px] w-full rounded-xl border border-slate-300 bg-slate-50 pr-9 pl-3 text-left text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {errorMsg && (
                <p
                  role="alert"
                  className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 leading-relaxed"
                >
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="min-h-[44px] w-full rounded-xl border-b-4 border-emerald-900 bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
              >
                {submitting
                  ? 'جاري المعالجة...'
                  : mode === 'register'
                    ? 'إنشاء الحساب والبدء بجمع النجوم'
                    : 'دخول بالبريد الإلكتروني'}
              </button>
            </form>

            <div className="flex items-center gap-3 pt-1">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[11px] font-medium text-slate-400">أو</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              disabled={isGoogleLoading}
              onClick={() => {
                void onGoogleSignIn().then(() => {
                  if (auth.currentUser) {
                    onRegistrationComplete(
                      auth.currentUser.displayName || 'بطلنا'
                    );
                    onClose();
                  }
                });
              }}
              className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
            >
              <span>
                {isGoogleLoading
                  ? 'جاري الاتصال بحساب Google...'
                  : 'المتابعة السريعة بحساب Google'}
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
