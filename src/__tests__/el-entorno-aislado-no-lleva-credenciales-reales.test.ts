import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

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

/**
 * Orden 93 (Codex): Next lee solo `.env.local`, `.env.production` y compañía desde la carpeta donde
 * corre, así que limpiar el ambiente del proceso no alcanzaba. Se prueba con un repositorio de
 * mentira que tiene un `.env.production` commiteado y un `.env.local` sin commitear, los dos con
 * claves inventadas y una "del futuro", más credenciales heredadas de la máquina.
 *
 * Se probó rompiéndolo: sin la copia descartable, `.env.local` y `.env.production` entran.
 */
// Cuando la prueba corre adentro de la subida (el control previo de git), git deja puestas
// GIT_DIR y compañía apuntando al repositorio VERDADERO. Con eso, el `git init` y el `commit` de
// abajo se hacían sobre el repositorio de la app: lo marcaban "sin carpeta de trabajo" y le
// dejaban un commit "base" que borraba todo (pasó el 6/10/2026). Se sacan antes de llamar a git.
const SIN_GIT = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')));

describe('El entorno aislado no lee claves de archivos', () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-repo-de-mentira-'));
  beforeAll(() => {
    const git = (...args: string[]) => execFileSync('git', ['-C', repo, ...args], { stdio: 'ignore', env: SIN_GIT });
    git('init', '-q');
    git('config', 'user.email', 'prueba@ak.local');
    git('config', 'user.name', 'Prueba');
    fs.writeFileSync(path.join(repo, 'package.json'), '{"name":"de-mentira"}');
    fs.writeFileSync(path.join(repo, '.env.production'), 'INSTAGRAM_ACCESS_TOKEN=ficticio\nCLAVE_COMMITEADA_DEL_FUTURO=x\n');
    git('add', '-A');
    git('commit', '-qm', 'base');
    fs.writeFileSync(path.join(repo, '.env.local'), 'SMTP_HOST=ficticio\nMERCADO_PAGO_ACCESS_TOKEN=ficticio\nOTRA_CLAVE_DEL_FUTURO=y\n');
  });
  afterAll(() => fs.rmSync(repo, { recursive: true, force: true }));

  const probar = (sinCopia: boolean) => {
    const r = spawnSync('node', ['scripts/entorno-de-pruebas.mjs'], {
      cwd: process.cwd(),
      env: {
        ...SIN_GIT,
        FIREBASE_PRIVATE_KEY: 'heredada',
        AK_ENTORNO_PROBAR_CARPETA: repo,
        AK_ENTORNO_PROBAR_SIN_COPIA: String(sinCopia),
      },
      encoding: 'utf8',
      timeout: 60_000,
    });
    if (r.status !== 0) throw new Error(r.stderr);
    return JSON.parse(r.stdout) as { nombres: string[]; sobran: string[] };
  };

  it('el control ve las claves de los archivos cuando la app corre en la carpeta original', () => {
    const { sobran } = probar(true);
    expect(sobran).toEqual(expect.arrayContaining(['SMTP_HOST', 'OTRA_CLAVE_DEL_FUTURO', 'INSTAGRAM_ACCESS_TOKEN']));
  });

  it('en la copia descartable, lo que ve Next no trae ninguna clave: ni heredada, ni de archivos, ni futura', () => {
    const { nombres, sobran } = probar(false);
    expect(sobran).toEqual([]);
    for (const n of ['FIREBASE_PRIVATE_KEY', 'SMTP_HOST', 'MERCADO_PAGO_ACCESS_TOKEN', 'INSTAGRAM_ACCESS_TOKEN',
      'OTRA_CLAVE_DEL_FUTURO', 'CLAVE_COMMITEADA_DEL_FUTURO']) {
      expect(nombres).not.toContain(n);
    }
    // Y el `.env.local` del usuario sigue donde estaba: no se toca.
    expect(fs.existsSync(path.join(repo, '.env.local'))).toBe(true);
  });
});

