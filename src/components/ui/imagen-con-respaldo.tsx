'use client';

import React, { useState } from 'react';
import Image, { type ImageProps } from 'next/image';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ImagenConRespaldoProps extends Omit<ImageProps, 'src'> {
  src?: string | null | ImageProps['src'];
  respaldo?: React.ReactNode;
  contenedorClassName?: string;
  textoError?: string;
}

export function ImagenConRespaldo({
  src,
  alt,
  className,
  respaldo,
  contenedorClassName,
  textoError,
  onError,
  fill,
  ...props
}: ImagenConRespaldoProps) {
  const [fallo, setFallo] = useState(false);

  const sinSrc = !src || (typeof src === 'string' && src.trim() === '');

  if (fallo || sinSrc) {
    if (respaldo) {
      return <>{respaldo}</>;
    }
    return (
      <div
        role="img"
        aria-label={alt || 'Imagen no disponible'}
        className={cn(
          'flex flex-col items-center justify-center bg-slate-100 text-slate-400 rounded-lg p-2 text-center select-none border border-slate-200/60',
          fill && 'absolute inset-0 w-full h-full',
          className,
          contenedorClassName
        )}
      >
        <ImageOff className="h-6 w-6 text-slate-400 stroke-[1.5]" />
        {textoError && <span className="text-[10px] text-slate-500 font-medium mt-1">{textoError}</span>}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      fill={fill}
      onError={(e) => {
        setFallo(true);
        onError?.(e);
      }}
      {...props}
    />
  );
}

export default ImagenConRespaldo;
