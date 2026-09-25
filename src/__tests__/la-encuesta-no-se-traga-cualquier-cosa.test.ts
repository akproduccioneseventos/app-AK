/** @jest-environment node */
/**
 * LA ENCUESTA POST FIESTA LA CONTESTA CUALQUIERA, ASI QUE NO SE LE CREE NADA.
 *
 * Los tres defectos los encontro Codex el 17 de septiembre de 2026:
 *
 * 1. **Dos respuestas al mismo tiempo y una desaparecia.** Se leia la lista entera, se agregaba
 *    la nueva y se guardaba la lista entera. El segundo pisaba al primero.
 * 2. **Se aceptaba una nota de 99 o de -5**, y el panel del dueno mostraba promedios inventados.
 * 3. **Se aceptaban campos internos mandados desde el navegador.** El peor de todos:
 *    `googleReviewRequested`. Mandandolo en true, la app cree que a ese cliente ya se le pidio
 *    la resena en Google y no se la pide nunca mas.
 *
 * Las tres llaman al codigo de la app. Si se saca el arreglo, se ponen en rojo.
 */

const archivos: Record<string, any> = {};

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => undefined),
}));

jest.mock('@/lib/data-service', () => ({
  // Devuelve una COPIA, como la base de verdad: si devolviera la misma lista en memoria, las
  // dos respuestas escribirian sobre el mismo arreglo y la prueba nunca veria el pisotazo.
  readData: jest.fn(async (archivo: string, porDefecto: any) => {
    const guardado = archivos[archivo] ?? porDefecto;
    return Array.isArray(guardado) ? guardado.map((item) => ({ ...item })) : guardado;
  }),
  writeData: jest.fn(async (archivo: string, valor: any) => {
    // Guardar de verdad tarda: es justo el rato en que entra la otra respuesta.
    await new Promise((listo) => setTimeout(listo, 5));
    archivos[archivo] = valor;
  }),
  // Con base: se agrega ESA respuesta sola, leyendo lo que hay en ese momento.
  createDataItem: jest.fn(async (archivo: string, _c: string, id: string, item: any) => {
    await new Promise((listo) => setTimeout(listo, 5));
    const lista = (archivos[archivo] as any[]) || [];
    if (lista.some((x) => x.id === id)) throw new Error('ya existe');
    archivos[archivo] = [...lista, { ...item }];
  }),
  mutateDataItem: jest.fn(),
}));

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn(async () => undefined),
}));

