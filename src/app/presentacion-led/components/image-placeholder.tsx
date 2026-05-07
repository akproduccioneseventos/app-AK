'use client';

/* eslint-disable @next/next/no-img-element */

import { Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImagePlaceholderProps {
  id: string;
  label: string;
  aspectRatio?: '16/9' | '1/1' | '4/3' | '3/4';
  className?: string;
  imageUrl?: string | null;
}

type SampleImageRule = {
  terms: string[];
  url: string;
};

const SAMPLE_IMAGE_RULES: SampleImageRule[] = [
  {
    terms: ['salon', 'club', 'venue', 'lugar'],
    url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1400&q=82',
  },
  {
    terms: ['decoracion', 'decoración', 'ambientacion', 'ambientación', 'flores'],
    url: 'https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&w=1400&q=82',
  },
  {
    terms: ['catering', 'menu', 'menú', 'entrada', 'comida'],
    url: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1400&q=82',
  },
  {
    terms: ['barra', 'tragos', 'brindis'],
    url: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1400&q=82',
  },
  {
    terms: ['dj', 'musica', 'música', 'fiesta', 'pista'],
    url: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1400&q=82',
  },
  {
    terms: ['foto', 'video', 'galeria', 'galería'],
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=82',
  },
  {
    terms: ['invitacion', 'invitación', 'portal', 'tecnologia', 'tecnología'],
    url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1400&q=82',
  },
];

const FALLBACK_SAMPLE_IMAGE = 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1400&q=82';

function isSafeImageUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  return /^https?:\/\//i.test(url) || /^data:image\//i.test(url);
}

function getSampleImage(id: string, label: string) {
  const searchable = `${id} ${label}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const rule = SAMPLE_IMAGE_RULES.find((candidate) =>
    candidate.terms.some((term) => searchable.includes(term.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase())),
  );

  return rule?.url ?? FALLBACK_SAMPLE_IMAGE;
}

export function ImagePlaceholder({ id, label, aspectRatio = '16/9', className, imageUrl }: ImagePlaceholderProps) {
  const paddingMap: Record<string, string> = {
    '16/9': 'pb-[56.25%]',
    '1/1': 'pb-[100%]',
    '4/3': 'pb-[75%]',
    '3/4': 'pb-[133.33%]',
  };

  const resolvedImageUrl = isSafeImageUrl(imageUrl) ? imageUrl : getSampleImage(id, label);

  return (
    <div
      className={cn('relative w-full overflow-hidden rounded-2xl border border-white/20 bg-slate-900 shadow-2xl shadow-slate-950/20', className)}
      data-placeholder-id={id}
    >
      <div className={paddingMap[aspectRatio]} />
      <img
        src={resolvedImageUrl}
        alt={label}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.05)_0%,rgba(15,23,42,0.78)_100%)]" />
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur">
          <Camera className="h-5 w-5 text-white" />
        </div>
        <p className="text-sm font-black leading-tight text-white sm:text-base">{label}</p>
        <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/50">
          Imagen de ejemplo reemplazable - ID {id}
        </p>
      </div>
    </div>
  );
}
