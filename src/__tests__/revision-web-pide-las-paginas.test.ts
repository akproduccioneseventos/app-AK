/** @jest-environment node */
/**
 * La revisión de la web tiene que pedir las páginas de verdad, no dar todo por bueno.
 */
const marcarCorrida = jest.fn(async () => {});
jest.mock('@/lib/automatico/tareas-automaticas', () => ({ marcarCorrida: (...a: any[]) => (marcarCorrida as any)(...a) }));

import { ejecutarRevisionPosicionamiento } from '@/lib/automatico/posicionamiento-diario';
import { PAGINAS_PARA_GOOGLE } from '@/lib/seo/paginas-publicas';

const respuesta = (status: number, html: string) => ({ status, text: async () => html }) as any;
const original = global.fetch;

describe('revisión de la web pública', () => {
  beforeEach(() => marcarCorrida.mockClear());
  afterAll(() => { global.fetch = original; });

  it('todas abren con título: óptimo', async () => {
    global.fetch = jest.fn(async () => respuesta(200, '<html><title>AK</title></html>')) as any;
    const r = await ejecutarRevisionPosicionamiento(new Date());
    expect(global.fetch).toHaveBeenCalledTimes(PAGINAS_PARA_GOOGLE.length);
    expect(r.estado).toBe('optimo');
    expect(marcarCorrida).toHaveBeenCalled();
  });

  it('una página con 500: no es óptimo y esa ruta queda marcada', async () => {
    global.fetch = jest.fn(async (url: string) =>
      String(url) === 'https://akproducciones.uy/bodas' ? respuesta(500, '') : respuesta(200, '<title>AK</title>')) as any;
    const r = await ejecutarRevisionPosicionamiento(new Date());
    expect(r.estado).not.toBe('optimo');
    const mala = r.detalles.find((d) => d.ruta === '/bodas')!;
    expect(mala.estado).toBe('revisar');
    expect(mala.mensaje).toContain('500');
    expect(r.resumen).toContain('1 de');
  });

  it('título vacío: se marca', async () => {
    global.fetch = jest.fn(async () => respuesta(200, '<title> </title>')) as any;
    const r = await ejecutarRevisionPosicionamiento(new Date());
    expect(r.estado).not.toBe('optimo');
    expect(r.detalles[0].mensaje).toBe('Le falta el título');
  });

  it('sin red: no dice óptimo y no anota la corrida como buena', async () => {
    global.fetch = jest.fn(async () => { throw new Error('sin red'); }) as any;
    await expect(ejecutarRevisionPosicionamiento(new Date())).rejects.toThrow(/ninguna página/);
    expect(marcarCorrida).not.toHaveBeenCalled();
  });
});
