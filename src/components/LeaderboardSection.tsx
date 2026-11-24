import { useEffect, useState, type FormEvent } from 'react';
import {
  Award,
  Check,
  Cloud,
  Crown,
  LogIn,
  LogOut,
  Medal,
  Plus,
  Star,
  UserCheck,
} from 'lucide-react';
import { soundFX } from '../utils/soundEffects';

export interface LeaderboardEntry {
  id: string;
  name: string;
  stars: number;
  completedCount: number;
  isCurrentUser?: boolean;
  isPeer?: boolean;
  isCloud?: boolean;
  lastDailyChallengeDate?: string | null;
}

interface LeaderboardSectionProps {
  childName: string;
  onChangeChildName: (name: string) => void;
  onCommitChildName: (name: string) => void;
  currentStars: number;
  currentCompletedCount: number;
  familyPeers: LeaderboardEntry[];
  onAddFamilyMember: (name: string) => void;
  onSelectActiveProfile: (entryId: string) => void;
  isSignedIn: boolean;
  isAuthLoading: boolean;
  authDisplayLabel: string;
  authNotice: string | null;
  onSignInWithGoogle: () => void;
  onSignOut: () => void;
}

function getRankTitle(stars: number): string {
  if (stars >= 120) return 'نجم الرسائل الإماراتية';
  if (stars >= 50) return 'سفير القيم والآداب';
  return 'مستكشف المعرفة';
}

