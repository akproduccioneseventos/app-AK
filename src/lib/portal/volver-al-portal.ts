import type { MouseEvent } from 'react';

/**
 * "Volver al Portal" vuelve a la pantalla de donde vino el cliente (su enlace `/portal/c/<clave>`
 * o el portal con contraseña), no siempre al portal viejo que pide contraseña. Si se abrió suelta
 * (sin historial), sigue el enlace de siempre. Hallazgo del barrido de botones, 9/10/2026.
 */
export function volverAlPortal(e: MouseEvent<HTMLAnchorElement>) {
  if (typeof window === 'undefined' || window.history.length <= 1) return;
  e.preventDefault();
  window.history.back();
}
