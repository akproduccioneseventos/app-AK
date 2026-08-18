import { testimoniosParaMostrar } from '@/lib/testimonios/para-mostrar';
import type { Testimonial } from '@/types/feedback';

describe('Comentarios de Redes y Testimonios con Capturas', () => {
  it('testimoniosParaMostrar incluye screenshotUrl si el testimonio aprobado la tiene', () => {
    const testimoniosGuardados: Testimonial[] = [
      {
        id: 'testim_1',
        feedbackId: 'fb_1',
        fiestaId: 'party_123',
        fiestaNombre: '15 Años de Valentina',
        clientName: 'María García',
        testimonialText: 'La mejor fiesta de nuestras vidas, todo impecable.',
        isApproved: true,
        screenshotUrl: '/media/comentarios/captura-valentina.png',
        createdAt: '2026-08-10T15:00:00.000Z',
      },
      {
        id: 'testim_2',
        feedbackId: 'fb_2',
        fiestaId: 'party_124',
        fiestaNombre: 'Boda Lucía y Martín',
        clientName: 'Lucía',
        testimonialText: 'Inolvidable el show de luces y la atención.',
        isApproved: true,
        createdAt: '2026-08-12T18:00:00.000Z',
      },
      {
        id: 'testim_3',
        feedbackId: 'fb_3',
        fiestaId: 'party_125',
        fiestaNombre: 'Evento',
        clientName: 'Juan',
        testimonialText: 'Sin aprobar aún',
        isApproved: false,
        createdAt: '2026-08-14T10:00:00.000Z',
      },
    ];

    const resultado = testimoniosParaMostrar(testimoniosGuardados, []);

    expect(resultado).toHaveLength(2);
    expect(resultado[0].screenshotUrl).toBe('/media/comentarios/captura-valentina.png');
    expect(resultado[1].screenshotUrl).toBeUndefined();
    expect(resultado[0].authorName).toBe('María García');
  });

  it('no muestra testimonios sin aprobar aunque tengan captura de pantalla', () => {
    const testimoniosGuardados: Testimonial[] = [
      {
        id: 'testim_unapproved',
        feedbackId: 'fb_99',
        fiestaId: 'party_999',
        fiestaNombre: 'Fiesta X',
        clientName: 'Cliente Anónimo',
        testimonialText: 'Un comentario no revisado',
        isApproved: false,
        screenshotUrl: '/media/comentarios/captura-secreta.png',
        createdAt: '2026-08-15T12:00:00.000Z',
      },
    ];

    const resultado = testimoniosParaMostrar(testimoniosGuardados, [
      { id: 'ejemplo_1', authorName: 'Ejemplo', source: 'text', text: 'Texto de muestra' },
    ]);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].id).toBe('ejemplo_1');
  });
});
