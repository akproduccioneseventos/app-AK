import { mostrarAsistenteEn } from '@/lib/public-experience/donde-va-el-asistente';

/**
 * El globito de ventas tiene que aparecer donde se vende y en ningún otro lado.
 * Antes se filtraba con una lista de pantallas prohibidas y se colaba encima de la
 * invitación de un casamiento, del portal de un cliente que ya contrató y de la
 * presentación proyectada en el salón.
 */

const DONDE_SI = [
  '/',
  '/bodas',
  '/quinceaneras',
  '/cumpleanos',
  '/catalogo',
  '/club-uruguay',
  '/experiencia-ak',
  '/simulador-de-presupuesto',
  '/public/blog',
  '/public/blog/como-elegir-salon',
  '/landing/bodas',
];

const DONDE_NO = [
  '/invitacion/fiesta-123',
  '/invitacion/fiesta-123/rsvp',
  '/portal-cliente',
  '/portal/c/clave-secreta',
  '/evento/espejo-magico/fiesta-123',
  '/evento/fiesta-123/video-recuerdo',
  '/presentacion-led',
  '/presentacion-led/portafolio',
  '/galeria-led',
  '/contabilidad/crm',
  '/empresa/galeria',
  '/empleados/nuevo',
  '/auditoria',
  '/repaso-diario',
  '/fiestas/nueva/pagina-web',
  '/presupuestos/p-1/ver',
  '/settings/contenido-publico',
  '/login',
  '/signup',
  '/feedback/fiesta-123',
  '/acceso-personal/token-1',
];

describe('dónde aparece el asistente de ventas', () => {
  it('aparece en las páginas de venta', () => {
    for (const ruta of DONDE_SI) {
      expect(`${ruta} => ${mostrarAsistenteEn(ruta)}`).toBe(`${ruta} => true`);
    }
  });

  it('NO aparece encima de una invitación, del portal del cliente ni de la fiesta', () => {
    for (const ruta of DONDE_NO) {
      expect(`${ruta} => ${mostrarAsistenteEn(ruta)}`).toBe(`${ruta} => false`);
    }
  });

  it('una pantalla nueva que nadie agregó a la lista queda sin asistente', () => {
    expect(mostrarAsistenteEn('/pantalla-inventada-manana')).toBe(false);
  });

  it('no se rompe sin dirección', () => {
    expect(mostrarAsistenteEn(null)).toBe(false);
    expect(mostrarAsistenteEn(undefined)).toBe(false);
    expect(mostrarAsistenteEn('')).toBe(false);
  });

  it('la barra final no cambia el resultado', () => {
    expect(mostrarAsistenteEn('/bodas/')).toBe(true);
    expect(mostrarAsistenteEn('/portal-cliente/')).toBe(false);
  });
});
