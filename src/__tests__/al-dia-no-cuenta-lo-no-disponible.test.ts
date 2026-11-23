/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  estadoDeLasTareas,
  marcarCorrida,
  marcarFallo,
  resumirTareasAutomaticas,
  type EstadoDeTarea,
  type EstadoDespertador,
} from '@/lib/automatico/tareas-automaticas';

const mockData: Record<string, any> = {};

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) =>
    mockData[file] !== undefined ? JSON.parse(JSON.stringify(mockData[file])) : fallback,
  ),
  writeData: jest.fn(async (file: string, data: any) => {
    mockData[file] = JSON.parse(JSON.stringify(data));
  }),
}));

const mockGetEstadoTareasAutomaticas = jest.fn();
const mockGetEstadoDespertadorAction = jest.fn();
const mockEjecutarTareaManual = jest.fn();
const mockDispararTareasVencidasDeFondo = jest.fn();

jest.mock('@/app/actions/tareas-automaticas.actions', () => ({
  getEstadoTareasAutomaticas: (...args: unknown[]) => mockGetEstadoTareasAutomaticas(...args),
  getEstadoDespertadorAction: (...args: unknown[]) => mockGetEstadoDespertadorAction(...args),
  ejecutarTareaManual: (...args: unknown[]) => mockEjecutarTareaManual(...args),
  dispararTareasVencidasDeFondo: (...args: unknown[]) => mockDispararTareasVencidasDeFondo(...args),
}));

import TareasAutomaticasPage from '@/components/settings/panels/tareas-automaticas';

describe('Bloque 4: Al día no cuenta lo no disponible y muestra alertas de despertador y fallos', () => {
  let root: Root;
  let host: HTMLDivElement;

  beforeAll(() => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterAll(() => {
    Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
  });

  beforeEach(() => {
    for (const k of Object.keys(mockData)) delete mockData[k];
    jest.clearAllMocks();
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('una tarea sin conexión (!waConectada) NO suma en alDia y queda marcada como no disponible', async () => {
    const ahora = new Date('2026-11-23T12:00:00.000Z');
    const haceUnaHora = new Date('2026-11-23T11:00:00.000Z');

    // Sin WhatsApp conectado: una tarea que depende de WA corrió hace 1 hora, y otra independiente también.
    await marcarCorrida('recordatorios-de-pago', haceUnaHora, 'despertador');
    await marcarCorrida('metricas-de-redes', haceUnaHora, 'despertador');

    const estados = await estadoDeLasTareas(ahora);
    const recordatorios = estados.find((t) => t.id === 'recordatorios-de-pago');
    const metricas = estados.find((t) => t.id === 'metricas-de-redes');

    expect(recordatorios?.faltaConexion).toBe('WhatsApp');
    expect(recordatorios?.estado).toBe('no-disponible');
    expect(metricas?.estado).toBe('al-dia');

    const resumen = resumirTareasAutomaticas(estados);
    expect(resumen.alDia).toBe(1);
    expect(resumen.noDisponibles).toBeGreaterThanOrEqual(1);
  });

  it('un fallo posterior al último éxito queda reflejado en el estado y en el resumen', async () => {
    const exito = new Date('2026-11-23T10:00:00.000Z');
    const fallo = new Date('2026-11-23T11:30:00.000Z');
    const ahora = new Date('2026-11-23T12:00:00.000Z');

    await marcarCorrida('generate-blog-post', exito, 'despertador');
    await marcarFallo('generate-blog-post', 'Timeout al generar nota', fallo);

    const estados = await estadoDeLasTareas(ahora);
    const blog = estados.find((t) => t.id === 'generate-blog-post');

    expect(blog?.falloPosteriorAlExito).toBe(true);
    expect(blog?.ultimoFallo?.error).toBe('Timeout al generar nota');

    const resumen = resumirTareasAutomaticas(estados);
    expect(resumen.conFalloReciente.map((t) => t.id)).toContain('generate-blog-post');
  });

  it('la pantalla muestra caja No disponible, aviso en rojo si el despertador nunca corrió y fallos posteriores en el resumen', async () => {
    const tareasEjemplo: EstadoDeTarea[] = [
      {
        id: 'recordatorios-de-pago',
        nombre: 'Avisar de las cuotas por vencer',
        siNoCorre: 'No avisa cuotas vencidas.',
        cadaHoras: 24,
        ultimaCorrida: '2026-11-23T11:00:00.000Z',
        ultimoIntento: '2026-11-23T11:00:00.000Z',
        ultimoFallo: null,
        faltaConexion: 'WhatsApp',
        falloPosteriorAlExito: false,
        disparadoPor: 'despertador',
        estado: 'no-disponible',
        horasDesdeLaUltima: 1,
      },
      {
        id: 'generate-blog-post',
        nombre: 'Escribir las notas del blog',
        siNoCorre: 'No publica notas.',
        cadaHoras: 24,
        ultimaCorrida: '2026-11-23T10:00:00.000Z',
        ultimoIntento: '2026-11-23T11:30:00.000Z',
        ultimoFallo: { fecha: '2026-11-23T11:30:00.000Z', error: 'Cuota de API agotada' },
        faltaConexion: null,
        falloPosteriorAlExito: true,
        disparadoPor: 'despertador',
        estado: 'al-dia',
        horasDesdeLaUltima: 2,
      },
    ];
    const despertadorSinEjecutar: EstadoDespertador = {
      ultimoToque: null,
      estado: 'nunca',
      minutosDesdeUltimoToque: null,
      mensaje: 'El despertador no está funcionando: nunca tocó la puerta.',
    };

    mockGetEstadoTareasAutomaticas.mockResolvedValue(tareasEjemplo);
    mockGetEstadoDespertadorAction.mockResolvedValue(despertadorSinEjecutar);

    await act(async () => {
      root.render(React.createElement(TareasAutomaticasPage));
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const alDiaText = host.querySelector('[data-testid="contador-al-dia"]')?.textContent ?? '';
    const noDispText = host.querySelector('[data-testid="contador-no-disponible"]')?.textContent ?? '';
    const avisoDespertador = host.querySelector('[data-testid="aviso-despertador-inactivo"]');
    const avisoFallos = host.querySelector('[data-testid="aviso-fallos-recientes"]');

    // La tarea sin WhatsApp suma en NO DISPONIBLE (1) y NO en AL DÍA (sólo 1: generate-blog-post)
    expect(alDiaText).toContain('1');
    expect(noDispText).toContain('1');

    // Aviso visible arriba y en rojo cuando el despertador está sin ejecutar
    expect(avisoDespertador).not.toBeNull();
    expect(avisoDespertador?.className).toContain('bg-rose-600');
    expect(avisoDespertador?.textContent?.toLowerCase()).toContain('sin ejecutar');

    // Fallo posterior al último éxito visible en el resumen de arriba
    expect(avisoFallos).not.toBeNull();
    expect(avisoFallos?.textContent).toContain('Escribir las notas del blog');
    expect(avisoFallos?.textContent).toContain('Cuota de API agotada');
  });
});
