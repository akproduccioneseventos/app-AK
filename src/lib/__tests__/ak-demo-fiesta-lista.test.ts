import { buildAkDemoFiesta } from '@/lib/experience-ak/demo-fiesta-factory';
import { buildFiestaListaReport } from '@/lib/experience-ak/fiesta-lista';
import { PREMIUM_EXPERIENCE_TEMPLATES } from '@/lib/experience-ak/premium-templates';

describe('AK demo + fiesta lista', () => {
  it('creates a complete demo fiesta that is ready to sell and test', () => {
    const fiesta = buildAkDemoFiesta('xv');
    const report = buildFiestaListaReport(fiesta);

    expect(fiesta.estado).toBe('Demo AK');
    expect(fiesta.invitados?.length).toBeGreaterThan(20);
    expect(fiesta.clientPortalSettings?.enabled).toBe(true);
    expect(fiesta.socialGallerySettings?.screenMode?.enabled).toBe(true);
    expect(report.score).toBeGreaterThanOrEqual(90);
    expect(report.blockers).toHaveLength(0);
  });

  it('detects missing pieces in an empty event', () => {
    const fiesta = buildAkDemoFiesta('boda');
    const incomplete = {
      ...fiesta,
      invitados: [],
      tareas: [],
      reuniones: [],
      personalAsignado: [],
      clientPortalSettings: { enabled: false },
      socialGallerySettings: { enabled: false, allowLikes: false, allowComments: false, uploadsActive: false },
      zonaDigitalAdolescentes: { ...fiesta.zonaDigitalAdolescentes!, enabled: false, features: [], challenges: [], games: [] },
      screenPlaylist: undefined,
      galeriaUrl: '',
    };
    const report = buildFiestaListaReport(incomplete as typeof fiesta);

    expect(report.score).toBeLessThan(80);
    expect(report.blockers.map((item) => item.id)).toEqual(
      expect.arrayContaining(['portal-cliente', 'invitados-rsvp', 'operacion'])
    );
  });

  it('keeps premium templates available for the visible surfaces', () => {
    expect(PREMIUM_EXPERIENCE_TEMPLATES.map((template) => template.surface)).toEqual(
      expect.arrayContaining(['venta', 'portal_cliente', 'portal_invitado', 'muro_social', 'zona_digital', 'pantalla_led', 'barra', 'post_fiesta'])
    );
  });

  it('creates a tecnologia total demo with QR, totems, social wall and post event active', () => {
    const fiesta = buildAkDemoFiesta('tecnologia-total');
    const report = buildFiestaListaReport(fiesta);

    expect(fiesta.configuracion.nombreEvento).toContain('Tecnologia Total');
    expect(fiesta.modulosContratados?.barraTecnologica).toBe(true);
    expect(fiesta.socialGallerySettings?.audioRhythm?.enabled).toBe(true);
    expect(fiesta.socialGallerySettings?.totemScreens?.length).toBeGreaterThanOrEqual(2);
    expect(fiesta.zonaDigitalAdolescentes?.syncWithMuroSocial).toBe(true);
    expect(fiesta.zonaDigitalAdolescentes?.syncWithEntretenimiento).toBe(true);
    expect(fiesta.galeriaEntregada).toBe(true);
    expect(report.score).toBeGreaterThanOrEqual(90);
  });
});
