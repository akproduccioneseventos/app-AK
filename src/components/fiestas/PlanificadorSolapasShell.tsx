'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Activity, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type PanelComponent = React.ComponentType<any>;

export interface PlanificadorSolapaItem {
  id: string;
  label: string;
  panel: PanelComponent;
}

export interface PlanificadorSolapasShellProps {
  titulo: string;
  subtitulo?: string;
  tabs: PlanificadorSolapaItem[];
  defaultTab?: string;
}

const SUBTAB_TO_PANEL_TAB: Record<string, string> = {
  scanner: 'invitados',
  layout: 'invitados',
  cocina: 'catering',
  compras: 'catering',
  logistica: 'carga-operativa',
  organizacion: 'reuniones',
  imprimir: 'reuniones',
  recibos: 'personal',
  'edicion-videos': 'fotografia',
  playlist: 'muro-social',
  'en-vivo': 'muro-social',
  control: 'entretenimiento',
  barra: 'entretenimiento',
  pantallas: 'entretenimiento',
  'zona-digital': 'entretenimiento',
  'pagina-web': 'modulo-invitado',
  'social-pro': 'modulo-invitado',
  planner: 'gestion-costos-rentabilidad',
  reporte: 'gestion-costos-rentabilidad',
  experiencia: 'portal-cliente',
  'cambio-fecha': 'gestion-documental',
  'cancelacion-contrato': 'gestion-documental',
  'cancelacion-parcial': 'gestion-documental',
  'contrato-salon': 'gestion-documental',
  'contrato-servicio': 'gestion-documental',
  'recibo-pago': 'gestion-documental',
};

export function lazyFiestaPanel(loader: () => Promise<{ default: PanelComponent }>) {
  return dynamic(loader, {
    loading: () => (
      <div className="flex items-center justify-center py-16 text-slate-500">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        <span>Cargando sección…</span>
      </div>
    ),
  });
}

export function PlanificadorSolapasShell({
  titulo,
  subtitulo,
  tabs,
  defaultTab,
}: PlanificadorSolapasShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const fiestaId = searchParams.get('fiestaId');

  const activeTab = useMemo(() => {
    const rawTab = searchParams.get('tab');
    const requested =
      rawTab && !tabs.some((t) => t.id === rawTab) && SUBTAB_TO_PANEL_TAB[rawTab]
        ? SUBTAB_TO_PANEL_TAB[rawTab]
        : rawTab;

    if (requested) {
      const matched = tabs.find((item) => item.id === requested);
      if (matched) return matched;
    }
    if (defaultTab) {
      const fallback = tabs.find((item) => item.id === defaultTab);
      if (fallback) return fallback;
    }
    return tabs[0];
  }, [searchParams, tabs, defaultTab]);

  const selectTab = (tabId: string) => {
    const q = new URLSearchParams(searchParams.toString());
    q.set('tab', tabId);
    q.delete('subtab');
    const query = q.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const plannerHref = fiestaId
    ? `/fiestas/nueva?fiestaId=${encodeURIComponent(fiestaId)}`
    : '/fiestas/nueva';
  const centroHref = fiestaId
    ? `/fiestas/${encodeURIComponent(fiestaId)}/centro`
    : null;

  const ActivePanel = activeTab.panel;

  return (
    <div className="space-y-4">
      <div className="mx-auto w-full max-w-6xl space-y-4 px-4 pt-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
              {titulo}
            </h1>
            {subtitulo && (
              <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                {subtitulo}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={plannerHref}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Planificador</span>
            </Link>
            {centroHref && (
              <Link
                href={centroHref}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-indigo-700"
              >
                <Activity className="h-3.5 w-3.5" />
                <span>Centro de fiesta</span>
              </Link>
            )}
          </div>
        </div>

        <div
          role="tablist"
          aria-label={titulo}
          className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-3"
        >
          {tabs.map((item) => {
            const isActive = item.id === activeTab.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => selectTab(item.id)}
                className={cn(
                  'min-h-[40px] rounded-xl px-3.5 py-2 text-xs font-bold transition-colors sm:text-sm',
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-w-0">
        <ActivePanel />
      </div>
    </div>
  );
}
