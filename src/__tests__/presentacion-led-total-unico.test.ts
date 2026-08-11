import fs from 'fs';
import path from 'path';

/**
 * El cliente sentado enfrente no puede ver dos totales distintos.
 *
 * La presentación LED muestra el precio en dos pantallas seguidas: el cierre y el
 * plan de pagos. El cierre calculaba el suyo por su cuenta, sumando el precio de
 * lista de cada servicio, y así se quedaba afuera toda la comida (entradas, menú
 * de adultos y menú de adolescentes) y se cobraban mal los servicios que van por
 * persona o por tramos. En una fiesta de cien personas con menú eso son decenas
 * de miles de pesos de diferencia entre una pantalla y la siguiente.
 *
 * Esta guarda no mira el número: mira que las dos pantallas tomen el total del
 * MISMO lugar. Si alguien vuelve a calcularlo aparte, salta acá y no delante de
 * un cliente.
 */

const raiz = path.join(__dirname, '..', 'app', 'presentacion-led');
const pantalla = fs.readFileSync(path.join(raiz, 'page.tsx'), 'utf8');
const cierre = fs.readFileSync(path.join(raiz, 'slides', 'cierre-slide.tsx'), 'utf8');

describe('presentación LED: un solo total para el cliente', () => {
  it('el cierre y el plan de pagos reciben el mismo total calculado', () => {
    const recibenElMismo = pantalla.match(/totalEstimado=\{totalEstimadoConMenu\}/g) ?? [];
    // Tienen que ser al menos dos: el cierre y el plan de pagos.
    expect(recibenElMismo.length).toBeGreaterThanOrEqual(2);
  });

  it('el cierre usa el total que le pasan y no arma uno propio para mostrar', () => {
    const problemas: string[] = [];
    if (!cierre.includes('totalEstimado: totalEstimadoRecibido')) {
      problemas.push('El cierre no acepta el total ya calculado por la presentación.');
    }
    if (!cierre.includes('totalEstimadoRecibido')) {
      problemas.push('Lo que se muestra en pantalla no sale del total recibido.');
    }
    expect(problemas.join('\n')).toBe('');
  });

  it('el total completo incluye la comida, no sólo los servicios', () => {
    const desde = pantalla.indexOf('const totalEstimadoConMenu');
    const bloque = pantalla.slice(desde, desde + 1400);
    const faltan = ['entradas', 'menuAdultos', 'menuAdolescentes'].filter(
      (parte) => !bloque.includes(parte),
    );
    // Todo esto es plata que el cliente va a pagar: no puede quedar afuera.
    expect(faltan.join(', ')).toBe('');
  });
});
