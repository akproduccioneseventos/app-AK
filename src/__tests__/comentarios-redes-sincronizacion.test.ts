/**
 * Los cinco controles que pedía la orden de los comentarios de las redes.
 *
 * Llaman al código de verdad (`syncCommentsFromNetworks`), no a una lista armada
 * adentro de la prueba: ya pasó tres veces que una entrega venía "en verde" sin
 * haber probado nada.
 */
import { syncCommentsFromNetworks } from '@/lib/social-media/comments-backfill';
import { readData, writeData } from '@/lib/data-service';
import { clasificarComentario } from '@/lib/social-media/clasificador-comentarios';

jest.mock('@/lib/data-service', () => ({ readData: jest.fn(), writeData: jest.fn() }));
jest.mock('@/lib/social-media/clasificador-comentarios', () => ({ clasificarComentario: jest.fn() }));

const mockedReadData = readData as jest.MockedFunction<typeof readData>;
const mockedWriteData = writeData as jest.MockedFunction<typeof writeData>;
const mockedClasificar = clasificarComentario as jest.MockedFunction<typeof clasificarComentario>;

const CONEXION_FACEBOOK = {
  platform: 'Facebook',
  isConnected: true,
  pageId: 'pagina_ak',
  pageAccessToken: 'token-de-prueba',
};

/** Arma la respuesta que devolvería Facebook con los comentarios pedidos. */
function respuestaDeFacebook(comentarios: Array<{ id: string; message: string }>) {
  return {
    ok: true,
    json: async () => ({
      data: [
        {
          id: 'post_1',
          message: 'Fiesta de 15 en Salto',
          permalink_url: 'https://facebook.com/post_1',
          comments: {
            data: comentarios.map((c) => ({
              id: c.id,
              message: c.message,
              created_time: '2026-08-01T10:00:00.000Z',
              from: { id: 'autor_1', name: 'Vecina de Salto' },
            })),
          },
        },
      ],
      paging: {},
    }),
  } as any;
}

/**
 * Deja preparado qué devuelve cada archivo. `guardados` son los comentarios que
 * ya estaban en la base antes de sincronizar.
 */
function prepararArchivos(guardados: any[] = [], conexiones: any[] = [CONEXION_FACEBOOK]) {
  mockedReadData.mockImplementation(async (archivo: string, porDefecto: any) => {
    if (archivo === 'social-connections.json') return conexiones as any;
    if (archivo === 'social-comments.json') return guardados as any;
    return porDefecto;
  });
}

/** Lo último que se guardó en el archivo de comentarios. */
function comentariosGuardados(): any[] {
  const llamadas = mockedWriteData.mock.calls.filter((c) => c[0] === 'social-comments.json');
  return (llamadas[llamadas.length - 1]?.[1] as any[]) || [];
}

