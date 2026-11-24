import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  KeyRound,
  Lock,
  Mail,
  Save,
  Star,
  Trash2,
  User as UserIcon,
  X,
} from 'lucide-react';
import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  updatePassword,
  updateProfile,
  type User,
} from 'firebase/auth';
import { googleProvider } from '../firebase/config';
import { sanitizeCompetitorName } from '../firebase/validation';
import { soundFX } from '../utils/soundEffects';

interface ProfileModalProps {
  open: boolean;
  user: User | null;
  childName: string;
  stars: number;
  completedCount: number;
  onClose: () => void;
  onSaveProfileName: (newName: string) => Promise<void>;
  onDeleteAccountData: (uid: string) => Promise<void>;
  onAccountDeleted: () => void;
}

function translateProfileError(code: string): string {
  switch (code) {
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'كلمة المرور الحالية غير صحيحة، يرجى التأكد وإعادة المحاولة.';
    case 'auth/weak-password':
      return 'كلمة المرور الجديدة قصيرة جداً، يُرجى اختيار 6 أحرف على الأقل.';
    case 'auth/requires-recent-login':
      return 'لأمان حسابك، يُرجى إعادة تسجيل الدخول ثم تكرار العملية.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'تم إغلاق نافذة التحقق قبل إتمام التأكيد.';
    case 'auth/too-many-requests':
      return 'محاولات متكررة كثيرة، يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.';
    case 'auth/network-request-failed':
      return 'تعذر الاتصال بالخادم، يرجى التحقق من اتصالك بالإنترنت.';
    default:
      return 'تعذر تنفيذ العملية حالياً، يرجى المحاولة مرة أخرى.';
  }
}

