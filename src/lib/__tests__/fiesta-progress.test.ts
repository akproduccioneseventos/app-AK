import type { FiestaEnPlanificacion } from '@/types/fiesta';
import {
  calcFiestaProgress,
  calculateOverallProgress,
  calcPagosStatus,
  calcInvitadosStatus,
  calcMenuStatus,
  calcDecoracionStatus,
  calcTimelineStatus,
  calcMusicaStatus,
  calcFotografiaStatus,
  calcDocumentosStatus,
  generateAlertas,
} from '../fiesta-progress';

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const hoy = new Date();
const en60Dias = new Date(hoy);
en60Dias.setDate(hoy.getDate() + 60);
const en5Dias = new Date(hoy);
en5Dias.setDate(hoy.getDate() + 5);
const en10Dias = new Date(hoy);
en10Dias.setDate(hoy.getDate() + 10);
const en25Dias = new Date(hoy);
en25Dias.setDate(hoy.getDate() + 25);

function makeBase(overrides: Partial<FiestaEnPlanificacion> = {}): FiestaEnPlanificacion {
  return {
    id: 'test-fiesta-1',
    configuracion: {
      nombreEvento: 'Fiesta Test',
      tipoCelebracion: 'XV Años',
      fechaEvento: en60Dias.toISOString(),
      horaInicio: '21:00',
      horaFin: '04:00',
      nombreLugar: 'Salón Test',
      invitadosEstimados: 100,
      presupuestoEstimado: 100000,
      notesAdicionales: '',
    },
    personalAsignado: [],
    ...overrides,
  } as FiestaEnPlanificacion;
}

const fiestaVacia = makeBase();

