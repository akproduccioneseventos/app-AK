import fs from 'node:fs';
import path from 'node:path';

const read = (relativePath: string) => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

function exportedFunction(source: string, name: string) {
  const start = source.indexOf(`export async function ${name}`);
  const next = source.indexOf('export async function ', start + 1);
  expect(start).toBeGreaterThanOrEqual(0);
  return source.slice(start, next === -1 ? undefined : next);
}

describe('public and operator boundaries', () => {
  it('reserves full entertainment resets for operator access', () => {
    const source = read('src/app/actions/fiesta/sesion-entretenimiento.ts');
    const reset = exportedFunction(source, 'resetEntertainmentSession');
    const complete = exportedFunction(source, 'completeEntertainmentSessionCycle');

    expect(reset).toContain('hasEntertainmentControlAccess');
    expect(reset).not.toContain('hasEntertainmentGuestAccess');
    expect(complete).toContain('hasEntertainmentGuestAccess');
    expect(complete).toContain("session.status !== 'done'");
    expect(complete).toContain('db.runTransaction');
  });

  it.each([
    'fotocabina/[fiestaId]/page.tsx',
    'plataforma-360/[fiestaId]/page.tsx',
    'bogue/[fiestaId]/page.tsx',
    'espejo-magico/[fiestaId]/page.tsx',
    'touchpix/[fiestaId]/page.tsx',
  ])('uses cycle completion for guest retakes in %s', (page) => {
    const source = read(`src/app/evento/${page}`);
    expect(source).toContain('completeEntertainmentSessionCycle');
    expect(source.match(/resetEntertainmentSession\(/g)).toHaveLength(1);
  });

  it('keeps private live-event captures out of public data', () => {
    const source = read('src/app/actions/evento-en-vivo.ts');
    expect(source).toContain("Omit<EventoEnVivoData, 'captaciones'>");
    expect(source).toContain('const { captaciones: _privateCaptures, ...publicData }');
  });

  it('requires event-scoped operator access for screen administration but keeps voting public', () => {
    const source = read('src/app/actions/fiesta/screen-mode.actions.ts');
    const access = read('src/lib/auth/event-access.ts');
    const patchStart = source.indexOf('async function patchScreenMode');
    const patchEnd = source.indexOf('export async function playScreenPlaylist');
    expect(source.slice(patchStart, patchEnd)).toContain('requireEventPermission(fiestaId, PERMISOS.NOCHE)');
    for (const name of ['nextScreenItem', 'prevScreenItem', 'updateLedMessage', 'uploadScreenMediaAsset', 'launchGame']) {
      expect(exportedFunction(source, name)).toContain('requireEventPermission(fiestaId, PERMISOS.NOCHE)');
    }
    expect(access).toContain("perfilDe(session.user) !== 'operador'");
    expect(access).toContain('fiesta.personalAsignado');
    expect(exportedFunction(source, 'voteActiveGameOption')).not.toContain('requireEventPermission');
  });

  it('defaults guest media to moderation and keeps the cron secret out of the URL', () => {
    const gallery = read('src/app/actions/social-gallery.ts');
    const defaults = read('src/lib/fiesta-defaults.ts');
    const cron = read('src/app/api/cron/generate-blog-post/route.ts');

    expect(defaults).toContain('requireApproval: true');
    expect(gallery).toContain('socialGallerySettings?.requireApproval !== false');
    // La ruta ya no decide el acceso: lo decide `puerta-de-las-tareas.ts`, en un
    // solo lugar para las cuatro tareas.
    expect(cron).toContain('abrirPuertaDeLaTarea');
    expect(cron).not.toContain("searchParams.get('secret')");
  });

  it('keeps payment reminders authenticated while allowing the validated cron internally', () => {
    const messages = read('src/app/actions/scheduled-messages.ts');
    const invoices = read('src/app/actions/invoices.ts');
    const cron = read('src/app/api/cron/recordatorios-de-pago/route.ts');

    expect(messages).toContain('internalToken !== WHATSAPP_AUTOMATION_INTERNAL_TOKEN');
    expect(invoices).toContain('requirePermiso(PERMISOS.CONTABILIDAD)');
    expect(cron).toContain('WHATSAPP_AUTOMATION_INTERNAL_TOKEN');
    expect(cron).toContain('abrirPuertaDeLaTarea');
    expect(cron).not.toContain("searchParams.get('secret')");

    /**
     * **La linea que no se cruza: preparar si, mandar no.**
     *
     * Los recordatorios de cuota corren sin clave porque **no le escriben a
     * nadie**: dejan el aviso en la bandeja de salida y el mensaje sale cuando una
     * persona lo toca, desde su propio WhatsApp.
     *
     * Lo que esta prueba cuida es que eso siga siendo cierto. Si el motor empieza
     * a mandar solo, se pone en rojo. **La solucion no es sacar la prueba: es
     * sacar el envio.**
     */
    const motor = read('src/lib/whatsapp-automation-engine.ts');

    expect(motor).not.toContain('sendMetaWhatsAppMessage');
    expect(motor).toContain("status: 'pendiente'");
  });

  it('builds the printed annual projection from the current total, not the adjusted total', () => {
    const source = read('src/app/(app)/presupuestos/[id]/ver/page.tsx');
    const projectionStart = source.indexOf('const annualProjection = buildAnnualAdjustmentProjection');
    const projectionSource = source.slice(projectionStart, projectionStart + 360);
    expect(projectionSource).toContain('baseTotal: calculatedValues.totalVigente');
    expect(projectionSource).not.toContain('baseTotal: calculatedValues.totalFinal');
  });
});
