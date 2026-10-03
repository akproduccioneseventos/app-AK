const fs = require('node:fs');
const path = require('node:path');
const [root, output] = process.argv.slice(2);
const { chromium } = require(path.join(root, 'node_modules/playwright'));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'no-preference' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto('http://127.0.0.1:3311/', { waitUntil: 'domcontentloaded', timeout: 90000 });
    const hero = page.locator('[data-testid="hero-resplandor"]');
    await hero.waitFor({ state: 'visible', timeout: 45000 });
    const samples = [];
    for (let index = 0; index < 10; index++) {
      samples.push(await hero.evaluate(el => {
        const style = getComputedStyle(el);
        const box = el.getBoundingClientRect();
        return { time: performance.now(), transform: style.transform, opacity: style.opacity,
          width: box.width, height: box.height, animations: el.getAnimations().map(a => ({ state: a.playState, time: a.currentTime })) };
      }));
      await page.waitForTimeout(900);
    }
    const result = { samples, errors, changed: new Set(samples.map(s => s.transform)).size > 1,
      timestamp: new Date().toISOString(), url: page.url() };
    fs.writeFileSync(output, JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
  } finally { await browser.close(); }
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
