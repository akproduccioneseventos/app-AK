/**
 * Los impresos que van a las mesas salen con los datos DE LA FIESTA, no con los
 * del ejemplo.
 *
 * Los valores por defecto traían "La Agasajada" y "01/01/2025". El código que
 * ponía el nombre y la fecha reales miraba si el campo estaba vacío... y nunca lo
 * estaba, porque el ejemplo ya ocupaba el lugar. Así que los números de mesa se
 * imprimían con el nombre y la fecha de mentira salvo que alguien los escribiera a
 * mano — y eso termina impreso en una mesa, delante de los invitados.
 */
import {
  defaultNumerosMesaData,
  defaultMenuMesaData,
  defaultCartaTragosData,
} from '@/lib/fiesta-defaults';

describe('Impresos de las mesas', () => {
  it('los números de mesa arrancan sin nombre, sin fecha y sin foto', () => {
    expect(defaultNumerosMesaData.protagonistaNombre).toBe('');
    expect(defaultNumerosMesaData.fechaEvento).toBe('');
    expect(defaultNumerosMesaData.backgroundImageUrl).toBe('');
  });

  it('el menú de mesa y la carta de tragos tampoco traen nombre de ejemplo', () => {
    expect(defaultMenuMesaData.protagonistaNombre).toBe('');
    expect(defaultCartaTragosData.protagonistaNombre).toBe('');
  });

  it('la carta de tragos no dice "Mis XV" en una boda', () => {
    // Con 'Mis XV' escrito en el defecto, la carta de una BODA se imprimía
    // diciendo "Mis XV": el código que pone "Nuestra Boda" según el tipo de fiesta
    // preguntaba si el campo estaba vacío, y nunca lo estaba.
    expect(defaultCartaTragosData.numeroPrincipal).toBe('');

    const enUnaBoda = defaultCartaTragosData.numeroPrincipal || 'Nuestra Boda';
    expect(enUnaBoda).toBe('Nuestra Boda');
  });

  it('con los campos vacíos, el nombre de la fiesta sí se usa', () => {
    // Es la misma mezcla que hace la pantalla: por defecto primero, lo guardado
    // encima. Con el defecto vacío, el relleno con los datos reales funciona.
    const mezcla = { ...defaultNumerosMesaData, ...({} as Record<string, string>) };
    const nombreDeLaFiesta = 'Valentina';
    const resultado = mezcla.protagonistaNombre || nombreDeLaFiesta;
    expect(resultado).toBe('Valentina');
  });

  it('ninguno de los tres trae una foto traída de internet', () => {
    const todo = JSON.stringify([defaultNumerosMesaData, defaultMenuMesaData, defaultCartaTragosData]);
    expect(todo).not.toMatch(/picsum\.photos|placeholder\.com|dummyimage/i);
  });
});
