import fs from 'fs';
import path from 'path';
import { obtenerGruposMenuPorPerfil } from '@/components/main-nav';
import { esPantallaReal } from '@/lib/multiagent/mapa-app.generado';

describe('El menú es corto (Orden 283)', () => {
  it('con perfil dueño el menú lateral tiene como mucho 13 entradas', () => {
    const gruposDueno = obtenerGruposMenuPorPerfil({ role: 'admin', perfil: 'dueno' });
    const totalItems = gruposDueno.reduce((acc, g) => acc + g.items.length, 0);
    // Sumando el acceso de Alertas en el pie del menú (1 adicional)
    const totalConAlertas = totalItems + 1;

    expect(totalConAlertas).toBeLessThanOrEqual(13);
    expect(gruposDueno.length).toBeLessThanOrEqual(5);
  });

  it('todas las direcciones que salieron del menú siguen existiendo y aparecen en /mas o en Ajustes', () => {
    const contenidoMas = fs.readFileSync(
      path.join(process.cwd(), 'src/app/(app)/mas/page.tsx'),
      'utf-8',
    );
    const contenidoAjustes = fs.readFileSync(
      path.join(process.cwd(), 'src/app/(app)/settings/page.tsx'),
      'utf-8',
    );

    const rutasQueSalieronDelMenu = [
      '/incidentes',
      '/playbooks',
      '/fiestas/nueva/alergias',
      '/fiestas/nueva/proveedores-portal',
      '/recursos-multi-evento',
      '/edicion-videos',
      '/empresa',
      '/simulador-ak',
      '/invoices',
      '/aprobaciones',
      '/empresa/dashboard',
      '/empresa/menus',
      '/compras',
      '/empresa/salones',
      '/empresa/servicios',
      '/proveedores',
      '/empleados',
      '/marketing',
      '/contabilidad/crm/outbox',
      '/empresa/presentacion-led/configuracion',
      '/settings',
      '/settings/tareas-automaticas',
      '/settings/sincronizaciones',
      '/settings/whatsapp',
      '/settings/contratos/clausulas',
      '/settings/account',
      '/settings/promos',
      '/settings/ai-assistant',
      '/settings/mapa-tecnologico-ak',
      '/settings/feature-flags',
    ];

    for (const href of rutasQueSalieronDelMenu) {
      // 1. Debe seguir existiendo en el sistema de rutas de la app
      const rutaSinSlash = href.startsWith('/') ? href.slice(1) : href;
      const existeArchivo =
        fs.existsSync(path.join(process.cwd(), 'src/app/(app)', rutaSinSlash, 'page.tsx')) ||
        fs.existsSync(path.join(process.cwd(), 'src/app', rutaSinSlash, 'page.tsx')) ||
        esPantallaReal(href);
      expect(existeArchivo).toBe(true);

      // 2. Debe aparecer en /mas o en Ajustes (/settings)
      const apareceEnMasOAjustes =
        contenidoMas.includes(href) || contenidoAjustes.includes(href);
      expect(apareceEnMasOAjustes).toBe(true);
    }
  });
});
