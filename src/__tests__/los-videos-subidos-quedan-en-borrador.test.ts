import {
  subirVideosDeLaFiesta,
  publicarBorradorConUnToque,
  descartarBorrador,
} from '@/app/actions/videos-para-redes';
import {
  limpiarTextoRedes,
  plataformasParaFormato,
} from '@/lib/presencia-digital/formato-redes';

let storeSocialPosts: any[] = [];
let turno = Promise.resolve();

jest.mock('@/lib/auth/require-session', () => ({
  requirePermiso: jest.fn(async () => ({
    ok: true,
    user: { email: 'crm@akproducciones.com', rol: 'operador' },
  })),
}));

jest.mock('@/lib/generic-json-store', () => ({
  mutateGenericJsonArray: jest.fn(async (_file: string, cambiar: (l: any[]) => any[] | null) => {
    return new Promise((resolve) => {
      turno = turno.then(async () => {
        // Error 11 de CLAUDE.md: La base de verdad devuelve UNA COPIA en cada lectura
        const copiaLectura = JSON.parse(JSON.stringify(storeSocialPosts));
        const resultado = cambiar(copiaLectura);
        if (resultado !== null) {
          storeSocialPosts = JSON.parse(JSON.stringify(resultado));
        }
        resolve(storeSocialPosts);
      });
    });
  }),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (_file: string, fallback: any) => {
    return JSON.parse(JSON.stringify(storeSocialPosts || fallback));
  }),
}));

jest.mock('@/lib/firebase/storage', () => ({
  uploadToStorage: jest.fn(async (_buffer: Buffer, path: string) => {
    return `https://storage.googleapis.com/ak-bucket/${path}`;
  }),
}));

jest.mock('@/lib/ia/aprender-de-lo-aprobado', () => ({
  aprenderDeLoAprobado: jest.fn(async () => [
    'Momentos increíbles en Salto con la mejor energía.',
    'Gracias de corazón por confiar en nuestro trabajo.',
  ]),
  resumirGuiaDeEstilo: jest.fn(() => 'cálido, profesional y directo'),
}));

jest.mock('@/app/actions/fiesta-actual', () => ({
  getFiestaById: jest.fn(async (id: string) => ({
    id,
    configuracion: {
      nombreEvento: 'Boda de Martín y Lucía',
      tipoCelebracion: 'Boda',
      fechaEvento: '2026-11-20',
      protagonista1Nombre: 'Martín',
      protagonista2Nombre: 'Lucía',
    },
  })),
}));

