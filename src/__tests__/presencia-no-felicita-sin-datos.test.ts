/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { DigitalPresenceDashboardData } from '@/types/presencia-digital';
import type { SocialConnection } from '@/types/settings';
import type { SocialPost } from '@/types/social-media';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
if (typeof (globalThis as any).ResizeObserver === 'undefined') {
  (globalThis as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

jest.mock('server-only', () => ({}));
jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null, authAdmin: null }));
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => React.createElement('img', { alt: props.alt ?? '', ...props }),
}));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => React.createElement('a', { href, ...props }, children),
}));
jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn(async () => false),
  registrarConsumoIA: jest.fn(async () => undefined),
}));
jest.mock('@/app/actions/social-media', () => ({
  saveSocialPost: jest.fn(async () => ({ success: true })),
  publicarPosteoAhoraAction: jest.fn(async () => ({ success: true })),
  adaptarTextoPorRedAction: jest.fn(async () => ({ success: true, versions: {} })),
}));
jest.mock('@/app/actions/social-connections', () => ({
  getSocialConnectionsPublicas: jest.fn(async () => []),
}));
jest.mock('@/app/actions/presencia-digital', () => ({
  publishApprovedSocialPost: jest.fn(async () => ({ success: true })),
  createPostFromDailySuggestion: jest.fn(async () => ({ success: true })),
  getNetworkAttributionReport: jest.fn(async () => ({
    success: true,
    data: {
      period: '90d',
      periodLabel: 'Últimos 90 días',
      rows: [],
      totalConsultas: 0,
      totalPresupuestos: 0,
      totalContratados: 0,
      totalRevenueUYU: 0,
    },
  })),
  getWebsiteAnalyticsData: jest.fn(async () => ({ success: false })),
  leerBandejaUnicaAction: jest.fn(async () => []),
  getAjustesRespuestasAction: jest.fn(async () => ({
    comentarios: false,
    mensajesDirectos: false,
    meGusta: false,
    ocultar: false,
    palabrasClaveActivo: false,
    compartirSoloHistorias: false,
  })),
  setAjustesRespuestasAction: jest.fn(async (aj: any) => aj),
  getCompetenciaDashboardAction: jest.fn(async () => ({ success: true, data: { cuentas: [] } })),
  guardarCompetenciaCuentasAction: jest.fn(async () => ({ success: true, data: { cuentas: [] } })),
  sincronizarCompetenciaAhoraAction: jest.fn(async () => ({ success: true, data: { cuentas: [] } })),
  getStoryMentionsAction: jest.fn(async () => ({ success: true, mentions: [] })),
  compartirMencionEnHistoriaAction: jest.fn(async () => ({ success: true })),
}));
jest.mock('@/app/actions/comentarios-redes', () => ({
  getSocialCommentsDashboardAction: jest.fn(async () => ({
    success: true,
    data: {
      positiveComments: [],
      autoHiddenComments: [],
      legitimateComplaints: [],
      allComments: [],
      backfillState: {},
      summaryCounts: { total: 0, positive: 0, autoHidden: 0, complaints: 0 },
    },
  })),
  triggerCommentsSyncAction: jest.fn(async () => ({ success: true })),
  restoreHiddenCommentAction: jest.fn(async () => ({ success: true })),
  hideCommentAction: jest.fn(async () => ({ success: true })),
  publishCommentAsTestimonialAction: jest.fn(async () => ({ success: true })),
}));
jest.mock('@/app/actions/google-business-resenas', () => ({
  publicarRespuestaResenaAction: jest.fn(async () => ({ success: true })),
}));
jest.mock('@/app/actions/seo-posicionamiento', () => ({
  getSeoPosicionamientoData: jest.fn(async () => null),
  guardarPosicionamientoKeywords: jest.fn(async () => ({ success: true })),
}));

import { buildDigitalPresenceDailyReview } from '@/lib/presencia-digital/revision-diaria';
import { PresenciaDigitalClient } from '@/app/(app)/empresa/presencia-digital/presencia-digital-client';

