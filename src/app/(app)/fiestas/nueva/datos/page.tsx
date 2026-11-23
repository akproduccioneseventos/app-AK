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
    id: 'configuracion',
    label: 'Configuración',
    panel: lazyFiestaPanel(() => import('@/components/fiestas/panels/configuracion')),
  },
  {
    id: 'invitados',
    label: 'Invitados',
    panel: lazyFiestaPanel(() => import('@/components/fiestas/panels/invitados')),
  },
  {
    id: 'alergias',
    label: 'Alergias y dietas',
    panel: lazyFiestaPanel(() => import('@/components/fiestas/panels/alergias')),
  },
  {
    id: 'regalos',
    label: 'Regalos',
    panel: lazyFiestaPanel(() => import('@/components/fiestas/panels/regalos')),
  },
  {
    id: 'servicios-contratados',
    label: 'Servicios contratados',
    panel: lazyFiestaPanel(() => import('@/components/fiestas/panels/servicios-contratados')),
  },
];

export default function FiestasDatosPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24 text-slate-500">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          <span>Cargando datos de la fiesta…</span>
        </div>
      }
    >
      <PlanificadorSolapasShell
        titulo="Datos de la fiesta"
        subtitulo="Configuración general, lista de invitados, alergias, regalos y servicios contratados."
        tabs={TABS}
      />
    </Suspense>
  );
}
