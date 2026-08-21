import fs from 'fs';
import path from 'path';

/**
 * Pruebas del botón de reseña de Google para invitados (Orden 6).
 *
 * Por qué existe esta prueba:
 * El dueño pidió que el pedido de reseña también llegue al invitado desde el hub
 * de la fiesta y desde el álbum de fotos, de forma simple y opcional.
 *
 * Las tres reglas que se verifican:
 * 1. Si no hay enlace configurado en Ajustes, el botón NO se dibuja (no lleva a ningún lado roto).
 * 2. Con enlace, abre en pestaña nueva de forma segura (target="_blank", rel="noopener noreferrer").
 * 3. El texto no pide una nota concreta ("5 estrellas"): Google penaliza el condicionamiento de reseñas.
 */

function leer(relativo: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativo), 'utf8');
}

describe('botón de reseña para el invitado (Orden 6)', () => {
  const hubSource = leer('src/app/evento/hub/[fiestaId]/page.tsx');
  const albumSource = leer('src/app/evento/album/[fiestaId]/page.tsx');

  describe('en el hub del evento (durante la fiesta)', () => {
    it('consume getEnlaceDeResenaPublico de feedback.ts', () => {
      expect(hubSource).toContain('getEnlaceDeResenaPublico');
      expect(hubSource).toContain('@/app/actions/feedback');
    });

    it('está condicionado al enlace cargado (si no hay enlace, no se dibuja)', () => {
      expect(hubSource).toContain('enlaceResena ? (');
      expect(hubSource).toContain('href={enlaceResena}');
    });

    it('abre en pestaña nueva y con seguridad', () => {
      expect(hubSource).toContain('target="_blank"');
      expect(hubSource).toContain('rel="noopener noreferrer"');
    });

    it('no pide una cantidad de estrellas fija para no infringir políticas de Google', () => {
      expect(hubSource).not.toMatch(/5\s*estrellas/i);
      expect(hubSource).not.toMatch(/cinco\s*estrellas/i);
      expect(hubSource).toContain('Contalo en Google');
    });
  });

  describe('en el álbum de fotos (después de la fiesta)', () => {
    it('consume getEnlaceDeResenaPublico de feedback.ts', () => {
      expect(albumSource).toContain('getEnlaceDeResenaPublico');
      expect(albumSource).toContain('@/app/actions/feedback');
    });

    it('está condicionado al enlace cargado (si no hay enlace, no se dibuja)', () => {
      expect(albumSource).toContain('enlaceResena ? (');
      expect(albumSource).toContain('href={enlaceResena}');
    });

    it('abre en pestaña nueva y con seguridad', () => {
      expect(albumSource).toContain('target="_blank"');
      expect(albumSource).toContain('rel="noopener noreferrer"');
    });

    it('no pide una cantidad de estrellas fija para no infringir políticas de Google', () => {
      expect(albumSource).not.toMatch(/5\s*estrellas/i);
      expect(albumSource).not.toMatch(/cinco\s*estrellas/i);
      expect(albumSource).toContain('Contanos cómo la pasaste en Google');
    });
  });
});
