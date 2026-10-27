/** @jest-environment node */
/**
 * 26/10/2026 (barrido de la pregunta 101). El editor de la invitación daba como "Enlace RSVP" la
 * dirección /evento/actual sin la fiesta, que redirige a la portada: el invitado que lo abría no
 * podía confirmar. Ahora lleva a /invitacion/<fiesta>. Comprobado rompiéndolo: volviendo a
 * '/evento/actual', la prueba se pone en rojo.
 */
import fs from 'fs';
import path from 'path';

it('el enlace de confirmar asistencia lleva a la invitación de esa fiesta', () => {
  const panel = fs.readFileSync(
    path.join(process.cwd(), 'src/components/invitacion/edit/ControlPanel.tsx'),
    'utf8',
  );
  expect(panel).not.toContain("getFullLink('/evento/actual'");
  expect(panel).toContain("getFullLink('/invitacion/[fiestaId]', 'confirmacion')");
});
