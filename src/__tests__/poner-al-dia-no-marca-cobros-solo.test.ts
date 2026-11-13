/**
 * Auditoría de contabilidad (13/11/2026): "Poner al día" traía marcadas como cobradas todas las fiestas pasadas;
 * un solo toque en "Aplicar" registraba cobros confirmados sin comprobante. Marcar un cobro lo decide una persona.
 */
import fs from 'fs';
import path from 'path';

const PANTALLA = path.join(process.cwd(), 'src/app/(app)/empresa/contabilidad/poner-al-dia/page.tsx');

describe('Poner al día no marca cobros solo', () => {
  it('al cargar, ningún cobro viene marcado', () => {
    const texto = fs.readFileSync(PANTALLA, 'utf8');
    expect(texto).toMatch(/setCobrar\(new Set\(\)\);/);
    expect(texto).not.toMatch(/setCobrar\(new Set\(r\.datos\.cobros/);
  });
});
