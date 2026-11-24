import { useState } from 'react';
import { BookOpen } from 'lucide-react';

interface PlatformLogoProps {
  size?: number;
  className?: string;
}

export function PlatformLogo({ size = 48, className = '' }: PlatformLogoProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 ${className}`}
        role="img"
        aria-label="شعار قناة رسائل إماراتية للأطفال"
      >
        <BookOpen className="h-6 w-6" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white ${className}`}
    >
      <img
        src="/src/assets/images/channel_telegram_logo.jpg"
        alt="شعار قناة رسائل إماراتية للأطفال على تيليجرام"
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className="h-full w-full scale-110 object-contain"
      />
    </div>
  );
}
