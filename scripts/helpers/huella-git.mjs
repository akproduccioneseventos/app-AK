import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

export function leerGit(args, cwd = process.cwd()) {
  const resultado = spawnSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (resultado.error || resultado.status !== 0) {
    throw new Error(`No se pudo verificar Git: ${resultado.error?.message || resultado.stderr?.trim() || resultado.status}`);
  }
  return resultado.stdout;
}

export function calcularHuellaGit(filtros, cwd = process.cwd()) {
  const partes = [
    leerGit(['ls-files', '-s', '--', '.', ...filtros], cwd),
    leerGit(['status', '--porcelain', '--', '.', ...filtros], cwd),
    leerGit(['diff', 'HEAD', '--', '.', ...filtros], cwd),
  ];
  return createHash('sha1').update(partes.join('|')).digest('hex');
}