describe('Sincronización de comentarios de las redes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedClasificar.mockReset();
    global.fetch = jest.fn().mockResolvedValue(respuestaDeFacebook([
      { id: 'c1', message: 'Todo divino, los mejores' },
    ]));
  });

  it('un comentario agresivo se oculta pero NO se borra', async () => {
    prepararArchivos();
    (global.fetch as jest.Mock).mockResolvedValue(respuestaDeFacebook([
      { id: 'c_insulto', message: 'Son unos ladrones de mierda' },
    ]));
    mockedClasificar.mockResolvedValue({
      classified: true,
      sentiment: 'negativo',
      sentimentReason: 'Insulto directo',
      isInsultOrSpam: true,
      isLegitimateComplaint: false,
      autoHideRecommended: true,
    });

    const resumen = await syncCommentsFromNetworks({ full: false });

    const guardados = comentariosGuardados();
    expect(guardados).toHaveLength(1);
    expect(guardados[0].isAutoHidden).toBe(true);
    expect(guardados[0].isDeleted).toBeUndefined();
    expect(guardados[0].text).toBe('Son unos ladrones de mierda');
    expect(resumen.totalAutoHidden).toBe(1);
  });

  it('una queja legítima NO se oculta sola, sólo queda avisada', async () => {
    prepararArchivos();
    (global.fetch as jest.Mock).mockResolvedValue(respuestaDeFacebook([
      { id: 'c_queja', message: 'La comida llegó fría y tarde' },
    ]));
    mockedClasificar.mockResolvedValue({
      classified: true,
      sentiment: 'negativo',
      sentimentReason: 'Disconformidad con la comida',
      isInsultOrSpam: false,
      isLegitimateComplaint: true,
      autoHideRecommended: false,
    });

    await syncCommentsFromNetworks({ full: false });

    const guardados = comentariosGuardados();
    expect(guardados[0].isAutoHidden).toBeUndefined();
    expect(guardados[0].isLegitimateComplaint).toBe(true);
  });

  it('correr dos veces no guarda el mismo comentario dos veces', async () => {
    mockedClasificar.mockResolvedValue({
      classified: true,
      sentiment: 'positivo',
      isInsultOrSpam: false,
      isLegitimateComplaint: false,
      autoHideRecommended: false,
    });

    prepararArchivos();
    await syncCommentsFromNetworks({ full: false });
    const primera = comentariosGuardados();
    expect(primera).toHaveLength(1);

    // Segunda corrida: la base ya tiene lo de la primera.
    prepararArchivos(primera);
    const resumen = await syncCommentsFromNetworks({ full: false });

    expect(comentariosGuardados()).toHaveLength(1);
    expect(resumen.totalNew).toBe(0);
  });

  it('si la inteligencia artificial falla, el comentario se guarda sin clasificar', async () => {
    prepararArchivos();
    mockedClasificar.mockResolvedValue({ classified: false, error: 'Sin presupuesto de IA disponible este mes.' });

    const resumen = await syncCommentsFromNetworks({ full: false });

    const guardados = comentariosGuardados();
    expect(guardados).toHaveLength(1);
    expect(guardados[0].sentiment).toBeUndefined();
    expect(guardados[0].classifiedAt).toBeUndefined();
    expect(guardados[0].isAutoHidden).toBeUndefined();
    expect(resumen.pendientesDeClasificar).toBe(1);
  });

  it('no se revisan más de cien comentarios por corrida: el resto queda pendiente', async () => {
    const muchos = Array.from({ length: 130 }, (_, i) => ({ id: `c${i}`, message: `Comentario numero ${i}` }));
    (global.fetch as jest.Mock).mockResolvedValue(respuestaDeFacebook(muchos));
    prepararArchivos();
    mockedClasificar.mockResolvedValue({
      classified: true,
      sentiment: 'positivo',
      isInsultOrSpam: false,
      isLegitimateComplaint: false,
      autoHideRecommended: false,
    });

    const resumen = await syncCommentsFromNetworks({ full: true });

    expect(comentariosGuardados()).toHaveLength(130);
    expect(mockedClasificar).toHaveBeenCalledTimes(100);
    expect(resumen.totalClasificados).toBe(100);
    expect(resumen.pendientesDeClasificar).toBe(30);
  });

  it('una red sin configurar no rompe la traída de las otras', async () => {
    // Sólo Facebook conectado: Instagram y YouTube quedan sin configurar.
    prepararArchivos();
    mockedClasificar.mockResolvedValue({
      classified: true,
      sentiment: 'positivo',
      isInsultOrSpam: false,
      isLegitimateComplaint: false,
      autoHideRecommended: false,
    });

    const resumen = await syncCommentsFromNetworks({ full: false });

    expect(resumen.success).toBe(true);
    expect(comentariosGuardados()).toHaveLength(1);
    expect(resumen.platforms.Instagram.error).toBeTruthy();
    expect(resumen.platforms.Facebook.error).toBeUndefined();
  });
});
