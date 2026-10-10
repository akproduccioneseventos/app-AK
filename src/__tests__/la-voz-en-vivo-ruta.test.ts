/**
 * @jest-environment node
 */
/**
 * Voz en vivo del asistente (orden 105, bloque 3) - la ruta del servidor.
 *
 * Lo que se comprueba, mirando la respuesta y no el código:
 * - Sin sesión del equipo: 401 (el portal del cliente y los invitados no pueden gastar voz).
 * - Apagada en Ajustes o sin clave: error claro, sin pedir ficha a Google.
 * - Sin minutos del día: 429 con la frase para el dueño y NO se le pide ficha a Google.
 * - Con éxito: devuelve la ficha de un solo uso y JAMÁS la clave real de Google.
 * - Si Google falla: error explícito (nunca un éxito falso) y se devuelven los minutos reservados.
 * - Dos pedidos a la vez con una base que devuelve COPIAS no gastan de más.
 *
 * Probado rompiéndolo: sacar `devolver()` del camino de falla dejó los minutos gastados tras el
 * error de Google; agregar la clave a la respuesta puso en rojo la prueba de "nunca la clave".
 * Se restauró. (Los ocho rojos salieron juntos con los otros dos archivos de la voz en vivo.)
 */

const CLAVE = 'AIzaSyClaveSecretaDePrueba1234567890';

let sesion = true;
let ajustes: any = {};
let almacen: Record<string, any> = {};
let cola: Promise<any> = Promise.resolve();

jest.mock('@/lib/auth/require-session', () => ({ hasAppSession: jest.fn(async () => sesion) }));
jest.mock('@/lib/asistente/avisar-al-duenio', () => ({ getAsistenteSettings: jest.fn(async () => ajustes) }));
jest.mock('@/lib/multiagent/diagnostics', () => ({
  buildMultiAgentTeamBriefing: jest.fn(async () => ({
    summary: 'Hay 2 fiestas próximas.',
    items: [{ priority: 'alta', title: 'Fiesta de Ana en 3 días', detail: 'Falta personal' }],
  })),
}));
// La base de verdad devuelve una COPIA en cada lectura y serializa las transacciones.
jest.mock('@/lib/generic-json-store', () => ({
  mutarDocumentoConTransaccion: jest.fn(async (archivo: string, vacio: any, cambiar: any) => {
    const turno = cola.then(async () => {
      const actual = JSON.parse(JSON.stringify(almacen[archivo] ?? vacio));
      await new Promise((r) => setTimeout(r, 2));
      const nuevo = await cambiar(actual);
      if (nuevo === null) return null;
      almacen[archivo] = JSON.parse(JSON.stringify(nuevo));
      return nuevo;
    });
    cola = turno.catch(() => undefined);
    return turno;
  }),
}));

import { POST } from '@/app/api/asistente/voz-en-vivo/route';
import { hoyEnUruguay } from '@/lib/utils';

const ARCHIVO = 'asistente/voz-en-vivo-uso.json';
let pedidosAGoogle: Array<{ url: string; cuerpo: any }> = [];
let respuestaGoogle: () => { ok: boolean; status: number; body: any };

beforeEach(() => {
  sesion = true;
  ajustes = { vozEnVivoActiva: true, vozEnVivoMinutosPorDia: 10, vozSeleccionada: 'Kore' };
  almacen = {};
  cola = Promise.resolve();
  pedidosAGoogle = [];
  process.env.GEMINI_API_KEY = CLAVE;
  delete process.env.GOOGLE_API_KEY;
  delete process.env.GEMINI_LIVE_MODEL;
  respuestaGoogle = () => ({ ok: true, status: 200, body: { name: 'auth_tokens/ficha-temporal-1' } });
  (global as any).fetch = jest.fn(async (url: string, init: any) => {
    pedidosAGoogle.push({ url, cuerpo: JSON.parse(init.body) });
    const r = respuestaGoogle();
    return { ok: r.ok, status: r.status, json: async () => r.body };
  });
});

