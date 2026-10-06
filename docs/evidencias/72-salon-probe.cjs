const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const appRepo = path.resolve(__dirname, '../..');
const sha = process.argv[2] || 'e52c07839563115236652229d73ac5ebf2e4e551';
const source = execFileSync('git', ['show', `${sha}:src/app/actions/salon-layout-templates.ts`], { cwd: appRepo, encoding: 'utf8' });
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
let saved = [];
const actionModule = { exports: {} };
const mockedRequire = (id) => {
  if (id === '@/lib/data-service') return { readData: async () => saved, writeData: async (_file, value) => { saved = value; } };
  if (id === '@/lib/auth/require-session') return { requireAppSession: async () => ({ user: 'fixture' }) };
  return {};
};
vm.runInThisContext('(function(require,module,exports){' + output + '\n})', { filename: 'salon-layout-templates.ts' })(mockedRequire, actionModule, actionModule.exports);

(async () => {
  const fixture = {
    salonWidth: 18, salonHeight: 12, pixelsPerMeter: 80,
    salonPlanBackgroundImageUrl: 'fixture://plan', layoutTemplateName: 'Viejo',
    salonElements: [
      { id: 'round-1', name: 'Mesa redonda', x: 160, y: 240, width: 160, height: 160, rotation: 15, type: 'element', category: 'Mesa redonda', seats: 10, shape: 'circle' },
      { id: 'rect-1', name: 'Mesa imperial', x: 400, y: 240, width: 320, height: 80, rotation: 0, type: 'element', category: 'Mesa imperial', seats: 12 },
      { id: 'area-1', name: 'Pista', x: 320, y: 400, width: 240, height: 160, rotation: 0, type: 'area', category: 'Área' },
      { id: 'decor-1', name: 'Arco', x: 80, y: 80, width: 80, height: 160, rotation: 5, type: 'element', category: 'Decoración' },
    ],
  };
  const result = await actionModule.exports.saveSalonLayoutTemplate('Fixture salón', fixture);
  assert.equal(result.success, true);
  const reopened = (await actionModule.exports.getSalonLayoutTemplates())[0].layoutData;
  assert.equal(reopened.salonElements.length, 4);
  assert.deepEqual(reopened.salonElements, fixture.salonElements);
  assert.equal(reopened.salonWidth, 18);
  assert.equal(reopened.salonHeight, 12);
  assert.equal(reopened.salonPlanBackgroundImageUrl, fixture.salonPlanBackgroundImageUrl);
  assert.equal(reopened.pixelsPerMeter, undefined);
  const intendedMeters = fixture.salonElements[0].width / fixture.pixelsPerMeter;
  const reopenedMeters = fixture.salonElements[0].width / (reopened.pixelsPerMeter || 40);
  assert.equal(intendedMeters, 2);
  assert.equal(reopenedMeters, 4);
  process.stdout.write(JSON.stringify({ sha, result: 'PASS', elementsPreserved: reopened.salonElements.length, pixelsPerMeterSaved: reopened.pixelsPerMeter ?? null, mesaWidthMetersBefore: intendedMeters, mesaWidthMetersAfterReload: reopenedMeters }, null, 2) + '\n');
})().catch((error) => { console.error(error); process.exitCode = 1; });
