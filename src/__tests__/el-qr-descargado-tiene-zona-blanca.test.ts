import fs from 'node:fs';
import path from 'node:path';

/**
 * Orden 147: todo QR que se baja como PNG lleva zona blanca (`qrConZonaBlanca`). Bajado pelado,
 * el lector de la app no lo lee en algunos códigos. Si alguien vuelve a `canvas.toDataURL` pelado
 * en una de estas descargas, esto se pone en rojo.
 */
const ARCHIVOS = [
  'src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx',
  'src/app/invitacion/[fiestaId]/rsvp/page.tsx',
  'src/app/(app)/fiestas/nueva/invitados/page.tsx',
  'src/components/invitacion/edit/ControlPanel.tsx',
  'src/components/invitacion/edit/SeccionRedesSociales.tsx',
  'src/app/(app)/fiestas/nueva/pagina-web/page.tsx',
];

describe('el QR descargado tiene zona blanca', () => {
  for (const archivo of ARCHIVOS) {
    it(`${archivo} baja el QR con qrConZonaBlanca`, () => {
      const texto = fs.readFileSync(path.join(process.cwd(), archivo), 'utf8');
      expect(texto).toMatch(/import \{ qrConZonaBlanca \} from '@\/lib\/qr\/qr-con-zona-blanca'/);
      expect(texto).toMatch(/qrConZonaBlanca\(canvas\)/);
      expect(texto).not.toMatch(/canvas\.toDataURL\(\s*['"]image\/png['"]\s*\)/);
    });
  }
});
