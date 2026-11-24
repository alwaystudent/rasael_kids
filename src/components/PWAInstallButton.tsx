import { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => {
          void install();
        }}
        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 whitespace-nowrap shrink-0 cursor-pointer"
        title="تثبيت المنصة للعمل بدون إنترنت"
      >
        <Download className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
        <span>تثبيت للتصفح بدون إنترنت</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Smartphone className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
          <span>حفظ على الشاشة</span>
        </button>

        {showIOSGuide && (
          <div
            dir="rtl"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
          >
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl space-y-3 text-right">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-base font-bold text-emerald-950">
                  تثبيت المنصة على آيفون وآيباد
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="إغلاق"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                1. اضغط على زر <strong>المشاركة</strong> في شريط متصفح Safari.
                <br />
                2. اختر <strong>إضافة إلى الشاشة الرئيسية</strong> لتصفح الأنشطة المحفوظة دون إنترنت.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="min-h-[40px] w-full rounded-xl bg-emerald-700 py-2 text-xs font-semibold text-white hover:bg-emerald-800 cursor-pointer"
              >
                حسناً
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
