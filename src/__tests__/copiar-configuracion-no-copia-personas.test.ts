import { copiarConfiguracion } from '@/lib/entertainment/copiar-configuracion';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

describe('Bloque 5 - Copiar configuración sin copiar personas ni recuerdos', () => {
  const fiestaOrigen: Partial<FiestaEnPlanificacion> = {
    id: 'fiesta-origen-123',
    nombre: 'Boda de Martín y Sofía',
    fecha: '2026-10-15',
    configuracion: {
      nombreEvento: 'Boda de Martín y Sofía',
      fechaInicio: '2026-10-15T21:00:00Z',
    },
    invitados: [
      {
        id: 'inv-1',
        nombre: 'Martín Rodríguez',
        confirmado: true,
        mesa: 'Mesa 1',
      } as any,
      {
        id: 'inv-2',
        nombre: 'Sofía Pereyra',
        confirmado: true,
        mesa: 'Mesa 1',
      } as any,
    ],
    socialGallerySettings: {
      enabled: true,
      fondoMuro: 'boda-dorada',
      fondoMuroImagenUrl: 'https://cdn.akproducciones.uy/fondos/boda.jpg',
      currentLayout: 'masonry',
      tamanoFotosMosaico: 'chica',
      segundosPorFoto: 4,
      accentColor: '#fbbf24',
      maxImpresionesPorPersona: 3,
      marcoEnImpresion: true,
      // Datos personales que NO deben pasarse:
      posts: [
        {
          id: 'post-1',
          authorName: 'Tía Marta',
          imageUrl: 'https://cdn.akproducciones.uy/fotos/marta.jpg',
          timestamp: '2026-10-15T22:30:00Z',
        },
      ] as any,
      sorteoGanadores: ['Tía Marta'],
      activeGame: {
        gameId: 'trivia-1',
        winner: 'Martín',
      } as any,
      dedications: [
        {
          id: 'ded-1',
          author: 'Juan',
          text: 'Felicidades novios!',
        },
      ] as any,
    } as any,
    others: {
      entretenimiento: {
        modules: {
          plataforma360: {
            enabled: true,
            vueltas360: 3,
            velocidadRecuerdo: 'rapido',
            media: [
              { id: 'video-1', url: 'https://cdn.akproducciones.uy/videos/360-1.mp4' },
            ],
            checklist: [
              { id: 'check-1', text: 'Chequear motor', done: true },
            ],
            totalCapturas: 42,
          } as any,
          fotocabina: {
            enabled: true,
            fotosPorTanda: 4,
            copiasImpresion: 2,
            tamanoPapel: 'tira',
            disenoImpresion: 'personalizado',
            enableBeautyFilter: true,
            media: [
              { id: 'foto-1', url: 'https://cdn.akproducciones.uy/fotos/cabina-1.jpg' },
            ],
            firmas: [
              { id: 'firma-1', de: 'Pedrito', mensaje: 'Aguante todo' },
            ],
            checklist: [
              { id: 'check-2', text: 'Papel cargado', done: true },
            ],
            totalCapturas: 15,
          } as any,
        },
      },
    },
  };

  test('los módulos técnicos y colores se copian correctamente al destino', () => {
    const destino: Partial<FiestaEnPlanificacion> = {
      id: 'fiesta-destino-456',
      configuracion: {
        nombreEvento: '15 de Valentina',
      },
    };

    const copiado = copiarConfiguracion(fiestaOrigen, destino);

    // Módulos
    const mod360 = copiado.others?.entretenimiento?.modules?.plataforma360;
    expect(mod360?.enabled).toBe(true);
    expect(mod360?.vueltas360).toBe(3);
    expect(mod360?.velocidadRecuerdo).toBe('rapido');

    const modCabina = copiado.others?.entretenimiento?.modules?.fotocabina;
    expect(modCabina?.enabled).toBe(true);
    expect(modCabina?.fotosPorTanda).toBe(4);
    expect(modCabina?.copiasImpresion).toBe(2);
    expect(modCabina?.tamanoPapel).toBe('tira');
    expect(modCabina?.enableBeautyFilter).toBe(true);

    // Diseño muro
    expect(copiado.socialGallerySettings?.fondoMuro).toBe('boda-dorada');
    expect(copiado.socialGallerySettings?.fondoMuroImagenUrl).toBe('https://cdn.akproducciones.uy/fondos/boda.jpg');
    expect(copiado.socialGallerySettings?.currentLayout).toBe('masonry');
    expect(copiado.socialGallerySettings?.tamanoFotosMosaico).toBe('chica');
    expect(copiado.socialGallerySettings?.segundosPorFoto).toBe(4);
    expect(copiado.socialGallerySettings?.accentColor).toBe('#fbbf24');
    expect(copiado.socialGallerySettings?.maxImpresionesPorPersona).toBe(3);
    expect(copiado.socialGallerySettings?.marcoEnImpresion).toBe(true);
  });

  test('los posts, invitados, recuerdos, fotos y firmas quedan vacíos o intactos en destino', () => {
    const invitadosDestino = [
      { id: 'inv-dest-1', nombre: 'Valentina', confirmado: true } as any,
    ];
    const destino: Partial<FiestaEnPlanificacion> = {
      id: 'fiesta-destino-456',
      configuracion: {
        nombreEvento: '15 de Valentina',
      },
      invitados: invitadosDestino,
    };

    const copiado = copiarConfiguracion(fiestaOrigen, destino);

    // Los invitados de origen nunca pasan
    expect(copiado.invitados).toHaveLength(1);
    expect(copiado.invitados?.[0].nombre).toBe('Valentina');

    // Módulos no tienen fotos ni recuerdos del origen
    const mod360 = copiado.others?.entretenimiento?.modules?.plataforma360;
    expect(mod360?.media).toEqual([]);
    expect(mod360?.totalCapturas).toBe(0);

    const modCabina = copiado.others?.entretenimiento?.modules?.fotocabina;
    expect(modCabina?.media).toEqual([]);
    expect(modCabina?.firmas).toEqual([]);
    expect(modCabina?.totalCapturas).toBe(0);

    // Las checklist de operador quedan desmarcadas (done: false)
    expect(mod360?.checklist?.[0].done).toBe(false);
    expect(modCabina?.checklist?.[0].done).toBe(false);

    // En socialGallerySettings no hay posts, sorteos ni juegos activos
    expect((copiado.socialGallerySettings as any)?.posts).toBeUndefined();
    expect((copiado.socialGallerySettings as any)?.sorteoGanadores).toBeUndefined();
    expect((copiado.socialGallerySettings as any)?.activeGame).toBeUndefined();
    expect((copiado.socialGallerySettings as any)?.dedications).toBeUndefined();
  });

  test('no queda ningún rastro de datos personales de la fiesta origen', () => {
    const destino: Partial<FiestaEnPlanificacion> = {
      id: 'fiesta-nueva-789',
      configuracion: {
        nombreEvento: 'Cumple de Mateo',
      },
    };

    const copiado = copiarConfiguracion(fiestaOrigen, destino);
    const jsonString = JSON.stringify(copiado);

    // Nombres y mensajes de personas del origen
    expect(jsonString).not.toContain('Martín Rodríguez');
    expect(jsonString).not.toContain('Sofía Pereyra');
    expect(jsonString).not.toContain('Tía Marta');
    expect(jsonString).not.toContain('Felicidades novios!');
    expect(jsonString).not.toContain('Pedrito');
    expect(jsonString).not.toContain('marta.jpg');
    expect(jsonString).not.toContain('360-1.mp4');
    expect(jsonString).not.toContain('cabina-1.jpg');

    // El nombre del evento de destino sigue siendo el de destino
    expect(copiado.configuracion?.nombreEvento).toBe('Cumple de Mateo');
  });
});
