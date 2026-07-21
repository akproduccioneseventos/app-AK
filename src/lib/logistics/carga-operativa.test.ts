import {
  applyCargaOperativaItemPatch,
  mergeGeneratedCargaWithManualItems,
  mergeCargaOperativaStructure,
} from './carga-operativa';
import type { ListaDeCargaOperativa } from '@/types/fiesta';

const list: ListaDeCargaOperativa = {
  categorias: [{
    id: 'audio',
    nombre: 'Audio',
    items: [{
      id: 'parlante',
      nombre: 'Parlante',
      cantidad: '2',
      cargado: false,
      retornado: false,
    }],
  }],
};

const timestamp = '2026-06-12T15:00:00.000Z';

describe('carga operativa item updates', () => {
  it('records who loaded an item and when', () => {
    const result = applyCargaOperativaItemPatch(
      list,
      'audio',
      'parlante',
      { cargado: true },
      'Mario',
      timestamp,
    );
    const item = result.categorias[0].items[0];

    expect(item).toEqual(expect.objectContaining({
      cargado: true,
      cargadoAt: timestamp,
      cargadoPor: 'Mario',
      actualizadoAt: timestamp,
      actualizadoPor: 'Mario',
    }));
  });

  it('marks an item as loaded when it is returned', () => {
    const result = applyCargaOperativaItemPatch(
      list,
      'audio',
      'parlante',
      { retornado: true },
      'Laura',
      timestamp,
    );
    const item = result.categorias[0].items[0];

    expect(item.cargado).toBe(true);
    expect(item.retornado).toBe(true);
    expect(item.retornadoPor).toBe('Laura');
  });

  it('clears return data when loading is undone', () => {
    const loadedAndReturned = applyCargaOperativaItemPatch(
      list,
      'audio',
      'parlante',
      { retornado: true },
      'Laura',
      timestamp,
    );
    const result = applyCargaOperativaItemPatch(
      loadedAndReturned,
      'audio',
      'parlante',
      { cargado: false },
      'Laura',
      timestamp,
    );
    const item = result.categorias[0].items[0];

    expect(item.cargado).toBe(false);
    expect(item.retornado).toBe(false);
    expect(item.retornadoAt).toBeUndefined();
  });

  it('limits quantity text and rejects missing items', () => {
    const result = applyCargaOperativaItemPatch(
      list,
      'audio',
      'parlante',
      { cantidad: '123456789012345678901234567890999' },
      'Equipo',
      timestamp,
    );

    expect(result.categorias[0].items[0].cantidad).toHaveLength(30);
    expect(() => applyCargaOperativaItemPatch(
      list,
      'audio',
      'missing',
      { cargado: true },
      'Equipo',
      timestamp,
    )).toThrow('ya no existe');
  });

  it('preserves live checklist state when the structure is saved', () => {
    const current = applyCargaOperativaItemPatch(
      list,
      'audio',
      'parlante',
      { cargado: true },
      'Mario',
      timestamp,
    );
    const incoming: ListaDeCargaOperativa = {
      ...list,
      categorias: [{
        ...list.categorias[0],
        items: [{
          ...list.categorias[0].items[0],
          cantidad: '4',
          notas: 'Ubicar junto al escenario',
        }],
      }],
    };
    const merged = mergeCargaOperativaStructure(incoming, current);
    const item = merged.categorias[0].items[0];

    expect(item.cantidad).toBe('4');
    expect(item.notas).toBe('Ubicar junto al escenario');
    expect(item.cargado).toBe(true);
    expect(item.cargadoPor).toBe('Mario');
  });

  it('preserves manual items when the asset-generated checklist is rebuilt', () => {
    const current: ListaDeCargaOperativa = {
      categorias: [
        {
          id: 'audio',
          nombre: 'Audio',
          items: [
            { ...list.categorias[0].items[0], origenId: 'activo_parlante' },
            { id: 'manual-cable', nombre: 'Cable especial', cantidad: '1', cargado: false },
          ],
        },
        {
          id: 'documentos',
          nombre: 'Documentos',
          items: [{ id: 'manual-contrato', nombre: 'Contrato', cantidad: '1', cargado: true }],
        },
      ],
      notasGenerales: 'Revisar con el encargado',
    };
    const generated: ListaDeCargaOperativa = {
      categorias: [{
        id: 'audio',
        nombre: 'Audio',
        items: [{
          id: 'gen_activo_parlante',
          nombre: 'Parlante actualizado',
          cantidad: '4',
          cargado: false,
          origenId: 'activo_parlante',
        }],
      }],
    };

    const result = mergeGeneratedCargaWithManualItems(generated, current);

    expect(result.categorias[0].items.map((item) => item.id)).toEqual([
      'gen_activo_parlante',
      'manual-cable',
    ]);
    expect(result.categorias[1].items[0].id).toBe('manual-contrato');
    expect(result.notasGenerales).toBe('Revisar con el encargado');
  });
});
