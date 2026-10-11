const fs = require('node:fs');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent('<div id="reader" style="width:1000px"></div>');
    await page.addScriptTag({ path: 'node_modules/html5-qrcode/html5-qrcode.min.js' });
    const data = fs.readFileSync('docs/evidencias/101-artifactos/101-qr-01-0.png').toString('base64');
    const results = await page.evaluate(async data => {
      const scanner = new Html5Qrcode('reader', { formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE] });
      const image = new Image(); image.src = 'data:image/png;base64,' + data; await image.decode();
      const output = [];
      for (const rotation of [0, 90, 180, 270]) {
        for (const scale of [1, 2, 3]) {
          const canvas = document.createElement('canvas'); canvas.width = canvas.height = image.width * scale;
          const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
          ctx.translate(canvas.width / 2, canvas.height / 2); ctx.rotate(rotation * Math.PI / 180);
          ctx.drawImage(image, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
          try { output.push({ rotation, scale, text: (await scanner.qrcode.decodeAsync(canvas)).text }); }
          catch (error) { output.push({ rotation, scale, error: String(error) }); }
        }
      }
      return output;
    }, data);
    fs.writeFileSync('docs/evidencias/102-qr-decoder-probe.json', JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results));
    const ts = require('typescript');
    const compiled = ts.transpileModule(fs.readFileSync('src/lib/qr/lectura-archivo-con-rotaciones.ts', 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
    }).outputText;
    await page.addScriptTag({ content: 'var exports = {};' + compiled });
    const proof = await page.evaluate(async data => {
      const file = new File([await (await fetch('data:image/png;base64,' + data)).blob()], 'same-uuid.png', { type: 'image/png' });
      const plain = new Html5Qrcode('reader'); let error;
      try { await plain.scanFileV2(file, false); } catch (e) { error = String(e); }
      if (!error) throw Error('The original decoder must fail on this exact file');
      exports.habilitarReintentoQrGirado(Html5Qrcode);
      exports.habilitarReintentoQrGirado(Html5Qrcode);
      const result = await plain.scanFileV2(file, false);
      return { originalError: error, decoded: result.decodedText };
    }, data);
    if (!proof.decoded.includes('token=11111111-2222-4333-8444-555555555555&guestId=g99uuid')) throw Error('Payload changed');
    fs.writeFileSync('docs/evidencias/102-qr-rotacion-corregida.json', JSON.stringify(proof, null, 2));
    console.log(JSON.stringify(proof));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
