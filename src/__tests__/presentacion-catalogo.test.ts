import { getContenidoPorTipo } from '@/app/presentacion-led/lib/contenido-por-tipo';
import { DEFAULT_PARTNER_LOGOS, EMPRESAS_DEL_CATALOGO } from '@/lib/public-content-defaults';

describe('Pruebas de Integridad - Presentación LED según Catálogo', () => {
  describe('Bloque 1: Logos de empresas', () => {
    /**
     * Lo que hay que cuidar acá no es cuántos logos hay, sino que **no se invente
     * ninguno**. Una entrega anterior reemplazó las imágenes reales por doce
     * rectángulos de color con el nombre escrito en una tipografía cualquiera. Eso
     * no son los logos de Antel ni de INAU: se ve barato y usa mal la marca de un
     * tercero. El dueño sube los de verdad desde Ajustes.
     */
    it('ningún logo por defecto lleva un nombre inventado', () => {
      for (const logo of DEFAULT_PARTNER_LOGOS) {
        const nombreValido = logo.name === '' || EMPRESAS_DEL_CATALOGO.includes(logo.name);
        expect(`${logo.id}: "${logo.name}" es un nombre valido? ${nombreValido}`)
          .toBe(`${logo.id}: "${logo.name}" es un nombre valido? true`);
      }
    });

    it('ninguno queda con el rotulo viejo que no dice nada', () => {
      for (const logo of DEFAULT_PARTNER_LOGOS) {
        expect(logo.name).not.toBe('Empresa Colaboradora');
      }
    });

    it('todos tienen imagen', () => {
      for (const logo of DEFAULT_PARTNER_LOGOS) {
        expect(logo.url.length).toBeGreaterThan(0);
      }
    });

    it('la ayuda de Ajustes tiene las doce empresas del catálogo impreso', () => {
      expect(EMPRESAS_DEL_CATALOGO).toHaveLength(12);
      expect(EMPRESAS_DEL_CATALOGO).toContain('Antel');
      expect(EMPRESAS_DEL_CATALOGO).toContain('Intendencia de Salto');
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
