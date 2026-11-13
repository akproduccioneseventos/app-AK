/**
 * Adenda 2 del auditor (13/11/2026): en el dominio `/sw.js` daba 404. La compilación genera el archivo en
 * `public/`, pero el paquete que atiende en Firebase (`.next/standalone`) salía sin él.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';

const cargar = () => import('../../scripts/copiar-pwa-al-standalone.mjs');

function armar(conPwa: boolean) {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-pwa-'));
  fs.mkdirSync(path.join(raiz, 'public'));
  fs.mkdirSync(path.join(raiz, '.next', 'standalone', 'public'), { recursive: true });
  fs.writeFileSync(path.join(raiz, 'public', 'manifest.webmanifest'), '{}');
  if (conPwa) {
    fs.writeFileSync(path.join(raiz, 'public', 'sw.js'), 'self.x=1');
    fs.writeFileSync(path.join(raiz, 'public', 'workbox-c8ab336a.js'), 'self.y=1');
  }
  return raiz;
}

describe('El modo sin conexión llega a la versión publicada', () => {
  it('después de compilar, sw.js y workbox quedan dentro del paquete que se publica', async () => {
    const { copiarModoSinConexion } = await cargar();
    const raiz = armar(true);
    copiarModoSinConexion(raiz);
    const publicado = path.join(raiz, '.next', 'standalone', 'public');
    expect(fs.readFileSync(path.join(publicado, 'sw.js'), 'utf8')).toBe('self.x=1');
    expect(fs.existsSync(path.join(publicado, 'workbox-c8ab336a.js'))).toBe(true);
  });

  it('si la compilación no generó sw.js, frena en vez de publicar sin modo sin conexión', async () => {
    const { copiarModoSinConexion } = await cargar();
    expect(() => copiarModoSinConexion(armar(false))).toThrow(/sin modo sin conexión/);
  });

  it('la compilación usa la copia al terminar', () => {
    const script = fs.readFileSync(path.join(process.cwd(), 'scripts', 'build-next-with-memory.mjs'), 'utf8');
    expect(script).toMatch(/copiarModoSinConexion\(process\.cwd\(\)/);
  });
});
