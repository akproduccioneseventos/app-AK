'use client';

import { useEffect } from 'react';

/**
 * QUE LA PANTALLA DE LA ESTACIÓN NO SE APAGUE (27 de septiembre de 2026).
 *
 * Ninguna estación le pedía al equipo que mantuviera la pantalla prendida. En una tablet o una
 * notebook, entre invitado e invitado la pantalla se oscurecía y se bloqueaba sola, y una
 * grabación larga (360, buzón) podía cortarse. Se pide el "candado de pantalla" del navegador y se
 * vuelve a pedir cada vez que la pestaña vuelve a estar visible, porque el navegador lo suelta al
 * cambiar de pestaña. Si el navegador no lo soporta, no pasa nada: la estación anda igual.
 */
export function usePantallaPrendida(activa = true) {
  useEffect(() => {
    if (!activa || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
    let cerrado = false;
    let candado: { release: () => Promise<void> } | null = null;

    const pedir = async () => {
      if (cerrado || document.visibilityState !== 'visible') return;
      try {
        candado = await (navigator as any).wakeLock.request('screen');
      } catch {
        // Sin permiso o sin batería suficiente: la estación sigue andando.
      }
    };
    const alVolver = () => {
      if (document.visibilityState === 'visible') void pedir();
    };

    void pedir();
    document.addEventListener('visibilitychange', alVolver);
    return () => {
      cerrado = true;
      document.removeEventListener('visibilitychange', alVolver);
      void candado?.release().catch(() => undefined);
    };
  }, [activa]);
}
