/**
 * MATAFUEGO — Todo lo que el secretario puede DECIDIR hacer, alguien lo tiene que HACER.
 *
 * Encontrado el 20 de septiembre de 2026 mirando el asistente: el texto de instrucciones
 * le ofrecia a la inteligencia artificial siete acciones —entre ellas anotar un prospecto,
 * armar un presupuesto y preparar un mensaje de WhatsApp— y el servidor **solo ejecutaba
 * dos**. Si le contabas de un prospecto, contestaba como si lo hubiera anotado y el
 * prospecto no existia en ningun lado. Es la forma exacta de "dijo que si y no paso nada".
 *
 * Este control compara las tres listas: lo que el tipo declara, lo que el texto de
 * instrucciones le ofrece, y lo que el servidor sabe ejecutar. Si alguna se adelanta a las
 * otras, se pone en rojo.
 *
 * Se probo rompiendolo a proposito: sacando la rama de `create_lead` del servidor, se pone
 * en rojo nombrando esa accion.
 */
import fs from 'fs';
import path from 'path';

const leer = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf-8');

const TIPOS = leer('src/types/multiagent.ts');
const INSTRUCCIONES = leer('src/ai/flows/multiagent-flow.ts');
const SERVIDOR = leer('src/app/actions/multiagent.ts');
const PANTALLA = leer('src/components/multiagent/multiagent-widget.tsx');

/** Las acciones declaradas en el tipo, que es el contrato. */
function accionesDeclaradas(): string[] {
  const linea = TIPOS.split('\n').find((l) => l.includes("'none'") && l.includes('create_task'));
  if (!linea) throw new Error('No encontre la lista de acciones en src/types/multiagent.ts');
  return (linea.match(/'([a-z_]+)'/g) || [])
    .map((t) => t.replace(/'/g, ''))
    .filter((t) => t !== 'none');
}

/**
 * Acciones que alguien ejecuta de verdad: el servidor las hace, o la pantalla las
 * atiende (navegar es de la pantalla), o son de la memoria interna del agente.
 */
const LAS_ATIENDE_LA_PANTALLA = ['navigate'];
const NO_SALEN_DEL_AGENTE = ['save_learning'];

describe('El secretario hace lo que dice que hace', () => {
  const declaradas = accionesDeclaradas();

  it('hay acciones declaradas (si no, este control no mira nada)', () => {
    expect(declaradas.length).toBeGreaterThan(3);
  });

  it('cada accion que el secretario puede decidir, alguien la ejecuta', () => {
    const sinDuenio = declaradas.filter((accion) => {
      if (NO_SALEN_DEL_AGENTE.includes(accion)) return false;
      const laHaceElServidor = SERVIDOR.includes(`'${accion}'`);
      const laHaceLaPantalla =
        LAS_ATIENDE_LA_PANTALLA.includes(accion) && PANTALLA.includes(`'${accion}'`);
      return !laHaceElServidor && !laHaceLaPantalla;
    });

    if (sinDuenio.length > 0) {
      throw new Error(
        'El secretario puede decidir estas acciones y NADIE las ejecuta: ' +
          sinDuenio.join(', ') +
          '. Contesta como si las hubiera hecho y no pasa nada. O se enganchan en ' +
          'src/app/actions/multiagent.ts, o se sacan del tipo y del texto de instrucciones.',
      );
    }
    expect(sinDuenio).toEqual([]);
  });

  it('el texto de instrucciones no le ofrece acciones que el tipo no conoce', () => {
    const ofrecidas = Array.from(INSTRUCCIONES.matchAll(/"type":\s*"([a-z_]+)"/g))
      .map((m) => m[1])
      .filter((t) => t !== 'none');
    const inventadas = Array.from(new Set(ofrecidas)).filter((t) => !declaradas.includes(t));
    expect(inventadas).toEqual([]);
  });

  it('anotar un prospecto llega al listado de prospectos de verdad', () => {
    expect(SERVIDOR).toContain('addCrmLead');
  });
});
