/**
 * @jest-environment node
 */
jest.mock('server-only', () => ({}), { virtual: true });

const memoriaDatos: Record<string, any> = {};

jest.mock('@/ai/cerebro', () => ({
  leerImagen: jest.fn(),
}));

jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn(async () => true),
  getResumenDeGasto: jest.fn(async () => ({
    topeDiarioProfundo: 40,
    respuestasProfundasHoy: 0,
    frenado: false,
  })),
}));

jest.mock('@/app/actions/servicios-empresa', () => ({
  getServiciosEmpresaPublicos: jest.fn(async () => [
    { id: 'serv_fuente_chocolate', nombre: 'Fuente de chocolate', categoria: 'Postres' },
    { id: 'serv_fotocabina', nombre: 'Fotocabina', categoria: 'Entretenimiento' },
  ]),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => undefined),
  requirePermisoAlguno: jest.fn(async () => undefined),
}));

jest.mock('@/lib/decoracion/catalog-service', () => ({
  syncDecorationCatalog: jest.fn(async () => undefined),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) =>
    memoriaDatos[file] !== undefined
      ? JSON.parse(JSON.stringify(memoriaDatos[file]))
      : JSON.parse(JSON.stringify(fallback)),
  ),
  writeData: jest.fn(async (file: string, data: any) => {
    memoriaDatos[file] = JSON.parse(JSON.stringify(data));
  }),
}));

jest.mock('@/lib/generic-json-store', () => ({
  mutarDocumento: jest.fn(async <T>(file: string, vacio: T, cambiar: (actual: T) => T) => {
    const actual = memoriaDatos[file] !== undefined
      ? JSON.parse(JSON.stringify(memoriaDatos[file]))
      : JSON.parse(JSON.stringify(vacio));
    const siguiente = await cambiar(actual);
    memoriaDatos[file] = JSON.parse(JSON.stringify(siguiente));
    return siguiente;
  }),
}));

import { leerImagen } from '@/ai/cerebro';
import { addGaleriaFoto, getFotosDelServicio } from '@/app/actions/galeria';
import { clasificarFotoDeGaleria } from '@/lib/galeria/clasificar-foto';
import { clasificarPendientesGaleriaIA } from '@/lib/automatico/clasificar-galeria-ia';
import type { GaleriaFoto } from '@/types/galeria';

const mockLeerImagen = leerImagen as jest.MockedFunction<typeof leerImagen>;

const CATALOGO_PRUEBA = [
  { id: 'serv_fuente_chocolate', nombre: 'Fuente de chocolate', categoria: 'Postres' },
  { id: 'serv_fotocabina', nombre: 'Fotocabina', categoria: 'Entretenimiento' },
];

function crearFotoBase(overrides: Partial<GaleriaFoto> = {}): GaleriaFoto {
  return {
    id: 'foto_1',
    tipo: 'foto',
    url: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
    categoria: 'Postres',
    destacada: false,
    orden: 0,
    createdAt: '2026-11-25T10:00:00.000Z',
    ...overrides,
  };
}

