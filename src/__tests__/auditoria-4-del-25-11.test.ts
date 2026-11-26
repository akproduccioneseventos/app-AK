import { readFileSync } from 'fs';
import { join } from 'path';
import { esFiestaProxima } from '@/lib/fiesta/esFiestaProxima';
import { PAGINAS_PARA_GOOGLE } from '@/lib/seo/paginas-publicas';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

jest.mock('@/app/actions/settings', () => ({
  getBudgetDisplaySettings: jest.fn(async () => ({ bookingDepositAmount: 15000 })),
}));

jest.mock('@/app/actions/blog', () => ({
  getBlogPosts: jest.fn(async () => []),
  getBlogPostBySlug: jest.fn(async () => null),
  getRelatedPosts: jest.fn(async () => []),
}));

const almacenMemoria: Record<string, unknown> = {};

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: unknown) =>
    file in almacenMemoria ? almacenMemoria[file] : fallback
  ),
  writeData: jest.fn(async (file: string, value: unknown) => {
    almacenMemoria[file] = value;
  }),
  readDataConDetalle: jest.fn(async () => ({ datos: [], hayFallo: false })),
}));

jest.mock('@/lib/generic-json-store', () => ({
  mutateGenericJsonArray: jest.fn(async (file: string, fn: (lista: unknown[]) => unknown[] | null) => {
    const actual = Array.isArray(almacenMemoria[file]) ? (almacenMemoria[file] as unknown[]) : [];
    const next = fn(actual);
    if (next) almacenMemoria[file] = next;
  }),
}));

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn(async () => undefined),
}));

jest.mock('@/lib/crm/crm-meeting', () => ({
  scheduleCrmMeetingInternal: jest.fn(async () => undefined),
}));

jest.mock('@/lib/public-contact', () => {
  const actual = jest.requireActual('@/lib/public-contact');
  return {
    ...actual,
    AK_WHATSAPP_NUMBER: '59898355530',
    buildAkWhatsAppUrl: jest.fn((msg: string) => `https://wa.me/59898355530?text=${encodeURIComponent(msg)}`),
  };
});

function buildFiesta(overrides: Partial<FiestaEnPlanificacion> = {}): FiestaEnPlanificacion {
  return {
    id: 'fiesta_test_1',
    estado: 'En Planificación',
    configuracion: {
      nombreEvento: 'Cumple de Prueba',
      tipoCelebracion: 'Cumpleaños',
      fechaEvento: '2026-12-20',
      invitadosEstimados: 80,
      presupuestoEstimado: 100000,
    },
    invitados: [],
    presupuesto: { items: [], pagos: [] },
    modulosContratados: {} as FiestaEnPlanificacion['modulosContratados'],
    tareas: [],
    menu: {} as FiestaEnPlanificacion['menu'],
    timeline: [],
    ...overrides,
  } as FiestaEnPlanificacion;
}

