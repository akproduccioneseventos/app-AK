// src/lib/firebase/performance.ts
// Firebase Performance Monitoring & Client Web Vitals tracking.
// Runs purely on the client side in supported browsers.

import { app } from './config';
import type { FirebasePerformance } from 'firebase/performance';

let perfInstance: FirebasePerformance | null = null;

export async function getPerformanceInstance(): Promise<FirebasePerformance | null> {
  if (typeof window === 'undefined' || !app) return null;
  if (perfInstance) return perfInstance;

  try {
    const { getPerformance } = await import('firebase/performance');
    perfInstance = getPerformance(app);
    return perfInstance;
  } catch {
    // Silent in unsupported environments (SSR, privacy blockers)
    return null;
  }
}

/**
 * Registra una métrica de rendimiento personalizada (ej: tiempo de subida de foto o carga de muro).
 */
export async function measureCustomTrace(traceName: string, durationMs: number): Promise<void> {
  try {
    const perf = await getPerformanceInstance();
    if (!perf) return;

    const { trace } = await import('firebase/performance');
    const customTrace = trace(perf, traceName);
    customTrace.start();
    customTrace.putMetric('duration_ms', Math.round(durationMs));
    customTrace.stop();
  } catch {
    // Non-blocking
  }
}

/**
 * Reporta un error de interfaz sin romper la navegación del usuario.
 */
export function reportClientError(error: Error | string, context?: Record<string, any>): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Monitoring] Client error captured:', error, context);
  }
}
