/**
 * Llegada del personal con ubicación y cálculo de distancia.
 * Comprueba:
 * - la distancia (función pura) entre dos puntos conocidos da lo esperado, con 5% de margen
 * - a 1 km no marca
 * - con token inválido no marca
 * - apagado, marca como hoy
 */

let archivos: Record<string, unknown> = {};
const escrituras: Record<string, unknown> = {};

jest.mock('server-only', () => ({}));
jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => undefined),
  hasAppSession: jest.fn(async () => true),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: unknown) => {
    const normal = archivo.replace(/\\/g, '/');
    if (normal in archivos) return archivos[normal];
    return porDefecto;
  }),
  writeData: jest.fn(async (archivo: string, datos: unknown) => {
    const normal = archivo.replace(/\\/g, '/');
    escrituras[normal] = datos;
    archivos[normal] = datos;
  }),
}));

import { calcularDistanciaMetros, extraerCoordenadasDeUrl } from '@/lib/geo/distancia';
import { registrarLlegadaPersonal } from '@/app/actions/accesos-personal-view';

describe('Llegada del personal con ubicación y distancia al salón', () => {
  // Plaza Independencia: -34.9065, -56.1998
  // Intendencia de Montevideo: -34.9056, -56.1861
  // Distancia geodésica real: ~1255 metros (1.25 km)
  const plazaIndependencia = { lat: -34.9065, lng: -56.1998 };
  const intendenciaMvd = { lat: -34.9056, lng: -56.1861 };

  beforeEach(() => {
    archivos = {};
    for (const k of Object.keys(escrituras)) delete escrituras[k];
  });

  it('la distancia (función pura) entre dos puntos conocidos da lo esperado, con 5% de margen', () => {
    const distancia = calcularDistanciaMetros(plazaIndependencia, intendenciaMvd);
    const distanciaEsperada = 1255;

    // Margen del 5%: entre 1192 y 1318 metros
    expect(distancia).toBeGreaterThanOrEqual(distanciaEsperada * 0.95);
    expect(distancia).toBeLessThanOrEqual(distanciaEsperada * 1.05);

    // Distancia al mismo punto es 0
    expect(calcularDistanciaMetros(plazaIndependencia, plazaIndependencia)).toBe(0);

    // Extracción de coordenadas de URLs
    const urlConArroba = 'https://www.google.com/maps/@-34.9065,-56.1998,17z';
    expect(extraerCoordenadasDeUrl(urlConArroba)).toEqual({ lat: -34.9065, lng: -56.1998 });

    const urlConParamQ = 'https://maps.google.com/?q=-34.9056,-56.1861';
    expect(extraerCoordenadasDeUrl(urlConParamQ)).toEqual({ lat: -34.9056, lng: -56.1861 });
  });

  it('a 1 km no marca la llegada si el interruptor está prendido y el radio es 300m', async () => {
    // Ajustes: llegadaConUbicacion prendido, radio 300m
    archivos['ajustes-llegada.json'] = {
      llegadaConUbicacion: true,
      radioMetros: 300,
    };

    const fiestaId = 'fiesta-100';
    archivos['accesos-personal.json'] = [
      {
        id: 'token-valido-1',
        fiestaId,
        empleadoId: 'emp-1',
        nombreAcceso: 'Juan DJ',
        permisos: ['itinerario'],
      },
    ];

    // Fiesta con salón en Plaza Independencia
    archivos[`fiestas/${fiestaId}.json`] = {
      id: fiestaId,
      configuracion: {
        nombreEvento: 'Boda Central',
        nombreLugar: 'Salón Plaza',
        googleMapsUrl: 'https://maps.google.com/?q=-34.9065,-56.1998',
      },
      personalAsignado: [
        {
          empleadoId: 'emp-1',
          rolId: 'dj',
          eventSalary: 2500,
        },
      ],
    };

    // El empleado está en la Intendencia (a 1.25 km del salón)
    const resultado = await registrarLlegadaPersonal('token-valido-1', intendenciaMvd);

    expect(resultado.success).toBe(false);
    expect(resultado.error).toContain('salón');
    expect(resultado.distanciaMetros).toBeGreaterThan(1000);

    // No debe haber guardado checkInTimestamp
    const fiestaActual = archivos[`fiestas/${fiestaId}.json`] as any;
    expect(fiestaActual.personalAsignado[0].checkInTimestamp).toBeUndefined();
  });

  it('con token inválido no marca', async () => {
    archivos['accesos-personal.json'] = [];

    const resultado = await registrarLlegadaPersonal('token-inexistente', plazaIndependencia);

    expect(resultado.success).toBe(false);
    expect(resultado.error).toContain('no válido');
    expect(Object.keys(escrituras).length).toBe(0);
  });

  it('apagado, marca como hoy (incluso estando lejos)', async () => {
    // Interruptor apagado de fábrica
    archivos['ajustes-llegada.json'] = {
      llegadaConUbicacion: false,
      radioMetros: 300,
    };

    const fiestaId = 'fiesta-200';
    archivos['accesos-personal.json'] = [
      {
        id: 'token-valido-2',
        fiestaId,
        empleadoId: 'emp-2',
        nombreAcceso: 'María Fotógrafa',
        permisos: ['fotografia'],
      },
    ];

    archivos[`fiestas/${fiestaId}.json`] = {
      id: fiestaId,
      configuracion: {
        nombreEvento: 'XV Sofía',
        nombreLugar: 'Club Uruguay',
        googleMapsUrl: 'https://maps.google.com/?q=-34.9065,-56.1998',
      },
      personalAsignado: [
        {
          empleadoId: 'emp-2',
          rolId: 'foto',
          eventSalary: 3000,
        },
      ],
    };

    // Marcamos llegada estando en la Intendencia (a más de 1km), pero como está apagado debe permitirlo
    const resultado = await registrarLlegadaPersonal('token-valido-2', intendenciaMvd);

    expect(resultado.success).toBe(true);

    const fiestaGuardada = archivos[`fiestas/${fiestaId}.json`] as any;
    expect(fiestaGuardada.personalAsignado[0].checkInTimestamp).toBeDefined();
  });

  describe('validaciones y concurrencia de orden 97', () => {
    it('con un acceso sin empleadoId, no se marca a nadie', async () => {
      const fiestaId = 'fiesta-sin-empleado';
      archivos['accesos-personal.json'] = [
        {
          id: 'token-sin-emp',
          fiestaId,
          // sin empleadoId
          nombreAcceso: 'Invitado Especial',
        },
      ];
      archivos[`fiestas/${fiestaId}.json`] = {
        id: fiestaId,
        personalAsignado: [
          { empleadoId: 'emp-1', rolId: 'dj' },
        ],
      };

      const resultado = await registrarLlegadaPersonal('token-sin-emp');
      expect(resultado.success).toBe(false);
      expect(resultado.error).toContain('no corresponde a una persona asignada');

      const fiestaGuardada = archivos[`fiestas/${fiestaId}.json`] as any;
      expect(fiestaGuardada.personalAsignado[0].checkInTimestamp).toBeUndefined();
    });

    it('con el de la persona 2, se marca la persona 2 y la persona 1 queda igual', async () => {
      const fiestaId = 'fiesta-dos-personas';
      archivos['ajustes-llegada.json'] = { llegadaConUbicacion: false };
      archivos['accesos-personal.json'] = [
        { id: 'tok-p1', fiestaId, empleadoId: 'emp-1' },
        { id: 'tok-p2', fiestaId, empleadoId: 'emp-2' },
      ];
      archivos[`fiestas/${fiestaId}.json`] = {
        id: fiestaId,
        personalAsignado: [
          { empleadoId: 'emp-1', rolId: 'dj' },
          { empleadoId: 'emp-2', rolId: 'foto' },
        ],
      };

      const resultado = await registrarLlegadaPersonal('tok-p2');
      expect(resultado.success).toBe(true);

      const fiestaGuardada = archivos[`fiestas/${fiestaId}.json`] as any;
      expect(fiestaGuardada.personalAsignado[0].checkInTimestamp).toBeUndefined();
      expect(fiestaGuardada.personalAsignado[1].checkInTimestamp).toBeDefined();
    });

    it('dos llegadas a la vez de dos personas distintas quedan las dos', async () => {
      const fiestaId = 'fiesta-concurrente';
      archivos['ajustes-llegada.json'] = { llegadaConUbicacion: false };
      archivos['accesos-personal.json'] = [
        { id: 'tok-c1', fiestaId, empleadoId: 'emp-1' },
        { id: 'tok-c2', fiestaId, empleadoId: 'emp-2' },
      ];
      archivos[`fiestas/${fiestaId}.json`] = {
        id: fiestaId,
        personalAsignado: [
          { empleadoId: 'emp-1', rolId: 'dj' },
          { empleadoId: 'emp-2', rolId: 'foto' },
        ],
      };

      const [res1, res2] = await Promise.all([
        registrarLlegadaPersonal('tok-c1'),
        registrarLlegadaPersonal('tok-c2'),
      ]);

      expect(res1.success).toBe(true);
      expect(res2.success).toBe(true);

      const fiestaGuardada = archivos[`fiestas/${fiestaId}.json`] as any;
      expect(fiestaGuardada.personalAsignado[0].checkInTimestamp).toBeDefined();
      expect(fiestaGuardada.personalAsignado[1].checkInTimestamp).toBeDefined();
    });
  });
});
