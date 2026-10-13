import fs from 'node:fs';
import crypto from 'node:crypto';
import ts from 'typescript';
import { test, expect } from '@playwright/test';

test('el PNG UUID que fallaba se lee sin modificar su token', async ({ page }) => {
  const bytes = fs.readFileSync('docs/evidencias/101-artifactos/101-qr-01-0.png');
  expect(crypto.createHash('sha256').update(bytes).digest('hex')).toBe('178ee11b19547512912630eaca90474726b0244b409b2afa73ba92a677c62498');
  await page.setContent('<div id="reader" style="width:100%"></div>');
  await page.addScriptTag({ path: 'node_modules/html5-qrcode/html5-qrcode.min.js' });
  const compiled = ts.transpileModule(fs.readFileSync('src/lib/qr/lectura-archivo-con-rotaciones.ts', 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
  }).outputText;
  await page.addScriptTag({ content: 'var exports = {};' + compiled });
  const result = await page.evaluate(async data => {
    const api = window as any;
    const file = new File([await (await fetch('data:image/png;base64,' + data)).blob()], 'uuid.png', { type: 'image/png' });
    const reader = new api.Html5Qrcode('reader');
    let initialError = '';
    try { await reader.scanFileV2(file, false); } catch (error) { initialError = String(error); }
    const cameraMethod = api.Html5Qrcode.prototype.start;
    api.exports.habilitarReintentoQrGirado(api.Html5Qrcode);
    const installed = api.Html5Qrcode.prototype.scanFileV2;
    api.exports.habilitarReintentoQrGirado(api.Html5Qrcode);
    const decoded = (await reader.scanFileV2(file, false)).decodedText;
    return { initialError, decoded, idempotent: installed === api.Html5Qrcode.prototype.scanFileV2, cameraUnchanged: cameraMethod === api.Html5Qrcode.prototype.start };
  }, bytes.toString('base64'));
  expect(result.initialError).toContain('No MultiFormat Readers');
  expect(result.decoded).toBe('http://127.0.0.1:3300/evento/accesos/e2e_99_qr_uuid_1791695586308?fiestaId=e2e_99_qr_uuid_1791695586308&token=11111111-2222-4333-8444-555555555555&guestId=g99uuid');
  expect(result.idempotent).toBe(true);
  expect(result.cameraUnchanged).toBe(true);
});
