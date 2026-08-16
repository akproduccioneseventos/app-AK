import { testimoniosParaMostrar } from '@/lib/testimonios/para-mostrar';
import type { Testimonial } from '@/types/feedback';

/**
 * Regla dura del dueño: **una opinión mala nunca se publica**. Estas pruebas están
 * para que nadie la rompa sin querer al tocar la pantalla de testimonios.
 */

function testimonio(id: string, texto: string, aprobado: boolean): Testimonial {
  return {
    id,
    feedbackId: `fb_${id}`,
    fiestaId: 'f1',
    fiestaNombre: 'Casamiento de prueba',
    clientName: 'Ana P.',
    testimonialText: texto,
    isApproved: aprobado,
    createdAt: '2026-03-14T00:00:00.000Z',
  };
}

const DE_EJEMPLO = [
  { id: 'ej1', authorName: 'Familia García', source: 'google', text: 'Todo perfecto.' },
];

describe('qué testimonios ve el cliente', () => {
  it('NUNCA muestra uno sin aprobar, aunque venga en la lista', () => {
    const lista = [
      testimonio('malo', 'La comida estaba fría y la música no era la pedida.', false),
      testimonio('bueno', 'Una noche hermosa, gracias por todo.', true),
    ];

    const mostrados = testimoniosParaMostrar(lista, DE_EJEMPLO);

    expect(mostrados.map((t) => t.id)).toEqual(['bueno']);
    expect(mostrados.some((t) => t.text.includes('fría'))).toBe(false);
  });

  it('con TODOS sin aprobar no se filtra ninguno: cae a los de ejemplo', () => {
    const lista = [
      testimonio('malo1', 'No lo recomiendo.', false),
      testimonio('malo2', 'Se atrasaron dos horas.', false),
    ];

    expect(testimoniosParaMostrar(lista, DE_EJEMPLO)).toEqual(DE_EJEMPLO);
  });

  it('sin testimonios cargados muestra los de ejemplo, no una pantalla vacía', () => {
    expect(testimoniosParaMostrar([], DE_EJEMPLO)).toEqual(DE_EJEMPLO);
    expect(testimoniosParaMostrar(null, DE_EJEMPLO)).toEqual(DE_EJEMPLO);
    expect(testimoniosParaMostrar(undefined, DE_EJEMPLO)).toEqual(DE_EJEMPLO);
  });

  it('descarta un testimonio aprobado pero vacío', () => {
    const lista = [testimonio('vacio', '   ', true)];

    expect(testimoniosParaMostrar(lista, DE_EJEMPLO)).toEqual(DE_EJEMPLO);
  });

  it('muestra el nombre del cliente y el mes, no la fecha completa', () => {
    const lista = [testimonio('bueno', 'Una noche hermosa.', true)];

    const [mostrado] = testimoniosParaMostrar(lista, DE_EJEMPLO);

    expect(mostrado.authorName).toBe('Ana P.');
    expect(mostrado.date).toBe('Marzo 2026');
  });

  it('si el testimonio no tiene nombre no muestra un hueco', () => {
    const sinNombre = { ...testimonio('bueno', 'Excelente.', true), clientName: '' };

    const [mostrado] = testimoniosParaMostrar([sinNombre], DE_EJEMPLO);

    expect(mostrado.authorName).toBe('Cliente de AK');
  });
});
