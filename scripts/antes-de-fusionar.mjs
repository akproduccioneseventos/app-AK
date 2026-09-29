#!/usr/bin/env node
/**
 * Candado antes de fusionar (error 30 de CLAUDE.md, 29/09/2026).
 *
 * Claude Code lo corre antes de cada `mcp__github__merge_pull_request`. La fusion sale SOLO si:
 *   1. dice exactamente que commit se fusiona (`expectedHeadSha`, 40 letras), y
 *   2. ese commit es el ultimo que paso `npm run "publicar?"` (`.ak-puerta-verde.json`).
 * Asi no se puede fusionar una propuesta por numero adivinado, ni una entrega sin revisar:
 * GitHub rechaza la fusion si la propuesta apunta a otro commit.
 */
import { existsSync, readFileSync } from 'node:fs';

export function decidirFusion(entrada, puertaVerde) {
  const sha = String(entrada?.tool_input?.expectedHeadSha ?? '').trim();
  if (!/^[0-9a-f]{40}$/.test(sha)) {
    return 'No se fusiona sin decir qué commit exacto se fusiona (expectedHeadSha de 40 caracteres).';
  }
  if (!puertaVerde?.sha) {
    return 'No se fusiona: no hay registro de que la puerta ("publicar?") haya pasado sobre ningún commit.';
  }
  if (puertaVerde.sha !== sha) {
    return `No se fusiona: el commit ${sha.slice(0, 9)} no es el que pasó la puerta (${puertaVerde.sha.slice(0, 9)}). Corré "publicar?" sobre ese commit primero.`;
  }
  return null;
}

async function principal() {
  let texto = '';
  for await (const pedazo of process.stdin) texto += pedazo;
  let entrada = {};
  try { entrada = JSON.parse(texto || '{}'); } catch {}
  let puerta = null;
  try { if (existsSync('.ak-puerta-verde.json')) puerta = JSON.parse(readFileSync('.ak-puerta-verde.json', 'utf8')); } catch {}
  const motivo = decidirFusion(entrada, puerta);
  if (motivo) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: motivo },
    }));
  }
}

if (process.argv[1] && process.argv[1].endsWith('antes-de-fusionar.mjs')) principal();
