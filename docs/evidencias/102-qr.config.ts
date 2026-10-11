import base from '../../playwright.config';
export default {
  ...base,
  testDir: '../../tests/e2e',
  testMatch: '**/qr-archivo-rotaciones.spec.ts',
  webServer: undefined,
  use: { ...base.use, trace: 'off', video: 'off' },
  reporter: [['json', { outputFile: '../../docs/evidencias/102-qr-browser.json' }]],
  outputDir: '../../docs/evidencias/102-qr-browser-artifactos',
};
