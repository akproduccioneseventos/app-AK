import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT || 3100);
const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, '');
const baseURL = externalBaseUrl || `http://127.0.0.1:${port}`;

// Allows running against a Chromium already present in the machine or container
// (CI images, sandboxes) instead of forcing a Playwright browser download.
const chromiumExecutablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const chromiumLaunchOverride = chromiumExecutablePath
  ? { launchOptions: { executablePath: chromiumExecutablePath } }
  : {};

const testEnvironment = {
  NODE_OPTIONS: '--max-old-space-size=4096',
  GOOGLE_API_KEY: 'dummy',
  GEMINI_API_KEY: 'dummy',
  AK_USE_LOCAL_JSON_ONLY: 'true',
  // Habilita el guardado en archivos locales. Sin esto las pruebas solo pueden
  // comprobar que las pantallas abren; con esto se puede comprobar que un
  // invitado confirma de verdad y el dato queda registrado en el evento.
  AK_ALLOW_LOCAL_JSON_WRITES: 'true',
  AK_SESSION_SECRET: 'playwright-session-secret-with-enough-entropy',
  FIREBASE_PROJECT_ID: 'demo-ak-producciones',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-ak-producciones',
  NEXT_PUBLIC_FIREBASE_API_KEY: 'dummy',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo-ak-producciones.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'demo-ak-producciones.appspot.com',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
  NEXT_PUBLIC_FIREBASE_APP_ID: '1:000000000000:web:test',
};

const esCorridaRobot =
  process.env.PLAYWRIGHT_ROBOT_EMULATOR === 'true' ||
  process.argv.some((arg) => arg.includes('auditor-robot'));

const robotEnvironment = {
  NODE_OPTIONS: '--max-old-space-size=4096',
  GOOGLE_API_KEY: 'dummy',
  GEMINI_API_KEY: 'dummy',
  GOOGLE_APPLICATION_CREDENTIALS: '',
  FIREBASE_CLIENT_EMAIL: '',
  FIREBASE_PRIVATE_KEY: '',
  AK_SESSION_SECRET: 'playwright-session-secret-with-enough-entropy',
  FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080',
  FIREBASE_STORAGE_EMULATOR_HOST: process.env.FIREBASE_STORAGE_EMULATOR_HOST || '127.0.0.1:9199',
  FIREBASE_PROJECT_ID: 'demo-ak-producciones',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-ak-producciones',
  NEXT_PUBLIC_FIREBASE_API_KEY: 'dummy',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo-ak-producciones.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'demo-ak-producciones.appspot.com',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
  NEXT_PUBLIC_FIREBASE_APP_ID: '1:000000000000:web:test',
};

export default defineConfig({
  testDir: './tests/e2e',
  // El recorrido de las 353 pantallas se corre aparte, con `npm run recorrido`:
  // adentro de la tanda normal la haria eterna. Lo mete de vuelta el propio
  // script, que lo nombra por archivo.
  testIgnore: process.env.AK_RECORRIDO === 'true' ? [] : ['**/recorrido-de-pantallas.spec.ts'],
  timeout: 90_000,
  expect: {
    timeout: 45_000,
  },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    locale: 'es-UY',
    timezoneId: 'America/Montevideo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], ...chromiumLaunchOverride },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 7'], ...chromiumLaunchOverride },
    },
    {
      name: 'auditor-robot',
      testDir: './tests/robot',
      testIgnore: [],
      testMatch: /.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], ...chromiumLaunchOverride },
    },
  ],
  webServer: externalBaseUrl
    ? undefined
    : {
        command: `npx next dev --hostname 127.0.0.1 --port ${port}`,
        url: `${baseURL}/api/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        env: {
          ...process.env,
          ...(esCorridaRobot ? robotEnvironment : testEnvironment),
        },
      },
});
