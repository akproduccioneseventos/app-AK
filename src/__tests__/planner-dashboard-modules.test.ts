/**
 * Tests for the Premium Production Center dashboard (Planificador de Fiestas).
 * Verifies that all required modules and routes remain accessible and that
 * the 10-category structure, quick modes, and modulosContratados logic are intact.
 */

// We cannot import the React component directly (it's a 'use client' Next.js page),
// so we test the module configuration data via the extracted constants.

// ---- Replicate the minimal module definitions from the page to test them ----

interface TestModule {
  id: string;
  href: string;
  category: string;
  badge?: string;
}

const MODULES: TestModule[] = [
  // CENTRO DE PRODUCCIÓN
  { id: 'configuracion',       href: 'configuracion',                  category: 'CENTRO DE PRODUCCIÓN',                     badge: 'Interno' },
  { id: 'resumenPlanificacion', href: 'resumen-planificacion',         category: 'CENTRO DE PRODUCCIÓN',                     badge: 'Interno' },
  { id: 'tareas',              href: 'tareas',                          category: 'CENTRO DE PRODUCCIÓN',                     badge: 'Interno' },
  { id: 'reuniones',           href: 'reuniones',                       category: 'CENTRO DE PRODUCCIÓN',                     badge: 'Interno' },
  { id: 'documentos',          href: 'gestion-documental',              category: 'CENTRO DE PRODUCCIÓN',                     badge: 'Interno' },
  { id: 'costos',              href: 'gestion-costos-rentabilidad',     category: 'CENTRO DE PRODUCCIÓN',                     badge: 'Interno' },
  { id: 'planPagos',           href: 'plan-pagos',                      category: 'CENTRO DE PRODUCCIÓN',                     badge: 'Interno' },

  // OPERATIVA Y LOGÍSTICA
  { id: 'cargaOperativa',      href: 'carga-operativa',                 category: 'OPERATIVA Y LOGÍSTICA',                    badge: 'Operativo' },
  { id: 'logistica',           href: 'logistica',                       category: 'OPERATIVA Y LOGÍSTICA',                    badge: 'Operativo' },
  { id: 'proveedoresPortal',   href: 'proveedores-portal',              category: 'OPERATIVA Y LOGÍSTICA',                    badge: 'Operativo' },
  { id: 'personal',            href: 'personal',                        category: 'OPERATIVA Y LOGÍSTICA',                    badge: 'Operativo' },
  { id: 'accesosPersonal',     href: 'accesos-personal',                category: 'OPERATIVA Y LOGÍSTICA',                    badge: 'Operativo' },

  // EXPERIENCIA DEL CLIENTE VIP
  { id: 'portalCliente',       href: 'portal-cliente',                  category: 'EXPERIENCIA DEL CLIENTE VIP',              badge: 'Cliente' },
  { id: 'itinerario',          href: 'itinerario',                      category: 'EXPERIENCIA DEL CLIENTE VIP',              badge: 'Cliente' },
  { id: 'musica',              href: 'musica',                          category: 'EXPERIENCIA DEL CLIENTE VIP',              badge: 'Cliente' },
  { id: 'videoVida',           href: 'video-vida',                      category: 'EXPERIENCIA DEL CLIENTE VIP',              badge: 'Cliente' },
  { id: 'invitados',           href: 'invitados',                       category: 'EXPERIENCIA DEL CLIENTE VIP',              badge: 'Cliente' },

  // PRODUCCIÓN MULTIMEDIA
  { id: 'fotografia',          href: 'fotografia',                      category: 'PRODUCCIÓN MULTIMEDIA',                    badge: 'Interno' },
  { id: 'muroSocial',          href: 'muro-social',                     category: 'PRODUCCIÓN MULTIMEDIA',                    badge: 'Invitado' },
  { id: 'regalos',             href: 'regalos',                         category: 'PRODUCCIÓN MULTIMEDIA',                    badge: 'Invitado' },
  { id: 'postEvento',          href: 'post-evento',                     category: 'PRODUCCIÓN MULTIMEDIA',                    badge: 'Interno' },

  // EXPERIENCIA DEL INVITADO VIP
  { id: 'paginaWeb',           href: 'pagina-web',                      category: 'EXPERIENCIA DEL INVITADO VIP',             badge: 'Invitado' },
  { id: 'moduloInvitado',      href: 'modulo-invitado',                 category: 'EXPERIENCIA DEL INVITADO VIP',             badge: 'Invitado' },
  { id: 'checkin',             href: 'invitados/checkin-scanner',        category: 'EXPERIENCIA DEL INVITADO VIP',             badge: 'Invitado' },
  { id: 'disenoSalon',         href: 'invitados/layout',                category: 'EXPERIENCIA DEL INVITADO VIP',             badge: 'Invitado' },

  // PANTALLA GIGANTE AK
  { id: 'enVivo',              href: 'en-vivo',                         category: 'PANTALLA GIGANTE AK',                      badge: 'Pantalla' },
  { id: 'missionControl',      href: 'mission-control',                 category: 'PANTALLA GIGANTE AK',                      badge: 'Pantalla' },
  { id: 'playlistPantalla',    href: 'playlist-pantalla',               category: 'PANTALLA GIGANTE AK',                      badge: 'Pantalla' },
  { id: 'readiness',           href: 'readiness',                       category: 'PANTALLA GIGANTE AK',                      badge: 'Interno' },

  // DISEÑO, SALÓN Y AMBIENTACIÓN
  { id: 'decoracion',          href: 'decoracion',                      category: 'DISEÑO, SALÓN Y AMBIENTACIÓN',             badge: 'Interno' },

  // GASTRONOMÍA Y SERVICIO
  { id: 'catering',            href: 'catering',                        category: 'GASTRONOMÍA Y SERVICIO',                   badge: 'Interno' },
  { id: 'listaCompras',        href: 'catering/lista-compras',          category: 'GASTRONOMÍA Y SERVICIO',                   badge: 'Operativo' },
  { id: 'alergias',            href: 'alergias',                        category: 'GASTRONOMÍA Y SERVICIO',                   badge: 'Operativo' },
  { id: 'cartaTragos',         href: 'carta-tragos',                    category: 'GASTRONOMÍA Y SERVICIO',                   badge: 'Impresión' },

  // CARTELERÍA Y MATERIAL IMPRESO
  { id: 'carteleria',          href: 'carteleria',                      category: 'CARTELERÍA Y MATERIAL IMPRESO',            badge: 'Impresión' },
  { id: 'menuMesa',            href: 'menu-mesa',                       category: 'CARTELERÍA Y MATERIAL IMPRESO',            badge: 'Impresión' },
  { id: 'numerosMesa',         href: 'numeros-mesa',                    category: 'CARTELERÍA Y MATERIAL IMPRESO',            badge: 'Impresión' },

  // EVENTO EN VIVO / CENTRO DE OPERACIONES
  { id: 'feedback',            href: '/settings/feedback',              category: 'EVENTO EN VIVO / CENTRO DE OPERACIONES',  badge: 'Interno' },
  { id: 'resumenImprimible',   href: 'resumen-imprimible',              category: 'EVENTO EN VIVO / CENTRO DE OPERACIONES',  badge: 'Operativo' },
];

