'use client';

import { useEffect } from 'react';
import { dispararTareasVencidasDeFondo } from '@/app/actions/tareas-automaticas.actions';

const STORAGE_KEY = 'ak-background-tasks-check';
const CHECK_INTERVAL_MS = 15 * 60 * 1000; // Cada 15 minutos de actividad en el navegador

/**
 * Disparador silencioso en segundo plano cuando el equipo entra o usa la aplicación.
 *
 * Pone al día las tareas desatendidas (métricas de redes, posteos programados y notas del blog)
 * si están atrasadas o nunca corrieron, mientras no esté activo un cron externo.
 *
 * SEGURIDAD: Nunca dispara recordatorios a clientes ni envíos de WhatsApp sin acción humana.
 */
export function MarketingAutomationTrigger() {
  useEffect(() => {
    // Las pruebas de automatización del navegador no disparan tareas reales
    if (typeof navigator !== 'undefined' && navigator.webdriver) return;

    const runWhenIdle = () => {
      const now = Date.now();
      try {
        const lastCheck = Number(window.localStorage.getItem(STORAGE_KEY) || 0);
        if (Number.isFinite(lastCheck) && now - lastCheck < CHECK_INTERVAL_MS) return;
        window.localStorage.setItem(STORAGE_KEY, String(now));
      } catch {
        // Si localStorage está bloqueado, el servidor tiene su propio control de tiempos
      }

      // 1. Revisión de tareas automáticas vencidas desatendidas
      dispararTareasVencidasDeFondo()
        .then((res) => {
          if (res.ejecutadas.length > 0) {
            console.info('[tareas-automaticas] Puestas al día en segundo plano:', res.ejecutadas);
          }
        })
        .catch((err) => {
          console.warn('[tareas-automaticas] No se pudieron ejecutar tareas en segundo plano:', err);
        });

      // Antes aca habia un SEGUNDO llamado, a /api/marketing/automation, que
      // terminaba en la misma automatizacion de marketing que ya dispara la linea
      // de arriba. Los dos salian en el mismo instante, y el control de "esto ya
      // corrio recien" lo leen los dos ANTES de que ninguno lo escriba: no frenaba
      // nada. Resultado: la nota del blog se generaba dos veces y se pagaba dos
      // veces la inteligencia artificial. Un solo camino alcanza.
    };

    const timeoutId = window.setTimeout(runWhenIdle, 6_000);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return null;
}
