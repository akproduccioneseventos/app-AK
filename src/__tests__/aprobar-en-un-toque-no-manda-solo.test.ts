import { buildWhatsAppLink, toWhatsAppDigits } from '@/lib/commercial/contact';
import fs from 'fs';
import path from 'path';

describe('Aprobar en un toque no manda solo', () => {
  test('la pantalla arma el enlace con 598 para números uruguayos', () => {
    const link = buildWhatsAppLink('099 123 456', '¡Hola! Coordinemos tu evento.');
    expect(link).toContain('https://wa.me/59899123456');
    expect(link).toContain('text=');
    expect(link).toContain('Coordinemos');
  });

  test('no hay ningún envío automático: Mi Día solo genera el enlace para que lo abra una persona', () => {
    const miDiaCode = fs.readFileSync(
      path.join(process.cwd(), 'src/app/(app)/mi-dia/page.tsx'),
      'utf8'
    );

    // Usa buildWhatsAppLink para construir la URL
    expect(miDiaCode).toContain('buildWhatsAppLink');

    // No llama a APIs de envío silencioso de WhatsApp (no envía solo)
    expect(miDiaCode).not.toContain('sendWhatsAppMessage');
    expect(miDiaCode).not.toContain('enviarMensajeAutomatico');
  });
});
