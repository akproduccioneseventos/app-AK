/**
 * Error 30 de CLAUDE.md (29/09/2026): se fusiono la entrega de Gemini sin revisar por usar un
 * numero de propuesta adivinado. El candado de `scripts/antes-de-fusionar.mjs` frena toda fusion
 * que no diga el commit exacto, o cuyo commit no sea el que paso la puerta.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const cargar = () => import(path.join(process.cwd(), 'scripts/antes-de-fusionar.mjs'));

const VERDE = 'a'.repeat(40);
const OTRO = 'b'.repeat(40);

describe('no se fusiona lo que no paso la puerta', () => {
  it('sin commit exacto, no se fusiona', async () => {
    const { decidirFusion } = await cargar();
    expect(decidirFusion({ tool_input: { pullNumber: 1243 } }, { sha: VERDE })).toMatch(/commit exacto/);
  });

  it('con un commit que no paso la puerta, no se fusiona', async () => {
    const { decidirFusion } = await cargar();
    expect(decidirFusion({ tool_input: { expectedHeadSha: OTRO } }, { sha: VERDE })).toMatch(/no es el que pasó/);
    expect(decidirFusion({ tool_input: { expectedHeadSha: VERDE } }, null)).toMatch(/no hay registro/);
  });

  it('con el commit que paso la puerta, se fusiona', async () => {
    const { decidirFusion } = await cargar();
    expect(decidirFusion({ tool_input: { expectedHeadSha: VERDE } }, { sha: VERDE })).toBeNull();
  });

  it('el candado esta enganchado a la fusion y la puerta anota el commit', () => {
    const ajustes = JSON.parse(readFileSync('.claude/settings.json', 'utf8'));
    const enganche = ajustes.hooks.PreToolUse.find((h: { matcher: string }) => h.matcher === 'mcp__github__merge_pull_request');
    expect(enganche?.hooks?.[0]?.command).toContain('antes-de-fusionar.mjs');
    const puerta = readFileSync('scripts/se-puede-publicar.mjs', 'utf8');
    expect(puerta.match(/anotarPuertaVerde\(\);/g)?.length).toBe(2);
  });
});
