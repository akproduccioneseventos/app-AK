import { tituloQueSirve } from '@/lib/seo/titulo-de-la-portada';

/**
 * El titulo de la portada es el renglon que decide el clic en Google.
 *
 * Por que existe esta prueba: el sitio estaba indexado como "Inicio - AK
 * Producciones". Esa palabra no dice ni que es un salon de fiestas ni que esta en
 * Salto, y es lo unico que ve la persona antes de entrar. Si en Ajustes queda
 * cargada una palabra generica, se ignora y se usa el nombre de la empresa.
 */
describe('el titulo de la portada', () => {
  it('ignora las palabras que no dicen nada', () => {
    for (const generico of ['Inicio', 'inicio', 'HOME', 'Portada', 'Página principal', '  index  ']) {
      expect(tituloQueSirve(generico)).toBe('AK Producciones Eventos');
    }
  });

  it('usa el nombre de la empresa cuando el campo esta vacio', () => {
    expect(tituloQueSirve('')).toBe('AK Producciones Eventos');
    expect(tituloQueSirve(undefined)).toBe('AK Producciones Eventos');
    expect(tituloQueSirve(null)).toBe('AK Producciones Eventos');
  });

  it('respeta un titulo escrito de verdad', () => {
    expect(tituloQueSirve('Salon y fiestas de 15 en Salto')).toBe('Salon y fiestas de 15 en Salto');
  });
});
