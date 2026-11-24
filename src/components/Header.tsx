import {
  Award,
  Compass,
  Flame,
  Home,
  Layers,
  LogOut,
  Mail,
  Menu,
  Newspaper,
  Star,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { PlatformLogo } from './PlatformLogo';
import { PWAInstallButton } from './PWAInstallButton';

interface TopHeaderBarProps {
  activeSection: string;
  stars: number;
  isMuted: boolean;
  isSignedIn: boolean;
  onToggleMute: () => void;
  onStartActivity: () => void;
  onOpenMobileMenu: () => void;
  onNavigate: (sectionId: string) => void;
  onOpenEmailAuth: () => void;
  onSignOut: () => void;
}

interface SidebarNavProps {
  activeSection: string;
  stars: number;
  isMuted: boolean;
  isSignedIn: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleMute: () => void;
  onStartActivity: () => void;
  onNavigate: (sectionId: string) => void;
  onOpenEmailAuth: () => void;
}

const NAV_ITEMS = [
  { id: 'hero', label: 'الرئيسية', icon: Home },
  { id: 'daily-challenge', label: 'تحدي اليوم (×2)', icon: Flame },
  { id: 'series', label: 'السلاسل التعليمية', icon: Layers },
  { id: 'interactive-stage', label: 'الأنشطة التفاعلية', icon: Compass },
  { id: 'leaderboard', label: 'لوحة الشرف', icon: Trophy },
  { id: 'channel-feed', label: 'منشورات 2026', icon: Newspaper },
  { id: 'achievements', label: 'حصاد النجوم والشهادة', icon: Award },
];

export function TopHeaderBar({
  activeSection,
  stars,
  isMuted,
  isSignedIn,
  onToggleMute,
  onStartActivity,
  onOpenMobileMenu,
  onNavigate,
  onOpenEmailAuth,
  onSignOut,
}: TopHeaderBarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm no-print">
      <div className="flex w-full items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
        {/* Right-aligned Mobile Menu Toggle + Desktop Quick Links (without logo or platform name) */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="فتح القائمة الجانبية"
            className="flex min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 md:hidden cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>

          <nav
            aria-label="التنقل العلوي السريع"
            className="hidden md:flex items-center gap-1 overflow-x-auto"
          >
            {NAV_ITEMS.slice(0, 5).map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => onNavigate(item.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-900'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>

        {/* Left-aligned Quick Actions: Install PWA, Email Sign-In, Stars, Sound, Start CTA */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden lg:block">
            <PWAInstallButton />
          </div>

          {!isSignedIn ? (
            <button
              type="button"
              onClick={onOpenEmailAuth}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-950 hover:bg-amber-100 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Mail className="h-3.5 w-3.5 text-amber-700" aria-hidden="true" />
              <span>دخول بالبريد</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onSignOut}
              className="hidden sm:inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 whitespace-nowrap shrink-0 cursor-pointer"
              title="تسجيل الخروج"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>خروج</span>
            </button>
          )}

          <a
            href="#achievements"
            onClick={() => onNavigate('achievements')}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100/70 tabular-nums"
            title="مجموع نجومك"
          >
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" aria-hidden="true" />
            <span>{stars}</span>
          </a>

          <button
            type="button"
            onClick={onToggleMute}
            aria-pressed={isMuted}
            aria-label={isMuted ? 'تشغيل المؤثرات الصوتية' : 'كتم المؤثرات الصوتية'}
            className={`hidden sm:inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              isMuted
                ? 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                : 'border-amber-200 bg-amber-50/70 text-amber-900 hover:bg-amber-100/70'
            }`}
          >
            {isMuted ? (
              <>
                <VolumeX className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                <span>مكتوم</span>
              </>
            ) : (
              <>
                <Volume2 className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                <span>الصوت</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onStartActivity}
            className="min-h-[38px] rounded-xl border-b-2 border-emerald-900 bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 whitespace-nowrap shrink-0 cursor-pointer"
          >
            ابدأ النشاط
          </button>
        </div>
      </div>
    </header>
  );
}

export function SidebarNav({
  activeSection,
  stars,
  isMuted,
  isSignedIn,
  mobileOpen,
  onCloseMobile,
  onToggleMute,
  onStartActivity,
  onNavigate,
  onOpenEmailAuth,
}: SidebarNavProps) {
  const handleItemClick = (id: string) => {
    onCloseMobile();
    onNavigate(id);
  };

  const renderNavContent = (showCloseButton = false) => (
    <div className="flex h-full flex-col justify-between gap-6 p-4 sm:p-5 text-right">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          {showCloseButton ? (
            <a
              href="#hero"
              onClick={() => handleItemClick('hero')}
              className="flex items-center gap-2.5 text-right"
            >
              <PlatformLogo size={42} />
              <div className="min-w-0">
                <span className="block font-display text-sm font-bold text-emerald-900 truncate">
                  رسائل إماراتية للأطفال
                </span>
                <span className="block text-[11px] font-medium text-amber-700">
                  التنقل السريع
                </span>
              </div>
            </a>
          ) : (
            <span className="text-xs font-bold text-slate-500">
              أقسام المنصة التفاعلية
            </span>
          )}

          {showCloseButton && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="إغلاق القائمة الجانبية"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav aria-label="القائمة الجانبية الرئيسية" className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => handleItemClick(item.id)}
                className={`flex min-h-[42px] items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-emerald-50 font-semibold text-emerald-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">{item.label}</span>
              </a>
            );
          })}
        </nav>
      </div>

      {/* Bottom Controls: Auth Prompt or Star Summary + Sound Toggle + Primary CTA */}
      <div className="space-y-3 border-t border-slate-100 pt-4">
        {!isSignedIn && (
          <button
            type="button"
            onClick={() => {
              onCloseMobile();
              onOpenEmailAuth();
            }}
            className="flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-950 hover:bg-amber-100 cursor-pointer"
          >
            <Mail className="h-3.5 w-3.5 text-amber-700" aria-hidden="true" />
            <span>سجّل بالبريد لحفظ نجومك</span>
          </button>
        )}

        <div className="flex items-center justify-between rounded-xl border border-amber-200/80 bg-amber-50/50 px-3.5 py-2.5 text-xs">
          <span className="font-medium text-slate-700">نجومك المكتسبة</span>
          <span className="inline-flex items-center gap-1 font-mono text-sm font-bold text-amber-700 tabular-nums">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" aria-hidden="true" />
            {stars}
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleMute}
          aria-pressed={isMuted}
          className={`flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
            isMuted
              ? 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              : 'border-amber-200 bg-amber-50/70 text-amber-900 hover:bg-amber-100/70'
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
              <span>المؤثرات الصوتية: مفعّلة</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            onCloseMobile();
            onStartActivity();
          }}
          className="min-h-[42px] w-full rounded-xl border-b-4 border-emerald-900 bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 cursor-pointer"
        >
          ابدأ النشاط الآن
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop/Tablet Persistent Right Sidebar (RTL first flex child sits on the Right) */}
      <aside
        aria-label="الشريط الجانبي"
        className="hidden md:block md:w-64 md:shrink-0 border-l border-slate-200 bg-white no-print"
      >
        <div className="sticky top-[68px] h-[calc(100vh-68px)] overflow-y-auto">
          {renderNavContent(false)}
        </div>
      </aside>

      {/* Mobile Right Slide-Over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex justify-start bg-slate-900/40 md:hidden no-print">
          <div className="relative h-full w-72 max-w-[85vw] bg-white shadow-xl">
            {renderNavContent(true)}
          </div>
          <div
            className="flex-1"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
        </div>
      )}
    </>
  );
}
