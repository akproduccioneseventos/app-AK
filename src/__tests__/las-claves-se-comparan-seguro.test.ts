/** @jest-environment node */

import fs from 'fs';
import path from 'path';
import { clavesIguales } from '@/lib/security/claves-iguales';
import { GET as cleanDbGet } from '@/app/api/admin/clean-db/route';

describe('Orden 278: Bloque 2 — Comparación segura de claves', () => {
  const rootDir = path.resolve(__dirname, '..');

  describe('clavesIguales función utilitaria', () => {
    it('da verdadero con dos claves idénticas', () => {
      expect(clavesIguales('super-secret-123', 'super-secret-123')).toBe(true);
      expect(clavesIguales('a', 'a')).toBe(true);
    });

    it('da falso con claves distintas', () => {
      expect(clavesIguales('secret-a', 'secret-b')).toBe(false);
      expect(clavesIguales('abc', 'abd')).toBe(false);
    });

    it('da falso con cadenas vacías o faltantes', () => {
      expect(clavesIguales('', '')).toBe(false);
      expect(clavesIguales('', 'secret')).toBe(false);
      expect(clavesIguales('secret', '')).toBe(false);
      expect(clavesIguales(null, 'secret')).toBe(false);
      expect(clavesIguales('secret', null)).toBe(false);
      expect(clavesIguales(undefined, 'secret')).toBe(false);
      expect(clavesIguales('secret', undefined)).toBe(false);
      expect(clavesIguales(null, undefined)).toBe(false);
    });

    it('da falso con largos distintos sin lanzar excepción por tamaño de buffer', () => {
      expect(clavesIguales('short', 'much-longer-secret-token-value')).toBe(false);
      expect(clavesIguales('much-longer-secret-token-value', 'short')).toBe(false);
      expect(clavesIguales('a', 'ab')).toBe(false);
    });
  });

  describe('no quedan comparaciones con === contra la clave en los archivos del bloque 2', () => {
    const archivosYPatrones = [
      {
        archivo: 'lib/automatico/puerta-de-las-tareas.ts',
        prohibidos: ['=== claveEsperada', 'claveEsperada ===', '=== clave', 'clave ==='],
      },
      {
        archivo: 'app/api/despertar/route.ts',
        prohibidos: ['=== clave', 'clave ==='],
      },
      {
        archivo: 'app/api/admin/clean-db/route.ts',
        prohibidos: ['=== maintenanceSecret', 'maintenanceSecret ===', 'secret ==='],
      },
      {
        archivo: 'app/api/v1/marketing/insights/route.ts',
        prohibidos: ['=== secretKey', 'secretKey ==='],
      },
      {
        archivo: 'app/api/meta/webhook/route.ts',
        prohibidos: ['=== expectedToken', 'expectedToken ==='],
      },
      {
        archivo: 'app/api/cron-despachador/route.ts',
        prohibidos: ['=== cronSecret', 'cronSecret ==='],
      },
      {
        archivo: 'app/api/whatsapp/webhook/route.ts',
        prohibidos: ['=== actualVerifyToken', 'actualVerifyToken ===', '=== verifyToken'],
      },
      {
        archivo: 'app/actions/auth.ts',
        prohibidos: ['=== envPassword', 'envPassword ==='],
      },
      {
        archivo: 'app/actions/simple-auth.ts',
        prohibidos: ['=== envPassword', 'envPassword ==='],
      },
    ];

    it.each(archivosYPatrones)(
      '$archivo usa clavesIguales y no tiene comparaciones === contra la clave',
      ({ archivo, prohibidos }) => {
        const contenido = fs.readFileSync(path.join(rootDir, archivo), 'utf8');
        expect(contenido).toContain('clavesIguales');
        for (const prohibido of prohibidos) {
          expect(contenido).not.toContain(prohibido);
        }
      }
    );
  });

  describe('clean-db con clave en query string (?secret=) no autoriza', () => {
    const originalEnv = process.env.CLEAN_DB_SECRET;

    beforeAll(() => {
      process.env.CLEAN_DB_SECRET = 'clave-secreta-mantenimiento-test';
    });

    afterAll(() => {
      process.env.CLEAN_DB_SECRET = originalEnv;
    });

    it('con ?secret=correcto y sin sesión devuelve 401', async () => {
      const req = new Request('http://localhost/api/admin/clean-db?secret=clave-secreta-mantenimiento-test');
      const res = await cleanDbGet(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe('Unauthorized');
    });

    it('con cabecera Authorization errónea y sin sesión devuelve 401', async () => {
      const req = new Request('http://localhost/api/admin/clean-db', {
        headers: {
          Authorization: 'Bearer clave-incorrecta',
        },
      });
      const res = await cleanDbGet(req);
      expect(res.status).toBe(401);
    });

    it('clean-db no acepta el parámetro secret de la dirección para autorizar', () => {
      const source = fs.readFileSync(path.join(rootDir, 'app/api/admin/clean-db/route.ts'), 'utf8');
      expect(source).not.toContain("searchParams.get('secret')");
      expect(source).not.toContain('isAuthorized(request, secret)');
    });
  });
});
