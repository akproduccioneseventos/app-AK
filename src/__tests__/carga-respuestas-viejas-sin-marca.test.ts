import { mergeRemoteOperationalState } from '@/lib/logistica/mezclar-carga';
import type { ListaDeCargaOperativa } from '@/types/fiesta';

describe('mergeRemoteOperationalState (Orden 85 / LOG04)', () => {
  const baseLocal: ListaDeCargaOperativa = {
    updatedAt: '2026-09-25T12:00:00.000Z',
    updatedBy: 'operador-1',
    categorias: [
      {
        id: 'cat-sonido',
        nombre: 'Sonido',
        items: [
          {
            id: 'item-parlante',
            nombre: 'Parlante RCF',
            cantidad: 2,
            cargado: true,
            cargadoAt: '2026-09-25T12:00:01.000Z',
            actualizadoAt: '2026-09-25T12:00:01.000Z',
            actualizadoPor: 'operador-1',
          },
          {
            id: 'item-consola',
            nombre: 'Consola Behringer',
            cantidad: 1,
            cargado: true,
            cargadoAt: '2026-09-25T12:00:02.000Z',
            actualizadoAt: '2026-09-25T12:00:02.000Z',
            actualizadoPor: 'operador-1',
          },
        ],
      },
    ],
  };

  it('no desmarca un ítem marcado localmente si llega una foto vieja sin actualizadoAt (orden invertido / lag)', () => {
    // Foto vieja donde item-consola todavía no tenía marca ni actualizadoAt
    const remoteViejoSinMarca: ListaDeCargaOperativa = {
      updatedAt: '2026-09-25T11:59:59.000Z',
      categorias: [
        {
          id: 'cat-sonido',
          nombre: 'Sonido',
          items: [
            {
              id: 'item-parlante',
              nombre: 'Parlante RCF',
              cantidad: 2,
              cargado: true,
              actualizadoAt: '2026-09-25T12:00:01.000Z',
            },
            {
              id: 'item-consola',
              nombre: 'Consola Behringer',
              cantidad: 1,
              cargado: false, // sin marcar
              // sin actualizadoAt
            },
          ],
        },
      ],
    };

    const resultado = mergeRemoteOperationalState(baseLocal, remoteViejoSinMarca, {
      currentFiestaId: 'fiesta-123',
      remoteFiestaId: 'fiesta-123',
      lastAppliedUpdatedAt: null, // probando a nivel de renglón
    });

    const itemConsola = resultado.categorias[0].items.find((i) => i.id === 'item-consola');
    expect(itemConsola?.cargado).toBe(true);
    expect(itemConsola?.actualizadoAt).toBe('2026-09-25T12:00:02.000Z');
  });

  it('no desmarca si el remoto tiene actualizadoAt más viejo que el local', () => {
    const remoteConMarcaVieja: ListaDeCargaOperativa = {
      updatedAt: '2026-09-25T12:00:00.000Z',
      categorias: [
        {
          id: 'cat-sonido',
          nombre: 'Sonido',
          items: [
            {
              id: 'item-consola',
              nombre: 'Consola Behringer',
              cantidad: 1,
              cargado: false,
              actualizadoAt: '2026-09-25T11:59:00.000Z', // anterior al 12:00:02
            },
          ],
        },
      ],
    };

    const resultado = mergeRemoteOperationalState(baseLocal, remoteConMarcaVieja);
    const itemConsola = resultado.categorias[0].items.find((i) => i.id === 'item-consola');
    expect(itemConsola?.cargado).toBe(true);
  });

  it('sí gana un desmarcado intencional posterior con actualizadoAt más nuevo', () => {
    const remoteDesmarcadoIntencional: ListaDeCargaOperativa = {
      updatedAt: '2026-09-25T12:05:00.000Z',
      updatedBy: 'operador-2',
      categorias: [
        {
          id: 'cat-sonido',
          nombre: 'Sonido',
          items: [
            {
              id: 'item-consola',
              nombre: 'Consola Behringer',
              cantidad: 1,
              cargado: false,
              actualizadoAt: '2026-09-25T12:05:00.000Z', // posterior al 12:00:02
              actualizadoPor: 'operador-2',
            },
          ],
        },
      ],
    };

    const resultado = mergeRemoteOperationalState(baseLocal, remoteDesmarcadoIntencional);
    const itemConsola = resultado.categorias[0].items.find((i) => i.id === 'item-consola');
    expect(itemConsola?.cargado).toBe(false);
    expect(itemConsola?.actualizadoAt).toBe('2026-09-25T12:05:00.000Z');
    expect(itemConsola?.actualizadoPor).toBe('operador-2');
  });

  it('no pisa la cantidad si el operador tiene el foco en ese ítem', () => {
    const remoteModificado: ListaDeCargaOperativa = {
      updatedAt: '2026-09-25T12:05:00.000Z',
      categorias: [
        {
          id: 'cat-sonido',
          nombre: 'Sonido',
          items: [
            {
              id: 'item-parlante',
              nombre: 'Parlante RCF',
              cantidad: 4, // remoto dice 4
              cargado: true,
              actualizadoAt: '2026-09-25T12:05:00.000Z',
            },
          ],
        },
      ],
    };

    // Usuario está escribiendo en item-parlante (foco activo)
    const resultadoConFoco = mergeRemoteOperationalState(baseLocal, remoteModificado, 'item-parlante');
    const parlanteConFoco = resultadoConFoco.categorias[0].items.find((i) => i.id === 'item-parlante');
    expect(parlanteConFoco?.cantidad).toBe(2); // mantiene local

    // Sin foco en item-parlante
    const resultadoSinFoco = mergeRemoteOperationalState(baseLocal, remoteModificado, 'otro-item');
    const parlanteSinFoco = resultadoSinFoco.categorias[0].items.find((i) => i.id === 'item-parlante');
    expect(parlanteSinFoco?.cantidad).toBe(4); // toma remoto
  });

  it('descarta la respuesta entera si es de otra fiesta', () => {
    const remoteOtraFiesta: ListaDeCargaOperativa = {
      updatedAt: '2026-09-25T12:10:00.000Z',
      categorias: [
        {
          id: 'cat-sonido',
          nombre: 'Sonido',
          items: [
            {
              id: 'item-consola',
              nombre: 'Consola Behringer',
              cantidad: 99,
              cargado: false,
              actualizadoAt: '2026-09-25T12:10:00.000Z',
            },
          ],
        },
      ],
    };

    const resultado = mergeRemoteOperationalState(baseLocal, remoteOtraFiesta, {
      currentFiestaId: 'fiesta-123',
      remoteFiestaId: 'fiesta-999',
    });

    expect(resultado).toBe(baseLocal);
  });

  it('descarta la respuesta entera si updatedAt es más viejo que lastAppliedUpdatedAt', () => {
    const remoteViejo: ListaDeCargaOperativa = {
      updatedAt: '2026-09-25T11:50:00.000Z',
      categorias: [
        {
          id: 'cat-sonido',
          nombre: 'Sonido',
          items: [
            {
              id: 'item-consola',
              nombre: 'Consola Behringer',
              cantidad: 1,
              cargado: false,
              actualizadoAt: '2026-09-25T11:50:00.000Z',
            },
          ],
        },
      ],
    };

    const resultado = mergeRemoteOperationalState(baseLocal, remoteViejo, {
      currentFiestaId: 'fiesta-123',
      remoteFiestaId: 'fiesta-123',
      lastAppliedUpdatedAt: '2026-09-25T12:00:00.000Z',
    });

    expect(resultado).toBe(baseLocal);
  });
});
