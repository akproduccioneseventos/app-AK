/**
 * Hallazgo de Codex (28/09/2026): "Confirmar menú" aparecía en el portal del cliente aunque la
 * sección del menú estuviera oculta, y el botón no llevaba a nada. El pendiente tiene que usar
 * la misma condición que la sección.
 */
import fs from 'fs';
import path from 'path';

const portal = fs.readFileSync(path.join(process.cwd(), 'src/app/portal-cliente/[id]/page.tsx'), 'utf8');

it('"Confirmar menú" sólo aparece si la sección del menú se muestra', () => {
  const linea = portal.split('\n').find((l) => l.includes("pendientes.push({ texto: 'Confirmar menú'"));
  expect(linea).toBeDefined();
  const indice = portal.indexOf(linea!);
  const condicion = portal.slice(portal.lastIndexOf('if (', indice), indice);
  expect(condicion).toMatch(/showCatering/);
  // Y la sección a la que lleva se dibuja con esa misma variable.
  expect(portal).toMatch(/\{\(showCatering \|\| showTimeline\) && \(\s*<AccordionItem value="catering" id="catering"/);
});

it.each([
  ["Confirmar ${pendientesRsvp.length}", 'showInvitados', 'invitados'],
  ['Pago pendiente', 'showFinancials', 'pagos'],
])('el pendiente "%s" usa %s, igual que su sección', (texto, variable, id) => {
  const indice = portal.indexOf(texto);
  expect(indice).toBeGreaterThan(0);
  expect(portal.slice(portal.lastIndexOf('if (', indice), indice)).toContain(variable);
  const seccion = portal.indexOf(`id="${id}"`);
  expect(portal.slice(seccion - 400, seccion)).toContain(`{${variable} && (`);
});
