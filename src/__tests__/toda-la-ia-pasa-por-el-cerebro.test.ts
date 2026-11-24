/**
 * @jest-environment node
 */
import fs from 'node:fs';
import path from 'node:path';

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => ({})),
}));
jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn(async () => true),
  reservarConsumoIA: jest.fn(async () => ({ liberar: jest.fn(async () => undefined) })),
  registrarConsumoIA: jest.fn(async () => undefined),
  anotarFalloIA: jest.fn(async () => undefined),
}));

import {
  pedirTexto,
  pedirImagen,
  decidirConCerebro,
  MENSAJE_TOPE_IA,
} from '@/ai/cerebro';
import { GEMINI_DECISIONS_ENDPOINT } from '@/ai/direcciones-google';
import { ai } from '@/ai/genkit';
import { MODELOS_GEMINI } from '@/ai/modelos';
import { COSTO_ESTIMADO_UYU } from '@/lib/ai/consumo';
import {
  hayPresupuestoParaIA,
  reservarConsumoIA,
  anotarFalloIA,
} from '@/lib/ai/consumo-servidor';
import { transcribirAudioWhatsApp } from '@/lib/asistente/whatsapp-media';

function buscarLlamadasDirectasIA(_archivo: string, contenido: string): boolean {
  return contenido.includes('generativelanguage.googleapis.com') || contenido.includes('ai.generate(');
}

const leer = (rel: string) => fs.readFileSync(path.join(process.cwd(), rel), 'utf8');

