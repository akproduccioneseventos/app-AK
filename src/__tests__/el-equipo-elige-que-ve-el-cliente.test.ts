/**
 * ORDEN 54 - EL EQUIPO ELIGE QUE VE EL CLIENTE
 *
 * Pantalla evaluada: /fiestas/nueva/itinerario
 *
 * Comprueba:
 * 1. Al alternar visibleParaCliente a false y guardar con updatePrograma, el momento
 *    deja de salir en lo que recibe el cliente (mapFiestaToClientPortal / mapProgramaParaElCliente).
 * 2. Los momentos con visibleParaCliente !== false se conservan.
 * 3. El texto que lee el cliente (descripcionCliente) se entrega limpiamente sin filtrar
 *    notas internas del equipo (descripcion).
 * 4. Los momentos viejos sin marca de visibilidad siguen viéndose para no romper fiestas en curso.
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
import { mapFiestaToClientPortal, mapProgramaParaElCliente } from '@/lib/client-portal/public-fiesta';
import type { ProgramaEventoItem } from '@/types/fiesta';

const FIESTA_ID = 'fiesta-orden-54-cliente';
const FIESTA_PATH = `fiestas/${FIESTA_ID}.json`;

const FIESTA_INICIAL = {
  id: FIESTA_ID,
  configuracion: { nombreEvento: 'Boda de Sofia y Martin' },
  programa: [
    {
      id: 'momento_1',
      hora: '20:00',
      titulo: 'Recepcion de bienvenida',
      descripcion: 'Nota tecnica de catering',
      descripcionCliente: 'Recepcion con tragos y canapes en el parque',
      visibleParaCliente: true,
    },
    {
      id: 'momento_2',
      hora: '21:00',
      titulo: 'Ajuste interno del sonido y laser',
      descripcion: 'Prueba de potencia operador',
      descripcionCliente: '',
      visibleParaCliente: true, // Inicialmente visible
    },
    {
      id: 'momento_3',
      hora: '22:00',
      titulo: 'Cena principal',
      // Sin marca de visibilidad (como los datos historicos)
    },
  ] as ProgramaEventoItem[],
};

describe('Orden 54 - El equipo elige que ve el cliente en el itinerario', () => {
  beforeEach(() => {
    for (const key of Object.keys(almacen)) delete almacen[key];
    almacen[FIESTA_PATH] = JSON.parse(JSON.stringify(FIESTA_INICIAL));
  });

  it('al marcar un momento como interno con el interruptor y guardar, deja de salir en lo que recibe el cliente', async () => {
    // 1. Antes de apagar el interruptor, el momento sale en la proyeccion del portal
    let portalAntes = mapFiestaToClientPortal(almacen[FIESTA_PATH]);
    expect(portalAntes?.programa?.map((p: any) => p.id)).toContain('momento_2');

    // 2. El equipo apaga el interruptor de "Visible para cliente" en la pantalla de itinerario
    const programaModificado: ProgramaEventoItem[] = FIESTA_INICIAL.programa.map((item) =>
      item.id === 'momento_2' ? { ...item, visibleParaCliente: false } : item
    );

    // 3. Se guarda con la accion del servidor
    const resultadoGuardado = await updatePrograma(FIESTA_ID, programaModificado);
    expect(resultadoGuardado.success).toBe(true);

    // 4. Lo que recibe el cliente en su portal se verifica: el momento 2 DEJA DE SALIR
    const fiestaActualizada = almacen[FIESTA_PATH];
    const portalDespues = mapFiestaToClientPortal(fiestaActualizada);
    const idsVisibles = (portalDespues?.programa ?? []).map((p: any) => p.id);

    expect(idsVisibles).not.toContain('momento_2');
    expect(idsVisibles).toContain('momento_1');
    expect(idsVisibles).toContain('momento_3'); // El momento sin marca sigue viendose
  });

  it('el texto del cliente no filtra notas tecnicas ni responsables del equipo', () => {
    const programa = [
      {
        id: 'p1',
        hora: '23:00',
        titulo: 'Entrada agasajados',
        descripcion: 'Operador: chispas y bajar luces',
        descripcionCliente: '¡Momento magico de ingreso!',
        responsableNombre: 'Martin DJ',
        visibleParaCliente: true,
      },
    ];

    const resultadoCliente = mapProgramaParaElCliente(programa);
    expect(resultadoCliente).toHaveLength(1);
    expect(resultadoCliente[0].titulo).toBe('Entrada agasajados');
    expect(resultadoCliente[0].descripcionCliente).toBe('¡Momento magico de ingreso!');
    // No expone notas tecnicas ni responsables
    expect((resultadoCliente[0] as any).descripcion).toBeUndefined();
    expect((resultadoCliente[0] as any).responsableNombre).toBeUndefined();
  });
});