const fiestaCompleta = makeBase({
  presupuestoId: 'pres-1',
  contratoFirmaInfo: { signedAt: new Date().toISOString(), isSigned: true } as any,
  modulosContratados: {
    tareas: true, invitados: true, paginaWeb: true, decoracion: true,
    catering: true, musica: true, personal: true, itinerario: true,
    documentos: true, costos: true, cargaOperativa: true, fotografia: true,
    videoVida: true, reuniones: true, muroSocial: true, regalos: false,
    feedback: false, menuMesa: false, checkin: false, resumenImprimible: false,
    configuracion: true, disenoSalon: true, listaCompras: true, portalCliente: true,
    numerosMesa: true, mesasCliente: true, resumenPlanificacion: true, enVivo: true,
    carteleria: true,
  },
  menuAsignadoId: 'menu-1',
  planDePagos: {
    id: 'plan-1',
    fiestaId: 'test-fiesta-1',
    cuotas: [
      { id: 'c1', descripcion: 'Seña', monto: 20000, fechaVencimiento: new Date().toISOString(), estado: 'pagado' },
      { id: 'c2', descripcion: 'Cuota 1', monto: 40000, fechaVencimiento: new Date().toISOString(), estado: 'pagado' },
      { id: 'c3', descripcion: 'Saldo', monto: 40000, fechaVencimiento: new Date().toISOString(), estado: 'pagado' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  invitados: Array.from({ length: 85 }, (_, i) => ({
    id: `inv-${i}`,
    nombre: `Invitado ${i}`,
    rsvp: 'Confirmado' as const,
    categoria: 'Adulto' as const,
    restriccionAlimentaria: 'Ninguna' as const,
  })),
  decoracion: {
    tema: 'Jardín',
    paletaColores: { primary: '#ff0', secondary: '#00f', accent: '#f0f' },
    moodboardItems: [{ id: 'm1', url: 'http://example.com/img.jpg' } as any],
  },
  programa: [
    { hora: '21:00', titulo: 'Ingreso' },
    { hora: '21:30', titulo: 'Vals' },
    { hora: '22:00', titulo: 'Cena' },
    { hora: '23:00', titulo: 'Baile' },
  ],
  musica: {
    cancionEntrada: 'Mi canción favorita',
    cancionVals: 'El vals',
    playlistFiesta: 'https://spotify.com/playlist/test',
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateOverallProgress
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateOverallProgress', () => {
  it('returns 10% for a freshly created fiesta (just has an id)', () => {
    expect(calculateOverallProgress(fiestaVacia)).toBe(10);
  });

  it('returns 100% for a fully complete fiesta', () => {
    expect(calculateOverallProgress(fiestaCompleta)).toBe(100);
  });

  it('adds 15% when first cuota is paid', () => {
    const f = makeBase({
      planDePagos: {
        id: 'p1', fiestaId: 'test-fiesta-1',
        cuotas: [{ id: 'c1', descripcion: 'Seña', monto: 20000, fechaVencimiento: new Date().toISOString(), estado: 'pagado' }],
        createdAt: '', updatedAt: '',
      },
    });
    expect(calculateOverallProgress(f)).toBe(10 + 15 + 15); // id + primera cuota + pagos al día
  });

  it('never exceeds 100', () => {
    expect(calculateOverallProgress(fiestaCompleta)).toBeLessThanOrEqual(100);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Pagos
// ─────────────────────────────────────────────────────────────────────────────

describe('calcPagosStatus', () => {
  it('returns gris when no plan de pagos', () => {
    expect(calcPagosStatus(fiestaVacia).status).toBe('gris');
  });

  it('returns rojo when there are cuotas vencidas', () => {
    const f = makeBase({
      planDePagos: {
        id: 'p1', fiestaId: 'test-fiesta-1',
        cuotas: [{ id: 'c1', descripcion: 'Seña', monto: 20000, fechaVencimiento: new Date().toISOString(), estado: 'vencido' }],
        createdAt: '', updatedAt: '',
      },
    });
    expect(calcPagosStatus(f).status).toBe('rojo');
  });

  it('returns verde when all cuotas paid', () => {
    const f = makeBase({
      planDePagos: {
        id: 'p1', fiestaId: 'test-fiesta-1',
        cuotas: [
          { id: 'c1', descripcion: 'Seña', monto: 20000, fechaVencimiento: new Date().toISOString(), estado: 'pagado' },
          { id: 'c2', descripcion: 'Saldo', monto: 80000, fechaVencimiento: new Date().toISOString(), estado: 'pagado' },
        ],
        createdAt: '', updatedAt: '',
      },
    });
    expect(calcPagosStatus(f).status).toBe('verde');
    expect(calcPagosStatus(f).percentage).toBe(100);
  });

  it('returns amarillo when pending but not expired', () => {
    const f = makeBase({
      planDePagos: {
        id: 'p1', fiestaId: 'test-fiesta-1',
        cuotas: [
          { id: 'c1', descripcion: 'Seña', monto: 20000, fechaVencimiento: new Date().toISOString(), estado: 'pagado' },
          { id: 'c2', descripcion: 'Saldo', monto: 80000, fechaVencimiento: en60Dias.toISOString(), estado: 'pendiente' },
        ],
        createdAt: '', updatedAt: '',
      },
    });
    expect(calcPagosStatus(f).status).toBe('amarillo');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Invitados
// ─────────────────────────────────────────────────────────────────────────────

describe('calcInvitadosStatus', () => {
  it('returns gris when no invitados', () => {
    expect(calcInvitadosStatus(fiestaVacia).status).toBe('gris');
  });

  it('returns verde when >80% confirmed', () => {
    const f = makeBase({
      invitados: Array.from({ length: 85 }, (_, i) => ({
        id: `inv-${i}`, nombre: `Inv ${i}`, rsvp: 'Confirmado' as const,
        categoria: 'Adulto' as const, restriccionAlimentaria: 'Ninguna' as const,
      })),
    });
    expect(calcInvitadosStatus(f).status).toBe('verde');
  });

  it('returns amarillo when <80% confirmed but >15 days to event', () => {
    const f = makeBase({
      invitados: Array.from({ length: 60 }, (_, i) => ({
        id: `inv-${i}`, nombre: `Inv ${i}`,
        rsvp: i < 30 ? ('Confirmado' as const) : ('Pendiente' as const),
        categoria: 'Adulto' as const, restriccionAlimentaria: 'Ninguna' as const,
      })),
    });
    expect(calcInvitadosStatus(f).status).toBe('amarillo');
  });

  it('returns rojo when <50% confirmed and <15 days to event', () => {
    const f = makeBase({
      configuracion: {
        nombreEvento: 'Test', tipoCelebracion: 'Boda',
        fechaEvento: en5Dias.toISOString(),
        horaInicio: '21:00', horaFin: '04:00', nombreLugar: 'Salón',
        invitadosEstimados: 100, presupuestoEstimado: 50000, notesAdicionales: '',
      },
      invitados: Array.from({ length: 30 }, (_, i) => ({
        id: `inv-${i}`, nombre: `Inv ${i}`,
        rsvp: i < 10 ? ('Confirmado' as const) : ('Pendiente' as const),
        categoria: 'Adulto' as const, restriccionAlimentaria: 'Ninguna' as const,
      })),
    });
    expect(calcInvitadosStatus(f).status).toBe('rojo');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Menu
// ─────────────────────────────────────────────────────────────────────────────

describe('calcMenuStatus', () => {
  it('returns gris when catering not contracted', () => {
    expect(calcMenuStatus(fiestaVacia).status).toBe('gris');
  });

  it('returns verde when catering contracted and menu assigned', () => {
    const f = makeBase({ modulosContratados: { catering: true } as any, menuAsignadoId: 'menu-1' });
    expect(calcMenuStatus(f).status).toBe('verde');
  });

  it('returns amarillo when catering contracted but no menu', () => {
    const f = makeBase({ modulosContratados: { catering: true } as any });
    expect(calcMenuStatus(f).status).toBe('amarillo');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Decoracion
// ─────────────────────────────────────────────────────────────────────────────

describe('calcDecoracionStatus', () => {
  it('returns gris when no decoracion', () => {
    expect(calcDecoracionStatus(fiestaVacia).status).toBe('gris');
  });

  it('returns verde when tema, paleta and moodboard defined', () => {
    const f = makeBase({
      decoracion: {
        tema: 'Jardín',
        paletaColores: { primary: '#fff', secondary: '#000', accent: '#f00' },
        moodboardItems: [{ id: 'm1', url: 'http://example.com/img.jpg' } as any],
      },
    });
    expect(calcDecoracionStatus(f).status).toBe('verde');
  });

  it('returns amarillo when only tema is defined', () => {
    const f = makeBase({ decoracion: { tema: 'Jardín' } });
    expect(calcDecoracionStatus(f).status).toBe('amarillo');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Timeline
// ─────────────────────────────────────────────────────────────────────────────

describe('calcTimelineStatus', () => {
  it('returns gris when programa is empty', () => {
    expect(calcTimelineStatus(fiestaVacia).status).toBe('gris');
  });

  it('returns verde when programa has >3 items', () => {
    const f = makeBase({
      programa: [
        { hora: '21:00', titulo: 'Ingreso' },
        { hora: '21:30', titulo: 'Vals' },
        { hora: '22:00', titulo: 'Cena' },
        { hora: '23:00', titulo: 'Baile' },
      ],
    });
    expect(calcTimelineStatus(f).status).toBe('verde');
  });

  it('returns rojo when empty and <7 days to event', () => {
    const f = makeBase({
      configuracion: {
        nombreEvento: 'Test', tipoCelebracion: 'Boda',
        fechaEvento: en5Dias.toISOString(),
        horaInicio: '21:00', horaFin: '04:00', nombreLugar: 'Salón',
        invitadosEstimados: 100, presupuestoEstimado: 50000, notesAdicionales: '',
      },
    });
    expect(calcTimelineStatus(f).status).toBe('rojo');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Musica
// ─────────────────────────────────────────────────────────────────────────────

describe('calcMusicaStatus', () => {
  it('returns gris when nothing configured', () => {
    expect(calcMusicaStatus(fiestaVacia).status).toBe('gris');
  });

  it('returns verde when playlist is set', () => {
    const f = makeBase({ musica: { cancionEntrada: 'Mi canción', cancionVals: 'Vals bonito' } });
    expect(calcMusicaStatus(f).status).toBe('verde');
  });

  it('returns amarillo when DJ contracted but no playlist', () => {
    const f = makeBase({ modulosContratados: { musica: true } as any });
    expect(calcMusicaStatus(f).status).toBe('amarillo');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Documentos
// ─────────────────────────────────────────────────────────────────────────────

describe('calcDocumentosStatus', () => {
  it('returns gris when no documents', () => {
    expect(calcDocumentosStatus(fiestaVacia).status).toBe('gris');
  });

  it('returns verde when presupuesto and contrato exist', () => {
    const f = makeBase({
      presupuestoId: 'pres-1',
      contratoFirmaInfo: { signedAt: new Date().toISOString(), isSigned: true } as any,
    });
    expect(calcDocumentosStatus(f).status).toBe('verde');
  });

  it('returns amarillo when only presupuesto exists', () => {
    const f = makeBase({ presupuestoId: 'pres-1' });
    expect(calcDocumentosStatus(f).status).toBe('amarillo');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calcFotografiaStatus
// ─────────────────────────────────────────────────────────────────────────────

describe('calcFotografiaStatus', () => {
  it('returns gris when no services', () => {
    expect(calcFotografiaStatus(fiestaVacia).status).toBe('gris');
  });

  it('returns verde when all services delivered', () => {
    const f = makeBase({
      fotografiaYFilmacion: {
        servicios: [
          { id: 's1', nombre: 'Foto', estado: 'Entregado completo' },
          { id: 's2', nombre: 'Video', estado: 'Entregado completo' },
        ],
      },
    });
    expect(calcFotografiaStatus(f).status).toBe('verde');
  });

  it('returns rojo when a service is overdue', () => {
    const pasado = new Date();
    pasado.setDate(pasado.getDate() - 5);
    const f = makeBase({
      fotografiaYFilmacion: {
        servicios: [{ id: 's1', nombre: 'Foto', estado: 'Pendiente', fechaEntregaEstimada: pasado.toISOString() }],
      },
    });
    expect(calcFotografiaStatus(f).status).toBe('rojo');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateAlertas
// ─────────────────────────────────────────────────────────────────────────────

describe('generateAlertas', () => {
  it('returns no alertas for a fresh fiesta with no data', () => {
    const alertas = generateAlertas(fiestaVacia);
    // No vencidas, no contrato, etc.
    expect(alertas.find(a => a.id === 'pagos-vencidos')).toBeUndefined();
  });

  it('returns urgente alerta for cuotas vencidas', () => {
    const f = makeBase({
      planDePagos: {
        id: 'p1', fiestaId: 'test-fiesta-1',
        cuotas: [{ id: 'c1', descripcion: 'Seña', monto: 20000, fechaVencimiento: new Date().toISOString(), estado: 'vencido' }],
        createdAt: '', updatedAt: '',
      },
    });
    const alertas = generateAlertas(f);
    const alerta = alertas.find(a => a.id === 'pagos-vencidos');
    expect(alerta).toBeDefined();
    expect(alerta!.tipo).toBe('urgente');
  });

  it('returns sin-contrato alerta when presupuesto exists but no contrato', () => {
    const f = makeBase({ presupuestoId: 'pres-1' });
    const alertas = generateAlertas(f);
    expect(alertas.find(a => a.id === 'sin-contrato')).toBeDefined();
  });

  it('returns sin-cronograma urgente when evento in 5 days and no programa', () => {
    const f = makeBase({
      configuracion: {
        nombreEvento: 'Test', tipoCelebracion: 'Boda',
        fechaEvento: en5Dias.toISOString(),
        horaInicio: '21:00', horaFin: '04:00', nombreLugar: 'Salón',
        invitadosEstimados: 100, presupuestoEstimado: 50000, notesAdicionales: '',
      },
    });
    const alertas = generateAlertas(f);
    expect(alertas.find(a => a.id === 'sin-cronograma')).toBeDefined();
  });

  it('handles missing fechaEvento gracefully (no dias-based alertas)', () => {
    const f = makeBase({
      configuracion: {
        nombreEvento: 'Test', tipoCelebracion: 'Boda',
        fechaEvento: undefined,
        horaInicio: '21:00', horaFin: '04:00', nombreLugar: 'Salón',
        invitadosEstimados: 100, presupuestoEstimado: 50000, notesAdicionales: '',
      },
    });
    // Should not throw
    expect(() => generateAlertas(f)).not.toThrow();
    const alertas = generateAlertas(f);
    expect(alertas.find(a => a.id === 'sin-cronograma')).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calcFiestaProgress (integration)
// ─────────────────────────────────────────────────────────────────────────────

describe('calcFiestaProgress', () => {
  it('returns 10% for empty fiesta', () => {
    const result = calcFiestaProgress(fiestaVacia);
    expect(result.overallPercentage).toBe(10);
    expect(result.overallStatus).toBe('rojo');
  });

  it('returns 100% for complete fiesta', () => {
    const result = calcFiestaProgress(fiestaCompleta);
    expect(result.overallPercentage).toBe(100);
    expect(result.overallStatus).toBe('verde');
  });

  it('has all 8 area keys', () => {
    const result = calcFiestaProgress(fiestaVacia);
    expect(Object.keys(result.areas)).toEqual(['pagos', 'invitados', 'menu', 'documentos', 'fotografia', 'decoracion', 'timeline', 'musica']);
  });

  it('includes proximosPasos for incomplete fiesta', () => {
    const result = calcFiestaProgress(fiestaVacia);
    expect(result.proximosPasos.length).toBeGreaterThan(0);
  });
});
