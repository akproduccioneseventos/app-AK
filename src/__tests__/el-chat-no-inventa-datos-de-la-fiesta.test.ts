import fs from 'fs';
import path from 'path';

/**
 * El chat de la fiesta nunca completa un dato que no esta cargado.
 *
 * Por que existe esta prueba: cuando no habia inteligencia artificial disponible,
 * el chat contestaba con valores puestos a mano. Si la fiesta no tenia hora
 * cargada, decia **"empezamos puntual a las 21:00 hs"**. Si no tenia salon, "el
 * Salon Principal". Si no tenia codigo de vestimenta, "Elegante Sport".
 *
 * Se lo decia al invitado, la noche de la fiesta, con total seguridad. Un invitado
 * que llega a las 21:00 a una fiesta que empieza a las 22:00 se come una hora en
 * la puerta.
 */
const ARCHIVO = 'src/app/actions/salon-ia.actions.ts';

describe('el chat de la fiesta', () => {
  const fuente = fs.readFileSync(path.join(process.cwd(), ARCHIVO), 'utf8');

  it('no inventa la hora, el salon ni la vestimenta', () => {
    expect(fuente).not.toContain("|| '21:00 hs'");
    expect(fuente).not.toContain("|| 'el Salón Principal'");
    expect(fuente).not.toContain("|| 'Salón Principal'");
    expect(fuente).not.toContain("|| 'Elegante Sport'");
  });

  it('tampoco se los pasa inventados a la inteligencia artificial', () => {
    // El mismo error estaba en lo que se le cuenta al modelo: le decia que la
    // fiesta empieza a las 21:00 y el modelo lo repetia con total seguridad.
    expect(fuente).toContain('NO CARGADO');
    expect(fuente).toContain('no lo inventes ni lo estimes');
  });

  it('cuando el dato no esta, manda a preguntarle al anfitrion', () => {
    expect(fuente).toContain('todavía no está cargada acá');
    expect(fuente).toContain('preguntale al anfitrión');
  });
});
