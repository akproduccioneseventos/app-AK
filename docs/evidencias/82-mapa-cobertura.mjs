import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { estadoReal } from '../../scripts/codex-limpio.mjs';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const sha = git('rev-parse', 'HEAD');
const files = git('ls-files', 'src').split(/\r?\n/).filter(Boolean);
const areas = JSON.parse(fs.readFileSync('docs/codex/areas.json', 'utf8')).areas;
const matches = (file, prefix) => file === prefix || file.startsWith(`${prefix.replace(/\/$/, '')}/`);
const covered = (file) => areas.some((area) => area.carpetas.some((prefix) => matches(file, prefix)));
const runtime = files.filter((file) => !/(^|\/)(__tests__|__mocks__)(\/|$)|\.(test|spec)\.[cm]?[jt]sx?$/.test(file));
const unmapped = runtime.filter((file) => !covered(file));
const permissions = areas.find((area) => area.id === 'permisos');
if (!permissions) throw new Error('Falta el area permisos.');
const changedFile = 'src/app/actions/auth.ts';
// Simulated Git response; no app file is changed. It follows the current path filter.
const simulatedGit = (args) => {
  const prefixes = args.slice(args.indexOf('--') + 1);
  if (!prefixes.some((prefix) => matches(changedFile, prefix))) return '';
  return args[0] === 'diff' ? `${changedFile}\n` : '';
};
const result = {
  docHead: sha, sourceBase: '1b57abbec5162402cc30269cc276398707b28d55',
  areas: areas.length, prefixes: areas.reduce((sum, area) => sum + area.carpetas.length, 0),
  missingPrefixes: areas.flatMap((area) => area.carpetas.filter((prefix) => !files.some((file) => matches(file, prefix)))),
  sourceFiles: files.length, sourceCovered: files.filter(covered).length,
  runtimeFiles: runtime.length, runtimeCovered: runtime.filter(covered).length,
  unreviewedStates: areas.filter((area) => area.estado === 'sin-revisar').map((area) => area.id),
  unclassifiedRuntime: unmapped,
  simulatedInvalidation: {
    area: permissions.id, hypotheticalState: 'limpia', changedFile,
    actualResult: estadoReal({ ...permissions, estado: 'limpia', commit: sha }, simulatedGit),
    expectedResult: 'volver-a-mirar', simulationOnly: true,
  },
  interpretation: 'Fuera del mapa no significa sin pruebas ni defecto funcional; no usar el contador para certificar cobertura completa.',
};
fs.writeFileSync('docs/evidencias/82-mapa-cobertura.json', `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ areas: result.areas, prefixes: result.prefixes,
  sourceFiles: result.sourceFiles, sourceCovered: result.sourceCovered,
  runtimeFiles: result.runtimeFiles, runtimeCovered: result.runtimeCovered,
  unclassifiedRuntime: unmapped.length, missingPrefixes: result.missingPrefixes,
  simulatedInvalidation: result.simulatedInvalidation }));
