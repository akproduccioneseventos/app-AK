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

  it('requires an app session for screen administration but keeps voting public', () => {
    const source = read('src/app/actions/fiesta/screen-mode.actions.ts');
    const patchStart = source.indexOf('async function patchScreenMode');
    const patchEnd = source.indexOf('export async function playScreenPlaylist');
    expect(source.slice(patchStart, patchEnd)).toContain('await requireAppSession()');
    for (const name of ['nextScreenItem', 'prevScreenItem', 'updateLedMessage', 'uploadScreenMediaAsset', 'launchGame']) {
      expect(exportedFunction(source, name)).toContain('await requireAppSession()');
    }
    expect(exportedFunction(source, 'voteActiveGameOption')).not.toContain('await requireAppSession()');
  });

  it('builds the printed annual projection from the current total, not the adjusted total', () => {
    const source = read('src/app/(app)/presupuestos/[id]/ver/page.tsx');
    const projectionStart = source.indexOf('const annualProjection = buildAnnualAdjustmentProjection');
    const projectionSource = source.slice(projectionStart, projectionStart + 360);
    expect(projectionSource).toContain('baseTotal: calculatedValues.totalVigente');
    expect(projectionSource).not.toContain('baseTotal: calculatedValues.totalFinal');
  });
});
