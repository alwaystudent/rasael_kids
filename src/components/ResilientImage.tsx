import { useState } from 'react';
import { BookOpen } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectClassName?: string;
}

export function ResilientImage({
  src,
  alt,
  className = '',
  aspectClassName = 'aspect-[4/3]',
}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={`${aspectClassName} flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-emerald-50 via-slate-50 to-amber-50 p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-200 bg-white text-emerald-700">
          <BookOpen className="h-6 w-6" aria-hidden="true" />
        </div>
        <p className="max-w-xs text-sm font-medium text-slate-600">{alt}</p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
      loading="lazy"
    />
  );
}
