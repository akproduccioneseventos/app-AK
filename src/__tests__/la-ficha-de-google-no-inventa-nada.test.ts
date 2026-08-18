import fs from 'fs';
import path from 'path';

/**
 * La tarjeta de la ficha de Google no afirma nada que no este medido.
 *
 * Por que existe esta prueba: la entrega original traia un cartel fijo que decia
 * "Ficha Verificada en Google", un identificador de Google escrito a mano y un
 * enlace de resenas con un codigo que nadie pudo confirmar. Un cartel que dice
 * "verificada" cuando no se sabe es peor que no mostrar nada: el dueno deja de
 * revisar algo que en realidad esta sin hacer, y el boton lo lleva a una pagina
 * que puede no existir. Es el mismo error de los numeros inventados del panel de
 * redes, que ya hubo que arreglar una vez.
 */
const COMPONENTE = 'src/components/google-business-profile.tsx';

describe('la ficha de Google del panel', () => {
  const fuente = fs.readFileSync(path.join(process.cwd(), COMPONENTE), 'utf8');

  it('no afirma que la ficha este verificada', () => {
    expect(fuente).not.toContain('Ficha Verificada');
    expect(fuente).not.toContain('Perfil verificado');
  });

  it('no lleva ningun identificador de Google escrito a mano', () => {
    expect(fuente).not.toContain('Identificador verificado');
    expect(fuente).not.toMatch(/\b\d{15,}\b/);
    expect(fuente).not.toContain('g.page/r/');
  });

  it('cuando no hay puntaje medido lo dice, en vez de mostrar estrellas', () => {
    expect(fuente).toContain('Todavia no vemos tu puntaje');
  });

  it('el enlace para pedir resenas sale de Ajustes, no de una direccion fija', () => {
    expect(fuente).toContain('reviewsUrl');
  });
});
