import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('Orden 318 Bloque 4 F10: crear presupuesto desde prospecto trae el teléfono', () => {
  it('CrmLeadCard pasa leadPhone y crear presupuesto lo lee en clienteContacto', () => {
    const cardSrc = readFileSync(
      path.join(process.cwd(), 'src/components/crm/CrmLeadCard.tsx'),
      'utf8',
    );
    const crearSrc = readFileSync(
      path.join(process.cwd(), 'src/app/(app)/presupuestos/nuevo/crear/page.tsx'),
      'utf8',
    );
    expect(cardSrc).toContain('leadPhone=');
    expect(crearSrc).toContain("searchParams.get('leadPhone')");
    expect(crearSrc).toContain('clienteContacto');
  });
});
