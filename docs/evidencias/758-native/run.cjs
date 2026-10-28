const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const webpack = require('webpack');
const { chromium, devices } = require('playwright');

(async () => {
  const repo = process.cwd(); const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ak-758-native-'));
  const fixture = path.join(repo, 'docs/evidencias/758-native');
  await new Promise((resolve, reject) => webpack({ mode: 'production', devtool: false, entry: path.join(fixture, 'entry.tsx'),
    plugins: [new webpack.DefinePlugin({ 'process.env': JSON.stringify({ NODE_ENV: 'production' }) })],
    output: { path: dir, filename: 'app.js' }, optimization: { minimize: false },
    resolve: { extensions: ['.ts', '.tsx', '.js', '.json'], alias: {
      '@/app/actions/decoracion-catalogo$': path.join(fixture, 'actions.ts'),
      '@/app/actions/deco-canvas-templates$': path.join(fixture, 'actions.ts'), '@': path.join(repo, 'src'),
    } },
    module: { rules: [{ test: /\.tsx?$/, exclude: /node_modules/, use: path.join(fixture, 'loader.cjs') }] },
  }, (error, stats) => error || stats.hasErrors() ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));
  const child = require('node:child_process').spawnSync(process.execPath, [require.resolve('tailwindcss/lib/cli.js'), '-i', 'src/app/globals.css', '-o', path.join(dir, 'style.css')], { cwd: repo, encoding: 'utf8', maxBuffer: 1024 * 1024 });
  if (child.status) throw new Error(child.stderr);
  const server = http.createServer(async (req, res) => {
    try {
      if (req.url === '/') { res.setHeader('Content-Type', 'text/html; charset=utf-8'); return res.end('<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script src="/app.js"></script></body></html>'); }
      const name = req.url.split('?')[0];
      const file = name.startsWith('/media/decoracion-ak/') ? path.join(repo, 'public', name) : path.join(dir, name);
      if (!file.startsWith(dir + path.sep) && !file.startsWith(path.join(repo, 'public/media/decoracion-ak') + path.sep)) throw new Error('path');
      res.setHeader('Content-Type', name.endsWith('.js') ? 'text/javascript' : name.endsWith('.css') ? 'text/css' : 'image/png');
      res.end(await fs.readFile(file));
    } catch { res.statusCode = 404; res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true }); const results = [];
  try {
    for (const [name, options] of [['PC', { viewport: { width: 1440, height: 1000 } }], ['Pixel7', devices['Pixel 7']]]) {
      const context = await browser.newContext(options); const page = await context.newPage();
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:') ? route.continue() : route.abort());
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      await page.getByText('Revisión', { exact: true }).waitFor();
      await page.waitForTimeout(1000);
      await fs.writeFile(path.join(fixture, `${name}-startup.json`), JSON.stringify({ errors, text: (await page.locator('body').innerText()).slice(0, 4000) }, null, 2));
      await page.getByRole('button', { name: 'Revisar Decoracion de prueba', exact: true }).click();
      await page.locator('input#draft-template-name').fill(`AK aprobada ${name}`);
      // The actual canvas selects with pointer-down; the toolbar then edits the real PNG tint.
      const image = page.locator('img[alt="ak_deco_v2_AK-001"]');
      await image.scrollIntoViewIfNeeded();
      const original = await image.boundingBox();
      await page.mouse.move(original.x + original.width / 2, original.y + original.height / 2);
      await page.mouse.down(); await page.mouse.move(original.x + original.width / 2 + 12, original.y + original.height / 2 + 8, { steps: 3 }); await page.mouse.up();
      await page.getByLabel('Color del elemento seleccionado').fill('#00ff00');
      await page.getByLabel('Escala del elemento seleccionado').fill('1.5');
      if (!(await image.evaluate(el => el.complete && el.naturalWidth > 0))) throw new Error('Asset PNG no renderizado');
      const piece = await image.boundingBox(); const canvas = await page.locator('[data-deco-canvas]').boundingBox();
      if (!piece || !canvas || piece.x < canvas.x - 1 || piece.x + piece.width > canvas.x + canvas.width + 1) throw new Error('Pieza cortada en el lienzo');
      await page.screenshot({ path: path.join(fixture, `${name}-review.png`), fullPage: true });
      await page.getByRole('button', { name: 'Aprobar plantilla', exact: true }).click();
      await page.getByText(`AK aprobada ${name}`, { exact: true }).waitFor();
      await page.reload(); await page.getByText(`AK aprobada ${name}`, { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Usar esta plantilla', exact: true }).click();
      const applied = JSON.parse(await page.locator('#applied').textContent());
      if (applied.elementos[0].tintColor !== '#00ff00' || applied.elementos[0].escala !== 1.5 || applied.elementos[0].x <= 455) throw new Error('Edicion no preservada');
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) throw new Error('Desborde horizontal');
      await page.screenshot({ path: path.join(fixture, `${name}-approved.png`), fullPage: true });
      results.push({ name, result: 'PASS', scope: 'Real gallery/library/canvas, browser-only transport double, no live AI or backend' });
      await context.close();
    }
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
  await fs.writeFile(path.join(fixture, 'result.json'), JSON.stringify({ results, fixture: dir }, null, 2));
  console.log(JSON.stringify(results));
})().catch(error => { console.error(error); process.exitCode = 1; });