function buildDashboardData(
  review: DigitalPresenceDashboardData['review'],
  connections: SocialConnection[],
): DigitalPresenceDashboardData {
  return {
    kpis: {
      totalFollowers: null,
      followersWeeklyChange: null,
      weeklyReach: null,
      reachWeeklyChangePct: null,
      activeAdSpendMonth: 0,
      signedPartiesFromAds: 0,
      averageCostPerSignedParty: null,
      pendingApprovalPostsCount: 0,
      googleRating: null,
      googleReviewsCount: null,
    },
    commercialAdsRoi: [],
    review,
    recentHistory: [],
    platformsStatus: [
      {
        platform: 'Instagram',
        isConnected: connections.some((c) => c.platform === 'Instagram' && c.isConnected),
        followers: null,
        daysWithoutPost: 0,
        canAutoPublish: true,
      },
      {
        platform: 'Facebook',
        isConnected: connections.some((c) => c.platform === 'Facebook' && c.isConnected),
        followers: null,
        daysWithoutPost: 0,
        canAutoPublish: true,
      },
    ],
  };
}

async function renderDashboardText(initialData: DigitalPresenceDashboardData): Promise<string> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  let root: Root | null = null;

  await act(async () => {
    root = createRoot(container);
    root.render(
      React.createElement(PresenciaDigitalClient, {
        initialData,
        initialPosts: [],
      }),
    );
  });

  const text = container.textContent || '';

  await act(async () => {
    root?.unmount();
  });
  container.remove();
  return text;
}

describe('Orden 335 — Bloque 5: Presencia digital no felicita sin datos', () => {
  it('con cero publicaciones con fecha (hasAnyDatedPost = false) dice "Sin datos todavía" y NO felicita', async () => {
    const connections: SocialConnection[] = [
      { platform: 'Instagram', isConnected: true, username: 'akproducciones' },
      { platform: 'Facebook', isConnected: true, username: 'AK Producciones' },
    ];
    const postsSinFecha: SocialPost[] = [
      {
        id: 'p_sin_fecha',
        platform: 'Instagram',
        isGeneralCampaign: true,
        publishDate: '',
        text: 'Post sin fecha',
        status: 'Publicado',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const review = await buildDigitalPresenceDailyReview({ posts: postsSinFecha, connections });
    expect(review.hasAnyDatedPost).toBe(false);
    expect(review.inactivePlatforms).toEqual([]);
    expect(review.summary).toContain('Sin datos todavía');

    const text = await renderDashboardText(buildDashboardData(review, connections));
    expect(text).toContain('Sin datos todavía');
    expect(text).not.toContain('Venís publicando parejo');
  });

  it('sin redes conectadas dice "Sin datos todavía" y NO felicita aunque haya una publicación fechada', async () => {
    const posts: SocialPost[] = [
      {
        id: 'p_1',
        platform: 'Instagram',
        isGeneralCampaign: true,
        publishDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        text: 'Post reciente',
        status: 'Publicado',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const review = await buildDigitalPresenceDailyReview({ posts, connections: [] });
    expect(review.hasAnyConnection).toBe(false);
    expect(review.allConnectedPlatformsActive).toBe(false);
    expect(review.summary).toContain('Sin datos todavía');

    const text = await renderDashboardText(buildDashboardData(review, []));
    expect(text).toContain('Sin datos todavía');
    expect(text).not.toContain('Venís publicando parejo');
  });

  it('con publicaciones fechadas recientes dentro del plazo en las redes conectadas sí felicita', async () => {
    const connections: SocialConnection[] = [
      { platform: 'Instagram', isConnected: true, username: 'akproducciones' },
      { platform: 'Facebook', isConnected: true, username: 'AK Producciones' },
    ];
    const haceUnDia = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const posts: SocialPost[] = [
      {
        id: 'p_ig',
        platform: 'Instagram',
        isGeneralCampaign: true,
        publishDate: haceUnDia,
        text: 'Resumen de los 15 de Sofía',
        status: 'Publicado',
        createdAt: haceUnDia,
        updatedAt: haceUnDia,
      },
      {
        id: 'p_fb',
        platform: 'Facebook',
        isGeneralCampaign: true,
        publishDate: haceUnDia,
        text: 'Ambientación en salón',
        status: 'Publicado',
        createdAt: haceUnDia,
        updatedAt: haceUnDia,
      },
    ];

    const review = await buildDigitalPresenceDailyReview({ posts, connections });
    expect(review.hasAnyDatedPost).toBe(true);
    expect(review.hasAnyConnection).toBe(true);
    expect(review.allConnectedPlatformsActive).toBe(true);
    expect(review.activePlatformsWithRecentPosts).toEqual(['Instagram', 'Facebook']);
    expect(review.inactivePlatforms).toEqual([]);
    expect(review.summary).toBe('Todo en orden en las redes principales.');

    const text = await renderDashboardText(buildDashboardData(review, connections));
    expect(text).toContain('Venís publicando parejo');
  });
});
