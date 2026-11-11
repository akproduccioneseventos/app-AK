/** @jest-environment node */

import fs from 'fs';
import path from 'path';
import { GET as cronDespachadorGet } from '@/app/api/cron-despachador/route';

describe('Orden 278: Bloque 1 — El despertador lleva la clave y las tareas automáticas la exigen', () => {
  const repoRoot = path.resolve(__dirname, '..', '..');

  it('functions/src/index.ts declara secrets: [\'CRON_SECRET\'] en el despertador', () => {
    const functionsCode = fs.readFileSync(path.join(repoRoot, 'functions', 'src', 'index.ts'), 'utf8');
    expect(functionsCode).toContain("secrets: ['CRON_SECRET']");
    expect(functionsCode).toContain('despertadorTareasAutomaticas');
  });

  it('apphosting.yaml define CRON_SECRET como secret: y nunca como value:', () => {
    const apphostingYaml = fs.readFileSync(path.join(repoRoot, 'apphosting.yaml'), 'utf8');
    expect(apphostingYaml).toContain('- variable: CRON_SECRET');
    expect(apphostingYaml).toContain('secret: cron-secret');

    // Extraer bloque de CRON_SECRET
    const cronSecretMatch = apphostingYaml.match(/- variable: CRON_SECRET[\s\S]*?(?=- variable:|$)/);
    expect(cronSecretMatch).toBeTruthy();
    const cronSecretBlock = cronSecretMatch![0];
    expect(cronSecretBlock).toContain('secret: cron-secret');
    expect(cronSecretBlock).not.toContain('value:');
  });

  it('src/app/api/cron-despachador/route.ts no contiene if (!cronSecret) return true;', () => {
    const routeCode = fs.readFileSync(
      path.join(repoRoot, 'src', 'app', 'api', 'cron-despachador', 'route.ts'),
      'utf8'
    );
    expect(routeCode).not.toContain('if (!cronSecret) return true;');
  });

  describe('comportamiento de src/app/api/cron-despachador/route.ts', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it('en producción sin CRON_SECRET devuelve 503', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.CRON_SECRET;
      delete process.env.TAREAS_SECRET;

      const req = new Request('http://localhost/api/cron-despachador');
      const res = await cronDespachadorGet(req);

      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.error).toMatch(/CRON_SECRET/);
    });

    it('con CRON_SECRET configurado, sin clave o con clave incorrecta devuelve 401', async () => {
      process.env.CRON_SECRET = 'secreto-cron-test';
      delete process.env.TAREAS_SECRET;

      const reqSinClave = new Request('http://localhost/api/cron-despachador');
      const resSinClave = await cronDespachadorGet(reqSinClave);
      expect(resSinClave.status).toBe(401);

      const reqClaveErronea = new Request('http://localhost/api/cron-despachador', {
        headers: { Authorization: 'Bearer clave-erronea' },
      });
      const resClaveErronea = await cronDespachadorGet(reqClaveErronea);
      expect(resClaveErronea.status).toBe(401);
    });
  });
});
