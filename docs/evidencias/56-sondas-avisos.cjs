// Isolated behavioral probes; no real session, database, email or push.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require(process.env.AUDIT_TYPESCRIPT || 'typescript');
const root = process.argv[2];
if (!root) throw new Error('Pass repository/snapshot root');
function extract(file, names) {
  const source = ts.createSourceFile(file, fs.readFileSync(path.join(root, file), 'utf8'), ts.ScriptTarget.Latest, true);
  const found = source.statements.filter(n => (n.name && names.includes(n.name.text)) || (ts.isVariableStatement(n) && n.declarationList.declarations.some(d => names.includes(d.name.text))));
  if (found.length !== names.length) throw new Error('Missing symbol in ' + file);
  return found.map(n => n.getText(source)).join('\n');
}
const helpers = ['getArchivoPreferencias', 'inferirCategoriaAviso', 'debeEnviarAvisoInterno'];
const actions = ['leerPreferenciasDeAvisos', 'guardarPreferenciasDeAvisos', 'debeEnviarAviso', 'enviarAvisoConPreferencia'];
const source = [extract('src/types/preferencias-avisos.ts', ['initialNotificationPreferences']), extract('src/lib/notifications/preferencias-avisos.ts', helpers), extract('src/app/actions/preferencias-avisos.ts', actions), extract('src/app/actions/notifications.ts', ['createNotification'])].join('\n');
const store = new Map();
let writes = 0, created = 0;
const context = { exports: {}, console, requireAppSession: async () => {}, hasAppSession: async () => true,
  verifySession: async () => ({ user: { userId: 'sender' } }),
  readData: async (key, fallback) => store.has(key) ? store.get(key) : fallback,
  writeData: async (key, data) => { writes++; store.set(key, data); },
  NOTIFICATION_INTERNAL_TOKEN: Symbol('internal'), WHATSAPP_AUTOMATION_INTERNAL_TOKEN: Symbol('whatsapp'),
  getNotificationsInternal: async () => [], isRecentDuplicateNotification: () => null,
  generateNotifId: () => 'synthetic-notification', COLLECTIONS: { NOTIFICACIONES: 'notifications' },
  createDocument: async () => { created++; return { success: true }; },
  require: id => {
    if (id === '@/lib/notifications/preferencias-avisos') return context.exports;
    if (id === '@/lib/auth/session-token') return { verifySession: context.verifySession };
    if (id === '@/lib/firebase/server-messaging') return { sendPushNotificationToAll: async () => {} };
    throw new Error('Unexpected dependency: ' + id);
  }
};
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, context);
const api = context.exports;
const results = [];
function record(name, ok, observed) { results.push({ name, passed: ok, observed }); }
(async () => {
  const displayed = (await api.leerPreferenciasDeAvisos()).preferences.crmUpdates.app;
  const allowed = await api.debeEnviarAvisoInterno('crmUpdates', 'app', 'sender');
  record('AV-01 default shown matches dispatch gate', displayed === allowed, { displayed, allowed });
  store.set(api.getArchivoPreferencias('target'), { crmUpdates: { app: true } });
  store.set(api.getArchivoPreferencias('sender'), { clientMessages: { app: false } });
  const result = await api.enviarAvisoConPreferencia({ userId: 'target', categoria: 'crmUpdates', notificacion: { mensaje: 'Mensaje especial' } });
  record('AV-02 sent means notification created for allowed target', result.enviado === true && created === 1 && !!result.notification, { result, created });
  store.clear(); writes = 0;
  const malformed = await api.guardarPreferenciasDeAvisos({ taskUpdates: null });
  record('AV-03 malformed preference rejected before writing', malformed.success === false && writes === 0, { malformed, writes });
  store.clear(); created = 0;
  store.set(api.getArchivoPreferencias('target'), { crmUpdates: { app: false } });
  const disabled = await api.enviarAvisoConPreferencia({ userId: 'target', categoria: 'crmUpdates', notificacion: { mensaje: 'Mensaje especial' } });
  record('CONTROL disabled target suppresses dispatch', disabled.enviado === false && created === 0, { disabled, created });
  store.clear(); created = 0;
  const enabled = await api.enviarAvisoConPreferencia({ userId: 'target', categoria: 'eventReminders', notificacion: { mensaje: 'Fiesta cercana' } });
  record('CONTROL enabled notification reaches persistence', enabled.enviado === true && created === 1 && !!enabled.notification, { enabled, created });
  console.log(JSON.stringify({ results, failed: results.filter(r => !r.passed).length }, null, 2));
  process.exitCode = results.some(r => !r.passed) ? 1 : 0;
})().catch(e => { console.error(e); process.exitCode = 2; });

