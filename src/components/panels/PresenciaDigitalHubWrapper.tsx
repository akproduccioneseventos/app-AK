'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { TabHostShell } from '@/components/ui/tab-host-shell';

const RedesPanel = dynamic(() => import('@/components/panels/empresa--redes-sociales'));
const ResenasPanel = dynamic(() => import('@/components/panels/empresa--resenas-google'));
const MarketingPanel = dynamic(() => import('@/components/panels/empresa--marketing'));
const AnunciosPanel = dynamic(() => import('@/components/panels/empresa--creador-anuncios'));
const SocialEventosPanel = dynamic(() => import('@/components/panels/empresa--red-social-eventos'));
const AnalyticsPanel = dynamic(() => import('@/components/panels/analytics'));

export function PresenciaDigitalHubWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={children}>
      <TabHostShell
        tabs={[
          { id: 'presencia', label: 'Presencia digital' },
          { id: 'redes', label: 'Redes sociales' },
          { id: 'resenas', label: 'Reseñas Google' },
          { id: 'marketing', label: 'Marketing' },
          { id: 'anuncios', label: 'Creador de anuncios' },
          { id: 'social-eventos', label: 'Social de eventos' },
          { id: 'analytics', label: 'Analytics' },
        ]}
        defaultContent={children}
        renderTab={(t) => {
          switch (t) {
            case 'redes': return <RedesPanel />;
            case 'resenas': return <ResenasPanel />;
            case 'marketing': return <MarketingPanel />;
            case 'anuncios': return <AnunciosPanel />;
            case 'social-eventos': return <SocialEventosPanel />;
            default: return <AnalyticsPanel />;
          }
        }}
      />
    </Suspense>
  );
}
