import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Windows junctions do not need the privilege required for directory symlinks.
const original = fs.symlinkSync.bind(fs);
const expectedTarget = path.resolve(process.cwd(), 'node_modules');
fs.symlinkSync = (target, destination, type) => {
  try {
    return original(target, destination, type);
  } catch (error) {
    const parent = path.dirname(path.resolve(destination));
    const isolated = path.dirname(parent) === path.resolve(os.tmpdir())
      && path.basename(parent).startsWith('ak-entorno-aislado-');
    if (process.platform !== 'win32' || error.code !== 'EPERM' || type !== 'dir'
      || path.resolve(target) !== expectedTarget || !isolated
      || path.basename(destination) !== 'node_modules') throw error;
    return original(path.resolve(target), destination, 'junction');
  }
};
