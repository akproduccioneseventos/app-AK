import { readFileSync } from 'fs';
import { join } from 'path';

const RAIZ = process.cwd();
const leer = (ruta: string) => readFileSync(join(RAIZ, ruta), 'utf-8');
const sinComentarios = (fuente: string) =>
  fuente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

/**
 * La pantalla de entrada no le echa la culpa al dueno.
 *
 * **Paso de verdad: el dueno no pudo entrar a su propia app, ni por correo ni por
 * contrasena.** Y lo que leia en pantalla era "Contrasena incorrecta".
 *
 * El defecto no estaba en la clave. Cuando la base de datos no contestaba,
 * `getAuthDoc()` devolvia vacio, ningun hash coincidia con nada, y el codigo caia
 * hasta el ultimo renglon: contrasena incorrecta. La app afirmaba algo que nunca
 * comprobo. Peor todavia: **ese fallo se contaba como intento fallido**, asi que a
 * los cinco reintentos —los que cualquiera hace cuando cree haberse equivocado— el
 * acceso quedaba pausado quince minutos por un problema que no era suyo.
 *
 * De ahi las dos reglas que congela esta prueba:
 *
 * 1. **Si la base no esta, se dice que no esta.** Nunca "contrasena incorrecta".
 * 2. **La puerta de emergencia abre igual.** La clave de entorno se comprueba antes
 *    de tocar la base, porque es justamente la que tiene que servir cuando la base
 *    esta caida.
 *
 * Lo que esta prueba NO permite aflojar: distinguir "ese correo no existe" de "la
 * clave no coincide". Eso se sigue contestando igual en los dos casos, a proposito,
 * para que nadie pueda averiguar desde afuera quien tiene cuenta.
 */
describe('La puerta de entrada no miente', () => {
  it('cuando la base no responde, no dice que la contrasena esta mal', () => {
    const codigo = sinComentarios(leer('src/app/actions/simple-auth.ts'));

    const verificar = codigo.slice(codigo.indexOf('async function verifyPassword'));
    const cuerpo = verificar.slice(0, verificar.indexOf('\n}'));

    expect(cuerpo).toMatch(/if \(!dbAdmin\)/);
    expect(cuerpo).toMatch(/no esta respondiendo/);
  });

  it('la clave de emergencia se comprueba antes de consultar la base', () => {
    const codigo = sinComentarios(leer('src/app/actions/simple-auth.ts'));

    const verificar = codigo.slice(codigo.indexOf('async function verifyPassword'));
    const cuerpo = verificar.slice(0, verificar.indexOf('\n}'));

    const puertaDeEmergencia = cuerpo.indexOf('process.env.APP_PASSWORD');
    const consultaALaBase = cuerpo.indexOf('await getAuthDoc()');

    expect(puertaDeEmergencia).toBeGreaterThan(-1);
    expect(consultaALaBase).toBeGreaterThan(-1);
    expect(puertaDeEmergencia).toBeLessThan(consultaALaBase);
  });

  it('la consulta a la base corre contra un reloj, no se cuelga', () => {
    // Probado con un navegador de verdad: sin tope, al tocar "Ingresar" la pantalla
    // se quedaba VEINTICINCO segundos en "Ingresando..." y recien ahi contestaba
    // "Error al iniciar sesion. Intenta de nuevo." Nadie espera veinticinco segundos.
    for (const archivo of ['src/app/actions/auth.ts', 'src/app/actions/simple-auth.ts']) {
      const codigo = sinComentarios(leer(archivo));
      expect(codigo).toMatch(/conTopeDeEspera/);
      expect(codigo).toMatch(/TOPE_BASE_MS = 8000/);
    }
  });

  it('cuando la base no contesta a tiempo, lo dice con esas palabras', () => {
    for (const archivo of ['src/app/actions/auth.ts', 'src/app/actions/simple-auth.ts']) {
      const codigo = sinComentarios(leer(archivo));
      expect(codigo).toMatch(/No se pudo conectar con la base de datos/);
      // Se reconoce por una propiedad y por lo que avisa Firestore, no por `instanceof`:
      // el empaquetador puede dejar dos copias del modulo y romper la comparacion de tipo.
      expect(codigo).toMatch(/laBaseNoContesto\(err\)/);
      expect(codigo).toMatch(/UNAVAILABLE\|DEADLINE_EXCEEDED/);
    }
  });

  it('si no hay ninguna cuenta creada, lo dice en vez de culpar a la clave', () => {
    const codigo = sinComentarios(leer('src/app/actions/auth.ts'));

    const entrar = codigo.slice(codigo.indexOf('export async function loginUser'));
    const cuerpo = entrar.slice(0, entrar.indexOf('\n}'));

    expect(cuerpo).toMatch(/todavia no tiene ninguna cuenta creada/);
  });

  it('sigue sin revelar si un correo esta anotado o no', () => {
    const codigo = sinComentarios(leer('src/app/actions/auth.ts'));

    const entrar = codigo.slice(codigo.indexOf('export async function loginUser'));
    const cuerpo = entrar.slice(0, entrar.indexOf('\n}'));

    // El mismo texto para "no existe ese correo" y para "la clave no coincide".
    const repetido = cuerpo.match(/Correo o contraseña incorrectos/g) || [];
    expect(repetido.length).toBe(2);
  });
});

/**
 * Una sola direccion, para que Google no reparta lo que deberia sumar.
 *
 * La web contesta con "www" adelante y sin el. Para una persona es la misma pagina;
 * para Google pueden ser dos sitios con el mismo contenido compitiendo entre si.
 * Paso de verdad: Google tenia la portada anotada como www.akproducciones.uy
 * mientras la app se declara sin www en el mapa del sitio, en la ficha del negocio
 * y en la direccion canonica de cada pagina.
 */
describe('La web tiene una sola direccion', () => {
  it('lo que entra con www se manda a la direccion sin www, y es permanente', () => {
    const config = leer('next.config.js');

    expect(config).toMatch(/async redirects\(\)/);
    expect(config).toMatch(/value: 'www\.akproducciones\.uy'/);
    expect(config).toMatch(/destination: 'https:\/\/akproducciones\.uy\/:ruta\*'/);
    expect(config).toMatch(/permanent: true/);
  });
});
