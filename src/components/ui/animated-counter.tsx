'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

interface AnimatedCounterProps {
  value: string | number;
  duration?: number;
  className?: string;
}

/**
 * Contador que trepa suavemente desde cero cuando el usuario llega al elemento.
 * Se anima una sola vez (once: true).
 * Quien tiene reducción de movimiento activada ve el número final de inmediato.
 */
export function AnimatedCounter({
  value,
  duration = 1600,
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const reduceMotion = useReducedMotion();

  const stringVal = String(value);
  const match = stringVal.match(/(\d+)/);
  const targetNumber = match ? parseInt(match[1], 10) : null;
  // El primer dibujo y lo que sale del servidor muestran el número final (Google y SSR)
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (reduceMotion || !isInView || targetNumber === null || hasAnimated) {
      return;
    }

    setHasAnimated(true);
    setCurrentNumber(0);

    let startTime: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrentNumber(Math.round(targetNumber * eased));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isInView, reduceMotion, targetNumber, duration, hasAnimated]);

  if (reduceMotion || targetNumber === null) {
    return <span ref={ref} className={className}>{stringVal}</span>;
  }

  // Si aún no se animó en el cliente o está en el servidor, muestra el número final.
  const displayNum = currentNumber !== null ? currentNumber : targetNumber;
  const renderedText = stringVal.replace(String(targetNumber), String(displayNum));

  return (
    <span ref={ref} className={className}>
      {renderedText}
    </span>
  );
}