jest.mock('@/app/actions/settings', () => ({
  getCompanyInfoPublica: jest.fn(async () => ({ enableGoogleReviewsAutoRequest: false, googleReviewsLink: '' })),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({ getFiestaById: jest.fn(async () => null) }));
jest.mock('@/app/actions/whatsapp', () => ({ getWhatsAppConfig: jest.fn(async () => ({ enabled: false })) }));
jest.mock('@/lib/whatsapp/meta-sender', () => ({ sendMetaWhatsAppMessage: jest.fn(async () => ({ success: false })) }));

const encuestaValida = {
  fiestaId: 'fiesta-1',
  fiestaNombre: 'Cumple de prueba',
  clientName: 'Ana',
  enjoyedMost: 'La comida',
  toImprove: 'Mas postres',
  npsScore: 9,
};

describe('La encuesta post fiesta no se traga cualquier cosa', () => {
  beforeEach(() => {
    for (const clave of Object.keys(archivos)) delete archivos[clave];
    archivos['feedback.json'] = [];
  });

  it('dos clientes contestando al mismo tiempo: quedan las dos respuestas', async () => {
    const { saveFeedback } = await import('@/app/actions/feedback');

    await Promise.all([
      saveFeedback({ ...encuestaValida, clientName: 'Ana' }),
      saveFeedback({ ...encuestaValida, clientName: 'Beto' }),
    ]);

    const guardadas = archivos['feedback.json'] as any[];
    expect(guardadas).toHaveLength(2);
    expect(guardadas.map((f) => f.clientName).sort()).toEqual(['Ana', 'Beto']);
  });

  it('dos respuestas a la vez en DOS servidores: quedan las dos (Codex, 25 de septiembre de 2026)', async () => {
    // Cada servidor con su propio turno: el turno no alcanza, tiene que ser la base.
    const servidor = () => {
      let m: any;
      jest.isolateModules(() => { m = require('@/app/actions/feedback'); });
      return m as typeof import('@/app/actions/feedback');
    };
    const antes = process.env.AK_USE_LOCAL_JSON_ONLY;
    delete process.env.AK_USE_LOCAL_JSON_ONLY;
    try {
      const [a, b] = await Promise.all([
        servidor().saveFeedback({ ...encuestaValida, clientName: 'Ana' }),
        servidor().saveFeedback({ ...encuestaValida, clientName: 'Beto' }),
      ]);
      expect(a.success && b.success).toBe(true);
      expect((archivos['feedback.json'] as any[]).map((f) => f.clientName).sort()).toEqual(['Ana', 'Beto']);
    } finally {
      if (antes === undefined) delete process.env.AK_USE_LOCAL_JSON_ONLY;
      else process.env.AK_USE_LOCAL_JSON_ONLY = antes;
    }
  });

  it('una nota de 99 no entra: se avisa y no se guarda nada', async () => {
    const { saveFeedback } = await import('@/app/actions/feedback');

    const resultado = await saveFeedback({ ...encuestaValida, npsScore: 99 });

    expect(resultado.success).toBe(false);
    expect(archivos['feedback.json']).toHaveLength(0);
  });

  it('las estrellas fuera del 1 al 5 tampoco entran', async () => {
    const { saveFeedback } = await import('@/app/actions/feedback');

    const resultado = await saveFeedback({ ...encuestaValida, ratingComida: 50 });

    expect(resultado.success).toBe(false);
    expect(archivos['feedback.json']).toHaveLength(0);
  });

  /**
   * La mas importante de las tres: este campo es interno. Si entra desde afuera, el cliente
   * queda marcado como "ya se le pidio la resena" y se pierde la resena en Google para siempre.
   */
  it('un campo interno mandado desde el navegador se tira', async () => {
    const { saveFeedback } = await import('@/app/actions/feedback');

    const resultado = await saveFeedback({
      ...encuestaValida,
      googleReviewRequested: true,
      rolInterno: 'admin',
    } as any);

    expect(resultado.success).toBe(true);
    const guardada = (archivos['feedback.json'] as any[])[0];
    expect(guardada.googleReviewRequested).toBeUndefined();
    expect(guardada.rolInterno).toBeUndefined();
  });

  it('la respuesta de siempre, la que manda la pantalla, se guarda entera', async () => {
    const { saveFeedback } = await import('@/app/actions/feedback');

    const resultado = await saveFeedback({ ...encuestaValida, ratingComida: 5, generalComments: 'Gracias' });

    expect(resultado.success).toBe(true);
    const guardada = (archivos['feedback.json'] as any[])[0];
    expect(guardada.clientName).toBe('Ana');
    expect(guardada.npsScore).toBe(9);
    expect(guardada.ratingComida).toBe(5);
    expect(guardada.generalComments).toBe('Gracias');
  });

  it('si el tope de envios salta, se contesta con un aviso y no se cuelga la pantalla', async () => {
    const { enforcePublicRateLimit } = await import('@/lib/commercial/public-rate-limit');
    (enforcePublicRateLimit as jest.Mock).mockImplementationOnce(async () => {
      throw new Error('demasiados envios');
    });
    const { saveFeedback } = await import('@/app/actions/feedback');

    const resultado = await saveFeedback(encuestaValida);

    expect(resultado.success).toBe(false);
    expect(resultado.error).toBeTruthy();
  });
});
