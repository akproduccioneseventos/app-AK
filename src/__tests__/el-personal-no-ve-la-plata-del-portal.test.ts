/** Revisión de la entrega 1419 (14/11/2026): el equipo entra al contrato del portal, pero sólo los perfiles que ven la
 *  plata del cliente. El personal y el operador no ven contrato ni pagos. */
import fs from 'fs';
import path from 'path';
import { PERMISOS, PERMISOS_POR_PERFIL } from '@/lib/auth/perfiles';

const leer = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');

describe('el portal no le muestra la plata del cliente al personal', () => {
  it.each(['src/app/actions/fiesta/portal.actions.ts', 'src/app/actions/fiesta/documentos.actions.ts'])(
    '%s sólo deja pasar sesiones del equipo con permiso de contabilidad',
    (archivo) => {
      const s = leer(archivo);
      const abiertas = s.match(/sesion\.success && sesion\.user\)/g) || [];
      const sinMirar = s.match(/!sesion\.success \|\| !sesion\.user\)/g) || [];
      expect(abiertas).toHaveLength(0);
      expect(sinMirar).toHaveLength(0);
      expect(s).toContain('puedeVerLaPlataDelCliente(sesion.user.perfil)');
    },
  );

  it('personal y operador no tienen contabilidad; dueño, secretaria y auditor sí', () => {
    for (const p of ['personal', 'operador'] as const) expect(PERMISOS_POR_PERFIL[p]).not.toContain(PERMISOS.CONTABILIDAD);
    for (const p of ['dueno', 'secretaria', 'auditor'] as const) expect(PERMISOS_POR_PERFIL[p]).toContain(PERMISOS.CONTABILIDAD);
  });
});