describe('Orden 342: toda la IA pasa por el cerebro', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('a) Candado estático: escanea src/ (excluyendo src/ai/ y src/__tests__/) y verifica llamadas directas', () => {
    const codigoMalo1 = "const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5:generateContent', { body: data })";
    const codigoMalo2 = "const out = await ai.generate({ prompt: 'hola' });";
    const codigoBueno = "const res = await pedirTexto({ prompt: 'hola', quien: 'papeleria' });";

    expect(buscarLlamadasDirectasIA('src/components/prueba.tsx', codigoMalo1)).toBe(true);
    expect(buscarLlamadasDirectasIA('src/lib/prueba.ts', codigoMalo2)).toBe(true);
    expect(buscarLlamadasDirectasIA('src/lib/bueno.ts', codigoBueno)).toBe(false);

    const srcDir = path.join(process.cwd(), 'src');
    const archivosMalos: string[] = [];

    function recorrerDir(dir: string) {
      const entradas = fs.readdirSync(dir, { withFileTypes: true });
      for (const entrada of entradas) {
        const rutaCompleta = path.join(dir, entrada.name);
        const rutaRelativa = path.relative(process.cwd(), rutaCompleta).replace(/\\/g, '/');

        if (rutaRelativa.startsWith('src/ai/') || rutaRelativa.startsWith('src/__tests__/') || rutaRelativa.includes('node_modules')) {
          continue;
        }

        if (entrada.isDirectory()) {
          recorrerDir(rutaCompleta);
        } else if (entrada.isFile() && /\.(ts|tsx|js|jsx)$/.test(entrada.name)) {
          const contenido = fs.readFileSync(rutaCompleta, 'utf8');
          if (buscarLlamadasDirectasIA(rutaRelativa, contenido)) {
            archivosMalos.push(rutaRelativa);
          }
        }
      }
    }

    recorrerDir(srcDir);
    expect(archivosMalos).toEqual([]);
  });

  it('b) Tope agotado: hayPresupuestoParaIA devuelve false y pedirTexto / pedirImagen devuelven topeAlcanzado: true sin llamar a Google', async () => {
    (hayPresupuestoParaIA as jest.Mock).mockResolvedValueOnce(false);
    const ejecutarModelo = jest.fn();

    const resTexto = await pedirTexto({ prompt: 'hola', quien: 'sofia', ejecutarModelo });
    expect(resTexto.ok).toBe(false);
    expect(resTexto.topeAlcanzado).toBe(true);
    expect(resTexto.error).toBe(MENSAJE_TOPE_IA);
    expect(ejecutarModelo).not.toHaveBeenCalled();

    (hayPresupuestoParaIA as jest.Mock).mockResolvedValueOnce(false);
    const fetchFn = jest.fn();
    const resImagen = await pedirImagen({ prompt: 'foto', quien: 'papeleria', fetchFn });
    expect(resImagen.ok).toBe(false);
    expect(resImagen.topeAlcanzado).toBe(true);
    expect(resImagen.error).toBe(MENSAJE_TOPE_IA);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('c) Primer modelo retirado: si el primer modelo falla con 404, pasa al segundo modelo y anota fallo', async () => {
    (hayPresupuestoParaIA as jest.Mock).mockResolvedValue(true);

    let llamadas = 0;
    const ejecutarModelo = jest.fn(async () => {
      llamadas++;
      if (llamadas === 1) {
        throw Object.assign(new Error('Model not found'), { status: 404 });
      }
      return { text: 'Respuesta desde segundo modelo' };
    });

    const res = await pedirTexto({ prompt: 'prueba retiro', quien: 'cerebro', ejecutarModelo });
    expect(res.ok).toBe(true);
    expect(res.texto).toBe('Respuesta desde segundo modelo');
    expect(res.modelo).toBe(MODELOS_GEMINI.texto[1]);
    expect(anotarFalloIA).toHaveBeenCalledWith('gemini-modelo-retirado', expect.any(String));
  });

  it('d) /asistente completo: page.tsx importa estadoDeLasTareas y asistente-client.tsx tiene las 4 solapas y tareas automaticas', () => {
    const pageContent = leer('src/app/(app)/asistente/page.tsx');
    const clientContent = leer('src/app/(app)/asistente/asistente-client.tsx');

    expect(pageContent).toContain('estadoDeLasTareas');
    expect(clientContent).toContain('Hoy');
    expect(clientContent).toContain('Lo automático');
    expect(clientContent).toContain('Gasto');
    expect(clientContent).toContain('Hablale');
    expect(clientContent).toContain('TAREAS_AUTOMATICAS');
  });

  it('e) consumo.ts mantiene los nombres de ambas ramas en COSTO_ESTIMADO_UYU', () => {
    const funcionesEsperadas = [
      'perfil-dj',
      'itinerario-ia',
      'asistente-clasico',
      'agente-marketing',
      'extraccion-contrato',
      'analisis-codigo',
      'papeleria',
      'sofia',
      'cerebro',
    ] as const;

    for (const fn of funcionesEsperadas) {
      expect(typeof COSTO_ESTIMADO_UYU[fn]).toBe('number');
      expect(COSTO_ESTIMADO_UYU[fn]).toBeGreaterThan(0);
    }
  });

  it('f) decidirConCerebro baja enlaces https a inlineData (con tope 10 MB), libera solo rechazos firmes y tolera mocks sin liberar', async () => {
    const prevGeminiKey = process.env.GEMINI_API_KEY;
    const prevGoogleKey = process.env.GOOGLE_API_KEY;
    process.env.GEMINI_API_KEY = 'test-key';

    try {
      const imagenBytes = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]);
      const fetchExitoso = jest.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url === 'https://ejemplo.test/foto.jpg') {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'image/jpeg', 'content-length': String(imagenBytes.byteLength) }),
            arrayBuffer: async () => imagenBytes.buffer,
          } as unknown as Response;
        }
        if (url === GEMINI_DECISIONS_ENDPOINT) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ results: { esValida: { noul: true, confidence: 0.95 } } }),
          } as unknown as Response;
        }
        throw new Error(`URL inesperada: ${url}`);
      });

      const resOk = await decidirConCerebro({
        entradas: [{ url: 'https://ejemplo.test/foto.jpg' }],
        preguntas: { esValida: { tipo: 'si_no', instruccion: '¿Es válida?' } },
        fetchFn: fetchExitoso as unknown as typeof fetch,
      });
      expect(resOk?.esValida?.siNo).toBe(true);

      const llamadaDecision = fetchExitoso.mock.calls.find(([u]) => String(u) === GEMINI_DECISIONS_ENDPOINT);
      expect(llamadaDecision).toBeDefined();
      const payload = JSON.parse(String(llamadaDecision?.[1]?.body));
      expect(payload.input.parts[0].inlineData).toEqual({
        mimeType: 'image/jpeg',
        data: Buffer.from(imagenBytes).toString('base64'),
      });
      expect(payload.input.parts[0].fileData).toBeUndefined();

      const tamanioExcedido = 10 * 1024 * 1024 + 1;
      const fetchGigante = jest.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url === 'https://ejemplo.test/grande.jpg') {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'image/jpeg', 'content-length': String(tamanioExcedido) }),
            arrayBuffer: async () => new ArrayBuffer(tamanioExcedido),
          } as unknown as Response;
        }
        return { ok: true, status: 200, json: async () => ({}) } as unknown as Response;
      });

      const resGrande = await decidirConCerebro({
        entradas: [{ url: 'https://ejemplo.test/grande.jpg' }],
        preguntas: { esValida: { tipo: 'si_no', instruccion: '¿Es válida?' } },
        fetchFn: fetchGigante as unknown as typeof fetch,
      });
      expect(resGrande).toBeNull();
      expect(fetchGigante.mock.calls.some(([u]) => String(u) === GEMINI_DECISIONS_ENDPOINT)).toBe(false);

      for (const status of [400, 429]) {
        const liberar = jest.fn(async () => undefined);
        (reservarConsumoIA as jest.Mock).mockResolvedValueOnce({ liberar });
        const fetchRechazo = jest.fn(async () => ({ ok: false, status } as unknown as Response));

        const resRechazo = await decidirConCerebro({
          entradas: ['texto de prueba'],
          preguntas: { p: { tipo: 'si_no', instruccion: '¿Sí?' } },
          fetchFn: fetchRechazo as unknown as typeof fetch,
        });
        expect(resRechazo).toBeNull();
        expect(liberar).toHaveBeenCalledTimes(1);
      }

      const liberar503 = jest.fn(async () => undefined);
      (reservarConsumoIA as jest.Mock).mockResolvedValueOnce({ liberar: liberar503 });
      const fetch503 = jest.fn(async () => ({ ok: false, status: 503 } as unknown as Response));
      const res503 = await decidirConCerebro({
        entradas: ['texto de prueba'],
        preguntas: { p: { tipo: 'si_no', instruccion: '¿Sí?' } },
        fetchFn: fetch503 as unknown as typeof fetch,
      });
      expect(res503).toBeNull();
      expect(liberar503).not.toHaveBeenCalled();

      const liberarRed = jest.fn(async () => undefined);
      (reservarConsumoIA as jest.Mock).mockResolvedValueOnce({ liberar: liberarRed });
      const fetchRed = jest.fn(async () => {
        throw new Error('ECONNRESET');
      });
      const resRed = await decidirConCerebro({
        entradas: ['texto de prueba'],
        preguntas: { p: { tipo: 'si_no', instruccion: '¿Sí?' } },
        fetchFn: fetchRed as unknown as typeof fetch,
      });
      expect(resRed).toBeNull();
      expect(liberarRed).not.toHaveBeenCalled();

      const liberarTimeout = jest.fn(async () => undefined);
      (reservarConsumoIA as jest.Mock).mockResolvedValueOnce({ liberar: liberarTimeout });
      const fetchTimeout = jest.fn(async () => new Promise<Response>(() => {}));
      const resTimeout = await decidirConCerebro({
        entradas: ['texto de prueba'],
        preguntas: { p: { tipo: 'si_no', instruccion: '¿Sí?' } },
        timeoutMs: 15,
        fetchFn: fetchTimeout as unknown as typeof fetch,
      });
      expect(resTimeout).toBeNull();
      expect(liberarTimeout).not.toHaveBeenCalled();

      await jest.isolateModulesAsync(async () => {
        jest.doMock('@/lib/data-service', () => ({
          readData: jest.fn(async () => ({})),
        }));
        jest.doMock('@/lib/ai/consumo-servidor', () => ({
          hayPresupuestoParaIA: jest.fn(async () => true),
          reservarConsumoIA: jest.fn(async () => ({ ok: true } as any)),
          registrarConsumoIA: jest.fn(async () => undefined),
          anotarFalloIA: undefined,
        }));
        const { decidirConCerebro: decidirAislado } = await import('@/ai/cerebro');
        const fetchParcial = jest.fn(async () => ({ ok: false, status: 400 } as unknown as Response));
        const resParcial = await decidirAislado({
          entradas: ['texto de prueba'],
          preguntas: { p: { tipo: 'si_no', instruccion: '¿Sí?' } },
          fetchFn: fetchParcial as unknown as typeof fetch,
        });
        expect(resParcial).toBeNull();
      });
    } finally {
      if (prevGeminiKey === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = prevGeminiKey;
      if (prevGoogleKey === undefined) delete process.env.GOOGLE_API_KEY;
      else process.env.GOOGLE_API_KEY = prevGoogleKey;
    }
  });

  it('g) whatsapp-media libera reserva en 400 y la conserva ante 503 o falla de red', async () => {
    const prevGeminiKey = process.env.GEMINI_API_KEY;
    const prevGoogleKey = process.env.GOOGLE_API_KEY;
    process.env.GEMINI_API_KEY = 'test-key';
    const generateSpy = jest.spyOn(ai, 'generate');
    const media = {
      mimeType: 'audio/ogg',
      base64: Buffer.from('OggS').toString('base64'),
    };

    try {
      const liberar400 = jest.fn(async () => undefined);
      (reservarConsumoIA as jest.Mock).mockResolvedValueOnce({ liberar: liberar400 });
      generateSpy.mockRejectedValueOnce(Object.assign(new Error('Bad Request'), { status: 400 }));
      await expect(transcribirAudioWhatsApp(media)).rejects.toThrow();
      expect(liberar400).toHaveBeenCalledTimes(1);

      const liberar503 = jest.fn(async () => undefined);
      (reservarConsumoIA as jest.Mock).mockResolvedValueOnce({ liberar: liberar503 });
      generateSpy.mockRejectedValue(Object.assign(new Error('Service Unavailable'), { status: 503 }));
      await expect(transcribirAudioWhatsApp(media)).rejects.toThrow();
      expect(liberar503).not.toHaveBeenCalled();

      generateSpy.mockReset();
      const liberarRed = jest.fn(async () => undefined);
      (reservarConsumoIA as jest.Mock).mockResolvedValueOnce({ liberar: liberarRed });
      generateSpy.mockRejectedValueOnce(new Error('ETIMEDOUT'));
      await expect(transcribirAudioWhatsApp(media)).rejects.toThrow();
      expect(liberarRed).not.toHaveBeenCalled();
    } finally {
      generateSpy.mockRestore();
      if (prevGeminiKey === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = prevGeminiKey;
      if (prevGoogleKey === undefined) delete process.env.GOOGLE_API_KEY;
      else process.env.GOOGLE_API_KEY = prevGoogleKey;
    }
  });
});
