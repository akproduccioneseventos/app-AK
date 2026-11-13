"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CASAS, type CasaId, type PestanaCasa } from '@/lib/navegacion/mapa';
import { cn } from '@/lib/utils';
import {
  SunMedium,
  PartyPopper,
  KanbanSquare,
  Wallet,
  Target,
  Building2,
  Settings,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  SunMedium,
  PartyPopper,
  KanbanSquare,
  Wallet,
  Target,
  Building2,
  Settings,
};

interface BarraDeLaCasaProps {
  casaId: CasaId;
  className?: string;
}

/**
 * Determina si una pestaña madre debe estar marcada como activa para una ruta dada.
 * Maneja tanto la ruta exacta como las pantallas de detalle de la entidad.
 */
function esPestanaActiva(pestana: PestanaCasa, pathname: string): boolean {
  const ruta = pestana.ruta;
  if (!pathname) return false;

  // 1. Coincidencia exacta
  if (pathname === ruta) return true;

  // 2. Casos especiales de detalle especificados en la Orden 284
  if (ruta === '/presupuestos/nuevo' && pathname.startsWith('/presupuestos')) {
    return true;
  }
  if (ruta === '/customers' && pathname.startsWith('/customers/')) {
    return true;
  }
  if (ruta === '/invoices' && pathname.startsWith('/invoices/')) {
    return true;
  }
  if (ruta === '/empresa/menus/tragos' && pathname.startsWith('/empresa/menus/tragos')) {
    return true;
  }
  if (ruta === '/empresa/menus' && pathname.startsWith('/empresa/menus') && !pathname.startsWith('/empresa/menus/tragos')) {
    return true;
  }
  if (ruta === '/empresa/salones' && pathname.startsWith('/empresa/salones/')) {
    return true;
  }
  if (ruta === '/empresa/insumos' && pathname.startsWith('/empresa/insumos/')) {
    return true;
  }
  if (ruta === '/empresa/servicios' && pathname.startsWith('/empresa/servicios/')) {
    return true;
  }
  if (ruta === '/empresa/activos-fijos' && pathname.startsWith('/empresa/activos-fijos/')) {
    return true;
  }
  if (ruta === '/empleados' && pathname.startsWith('/empleados/')) {
    return true;
  }
  if (ruta === '/proveedores' && pathname.startsWith('/proveedores/')) {
    return true;
  }

  // 3. Subrutas generales donde la ruta no sea raíz ni inicio genérico
  if (ruta !== '/' && ruta !== '/empresa' && pathname.startsWith(`${ruta}/`)) {
    return true;
  }

  return false;
}

export function BarraDeLaCasa({ casaId, className }: BarraDeLaCasaProps) {
  const pathname = usePathname() || '';

  const casa = useMemo(() => CASAS.find((c) => c.id === casaId), [casaId]);

  // Calculamos la pestaña activa con prioridad por especificidad si hubiera solapamiento
  const pestanaActivaIndex = useMemo(() => {
    if (!casa) return -1;
    // Gana la más específica: en /empresa/contabilidad/gastos también coincide /empresa/contabilidad, y la
    // primera de la lista se quedaba con la marca (lo frenó la prueba cada-casa-tiene-su-barra, 13/11/2026).
    let mejor = -1;
    casa.pestanas.forEach((p, idx) => {
      if (!esPestanaActiva(p, pathname)) return;
      if (mejor === -1 || p.ruta.length > casa.pestanas[mejor].ruta.length) mejor = idx;
    });
    return mejor;
  }, [casa, pathname]);

  if (!casa) return null;

  const IconoCasa = ICON_MAP[casa.icono] || SunMedium;

  return (
    <nav
      aria-label={`Navegación de ${casa.titulo}`}
      data-testid="barra-de-la-casa"
      data-casa={casaId}
      className={cn(
        'w-full max-w-full overflow-hidden border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-20 mb-4 px-2 sm:px-4',
        className
      )}
    >
      <div className="w-full flex items-center justify-between gap-3">
        {/* Título e ícono de la Casa */}
        <div className="flex items-center gap-2 py-2 shrink-0 pr-2 border-r border-slate-200/70">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <IconoCasa className="w-4 h-4" />
          </div>
          <span className="font-black text-xs uppercase tracking-wider text-slate-800 hidden sm:inline">
            {casa.titulo}
          </span>
        </div>

        {/* Barra desplazable horizontalmente de pestañas */}
        <div
          role="tablist"
          className="flex-1 overflow-x-auto scrollbar-hide py-2 flex items-center gap-1.5 scroll-smooth"
        >
          {casa.pestanas.map((p, idx) => {
            const activa = idx === pestanaActivaIndex;
            return (
              <Link
                key={p.titulo + p.ruta}
                href={p.ruta}
                role="tab"
                aria-selected={activa}
                data-testid={`pestana-${p.titulo.toLowerCase().replace(/\s+/g, '-')}`}
                data-activa={activa ? 'true' : 'false'}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0 select-none flex items-center gap-1.5',
                  activa
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                )}
              >
                <span>{p.titulo}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