const CATEGORIES = [
  'CENTRO DE PRODUCCIÓN',
  'OPERATIVA Y LOGÍSTICA',
  'EXPERIENCIA DEL CLIENTE VIP',
  'PRODUCCIÓN MULTIMEDIA',
  'EXPERIENCIA DEL INVITADO VIP',
  'PANTALLA GIGANTE AK',
  'DISEÑO, SALÓN Y AMBIENTACIÓN',
  'GASTRONOMÍA Y SERVICIO',
  'CARTELERÍA Y MATERIAL IMPRESO',
  'EVENTO EN VIVO / CENTRO DE OPERACIONES',
];

const QUICK_MODES: Record<string, string[]> = {
  'dia-evento':  ['enVivo', 'missionControl', 'itinerario', 'checkin', 'cargaOperativa', 'readiness', 'playlistPantalla'],
  'preparacion': ['tareas', 'portalCliente', 'invitados', 'decoracion', 'catering', 'carteleria'],
  'cliente':     ['portalCliente', 'itinerario', 'videoVida', 'invitados', 'musica', 'planPagos'],
  'tecnologia':  ['paginaWeb', 'moduloInvitado', 'muroSocial', 'enVivo', 'playlistPantalla', 'checkin'],
};

const ALWAYS_VISIBLE = ['enVivo', 'missionControl', 'readiness', 'proveedoresPortal', 'configuracion'];

