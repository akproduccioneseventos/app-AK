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
import { unlinkSync, existsSync } from 'node:fs';

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
  // Los escribe la prueba de la barra (orden 81) al descontar botellas de un pedido.
  // **Aparecio sin estar en la lista** el 25 de septiembre de 2026.
  'src/data/insumos.json',
  // Los escriben las pruebas de la encuesta y del muro; aparecieron sin estar en la lista el
  // 25 de septiembre de 2026.
  'data/feedback.json',
  'src/data/feedback.json',
  'src/data/social-gallery/metadata.json',
  // Los escribe la prueba de la orden de evento al cargar el empleado de prueba.
  // Aparecieron sin estar en la lista el 30 de septiembre de 2026.
  'src/data/empleados.json',
  'data/empleados.json',
  'data/notification-preferences.json',
  'src/data/notification-preferences.json',
];

const statusLines = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

// Archivos ya en git modificados por la corrida (XY != '??')
const modificados = statusLines
  .filter((l) => !l.startsWith('??'))
  .map((l) => l.slice(3).trim());

// Archivos no trackeados creados por la corrida ('??' = untracked)
const noTrackeados = statusLines
  .filter((l) => l.startsWith('??'))
  .map((l) => l.slice(3).trim());

const aRestaurar = ESCRITOS_POR_LA_CORRIDA.filter((f) => modificados.includes(f));
const aBorrar = ESCRITOS_POR_LA_CORRIDA.filter((f) => noTrackeados.includes(f));

if (aRestaurar.length === 0 && aBorrar.length === 0) {
  console.log('Nada que limpiar: no quedaron datos de la corrida.');
  process.exit(0);
}

if (aRestaurar.length > 0) {
  execFileSync('git', ['checkout', '--', ...aRestaurar], { stdio: 'inherit' });
  console.log(`Restaurados ${aRestaurar.length} archivo(s) que escribio la corrida:`);
  for (const f of aRestaurar) console.log(`  ${f}`);
}

if (aBorrar.length > 0) {
  for (const f of aBorrar) {
    if (existsSync(f)) unlinkSync(f);
  }
  console.log(`Eliminados ${aBorrar.length} archivo(s) no trackeados que escribio la corrida:`);
  for (const f of aBorrar) console.log(`  ${f}`);
}
