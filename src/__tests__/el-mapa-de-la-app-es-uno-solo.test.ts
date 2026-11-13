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

describe('El mapa de la app es uno solo (Orden 284)', () => {
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

  it('toda ruta de NO_SE_ENLAZAN existe y no está enlazada en main-nav.tsx, empresa/page.tsx ni settings/page.tsx', () => {
    const mainNav = fs.readFileSync(path.join(RAIZ, 'src/components/main-nav.tsx'), 'utf-8');
    const empresaPage = fs.readFileSync(path.join(RAIZ, 'src/app/(app)/empresa/page.tsx'), 'utf-8');
    const settingsPage = fs.readFileSync(path.join(RAIZ, 'src/app/(app)/settings/page.tsx'), 'utf-8');

    const archivosAControlar = [
      { nombre: 'main-nav.tsx', contenido: mainNav },
      { nombre: 'empresa/page.tsx', contenido: empresaPage },
      { nombre: 'settings/page.tsx', contenido: settingsPage },
    ];

    for (const item of NO_SE_ENLAZAN) {
      // 1. Debe existir como página real en el disco
      expect(existePagina(item.ruta)).toBe(true);

      // 2. Ninguno de los 3 archivos debe enlazarla
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
    // Mapa de permisos históricos de rutas extraído de main-nav.tsx
    const PERMISOS_REFERENCIA: Record<string, any> = {
      '/contabilidad/crm': PERMISOS.CRM,
      '/presupuestos/nuevo': PERMISOS.CRM,
      '/customers': PERMISOS.CRM,
      '/pagos-rapidos': PERMISOS.CONTABILIDAD,
      '/empresa/contabilidad': PERMISOS.CONTABILIDAD,
      '/invoices': PERMISOS.CONTABILIDAD,
      '/aprobaciones': PERMISOS.CONTABILIDAD,
      '/empresa/dashboard': PERMISOS.GANANCIAS,
      '/empresa/menus': PERMISOS.INSUMOS,
      '/compras': PERMISOS.INSUMOS,
      '/proveedores': PERMISOS.INSUMOS,
      '/empleados': PERMISOS.ADMINISTRACION,
      '/marketing': PERMISOS.CRM,
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
