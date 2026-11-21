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
    id: 'entretenimiento',
    label: 'Entretenimiento',
    panel: lazyFiestaPanel(() => import('@/components/fiestas/panels/entretenimiento')),
  },
  {
    id: 'musica',
    label: 'Música',
    panel: lazyFiestaPanel(() => import('@/components/fiestas/panels/musica')),
  },
  {
    id: 'fotografia',
    label: 'Foto y video',
    panel: lazyFiestaPanel(() => import('@/components/fiestas/panels/fotografia')),
  },
  {
    id: 'video-vida',
    label: 'Video de vida',
    panel: lazyFiestaPanel(() => import('@/components/fiestas/panels/video-vida')),
  },
  {
    id: 'muro-social',
    label: 'Muro social',
    panel: lazyFiestaPanel(() => import('@/components/fiestas/panels/muro-social')),
  },
  {
    id: 'modulo-invitado',
    label: 'Portal invitado',
    panel: lazyFiestaPanel(() => import('@/components/fiestas/panels/modulo-invitado')),
  },
  {
    id: 'decoracion',
    label: 'Decoración',
    panel: lazyFiestaPanel(() => import('@/components/fiestas/panels/decoracion')),
  },
];

export default function FiestasShowPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24 text-slate-500">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          <span>Cargando show y experiencia…</span>
        </div>
      }
    >
      <PlanificadorSolapasShell
        titulo="Show y experiencia"
        subtitulo="Entretenimiento, música, foto y video, muro social, portal invitado y decoración."
        tabs={TABS}
      />
    </Suspense>
  );
}
