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
  {
    id: 'carta-tragos',
    label: 'Carta de tragos',
    panel: lazyFiestaPanel(() => import('@/components/fiestas/panels/carta-tragos')),
  },
  {
    id: 'carteleria',
    label: 'Cartelería de mesas',
    panel: lazyFiestaPanel(() => import('@/components/fiestas/panels/carteleria')),
  },
  {
    id: 'menu-mesa',
    label: 'Menú de mesa',
    panel: lazyFiestaPanel(() => import('@/components/fiestas/panels/menu-mesa')),
  },
  {
    id: 'numeros-mesa',
    label: 'Números de mesa',
    panel: lazyFiestaPanel(() => import('@/components/fiestas/panels/numeros-mesa')),
  },
];

export default function FiestasComidaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24 text-slate-500">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          <span>Cargando comida, barra e impresos…</span>
        </div>
      }
    >
      <PlanificadorSolapasShell
        titulo="Comida, barra e impresos"
        subtitulo="Menú principal, repostería, bebidas, hoja de cocina, lista de compras e impresos de mesa."
        tabs={TABS}
      />
    </Suspense>
  );
}
