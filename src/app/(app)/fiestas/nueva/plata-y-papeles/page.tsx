'use client';

import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import {
  PlanificadorSolapasShell,
  lazyFiestaPanel,
  type PlanificadorSolapaItem,
} from '@/components/fiestas/PlanificadorSolapasShell';

const TABS: PlanificadorSolapaItem[] = [
  {
    id: 'plan-pagos',
    label: 'Plan de pagos',
    panel: lazyFiestaPanel(() => import('@/components/fiestas/panels/plan-pagos')),
  },
  {
    id: 'gestion-costos-rentabilidad',
    label: 'Costos y rentabilidad',
    panel: lazyFiestaPanel(() => import('@/components/fiestas/panels/gestion-costos-rentabilidad')),
  },
  {
    id: 'gestion-documental',
    label: 'Documentos',
    panel: lazyFiestaPanel(() => import('@/components/fiestas/panels/gestion-documental')),
  },
  {
    id: 'portal-cliente',
    label: 'Portal del cliente',
    panel: lazyFiestaPanel(() => import('@/components/fiestas/panels/portal-cliente')),
  },
  {
    id: 'post-evento',
    label: 'Post-evento',
    panel: lazyFiestaPanel(() => import('@/components/fiestas/panels/post-evento')),
  },
];

export default function FiestasPlataYPapelesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24 text-slate-500">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          <span>Cargando plata y papeles…</span>
        </div>
      }
    >
      <PlanificadorSolapasShell
        titulo="Plata y papeles"
        subtitulo="Plan de pagos, costos y rentabilidad, gestión documental, portal del cliente y post-evento."
        tabs={TABS}
      />
    </Suspense>
  );
}
