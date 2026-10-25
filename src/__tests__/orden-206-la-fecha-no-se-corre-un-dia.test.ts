import { formatearFechaEvento } from '@/lib/fechas/formato-fecha-evento';
import { parseEventDate, formatEventDate } from '@/lib/public-experience/event-date';
import { armarAlbumInteligente } from '@/lib/album/armar-album';
import fs from 'fs';
import path from 'path';

describe('Orden 206 — La fecha de la fiesta no se corre un día', () => {
  const fiestaMock: any = {
    id: 'f-206',
    configuracion: {
      nombreEvento: 'Quince de Valentina',
      fechaEvento: '2027-08-08',
    },
  };

  it('un día de agosto no retrocede al día anterior en hora de Uruguay', () => {
    const texto = formatearFechaEvento('2027-08-08');
    expect(texto).toContain('8 de agosto de 2027');
    expect(texto).not.toContain('7 de agosto de 2027');
  });

  it('un día con horario humano preserva el día y el sufijo', () => {
    const texto = formatearFechaEvento('2027-08-08 de 21 a 04 hs');
    expect(texto).toContain('8 de agosto de 2027 de 21 a 04 hs');
  });

  it('el álbum digital muestra el 8 de agosto de 2027 para la fiesta', () => {
    const album = armarAlbumInteligente({
      fiesta: fiestaMock,
      posts: [],
    });
    expect(album.portada.fecha).toContain('8 de agosto de 2027');
    expect(album.portada.fecha).not.toContain('7 de agosto');
  });

  it('parseEventDate devuelve el día civil exacto sin desfase UTC', () => {
    const parsed = parseEventDate('2027-08-08');
    expect(parsed).not.toBeNull();
    expect(parsed?.getFullYear()).toBe(2027);
    expect(parsed?.getMonth()).toBe(7); // Agosto (0-indexed)
    expect(parsed?.getDate()).toBe(8);
  });

  it('formatEventDate formatea el día correctamente', () => {
    const texto = formatEventDate('2027-08-08');
    expect(texto).toContain('8 de agosto');
    expect(texto).toContain('2027');
  });

  it('control estático: ningún archivo en src/ usa new Date(fechaEvento).toLocaleDateString directo', () => {
    const filesToCheck = [
      'src/lib/album/armar-album.ts',
      'src/app/evento/album/[fiestaId]/page.tsx',
      'src/app/control-tower/preparacion/page.tsx',
      'src/app/(app)/empresa/dashboard/page.tsx',
      'src/app/(app)/empresa/red-social-eventos/page.tsx',
      'src/components/decoracion/DecoMuestrario.tsx',
    ];

    for (const rel of filesToCheck) {
      const full = path.resolve(rel);
      if (fs.existsSync(full)) {
        const content = fs.readFileSync(full, 'utf8');
        expect(content).not.toMatch(/new Date\([^)]*fechaEvento[^)]*\)\.toLocaleDateString/);
      }
    }
  });
});
