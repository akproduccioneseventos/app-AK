// Executes the real projection helper at an exact commit; no network/storage.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const sha = process.argv[2] || 'e52c07839563115236652229d73ac5ebf2e4e551';
const source = execFileSync('git', ['show', `${sha}:src/lib/guest-portal-public-data.ts`], { cwd: root, encoding: 'utf8' });
const exportsFixture = {};
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports: exportsFixture }, { filename: 'guest-portal-public-data.ts' });
const { hasPublicGuestAccess, buildPublicGuestPortalData } = exportsFixture;
const fiesta = {
  id: 'fixture-event-a', configuracion: { nombreEvento: 'Fiesta de prueba', ownerSecret: 'internal-secret' },
  invitados: [
    { id: 'guest-a', nombre: 'Invitado A', guestAccessToken: 'token-a', telefono: 'synthetic-private-contact' },
    { id: 'guest-b', nombre: 'Invitado B', guestAccessToken: 'token-b' },
  ],
  planDePagos: { total: 100 }, contratoFisico: { signed: true },
  programa: [{ id: 'public', visibleParaCliente: true, titulo: 'Brindis' }, { id: 'internal', visibleParaCliente: false, titulo: 'Internal task' }],
};
assert.equal(hasPublicGuestAccess(undefined, 'guest-a', 'token-a'), false);
assert.equal(buildPublicGuestPortalData(fiesta, 'missing', 'token-a'), null);
assert.equal(buildPublicGuestPortalData(fiesta, 'guest-a', ''), null);
assert.equal(buildPublicGuestPortalData(fiesta, 'guest-a', 'wrong-token'), null);
assert.equal(buildPublicGuestPortalData(fiesta, 'guest-b', 'token-a'), null);
const otherFiesta = structuredClone(fiesta);
otherFiesta.id = 'fixture-event-b';
otherFiesta.invitados[0].guestAccessToken = 'other-event-token';
assert.equal(buildPublicGuestPortalData(otherFiesta, 'guest-a', 'token-a'), null);
const visible = buildPublicGuestPortalData(fiesta, 'guest-a', 'token-a');
assert.equal(visible.guest.id, 'guest-a');
assert.equal(visible.guest.guestAccessToken, undefined);
assert.equal(visible.guest.telefono, undefined);
assert.equal(visible.fiesta.invitados, undefined);
assert.equal(visible.fiesta.planDePagos, undefined);
assert.equal(visible.fiesta.contratoFisico, undefined);
assert.equal(visible.fiesta.configuracion.ownerSecret, undefined);
assert.equal(visible.fiesta.programa.length, 1);
console.log(JSON.stringify({ sha, cases: 7, result: 'PASS', scope: 'real token/projection helper, NOT HTTP, RSVP action or media download' }));