describe('Orden 348 — La IA ordena las fotos sola y respeta lo manual', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const key of Object.keys(memoriaDatos)) {
      delete memoriaDatos[key];
    }
    memoriaDatos['galeria-publica.json'] = { fotos: [], videos: [] };
  });

  it('asigna el servicioId real y clasificadaPor: ia cuando la confianza es alta', async () => {
    mockLeerImagen.mockResolvedValueOnce({
      ok: true,
      modelo: 'gemini-2.5-flash',
      topeAlcanzado: false,
      texto: JSON.stringify({
        servicioId: 'serv_fuente_chocolate',
        tipoFiesta: '15 Años',
        titulo: 'Fuente de chocolate en fiesta de 15',
        confianza: 0.92,
      }),
    });

    const resultado = await clasificarFotoDeGaleria(crearFotoBase(), {
      servicios: CATALOGO_PRUEBA,
    });

    expect(resultado.actualizada).toBe(true);
    expect(resultado.cambios.servicioId).toBe('serv_fuente_chocolate');
    expect(resultado.cambios.tipoFiesta).toBe('15 Años');
    expect(resultado.cambios.clasificadaPor).toBe('ia');
  });

  it('no guarda un servicioId inventado por la IA ni un tipo de fiesta fuera de la lista', async () => {
    mockLeerImagen.mockResolvedValueOnce({
      ok: true,
      modelo: 'gemini-2.5-flash',
      topeAlcanzado: false,
      texto: JSON.stringify({
        servicioId: 'serv_inventado_que_no_existe',
        tipoFiesta: 'Fiesta Inventada',
        titulo: 'Algo raro',
        confianza: 0.95,
      }),
    });

    const resultado = await clasificarFotoDeGaleria(crearFotoBase(), {
      servicios: CATALOGO_PRUEBA,
    });

    expect(resultado.actualizada).toBe(false);
    expect(resultado.cambios.servicioId).toBeUndefined();
    expect(resultado.cambios.tipoFiesta).toBeUndefined();
  });

  it('con confianza menor a 0,6 (ej. 0,4) no asigna nada', async () => {
    mockLeerImagen.mockResolvedValueOnce({
      ok: true,
      modelo: 'gemini-2.5-flash',
      topeAlcanzado: false,
      texto: JSON.stringify({
        servicioId: 'serv_fuente_chocolate',
        tipoFiesta: 'Bodas',
        titulo: 'Dudosa',
        confianza: 0.4,
      }),
    });

    const resultado = await clasificarFotoDeGaleria(crearFotoBase(), {
      servicios: CATALOGO_PRUEBA,
    });

    expect(resultado.actualizada).toBe(false);
    expect(resultado.motivo).toBe('confianza-baja');
    expect(resultado.cambios).toEqual({});
  });

  it('nunca pisa una foto corregida manualmente por una persona (clasificadaPor: persona)', async () => {
    const fotoManual = crearFotoBase({
      id: 'foto_manual',
      servicioId: 'serv_fotocabina',
      servicio: 'Fotocabina',
      tipoFiesta: 'Bodas',
      clasificadaPor: 'persona',
    });

    const resultado = await clasificarFotoDeGaleria(fotoManual, {
      servicios: CATALOGO_PRUEBA,
    });

    expect(resultado.actualizada).toBe(false);
    expect(resultado.motivo).toBe('clasificada-por-persona');
    expect(mockLeerImagen).not.toHaveBeenCalled();
  });

  it('si la IA falla al subir una foto, la foto igual queda guardada en la galería', async () => {
    mockLeerImagen.mockRejectedValueOnce(new Error('Falla temporal de Gemini'));

    const nuevaFoto = crearFotoBase({ id: 'foto_falla_ia' });
    await addGaleriaFoto(nuevaFoto);

    const guardadas = memoriaDatos['galeria-publica.json'].fotos as GaleriaFoto[];
    expect(guardadas).toHaveLength(1);
    expect(guardadas[0].id).toBe('foto_falla_ia');
    expect(guardadas[0].servicioId).toBeUndefined();
  });

  it('getFotosDelServicio busca primero por servicioId y si no hay cae al texto sin tildes ni mayúsculas', async () => {
    memoriaDatos['galeria-publica.json'] = {
      fotos: [
        crearFotoBase({
          id: 'foto_por_id',
          servicioId: 'serv_fuente_chocolate',
          servicio: 'Otra cosa',
        }),
        crearFotoBase({
          id: 'foto_por_texto',
          servicio: 'Decoracion',
        }),
      ],
      videos: [],
    };

    const porId = await getFotosDelServicio('serv_fuente_chocolate', 'Fuente de chocolate');
    expect(porId.map((f) => f.id)).toEqual(['foto_por_id']);

    const porTexto = await getFotosDelServicio('serv_sin_id_match', 'Decoración');
    expect(porTexto.map((f) => f.id)).toEqual(['foto_por_texto']);
  });

  it('la tarea automática clasifica hasta 20 fotos por corrida y omite las de persona', async () => {
    const fotos: GaleriaFoto[] = [];
    for (let i = 0; i < 25; i++) {
      fotos.push(crearFotoBase({ id: `pendiente_${i}`, orden: i }));
    }
    fotos.push(
      crearFotoBase({
        id: 'ya_manual',
        clasificadaPor: 'persona',
        orden: 99,
      }),
    );
    memoriaDatos['galeria-publica.json'] = { fotos, videos: [] };

    mockLeerImagen.mockResolvedValue({
      ok: true,
      modelo: 'gemini-2.5-flash',
      topeAlcanzado: false,
      texto: JSON.stringify({
        servicioId: 'serv_fuente_chocolate',
        tipoFiesta: '15 Años',
        titulo: 'Fuente de chocolate',
        confianza: 0.9,
      }),
    });

    const corrida = await clasificarPendientesGaleriaIA();
    expect(corrida.procesadas).toBe(20);
    expect(corrida.clasificadas).toBe(20);

    const guardadas = memoriaDatos['galeria-publica.json'].fotos as GaleriaFoto[];
    const manual = guardadas.find((f) => f.id === 'ya_manual');
    expect(manual?.clasificadaPor).toBe('persona');
    expect(manual?.servicioId).toBeUndefined();
  });
});
