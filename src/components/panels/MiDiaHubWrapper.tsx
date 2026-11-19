'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { TabHostShell } from '@/components/ui/tab-host-shell';

const AlertasPanel = dynamic(() => import('@/components/panels/mi-dia--alertas'));

export function MiDiaHubWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={children}>
      <TabHostShell
        tabs={[
          { id: 'mi-dia', label: 'Mi día' },
          { id: 'alertas', label: 'Alertas' },
        ]}
        defaultContent={children}
        renderTab={() => <AlertasPanel />}
      />
    </Suspense>
  );
}
