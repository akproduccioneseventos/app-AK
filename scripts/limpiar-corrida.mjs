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
  // Lo escribe la prueba de las guias de armado al aplicar una a la fiesta de prueba.
  // **Se me colo commiteado una vez**, el 20 de septiembre de 2026: por eso esta en la lista.
  'data/playbook-aplicaciones.json',
  'src/data/playbook-aplicaciones.json',
  'src/data/parte-manana-cache.json',
  'src/data/ai-usage.json',
  'src/data/social-history.json',
  'src/data/prospectos.json',
  // La galeria social guarda los "me gusta" de la corrida y reescribe el archivo.
  'src/data/social-gallery/metadata.json',
  // Los escribe el recorrido de pantallas al abrir marketing y activos fijos.
  // **Aparecieron sin estar en la lista** el 21 de septiembre de 2026: quedaban como si
  // fueran trabajo pendiente, que es exactamente como se colo el de las guias de armado.
  'data/marketing-checklist.json',
  'src/data/marketing-checklist.json',
  'data/activos-fijos.json',
  'src/data/activos-fijos.json',
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
