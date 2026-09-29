/**
 * Orden 96: Ningún botón lleva a algo que está oculto.
 *
 * Cada botón o enlace que lleve a una sección o pantalla debe usar la misma
 * condición o variable que decide si el destino existe o se muestra.
 */
import fs from 'fs';
import path from 'path';

describe('Orden 96: Ningún botón lleva a algo oculto', () => {
  const read = (relPath: string) =>
    fs.readFileSync(path.join(process.cwd(), relPath), 'utf8');

  describe('Portal del cliente (src/app/portal-cliente/[id]/page.tsx)', () => {
    const portal = read('src/app/portal-cliente/[id]/page.tsx');

    it('"Cargar lista de canciones" sólo aparece si la música está visible y contratada', () => {
      const idx = portal.indexOf("'Cargar lista de canciones'");
      expect(idx).toBeGreaterThan(0);
      const bloque = portal.slice(portal.lastIndexOf('if (', idx), idx);
      expect(bloque).toContain('showMusica');
      expect(bloque).toMatch(/fiesta\.modulosContratados\?\.discoteca/);
    });

    it('"Subir fotos para video de vida" sólo aparece si video de vida está visible y contratado', () => {
      const idx = portal.indexOf("'Subir fotos para video de vida'");
      expect(idx).toBeGreaterThan(0);
      const bloque = portal.slice(portal.lastIndexOf('if (', idx), idx);
      expect(bloque).toContain('showVideoVida');
      expect(bloque).toMatch(/fiesta\.modulosContratados\?\.videoVida/);
    });

    it('las tarjetas de navegación (Feature Navigation Cards) respetan visibilidad y contratos', () => {
      expect(portal).toMatch(/showMensajes && \{\s*label:\s*'Mensajes'/);
      expect(portal).toMatch(/showCatering && fiesta\.modulosContratados\?\.catering && \{\s*label:\s*'Menú'/);
      expect(portal).toMatch(/showMusica && \(fiesta\.modulosContratados\?\.discoteca \?\? true\) && \{\s*label:\s*'Música'/);
      expect(portal).toMatch(/showMuroSocial && \{\s*label:\s*'Muro Social'/);
      expect(portal).toMatch(/showFotosVideo && \{\s*label:\s*'Fotos & Video'/);
      expect(portal).toMatch(/showInvitados && \{\s*label:\s*'Invitados'/);
      expect(portal).toMatch(/showFaq && \{\s*label:\s*'Preguntas Frecuentes'/);
    });
  });

  describe('Portal del invitado (src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx)', () => {
    const invitado = read('src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx');

    it('el enlace "#mi-pase" y la sección usan la misma condición showMiPase', () => {
      // Definición de la variable
      expect(invitado).toMatch(/const showMiPase = Boolean\(guest\?\.nombre\);/);
      // Sección condicionada
      const idxSeccion = invitado.indexOf('id="mi-pase"');
      expect(idxSeccion).toBeGreaterThan(0);
      expect(invitado.slice(idxSeccion - 100, idxSeccion)).toContain('{showMiPase && (');
      // Botón condicionado con la misma variable
      const idxBoton = invitado.indexOf('href="#mi-pase"');
      expect(idxBoton).toBeGreaterThan(0);
      expect(invitado.slice(idxBoton - 100, idxBoton)).toContain('{showMiPase ? (');
    });

    it('el enlace "#datos-evento" y la sección usan la misma condición showDatosEvento', () => {
      // Definición de la variable
      expect(invitado).toMatch(/const showDatosEvento = Boolean\(config\?\.nombreLugar \|\| fecha \|\| dressCode\?\.tipo\);/);
      // Sección condicionada
      const idxSeccion = invitado.indexOf('id="datos-evento"');
      expect(idxSeccion).toBeGreaterThan(0);
      expect(invitado.slice(idxSeccion - 100, idxSeccion)).toContain('{showDatosEvento && (');
      // Botón condicionado con la misma variable
      const idxBoton = invitado.indexOf('href="#datos-evento"');
      expect(idxBoton).toBeGreaterThan(0);
      expect(invitado.slice(idxBoton - 100, idxBoton)).toContain('{showDatosEvento');
    });
  });

  describe('Hub de la fiesta (src/app/evento/hub/[fiestaId]/page.tsx)', () => {
    const hub = read('src/app/evento/hub/[fiestaId]/page.tsx');

    it('el botón "Inicio" apunta a "#hub-inicio" y el inicio de la pantalla tiene ese id', () => {
      expect(hub).toContain('id="hub-inicio"');
      expect(hub).toMatch(/<Link\s+href="#hub-inicio"[^>]*>[\s\S]*?Inicio/);
    });
  });

  describe('HeroSection público y paquetes (src/components/public/HeroSection.tsx)', () => {
    const heroPublic = read('src/components/public/HeroSection.tsx');
    const eventTypePage = read('src/app/public/[eventType]/page.tsx');

    it('el botón "#servicios" (Ver paquetes) se condiciona con showServices', () => {
      expect(heroPublic).toContain('showServices?: boolean;');
      const idxBoton = heroPublic.indexOf('href="#servicios"');
      expect(idxBoton).toBeGreaterThan(0);
      expect(heroPublic.slice(idxBoton - 100, idxBoton)).toContain('{showServices !== false && (');
    });

    it('la página pública pasa showServices y condiciona ServiceMenu correspondientemente', () => {
      expect(eventTypePage).toMatch(/showServices=\{Boolean\(catalog\.services && catalog\.services\.length > 0\)\}/);
      expect(eventTypePage).toMatch(/\{Boolean\(catalog\.services && catalog\.services\.length > 0\) && \(\s*<ServiceMenu/);
    });
  });

  describe('EventLandingPage (src/components/landing/EventLandingPage.tsx)', () => {
    const eventLanding = read('src/components/landing/EventLandingPage.tsx');

    it('la sección de servicios tiene el id "landing-services" correspondiente a la navegación', () => {
      expect(eventLanding).toMatch(/<motion\.section\s+id="landing-services"/);
    });
  });

  describe('Footer público (src/components/public-footer.tsx)', () => {
    const footer = read('src/components/public-footer.tsx');

    it('los enlaces a Club Uruguay y Blog usan rutas directas y no anclas flotantes sin destino', () => {
      expect(footer).toContain('href="/club-uruguay"');
      expect(footer).toContain('href="/public/blog"');
      expect(footer).not.toContain('href="#landing-salon"');
      expect(footer).not.toContain('href="#landing-blog-video"');
    });
  });
});
