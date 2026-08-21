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
     * **Esta es la que no se afloja nunca.** Las otras tres tareas pueden correr
     * sin clave configurada, porque repetirlas no le hace nada a nadie. Ésta le
     * escribe al cliente por WhatsApp: sin clave **no corre**, y contesta 503.
     *
     * Si alguien la agrega a `TAREAS_QUE_NO_HACEN_DANO`, esta prueba se pone en
     * rojo. La solución no es sacar la prueba.
     */
    const puerta = read('src/lib/automatico/puerta-de-las-tareas.ts');
    const listaAbierta = puerta.slice(
      puerta.indexOf('TAREAS_QUE_NO_HACEN_DANO'),
      puerta.indexOf(']);', puerta.indexOf('TAREAS_QUE_NO_HACEN_DANO')),
    );

    expect(listaAbierta).not.toContain('recordatorios-de-pago');
  });

  it('builds the printed annual projection from the current total, not the adjusted total', () => {
    const source = read('src/app/(app)/presupuestos/[id]/ver/page.tsx');
    const projectionStart = source.indexOf('const annualProjection = buildAnnualAdjustmentProjection');
    const projectionSource = source.slice(projectionStart, projectionStart + 360);
    expect(projectionSource).toContain('baseTotal: calculatedValues.totalVigente');
    expect(projectionSource).not.toContain('baseTotal: calculatedValues.totalFinal');
  });
});
