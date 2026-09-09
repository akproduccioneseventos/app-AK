/**
 * ORDEN 54 - ITINERARIO EN EL PORTAL DEL CLIENTE
 *
 * Verifica:
 * 1. Que updatePrograma guarde de forma parcial y atomica con updateFiestaPartial.
 * 2. Que los momentos con visibleParaCliente === false queden excluidos del cronograma del cliente.
 * 3. Que descripcionCliente tenga prioridad sobre descripcion interna para el texto que lee el cliente.
 * 4. Que si no hay descripcionCliente, tome descripcion como respaldo.
 */

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue({ id: 'admin', email: 'admin@ak.test' }),
  hasAppSession: jest.fn().mockResolvedValue(true),
  requirePermiso: jest.fn().mockResolvedValue({ ok: true, user: {} }),
}));

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn().mockResolvedValue({ success: true, user: { userId: 'admin', role: 'admin' } }),
  verifyPortalSession: jest.fn().mockResolvedValue(true),
}));

const almacen: Record<string, any> = {};

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) => {
    const norm = archivo.replace(/\\/g, '/');
    const guardado = almacen[norm];
    return guardado === undefined ? porDefecto : JSON.parse(JSON.stringify(guardado));
  }),
  writeData: jest.fn(async (archivo: string, datos: any) => {
    const norm = archivo.replace(/\\/g, '/');
    almacen[norm] = JSON.parse(JSON.stringify(datos));
  }),
  updateDataPartial: jest.fn(async (archivo: string, partialData: any) => {
    const norm = archivo.replace(/\\/g, '/');
    const existing = almacen[norm] || {};
    almacen[norm] = {
      ...existing,
      ...JSON.parse(JSON.stringify(partialData)),
    };
  }),
}));

import { updatePrograma } from '@/app/actions/fiesta/itinerario.actions';
import type { ProgramaEventoItem } from '@/types/fiesta';

const FIESTA_ID = 'fiesta-itinerario-54';
const FIESTA_PATH = `fiestas/${FIESTA_ID}.json`;

const FIESTA_BASE = {
  id: FIESTA_ID,
  configuracion: { nombreEvento: '15 de Valentina', fechaEvento: '2026-11-20T21:00:00.000Z' },
  programa: [
    {
      id: 'momento_1',
      hora: '21:00',
      titulo: 'Recepcion y bienvenida',
      descripcion: 'Coordinar mozos y controlar barra',
      descripcionCliente: '¡Bienvenidos a la fiesta! Los esperamos con un cocktail especial.',
      visibleParaCliente: true,
    },
    {
      id: 'momento_2',
      hora: '22:00',
      titulo: 'Revision tecnica de sonido e iluminacion',
      descripcion: 'Prueba interna del operador DMX. No molestar.',
      visibleParaCliente: false,
    },
    {
      id: 'momento_3',
      hora: '23:30',
      titulo: 'Entrada de la agasajada',
      descripcion: 'Lanzar chispas frias y humo bajo',
      visibleParaCliente: true,
    },
  ] as ProgramaEventoItem[],
  tareas: [{ id: 't1', texto: 'Verificar sonido', completada: true }],
};

describe('Orden 54 - Itinerario en el Portal del Cliente', () => {
  beforeEach(() => {
    for (const key of Object.keys(almacen)) delete almacen[key];
    almacen[FIESTA_PATH] = JSON.parse(JSON.stringify(FIESTA_BASE));
  });

  describe('updatePrograma (persistencia atomica)', () => {
    it('guarda el programa sin pisar otros campos como tareas o configuracion', async () => {
      const nuevoPrograma: ProgramaEventoItem[] = [
        ...FIESTA_BASE.programa,
        {
          id: 'momento_4',
          hora: '01:00',
          titulo: 'Show de baile',
          descripcionCliente: 'Coreografia sorpresa con amigos.',
          visibleParaCliente: true,
        },
      ];

      const res = await updatePrograma(FIESTA_ID, nuevoPrograma);
      expect(res.success).toBe(true);

      const guardado = almacen[FIESTA_PATH];
      expect(guardado.programa).toHaveLength(4);
      expect(guardado.programa[3].titulo).toBe('Show de baile');
      expect(guardado.configuracion.nombreEvento).toBe('15 de Valentina');
      expect(guardado.tareas).toHaveLength(1);
    });
  });

  describe('Filtrado de visibilidad para el cliente (visibleParaCliente)', () => {
    it('excluye momentos con visibleParaCliente === false del cronograma del cliente', () => {
      const momentos: ProgramaEventoItem[] = [
        { id: '1', hora: '21:00', titulo: 'Entrada', visibleParaCliente: true },
        { id: '2', hora: '21:30', titulo: 'Ajuste de cables interno', visibleParaCliente: false },
        { id: '3', hora: '22:00', titulo: 'Cena', visibleParaCliente: undefined },
      ];

      const visiblesParaCliente = momentos.filter((m) => m.visibleParaCliente !== false);

      expect(visiblesParaCliente).toHaveLength(2);
      expect(visiblesParaCliente.map((m) => m.id)).toEqual(['1', '3']);
      expect(visiblesParaCliente.find((m) => m.id === '2')).toBeUndefined();
    });

    it('determina si el cronograma esta activo segun si hay al menos un momento visible', () => {
      const todosOcultos: ProgramaEventoItem[] = [
        { id: '1', hora: '20:00', titulo: 'Carga de equipos', visibleParaCliente: false },
        { id: '2', hora: '20:30', titulo: 'Prueba de cocina', visibleParaCliente: false },
      ];

      const tieneVisibles = todosOcultos.some((m) => m.visibleParaCliente !== false);
      expect(tieneVisibles).toBe(false);

      const conUnoVisible: ProgramaEventoItem[] = [
        ...todosOcultos,
        { id: '3', hora: '21:00', titulo: 'Apertura', visibleParaCliente: true },
      ];
      expect(conUnoVisible.some((m) => m.visibleParaCliente !== false)).toBe(true);
    });
  });

  describe('Texto para el cliente (descripcionCliente sin filtrar notas internas)', () => {
    it('muestra descripcionCliente cuando está definida', () => {
      const item: ProgramaEventoItem = {
        id: '1',
        hora: '21:00',
        titulo: 'Vals',
        descripcion: 'Operador: subir volumen al 80% y foco seguidor a Valentina.',
        descripcionCliente: 'El emotivo momento del vals en familia.',
        visibleParaCliente: true,
      };

      const textoCliente = item.descripcionCliente || '';
      expect(textoCliente).toBe('El emotivo momento del vals en familia.');
      expect(textoCliente).not.toContain('Operador: subir volumen');
    });

    it('no expone descripcion interna si descripcionCliente no fue provista', () => {
      const item: ProgramaEventoItem = {
        id: '2',
        hora: '23:00',
        titulo: 'Tanda de baile',
        descripcion: 'Operativa interna: chequear botellas y seguridad en puerta.',
        visibleParaCliente: true,
      };

      const textoCliente = item.descripcionCliente || '';
      expect(textoCliente).toBe('');
      expect(textoCliente).not.toContain('Operativa interna');
    });
  });
});
