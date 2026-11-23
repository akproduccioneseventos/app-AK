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
    id: 'catering',
    label: 'Catering',
    panel: lazyFiestaPanel(() => import('@/components/fiestas/panels/catering')),
  },
];

export default function FiestasComidaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24 text-slate-500">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          <span>Cargando comida y catering…</span>
        </div>
      }
    >
      <PlanificadorSolapasShell
        titulo="Comida y catering"
        subtitulo="Menú principal, repostería, bebidas, hoja de cocina y lista de compras."
        tabs={TABS}
      />
    </Suspense>
  );
}
