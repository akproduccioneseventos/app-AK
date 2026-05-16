import { initialFiestaActualData, defaultClientPortalSettings } from '@/lib/fiesta-defaults';
import { buildSmartQrTargets, buildUltimateEventSystem } from '@/lib/experience-ak/ultimate-event-system';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

function fiesta(overrides: Partial<FiestaEnPlanificacion> = {}): FiestaEnPlanificacion {
  const base = JSON.parse(JSON.stringify(initialFiestaActualData)) as FiestaEnPlanificacion;
  return {
    ...base,
    id: 'fiesta_test_total',
    configuracion: {
      ...initialFiestaActualData.configuracion,
      nombreEvento: 'Fiesta Total Test',
      fechaEvento: '2026-12-20',
      nombreLugar: 'Salon AK',
    },
    ...overrides,
  };
}

describe('ultimate event system', () => {
  it('creates the seven promised feature checks', () => {
    const report = buildUltimateEventSystem(fiesta());

    expect(report.features).toHaveLength(7);
    expect(report.features.map((feature) => feature.id)).toEqual([
      'test-drive',
      'health',
      'smart-qr',
      'post-event',
      'sales-demo',
      'party-agent',
      'offline',
    ]);
  });

  it('builds one smart QR with all main audiences', () => {
    const targets = buildSmartQrTargets(fiesta({ clientPortalSettings: { ...defaultClientPortalSettings, enabled: true, accessKey: 'vip-ak' } }));

    expect(targets.map((target) => target.audience)).toEqual(['invitado', 'cliente', 'staff', 'pantalla', 'barra']);
    expect(targets.find((target) => target.audience === 'cliente')?.href).toBe('/portal/c/vip-ak');
  });

  it('detects real operational blockers instead of inventing a perfect status', () => {
    const report = buildUltimateEventSystem(fiesta({ tareas: [], personalAsignado: [], invitados: [] }));

    expect(report.score).toBeLessThan(100);
    expect(report.blockers.length).toBeGreaterThan(0);
    expect(report.agentBrief.length).toBeGreaterThan(0);
  });

  it('raises score when the visible event experience is connected', () => {
    const report = buildUltimateEventSystem(fiesta({
      clientPortalSettings: { ...defaultClientPortalSettings, enabled: true, accessKey: 'vip-ak' },
      guestExperienceSettings: {
        enabled: true,
        showAkBranding: true,
        showLandingCta: true,
        showSocialCta: true,
        showBudgetSimulatorCta: false,
        allowSongSuggestions: true,
        allowPhotoUpload: true,
        allowGuestPortal: true,
      },
      socialGallerySettings: {
        enabled: true,
        allowLikes: true,
        allowComments: true,
        uploadsActive: true,
        screenMode: { enabled: true, loop: true, isPlaying: false, currentItemIndex: 0, playlist: [] },
      },
      invitados: [{ id: 'g1', nombre: 'Invitada Test', rsvp: 'Confirmado' }],
      personalAsignado: [{ empleadoId: 'emp1', rolId: 'rol1', eventSalary: 0 }],
      tareas: [{ id: 't1', texto: 'Prueba total', completada: true }],
      programa: [{ id: 'p1', hora: '22:00', titulo: 'Inicio', descripcion: 'Recepcion' }],
      galeriaUrl: 'https://example.com/galeria',
    }));

    expect(report.score).toBeGreaterThanOrEqual(70);
    expect(report.smartQrTargets).toHaveLength(5);
    expect(report.postEventPlan.length).toBeGreaterThan(3);
  });
});
