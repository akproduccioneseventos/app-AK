/** @jest-environment node */
/**
 * Codex en la 1364 (26/10/2026). El asistente mandaba a TODOS los teléfonos del equipo el texto del
 * aviso, con nombre del cliente y saldo: lo recibía también el personal sin permiso de plata. Ahora
 * el aviso general es genérico. Comprobado rompiéndolo: volviendo a mandar `quePasa`, se pone en rojo.
 */
import fs from 'fs';
import path from 'path';

const raiz = path.join(process.cwd(), 'src');
function archivos(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === '__tests__' ? [] : archivos(p);
    return /\.tsx?$/.test(e.name) ? [p] : [];
  });
}

it('ningún aviso a todos los teléfonos lleva el detalle de un aviso, un saldo o un importe', () => {
  const malos: string[] = [];
  for (const f of archivos(raiz)) {
    const texto = fs.readFileSync(f, 'utf8');
    for (const m of texto.matchAll(/sendPushNotificationToAll\(\{([\s\S]*?)\}\)/g)) {
      if (/quePasa|quePropone|saldo|monto|importe|\$\{.*total/i.test(m[1])) malos.push(path.relative(raiz, f));
    }
  }
  expect(malos).toEqual([]);
});
