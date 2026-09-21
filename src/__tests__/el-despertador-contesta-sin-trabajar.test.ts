/** @jest-environment node */
/**
 * EL DESPERTADOR DE AFUERA TIENE QUE PODER TOCAR LA PUERTA SIN ESPERAR EL TRABAJO.
 *
 * **Que paso (15 de septiembre de 2026):** el servicio gratuito que despertaba la app
 * desde afuera **fue dado de baja por acumular errores**. La puerta que golpeaba
 * (`/api/cron-despachador`) no contesta hasta terminar todas las tareas automaticas
 * -incluida una nota de blog hecha con inteligencia artificial-, asi que desde afuera
 * se ve como una demora eterna y se anota como fallo.
 *
 * Esta prueba cuida que `/api/despertar` siga siendo lo que tiene que ser: **deja
 * constancia y contesta**. Si alguien le cuelga el trabajo de las tareas adentro, esto
 * se pone en rojo.
 */

const marcarToqueDespertador = jest.fn(async () => undefined);
const ponerAlDiaAlEntrar = jest.fn(async () => ({ corrio: true }));

jest.mock('@/lib/automatico/tareas-automaticas', () => ({
  marcarToqueDespertador: (...args: unknown[]) => marcarToqueDespertador(...(args as [])),
}));

jest.mock('@/lib/automatico/al-entrar-a-la-app', () => ({
  ponerAlDiaAlEntrar: (...args: unknown[]) => ponerAlDiaAlEntrar(...(args as [])),
}));

describe('La puerta que solo despierta', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.CRON_SECRET;
    delete process.env.TAREAS_SECRET;
  });

  it('contesta que si y deja constancia, sin correr ninguna tarea', async () => {
    const { GET } = await import('@/app/api/despertar/route');

    const respuesta = await GET(new Request('https://ak.test/api/despertar'));
    const cuerpo = await respuesta.json();

    expect(respuesta.status).toBe(200);
    expect(cuerpo.despierto).toBe(true);
    expect(marcarToqueDespertador).toHaveBeenCalledTimes(1);

    // Lo que importa: NO se puso a trabajar. Si alguien le cuelga las tareas adentro,
    // el servicio de afuera vuelve a cortar por demora y a darse de baja.
    expect(ponerAlDiaAlEntrar).not.toHaveBeenCalled();
  });

  it('si no puede anotar el toque, igual contesta que si', async () => {
    marcarToqueDespertador.mockRejectedValueOnce(new Error('la base no contesta') as never);
    const { GET } = await import('@/app/api/despertar/route');

    const respuesta = await GET(new Request('https://ak.test/api/despertar'));
    const cuerpo = await respuesta.json();

    expect(respuesta.status).toBe(200);
    expect(cuerpo.quedoAnotado).toBe(false);
  });

  it('con clave configurada, al que toca sin clave le dice que no', async () => {
    process.env.CRON_SECRET = 'la-clave';
    const { GET } = await import('@/app/api/despertar/route');

    const respuesta = await GET(new Request('https://ak.test/api/despertar'));

    expect(respuesta.status).toBe(401);
    expect(marcarToqueDespertador).not.toHaveBeenCalled();
  });
});
