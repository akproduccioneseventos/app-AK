const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const taskRoot = path.resolve(__dirname, '../..');
const modules = {};
function load(relativePath) {
  const sourcePath = path.join(taskRoot, relativePath);
  const output = ts.transpileModule(fs.readFileSync(sourcePath, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(output, {
    exports,
    require(name) {
      if (['path', 'crypto'].includes(name)) return require(name);
      if (!(name in modules)) throw new Error(`Unexpected import: ${name}`);
      return modules[name];
    },
    Date, console,
  }, { filename: sourcePath });
  return exports;
}

const access = {
  id: 'token_prueba', nombreAcceso: 'Personal de prueba', fiestaId: 'fiesta_prueba',
  empleadoId: 'empleado_prueba', permisos: ['musica'],
  fechaCreacion: '2020-01-01T00:00:00Z', fechaVencimiento: '2020-02-01T00:00:00Z',
};
let fiesta = {
  id: 'fiesta_prueba',
  configuracion: { nombreEvento: 'Prueba aislada', googleMapsUrl: 'https://maps.google.com/?q=-34.9065,-56.1998' },
  personalAsignado: [{ empleadoId: 'empleado_prueba', rolId: 'rol_prueba' }],
};
let arrivalLocationEnabled = false;
modules['@/lib/data-service'] = { readData: async (file, fallback) => file === 'accesos-personal.json' ? [access] : fallback };
modules['@/lib/auth/session-token'] = { verifySession: async () => ({ success: false }) };
modules['@/lib/auth/vigencia-acceso'] = load('src/lib/auth/vigencia-acceso.ts');
modules['@/app/actions/accesos-personal'] = load('src/app/actions/accesos-personal.ts');
modules['@/app/actions/fiesta/fiesta.actions'] = { getFiestaById: async () => fiesta };
modules['@/lib/fiesta/lectura-completa'] = { LECTURA_COMPLETA: {} };
modules['@/app/actions/roles'] = { getRolesPublicos: async () => [] };
modules['@/lib/fiesta/actualizar-fiesta'] = {
  actualizarFiesta: async (_id, change) => { fiesta = change(fiesta); return { success: true }; },
};
modules['@/app/actions/settings'] = { getAjustesLlegadaPersonal: async () => ({ llegadaConUbicacion: arrivalLocationEnabled, radioMetros: 300 }) };
modules['@/lib/geo/distancia'] = load('src/lib/geo/distancia.ts');
const actions = load('src/app/actions/accesos-personal-view.ts');

(async () => {
  const gateway = await modules['@/app/actions/accesos-personal'].verifyAccesoPersonalToken('fiesta_prueba', 'musica', access.id);
  assert.equal(gateway.authorized, false);
  assert.equal(gateway.motivo, 'vencido');
  const view = await actions.getAccesoPersonalPortalView(access.id);
  const response = await actions.responderAsistenciaPersonal(access.id, true);
  const arrival = await actions.registrarLlegadaPersonal(access.id);
  assert.ok(view?.fiesta);
  assert.equal(response.success, true);
  assert.equal(arrival.success, true);
  console.log(JSON.stringify({
    case: 'token vencido', gatewayDenied: true,
    portalReturned: !!view?.fiesta, attendanceAccepted: response.success, arrivalAccepted: arrival.success,
  }));

  access.fechaVencimiento = '2099-01-01T00:00:00Z';
  arrivalLocationEnabled = true;
  delete fiesta.personalAsignado[0].checkInTimestamp;
  const invalidLocation = await actions.registrarLlegadaPersonal(access.id, { lat: Number.NaN, lng: Number.POSITIVE_INFINITY });
  assert.equal(invalidLocation.success, true);
  assert.ok(Number.isNaN(invalidLocation.distanciaMetros));
  assert.ok(fiesta.personalAsignado[0].checkInTimestamp);
  console.log(JSON.stringify({
    case: 'ubicacion no finita con control encendido',
    arrivalAccepted: invalidLocation.success, distanceIsNaN: Number.isNaN(invalidLocation.distanciaMetros),
    checkInSaved: !!fiesta.personalAsignado[0].checkInTimestamp,
  }));
})().catch((error) => { console.error(error); process.exitCode = 1; });
