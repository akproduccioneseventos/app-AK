/**
 * MATAFUEGO — Una IA que falla no puede devolver su cartel de error como si fuera el resultado.
 *
 * Qué pasaba (dueño, 10/10/2026, "pura pavada"):
 *  - El pitch de ventas y el perfil del DJ devolvían la frase "Hubo un error al generar…" como
 *    texto. La acción contestaba success:true, la pantalla de editar presupuesto la ponía en la
 *    caja con "Pitch generado con éxito" y un vendedor podía mandársela al cliente.
 *  - El cronograma devolvía [] en silencio cuando la IA devolvía un JSON roto.
 *  - El clasificador de comentarios y las respuestas a preguntas llamaban por fetch a
 *    gemini-1.5-flash (retirado) y se saltaban los modelos de respaldo.
 *  - Los flujos de contrato y reunión usaban un solo modelo.
 *
 * Probado rompiéndolo: devolviendo otra vez el cartel en el `catch` del pitch, la prueba del
 * pitch da rojo (success:true); devolviendo [] en el del cronograma, la del cronograma da rojo;
 * volviendo al fetch directo en el clasificador, la de "usa la función con respaldos" da rojo.
 */
import fs from 'fs';
import path from 'path';

jest.mock('server-only', () => ({}));
jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn(async () => undefined) }));

let respuestaIA: () => Promise<{ text: string }>;
const generar = jest.fn(async (..._a: any[]) => respuestaIA());
jest.mock('@/ai/genkit', () => ({
  generateWithGeminiFallback: (...a: any[]) => generar(...a),
  getGeminiModelForAgent: () => 'googleai/modelo-de-prueba',
}));
jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn(async () => true),
  registrarConsumoIA: jest.fn(async () => true),
}));

import { generateSalesPitchAction } from '@/app/actions/sales-pitch-ia.actions';
import { generateDjProfileAction } from '@/app/actions/dj-ia.actions';
import { generateTimelineAction } from '@/app/actions/timeline-ia.actions';
import { clasificarComentario } from '@/lib/social-media/clasificador-comentarios';
import { armarRespuestaAPregunta } from '@/lib/social-media/comments-backfill';

const leer = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');

beforeEach(() => {
  generar.mockClear();
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  process.env.GEMINI_API_KEY = 'clave-de-prueba';
  respuestaIA = async () => { throw new Error('modelo caído'); };
});
afterEach(() => jest.restoreAllMocks());

describe('Si la IA falla, la acción dice que falló', () => {
  it('pitch de ventas: success:false, con el error, y sin texto para mostrar', async () => {
    const r = await generateSalesPitchAction('Ana', 'Boda', 100, 50000, ['DJ']);
    expect(r.success).toBe(false);
    expect(r.data).toBeUndefined();
    expect(r.error).toMatch(/No pude generar el mensaje/);
    expect(JSON.stringify(r)).not.toMatch(/Hubo un error al generar/);
  });

  it('perfil del DJ: success:false, con el error, y sin texto para mostrar', async () => {
    const r = await generateDjProfileAction('Boda');
    expect(r.success).toBe(false);
    expect(r.data).toBeUndefined();
    expect(r.error).toMatch(/No pude armar el perfil musical/);
  });

  it('cronograma: un JSON roto o una lista vacía es una falla con su cartel, no un éxito vacío', async () => {
    for (const texto of ['esto no es json', '[]', '{"hora":"20:00"}', '[{"foo":1}]']) {
      respuestaIA = async () => ({ text: texto });
      const r = await generateTimelineAction('Boda', '20:00', 8, ['DJ']);
      expect(r.success).toBe(false);
      expect(r.data).toBeUndefined();
      expect(r.error).toBe('No pude armar el cronograma, probá de nuevo.');
    }
  });

  it('con respuestas buenas, las tres acciones siguen andando (lo que ya funcionaba)', async () => {
    respuestaIA = async () => ({ text: 'Hola Ana, tu presupuesto está listo.' });
    expect((await generateSalesPitchAction('Ana', 'Boda', 100, 50000, ['DJ'])).data).toContain('Hola Ana');
    respuestaIA = async () => ({ text: 'Vibe: bailable.' });
    expect((await generateDjProfileAction('Boda')).data).toContain('Vibe');
    respuestaIA = async () => ({ text: '```json\n[{"hora":"20:00","titulo":"Recepción","descripcion":"d","descripcionCliente":"c","icono":"Clock"}]\n```' });
    const t = await generateTimelineAction('Boda', '20:00', 8, ['DJ']);
    expect(t.success).toBe(true);
    expect(t.data?.[0].titulo).toBe('Recepción');
  });

  it('una respuesta vacía del modelo tampoco se muestra como éxito', async () => {
    respuestaIA = async () => ({ text: '   ' });
    expect((await generateSalesPitchAction('Ana', 'Boda', 100, 50000, ['DJ'])).success).toBe(false);
    expect((await generateDjProfileAction('Boda')).success).toBe(false);
  });
});

