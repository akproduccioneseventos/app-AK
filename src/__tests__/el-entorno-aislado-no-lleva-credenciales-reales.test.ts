import { spawnSync } from 'node:child_process';

/**
 * MATAFUEGO — El entorno de pruebas aislado (`npm run entorno:pruebas`, orden 92) no puede llevar
 * ninguna credencial real. Codex prueba ahí lo interno por rol; si una clave de la base o de cobros
 * se colara, las pruebas escribirían en fiestas y cobros de verdad.
 *
 * El servidor arranca con un ambiente armado desde cero. Se probó rompiéndolo: copiando el ambiente
 * de la máquina entero (`...process.env`), esta prueba se pone en rojo.
 */
describe('El entorno aislado no lleva credenciales reales', () => {
  const REALES = {
    FIREBASE_PRIVATE_KEY: 'clave-real',
    FIREBASE_CLIENT_EMAIL: 'cuenta@real',
    GOOGLE_APPLICATION_CREDENTIALS: '/ruta/real.json',
    FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
    MERCADO_PAGO_ACCESS_TOKEN: 'mp-real',
    INSTAGRAM_ACCESS_TOKEN: 'ig-real',
    WHATSAPP_TOKEN: 'wa-real',
    GMAIL_CLIENT_SECRET: 'gmail-real',
    SMTP_HOST: 'smtp.real',
    GOOGLE_CLIENT_SECRET: 'google-real',
    UNA_CLAVE_QUE_TODAVIA_NO_EXISTE: 'nueva',
  };

  const r = spawnSync('node', ['scripts/entorno-de-pruebas.mjs'], {
    cwd: process.cwd(),
    env: { ...process.env, ...REALES, AK_ENTORNO_SOLO_MOSTRAR_AMBIENTE: 'true' },
    encoding: 'utf8',
    timeout: 20_000,
  });
  const salida = JSON.parse(r.stdout);

  it('ninguna credencial de la máquina llega al servidor, tampoco una que se agregue mañana', () => {
    expect(r.status).toBe(0);
    for (const nombre of Object.keys(REALES)) expect(salida.nombres).not.toContain(nombre);
  });

  it('corre con datos locales, proyecto de demostración y la IA apagada', () => {
    expect(salida.forzadas.AK_USE_LOCAL_JSON_ONLY).toBe('true');
    expect(salida.forzadas.FIREBASE_PROJECT_ID).toMatch(/^demo-/);
    expect(salida.forzadas.GOOGLE_API_KEY).toBe('dummy');
    expect(salida.forzadas.APP_PASSWORD).toBeTruthy();
  });
});
