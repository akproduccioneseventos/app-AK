/**
 * MATAFUEGO — El barman ve "Cancelar pedido" y la cola no ocupa pantallas vacías (orden 138).
 *
 * Qué se rompía: en un pedido NUEVO el botón de cancelar era un ícono blanco sobre tarjeta blanca,
 * sin nombre accesible; y en el celular cada columna imponía `min-h-[58vh]`, tres pantallas de
 * huecos. Lee el código de la pantalla (no se puede renderizar sin la base).
 * Probado rompiéndolo: sacando el `aria-label`/`title` del botón de Nuevos, o devolviendo
 * `text-white` al botón, o `min-h-[58vh]` sin `md:`, el caso correspondiente se pone en rojo.
 */
import fs from 'fs';
import path from 'path';

const src = fs.readFileSync(
  path.join(process.cwd(), 'src/app/evento/barra/[fiestaId]/barman/page.tsx'),
  'utf8'
);
const botonesCancelar = src
  .split('<Button')
  .slice(1)
  .map((t) => t.split('</Button>')[0])
  .filter((t) => t.includes("updateStatus(order, 'cancelado')"));

describe('Barman: cancelar visible y cola compacta en celular', () => {
  it('hay un botón de cancelar en Nuevos y otro en Preparando', () => {
    expect(botonesCancelar).toHaveLength(2);
  });
  it.each([0, 1])('el botón %i tiene nombre accesible y tooltip "Cancelar pedido"', (i) => {
    expect(botonesCancelar[i]).toContain('aria-label="Cancelar pedido"');
    expect(botonesCancelar[i]).toContain('title="Cancelar pedido"');
  });
  it.each([0, 1])('el botón %i no es blanco sobre la tarjeta blanca', (i) => {
    expect(botonesCancelar[i]).not.toMatch(/text-white|bg-white\/10/);
    expect(botonesCancelar[i]).toMatch(/text-red-\d+/);
  });
  it('la altura mínima de la columna aplica solo desde md', () => {
    expect(src).toContain('md:min-h-[58vh]');
    expect(src.replace(/md:min-h-\[58vh\]/g, '')).not.toContain('min-h-[58vh]');
  });
});