describe('Las pantallas no muestran como éxito lo que no lo es', () => {
  it('editar presupuesto: el éxito del pitch depende de res.success y res.data, y el error no llena la caja', () => {
    const pantalla = leer('src/app/(app)/presupuestos/[id]/edit/page.tsx');
    expect(pantalla).toMatch(/if \(res\.success && res\.data\) \{\s*setPitchText\(res\.data\)/);
    expect(pantalla).toMatch(/throw new Error\(res\.error \|\| 'Error al generar pitch'\)/);
    expect(pantalla).not.toMatch(/Hubo un error al generar/);
  });

  it('ni los flujos ni las acciones devuelven el cartel de error como resultado', () => {
    for (const f of [
      'src/ai/flows/generate-sales-pitch-flow.ts',
      'src/ai/flows/generate-dj-profile-flow.ts',
      'src/ai/flows/generate-timeline-flow.ts',
    ]) {
      const codigo = leer(f);
      expect(codigo).not.toMatch(/return 'Hubo un error/);
      expect(codigo).not.toMatch(/return \[\];\s*\}\s*\}/);
      expect(codigo).toMatch(/throw new Error\(/);
    }
  });
});

describe('Los comentarios de redes usan la función con modelos de respaldo', () => {
  const fetchOriginal = global.fetch;
  afterEach(() => { global.fetch = fetchOriginal; });

  it('clasificarComentario llama a generateWithGeminiFallback y NO hace fetch directo', async () => {
    global.fetch = jest.fn() as any;
    respuestaIA = async () => ({
      text: JSON.stringify({ sentiment: 'positivo', sentimentReason: 'elogio', isInsultOrSpam: false, isLegitimateComplaint: false, esPregunta: false, autoHide: false }),
    });
    const r = await clasificarComentario('Divino todo, los mejores', 'Lu');
    expect(generar).toHaveBeenCalledTimes(1);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(r.classified).toBe(true);
    expect(r.sentiment).toBe('positivo');
  });

  it('clasificarComentario: si la IA falla queda sin clasificar con su error (no inventa)', async () => {
    const r = await clasificarComentario('Todo mal', 'Pepe');
    expect(r.classified).toBe(false);
    expect(r.error).toMatch(/modelo caído/);
    expect(r.sentiment).toBeUndefined();
  });

  it('clasificarComentario: una respuesta vacía de la IA es classified:false', async () => {
    respuestaIA = async () => ({ text: '' });
    const r = await clasificarComentario('Hola', 'Pepe');
    expect(r).toEqual({ classified: false, error: 'Respuesta vacía de la IA' });
  });

  it('armarRespuestaAPregunta pasa por la función con respaldos, limpia los precios y, si falla, usa el texto neutro', async () => {
    global.fetch = jest.fn() as any;
    respuestaIA = async () => ({ text: 'Sale 5000 pesos, escribinos por WhatsApp' });
    const ok = await armarRespuestaAPregunta('¿cuánto sale?', 'Lu');
    expect(global.fetch).not.toHaveBeenCalled();
    expect(ok).not.toMatch(/\d/);

    respuestaIA = async () => { throw new Error('caída'); };
    const neutro = await armarRespuestaAPregunta('¿cuánto sale?', 'Lu');
    expect(neutro).toMatch(/WhatsApp/);
  });

  it('ya no queda ninguna llamada directa al modelo retirado gemini-1.5-flash', () => {
    for (const f of ['src/lib/social-media/clasificador-comentarios.ts', 'src/lib/social-media/comments-backfill.ts', 'src/ai/genkit.ts']) {
      expect(leer(f)).not.toMatch(/gemini-1\.5-flash['`:]/);
      expect(leer(f)).not.toMatch(/generativelanguage\.googleapis\.com/);
    }
  });
});

describe('Los flujos con esquema (contrato, reunión) pasan por los modelos de respaldo', () => {
  it('usan ejecutarPromptConFallback en vez de llamar al prompt de un solo modelo', () => {
    expect(leer('src/ai/flows/extract-contract-data.ts')).toMatch(/ejecutarPromptConFallback\(prompt, input\)/);
    expect(leer('src/ai/flows/meeting-intelligence-flow.ts')).toMatch(/ejecutarPromptConFallback\(meetingIntelligencePrompt, input\)/);
  });
});
