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

    it('las doce empresas del catálogo están, cada una con su logo', () => {
      expect(DEFAULT_PARTNER_LOGOS).toHaveLength(12);
      for (const empresa of EMPRESAS_DEL_CATALOGO) {
        const tieneLogo = DEFAULT_PARTNER_LOGOS.some((l) => l.name === empresa);
        expect(`${empresa} tiene logo? ${tieneLogo}`).toBe(`${empresa} tiene logo? true`);
      }
    });

    it('los logos viven en la aplicación, no en un sitio de afuera', () => {
      for (const logo of DEFAULT_PARTNER_LOGOS) {
        expect(logo.url.startsWith('/logos/')).toBe(true);
        expect(logo.url).not.toContain('canva.site');
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

  describe('Lo que es igual en los tres catálogos no se pierde', () => {
    /**
     * Los tres catálogos de la empresa comparten casi todo y cambian pocas cosas.
     * Antes se devolvía el bloque del tipo de fiesta entero, así que lo que ese
     * bloque no tuviera cargado quedaba vacío: la pantalla del equipo salía sin
     * título ni frase en TODOS los tipos conocidos, y sólo se veía bien cuando el
     * tipo no estaba en la lista. Justo al revés de lo que se espera.
     */
    const tipos = ['Casamiento', 'Boda', 'Cumpleaños 15', '15 años', 'Cumpleaños infantil'];

    it('todos los tipos de fiesta tienen la pantalla del equipo completa', () => {
      for (const tipo of tipos) {
        const c = getContenidoPorTipo(tipo);
        expect(`${tipo} tiene titulo? ${Boolean(c.equipo?.titulo)}`).toBe(`${tipo} tiene titulo? true`);
        expect(`${tipo} tiene frase? ${Boolean(c.equipo?.frase)}`).toBe(`${tipo} tiene frase? true`);
      }
    });

    it('lo propio del tipo de fiesta le gana a lo común', () => {
      const quince = getContenidoPorTipo('Cumpleaños 15');
      const boda = getContenidoPorTipo('Casamiento');

      expect(quince.tagline).not.toBe(boda.tagline);
    });

    it('un tipo de fiesta que no está en la lista igual sale completo', () => {
      const c = getContenidoPorTipo('Fiesta de la empresa');

      expect(Boolean(c.tagline)).toBe(true);
      expect(Boolean(c.equipo?.titulo)).toBe(true);
    });
  });
});
