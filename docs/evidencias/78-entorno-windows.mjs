import fs from 'node:fs';

// Audit launcher only: directory junctions do not require Windows symlink elevation.
const symlinkSync = fs.symlinkSync;
if (process.platform === 'win32') {
  fs.symlinkSync = (target, destination, type) =>
    symlinkSync(target, destination, type === 'dir' ? 'junction' : type);
}
await import('../../scripts/entorno-de-pruebas.mjs');