describe('Orden 355 - Cuarta auditoría del 25/11', () => {
  it('ninguna página de PAGINAS_PARA_GOOGLE define un título de primer nivel terminado en AK Producciones', () => {
    expect(PAGINAS_PARA_GOOGLE.length).toBeGreaterThan(10);

    const archivosPorRuta: Record<string, string> = {
      '/bodas': 'src/app/bodas/page.tsx',
      '/quinceaneras': 'src/app/quinceaneras/page.tsx',
      '/cumpleanos': 'src/app/cumpleanos/page.tsx',
      '/fiestas': 'src/app/fiestas/page.tsx',
      '/fiestas-empresariales': 'src/app/fiestas-empresariales/page.tsx',
      '/fiestas-infantiles': 'src/app/fiestas-infantiles/page.tsx',
      '/club-uruguay': 'src/app/club-uruguay/page.tsx',
      '/catalogo': 'src/app/catalogo/layout.tsx',
      '/experiencia-ak': 'src/app/experiencia-ak/page.tsx',
      '/simulador-de-presupuesto': 'src/app/simulador-de-presupuesto/layout.tsx',
      '/simulador-ak': 'src/app/simulador-ak/layout.tsx',
      '/privacidad': 'src/app/privacidad/page.tsx',
      '/public/blog': 'src/app/public/blog/page.tsx',
    };

    for (const [ruta, archivo] of Object.entries(archivosPorRuta)) {
      const src = readFileSync(join(process.cwd(), archivo), 'utf-8');
      const m = src.match(/^ {2}title:\s*(['"`])(.+?)\1/m);
      if (m) {
        expect({ ruta, title: m[2] }).not.toEqual(
          expect.objectContaining({
            title: expect.stringMatching(/AK Producciones(?:\s+Eventos)?$/i),
          })
        );
      }
    }
  });

  it('/public/bodas devuelve canonical /bodas y título sin el nombre duplicado', async () => {
    const { generateMetadata } = await import('@/app/public/[eventType]/page');
    const meta = await generateMetadata({ params: Promise.resolve({ eventType: 'bodas' }) });

    expect(meta.alternates?.canonical).toBe('/bodas');
    expect(String(meta.title || '')).not.toMatch(/AK Producciones(?:\s+Eventos)?$/i);
  });

  it('esFiestaProxima excluye fiestas DEMO, suspendidas y de ayer, e incluye hoy/mañana/Contratada', () => {
    const hoy = '2026-11-25';

    expect(esFiestaProxima(buildFiesta({ estado: 'Demo AK' as FiestaEnPlanificacion['estado'], configuracion: { nombreEvento: 'Demo', tipoCelebracion: 'Boda', fechaEvento: '2026-12-01' } as FiestaEnPlanificacion['configuracion'] }), hoy)).toBe(false);
    expect(esFiestaProxima(buildFiesta({ id: 'demo_ak_prueba', configuracion: { nombreEvento: 'Fiesta de muestra AK', tipoCelebracion: 'Boda', fechaEvento: '2026-12-01' } as FiestaEnPlanificacion['configuracion'] }), hoy)).toBe(false);
    expect(esFiestaProxima(buildFiesta({ estado: 'Suspendida', configuracion: { nombreEvento: 'Suspendida', tipoCelebracion: 'Boda', fechaEvento: '2026-12-01' } as FiestaEnPlanificacion['configuracion'] }), hoy)).toBe(false);
    expect(esFiestaProxima(buildFiesta({ estado: 'En Planificación', configuracion: { nombreEvento: 'Ayer', tipoCelebracion: 'Boda', fechaEvento: '2026-11-24' } as FiestaEnPlanificacion['configuracion'] }), hoy)).toBe(false);

    expect(esFiestaProxima(buildFiesta({ estado: 'En Planificación', configuracion: { nombreEvento: 'Hoy', tipoCelebracion: 'Boda', fechaEvento: '2026-11-25' } as FiestaEnPlanificacion['configuracion'] }), hoy)).toBe(true);
    expect(esFiestaProxima(buildFiesta({ estado: 'En Planificación', configuracion: { nombreEvento: 'Mañana', tipoCelebracion: 'Boda', fechaEvento: '2026-11-26' } as FiestaEnPlanificacion['configuracion'] }), hoy)).toBe(true);
    expect(esFiestaProxima(buildFiesta({ estado: 'Contratada', configuracion: { nombreEvento: 'Contratada', tipoCelebracion: 'Boda', fechaEvento: '2026-11-20' } as FiestaEnPlanificacion['configuracion'] }), hoy)).toBe(true);
  });

  it('bookAppointmentFromSimulator no guarda ni devuelve "Oficina" en el lugar de reunión', async () => {
    almacenMemoria['crm-appointments.json'] = [];
    const { getSimulatorAvailableSlots, bookAppointmentFromSimulator } = await import('@/app/actions/simulator-agenda');

    const slotsRes = await getSimulatorAvailableSlots();
    const dia = slotsRes.days.find((d) => d.slots.length > 0);
    expect(dia).toBeDefined();

    const resultado = await bookAppointmentFromSimulator({
      clienteNombre: 'María Pérez',
      clienteContacto: '099123456',
      fechaHora: dia!.slots[0].datetimeIso,
      tipoReunion: 'Presencial a coordinar',
    });

    expect(resultado.success).toBe(true);
    expect(resultado.appointment?.lugar).toBe('Reunión presencial a coordinar');
    expect(resultado.appointment?.lugar).not.toMatch(/oficina/i);
    expect(decodeURIComponent(resultado.googleCalendarUrl || '')).not.toMatch(/oficina/i);
  });
});
