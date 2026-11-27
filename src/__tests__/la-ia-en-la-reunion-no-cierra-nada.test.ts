/**
 * @jest-environment node
 */
import fs from 'node:fs';
import path from 'node:path';

jest.mock('server-only', () => ({}), { virtual: true });

jest.mock('@/ai/cerebro', () => ({
  pedirTexto: jest.fn(),
}));

const mockHasAppSession = jest.fn(async () => true);
jest.mock('@/lib/auth/require-session', () => ({
  hasAppSession: () => mockHasAppSession(),
}));

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn(async () => undefined),
}));

jest.mock('@/app/actions/servicios-empresa', () => ({
  getServiciosEmpresaPublicos: jest.fn(async () => [
    { id: 'serv_fuente_chocolate', nombre: 'Fuente de chocolate', categoria: 'Postres' },
    { id: 'serv_fotocabina', nombre: 'Fotocabina', categoria: 'Entretenimiento' },
    { id: 'serv_barra_tragos', nombre: 'Barra de tragos', categoria: 'Bebidas' },
  ]),
}));

import { pedirTexto } from '@/ai/cerebro';
import { interpretarPedidoPresentacionIA } from '@/app/actions/presentacion-ia';

const mockPedirTexto = pedirTexto as jest.MockedFunction<typeof pedirTexto>;

const CATALOGO = [
  { id: 'serv_fuente_chocolate', nombre: 'Fuente de chocolate', categoria: 'Postres' },
  { id: 'serv_fotocabina', nombre: 'Fotocabina', categoria: 'Entretenimiento' },
  { id: 'serv_barra_tragos', nombre: 'Barra de tragos', categoria: 'Bebidas' },
];

describe('Orden 348 — La IA en la reunión interpreta cambios pero nunca guarda ni cierra presupuestos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('"agregá la fuente de chocolate" devuelve accion agregar con el servicioId real del catálogo', async () => {
    mockPedirTexto.mockResolvedValueOnce({
      ok: true,
      modelo: 'gemini-2.5-flash',
      topeAlcanzado: false,
      texto: JSON.stringify({
        accion: 'agregar',
        servicioId: 'serv_fuente_chocolate',
        cantidad: null,
        opciones: [],
      }),
    });

    const res = await interpretarPedidoPresentacionIA({
      frase: 'agregá la fuente de chocolate',
      servicios: CATALOGO,
    });

    expect(res.ok).toBe(true);
    expect(res.accion).toBe('agregar');
    expect(res.servicioId).toBe('serv_fuente_chocolate');
    expect(res.servicioNombre).toBe('Fuente de chocolate');
  });

  it('un servicioId inventado que no existe no se aplica y devuelve opciones reales del catálogo', async () => {
    mockPedirTexto.mockResolvedValueOnce({
      ok: true,
      modelo: 'gemini-2.5-flash',
      topeAlcanzado: false,
      texto: JSON.stringify({
        accion: 'agregar',
        servicioId: 'serv_falso_inexistente',
        cantidad: null,
        opciones: [
          { id: 'serv_fotocabina', nombre: 'Fotocabina' },
          { id: 'serv_inventado', nombre: 'Falso' },
        ],
      }),
    });

    const res = await interpretarPedidoPresentacionIA({
      frase: 'agregá la cabina',
      servicios: CATALOGO,
    });

    expect(res.ok).toBe(true);
    expect(res.accion).toBe('agregar');
    expect(res.servicioId).toBeUndefined();
    expect(res.opciones).toEqual([{ id: 'serv_fotocabina', nombre: 'Fotocabina' }]);
  });

  it('"poné 150 invitados" devuelve accion invitados con cantidad 150', async () => {
    mockPedirTexto.mockResolvedValueOnce({
      ok: true,
      modelo: 'gemini-2.5-flash',
      topeAlcanzado: false,
      texto: JSON.stringify({
        accion: 'invitados',
        servicioId: null,
        cantidad: 150,
        opciones: [],
      }),
    });

    const res = await interpretarPedidoPresentacionIA({
      frase: 'poné 150 invitados',
      servicios: CATALOGO,
    });

    expect(res.ok).toBe(true);
    expect(res.accion).toBe('invitados');
    expect(res.cantidad).toBe(150);
  });

  it('la acción de presentación IA nunca importa ni llama a guardar, cerrar ni cobrar presupuestos', () => {
    const accionSrc = fs.readFileSync(
      path.join(process.cwd(), 'src/app/actions/presentacion-ia.ts'),
      'utf8',
    );
    const ledSrc = fs.readFileSync(
      path.join(process.cwd(), 'src/app/presentacion-led/page.tsx'),
      'utf8',
    );

    const accionesProhibidas = [
      'savePresupuesto',
      'createPresupuesto',
      'acceptPresupuesto',
      'aprobarPresupuesto',
      'confirmarPresupuesto',
      'registrarPago',
      'marcarPagado',
    ];

    for (const simbolo of accionesProhibidas) {
      expect(accionSrc).not.toContain(simbolo);
      expect(ledSrc).not.toContain(simbolo);
    }
  });

  it('sin sesión del equipo no consulta a la IA (un desconocido no gasta el tope diario)', async () => {
    mockHasAppSession.mockResolvedValueOnce(false);
    mockPedirTexto.mockClear();
    const r = await interpretarPedidoPresentacionIA({ frase: 'agregá la fuente de chocolate' });
    expect(r.ok).toBe(false);
    expect(mockPedirTexto).not.toHaveBeenCalled();
  });
});
