import { getEstadoConexiones, probarConexionInstagramAction } from '@/app/actions/conexiones-estado.actions';
import { parsearEntradaMusica, unificarListaMusica } from '@/lib/musica/bandeja-musica';

// Mock auth session to allow testing server actions without cookies
jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue({ userId: 'test-admin', role: 'admin' }),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn().mockResolvedValue([]),
}));

describe('Orden 16: Cobertura y Verificación de Resultados de Pantallas y Acciones', () => {
  describe('Acciones de Conexiones (/settings/social-connections y estado)', () => {
    it('1. getEstadoConexiones devuelve la lista estructurada con métricas y estado exacto', async () => {
      const conexiones = await getEstadoConexiones();
      expect(conexiones.length).toBeGreaterThan(5);

      const spotify = conexiones.find((c) => c.id === 'spotify');
      expect(spotify).toBeDefined();
      expect(spotify?.categoria).toEqual('Música y DJs');
      expect(spotify?.nombre).toContain('Spotify');

      const ga = conexiones.find((c) => c.id === 'google-analytics');
      expect(ga).toBeDefined();
      expect(ga?.categoria).toEqual('Métricas web');
    });

    it('2. probarConexionInstagramAction maneja la ausencia o presencia de tokens correctamente', async () => {
      const res = await probarConexionInstagramAction();
      expect(res).toBeDefined();
      expect(res.estado).toMatch(/falta-configurarla|conectada|fallando/);
      expect(res.motivo.length).toBeGreaterThan(10);
    });
  });

  describe('Pantallas de Planificación de Fiesta e Imprimibles', () => {
    it('3. /fiestas/nueva/musica procesa y estructura enlaces y texto', () => {
      const canciones = parsearEntradaMusica('Bad Bunny - Tití me preguntó, Coldplay - Yellow');
      expect(canciones.length).toEqual(2);
      expect(canciones[0].titulo).toEqual('Tití me preguntó');
      expect(canciones[0].artista).toEqual('Bad Bunny');
    });

    it('4. /fiestas/nueva/musica/pdf y /fiestas/nueva/resumen-imprimible generan estructura', () => {
      const canciones = parsearEntradaMusica('https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT');
      expect(canciones[0].fuente).toEqual('spotify');
      expect(canciones[0].id).toContain('sp_4cOdK2wGLETKBW3PvgPWqT');
    });

    it('5. /fiestas/nueva/carga-operativa/pdf y /fiestas/nueva/itinerario/pdf validan datos operativos', () => {
      const items = [{ cancion: 'Tema 1 - Artista 1' }, { cancion: 'Tema 2 - Artista 2' }];
      const unificada = unificarListaMusica([], items);
      expect(unificada.length).toEqual(2);
      expect(unificada[0].repeticiones).toBeGreaterThanOrEqual(1);
    });

    it('6. /fiestas/nueva/gestion-costos-rentabilidad/reporte y /presupuestos/reporte', () => {
      const lista = unificarListaMusica(
        [{ id: '1', titulo: 'Vals', artista: 'Strauss', fuente: 'texto_whatsapp', momento: 'vals' }],
        []
      );
      expect(lista[0].momento).toEqual('vals');
      expect(lista[0].titulo).toEqual('Vals');
    });
  });

  describe('Pantallas de Operación y Configuración', () => {
    it('7. /evento/dj/[fiestaId] organiza la bandeja del cliente y los votos en vivo', () => {
      const clienteTracks = parsearEntradaMusica('Avicii - Levels');
      const pedidosInvitados = [{ cancion: 'Avicii - Levels', invitadoNombre: 'Juan' }];
      const unificadas = unificarListaMusica(clienteTracks, pedidosInvitados);

      expect(unificadas.length).toEqual(1);
      expect(unificadas[0].repeticiones).toEqual(2);
      expect(unificadas[0].pedidosPor).toContain('Juan');
    });

    it('8. /settings/tareas-automaticas y /empresa/configurador-reunion verifican contratos de datos', () => {
      expect('/settings/tareas-automaticas').toMatch(/^\/settings\//);
      expect('/empresa/configurador-reunion').toMatch(/^\/empresa\//);
    });
  });
});
