import { armarHojaDeCocina } from '@/lib/catering/hoja-de-cocina';

describe('Orden 364: la cocina ve todas las condiciones y Panini no es plato infantil', () => {
  it('una invitada vegetariana y celíaca con partySize 2 cuenta en Vegetariano (2) y Celiaco (2)', () => {
    const hoja = armarHojaDeCocina(
      {
        id: 'f_coc_364',
        configuracion: { nombreEvento: 'Boda', fechaEvento: '2026-12-10' },
        invitados: [
          {
            id: 'inv_1',
            nombre: 'Camila',
            rsvp: 'Confirmado',
            partySize: 2,
            dietaryRestriction: 'Vegetariano',
            isCeliac: true,
          } as any,
        ],
      } as any,
      [{ nombre: 'Panini de jamón', categoria: 'Entrada' }],
      { adultos: 100, chicos: 20 }
    );

    const veg = hoja.especiales.find((e) => e.restriccion === 'Vegetariano');
    const cel = hoja.especiales.find((e) => e.restriccion === 'Celiaco');
    expect(veg?.personas).toBe(2);
    expect(cel?.personas).toBe(2);

    const panini = hoja.platos.find((p) => p.nombre === 'Panini de jamón');
    expect(panini?.porciones).toBe(120);
    expect(panini?.momento).not.toBe('Menú Infantil');
  });
});
