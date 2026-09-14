const fs = require('node:fs');
const vm = require('node:vm');
const ts = require(process.env.AUDIT_TYPESCRIPT || 'typescript');
const source = ts.createSourceFile('card.tsx', fs.readFileSync(process.argv[2], 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let fn;
function visit(n) {
  if (ts.isVariableDeclaration(n) && n.name.getText(source) === 'handleOneTouchPublish') fn = n.initializer.getText(source);
  ts.forEachChild(n, visit);
}
visit(source);
if (!fn) throw Error('Missing real callback');
async function probe(opened, clipboard) {
  const messages = [];
  const scope = { post: {platform:'Instagram',text:'Texto de prueba'},
    adaptTextForPlatform: (_,text) => text, getOneTouchActionUrl: () => 'https://example.invalid',
    window: {open: () => opened ? {} : null},
    navigator: clipboard ? {clipboard:{writeText: async () => {throw Error('Denied');}}} : {},
    setCopiedText: () => {}, toast: m => messages.push(m), setTimeout: () => {}, ONE_TOUCH_CONFIGS:{} };
  const run = vm.runInNewContext(ts.transpileModule('const run = '+fn+'; run;', {compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText,scope);
  run(); await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  const saysOpened = messages.some(m => /se abri[oó]/i.test(m.description));
  return {opened,clipboard,messages,passed: messages.length > 0 && saysOpened === opened};
}
(async()=>{const results=[await probe(true,true),await probe(false,true),await probe(false,false)]; console.log(JSON.stringify(results,null,2));process.exitCode=results.every(r=>r.passed)?0:1;})();

