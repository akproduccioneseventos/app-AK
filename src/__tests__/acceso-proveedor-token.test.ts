import { accesoVencido, DIAS_DE_VIGENCIA_POR_DEFECTO } from '@/lib/auth/vigencia-acceso';
import type { AccesoPersonal } from '@/types/acceso-personal';
import fs from 'fs';
import path from 'path';

/**
 * Agujero real que motivo estas pruebas: las pantallas de fotografia y catering
 * se abrieron para que el proveedor entrara con un enlace, pero **el token no se
 * validaba**: alcanzaba con escribir `?token=hola` en la direccion para ver los
 * datos de cualquier fiesta, sin cuenta y sin saber nada.
 *
 * Ahora se verifica contra la lista de accesos: que exista, que tenga el permiso
 * de ese modulo, que sea de esa fiesta y que no este vencido.
 */

const HOY = new Date(2026, 7, 9);

function acceso(extra: Partial<AccesoPersonal> = {}): AccesoPersonal {
  return {
    id: 'tok_1',
    nombreAcceso: 'Fotografo',
    permisos: ['fotografia'],
    fechaCreacion: new Date(2026, 7, 1).toISOString(),
    ...extra,
  };
}

describe('vigencia del enlace del proveedor', () => {
  it('un acceso recien creado sirve', () => {
    expect(accesoVencido(acceso(), HOY)).toBe(false);
  });

  it('sin fecha propia vence a los 90 dias de creado', () => {
    expect(DIAS_DE_VIGENCIA_POR_DEFECTO).toBe(90);
    const viejo = acceso({ fechaCreacion: new Date(2026, 0, 1).toISOString() });
    // Del 1 de enero al 9 de agosto hay mas de 90 dias.
    expect(accesoVencido(viejo, HOY)).toBe(true);
  });

  it('respeta la fecha de vencimiento cuando la tiene', () => {
    const conFecha = acceso({ fechaVencimiento: new Date(2026, 7, 20).toISOString() });
    expect(accesoVencido(conFecha, HOY)).toBe(false);

    const yaVencido = acceso({ fechaVencimiento: new Date(2026, 7, 1).toISOString() });
    expect(accesoVencido(yaVencido, HOY)).toBe(true);
  });

  it('una fecha rota no bloquea el acceso por las dudas', () => {
    expect(accesoVencido(acceso({ fechaVencimiento: 'no-es-una-fecha' }), HOY)).toBe(false);
    expect(accesoVencido(acceso({ fechaCreacion: 'roto' }), HOY)).toBe(false);
  });
});

describe('las pantallas de proveedor validan el token', () => {
  const raiz = path.resolve(__dirname, '..');

  it.each([
    ['app/(app)/fiestas/nueva/fotografia/page.tsx', 'fotografia'],
    ['app/(app)/fiestas/nueva/catering/page.tsx', 'reposteria'],
  ])('%s verifica contra la lista de accesos', (archivo, modulo) => {
    const source = fs.readFileSync(path.join(raiz, archivo), 'utf8');

    expect(source).toContain('verifyAccesoPersonalToken');
    expect(source).toContain(`'${modulo}'`);
    // Sin autorizacion no se carga NADA de la fiesta.
    expect(source).toContain('if (!auth.authorized)');
    // Y al proveedor externo no se le muestra el presupuesto.
    expect(source).toContain('!auth.isExternalProvider');
  });

  it('la funcion de verificacion controla permiso, fiesta y vencimiento', () => {
    const source = fs.readFileSync(path.join(raiz, 'app', 'actions', 'accesos-personal.ts'), 'utf8');
    expect(source).toContain('permisos.includes(modulo)');
    expect(source).toContain('access.fiestaId === fiestaId');
    expect(source).toContain('accesoVencido(access)');
  });
});