describe('Orden 275 - Los videos subidos quedan en borrador y se publican con un toque', () => {
  beforeEach(() => {
    storeSocialPosts = [];
    turno = Promise.resolve();
  });

  it('subir tres videos (reel, cuadrado y vertical) crea los borradores por red con status Borrador, y ninguno queda Programado ni Publicado', async () => {
    const redesJson = [
      {
        estacion: 'fotocabina',
        formato: 'reel',
        archivo: 'fotocabina-reel.mp4',
        duracion: 15,
      },
      {
        estacion: 'plataforma360',
        formato: 'cuadrado',
        archivo: 'plataforma-cuadrado.mp4',
        duracion: 20,
      },
      {
        estacion: 'vogue',
        formato: '4:5',
        archivo: 'vogue-muro.mp4',
        duracion: 18,
      },
    ];

    const archivos = [
      { nombre: 'fotocabina-reel.mp4', buffer: Buffer.from('video-1') },
      { nombre: 'plataforma-cuadrado.mp4', buffer: Buffer.from('video-2') },
      { nombre: 'vogue-muro.mp4', buffer: Buffer.from('video-3') },
    ];

    const res = await subirVideosDeLaFiesta({
      fiestaId: 'fiesta-boda-1',
      nombreEvento: 'Boda de Martín y Lucía',
      tipoEvento: 'Boda',
      redesJson,
      archivos,
    });

    expect(res.success).toBe(true);
    // Reel (9:16) => Instagram, Facebook, TikTok (3)
    // Cuadrado (1:1) => Facebook (1)
    // Vertical (4:5) => Instagram (1)
    // Total = 5 borradores
    expect(res.createdCount).toBe(5);
    expect(res.posts).toHaveLength(5);
    expect(storeSocialPosts).toHaveLength(5);

    // Todos deben ser Borrador y de tipo video. NINGUNO puede quedar Programado ni Publicado
    for (const post of res.posts) {
      expect(post.status).toBe('Borrador');
      expect(post.mediaType).toBe('video');
      expect(post.eventId).toBe('fiesta-boda-1');
      expect(post.mediaUrl).toBeDefined();
    }

    const estados = res.posts.map((p) => p.status);
    expect(estados).not.toContain('Programado');
    expect(estados).not.toContain('Publicado');
  });

  it('un toque pasa el borrador a Programado con calcularProximaFechaMejorHorario y no se publica solo', async () => {
    const resSubida = await subirVideosDeLaFiesta({
      fiestaId: 'fiesta-1',
      redesJson: [
        { estacion: 'fotocabina', formato: 'cuadrado', archivo: 'cabina.mp4' },
      ],
      archivos: [{ nombre: 'cabina.mp4', buffer: Buffer.from('video-cabina') }],
    });

    expect(resSubida.success).toBe(true);
    const borradorId = resSubida.posts[0].id;
    expect(storeSocialPosts[0].status).toBe('Borrador');

    // Toque para publicar
    const resPublicar = await publicarBorradorConUnToque(borradorId, 'Texto editado listo para salir');
    expect(resPublicar.success).toBe(true);
    expect(resPublicar.post?.status).toBe('Programado');
    expect(resPublicar.post?.text).toBe('Texto editado listo para salir');
    expect(resPublicar.post?.publishDate).toBeDefined();

    // En la base quedó Programado
    const guardado = storeSocialPosts.find((p) => p.id === borradorId);
    expect(guardado.status).toBe('Programado');
  });

  it('descartar un borrador lo marca como Descartado', async () => {
    const resSubida = await subirVideosDeLaFiesta({
      fiestaId: 'fiesta-1',
      redesJson: [
        { estacion: 'barra', formato: 'cuadrado', archivo: 'barra.mp4' },
      ],
      archivos: [{ nombre: 'barra.mp4', buffer: Buffer.from('video-barra') }],
    });

    const borradorId = resSubida.posts[0].id;
    const resDescarte = await descartarBorrador(borradorId);
    expect(resDescarte.success).toBe(true);

    const guardado = storeSocialPosts.find((p) => p.id === borradorId);
    expect(guardado.status).toBe('Descartado');
  });

  it('dos subidas a la vez no pierden borradores (Error 11 de CLAUDE.md: base devuelve una copia en cada lectura)', async () => {
    const subida1 = subirVideosDeLaFiesta({
      fiestaId: 'fiesta-concurrente-1',
      redesJson: [
        { estacion: 'fotocabina', formato: 'cuadrado', archivo: 'f1.mp4' },
      ],
      archivos: [{ nombre: 'f1.mp4', buffer: Buffer.from('v1') }],
    });

    const subida2 = subirVideosDeLaFiesta({
      fiestaId: 'fiesta-concurrente-2',
      redesJson: [
        { estacion: 'plataforma360', formato: 'cuadrado', archivo: 'f2.mp4' },
      ],
      archivos: [{ nombre: 'f2.mp4', buffer: Buffer.from('v2') }],
    });

    const [res1, res2] = await Promise.all([subida1, subida2]);
    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);

    // Ambas subidas deben coexistir en el store sin que una pise a la otra
    expect(storeSocialPosts).toHaveLength(2);
    const ids = storeSocialPosts.map((p) => p.id);
    expect(ids).toContain(res1.posts[0].id);
    expect(ids).toContain(res2.posts[0].id);
  });

  it('el texto generado respeta CLAUDE.md: sin garantía, sin 24/7 y sin precios', async () => {
    const res = await subirVideosDeLaFiesta({
      fiestaId: 'fiesta-limpia',
      nombreEvento: '15 Años de Valentina',
      tipoEvento: 'XV Años',
      redesJson: [
        { estacion: 'plataforma360', formato: 'reel', archivo: 'valen.mp4' },
      ],
      archivos: [{ nombre: 'valen.mp4', buffer: Buffer.from('video') }],
    });

    expect(res.success).toBe(true);
    for (const post of res.posts) {
      const texto = post.text.toLowerCase();
      expect(texto).not.toMatch(/\bgarant[ií]a[s]?\b/i);
      expect(texto).not.toMatch(/\bgarantizado[s]?\b/i);
      expect(texto).not.toMatch(/\b24\/7\b/i);
      expect(texto).not.toMatch(/[$€£]\s*\d+/);
      expect(texto).not.toMatch(/\b(uyu|pesos|usd|dólares)\b/i);
      // No contiene el nombre de la quinceañera salvo que el dueño lo agregue
      expect(texto).not.toContain('valentina');
      // Contiene hashtags del rubro
      expect(texto).toContain('#akproducciones');
    }

    // Comprobar que el sanitizador limpia frases que pudieran traer palabras prohibidas
    const sucio = 'Servicio con garantía total 24/7 por solo $5000 UYU';
    const limpio = limpiarTextoRedes(sucio);
    expect(limpio).not.toMatch(/\bgarant[ií]a\b/i);
    expect(limpio).not.toMatch(/\b24\/7\b/i);
    expect(limpio).not.toMatch(/\$5000/);
    expect(limpio).not.toMatch(/\buyu\b/i);
  });
});
