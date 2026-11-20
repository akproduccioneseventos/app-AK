'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { TabHostShell } from '@/components/ui/tab-host-shell';

const AlertasPanel = dynamic(() => import('@/components/panels/mi-dia--alertas'));
const CentroDeControlPanel = dynamic(() => import('@/components/panels/mi-dia--centro-de-control'));

export function MiDiaHubWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={children}>
      <TabHostShell
        tabs={[
          { id: 'mi-dia', label: 'Mi día' },
          { id: 'alertas', label: 'Alertas' },
          { id: 'centro', label: 'Centro de control' },
        ]}
        defaultContent={children}
        renderTab={(tab) => (tab === 'centro' ? <CentroDeControlPanel /> : <AlertasPanel />)}
      />
    </Suspense>
  );
}
