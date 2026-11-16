/**
 * Pruebas de la Orden 282: Publicar solo espera 12 horas.
 * Verifica:
 * - Con "Publicar solo" prendido, un borrador de hace 11 h sigue en borrador.
 * - Uno de hace 13 h pasa a Programado en el mejor horario.
 * - Uno marcado "No publicar" (descartado/cancelado) no pasa nunca.
 * - Uno con una foto sin permiso de promoción no pasa.
 * - Con el interruptor apagado, ningún borrador se programa automáticamente.
 * - Respeta el ritmo de máximo 1 publicación por día por red.
 */

import {
  procesarBorradoresPublicarSolo,
  validarPermisoPromocionalPosteo,
  setAjustesPublicarSolo,
  getAjustesPublicarSolo,
  calcularFechaProximaPublicacionSinSaturar,
} from '@/lib/presencia-digital/publicador';
import { readData, writeData } from '@/lib/data-service';
import type { SocialPost } from '@/types/social-media';

let store: Record<string, unknown> = {};

jest.mock('server-only', () => ({}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, def: unknown) =>
    file in store ? store[file] : def,
  ),
  writeData: jest.fn(async (file: string, data: unknown) => {
    store[file] = data;
  }),
}));

const mockFotosPromocionales = jest.fn();
jest.mock('@/lib/asistente/comercial-borrador', () => ({
  fotosPromocionalesDeFiesta: (id: string) => mockFotosPromocionales(id),
}));

jest.mock('@/lib/whatsapp/meta-sender', () => ({
  sendMetaWhatsAppMessage: jest.fn().mockResolvedValue({ success: true }),
}));

