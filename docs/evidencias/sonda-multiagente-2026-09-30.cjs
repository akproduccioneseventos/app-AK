const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '../.audit-runtime-62dcb2c/akproduccioneseventos-app-AK-62dcb2c');
const ts = require(require.resolve('typescript', { paths: [root] }));
function load(file, mocks) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  vm.runInNewContext(js, { exports, console, require: key => {
    if (!(key in mocks)) throw Error('Unexpected import: ' + key);
    return mocks[key];
  } });
  return exports;
}
const clone = x => JSON.parse(JSON.stringify(x));
async function race(file, field, exportName, inputs, extraMocks = {}) {
  let state = { [field]: [] };
  let reads = 0;
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const mod = load(file, { ...extraMocks, '@/lib/data-service': {
    readData: async () => { const old = clone(state); if (++reads === 2) release(); await gate; return old; },
    writeData: async (_, value) => { state = clone(value); },
  } });
  const returns = await Promise.all(inputs.map(input => mod[exportName](input)));
  return { returned: returns.length, persisted: state[field].length };
}
async function task(data) {
  let written = null;
  const tasks = [
    { id: 'salon', texto: 'Confirmar proveedor del salon', completada: false },
    { id: 'comida', texto: 'Confirmar proveedor de comida', completada: false },
  ];
  const mod = load('src/app/actions/multiagent.ts', {
    '@/lib/multiagent/memory-store': { saveAgentLearning: async () => {}, listAgentMemoryProfiles: async () => [] },
    '@/lib/multiagent/chat-store': { appendMultiAgentChatTurn: async () => ({id:'fake'}), listMultiAgentChatSessions: async () => [] },
    '@/lib/multiagent/diagnostics': {},
    '@/app/actions/fiesta/fiesta.actions': { getFiestaById: async () => ({id:'fake-fiesta', tareas:clone(tasks)}) },
    '@/lib/notifications/create-notification': {},
    '@/lib/auth/session-token': { verifySession: async () => ({success:true}) },
    '@/lib/auth/require-session': { requireAppSession: async () => ({}) },
    '@/ai/flows/multiagent-flow': { runMultiAgent: async () => ({success:true,response:'Pedido',agentType:'fiesta',agentName:'Test',action:{type:'complete_task',data}}) },
    '@/app/actions/fiesta/tareas.actions': { updateTareas: async (_, value) => { written = clone(value); return {success:true}; } },
    '@/lib/fiesta/lectura-completa': { LECTURA_COMPLETA: Symbol('test') },
  });
  const result = await mod.sendPersistentMultiAgentMessage({message:'Pedido ficticio', fiestaId:'fake-fiesta', agentType:'fiesta'});
  return { input:data, completedIds:written?.filter(t=>t.completada).map(t=>t.id) ?? [], response:result.response };
}
(async () => {
  const result = {
    sha:'62dcb2cb4df718a81c3654028199e49628367d8c',
    method:'real TS functions, mocked persistence/auth/model, no network',
    chat:await race('src/lib/multiagent/chat-store.ts','sessions','appendMultiAgentChatTurn', ['A','B'].map(x=>({agentType:'fiesta',agentName:'Test',fiestaId:x,userMessage:x,assistantMessage:'respuesta'}))),
    memory:await race('src/lib/multiagent/memory-store.ts','profiles','saveAgentLearning', ['A','B'].map(x=>({agentType:'fiesta',fiestaId:x,title:x,content:x})), {'@/lib/multiagent/manual-ak':{AK_MANUAL_VERSION:'test',getManualLearningSeed:()=>''}}),
    ambiguous:await task({texto:'Confirmar proveedor'}),
    exactIdConflict:await task({tareaId:'comida',texto:'Confirmar proveedor'}),
  };
  fs.writeFileSync(path.join(__dirname,'multiagent-62dcb2c-result.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));
})();

