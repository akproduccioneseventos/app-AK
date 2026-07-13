import fs from 'node:fs';
import path from 'node:path';
import { mapFiestaToClientPortal } from '@/lib/client-portal/public-fiesta';

const readSource = (relativePath: string) => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('release security boundaries', () => {
  it('never sends internal event data or portal secrets to the client', () => {
    const result = mapFiestaToClientPortal({
      id: 'fiesta-1',
      configuracion: { nombreEvento: 'Evento seguro' },
      personalAsignado: [{ empleadoId: 'emp-1', rolId: 'rol-1', eventSalary: 9000 }],
      gestionCostos: { totalCostos: 12345 },
      pagosProveedores: [{ id: 'pago-interno', monto: 5000 }],
      clientPortalSettings: {
        enabled: true,
        accessKey: 'ACCESS-SECRET',
        clientPassword: 'PIN-SECRET',
      },
      invitados: [{
        id: 'guest-1',
        nombre: 'Invitado',
        rsvp: 'Confirmado',
        contacto: '099000000',
        notes: 'nota interna',
        guestAccessToken: 'GUEST-SECRET',
      }],
      decoracion: {
        tema: 'Elegante',
        presupuestoDecoracion: 80000,
        items: [{ id: 'deco-1', name: 'Flores', quantity: 2, estimatedCost: 10000, supplier: 'Proveedor privado' }],
      },
    } as any)!;

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('ACCESS-SECRET');
    expect(serialized).not.toContain('PIN-SECRET');
    expect(serialized).not.toContain('GUEST-SECRET');
    expect(serialized).not.toContain('099000000');
    expect(serialized).not.toContain('nota interna');
    expect(serialized).not.toContain('Proveedor privado');
    expect(serialized).not.toContain('12345');
    expect(result.personalAsignado).toEqual([]);
    expect(result.decoracion?.tema).toBe('Elegante');
  });

  it('awaits every portal-session authorization before sensitive operations', () => {
    const actions = readSource('src/app/actions/fiesta/portal.actions.ts');
    expect(actions).not.toMatch(/if \(!verifyPortalSession\(/);
    expect(actions).toContain('if (!(await verifyPortalSession(fiestaId)))');
  });

  it.each([
    'src/app/api/payment-proofs/[filename]/route.ts',
    'src/app/api/employee-contracts/[filename]/route.ts',
    'src/app/api/salon-contracts/[filename]/route.ts',
    'src/app/api/contracts/[filename]/route.ts',
    'src/app/api/contracts/fiestas/[...parts]/route.ts',
    'src/app/api/budgets/[filename]/route.ts',
    'src/app/api/storage/signed-url/route.ts',
    'src/app/api/video-vida-photos/[fiestaId]/download/route.ts',
    'src/app/api/social-gallery/[fiestaId]/download/route.ts',
    'src/app/api/buzon/[fiestaId]/download/route.ts',
  ])('requires an app session for private download route %s', routePath => {
    expect(readSource(routePath)).toContain('await hasAppSession()');
  });

  it('allows individual client documents only through a scoped portal session', () => {
    const route = readSource('src/app/api/documentos-fiesta/[...parts]/route.ts');
    expect(route).toContain('await verifyPortalSession(fiestaId)');
    expect(route).toContain('allowedDocuments.some');
    expect(route).toContain("filename === 'download-all.zip'");
  });

  it('protects both sides of the Google OAuth connection', () => {
    expect(readSource('src/app/api/google/oauth/start/route.ts')).toContain('await hasAppSession()');
    expect(readSource('src/app/api/google/oauth/callback/route.ts')).toContain('await hasAppSession()');
    expect(readSource('src/app/actions/google-workspace.ts')).toContain('await requireAppSession()');
  });

  it.each([
    ['activos-fijos.ts', ['saveActivoFijo', 'deleteActivoFijo']],
    ['empleados.ts', ['saveEmpleado', 'deleteEmpleado']],
    ['insumos.ts', ['saveInsumo', 'deleteInsumo', 'adjustAllInsumoCosts']],
    ['proveedores.ts', ['saveProveedor', 'deleteProveedor']],
    ['roles.ts', ['saveRol', 'deleteRol']],
    ['salones.ts', ['saveSalon', 'deleteSalon', 'uploadSalonFoto', 'deleteSalonFoto', 'addSalonPago', 'deleteSalonPago']],
    ['servicios-empresa.ts', ['saveServicioEmpresa', 'deleteServicioEmpresa', 'duplicateServicioEmpresa', 'adjustAllServicePrices', 'adjustAllServiceCosts']],
    ['gastos.ts', ['saveGastoGeneral', 'deleteGastoGeneral']],
    ['price-adjustments.ts', ['applyPriceAdjustment', 'revertPriceAdjustment']],
    ['promos.ts', ['savePromo', 'deletePromo', 'togglePromo']],
    ['menus-catering.ts', ['saveMenu', 'deleteMenu', 'duplicateMenu', 'adjustAllDishMargins']],
    ['social-connections.ts', ['saveWhatsAppNumber', 'saveSocialLink', 'disconnectSocialPlatform']],
    ['approvals.ts', ['createAprobacion', 'aprobarCambio', 'rechazarCambio']],
    ['feature-flags.ts', ['updateDefaultTier', 'updateGlobalOverride', 'setEventTier', 'setEventModuleOverride']],
    ['marketing.ts', ['saveMarketingTemplate', 'deleteMarketingTemplate', 'saveMarketingChecklist', 'importMarketingData']],
    ['mission-control.ts', ['getMissionControl', 'updateMissionControl', 'updateEtapaEstado', 'toggleChecklistItem', 'addNotaEtapa', 'addEtapa', 'updateEtapa']],
    ['armado-rapido.ts', ['saveArmadoRapidoConfig']],
    ['bebidas.actions.ts', ['saveBebidasMasterTemplate']],
    ['carta-tragos-master.actions.ts', ['saveCartaTragosMaster']],
    ['deco-canvas-templates.ts', ['saveDecoCanvasTemplate', 'deleteDecoCanvasTemplate']],
    ['invitacion-digital-templates.ts', ['saveInvitationTemplate', 'deleteInvitationTemplate', 'duplicateInvitationTemplate']],
    ['itinerary-templates.ts', ['saveItineraryTemplate', 'deleteItineraryTemplate']],
    ['meeting-checklist.ts', ['saveMeetingMasterTemplate']],
    ['salon-layout-templates.ts', ['saveSalonLayoutTemplate', 'deleteSalonLayoutTemplate']],
    ['task-templates.ts', ['saveTaskTemplate', 'deleteTaskTemplate']],
    ['backup.ts', ['getRestorePoints', 'createRestorePoint', 'restoreFromPoint', 'deleteRestorePoint']],
  ])('requires a signed session for master-data writes in %s', (filename, functionNames) => {
    const source = readSource(`src/app/actions/${filename}`);
    for (const functionName of functionNames) {
      const start = source.indexOf(`export async function ${functionName}`);
      const nextExport = source.indexOf('export async function ', start + 1);
      const functionSource = source.slice(start, nextExport === -1 ? undefined : nextExport);
      expect(start).toBeGreaterThanOrEqual(0);
      expect(functionSource).toContain('await requireAppSession()');
    }
  });

  it('keeps automatic backups internal without exposing restore privileges', () => {
    const backup = readSource('src/app/actions/backup.ts');
    const dataService = readSource('src/lib/data-service.ts');
    expect(backup).toContain('internalToken !== AUTO_BACKUP_INTERNAL_TOKEN');
    expect(backup).toContain('createRestorePointInternal(true)');
    expect(dataService).toContain('triggerAutoBackup(AUTO_BACKUP_INTERNAL_TOKEN)');
  });
});
