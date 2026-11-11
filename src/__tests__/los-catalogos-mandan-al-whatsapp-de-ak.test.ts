/**
 * Auditoría pública del 11/11/2026 (F01): los seis catálogos y las seis páginas /public mandaban las consultas a
 * 59899123456, un número de ejemplo, en vez del WhatsApp de AK. El prospecto escribía y nadie lo leía.
 */
import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { catalogList } from '@/data/event-catalogs';
import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';

describe('los catálogos mandan al WhatsApp de AK', () => {
  it('cada catálogo usa el número oficial', () => {
    expect(catalogList.length).toBeGreaterThanOrEqual(6);
    for (const catalogo of catalogList) {
      expect(catalogo.whatsappNumber).toBe(AK_WHATSAPP_NUMBER);
    }
  });

  it('ningún catálogo escribe un número a mano', () => {
    const carpeta = path.join(process.cwd(), 'src/data/event-catalogs');
    for (const archivo of readdirSync(carpeta)) {
      const texto = readFileSync(path.join(carpeta, archivo), 'utf8');
      expect(texto).not.toMatch(/wa\.me\/\d|whatsappNumber:\s*['"]\d/);
    }
  });
});