describe('POST /api/asistente/voz-en-vivo', () => {
  it('sin sesión del equipo da 401 y no toca nada', async () => {
    sesion = false;
    const r = await POST();
    expect(r.status).toBe(401);
    expect(pedidosAGoogle).toHaveLength(0);
    expect(almacen[ARCHIVO]).toBeUndefined();
  });

  it('apagada en Ajustes: error claro y sin pedir ficha', async () => {
    ajustes.vozEnVivoActiva = false;
    const r = await POST();
    expect(r.status).toBe(403);
    expect((await r.json()).error).toMatch(/apagada/i);
    expect(pedidosAGoogle).toHaveLength(0);
  });

  it('con 0 minutos por día queda apagada', async () => {
    ajustes.vozEnVivoMinutosPorDia = 0;
    const r = await POST();
    expect(r.status).toBe(403);
    expect(pedidosAGoogle).toHaveLength(0);
  });

  it('sin clave de Gemini avisa y no reserva minutos', async () => {
    process.env.GEMINI_API_KEY = 'dummy';
    const r = await POST();
    expect(r.status).toBe(503);
    expect((await r.json()).error).toMatch(/clave/i);
    expect(almacen[ARCHIVO]).toBeUndefined();
  });

  it('sin minutos del día: 429 con la frase para el dueño y sin pedir ficha', async () => {
    almacen[ARCHIVO] = { fecha: hoyEnUruguay(), minutos: 10 };
    const r = await POST();
    expect(r.status).toBe(429);
    expect((await r.json()).error).toBe(
      'Se llegó a los minutos de voz en vivo de hoy. Podés subirlos en Ajustes → Asistente.',
    );
    expect(pedidosAGoogle).toHaveLength(0);
  });

  it('con éxito entrega la ficha y NUNCA la clave real', async () => {
    const r = await POST();
    expect(r.status).toBe(200);
    const texto = JSON.stringify(await r.json());
    expect(texto).not.toContain(CLAVE);
    const cuerpo = JSON.parse(texto);
    expect(cuerpo.token).toBe('auth_tokens/ficha-temporal-1');
    expect(cuerpo.model).toBe('gemini-3.8-live');
    expect(cuerpo.voz).toBe('Kore');
    expect(cuerpo.segundosMaximos).toBe(600);
    expect(cuerpo.wsUrl).toContain('BidiGenerateContentConstrained?access_token=');
    expect(cuerpo.wsUrl).toContain(encodeURIComponent('auth_tokens/ficha-temporal-1'));
    // La clave sólo viaja del servidor a Google, y la ficha es de un solo uso con el contexto del negocio.
    expect(pedidosAGoogle[0].url).toContain('/v1alpha/auth_tokens?key=');
    expect(pedidosAGoogle[0].cuerpo.uses).toBe(1);
    const instrucciones = pedidosAGoogle[0].cuerpo.liveConnectConstraints.config.systemInstruction.parts[0].text;
    expect(instrucciones).toContain('Fiesta de Ana en 3 días');
    expect(almacen[ARCHIVO]).toEqual({ fecha: hoyEnUruguay(), minutos: 10 });
  });

  it('si el primer modelo no existe prueba el siguiente', async () => {
    let n = 0;
    respuestaGoogle = () =>
      n++ === 0
        ? { ok: false, status: 404, body: { error: { message: 'model gemini-3.8-live is not found' } } }
        : { ok: true, status: 200, body: { name: 'auth_tokens/otra' } };
    const r = await POST();
    expect(r.status).toBe(200);
    expect((await r.json()).model).toBe('gemini-2.5-flash-native-audio-preview-12-2025');
  });

  it('si Google falla devuelve un error y devuelve los minutos reservados', async () => {
    respuestaGoogle = () => ({ ok: false, status: 500, body: { error: { message: 'boom' } } });
    const r = await POST();
    expect(r.status).toBe(502);
    const cuerpo = await r.json();
    expect(cuerpo.error).toBeTruthy();
    expect(cuerpo.token).toBeUndefined();
    expect(almacen[ARCHIVO]).toEqual({ fecha: hoyEnUruguay(), minutos: 0 });
  });

  it('dos pedidos a la vez con una base que devuelve copias no gastan de más', async () => {
    ajustes.vozEnVivoMinutosPorDia = 15;
    const respuestas = await Promise.all([POST(), POST(), POST()]);
    const estados = respuestas.map((x) => x.status).sort();
    expect(estados).toEqual([200, 200, 429]);
    expect(almacen[ARCHIVO].minutos).toBe(15);
    const segundos = (await Promise.all(respuestas.filter((x) => x.status === 200).map((x) => x.json())))
      .map((c: any) => c.segundosMaximos)
      .sort((a: number, b: number) => a - b);
    expect(segundos).toEqual([300, 600]);
  });
});
