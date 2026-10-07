/**
 * LA FOTO TIENE QUE SER DEL PLATO QUE EL CLIENTE ELIGE (orden 127)
 *
 * Usa la funcion REAL que eligen el catalogo interno y el simulador
 * (`getCateringDishImage`), no una copia de la tabla: si alguien cambia la tabla,
 * esta prueba lo ve.
 */

import { getCateringDishImage } from '@/lib/catering/menu-images';

describe('La foto es del plato que el cliente elige', () => {
  describe('Mesa bufet', () => {
    it('no muestra la pizarra vacia que tenia como relleno', () => {
      // Asi esta guardada en la base: con la direccion de su archivo por defecto,
      // que es una pizarra negra sin una sola comida.
      const mesaBufet = {
        id: 'dish_main_19',
        name: 'MESA BUFET',
        imageUrl: '/catering/menus/xv/dish_main_19.jpeg',
      };
      expect(getCateringDishImage(mesaBufet)).toBeUndefined();
    });

    it('si el dueño sube una foto real del buffet, esa SÍ se muestra: no se pisa nada suyo', () => {
      const conFotoPropia = {
        id: 'dish_main_19',
        name: 'MESA BUFET',
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ak/o/mi-buffet.jpg',
      };
      expect(getCateringDishImage(conFotoPropia)).toBe(
        'https://firebasestorage.googleapis.com/v0/b/ak/o/mi-buffet.jpg'
      );
    });
  });

  describe('Las dos picadas: la app está BIEN, no se "arregla" para copiar a Canva', () => {
    // Verificado mirando las fotos el 7 de octubre de 2026:
    //   dish_entrada_22.jpeg = tabla de madera con chorizo, morcilla, queso y pan
    //   dish_entrada_21.jpeg = rabas, pescado frito y langostinos
    // Los ARCHIVOS estan nombrados al reves, y la tabla los cruza a proposito para
    // que cada nombre lleve su comida. En Canva los nombres estan intercambiados:
    // copiar a Canva pondria los mariscos bajo "criolla".

    it('la Picada criolla muestra la tabla de fiambres', () => {
      const criolla = { id: 'dish_entrada_21', name: 'PICADA CRIOLLA' };
      expect(getCateringDishImage(criolla)).toBe('/catering/menus/xv/dish_entrada_22.jpeg');
    });

    it('la Picada de mar muestra los mariscos fritos', () => {
      const deMar = { id: 'dish_entrada_22', name: 'PICADA DE MAR' };
      expect(getCateringDishImage(deMar)).toBe('/catering/menus/xv/dish_entrada_21.jpeg');
    });
  });

  it('los panchos conservan su foto: es comida de verdad, no relleno', () => {
    const panchos = {
      id: 'dish_child_1',
      name: 'PANCHOS MEDIO METRO C/ FRITAS',
      imageUrl: '/catering/menus/xv/dish_child_1.png',
    };
    expect(getCateringDishImage(panchos)).toBe('/catering/menus/xv/dish_child_1.png');
  });
});