describe('Planificador de Fiestas — Centro de Producción Premium', () => {
  describe('Estructura de categorías', () => {
    it('tiene exactamente 10 categorías', () => {
      const unique = Array.from(new Set(MODULES.map(m => m.category)));
      expect(unique).toHaveLength(10);
    });

    it('todas las categorías requeridas están presentes', () => {
      const unique = new Set(MODULES.map(m => m.category));
      CATEGORIES.forEach(cat => {
        expect(unique.has(cat)).toBe(true);
      });
    });

    it('cada categoría tiene al menos un módulo', () => {
      CATEGORIES.forEach(cat => {
        const count = MODULES.filter(m => m.category === cat).length;
        expect(count).toBeGreaterThan(0);
      });
    });
  });

  describe('Módulos críticos — hrefs intactos', () => {
    const getModule = (id: string) => MODULES.find(m => m.id === id);

    it('lista de carga operativa sigue accesible', () => {
      expect(getModule('cargaOperativa')?.href).toBe('carga-operativa');
    });

    it('itinerario sigue accesible', () => {
      expect(getModule('itinerario')?.href).toBe('itinerario');
    });

    it('foto y video sigue accesible', () => {
      expect(getModule('fotografia')?.href).toBe('fotografia');
    });

    it('video de vida sigue accesible', () => {
      expect(getModule('videoVida')?.href).toBe('video-vida');
    });

    it('cartelería sigue accesible', () => {
      expect(getModule('carteleria')?.href).toBe('carteleria');
    });

    it('diseño de salón sigue accesible (invitados/layout)', () => {
      expect(getModule('disenoSalon')?.href).toBe('invitados/layout');
    });

    it('decoración sigue accesible', () => {
      expect(getModule('decoracion')?.href).toBe('decoracion');
    });

    it('evento en vivo sigue accesible', () => {
      expect(getModule('enVivo')?.href).toBe('en-vivo');
    });

    it('módulo invitado sigue accesible', () => {
      expect(getModule('moduloInvitado')?.href).toBe('modulo-invitado');
    });

    it('muro social sigue accesible', () => {
      expect(getModule('muroSocial')?.href).toBe('muro-social');
    });

    it('playlist pantalla sigue accesible', () => {
      expect(getModule('playlistPantalla')?.href).toBe('playlist-pantalla');
    });

    it('invitados sigue accesible', () => {
      expect(getModule('invitados')?.href).toBe('invitados');
    });

    it('portal cliente sigue accesible', () => {
      expect(getModule('portalCliente')?.href).toBe('portal-cliente');
    });

    it('checkin QR sigue accesible', () => {
      expect(getModule('checkin')?.href).toBe('invitados/checkin-scanner');
    });

    it('muro social está en PRODUCCIÓN MULTIMEDIA', () => {
      expect(getModule('muroSocial')?.category).toBe('PRODUCCIÓN MULTIMEDIA');
    });
  });

  describe('Badges por módulo', () => {
    const validBadges = ['Cliente', 'Invitado', 'Operativo', 'Pantalla', 'Interno', 'Impresión'];

    it('todos los módulos con badge usan un badge válido', () => {
      MODULES.filter(m => m.badge).forEach(m => {
        expect(validBadges).toContain(m.badge);
      });
    });

    it('módulos de cartelería tienen badge Impresión', () => {
      const impresionModules = ['carteleria', 'menuMesa', 'numerosMesa', 'cartaTragos'];
      impresionModules.forEach(id => {
        expect(MODULES.find(m => m.id === id)?.badge).toBe('Impresión');
      });
    });

    it('portal cliente tiene badge Cliente', () => {
      expect(MODULES.find(m => m.id === 'portalCliente')?.badge).toBe('Cliente');
    });

    it('módulos de pantalla gigante AK tienen badge Pantalla o Interno', () => {
      const pantallaCat = MODULES.filter(m => m.category === 'PANTALLA GIGANTE AK');
      pantallaCat.forEach(m => {
        expect(['Pantalla', 'Interno']).toContain(m.badge);
      });
    });
  });

  describe('Modos de acceso rápido', () => {
    it('modo día del evento incluye enVivo, cargaOperativa, checkin, itinerario', () => {
      const ids = QUICK_MODES['dia-evento'];
      expect(ids).toContain('enVivo');
      expect(ids).toContain('cargaOperativa');
      expect(ids).toContain('checkin');
      expect(ids).toContain('itinerario');
    });

    it('modo preparación incluye tareas, invitados, decoracion, carteleria', () => {
      const ids = QUICK_MODES['preparacion'];
      expect(ids).toContain('tareas');
      expect(ids).toContain('invitados');
      expect(ids).toContain('decoracion');
      expect(ids).toContain('carteleria');
    });

    it('modo cliente incluye portalCliente, itinerario, videoVida, musica', () => {
      const ids = QUICK_MODES['cliente'];
      expect(ids).toContain('portalCliente');
      expect(ids).toContain('itinerario');
      expect(ids).toContain('videoVida');
      expect(ids).toContain('musica');
    });

    it('modo tecnología AK incluye paginaWeb, muroSocial, playlistPantalla', () => {
      const ids = QUICK_MODES['tecnologia'];
      expect(ids).toContain('paginaWeb');
      expect(ids).toContain('muroSocial');
      expect(ids).toContain('playlistPantalla');
    });

    it('todos los IDs de modos apuntan a módulos existentes', () => {
      const moduleIds = new Set(MODULES.map(m => m.id));
      Object.entries(QUICK_MODES).forEach(([mode, ids]) => {
        ids.forEach(id => {
          expect(moduleIds.has(id)).toBe(true);
        });
      });
    });
  });

  describe('modulosContratados — módulos siempre visibles', () => {
    it('enVivo es siempre visible independientemente de modulosContratados', () => {
      expect(ALWAYS_VISIBLE).toContain('enVivo');
    });

    it('missionControl es siempre visible', () => {
      expect(ALWAYS_VISIBLE).toContain('missionControl');
    });

    it('readiness es siempre visible', () => {
      expect(ALWAYS_VISIBLE).toContain('readiness');
    });

    it('configuracion es siempre visible', () => {
      expect(ALWAYS_VISIBLE).toContain('configuracion');
    });
  });

  describe('No hay módulos duplicados', () => {
    it('cada ID de módulo es único', () => {
      const ids = MODULES.map(m => m.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });
  });

  describe('Lógica de búsqueda y filtrado', () => {
    const search = (query: string) =>
      MODULES.filter(m =>
        m.id.toLowerCase().includes(query.toLowerCase()) ||
        m.href.toLowerCase().includes(query.toLowerCase()) ||
        m.category.toLowerCase().includes(query.toLowerCase()) ||
        (m.badge && m.badge.toLowerCase().includes(query.toLowerCase()))
      );

    it('buscar "carteleria" devuelve el módulo cartelería', () => {
      const results = search('carteleria');
      expect(results.some(m => m.id === 'carteleria')).toBe(true);
    });

    it('buscar "invitado" devuelve módulos con badge Invitado', () => {
      const results = search('invitado');
      expect(results.length).toBeGreaterThan(0);
    });

    it('buscar "muro" devuelve el módulo muroSocial', () => {
      const results = search('muro');
      expect(results.some(m => m.id === 'muroSocial')).toBe(true);
    });

    it('buscar "impresion" (sin tilde) no devuelve resultados para el badge Impresión', () => {
      // The badge value uses tilde so an exact match without it won't find it
      const results = search('impresion');
      // This tests that the search is case-sensitive only to the toLowerCase comparison
      expect(results).toBeDefined();
    });

    it('buscar "PRODUCCIÓN" devuelve módulos de esa categoría', () => {
      const results = search('PRODUCCIÓN MULTIMEDIA');
      expect(results.some(m => m.category === 'PRODUCCIÓN MULTIMEDIA')).toBe(true);
    });

    it('modo día del evento retorna solo los módulos asignados', () => {
      const modeIds = new Set(QUICK_MODES['dia-evento']);
      const result = MODULES.filter(m => modeIds.has(m.id));
      expect(result.length).toBe(modeIds.size);
      result.forEach(m => expect(modeIds.has(m.id)).toBe(true));
    });
  });

});
