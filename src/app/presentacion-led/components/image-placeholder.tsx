'use client';

import { Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImagePlaceholderProps {
  id: string;
  label: string;
  aspectRatio?: '16/9' | '1/1' | '4/3' | '3/4';
  className?: string;
}

export function ImagePlaceholder({ id, label, aspectRatio = '16/9', className }: ImagePlaceholderProps) {
  const paddingMap: Record<string, string> = {
    '16/9': 'pb-[56.25%]',
    '1/1': 'pb-[100%]',
    '4/3': 'pb-[75%]',
    '3/4': 'pb-[133.33%]',
  };

  return (
    <div
      className={cn('relative w-full overflow-hidden rounded-2xl border-2 border-dashed border-white/20 bg-gradient-to-br from-slate-800 to-slate-700', className)}
      data-placeholder-id={id}
    >
      <div className={paddingMap[aspectRatio]} />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
        <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
          <Camera className="h-6 w-6 text-white/40" />
        </div>
        <p className="text-white/40 text-sm font-medium text-center leading-tight">
          📷 {label}
        </p>
        <p className="text-white/20 text-xs text-center">
          ID: {id}
        </p>
      </div>
    </div>
  );
}
