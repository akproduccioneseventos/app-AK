import fs from 'fs';
import path from 'path';

const PANTALLA = path.join(process.cwd(), 'src/app/login/page.tsx');
const codigo = fs.readFileSync(PANTALLA, 'utf-8');

/**
 * El ingreso no puede quedarse colgado sin decir nada.
 *
 * Pasó de verdad: el dueño no podía entrar, ni con la contraseña ni con Google.
 * El botón quedaba en "Ingresando..." y ahí se moría, sin error y sin poder
 * reintentar. Reproducido en un navegador de verdad: la llamada al servidor **no
 * tenía ningún tope de espera**, así que si el servidor estaba despertándose o la
 * base tardaba, no pasaba nada nunca.
 *
 * Dos cosas lo arreglan, y las dos tienen que quedar:
 *
 * 1. Un tope de espera, para que siempre termine en algo que se puede leer.
 * 2. Un aviso mientras espera, para que no parezca que la aplicación no anda.
 *
 * El tope es largo a propósito (25 segundos). El servidor está puesto para
 * apagarse solo cuando pasa un rato sin visitas —decisión del dueño, porque
 * dejarlo despierto se paga—, así que la primera entrada del día paga el
 * arranque. Cortar antes dejaría afuera un ingreso que iba a funcionar.
 */
describe('El ingreso nunca se cuelga', () => {
  it('la llamada al servidor tiene tope de espera', () => {
    expect(codigo).toContain('ESPERA_MAXIMA_MS');
    expect(codigo).toMatch(/Promise\.race\(/);
  });

  it('el tope es largo, para no cortar un ingreso que iba a andar', () => {
    const valor = codigo.match(/const ESPERA_MAXIMA_MS = (\d+)/);
    expect(valor).not.toBeNull();
    const ms = Number(valor![1]);
    expect(ms).toBeGreaterThanOrEqual(15000);
    expect(ms).toBeLessThanOrEqual(60000);
  });

  it('avisa en pantalla mientras espera', () => {
    expect(codigo).toMatch(/isSubmitting && \(/);
    expect(codigo).toMatch(/puede demorar unos segundos/i);
  });

  it('si se pasa del tope, explica qué hacer en vez de dejar el botón muerto', () => {
    expect(codigo).toMatch(/está tardando en contestar/i);
    expect(codigo).toMatch(/volvé a intentar/i);
  });

  it('cada camino que corta el ingreso vuelve a habilitar el botón', () => {
    // `setIsSubmitting(false)` tiene que aparecer tantas veces como salidas por
    // error haya. Si alguien agrega un `return` de error sin habilitarlo, el botón
    // queda muerto y hay que apretar F5, que es justo el defecto que se arregló.
    const entrarAlPanel = (codigo.match(/enterAuthenticatedApp\(\)/g) || []).length;
    const habilitar = (codigo.match(/setIsSubmitting\(false\)/g) || []).length;
    expect(entrarAlPanel).toBeGreaterThan(0);
    expect(habilitar).toBeGreaterThanOrEqual(3);
  });
});
