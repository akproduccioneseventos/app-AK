/**
 * El asistente confirmaba una reunión en el calendario o un mail preparado si el mensaje tenía
 * "si" en cualquier lado: "visita", "sistema", "decisión". Ahora tiene que ser la palabra.
 *
 * Probado rompiéndolo: con el `includes('si')` de antes, "agendame una visita" confirma y da rojo.
 */
import fs from 'fs';
import path from 'path';
import { esUnSi } from '@/lib/multiagent/confirmacion';

it('un sí de verdad confirma', () => {
  for (const m of ['sí', 'Si', 'si, dale', 'Sí, agendala', 'dale', 'ok', 'confirmo']) expect(esUnSi(m)).toBe(true);
});

it('la palabra adentro de otra no confirma', () => {
  for (const m of ['agendame una visita', 'revisá el sistema', 'tomé una decisión', 'mandale el mail a Silvia', 'así no']) {
    expect(esUnSi(m)).toBe(false);
  }
});

it('el asistente usa esa comprobación para reunión y mail', () => {
  const fuente = fs.readFileSync(path.join(process.cwd(), 'src/app/actions/multiagent.ts'), 'utf8');
  expect(fuente).not.toMatch(/includes\('si'\)/);
  expect((fuente.match(/esUnSi\(input\.message\)/g) || []).length).toBe(2);
});
