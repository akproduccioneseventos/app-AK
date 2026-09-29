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
  const [currentNumber, setCurrentNumber] = useState(0);

  useEffect(() => {
    if (reduceMotion || !isInView || targetNumber === null) {
      return;
    }

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
  }, [isInView, reduceMotion, targetNumber, duration]);

  if (reduceMotion || targetNumber === null) {
    return <span ref={ref} className={className}>{stringVal}</span>;
  }

  // Si no hay reducción de movimiento, muestra currentNumber (que inicia en 0)
  // y va trepando suavemente hasta targetNumber al entrar en vista.
  const renderedText = stringVal.replace(String(targetNumber), String(currentNumber));

  return (
    <span ref={ref} className={className}>
      {renderedText}
    </span>
  );
}
