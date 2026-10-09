import { readFileSync } from 'fs';
import { join } from 'path';
import { buildWhatsAppLink, toWhatsAppDigits } from '@/lib/commercial/contact';

describe('130 WA80: enlace de WhatsApp de clientes', () => {
  it('celular uruguayo local lleva 598', () => {
    expect(buildWhatsAppLink('099000080')).toBe('https://wa.me/59899000080');
    expect(buildWhatsAppLink('099 000 080')).toBe('https://wa.me/59899000080');
  });
  it('uno que ya trae 598 no se duplica', () => {
    expect(buildWhatsAppLink('59899000080')).toBe('https://wa.me/59899000080');
    expect(buildWhatsAppLink('+598 99 000 080')).toBe('https://wa.me/59899000080');
  });
  it('un numero extranjero no se toca', () => {
    expect(toWhatsAppDigits('+54 9 11 1234 5678')).toBe('5491112345678');
    expect(buildWhatsAppLink('+54 9 11 1234 5678')).toBe('https://wa.me/5491112345678');
  });
  it('agrega el texto codificado', () => {
    expect(buildWhatsAppLink('099000080', 'Hola Ana!')).toBe('https://wa.me/59899000080?text=Hola%20Ana!');
  });
  it.each(['src/app/(app)/customers/page.tsx', 'src/app/(app)/customers/[id]/page.tsx'])(
    '%s usa el helper y no arma wa.me a mano con el telefono',
    (ruta) => {
      const src = readFileSync(join(process.cwd(), ruta), 'utf8');
      expect(src).toContain('buildWhatsAppLink');
      expect(src).not.toMatch(/wa\.me\/\$\{[^}]*phone[^}]*\}/);
    },
  );
});

describe('barrido WA80: los otros enlaces de WhatsApp con teléfonos locales', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const leer = (f: string) => fs.readFileSync(path.join(process.cwd(), f), 'utf8');

  it.each([
    'src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx',
    'src/app/invitacion/[fiestaId]/rsvp/page.tsx',
    'src/app/invitacion/[fiestaId]/invitacion-publica-client.tsx',
  ])('%s arma el enlace con toWhatsAppDigits y no con los dígitos sueltos', (archivo) => {
    const texto = leer(archivo);
    expect(texto).toMatch(/toWhatsAppDigits\(/);
    expect(texto).not.toMatch(/wa\.me\/\$\{[^}]*replace\(\/\\D\/g, ''\)/);
  });
});
