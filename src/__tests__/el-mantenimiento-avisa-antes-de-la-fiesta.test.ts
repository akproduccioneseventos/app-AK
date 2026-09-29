import { describe, it, expect } from '@jest/globals';
import {
  equipoTieneMantenimientoVencido,
  verificarEquiposConMantenimientoVencidoEnFiesta,
  evaluarReglasParaFiesta,
} from '@/lib/automatizaciones-engine';
import type { ServicioEmpresa } from '@/types/empresa';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

describe('Mantenimiento preventivo de equipos y avisos antes de la fiesta', () => {
  const ahora = new Date('2026-10-01T12:00:00Z');

  it('un equipo sin cadaDias no dispara mantenimiento vencido nunca', () => {
    const equipoSinFrecuencia: Partial<ServicioEmpresa> = {
      id: 'eq-1',
      nombre: 'Parlante activo 15"',
      mantenimiento: {
        ultimoAt: '2025-01-01',
      },
    };

    expect(equipoTieneMantenimientoVencido(equipoSinFrecuencia, ahora)).toBe(false);

    const equipoVacio: Partial<ServicioEmpresa> = {
      id: 'eq-2',
      nombre: 'Consola DMX',
    };

    expect(equipoTieneMantenimientoVencido(equipoVacio, ahora)).toBe(false);
  });

  it('detecta equipo con mantenimiento vencido según cadaDias y ultimoAt', () => {
    // Vencido: hace 40 días fue el último y la frecuencia es cada 30 días
    const equipoVencido: Partial<ServicioEmpresa> = {
      id: 'eq-vencido',
      nombre: 'Máquina de humo',
      mantenimiento: {
        cadaDias: 30,
        ultimoAt: '2026-08-20',
      },
    };
    expect(equipoTieneMantenimientoVencido(equipoVencido, ahora)).toBe(true);

    // Al día: hace 10 días fue el último y la frecuencia es cada 30 días
    const equipoAlDia: Partial<ServicioEmpresa> = {
      id: 'eq-al-dia',
      nombre: 'Robotica Beam 7R',
      mantenimiento: {
        cadaDias: 30,
        ultimoAt: '2026-09-25',
      },
    };
    expect(equipoTieneMantenimientoVencido(equipoAlDia, ahora)).toBe(false);
  });

  it('un equipo vencido y asignado a una fiesta en 5 días dispara el aviso', () => {
    const equipoVencido: ServicioEmpresa = {
      id: 'eq-laser-1',
      nombre: 'Láser RGB 3W',
      categoria: 'Iluminación',
      tipo: 'activo-fijo',
      unidad: 'unidades',
      mantenimiento: {
        cadaDias: 60,
        ultimoAt: '2026-06-01', // Más de 120 días
      },
    };

    // Fiesta en 5 días: fechaEvento es 2026-10-06
    const fiestaEn5Dias: FiestaEnPlanificacion = {
      id: 'fiesta-123',
      nombre: 'Boda Lucía y Martín',
      configuracion: {
        fechaEvento: '2026-10-06',
        horarioInicio: '21:00',
        tipoCelebracion: 'Boda',
      },
      listaDeCargaOperativa: {
        categorias: [
          {
            nombre: 'Iluminación',
            items: [
              {
                id: 'carga-item-1',
                origenId: 'eq-laser-1',
                nombre: 'Láser RGB 3W',
                cantidadRequerida: 1,
                cantidadCargada: 0,
                cargado: false,
                retornado: false,
              },
            ],
          },
        ],
      },
    };

    // Verificación directa en la lista de carga
    const vencidosEnFiesta = verificarEquiposConMantenimientoVencidoEnFiesta(
      fiestaEn5Dias,
      [equipoVencido],
      ahora,
    );
    expect(vencidosEnFiesta).toHaveLength(1);
    expect(vencidosEnFiesta[0].id).toBe('eq-laser-1');

    // Verificación en el motor de alertas automáticas
    const alertas = evaluarReglasParaFiesta(
      fiestaEn5Dias,
      undefined,
      [equipoVencido],
      ahora,
    );

    const alertaMantenimiento = alertas.find(
      (a) => a.id.startsWith('mantenimiento-equipo-vencido') || a.area === 'equipamiento',
    );
    expect(alertaMantenimiento).toBeDefined();
    expect(alertaMantenimiento?.area).toBe('equipamiento');
    expect(alertaMantenimiento?.mensaje).toContain('mantenimiento vencido');
  });

  it('un equipo sin cadaDias asignado a una fiesta en 5 días no dispara nunca', () => {
    const equipoSinCadaDias: ServicioEmpresa = {
      id: 'eq-cable-1',
      nombre: 'Alargue 20m',
      categoria: 'Varios',
      tipo: 'activo-fijo',
      unidad: 'unidades',
      mantenimiento: {
        ultimoAt: '2025-01-01',
      },
    };

    const fiestaEn5Dias: FiestaEnPlanificacion = {
      id: 'fiesta-124',
      nombre: 'Cumpleaños 15 Sofía',
      configuracion: {
        fechaEvento: '2026-10-06',
      },
      listaDeCargaOperativa: {
        categorias: [
          {
            nombre: 'Varios',
            items: [
              {
                id: 'carga-item-2',
                origenId: 'eq-cable-1',
                nombre: 'Alargue 20m',
                cantidadRequerida: 2,
                cantidadCargada: 0,
                cargado: false,
                retornado: false,
              },
            ],
          },
        ],
      },
    };

    const vencidos = verificarEquiposConMantenimientoVencidoEnFiesta(
      fiestaEn5Dias,
      [equipoSinCadaDias],
      ahora,
    );
    expect(vencidos).toHaveLength(0);

    const alertas = evaluarReglasParaFiesta(
      fiestaEn5Dias,
      undefined,
      [equipoSinCadaDias],
      ahora,
    );
    const alertaMantenimiento = alertas.find((a) => a.id.startsWith('mantenimiento-equipo-vencido'));
    expect(alertaMantenimiento).toBeUndefined();
  });
});
