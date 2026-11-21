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
    id: 'personal',
    label: 'Personal',
    panel: lazyFiestaPanel(() => import('@/components/fiestas/panels/personal')),
  },
  {
    id: 'carga-operativa',
    label: 'Carga operativa',
    panel: lazyFiestaPanel(() => import('@/components/fiestas/panels/carga-operativa')),
  },
  {
    id: 'itinerario',
    label: 'Itinerario',
    panel: lazyFiestaPanel(() => import('@/components/fiestas/panels/itinerario')),
  },
  {
    id: 'orden-de-evento',
    label: 'Orden de evento',
    panel: lazyFiestaPanel(() => import('@/components/fiestas/panels/orden-de-evento')),
  },
  {
    id: 'tareas',
    label: 'Tareas',
    panel: lazyFiestaPanel(() => import('@/components/fiestas/panels/tareas')),
  },
  {
    id: 'reuniones',
    label: 'Reuniones',
    panel: lazyFiestaPanel(() => import('@/components/fiestas/panels/reuniones')),
  },
  {
    id: 'proveedores-portal',
    label: 'Proveedores',
    panel: lazyFiestaPanel(() => import('@/components/fiestas/panels/proveedores-portal')),
  },
  {
    id: 'asistente',
    label: 'Asistente',
    panel: lazyFiestaPanel(() => import('@/components/fiestas/panels/asistente')),
  },
  {
    id: 'buzon',
    label: 'Buzón',
    panel: lazyFiestaPanel(() => import('@/components/fiestas/panels/buzon')),
  },
];

export default function FiestasOperacionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24 text-slate-500">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          <span>Cargando operación…</span>
        </div>
      }
    >
      <PlanificadorSolapasShell
        titulo="Operación del evento"
        subtitulo="Personal, carga operativa, itinerario, orden de evento, tareas, reuniones, proveedores, asistente y buzón."
        tabs={TABS}
      />
    </Suspense>
  );
}
