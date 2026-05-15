import { buildAkExperiencePlan } from '@/lib/experience-ak/world-class-app-plan';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

function makeFiesta(overrides: Partial<FiestaEnPlanificacion> = {}): FiestaEnPlanificacion {
  return {
    id: 'fiesta_demo',
    configuracion: {
      nombreEvento: 'XV Demo AK',
      tipoCelebracion: 'XV',
      fechaEvento: '2026-10-10',
      horaInicio: '21:00',
      horaFin: '04:00',
      nombreLugar: 'Club Uruguay',
      invitadosEstimados: 120,
      presupuestoEstimado: 100000,
      notesAdicionales: '',
    },
    invitados: [{ id: 'g1', nombre: 'Invitada Demo', rsvp: 'Confirmado' }],
    tareas: [{ id: 't1', texto: 'Probar pantalla', descripcion: '', completada: false, fechaLimite: '2026-10-01' }],
    reuniones: [{ id: 'r1', titulo: 'Reunion final', fecha: '2026-09-20', notas: 'OK' }],
    personalAsignado: [{ empleadoId: 'e1', rolId: 'coordinador', eventSalary: 1000 }],
    modulosContratados: {} as FiestaEnPlanificacion['modulosContratados'],
    invoiceIds: [],
    clientPortalSettings: { enabled: true, accessKey: 'demo', paginaPublica: { visible: true } } as FiestaEnPlanificacion['clientPortalSettings'],
    socialGallerySettings: { enabled: true, uploadsActive: true, screenMode: { enabled: true } } as FiestaEnPlanificacion['socialGallerySettings'],
    clientePortalExperience: { heroImageUrl: '/demo.jpg' } as FiestaEnPlanificacion['clientePortalExperience'],
    galeriaUrl: 'https://example.com/galeria',
    ...overrides,
  } as FiestaEnPlanificacion;
}

describe('buildAkExperiencePlan', () => {
  it('creates a complete demo and live-control map', () => {
    const plan = buildAkExperiencePlan(makeFiesta());
    expect(plan.score).toBeGreaterThanOrEqual(90);
    expect(plan.demoSurfaces.map((item) => item.id)).toContain('venta-5-minutos');
    expect(plan.liveControl.map((item) => item.id)).toEqual(
      expect.arrayContaining(['muro', 'social', 'barra', 'checkin', 'mission'])
    );
    expect(plan.blockers).toHaveLength(0);
  });

  it('detects missing visible connections in an empty event', () => {
    const plan = buildAkExperiencePlan(makeFiesta({
      invitados: [],
      tareas: [],
      reuniones: [],
      personalAsignado: [],
      clientPortalSettings: { enabled: false } as FiestaEnPlanificacion['clientPortalSettings'],
      socialGallerySettings: { enabled: false } as FiestaEnPlanificacion['socialGallerySettings'],
      galeriaUrl: '',
    }));
    expect(plan.score).toBeLessThan(80);
    expect(plan.blockers.map((item) => item.id)).toEqual(
      expect.arrayContaining(['portal-cliente', 'invitados', 'pantalla', 'equipo'])
    );
  });
});
