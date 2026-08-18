/**
 * El enlace de colaborador sólo puede ofrecer lo que de verdad se abre con él.
 *
 * Qué pasaba: se ofrecían quince módulos y sólo seis funcionaban. Los otros
 * nueve —prospectos, presupuestos, clientes, facturación, personal, proveedores,
 * empresa, contabilidad y calendario— apuntaban a pantallas internas y se
 * enlazaban sin la llave, y abrir el enlace no da ninguna sesión: el colaborador
 * tocaba el botón y caía en la pantalla de ingreso.
 *
 * Se sacaron en vez de abrirlos, porque abrirlos significaba dejar entrar a la
 * contabilidad y a la base de clientes con un enlace que se reenvía por WhatsApp
 * sin pensar.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { MODULOS_QUE_ANDAN_POR_ENLACE, andaPorEnlace } from '@/lib/auth/permisos-por-enlace';

const RAIZ = process.cwd();

const NUEVE_QUE_NO_ANDAN = [
  'crm',
  'presupuestos',
  'clientes',
  'facturas',
  'empleados',
  'proveedores',
  'empresa',
  'contabilidad',
  'calendario',
] as const;

describe('Permisos que se pueden dar por enlace', () => {
  it('son los seis del evento', () => {
    expect([...MODULOS_QUE_ANDAN_POR_ENLACE].sort()).toEqual(
      ['carga-operativa', 'decoracion', 'fotografia', 'itinerario', 'musica', 'reposteria'],
    );
  });

  it.each(NUEVE_QUE_NO_ANDAN)('no se puede dar "%s" por enlace', (permiso) => {
    expect(andaPorEnlace(permiso as any)).toBe(false);
  });

  it('la pantalla que crea accesos no ofrece ninguno de los nueve', () => {
    const pantalla = readFileSync(
      join(RAIZ, 'src/app/(app)/settings/accesos-personal/page.tsx'),
      'utf-8',
    );

    // Se mira la lista que arma las opciones, no el archivo entero: los nombres
    // pueden aparecer en un comentario que explica por que se sacaron.
    const lista = pantalla.slice(
      pantalla.indexOf('const MODULOS_PERMITIDOS'),
      pantalla.indexOf('];', pantalla.indexOf('const MODULOS_PERMITIDOS')),
    );

    const ofrecidos = NUEVE_QUE_NO_ANDAN.filter((permiso) => lista.includes(`'${permiso}'`));
    expect(ofrecidos).toEqual([]);
  });

  it('el portal filtra por su cuenta, para los accesos viejos', () => {
    // Un acceso creado antes puede tener los nueve guardados: si el portal no
    // filtrara, seguiria mostrando botones que llevan al login.
    const portal = readFileSync(
      join(RAIZ, 'src/app/acceso-personal/[tokenId]/page.tsx'),
      'utf-8',
    );

    expect(portal).toContain('andaPorEnlace');
    expect(portal).toContain('acceso.permisos.filter(andaPorEnlace)');
  });
});