export function LeaderboardSection({
  childName,
  onChangeChildName,
  onCommitChildName,
  currentStars,
  currentCompletedCount,
  familyPeers,
  onAddFamilyMember,
  onSelectActiveProfile,
  isSignedIn,
  isAuthLoading,
  authDisplayLabel,
  authNotice,
  onSignInWithGoogle,
  onSignOut,
}: LeaderboardSectionProps) {
  const [nameInput, setNameInput] = useState(childName);
  const [nameSaved, setNameSaved] = useState(false);
  const [newSiblingName, setNewSiblingName] = useState('');

  useEffect(() => {
    setNameInput(childName);
  }, [childName]);

  const displayName = childName.trim() || 'البطل الصغير (أنت)';

  const combinedEntries: LeaderboardEntry[] = [
    {
      id: 'current-learner',
      name: displayName,
      stars: currentStars,
      completedCount: currentCompletedCount,
      isCurrentUser: true,
      isCloud: isSignedIn,
    },
    ...familyPeers,
  ].sort((a, b) => {
    if (b.stars !== a.stars) return b.stars - a.stars;
    return b.completedCount - a.completedCount;
  });

  const currentRank =
    combinedEntries.findIndex((entry) => entry.isCurrentUser) + 1;

  const topThree = combinedEntries.slice(0, 3);
  const cloudCount = combinedEntries.filter((e) => e.isCloud).length;

  const handleSaveName = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = nameInput.trim();
    onChangeChildName(cleaned);
    onCommitChildName(cleaned);
    soundFX.playSuccess();
    setNameSaved(true);
    window.setTimeout(() => setNameSaved(false), 2000);
  };

  const handleAddMember = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = newSiblingName.trim();
    if (!cleaned) return;
    onAddFamilyMember(cleaned);
    soundFX.playStar();
    setNewSiblingName('');
  };

  return (
    <section
      id="leaderboard"
      aria-labelledby="leaderboard-title"
      className="border-t border-slate-200 bg-[#F7F9FC] py-10 sm:py-12 no-print"
    >
      <div className="w-full px-5 sm:px-8 lg:px-10">
        {/* Cloud Cross-Device Sync Status Strip */}
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-sky-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
              <Cloud className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-slate-900">
                {isSignedIn
                  ? `المزامنة السحابية مفعّلة · يظهر اسمك ومنافسوك على جميع الأجهزة (${authDisplayLabel})`
                  : 'لوحة الشرف المشتركة عبر جميع الأجهزة'}
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isSignedIn
                  ? `أسماء ونجوم جميع الأبطال (${cloudCount} مشاركاً متزامناً) تتحدّث مباشرة عبر الأجهزة في لوحة الشرف وتحدي الأصدقاء.`
                  : 'تظهر هنا أسماء الأصدقاء والمتنافسين من كل الأجهزة مباشرة؛ سجّل الدخول بحساب Google لنشر اسمك وإضافة متنافسين جدد للجميع.'}
              </p>
              {authNotice && (
                <p className="text-xs font-semibold text-amber-800 pt-0.5" role="status">
                  {authNotice}
                </p>
              )}
            </div>
          </div>

          <div className="shrink-0">
            {isSignedIn ? (
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 whitespace-nowrap cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                تسجيل الخروج
              </button>
            ) : (
              <button
                type="button"
                disabled={isAuthLoading}
                onClick={() => {
                  soundFX.playClick();
                  onSignInWithGoogle();
                }}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border-b-2 border-sky-900 bg-sky-700 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-800 disabled:opacity-60 whitespace-nowrap cursor-pointer"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                <span>
                  {isAuthLoading
                    ? 'جاري تسجيل الدخول...'
                    : 'سجّل بحساب Google لنشر اسمك للجميع'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Harmonious Section Heading + Name Customization Bar */}
        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1.5 max-w-2xl">
            <p className="text-xs font-semibold text-amber-700">
              المنافسة الإيجابية · متزامنة عبر الأجهزة
            </p>
            <h2
              id="leaderboard-title"
              className="font-display text-lg font-bold text-amber-950 sm:text-xl leading-snug"
            >
              <span className="text-emerald-800">لوحة الشرف</span> — فرسان النجوم والمعرفة
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              تعرّف على ترتيب الأبطال حسب النجوم المكتسبة، وخصّص اسمك ليظهر في القائمة على جميع الأجهزة ويتقدم مع كل نشاط تنجزه.
            </p>
          </div>

          <form
            onSubmit={handleSaveName}
            className="flex flex-wrap items-end gap-2.5 rounded-2xl border border-amber-200 bg-white p-3.5"
          >
            <div className="min-w-0">
              <label
                htmlFor="leaderboard-name-input"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                تخصيص اسمك في لوحة الشرف
              </label>
              <input
                id="leaderboard-name-input"
                type="text"
                maxLength={32}
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  onChangeChildName(e.target.value);
                }}
                placeholder="اكتب اسمك (مثال: زايد)"
                className="min-h-[38px] w-44 max-w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <button
              type="submit"
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border-b-2 border-emerald-900 bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {nameSaved ? (
                <>
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  تم الحفظ
                </>
              ) : (
                <>
                  <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  تثبيت الاسم
                </>
              )}
            </button>
          </form>
        </div>

        {/* Top 3 Podium Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {topThree.map((entry, idx) => {
            const position = idx + 1;
            const isFirst = position === 1;
            const isSecond = position === 2;

            return (
              <div
                key={entry.id}
                className={`rounded-2xl border p-4 sm:p-5 transition-colors ${
                  entry.isCurrentUser
                    ? 'border-emerald-600 bg-emerald-50/60'
                    : isFirst
                      ? 'border-amber-300 bg-amber-50/40'
                      : 'border-slate-200 bg-white'
                }`}
              >
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl font-mono text-xs font-bold tabular-nums ${
                        isFirst
                          ? 'bg-amber-500 text-white'
                          : isSecond
                            ? 'bg-slate-700 text-white'
                            : 'bg-amber-800 text-white'
                      }`}
                    >
                      {isFirst ? (
                        <Crown className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Medal className="h-4 w-4" aria-hidden="true" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-600 tabular-nums">
                      المركز {position}
                    </span>
                  </div>

                  {entry.isCurrentUser ? (
                    <span className="text-xs font-bold text-emerald-800">
                      ملفك الحالي
                    </span>
                  ) : entry.isCloud ? (
                    <span className="text-xs font-semibold text-sky-700">
                      عبر الأجهزة
                    </span>
                  ) : null}
                </div>

                <h3 className="font-display text-base font-bold text-slate-900 truncate">
                  {entry.name}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {getRankTitle(entry.stars)} ·{' '}
                  <span className="tabular-nums">{entry.completedCount} نشاطاً</span>
                </p>

                <div className="mt-3 flex items-center justify-between border-t border-slate-200/70 pt-2.5">
                  <span className="text-xs font-medium text-slate-600">مجموع النجوم</span>
                  <span className="inline-flex items-center gap-1 font-mono text-lg font-bold text-amber-700 tabular-nums">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-500" aria-hidden="true" />
                    {entry.stars}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Full Leaderboard Table + Add Family/Class Competitor */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3.5">
              <h3 className="font-display text-sm sm:text-base font-bold text-emerald-950">
                ترتيب جميع المتعلمين المشاركين
              </h3>
              <span className="text-xs font-semibold text-slate-600 tabular-nums">
                ترتيبك الآن: #{currentRank} من {combinedEntries.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-4 py-2.5">المركز</th>
                    <th className="px-4 py-2.5">الاسم</th>
                    <th className="px-4 py-2.5">الوسام</th>
                    <th className="px-4 py-2.5">الأنشطة</th>
                    <th className="px-4 py-2.5">النجوم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {combinedEntries.map((entry, idx) => (
                    <tr
                      key={entry.id}
                      className={
                        entry.isCurrentUser
                          ? 'bg-emerald-50/70 font-semibold text-emerald-950'
                          : 'hover:bg-slate-50/60 text-slate-800'
                      }
                    >
                      <td className="px-4 py-3 font-mono text-xs font-bold tabular-nums">
                        #{idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span>{entry.name}</span>
                          {entry.isCurrentUser ? (
                            <span className="text-xs font-bold text-emerald-700">
                              (أنت)
                            </span>
                          ) : entry.isCloud ? (
                            <span className="text-xs font-medium text-sky-700">
                              · متزامن
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {getRankTitle(entry.stars)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs tabular-nums text-slate-700">
                        {entry.completedCount}
                      </td>
                      <td className="px-4 py-3 font-mono text-sm font-bold text-amber-700 tabular-nums">
                        {entry.stars}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {combinedEntries.length <= 1 && (
                <p className="border-t border-slate-100 bg-slate-50/50 px-5 py-3 text-xs text-slate-500">
                  لا يوجد متنافسون مسجّلون بعد — خصّص اسمك وسجّل الدخول بحساب Google أو أضف أسماء الإخوة والأصدقاء ليظهروا هنا عبر جميع الأجهزة.
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 min-w-0 flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-amber-700">
                <Award className="h-4 w-4 shrink-0" aria-hidden="true" />
                <h3 className="font-display text-sm sm:text-base font-bold text-sky-950">
                  منافسة الإخوة أو الفصل
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                يمكن للأم أو المعلم إضافة اسم أخ أو زميل ليتنافسوا معاً، وعند تسجيل الدخول يظهرون على جميع الأجهزة.
              </p>

              <form onSubmit={handleAddMember} className="space-y-2 pt-1">
                <label
                  htmlFor="add-competitor-input"
                  className="block text-xs font-semibold text-slate-700"
                >
                  أضف متنافساً جديداً للوحة الشرف
                </label>
                <div className="flex w-full min-w-0 items-center gap-2">
                  <input
                    id="add-competitor-input"
                    type="text"
                    maxLength={28}
                    value={newSiblingName}
                    onChange={(e) => setNewSiblingName(e.target.value)}
                    placeholder="مثال: سارة"
                    className="min-h-[38px] w-0 min-w-0 flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-900 focus:border-sky-600 focus:bg-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border-b-2 border-sky-900 bg-sky-700 px-3 text-xs font-semibold text-white hover:bg-sky-800 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    إضافة
                  </button>
                </div>
              </form>
            </div>

            {familyPeers.some((p) => !p.isPeer) && (
              <div className="border-t border-slate-100 pt-3">
                <p className="mb-2 text-xs font-semibold text-slate-500">
                  تبديل اللاعب النشط:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {familyPeers
                    .filter((p) => !p.isPeer)
                    .map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => {
                          soundFX.playClick();
                          onSelectActiveProfile(member.id);
                        }}
                        className="min-h-[34px] rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 hover:border-emerald-600 hover:bg-emerald-50 cursor-pointer"
                      >
                        اللعب باسم {member.name}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
