import fs from 'node:fs';
import path from 'node:path';

/**
 * EL MODO SIN CONEXIÓN LLEGA A LA VERSIÓN PUBLICADA (adenda 2 del auditor, 13/11/2026).
 *
 * `next-pwa` genera `public/sw.js` y `public/workbox-*.js` DURANTE la compilación, pero el paquete
 * `.next/standalone` (que es lo que atiende en Firebase App Hosting) copia `public/` sin ellos: en el
 * dominio `/sw.js` daba 404 y el navegador no podía registrar el modo sin conexión. Las pruebas no lo
 * veían porque corren con `next start`, que sirve `public/` directo.
 *
 * Después de compilar se copian al paquete y se comprueba que estén. Si la compilación generó el
 * paquete y faltan, se frena: mejor no publicar que publicar sin modo sin conexión.
 */
export function archivosDelModoSinConexion(publicDir) {
  if (!fs.existsSync(publicDir)) return [];
  return fs.readdirSync(publicDir).filter((n) => n === 'sw.js' || /^workbox-[\w-]+\.js$/.test(n));
}

export function copiarModoSinConexion(raiz = process.cwd(), { pwaApagado = false } = {}) {
  const publicDir = path.join(raiz, 'public');
  const destino = path.join(raiz, '.next', 'standalone', 'public');
  if (pwaApagado || !fs.existsSync(path.join(raiz, '.next', 'standalone'))) return { copiados: [], salteado: true };

  const archivos = archivosDelModoSinConexion(publicDir);
  if (!archivos.includes('sw.js') || !archivos.some((n) => n.startsWith('workbox-'))) {
    throw new Error('La compilación no generó sw.js y workbox en public/: la versión publicada saldría sin modo sin conexión.');
  }
  fs.mkdirSync(destino, { recursive: true });
  for (const nombre of archivos) fs.copyFileSync(path.join(publicDir, nombre), path.join(destino, nombre));

  const faltan = archivos.filter((n) => !fs.existsSync(path.join(destino, n)));
  if (faltan.length) throw new Error(`No quedaron en el paquete publicado: ${faltan.join(', ')}`);
  return { copiados: archivos, salteado: false };
}
