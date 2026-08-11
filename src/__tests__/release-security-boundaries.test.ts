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
    const actions = readSource('src/app/actions/google-workspace.ts');
    expect(actions).toContain('const session = await verifySession()');
    expect(actions).toContain('puede(session.user, PERMISOS.ADMINISTRACION)');
    expect(actions).toContain('requireEventPermission(fiestaId, PERMISOS.ORGANIZACION)');
    expect(actions).toContain('requirePermiso(PERMISOS.ADMINISTRACION)');
    expect(actions).toContain('requirePermiso(PERMISOS.CRM)');
  });

  it.each([
    ['activos-fijos.ts', ['saveActivoFijo', 'deleteActivoFijo']],
    // `deleteEmpleado` no esta aca: pide algo mas fuerte que tener sesion. Se
    // verifica mas abajo, junto con el resto de lo que toca sueldos.
    ['empleados.ts', ['saveEmpleado']],
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
    ['notifications.ts', ['getNotifications', 'markNotificationAsRead', 'markAllNotificationsAsRead', 'deleteNotification', 'checkAndCreateTaskReminders', 'checkAndCreateReunionReminders', 'checkAndCreateEventAlerts', 'checkAndCreatePendingBalanceAlerts', 'generateAllSmartNotifications', 'resetAllNotifications']],
    ['alertas.actions.ts', ['marcarAlertaLeida', 'marcarTodasLeidas', 'resetAlertasLeidas', 'descartarAlerta', 'descartarPrioridad']],
    ['blog.ts', ['saveBlogPost', 'deleteBlogPost']],
    ['catalogo-fotos.ts', ['addCatalogoFoto', 'updateCatalogoFoto', 'deleteCatalogoFoto', 'toggleCatalogoFotoDestacada', 'uploadCatalogoFotoFromFile']],
    ['contenido-publico.ts', ['savePresentacionLedSettings', 'saveCatalogoSettings']],
    ['fiestas-historicas.ts', ['saveFiestaHistorica', 'deleteFiestaHistorica', 'generarDesdeHistorico', 'resetAllFiestasHistoricas']],
    ['galeria.ts', ['addGaleriaFoto', 'addGaleriaVideo', 'deleteGaleriaItem', 'updateGaleriaItem', 'reorderGaleriaItems', 'toggleDestacada', 'updateGaleriaFoto']],
    ['historicos.ts', ['processHistoricRecord']],
    ['incidents.ts', ['createIncidente', 'updateIncidente', 'addActualizacionIncidente', 'resolverIncidente', 'cerrarIncidente']],
    ['initialize-events.ts', ['initializeEventsForAllCustomers']],
    ['invitacion-config.ts', ['saveInvitacionConfig']],
    ['landing-editor.ts', ['saveLandingSettings']],
    ['playbooks.ts', ['createPlaybook', 'updatePlaybook', 'deletePlaybook', 'applyPlaybookToFiesta']],
    ['reposteria.actions.ts', ['saveReposteriaMasterTemplate']],
    ['scheduled-messages.ts', ['saveScheduledMessage', 'markMessageAsSent', 'rescheduleMessage', 'cancelScheduledMessage']],
    ['simulador-copilot.ts', ['saveCopilotConfig']],
    ['social-media.ts', ['saveSocialPost', 'deleteSocialPost', 'syncInstagramPosts']],
    ['fiesta/fiesta.actions.ts', ['updateFiestaPartial', 'deleteFiesta', 'archiveFiesta', 'deleteFiestaArchivada']],
    ['cupones.ts', ['saveCupon', 'toggleCuponActivo', 'deleteCupon', 'registrarUsoCupon']],
    ['feedback.ts', ['getFeedback', 'getAllTestimonials', 'saveTestimonial', 'updateTestimonialApproval', 'deleteTestimonial']],
    ['audit-log.ts', ['logAuditEvent', 'getAuditLogs']],
    ['alertas.actions.ts', ['getAlertasGlobalesConLeidas']],
    ['provider-portal.ts', ['getProveedoresPortal', 'createProveedorAcceso']],
    ['whatsapp.ts', ['getWhatsAppConfig', 'getWhatsAppConversations', 'getWhatsAppConversation', 'saveWhatsAppConfig', 'sendWhatsAppMessage', 'takeOverConversation', 'returnToBotConversation', 'getWhatsAppStats']],
    ['crm.ts', ['findLeadByBudgetOrCreate']],
  ])('requires a signed session for master-data writes in %s', (filename, functionNames) => {
    const source = readSource(`src/app/actions/${filename}`);
    for (const functionName of functionNames) {
      const start = source.indexOf(`export async function ${functionName}`);
      const nextExport = source.indexOf('export async function ', start + 1);
      const functionSource = source.slice(start, nextExport === -1 ? undefined : nextExport);
      expect(start).toBeGreaterThanOrEqual(0);
      expect(functionSource).toMatch(/await require(?:AppSession|Permiso)\(/);
    }
  });

  it('los recibos del personal exigen el permiso de sueldos, no solo tener sesion', () => {
    // Cuanto cobra cada persona del equipo es del dueno. La secretaria factura y
    // cobra, pero no tiene por que ver el sueldo de sus companeros: por eso estas
    // dos piden `requirePermiso(PERMISOS.SUELDOS)` en vez de `requireAppSession`.
    const source = readSource('src/app/actions/recibos-personal.ts');
    for (const functionName of ['getRecibosFirmados', 'saveReciboFirmado']) {
      const start = source.indexOf(`export async function ${functionName}`);
      const nextExport = source.indexOf('export async function ', start + 1);
      const functionSource = source.slice(start, nextExport === -1 ? undefined : nextExport);
      expect(start).toBeGreaterThanOrEqual(0);
      expect(functionSource).toContain('requirePermiso(PERMISOS.SUELDOS)');
    }
  });

  it('permite al personal ver solo su propio portal y reserva los demas sueldos', () => {
    const source = readSource('src/app/actions/google-workspace.ts');
    expect(source).toContain("perfilDe(session.user) === 'personal'");
    expect(source).toContain('session.user.userId === empleadoId');
    expect(source).toContain('employeeEmails.includes(sessionEmail)');
    expect(source).toContain('puede(session.user, PERMISOS.SUELDOS)');
    expect(source).toContain('Solo puedes consultar tu propio portal de trabajo.');
  });

  it('toma la identidad de aprobaciones y playbooks solo de la sesion firmada', () => {
    for (const file of ['src/app/actions/approvals.ts', 'src/app/actions/playbooks.ts']) {
      const source = readSource(file);
      expect(source).toContain("session.user.email || session.user.userId || 'Usuario autenticado'");
      expect(source).not.toMatch(/session\.user\?\.email \|\| \([^\n]*(aprobadoPor|rechazadoPor|userId)/);
    }
  });

  it('conserva el menu elegido en el presupuesto y bloquea borrar referencias activas', () => {
    const budgetType = readSource('src/types/presupuesto.ts');
    const builder = readSource('src/app/(app)/presupuestos/nuevo/crear/page.tsx');
    const menus = readSource('src/app/actions/menus-catering.ts');
    expect(budgetType).toContain('selectedMenuId?: string');
    expect(builder).toContain('selectedMenuId: formData.selectedMenuId || undefined');
    expect(menus).toContain('p.selectedMenuId === id');
    expect(menus).toContain('fiesta.menuAsignadoId === id');
    expect(menus).toContain('menuItemIds.has(item.idServicioCatalogo)');
  });

  it('asignar personal a una fiesta y dar de baja a alguien tambien exigen el permiso de sueldos', () => {
    // `updatePersonal` guarda `eventSalary`: cuanto cobra cada persona por esa
    // fiesta. Es el mismo dato que los recibos, asi que va con el mismo permiso.
    // Antes no comprobaba nada: con solo conocer el codigo de una fiesta se podian
    // cambiar los sueldos desde afuera, y encima se disparaban los correos de
    // asignacion al equipo.
    //
    // `deleteEmpleado` es la ficha de una persona, con su contrato adjunto: no
    // alcanza con tener sesion.
    const casos: Array<[string, string]> = [
      ['fiesta/personal.actions.ts', 'updatePersonal'],
      ['empleados.ts', 'deleteEmpleado'],
    ];
    for (const [archivo, functionName] of casos) {
      const source = readSource(`src/app/actions/${archivo}`);
      const start = source.indexOf(`export async function ${functionName}`);
      const nextExport = source.indexOf('export async function ', start + 1);
      const functionSource = source.slice(start, nextExport === -1 ? undefined : nextExport);
      expect(start).toBeGreaterThanOrEqual(0);
      expect(functionSource).toContain('requirePermiso(PERMISOS.SUELDOS)');
    }
  });

  it('keeps automatic backups internal without exposing restore privileges', () => {
    const backup = readSource('src/app/actions/backup.ts');
    const dataService = readSource('src/lib/data-service.ts');
    expect(backup).toContain('internalToken !== AUTO_BACKUP_INTERNAL_TOKEN');
    expect(backup).toContain('createRestorePointInternal(true)');
    expect(dataService).toContain('triggerAutoBackup(AUTO_BACKUP_INTERNAL_TOKEN)');
  });

  it('allows notification creation only through a session or the internal wrapper', () => {
    const notifications = readSource('src/app/actions/notifications.ts');
    const wrapper = readSource('src/lib/notifications/create-notification.ts');
    expect(notifications).toContain('internalToken !== NOTIFICATION_INTERNAL_TOKEN');
    expect(notifications).toContain('await hasAppSession()');
    expect(wrapper).toContain('createNotificationAction(data, NOTIFICATION_INTERNAL_TOKEN)');
  });

  it('limits event writes to an app session or that event portal session', () => {
    const actions = readSource('src/app/actions/fiesta/fiesta.actions.ts');
    expect(actions).toContain('await requireFiestaWriteAccess(fiestaData.id)');
    expect(actions).toContain('await verifyPortalSession(fiestaId)');
    expect(actions).toContain("throw new Error('No autorizado para modificar este evento.')");
  });

  it('exposes only approved testimonials and rate-limits public feedback', () => {
    const feedback = readSource('src/app/actions/feedback.ts');
    expect(feedback).toContain('.filter((testimonial) => testimonial.isApproved)');
    expect(feedback).toContain("scope: 'event-feedback'");
    expect(feedback).toContain('limit: 3');
  });

  it('keeps WhatsApp secrets private while the simulator receives only the phone number', () => {
    const whatsapp = readSource('src/app/actions/whatsapp.ts');
    const webhook = readSource('src/app/api/whatsapp/webhook/route.ts');
    const simulator = readSource('src/app/simulador-ak/page.tsx');
    expect(whatsapp).toContain('internalToken !== WHATSAPP_WEBHOOK_INTERNAL_TOKEN');
    expect(webhook).toContain('getWhatsAppConfig(WHATSAPP_WEBHOOK_INTERNAL_TOKEN)');
    expect(simulator).toContain('getPublicWhatsAppNumber()');
    expect(simulator).not.toContain('getWhatsAppConfig()');
  });

  it('waits for real Meta delivery and never records a rejected manual message as sent', () => {
    const whatsapp = readSource('src/app/actions/whatsapp.ts');
    expect(whatsapp).toContain('const delivery = await sendMetaWhatsAppMessage');
    expect(whatsapp).toMatch(/if \(!delivery\.success\)\s*\{\s*return \{ success: false/);
    expect(whatsapp.match(/await sendMetaWhatsAppMessage/g)?.length).toBeGreaterThanOrEqual(2);
    expect(whatsapp).not.toContain('[WhatsApp Bot] Error enviando');
    expect(whatsapp).toContain("deliveryStatus = 'failed'");
  });

  it('uses cryptographic provider tokens and rejects inactive portal mutations', () => {
    const provider = readSource('src/app/actions/provider-portal.ts');
    expect(provider).toContain('token: randomUUID()');
    expect(provider).toContain('const access = await getProveedorByToken(token)');
    expect(provider).toContain('if (!access.success || !access.data) return { success: false, error: access.error }');
  });

  it('requires an app session before mutating agenda appointments', () => {
    const agenda = readSource('src/app/actions/agenda.ts');
    expect(agenda).toContain("import { requireAppSession } from '@/lib/auth/require-session'");
    expect(agenda.match(/await requireAppSession\(\)/g)).toHaveLength(2);
  });

  it('limits destructive CRM reset to administrators', () => {
    const crm = readSource('src/app/actions/crm.ts');
    const resetStart = crm.indexOf('export async function resetCrm');
    const resetEnd = crm.indexOf('export async function ', resetStart + 1);
    const resetSource = crm.slice(resetStart, resetEnd);
    expect(resetSource).toContain("auth.user?.role !== 'admin'");
    expect(resetSource).toContain('Acceso restringido a administradores.');
  });

  it('rejects a mismatched guest token at event access control', () => {
    const rsvp = readSource('src/app/invitacion/[fiestaId]/rsvp/page.tsx');
    const accessControl = readSource('src/app/evento/accesos/[fiestaId]/page.tsx');
    expect(rsvp).toContain('&token=${encodeURIComponent(confirmedGuest.guestAccessToken');
    expect(rsvp).toContain('renderAs="canvas"');
    expect(accessControl).toContain('El token del QR no es válido para este invitado.');
    expect(accessControl).not.toContain('Possible QR tampering');
  });

  it('does not mutate portal DOM or inject duplicate panels after hydration', () => {
    const portalLayer = readSource('src/components/portal-cliente/ClientPortalVipUxLayer.tsx');
    expect(portalLayer).not.toContain('MutationObserver');
    expect(portalLayer).not.toContain('insertAdjacentElement');
    expect(portalLayer).toContain('return null');
  });
});
