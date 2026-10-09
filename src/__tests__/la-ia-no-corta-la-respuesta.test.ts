/**
 * El dueño (9/10/2026): "uso la IA de la app y no hace nada, mirá la conversación". Cada respuesta
 * del Encargado General salía cortada en la primera línea ("lo más urgente es esto: 🚨 • **XV").
 * Los modelos "flash" nuevos gastan parte del tope de salida pensando, y con topes de 500/600 no
 * quedaba lugar para la respuesta. Ningún pedido sale con menos del piso. Probado rompiéndolo: sin
 * `conLugarParaPensar`, la segunda prueba da rojo.
 */
const generate = jest.fn();
jest.mock('genkit', () => ({ genkit: () => ({ generate: (...a: any[]) => generate(...a) }) }));
jest.mock('@genkit-ai/google-genai', () => ({ googleAI: () => ({}) }));

import { conLugarParaPensar, generateWithGeminiFallback, PISO_DE_TOKENS_DE_SALIDA } from '@/ai/genkit';

it('un tope chico sube al piso; uno grande o ninguno no se toca', () => {
  expect((conLugarParaPensar({ prompt: 'x', config: { maxOutputTokens: 500 } } as any) as any).config.maxOutputTokens).toBe(PISO_DE_TOKENS_DE_SALIDA);
  expect((conLugarParaPensar({ prompt: 'x', config: { maxOutputTokens: 8000 } } as any) as any).config.maxOutputTokens).toBe(8000);
  expect(conLugarParaPensar({ prompt: 'x' } as any)).toEqual({ prompt: 'x' });
});

it('el pedido del Encargado (tope 500) llega al modelo con lugar para la respuesta entera', async () => {
  generate.mockImplementation(async (req: any) => ({ text: req.config.maxOutputTokens >= PISO_DE_TOKENS_DE_SALIDA ? 'respuesta completa' : '• **XV' }));
  const r = await generateWithGeminiFallback({ prompt: 'resumí', config: { temperature: 0.3, maxOutputTokens: 500 } } as any);
  expect(r.text).toBe('respuesta completa');
  expect(generate.mock.calls[0][0].config.temperature).toBe(0.3);
});

it('si la voz está apagada en Ajustes, el asistente lo dice en vez de callarse', () => {
  const fs = require('fs');
  const voz = fs.readFileSync(require('path').join(process.cwd(), 'src/lib/asistente/reproductor-voz.ts'), 'utf8');
  const tramo = voz.slice(voz.indexOf('vozTelefonoActiva === false'), voz.indexOf('vozTelefonoActiva === false') + 400);
  expect(tramo).toContain("onError?.(new Error('La voz está apagada en Ajustes");
});
