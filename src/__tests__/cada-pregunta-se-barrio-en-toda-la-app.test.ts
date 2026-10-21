/**
 * Pedido del dueño (20/10/2026): "revisá que todas las preguntas de la lista hayan sido escaneadas en
 * toda la app, y que todo lo que encontró Codex esté corregido o tenga su pregunta".
 *
 * Hasta ese día el barrido de cada pregunta nueva estaba escrito como costumbre, no enganchado: se
 * sumaron las preguntas 69 a 73 y nadie las buscó en el resto de la app. Este control lo engancha:
 * - toda pregunta de docs/COMO-AUDITAR.md tiene que figurar en docs/barridos.json con fecha y resultado;
 * - toda pregunta que nombra docs/LO-QUE-NO-VI.md (la de cada hallazgo de Codex) tiene que existir y
 *   estar barrida.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

const RAIZ = join(__dirname, '..', '..');
const leer = (ruta: string) => readFileSync(join(RAIZ, ruta), 'utf-8');

interface Barrido {
  fecha: string;
  resultado: string;
}

function ultimaPreguntaDelMetodo(): number {
  const numeros = [...leer('docs/COMO-AUDITAR.md').matchAll(/^### (\d+)\. /gm)].map((m) => Number(m[1]));
  return Math.max(...numeros);
}

function barridos(): Record<string, Barrido> {
  return JSON.parse(leer('docs/barridos.json')).preguntas;
}

function barridosPorHallazgo(): Record<string, Barrido> {
  return JSON.parse(leer('docs/barridos.json')).hallazgos || {};
}

/**
 * 21/10/2026, pedido del dueño ("otro error de esos, mejorá"): la fecha corrida de Codex 159 se arregló y
 * NO se buscó en el resto de la app, porque su pregunta (la 70) ya figuraba barrida de antes. Barrer una
 * pregunta una vez no alcanza: CADA hallazgo nuevo se busca en toda la app, aunque su pregunta sea vieja.
 * Desde la orden 199 y la auditoría 159, cada línea de LO-QUE-NO-VI necesita su barrido propio.
 */
const DESDE_ORDEN = 199;
const DESDE_AUDITORIA = 159;
function hallazgosQueNecesitanBarrido(): string[] {
  const texto = leer('docs/LO-QUE-NO-VI.md');
  const ordenes = [...texto.matchAll(/^- Orden (\d+) → pregunta \d+/gm)]
    .map((m) => Number(m[1])).filter((n) => n >= DESDE_ORDEN).map((n) => `orden-${n}`);
  const auditorias = [...texto.matchAll(/^- Auditoria (\d+) .*→ pregunta \d+/gm)]
    .map((m) => Number(m[1])).filter((n) => n >= DESDE_AUDITORIA).map((n) => `auditoria-${n}`);
  return [...new Set([...ordenes, ...auditorias])];
}

describe('cada pregunta del método se buscó en toda la app', () => {
  it('ninguna pregunta del método queda sin su barrido anotado', () => {
    const ultima = ultimaPreguntaDelMetodo();
    expect(ultima).toBeGreaterThanOrEqual(73);
    const anotados = barridos();
    const faltan: number[] = [];
    for (let n = 1; n <= ultima; n++) {
      const b = anotados[String(n)];
      if (!b || !/^\d{4}-\d{2}-\d{2}$/.test(b.fecha) || !b.resultado?.trim()) faltan.push(n);
    }
    expect(faltan).toEqual([]);
  });

  it('cada hallazgo de Codex apunta a una pregunta que existe y que se barrió', () => {
    const ultima = ultimaPreguntaDelMetodo();
    const anotados = barridos();
    const nombradas = [...leer('docs/LO-QUE-NO-VI.md').matchAll(/^- Orden \d+ → pregunta (\d+)/gm)].map((m) =>
      Number(m[1]),
    );
    expect(nombradas.length).toBeGreaterThan(0);
    const malas = nombradas.filter((n) => n < 1 || n > ultima || !anotados[String(n)]);
    expect(malas).toEqual([]);
  });

  it('cada hallazgo nuevo se buscó en toda la app, aunque su pregunta ya estuviera barrida', () => {
    const hechos = barridosPorHallazgo();
    const necesitan = hallazgosQueNecesitanBarrido();
    expect(necesitan.length).toBeGreaterThan(0);
    const faltan = necesitan.filter((k) => {
      const b = hechos[k];
      return !b || !/^\d{4}-\d{2}-\d{2}$/.test(b.fecha) || !b.resultado?.trim();
    });
    expect(faltan).toEqual([]);
  });
});
