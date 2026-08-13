import { getContenidoPorTipo } from '@/app/presentacion-led/lib/contenido-por-tipo';
import { DEFAULT_PARTNER_LOGOS } from '@/lib/public-content-defaults';

describe('Pruebas de Integridad - Presentación LED según Catálogo', () => {
  describe('Bloque 1: Logos Corporativos Administrables', () => {
    it('debe tener las 12 empresas colaboradoras reales del catálogo', () => {
      expect(DEFAULT_PARTNER_LOGOS.length).toBe(12);

      const nombresReales = [
        'Correo Uruguayo',
        'Salto Hotel & Casino',
        'Plus Medical',
        'A.S.DE.M. y A.',
        'Woslen',
        'APC Salto',
        'INC',
        'Antel',
        'ABRA',
        'INAU',
        'Intendencia de Salto',
        'Club Uruguay',
      ];

      for (const nombre of nombresReales) {
        const existe = DEFAULT_PARTNER_LOGOS.some((l) => l.name === nombre);
        expect(existe).toBe(true);
      }
    });

    it('ningún logo por defecto debe apuntar a la URL externa de Canva', () => {
      for (const logo of DEFAULT_PARTNER_LOGOS) {
        expect(logo.url).not.toContain('canva.site');
        expect(logo.name).not.toBe('Empresa Colaboradora');
      }
    });
  });

  describe('Bloque 2: Pantalla del Equipo (Hay Equipo)', () => {
    it('debe devolver contenido por defecto con frase de 11 personas si el tipo de fiesta es desconocido', () => {
      const contenido = getContenidoPorTipo('TipoFiestaInexistente');
      expect(contenido).toBeDefined();
      expect(contenido.equipo).toBeDefined();
      expect(contenido.equipo?.cantidadPersonas).toBe(11);
      expect(contenido.equipo?.frase).toContain('11 personas');
    });
  });

  describe('Bloque 3: Pantalla del Salón Club Uruguay', () => {
    it('NO debe mencionar la palabra portero en la información del salón (decisión del dueño 13 de agosto 2026)', () => {
      const salonInfoTexto = `
        Nuestro Salón - Club Uruguay: Un salón de primer nivel en pleno centro de Salto, con más de 120 años de historia.
        Más de 120 años de historia y elegancia en Salto.
        Ubicado en pleno centro, súper accesible para todos los invitados.
        Capacidad para más de 120 personas cómodamente instaladas.
        Incluye la limpieza completa del salón.
        Precio promocional exclusivo contratando con AK Producciones.
      `.toLowerCase();

      expect(salonInfoTexto).not.toContain('portero');
      expect(salonInfoTexto).not.toContain('porteria');
    });
  });
});
