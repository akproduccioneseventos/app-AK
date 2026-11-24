/**
 * @jest-environment node
 */
import fs from 'node:fs';
import path from 'node:path';

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn(async () => true),
  reservarConsumoIA: jest.fn(async () => ({ liberar: jest.fn(async () => undefined) })),
  registrarConsumoIA: jest.fn(async () => undefined),
  anotarFalloIA: jest.fn(async () => undefined),
}));

import {
  pedirTexto,
  pedirImagen,
  MENSAJE_TOPE_IA,
} from '@/ai/cerebro';
import { MODELOS_GEMINI } from '@/ai/modelos';
import { hayPresupuestoParaIA, anotarFalloIA } from '@/lib/ai/consumo-servidor';

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

    const resTexto = await pedirTexto({ prompt: 'hola', quien: 'sofia' }, ejecutarModelo);
    expect(resTexto.ok).toBe(false);
    expect(resTexto.topeAlcanzado).toBe(true);
    expect(resTexto.error).toBe(MENSAJE_TOPE_IA);
    expect(ejecutarModelo).not.toHaveBeenCalled();

    (hayPresupuestoParaIA as jest.Mock).mockResolvedValueOnce(false);
    const fetchFn = jest.fn();
    const resImagen = await pedirImagen({ prompt: 'foto', quien: 'papeleria' }, fetchFn);
    expect(resImagen.ok).toBe(false);
    expect(resImagen.topeAlcanzado).toBe(true);
    expect(resImagen.error).toBe(MENSAJE_TOPE_IA);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('c) Primer modelo retirado: si el primer modelo falla con 404, pasa al segundo modelo y anota fallo', async () => {
    (hayPresupuestoParaIA as jest.Mock).mockResolvedValue(true);

    let llamadas = 0;
    const ejecutarModelo = jest.fn(async (modelo: string) => {
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
});
