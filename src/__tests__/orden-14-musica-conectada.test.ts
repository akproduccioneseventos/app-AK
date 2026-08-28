import {
  parsearEntradaMusica,
  extraerTituloYArtista,
  unificarListaMusica,
  type CancionBandeja,
} from '@/lib/musica/bandeja-musica';

describe('Bandeja de Música Unificada (Bloque 14 de Orden 14)', () => {
  it('1. Extrae título y artista de textos libres de WhatsApp y formatos habituales', () => {
    const res1 = extraerTituloYArtista('Bad Bunny - Tití me preguntó');
    expect(res1.artista).toBe('Bad Bunny');
    expect(res1.titulo).toBe('Tití me preguntó');

    const res2 = extraerTituloYArtista('1. Luis Fonsi - Despacito (Official Video)');
    expect(res2.artista).toBe('Luis Fonsi');
    expect(res2.titulo).toBe('Despacito');

    const res3 = extraerTituloYArtista('Coldplay: Viva la Vida [HD]');
    expect(res3.artista).toBe('Coldplay');
    expect(res3.titulo).toBe('Viva la Vida');
  });

  it('2. Parsea enlaces de Spotify (playlists y tracks)', () => {
    const entrada = `
      https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT
      https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
    `;
    const canciones = parsearEntradaMusica(entrada);
    expect(canciones.length).toBe(2);
    expect(canciones[0].fuente).toBe('spotify');
    expect(canciones[0].id).toBe('sp_4cOdK2wGLETKBW3PvgPWqT');
    expect(canciones[1].fuente).toBe('spotify');
    expect(canciones[1].titulo).toContain('Playlist de Spotify');
  });

  it('3. Parsea enlaces de YouTube (videos y shorts)', () => {
    const entrada = `
      https://www.youtube.com/watch?v=kJQP7kiw5Fk
      https://youtu.be/dQw4w9WgXcQ
    `;
    const canciones = parsearEntradaMusica(entrada);
    expect(canciones.length).toBe(2);
    expect(canciones[0].fuente).toBe('youtube');
    expect(canciones[1].fuente).toBe('youtube');
  });

  it('4. Parsea listas pegadas de texto libre', () => {
    const entrada = 'Luis Fonsi - Despacito, Bad Bunny - Tití me preguntó, Shakira - La Bicicleta';
    const canciones = parsearEntradaMusica(entrada);
    expect(canciones.length).toBe(3);
    expect(canciones[0].titulo).toBe('Despacito');
    expect(canciones[0].artista).toBe('Luis Fonsi');
    expect(canciones.every((c) => c.fuente === 'texto_whatsapp')).toBe(true);
  });

  it('5. Unifica canciones del cliente con pedidos de invitados y cuenta repeticiones', () => {
    const cancionesCliente: CancionBandeja[] = [
      {
        id: 'c1',
        titulo: 'Tití me preguntó',
        artista: 'Bad Bunny',
        fuente: 'texto_whatsapp',
        pedidoPor: 'Cliente',
      },
      {
        id: 'c2',
        titulo: 'Danubio Azul',
        artista: 'Strauss',
        fuente: 'texto_whatsapp',
        momento: 'vals',
        pedidoPor: 'Cliente',
      },
    ];

    const pedidosInvitados = [
      { cancion: 'Bad Bunny - Tití me preguntó', invitadoNombre: 'Martín' },
      { cancion: 'Bad Bunny - Tití me preguntó', invitadoNombre: 'Sofía' },
      { cancion: 'Quevedo: BZRP Music Sessions', invitadoNombre: 'Lucas' },
    ];

    const listaUnificada = unificarListaMusica(
      cancionesCliente,
      pedidosInvitados,
      ['Canción Prohibida - Artista X'],
      ['Tití me preguntó - Bad Bunny']
    );

    // Tití me preguntó debe tener 3 repeticiones (1 cliente + 2 invitados) y estar primera
    expect(listaUnificada[0].titulo).toContain('Tití me preguntó');
    expect(listaUnificada[0].repeticiones).toBe(3);
    expect(listaUnificada[0].pedidosPor).toContain('Cliente');
    expect(listaUnificada[0].pedidosPor).toContain('Martín');
    expect(listaUnificada[0].pedidosPor).toContain('Sofía');
    expect(listaUnificada[0].esInfaltable).toBe(true);

    // Danubio azul mantiene su momento de vals
    const vals = listaUnificada.find((c) => c.titulo === 'Danubio Azul');
    expect(vals?.momento).toBe('vals');
  });
});
