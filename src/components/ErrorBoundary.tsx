import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'حدث خطأ غير متوقع أثناء المزامنة',
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="flex min-h-screen w-full items-center justify-center bg-[#F7F9FC] p-6 text-slate-900"
        >
          <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <ShieldAlert className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="font-display text-lg font-bold text-slate-900">
              تعذر تحميل البيانات السحابية مؤقتاً
            </h1>
            <p className="text-sm leading-relaxed text-slate-600">
              حدث خلل بسيط أثناء الاتصال بقاعدة بيانات لوحة الشرف. يمكنك إعادة تحميل الصفحة للمتابعة بأمان.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border-b-4 border-emerald-900 bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              إعادة تحميل المنصة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
