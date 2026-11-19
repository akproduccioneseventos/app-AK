/**
 * Pedido del dueño (19/11/2026): "Hidrógeno y después se termina y pasa a gratis". Las tareas difíciles, Sofía y marketing
 * usan Gemini 4 Hydrogen; si se termina su parte gratis (Google contesta 429 / RESOURCE_EXHAUSTED), la app sigue con los
 * modelos gratis de siempre, sin cortar la respuesta ni cobrar de más.
 */
import fs from 'fs';
import path from 'path';

describe('Hydrogen primero, y después el modelo gratis', () => {
  const yaml = fs.readFileSync(path.join(process.cwd(), 'apphosting.yaml'), 'utf8');

  it.each(['GEMINI_MODEL_PRO', 'GEMINI_MODEL_MARKETING', 'GEMINI_MODEL_COMMERCIAL'])('%s usa Gemini 4 Hydrogen', (variable) => {
    const bloque = yaml.slice(yaml.indexOf(`variable: ${variable}\n`)).split('- variable:')[0];
    expect(bloque).toContain('value: "googleai/gemini-4-hydrogen"');
  });

  it('las respuestas rápidas siguen en el modelo gratis', () => {
    const bloque = yaml.slice(yaml.indexOf('variable: GEMINI_MODEL_FAST\n')).split('- variable:')[0];
    expect(bloque).toContain('value: "googleai/gemini-3.8-flash"');
  });

  it('si Hydrogen se queda sin cupo, el siguiente es un modelo gratis', async () => {
    const anterior = process.env.GEMINI_MODEL_PRO;
    process.env.GEMINI_MODEL_PRO = 'googleai/gemini-4-hydrogen';
    jest.resetModules();
    const genkit = await import('@/ai/genkit');
    const candidatos = genkit.getGeminiFallbackCandidates('googleai/gemini-4-hydrogen');
    expect(candidatos[0]).toBe('googleai/gemini-4-hydrogen');
    expect(candidatos.slice(1)).toEqual(expect.arrayContaining(['googleai/gemini-3.8-flash']));
    expect(genkit.isRecoverableGeminiModelError({ status: 429, message: 'RESOURCE_EXHAUSTED: quota' })).toBe(true);
    process.env.GEMINI_MODEL_PRO = anterior;
  });
});
