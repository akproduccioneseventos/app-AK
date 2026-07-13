import fs from 'node:fs';
import path from 'node:path';

const read = (relativePath: string) => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('release workflow integrity', () => {
  it('keeps known navigation targets aligned with real routes', () => {
    const customerActions = read('src/app/actions/customers.ts');
    const shell = read('src/components/app-shell.tsx');
    const assistants = read('src/lib/assistant/assistant-pro-capabilities.ts');
    const contextualAssistants = read('src/lib/assistant/contextual-assistants.ts');
    const publicPaths = read('src/lib/auth/public-paths.ts');

    expect(customerActions).not.toContain('href: `/clientes`');
    expect(shell).not.toContain("pathname === '/planner-costo-fiesta'");
    expect(shell).not.toContain("pathname === '/admin/aaiff-fiesta'");
    expect(assistants).not.toContain("'/fiestas/nueva/lista-de-carga'");
    expect(contextualAssistants).not.toContain("'/fiestas/nueva/cliente'");
    expect(publicPaths).not.toContain("'/portal-proveedor'");
  });

  it('creates a real event before navigating from the customer record', () => {
    const page = read('src/app/(app)/customers/[id]/page.tsx');
    expect(page).toContain('createFiestaVacia(customer.id, customer.name)');
    expect(page).toContain('result.newFiestaId');
    expect(page).not.toContain('<Link href="/fiestas/nueva/configuracion">Crear Nuevo Evento</Link>');
  });

  it('sends the guest gift shortcut to the real invitation section', () => {
    const guestPage = read('src/app/invitado/[fiestaId]/[invitadoId]/page.tsx');
    const invitation = read('src/app/invitacion/[fiestaId]/invitacion-publica-client.tsx');
    expect(guestPage).toContain('`${invitacionUrl}#regalos`');
    expect(invitation).toContain('id="regalos"');
    expect(guestPage).not.toContain('/portal-cliente/${fiestaId}/regalos');
  });

  it('checks persistence results before confirming financial saves', () => {
    const costsPage = read('src/app/(app)/fiestas/nueva/gestion-costos-rentabilidad/page.tsx');
    expect(costsPage).toContain("if (!result.success) throw new Error(result.error || 'No se pudo registrar el pago.')");
    expect(costsPage).toContain("if (!result.success) throw new Error(result.error || 'No se pudo guardar el análisis financiero.')");
  });

  it('rolls back invoice deletion when event unlinking fails', () => {
    const invoiceActions = read('src/app/actions/invoices.ts');
    const invoicePage = read('src/app/(app)/invoices/page.tsx');
    expect(invoiceActions).toContain('await writeData(INVOICES_FILE, originalInvoices)');
    expect(invoiceActions).toContain('La eliminación fue revertida.');
    expect(invoicePage).toContain('deleteInvoiceAction(id, linkedFiestaId)');
  });

  it('does not announce optimistic saves after a rejected server result', () => {
    const catering = read('src/app/(app)/fiestas/nueva/catering/page.tsx');
    const planner = read('src/app/(app)/fiestas/nueva/page.tsx');
    const configuration = read('src/app/(app)/fiestas/nueva/configuracion/page.tsx');
    const socialWall = read('src/app/(app)/fiestas/nueva/muro-social/page.tsx');
    const decoration = read('src/app/(app)/fiestas/nueva/decoracion/page.tsx');

    expect(catering).toContain('if (!result.success) throw new Error');
    expect(planner).toContain('setModulosContratados(previousModules)');
    expect(configuration).toContain('if (!syncResult.success)');
    expect(socialWall).toContain('if (!saveResult.success)');
    expect(socialWall).toContain('if (!result.success) throw new Error');
    expect(decoration).toContain('if (!result.success)');
  });
});
