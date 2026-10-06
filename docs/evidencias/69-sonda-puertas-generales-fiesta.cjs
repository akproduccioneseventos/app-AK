const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
let signedIn = true;
let profile = 'personal';
const writes = [];
const fixture = {
  id: 'e2e_evento_ajeno',
  invitacionSlug: 'evento-aislado',
  configuracion: { nombreEvento: 'Prueba aislada', fechaEvento: '2026-10-05' },
  clientPortalSettings: { accessKey: 'CLAVE_SINTETICA' },
  invitados: [{ id: 'e2e_invitado', telefono: 'TELEFONO_SINTETICO', guestAccessToken: 'TOKEN_SINTETICO' }],
  gestionCostos: { ingresos: 1000 },
  personalAsignado: [],
};
const clone = value => JSON.parse(JSON.stringify(value));
const modules = {
  '@/lib/auth/session-token': { verifySession: async () => ({ success: signedIn, user: { userId: 'e2e_personal_ajeno', perfil: profile } }) },
  '@/lib/fiesta/leer-fiestas': { leerFiestasCrudas: async () => [clone(fixture)], leerHistorialCrudo: async () => [clone(fixture)] },
  '@/lib/data-service': {
    readData: async (_file, fallback) => clone(fixture),
    writeData: async (file, value) => writes.push({ file, value }),
    updateDataPartial: async (file, value) => writes.push({ file, value }),
  },
  '@/lib/fiesta/get-fiesta-raw': { preserveFiestaSecrets: async (_id, value) => value },
  '@/lib/security/portal-session': { verifyPortalSession: async () => false },
  '@/lib/fiesta/lectura-completa': { LECTURA_COMPLETA: Symbol('lectura-completa') },
  '@/lib/fiesta-defaults': { defaultModulosContratados: {} },
  '@/lib/utils': { getUruguayParts: () => ({ year: 2026, month: 10, day: 5 }) },
};
function load(relative) {
  const filename = path.join(root, relative);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports, Date, console, process: { env: {}, cwd: () => root },
    require(name) {
      if (['path', 'fs/promises', 'crypto'].includes(name)) return require(name);
      return modules[name] || {};
    },
  }, { filename });
  return exports;
}
modules['@/lib/auth/perfiles'] = load('src/lib/auth/perfiles.ts');
modules['@/lib/auth/require-session'] = load('src/lib/auth/require-session.ts');
modules['@/lib/invitacion-slug'] = load('src/lib/invitacion-slug.ts');
const actions = load('src/app/actions/fiesta/fiesta.actions.ts');

(async () => {
  assert.equal(modules['@/lib/auth/perfiles'].puede({ perfil: profile }, 'organizacion'), false);
  const all = await actions.getFiestas();
  const archived = await actions.getHistorialFiestas();
  const detail = await actions.getFiestaById(fixture.id);
  assert.equal(all[0].clientPortalSettings.accessKey, 'CLAVE_SINTETICA');
  assert.equal(archived[0].invitados[0].guestAccessToken, 'TOKEN_SINTETICO');
  assert.equal(detail.clientPortalSettings.accessKey, 'CLAVE_SINTETICA');
  console.log(JSON.stringify({ case: 'personal sin permiso ni asignacion', listReturned: all.length, archivedReturned: archived.length, privatePortalKeyReturned: true, privateGuestCredentialReturned: true }));
  const saved = await actions.saveFiesta(clone(fixture));
  const partial = await actions.updateFiestaPartial(fixture.id, { gestionCostos: { ingresos: 1 } });
  assert.equal(saved.success, true);
  assert.equal(partial.success, true);
  assert.equal(writes.length, 2);
  console.log(JSON.stringify({ case: 'personal modifica fiesta ajena', fullSaveAccepted: saved.success, partialSaveAccepted: partial.success, writes: writes.length }));
  signedIn = false;
  const current = await actions.getFiestaActual();
  assert.equal(current.clientPortalSettings.accessKey, 'CLAVE_SINTETICA');
  console.log(JSON.stringify({ case: 'fiesta actual publica', signedIn: false, privatePortalKeyReturned: true, privateGuestCredentialReturned: !!current.invitados[0].guestAccessToken }));
  const bySlug = await actions.getFiestaBySlug('evento-aislado');
  assert.equal(bySlug.clientPortalSettings.accessKey, 'CLAVE_SINTETICA');
  console.log(JSON.stringify({ case: 'invitacion por slug publica', signedIn: false, privatePortalKeyReturned: true, privateGuestCredentialReturned: !!bySlug.invitados[0].guestAccessToken }));
})().catch(error => { console.error(error); process.exitCode = 1; });
