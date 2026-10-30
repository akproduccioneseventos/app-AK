/** @jest-environment node */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

jest.setTimeout(20000);

const helper = pathToFileURL(resolve('scripts/helpers/huella-git.mjs')).href;
const filtros = [':(exclude)data', ':(exclude)docs', ':(exclude)*.md'];
let carpeta: string;
const git = (...args: string[]) => execFileSync('git', args, { cwd: carpeta, stdio: 'pipe' });
function huella(cwd = carpeta) {
  return spawnSync(process.execPath, ['--input-type=module', '-e',
    `import {calcularHuellaGit} from ${JSON.stringify(helper)}; console.log(calcularHuellaGit(${JSON.stringify(filtros)}, ${JSON.stringify(cwd)}));`,
  ], { encoding: 'utf8' });
}
function leerHuella() {
  const resultado = huella();
  if (resultado.status !== 0) throw new Error(resultado.stderr);
  return resultado.stdout.trim();
}

beforeEach(() => {
  carpeta = mkdtempSync(join(tmpdir(), 'ak-huella-puerta-'));
  git('init');
  git('config', 'user.name', 'Prueba AK');
  git('config', 'user.email', 'qa@example.test');
  writeFileSync(join(carpeta, 'codigo.ts'), 'export const valor = 1;\n');
  mkdirSync(join(carpeta, 'data'));
  mkdirSync(join(carpeta, 'docs'));
  writeFileSync(join(carpeta, 'data', 'prueba.json'), '[]');
  writeFileSync(join(carpeta, 'docs', 'nota.md'), 'Nota inicial');
  git('add', '.');
  git('commit', '-m', 'fixture inicial');
});
afterEach(() => {
  if (carpeta.startsWith(join(tmpdir(), 'ak-huella-puerta-'))) rmSync(carpeta, { recursive: true, force: true });
});

it('consulta Git real con filtros literales y cambia al editar y al guardar otro codigo', () => {
  const inicial = leerHuella();
  expect(inicial).toMatch(/^[a-f0-9]{40}$/);
  expect(inicial).not.toBe('c65f37b2cb1ae26c89e9b4f26e2ca9e9cde4ae5b');
  writeFileSync(join(carpeta, 'codigo.ts'), 'export const valor = 2;\n');
  expect(leerHuella()).not.toBe(inicial);
  git('add', 'codigo.ts');
  git('commit', '-m', 'otro codigo');
  expect(leerHuella()).not.toBe(inicial);
});

it('datos y documentos excluidos no invalidan la huella del codigo', () => {
  const inicial = leerHuella();
  writeFileSync(join(carpeta, 'data', 'prueba.json'), '[1]');
  writeFileSync(join(carpeta, 'docs', 'nota.md'), 'Otra nota');
  expect(leerHuella()).toBe(inicial);
  git('add', '.');
  git('commit', '-m', 'solo datos y notas');
  expect(leerHuella()).toBe(inicial);
});

it('un fallo de Git detiene el control en vez de fabricar una huella vacia', () => {
  const fuera = mkdtempSync(join(tmpdir(), 'ak-huella-sin-repo-'));
  try {
    const resultado = huella(fuera);
    expect(resultado.status).not.toBe(0);
    expect(resultado.stderr).toContain('No se pudo verificar Git');
    expect(resultado.stdout).not.toContain('c65f37b2cb1ae26c89e9b4f26e2ca9e9cde4ae5b');
  } finally {
    if (fuera.startsWith(join(tmpdir(), 'ak-huella-sin-repo-'))) rmSync(fuera, { recursive: true, force: true });
  }
});
