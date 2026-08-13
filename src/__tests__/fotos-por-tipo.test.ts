import { tipoDeGaleriaPara } from '@/lib/presentacion/fotos-por-tipo';

/**
 * La presentación y la galería no llaman igual a las mismas cosas. Si la
 * traducción falla, la pantalla queda vacía **sin dar ningún error**: nadie se
 * entera hasta que se está vendiendo delante del cliente.
 */

describe('de qué tipo buscar las fotos en la galería', () => {
  it('lo empresarial de la presentación es lo corporativo de la galería', () => {
    expect(tipoDeGaleriaPara('Empresarial')).toBe('Corporativo');
    expect(tipoDeGaleriaPara('Corporativo')).toBe('Corporativo');
    expect(tipoDeGaleriaPara('fiesta empresarial')).toBe('Corporativo');
  });

  it('los infantiles se encuentran aunque cambie la mayúscula o el acento', () => {
    expect(tipoDeGaleriaPara('Cumpleaños infantil')).toBe('Cumpleaños Infantil');
    expect(tipoDeGaleriaPara('cumpleanos infantil')).toBe('Cumpleaños Infantil');
    expect(tipoDeGaleriaPara('Fiesta infantil')).toBe('Cumpleaños Infantil');
  });

  it('NO confunde un cumpleaños infantil con uno de adultos', () => {
    expect(tipoDeGaleriaPara('Cumpleaños infantil')).toBe('Cumpleaños Infantil');
    expect(tipoDeGaleriaPara('Cumpleaños adultos')).toBe('Cumpleaños Adulto');
  });

  it('boda y casamiento son lo mismo', () => {
    expect(tipoDeGaleriaPara('Boda')).toBe('Casamiento');
    expect(tipoDeGaleriaPara('Casamiento')).toBe('Casamiento');
  });

  it('los quince se escriben de muchas formas y todas encuentran', () => {
    for (const escrito of ['15 años', 'XV Años', 'Cumpleaños 15', 'quince', 'quinceañera']) {
      expect(`${escrito} => ${tipoDeGaleriaPara(escrito)}`).toBe(`${escrito} => XV Años`);
    }
  });

  it('un tipo que no se reconoce devuelve nada, para caer en las fotos generales', () => {
    expect(tipoDeGaleriaPara('Fiesta del pueblo')).toBeNull();
    expect(tipoDeGaleriaPara('')).toBeNull();
    expect(tipoDeGaleriaPara(null)).toBeNull();
    expect(tipoDeGaleriaPara(undefined)).toBeNull();
  });
});
