'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

interface LottieAnimationProps {
  src: string;
  width?: string;
  height?: string;
  loop?: boolean;
  autoplay?: boolean;
  speed?: number;
  className?: string;
}

/**
 * Componente Lottie 100% Nativo (sin dependencias NPM pesadas)
 * Usa el Web Component oficial de LottieFiles por CDN.
 */
export function LottieAnimation({ 
  src, 
  width = '100%', 
  height = '100%', 
  loop = true, 
  autoplay = true,
  speed = 1,
  className = ''
}: LottieAnimationProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Si ya existe el tag custom en la ventana, marcamos como cargado
    if (customElements.get('lottie-player')) {
      setIsLoaded(true);
    }
  }, []);

  return (
    <div style={{ width, height }} className={`relative flex items-center justify-center ${className}`}>
      {!isLoaded && (
        <Script 
          src="https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js"
          strategy="lazyOnload"
          onLoad={() => setIsLoaded(true)}
        />
      )}
      
      {isLoaded && (
        // Usamos dangerouslySetInnerHTML para evitar errores de tipeo de React con Custom Elements
        <div 
          style={{ width: '100%', height: '100%' }}
          dangerouslySetInnerHTML={{
            __html: `
              <lottie-player 
                src="${src}" 
                background="transparent" 
                speed="${speed}" 
                style="width: 100%; height: 100%;" 
                ${loop ? 'loop' : ''} 
                ${autoplay ? 'autoplay' : ''}
              ></lottie-player>
            `
          }}
        />
      )}
    </div>
  );
}