describe('Publicar solo espera 12 horas (Orden 282 - Bloque 4)', () => {
  const ahora = new Date('2026-11-12T12:00:00Z');
  const hace11Horas = new Date(ahora.getTime() - 11 * 60 * 60 * 1000).toISOString();
  const hace13Horas = new Date(ahora.getTime() - 13 * 60 * 60 * 1000).toISOString();

  beforeEach(() => {
    store = {
      'presencia-digital-ajustes.json': { activo: true },
      'social-posts.json': [],
    };
    mockFotosPromocionales.mockReset();
    mockFotosPromocionales.mockResolvedValue([
      { id: 'foto_ok_1', url: 'https://example.com/foto-con-permiso.jpg' },
    ]);
  });

  it('un borrador de hace 11 horas sigue en borrador', async () => {
    const post11h: SocialPost = {
      id: 'post_11h',
      platform: 'Instagram',
      status: 'Borrador',
      text: 'Borrador reciente de 15 años',
      mediaUrl: 'https://example.com/foto-con-permiso.jpg',
      eventId: 'fiesta_101',
      createdAt: hace11Horas,
      updatedAt: hace11Horas,
      publishDate: '',
    };

    store['social-posts.json'] = [post11h];

    const resultado = await procesarBorradoresPublicarSolo(ahora);

    expect(resultado.esperando).toContain('post_11h');
    expect(resultado.promocionados).toHaveLength(0);

    const posts = store['social-posts.json'] as SocialPost[];
    expect(posts[0].status).toBe('Borrador');
  });

  it('un borrador de hace 13 horas pasa a Programado en el mejor horario', async () => {
    const post13h: SocialPost = {
      id: 'post_13h',
      platform: 'Instagram',
      status: 'Borrador',
      text: 'Borrador maduro para publicar solo',
      mediaUrl: 'https://example.com/foto-con-permiso.jpg',
      eventId: 'fiesta_102',
      createdAt: hace13Horas,
      updatedAt: hace13Horas,
      publishDate: '',
    };

    store['social-posts.json'] = [post13h];

    const resultado = await procesarBorradoresPublicarSolo(ahora);

    expect(resultado.promocionados).toContain('post_13h');
    const posts = store['social-posts.json'] as SocialPost[];
    expect(posts[0].status).toBe('Programado');
    expect(posts[0].publishDate).toBeTruthy();
  });

  it('un borrador marcado "No publicar" (descartado/cancelado) no pasa nunca', async () => {
    const postDescartado: SocialPost = {
      id: 'post_descartado',
      platform: 'Instagram',
      status: 'Descartado',
      text: 'Este evento pidió no subir contenido',
      mediaUrl: 'https://example.com/foto-con-permiso.jpg',
      eventId: 'fiesta_103',
      createdAt: hace13Horas,
      updatedAt: hace13Horas,
      publishDate: '',
    };

    const postMarcadoNoPublicar: SocialPost = {
      id: 'post_no_pub',
      platform: 'Facebook',
      status: 'Borrador',
      text: 'Post con switch manual no publicar',
      mediaUrl: 'https://example.com/foto-con-permiso.jpg',
      eventId: 'fiesta_104',
      createdAt: hace13Horas,
      updatedAt: hace13Horas,
      publishDate: '',
      noPublicar: true,
    } as any;

    store['social-posts.json'] = [postDescartado, postMarcadoNoPublicar];

    const resultado = await procesarBorradoresPublicarSolo(ahora);

    expect(resultado.descartados).toContain('post_descartado');
    expect(resultado.descartados).toContain('post_no_pub');
    expect(resultado.promocionados).not.toContain('post_descartado');
    expect(resultado.promocionados).not.toContain('post_no_pub');

    const posts = store['social-posts.json'] as SocialPost[];
    expect(posts.find((p) => p.id === 'post_descartado')?.status).toBe('Descartado');
    expect(posts.find((p) => p.id === 'post_no_pub')?.status).toBe('Borrador');
  });

  it('un borrador con una foto sin permiso de promoción no pasa', async () => {
    mockFotosPromocionales.mockResolvedValueOnce([]); // Sin consentimiento

    const postSinPermiso: SocialPost = {
      id: 'post_sin_permiso',
      platform: 'Instagram',
      status: 'Borrador',
      text: 'Foto de cliente sin consentimiento promocional firmado',
      mediaUrl: 'https://example.com/foto-prohibida.jpg',
      eventId: 'fiesta_sin_permiso',
      createdAt: hace13Horas,
      updatedAt: hace13Horas,
      publishDate: '',
    };

    store['social-posts.json'] = [postSinPermiso];

    const resultado = await procesarBorradoresPublicarSolo(ahora);

    expect(resultado.rechazadosPorPermiso).toContain('post_sin_permiso');
    expect(resultado.promocionados).toHaveLength(0);

    const posts = store['social-posts.json'] as SocialPost[];
    expect(posts[0].status).toBe('Borrador');
  });

  it('una foto suelta sin fiesta ni permiso promocional devuelve false y NO se publica sola', async () => {
    const postFotoSueltaSinPermiso: SocialPost = {
      id: 'post_suelto_sin_permiso',
      platform: 'Instagram',
      status: 'Borrador',
      text: 'Foto suelta sin fiesta ni permiso en galería propia',
      mediaUrl: 'https://example.com/foto-suelta-no-autorizada.jpg',
      createdAt: hace13Horas,
      updatedAt: hace13Horas,
      publishDate: '',
    };

    // La función debe devolver false directamente
    const tienePermiso = await validarPermisoPromocionalPosteo(postFotoSueltaSinPermiso);
    expect(tienePermiso).toBe(false);

    // Al procesar borradores no se promociona y queda en esperando/rechazados
    store['social-posts.json'] = [postFotoSueltaSinPermiso];
    const resultado = await procesarBorradoresPublicarSolo(ahora);

    expect(resultado.rechazadosPorPermiso).toContain('post_suelto_sin_permiso');
    expect(resultado.promocionados).not.toContain('post_suelto_sin_permiso');

    const posts = store['social-posts.json'] as SocialPost[];
    expect(posts[0].status).toBe('Borrador');
  });

  it('una foto suelta sin fiesta pero marcada para promoción en galería propia sí devuelve true y se promociona', async () => {
    store['galeria-publica.json'] = {
      fotos: [
        {
          id: 'foto_galeria_promo',
          url: 'https://example.com/foto-galeria-promo.jpg',
          esPromocional: true,
        },
      ],
    };

    const postFotoSueltaConPermiso: SocialPost = {
      id: 'post_suelto_con_permiso',
      platform: 'Instagram',
      status: 'Borrador',
      text: 'Foto de galería propia marcada para promoción',
      mediaUrl: 'https://example.com/foto-galeria-promo.jpg',
      createdAt: hace13Horas,
      updatedAt: hace13Horas,
      publishDate: '',
    };

    const tienePermiso = await validarPermisoPromocionalPosteo(postFotoSueltaConPermiso);
    expect(tienePermiso).toBe(true);

    store['social-posts.json'] = [postFotoSueltaConPermiso];
    const resultado = await procesarBorradoresPublicarSolo(ahora);

    expect(resultado.promocionados).toContain('post_suelto_con_permiso');
    expect(resultado.rechazadosPorPermiso).not.toContain('post_suelto_con_permiso');
  });

  it('con "Publicar solo" apagado, ningún borrador pasa a Programado', async () => {
    store['presencia-digital-ajustes.json'] = { activo: false };

    const post13h: SocialPost = {
      id: 'post_apagado',
      platform: 'Instagram',
      status: 'Borrador',
      text: 'Borrador esperando pero con switch apagado',
      mediaUrl: 'https://example.com/foto-con-permiso.jpg',
      eventId: 'fiesta_105',
      createdAt: hace13Horas,
      updatedAt: hace13Horas,
      publishDate: '',
    };

    store['social-posts.json'] = [post13h];

    const resultado = await procesarBorradoresPublicarSolo(ahora);

    expect(resultado.activo).toBe(false);
    expect(resultado.promocionados).toHaveLength(0);

    const posts = store['social-posts.json'] as SocialPost[];
    expect(posts[0].status).toBe('Borrador');
  });

  it('respeta el ritmo de máximo 1 publicación por día por red', () => {
    const postsExistentes: SocialPost[] = [
      {
        id: 'p_existente_1',
        platform: 'Instagram',
        status: 'Programado',
        text: 'Post ya programado para mañana',
        publishDate: '2026-11-13T23:00:00.000Z',
        createdAt: '2026-11-12T00:00:00Z',
        updatedAt: '2026-11-12T00:00:00Z',
      },
    ];

    const fechaParaNuevo = calcularFechaProximaPublicacionSinSaturar(
      postsExistentes,
      'Instagram',
      ahora,
    );

    // No debe programarse para el 2026-11-13 porque ya está ocupado en Instagram
    expect(fechaParaNuevo).not.toContain('2026-11-13');
    expect(new Date(fechaParaNuevo).getTime()).toBeGreaterThan(
      new Date('2026-11-13T23:00:00.000Z').getTime(),
    );
  });
});