export function ProfileModal({
  open,
  user,
  childName,
  stars,
  completedCount,
  onClose,
  onSaveProfileName,
  onDeleteAccountData,
  onAccountDeleted,
}: ProfileModalProps) {
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameFeedback, setNameFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteAckChecked, setDeleteAckChecked] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (open && user) {
      setNameInput(childName || user.displayName || '');
      setNameFeedback(null);
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordFeedback(null);
      setConfirmDeleteOpen(false);
      setDeleteAckChecked(false);
      setDeletePassword('');
      setDeleteError(null);
    }
  }, [open, user, childName]);

  if (!open || !user) return null;

  const hasPasswordProvider = user.providerData.some(
    (p) => p.providerId === 'password'
  );
  const hasGoogleProvider = user.providerData.some(
    (p) => p.providerId === 'google.com'
  );
  const providerLabel = hasGoogleProvider && !hasPasswordProvider
    ? 'حساب Google'
    : 'البريد الإلكتروني وكلمة المرور';

  const handleSaveName = async (e: FormEvent) => {
    e.preventDefault();
    setNameFeedback(null);

    const cleaned = sanitizeCompetitorName(nameInput, '');
    if (!cleaned) {
      setNameFeedback({
        type: 'error',
        text: 'يرجى كتابة اسم صالح من حرف واحد على الأقل.',
      });
      return;
    }

    setSavingName(true);
    try {
      await updateProfile(user, { displayName: cleaned });
      await onSaveProfileName(cleaned);
      soundFX.playSuccess();
      setNameInput(cleaned);
      setNameFeedback({
        type: 'success',
        text: 'تم تحديث الاسم بنجاح في حسابك ولوحة الشرف والشهادة!',
      });
    } catch (error) {
      console.error('Update profile name failed:', error);
      setNameFeedback({
        type: 'error',
        text: 'تعذر حفظ الاسم في السحابة، تأكد من اتصالك بالإنترنت.',
      });
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (!user.email) {
      setPasswordFeedback({
        type: 'error',
        text: 'لا يوجد بريد إلكتروني مرتبط بهذا الحساب.',
      });
      return;
    }
    if (!currentPassword) {
      setPasswordFeedback({
        type: 'error',
        text: 'يرجى إدخال كلمة المرور الحالية أولاً.',
      });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordFeedback({
        type: 'error',
        text: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        type: 'error',
        text: 'كلمة المرور الجديدة وتأكيدها غير متطابقتين.',
      });
      return;
    }

    setSavingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      soundFX.playSuccess();
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordFeedback({
        type: 'success',
        text: 'تم تغيير كلمة المرور بنجاح.',
      });
    } catch (error) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code: unknown }).code)
          : '';
      setPasswordFeedback({
        type: 'error',
        text: translateProfileError(code),
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async (e: FormEvent) => {
    e.preventDefault();
    setDeleteError(null);

    if (!deleteAckChecked) {
      setDeleteError('يرجى تحديد مربع الموافقة على الحذف النهائي أولاً.');
      return;
    }

    if (hasPasswordProvider && !deletePassword) {
      setDeleteError('يرجى إدخال كلمة المرور الحالية لتأكيد حذف الحساب.');
      return;
    }

    setDeletingAccount(true);
    try {
      // 1. Re-authenticate BEFORE deleting Firestore data to guarantee atomic account deletion
      if (hasPasswordProvider && user.email) {
        const credential = EmailAuthProvider.credential(
          user.email,
          deletePassword
        );
        await reauthenticateWithCredential(user, credential);
      } else if (hasGoogleProvider) {
        const lastSignInMs = user.metadata.lastSignInTime
          ? Date.parse(user.metadata.lastSignInTime)
          : 0;
        if (!lastSignInMs || Date.now() - lastSignInMs > 3 * 60 * 1000) {
          await reauthenticateWithPopup(user, googleProvider);
        }
      }

      // 2. Delete user progress and owned leaderboard records from Firestore + cache
      await onDeleteAccountData(user.uid);

      // 3. Delete Firebase Auth account (with fallback popup re-auth if needed for Google)
      try {
        await deleteUser(user);
      } catch (err) {
        const errCode =
          typeof err === 'object' && err !== null && 'code' in err
            ? String((err as { code: unknown }).code)
            : '';
        if (errCode === 'auth/requires-recent-login' && hasGoogleProvider) {
          await reauthenticateWithPopup(user, googleProvider);
          await deleteUser(user);
        } else {
          throw err;
        }
      }

      soundFX.playClick();
      onAccountDeleted();
    } catch (error) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code: unknown }).code)
          : '';
      setDeleteError(translateProfileError(code));
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px] overflow-y-auto"
    >
      <div className="my-auto w-full max-w-lg rounded-2xl border border-emerald-200 bg-white p-5 sm:p-6 shadow-xl space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-800">
              <UserIcon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="profile-modal-title"
                className="font-display text-lg font-bold text-emerald-950"
              >
                الملف الشخصي وإدارة الحساب
              </h2>
              <p className="text-xs text-slate-500">
                تعديل بيانات البطل، الأمان، أو إدارة الحساب
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق نافذة الملف الشخصي"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Account Info & Progress Summary */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
              <Mail className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
              <span dir="ltr">{user.email || 'حساب مسجل'}</span>
            </span>
            <span className="text-slate-500">{providerLabel}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="rounded-xl border border-amber-200 bg-white px-3.5 py-2.5">
              <p className="text-[11px] font-medium text-slate-500">مجموع النجوم</p>
              <p className="mt-0.5 inline-flex items-center gap-1 font-mono text-base font-bold text-amber-700 tabular-nums">
                <Star className="h-4 w-4 fill-amber-400 text-amber-500" aria-hidden="true" />
                {stars}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-white px-3.5 py-2.5">
              <p className="text-[11px] font-medium text-slate-500">الأنشطة المكتملة</p>
              <p className="mt-0.5 inline-flex items-center gap-1 font-mono text-base font-bold text-emerald-800 tabular-nums">
                <Award className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                {completedCount}
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Edit Display / Child Name */}
        <form onSubmit={handleSaveName} className="space-y-3">
          <div>
            <label
              htmlFor="profile-child-name"
              className="mb-1.5 block text-xs font-bold text-slate-800"
            >
              تعديل اسم البطل (يظهر في لوحة الشرف والشهادة)
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="profile-child-name"
                type="text"
                maxLength={32}
                required
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="مثال: زايد أو مريم"
                className="min-h-[42px] flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3.5 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={savingName}
                className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border-b-2 border-emerald-900 bg-emerald-700 px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                <span>{savingName ? 'جاري الحفظ...' : 'حفظ التعديل'}</span>
              </button>
            </div>
          </div>

          {nameFeedback && (
            <p
              role={nameFeedback.type === 'error' ? 'alert' : 'status'}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold ${
                nameFeedback.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-amber-200 bg-amber-50 text-amber-900'
              }`}
            >
              {nameFeedback.type === 'success' && (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
              )}
              <span>{nameFeedback.text}</span>
            </p>
          )}
        </form>

        {/* Section 2: Change Password (Email/Password Accounts) */}
        <div className="border-t border-slate-100 pt-4 space-y-3">
          {hasPasswordProvider ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <KeyRound className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  كلمة المرور وأمان الحساب
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm((prev) => !prev);
                    setPasswordFeedback(null);
                  }}
                  className="text-xs font-semibold text-emerald-800 underline-offset-4 hover:underline cursor-pointer"
                >
                  {showPasswordForm ? 'إخفاء' : 'تغيير كلمة المرور'}
                </button>
              </div>

              {showPasswordForm && (
                <form
                  onSubmit={handleChangePassword}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-3"
                >
                  <div>
                    <label
                      htmlFor="profile-current-pass"
                      className="mb-1 block text-xs font-semibold text-slate-700"
                    >
                      كلمة المرور الحالية
                    </label>
                    <input
                      id="profile-current-pass"
                      type="password"
                      dir="ltr"
                      required
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••"
                      className="min-h-[40px] w-full rounded-xl border border-slate-300 bg-white px-3 text-left text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="profile-new-pass"
                        className="mb-1 block text-xs font-semibold text-slate-700"
                      >
                        كلمة المرور الجديدة
                      </label>
                      <input
                        id="profile-new-pass"
                        type="password"
                        dir="ltr"
                        required
                        minLength={6}
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="6 أحرف فأكثر"
                        className="min-h-[40px] w-full rounded-xl border border-slate-300 bg-white px-3 text-left text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="profile-confirm-pass"
                        className="mb-1 block text-xs font-semibold text-slate-700"
                      >
                        تأكيد كلمة المرور الجديدة
                      </label>
                      <input
                        id="profile-confirm-pass"
                        type="password"
                        dir="ltr"
                        required
                        minLength={6}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••"
                        className="min-h-[40px] w-full rounded-xl border border-slate-300 bg-white px-3 text-left text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  {passwordFeedback && (
                    <p
                      role={passwordFeedback.type === 'error' ? 'alert' : 'status'}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                        passwordFeedback.type === 'success'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                          : 'border-amber-200 bg-amber-50 text-amber-900'
                      }`}
                    >
                      {passwordFeedback.text}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-60 cursor-pointer"
                  >
                    <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      {savingPassword ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
                    </span>
                  </button>
                </form>
              )}
            </>
          ) : (
            <p className="text-xs text-slate-500">
              تتم إدارة كلمة المرور والأمان لهذا الحساب مباشرة عبر إعدادات حساب Google الخاص بك.
            </p>
          )}
        </div>

        {/* Section 3: Danger Zone - Delete Account */}
        <div className="border-t border-rose-100 pt-4 space-y-3">
          {!confirmDeleteOpen ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50/50 p-3.5">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-rose-950">حذف الحساب نهائياً</p>
                <p className="text-[11px] text-rose-800">
                  يحذف حسابك وجميع نجومك وسجلاتك من لوحة الشرف بشكل دائم.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setConfirmDeleteOpen(true);
                  setDeleteError(null);
                }}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-rose-300 bg-white px-3.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>حذف الحساب</span>
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleDeleteAccount}
              className="rounded-xl border-2 border-rose-300 bg-rose-50/70 p-4 space-y-3"
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle
                  className="mt-0.5 h-5 w-5 shrink-0 text-rose-600"
                  aria-hidden="true"
                />
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-bold text-rose-950">
                    تأكيد الحذف النهائي للحساب
                  </p>
                  <p className="text-xs leading-relaxed text-rose-900">
                    سيتم مسح بيانات التقدم، النجوم، الأذكار، وإزالة اسمك والمتنافسين المسجلين تحت حسابك من لوحة الشرف نهائياً ولا يمكن استرجاعها.
                  </p>
                </div>
              </div>

              {hasPasswordProvider && (
                <div>
                  <label
                    htmlFor="profile-delete-pass"
                    className="mb-1 block text-xs font-semibold text-rose-950"
                  >
                    أدخل كلمة المرور الحالية لتأكيد الحذف
                  </label>
                  <input
                    id="profile-delete-pass"
                    type="password"
                    dir="ltr"
                    required
                    autoComplete="current-password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="••••••"
                    className="min-h-[40px] w-full rounded-xl border border-rose-300 bg-white px-3 text-left text-sm text-slate-900 focus:border-rose-600 focus:outline-none"
                  />
                </div>
              )}

              <label className="flex items-start gap-2 text-xs font-semibold text-rose-950 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteAckChecked}
                  onChange={(e) => setDeleteAckChecked(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-rose-400 text-rose-700 focus:ring-rose-600"
                />
                <span>أؤكد رغبتي في حذف الحساب وجميع بياناته نهائياً.</span>
              </label>

              {deleteError && (
                <p
                  role="alert"
                  className="rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs font-semibold text-rose-800"
                >
                  {deleteError}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={deletingAccount}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-rose-700 px-4 py-2 text-xs font-bold text-white hover:bg-rose-800 disabled:opacity-60 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    {deletingAccount ? 'جاري حذف الحساب...' : 'تأكيد حذف الحساب نهائياً'}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={deletingAccount}
                  onClick={() => {
                    setConfirmDeleteOpen(false);
                    setDeleteError(null);
                  }}
                  className="inline-flex min-h-[40px] items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
