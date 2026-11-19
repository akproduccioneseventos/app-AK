import fs from 'node:fs';
import path from 'node:path';
import { CASAS, NO_SE_ENLAZAN } from '@/lib/navegacion/mapa';
import { PERMISOS } from '@/lib/auth/perfiles';

const RAIZ = process.cwd();

function existePagina(ruta: string): boolean {
  const rutaLimpia = ruta.replace(/^\//, '').split('?')[0];
  const p1 = path.join(RAIZ, 'src', 'app', '(app)', rutaLimpia, 'page.tsx');
  const p2 = path.join(RAIZ, 'src', 'app', rutaLimpia, 'page.tsx');
  return fs.existsSync(p1) || fs.existsSync(p2);
}

describe('El mapa de la app es uno solo (Orden 321)', () => {
  it('toda ruta de CASAS existe como page.tsx', () => {
    for (const casa of CASAS) {
      expect(existePagina(casa.inicio)).toBe(true);
      for (const pestana of casa.pestanas) {
        const existe = existePagina(pestana.ruta);
        if (!existe) {
          throw new Error(`La ruta ${pestana.ruta} de la casa ${casa.id} no existe como page.tsx`);
        }
        expect(existe).toBe(true);
      }
    }
  });

  it('ninguna ruta está en dos casas', () => {
    const casaPorRuta = new Map<string, string>();

    for (const casa of CASAS) {
      for (const pestana of casa.pestanas) {
        if (casaPorRuta.has(pestana.ruta)) {
          const casaPrevia = casaPorRuta.get(pestana.ruta);
          expect(casaPrevia).toBe(casa.id);
        } else {
          casaPorRuta.set(pestana.ruta, casa.id);
        }
      }
    }
  });

  it('toda ruta de NO_SE_ENLAZAN existe (page.tsx o redirect) y no está enlazada en main-nav.tsx ni settings/page.tsx', () => {
    const mainNav = fs.readFileSync(path.join(RAIZ, 'src/components/main-nav.tsx'), 'utf-8');
    const settingsPage = fs.readFileSync(path.join(RAIZ, 'src/app/(app)/settings/page.tsx'), 'utf-8');
    const nextConfig = fs.readFileSync(path.join(RAIZ, 'next.config.js'), 'utf-8');

    const archivosAControlar = [
      { nombre: 'main-nav.tsx', contenido: mainNav },
      { nombre: 'settings/page.tsx', contenido: settingsPage },
    ];

    for (const item of NO_SE_ENLAZAN) {
      // 1. Debe seguir existiendo como página real en el disco o como redirect en next.config.js
      const existe = existePagina(item.ruta) || nextConfig.includes(`'${item.ruta}'`);
      expect(existe).toBe(true);

      // 2. Ninguno de los archivos del menú/ajustes debe enlazarla
      for (const archivo of archivosAControlar) {
        const regexEnlace = new RegExp(`href\\s*[:=]\\s*['"\`]${item.ruta}['"\`]`, 'i');
        const estaEnlazada = regexEnlace.test(archivo.contenido);
        if (estaEnlazada) {
          throw new Error(`La ruta repetida ${item.ruta} sigue enlazada en ${archivo.nombre}`);
        }
        expect(estaEnlazada).toBe(false);
      }
    }
  });

  it('el permiso de cada pestaña que hoy está en el menú coincide con la referencia histórica', () => {
    const PERMISOS_REFERENCIA: Record<string, any> = {
      '/contabilidad/crm': PERMISOS.CRM,
      '/presupuestos/nuevo': PERMISOS.CRM,
      '/customers': PERMISOS.CRM,
      '/pagos-rapidos': PERMISOS.CONTABILIDAD,
      '/empresa/contabilidad': PERMISOS.CONTABILIDAD,
      '/invoices': PERMISOS.CONTABILIDAD,
      '/aprobaciones': PERMISOS.CONTABILIDAD,
      '/empresa/contabilidad/reportes': PERMISOS.GANANCIAS,
      '/empresa/menus': PERMISOS.INSUMOS,
      '/empresa/insumos': PERMISOS.INSUMOS,
      '/proveedores': PERMISOS.INSUMOS,
      '/empleados': PERMISOS.ADMINISTRACION,
      '/empresa/presencia-digital': PERMISOS.CRM,
      '/contabilidad/crm/outbox': PERMISOS.CRM,
      '/settings': PERMISOS.ADMINISTRACION,
      '/admin/usuarios': PERMISOS.ADMINISTRACION,
      '/recursos-multi-evento': PERMISOS.ORGANIZACION,
    };

    const todasLasPestanas = CASAS.flatMap((c) => c.pestanas);

    for (const [ruta, permisoEsperado] of Object.entries(PERMISOS_REFERENCIA)) {
      const pestana = todasLasPestanas.find((p) => p.ruta === ruta);
      expect(pestana).toBeDefined();
      expect(pestana?.permiso).toEqual(permisoEsperado);
    }
  });
});
