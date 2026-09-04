#!/usr/bin/env node
/**
 * Borra lo que escriben solas las pruebas y que NUNCA va al repositorio.
 *
 * Al correr las pruebas de navegador, la app escribe datos de verdad: avisos, el
 * contador de gasto de inteligencia artificial, el historial de redes del dia y
 * un prospecto de prueba. Aparecen como cambios sin guardar y confunden: parece
 * que hay trabajo pendiente cuando no lo hay, y con las prisas alguien los sube.
 *
 * Esto los descarta de una. Se corre despues de cada tanda de pruebas.
 */
import { execFileSync } from 'node:child_process';

const ESCRITOS_POR_LA_CORRIDA = [
  'data/notifications.json',
  'src/data/notifications.json',
  'src/data/parte-manana-cache.json',
  'src/data/ai-usage.json',
  'src/data/social-history.json',
  'src/data/prospectos.json',
  // La galeria social guarda los "me gusta" de la corrida y reescribe el archivo.
  'src/data/social-gallery/metadata.json',
];

const sucios = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' })
  .split('\n')
  .map((l) => l.slice(3).trim())
  .filter(Boolean);

const aLimpiar = ESCRITOS_POR_LA_CORRIDA.filter((f) => sucios.includes(f));

if (aLimpiar.length === 0) {
  console.log('Nada que limpiar: no quedaron datos de la corrida.');
  process.exit(0);
}

execFileSync('git', ['checkout', '--', ...aLimpiar], { stdio: 'inherit' });
console.log(`Descartados ${aLimpiar.length} archivo(s) que escribio la corrida:`);
for (const f of aLimpiar) console.log(`  ${f}`);
