/**
 * @jest-environment node
 */
import fs from 'node:fs';
import path from 'node:path';

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn(async () => true),
  reservarRespuestaProfunda: jest.fn(async () => true),
  reservarConsumoIA: jest.fn(async () => ({ liberar: jest.fn(async () => undefined) })),
  anotarFalloIA: jest.fn(async () => undefined),
}));

import {
  MODELOS_GEMINI,
  esErrorModeloRetirado,
  esErrorCuotaIA,
  isRecoverableGeminiModelError,
} from '@/ai/modelos';
import {
  ai,
  ejecutarPromptConFallback,
  generateWithGeminiFallback,
} from '@/ai/genkit';
import { anotarFalloIA } from '@/lib/ai/consumo-servidor';
import {
  clasificarImagenWhatsApp,
  transcribirAudioWhatsApp,
} from '@/lib/asistente/whatsapp-media';

const leer = (rel: string) => fs.readFileSync(path.join(process.cwd(), rel), 'utf8');

describe('Orden 340: una sola lista de modelos de Gemini y respaldo automático', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.GEMINI_API_KEY;
  });

  it('src/ai/modelos.ts define gemini-4-hydrogen primero en texto y no incluye modelos pagos (carbon, argon, neon)', () => {
    expect(MODELOS_GEMINI.texto[0]).toBe('googleai/gemini-4-hydrogen');
    expect(MODELOS_GEMINI.texto.length).toBeGreaterThanOrEqual(4);
    expect(MODELOS_GEMINI.imagen.length).toBeGreaterThanOrEqual(1);
    expect(MODELOS_GEMINI.voz.length).toBeGreaterThanOrEqual(2);
    expect(MODELOS_GEMINI.enVivo.length).toBeGreaterThanOrEqual(2);

    const todasLasListas = [
      ...MODELOS_GEMINI.texto,
      ...MODELOS_GEMINI.profundo,
      ...MODELOS_GEMINI.imagen,
      ...MODELOS_GEMINI.voz,
      ...MODELOS_GEMINI.enVivo,
    ].join(' ').toLowerCase();

    expect(todasLasListas).not.toMatch(/\b(carbon|argon|neon)\b/);
  });

  it('genkit, voz-en-vivo, voz-gemini y whatsapp-media leen los modelos desde modelos.ts y whatsapp-media no llama al modelo fijo', () => {
    expect(leer('src/ai/genkit.ts')).toMatch(/from ['"]\.\/modelos['"]/);
    expect(leer('src/lib/asistente/voz-en-vivo.ts')).toMatch(/from ['"]@\/ai\/modelos['"]/);
    expect(leer('src/lib/asistente/voz-gemini.ts')).toMatch(/from ['"]@\/ai\/modelos['"]/);

    const whatsappMedia = leer('src/lib/asistente/whatsapp-media.ts');
    expect(whatsappMedia).toMatch(/from ['"]@\/ai\/modelos['"]/);
    expect(whatsappMedia).toMatch(/generateWithGeminiFallback/);
    expect(whatsappMedia).not.toContain('models/gemini-2.5-flash:generateContent');
  });

  it('esErrorModeloRetirado detecta 404, not found, model not found, retired, deprecated y no existe', () => {
    expect(esErrorModeloRetirado({ status: 404, message: 'Not Found' })).toBe(true);
    expect(esErrorModeloRetirado(new Error('model not found / retired (404)'))).toBe(true);
    expect(esErrorModeloRetirado(new Error('The model has been deprecated'))).toBe(true);
    expect(esErrorModeloRetirado(new Error('El modelo solicitado no existe'))).toBe(true);
    expect(esErrorModeloRetirado({ status: 429, message: 'RESOURCE_EXHAUSTED' })).toBe(false);
    expect(esErrorModeloRetirado({ status: 401, message: 'invalid api key' })).toBe(false);
    expect(esErrorCuotaIA({ status: 429, message: 'RESOURCE_EXHAUSTED' })).toBe(true);
    expect(isRecoverableGeminiModelError(new Error('model not found / retired (404)'))).toBe(true);
  });

  it('ante error "model not found / retired (404)" en el primer modelo, generateWithGeminiFallback anota el fallo y responde con el respaldo', async () => {
    const modelosProbados: string[] = [];
    const espiaGenerate = jest.spyOn(ai, 'generate').mockImplementation(async (opts: any) => {
      modelosProbados.push(String(opts?.model));
      if (modelosProbados.length === 1) {
        throw Object.assign(new Error('model not found / retired (404)'), { status: 404 });
      }
      return { text: 'Respuesta desde modelo de respaldo' } as any;
    });

    const respuesta = await generateWithGeminiFallback({
      model: MODELOS_GEMINI.texto[0],
      prompt: 'Hola',
    });

    expect(respuesta.text).toBe('Respuesta desde modelo de respaldo');
    expect(modelosProbados).toEqual([
      MODELOS_GEMINI.texto[0],
      MODELOS_GEMINI.texto[1],
    ]);
    expect(anotarFalloIA).toHaveBeenCalledTimes(1);
    expect(anotarFalloIA).toHaveBeenCalledWith(
      'gemini-modelo-retirado',
      expect.stringContaining(MODELOS_GEMINI.texto[0]),
    );
    expect(espiaGenerate).toHaveBeenCalledTimes(2);
  });

  it('ejecutarPromptConFallback también anota fallo ante modelo retirado y completa con el siguiente modelo', async () => {
    const modelosProbados: string[] = [];
    const promptFn = jest.fn(async (_input: { q: string }, opts?: { model?: string }) => {
      modelosProbados.push(String(opts?.model));
      if (modelosProbados.length === 1) {
        throw new Error('404 model not found / retired');
      }
      return { output: { ok: true } };
    });

    const res = await ejecutarPromptConFallback(promptFn, { q: 'test' }, MODELOS_GEMINI.texto[0]);
    expect(res).toEqual({ output: { ok: true } });
    expect(modelosProbados).toEqual([MODELOS_GEMINI.texto[0], MODELOS_GEMINI.texto[1]]);
    expect(anotarFalloIA).toHaveBeenCalledWith(
      'gemini-modelo-retirado',
      expect.stringContaining('404 model not found / retired'),
    );
  });

  it('whatsapp-media (audio e imagen) usa respaldo de modelos y recupera ante 404 en el primer modelo', async () => {
    process.env.GEMINI_API_KEY = 'gemini-test-key';
    const espiaGenerate = jest.spyOn(ai, 'generate')
      .mockRejectedValueOnce(Object.assign(new Error('model not found / retired (404)'), { status: 404 }))
      .mockResolvedValueOnce({ text: 'Transcripción con respaldo.' } as any)
      .mockResolvedValueOnce({
        text: JSON.stringify({ tipo: 'otra', descripcion: 'Foto de prueba', confianza: 'alta' }),
      } as any);

    const texto = await transcribirAudioWhatsApp({ mimeType: 'audio/webm', base64: 'YXVkaW8=' });
    expect(texto).toBe('Transcripción con respaldo.');
    expect(anotarFalloIA).toHaveBeenCalledWith(
      'gemini-modelo-retirado',
      expect.stringContaining(MODELOS_GEMINI.texto[0]),
    );

    const imagen = await clasificarImagenWhatsApp({ mimeType: 'image/jpeg', base64: 'aW1hZ2U=' });
    expect(imagen).toMatchObject({ tipo: 'otra', descripcion: 'Foto de prueba', confianza: 'alta' });
    expect(espiaGenerate).toHaveBeenCalledTimes(3);
  });
});
