// Exact Git-source modules. Pure classification and synthetic server-rendered contact only.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const root = path.resolve(__dirname, '../..');
const sha = process.argv[2] || '368988bb64e823d31c9d5c4b2fb9adc114b207ef';
function source(file) {
  return execFileSync('git', ['show', `${sha}:${file}`], { cwd: root, encoding: 'utf8' });
}
function load(file, mocks = {}) {
  const exports = {};
  const code = ts.transpileModule(source(file), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, { exports, URL, require(name) {
    if (name in mocks) return mocks[name];
    if (['react/jsx-runtime', 'lucide-react'].includes(name)) return require(name);
    throw new Error(`Unexpected dependency: ${name}`);
  } }, { filename: path.join(root, file) });
  return exports;
}
(async () => {
  const gallery = JSON.parse(source('src/data/galeria-publica.json'));
  const glitter = gallery.fotos.find(photo => photo.id === 'ak-serv-glitter-bar-01');
  assert.ok(glitter);
  assert.equal(glitter.categoria, 'Entretenimiento');
  const classifiers = load('src/components/landing/gallery-media-utils.ts');
  const category = classifiers.classifyGalleryCategories(glitter.titulo, glitter.descripcion, glitter.categoria);
  assert.equal(category[0], 'Barra de Tragos');
  assert.equal(classifiers.classifyGalleryCategories('Kebab gourmet', 'Decoracion', 'Decoracion')[0], 'Catering');
  console.log(JSON.stringify({ id: 'GAL74-CATEGORY', sha, configured: glitter.categoria, classified: category[0],
    asset: glitter.url, note: 'Image content was inspected separately: mechanical bull, not glitter.' }));

  const jsx = require('react/jsx-runtime');
  const page = load('src/app/privacidad/page.tsx', {
    'next/link': ({ children, href, ...rest }) => React.createElement('a', { href, ...rest }, children),
    '@/app/actions/settings': { getCompanyInfoPublica: async () => ({
      companyName: 'Synthetic company', companyContact: 'synthetic@example.invalid', cuentasBancariasPortal: [],
    }) },
  });
  const html = ReactDOMServer.renderToStaticMarkup(await page.default());
  assert.ok(html.includes('WhatsApp al <strong>synthetic@example.invalid</strong>'));
  console.log(JSON.stringify({ id: 'CONTACT74', sha, phoneLabelRendersEmail: true, source: 'actual async page + React server renderer',
    simulated: 'company info contains legacy email-valued companyContact; no external data read' }));
})().catch(error => { console.error(error); process.exitCode = 1; });
