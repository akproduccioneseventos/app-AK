'use client';

import { useEffect, useState } from 'react';
import { BUDGET_VIEW_REGEX, isPublicPathPrefix, PUBLIC_EXACT_PATHS } from '@/lib/auth/public-paths';

/**
 * Lo abre un cliente o un visitante, no el equipo: una pantalla publica, o el presupuesto abierto
 * con el enlace del cliente (`token`, `cliente=1`, `public=1`, `guest=1`).
 *
 * Codex, auditoria 79: el enlace del presupuesto le mostraba al cliente "Ir al panel principal",
 * "Personalizar asistentes" y "Ver sincronizaciones". Al tocarlos pedian ingreso (no habia acceso
 * indebido), pero son puertas del equipo. Se lee la direccion del navegador en un efecto, y no
 * con `useSearchParams`, porque estos componentes viven en el armazon de todas las pantallas.
 */
export function esVistaDelCliente(pathname: string, search: string): boolean {
  if (PUBLIC_EXACT_PATHS.has(pathname) || isPublicPathPrefix(pathname)) return true;
  if (!BUDGET_VIEW_REGEX.test(pathname)) return false;
  const params = new URLSearchParams(search);
  return params.has('token') || ['cliente', 'public', 'guest'].some((clave) => params.get(clave) === '1');
}

export function useEsVistaDelCliente(pathname: string): boolean {
  const [esCliente, setEsCliente] = useState(false);
  useEffect(() => {
    setEsCliente(esVistaDelCliente(pathname, typeof window === 'undefined' ? '' : window.location.search));
  }, [pathname]);
  return esCliente;
}
