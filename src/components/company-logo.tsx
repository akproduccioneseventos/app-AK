'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { canUseNextImage } from '@/lib/next-image-url';

const SIZE_MAP = {
  xs: { container: 'w-6 h-6', text: 'text-[8px]', pixels: 24 },
  sm: { container: 'w-9 h-9', text: 'text-xs', pixels: 36 },
  md: { container: 'w-14 h-14', text: 'text-base', pixels: 56 },
  lg: { container: 'w-20 h-20', text: 'text-xl', pixels: 80 },
  xl: { container: 'w-28 h-28', text: 'text-3xl', pixels: 112 },
};

interface CompanyLogoProps {
  size?: keyof typeof SIZE_MAP;
  className?: string;
  src?: string;
  animate?: boolean;
  /**
   * Logo en blanco, para fondos oscuros.
   *
   * Antes esto se hacía poniéndole `brightness-0 invert` al componente entero
   * desde afuera. Un filtro CSS se aplica a todo lo que hay adentro y no se
   * puede esquivar desde un hijo, así que también blanqueaba el respaldo —el
   * círculo rojo con "AK" que se ve mientras carga la imagen— y quedaba un
   * globo blanco vacío en la portada del simulador. Con esta opción el filtro
   * va sólo sobre la imagen.
   */
  blanco?: boolean;
}

export function CompanyLogo({ size = 'md', className, src, animate = true, blanco = false }: CompanyLogoProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { container, text, pixels } = SIZE_MAP[size];
  const imgSrc = src || '/logo_ak_producciones.png';
  const filtroBlanco = blanco ? 'brightness-0 invert' : '';

  return (
    <motion.div
      whileHover={animate ? { scale: 1.08, rotate: [0, -3, 3, 0] } : undefined}
      transition={{ duration: 0.3 }}
      className={cn('relative shrink-0 transition-transform duration-300', container, className)}
    >
      {(!isLoaded || hasError) && (
        <div
          aria-hidden="true"
          className={cn(
            'absolute inset-0 flex items-center justify-center rounded-full bg-red-600 font-black text-white shadow-md animate-pulse',
            text
          )}
        >
          AK
        </div>
      )}
      {!hasError && (canUseNextImage(imgSrc) ? (
        <Image
          src={imgSrc}
          alt="AK Producciones"
          width={pixels}
          height={pixels}
          className={cn('h-full w-full object-contain transition-opacity duration-300', filtroBlanco, isLoaded ? 'opacity-100' : 'opacity-0')}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- A custom logo may use an external host outside Next's allowlist. */}
          <img
            src={imgSrc}
            alt="AK Producciones"
            width={pixels}
            height={pixels}
            className={cn('h-full w-full object-contain transition-opacity duration-300', filtroBlanco, isLoaded ? 'opacity-100' : 'opacity-0')}
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
          />
        </>
      ))}
    </motion.div>
  );
}
