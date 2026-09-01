#!/usr/bin/env node
/**
 * ¿La orden se hizo, o sólo se dijo que se hizo?
 *
 * ES EL AGUJERO QUE TENÍA EL MECANISMO, y lo señaló el dueño el 1 de septiembre
 * de 2026: *"sigue pasando cosas que no están"*.
 *
 * La puerta (`npm run "publicar?"`) detecta lo que se agrega MAL: código que no
 * llama nadie, pantallas sin prueba, cosas que no compilan. **Pero no detecta lo
 * que no se hizo.** Si alguien dice "la orden está completa" y no programó nada,
 * no hay nada que se ponga en rojo: no falta ninguna prueba, no hay código
 * muerto, todo compila. **El silencio pasa el control.**
 *
 * Ese día se entregaron siete órdenes "completas" y dos no se habían tocado: el
 * álbum del recuerdo (cero) y la vidriera de la tecnología (la mitad).
 *
 * Esto lo cierra: cada orden declara **cómo se comprueba que está hecha**, en un
 * bloque ```comprobar, y este control lo verifica solo. Tres formas:
 *
 *     archivo: src/app/evento/album/[fiestaId]/libro/page.tsx
 *     usa: modoCine en src/app/evento/muro-en-vivo/[fiestaId]/page.tsx
 *     prueba: tests/e2e/el-album-del-recuerdo.spec.ts
 *
 * "usa" es la más importante: no alcanza con que el nombre exista en algún lado,
 * tiene que aparecer **en la pantalla que lo va a usar**.
 *
 * NO frena la publicación: informa. Una orden a medias no es un error del
 * código, es trabajo que falta, y eso lo decide el dueño.
 */
import fs from 'node:fs';
import path from 'node:path';

const CARPETA = path.join(process.cwd(), 'docs', 'ordenes');

function leerComprobaciones(texto) {
  const bloques = [...texto.matchAll(/```comprobar\r?\n([\s\S]*?)```/g)];
  return bloques.flatMap((b) =>
    b[1]
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'))
      .map((linea) => {
        const [tipo, ...resto] = linea.split(':');
        return { tipo: tipo.trim(), valor: resto.join(':').trim(), linea };
      }),
  );
}

function comprobar(c) {
  if (c.tipo === 'archivo' || c.tipo === 'prueba') {
    return fs.existsSync(path.join(process.cwd(), c.valor));
  }
  if (c.tipo === 'usa') {
    // "usa: nombre en ruta/al/archivo.tsx"
    const m = c.valor.match(/^(.+?)\s+en\s+(.+)$/);
    if (!m) return false;
    const [, simbolo, archivo] = m;
    const ruta = path.join(process.cwd(), archivo.trim());
    if (!fs.existsSync(ruta)) return false;
    return fs.readFileSync(ruta, 'utf8').includes(simbolo.trim());
  }
  return false;
}

const archivos = fs.existsSync(CARPETA)
  ? fs.readdirSync(CARPETA).filter((f) => f.endsWith('.md')).sort()
  : [];

const conComprobaciones = [];
const sinComprobaciones = [];

for (const archivo of archivos) {
  const texto = fs.readFileSync(path.join(CARPETA, archivo), 'utf8');
  const checks = leerComprobaciones(texto);
  if (checks.length === 0) {
    sinComprobaciones.push(archivo);
    continue;
  }
  const fallan = checks.filter((c) => !comprobar(c));
  conComprobaciones.push({ archivo, total: checks.length, fallan });
}

console.log('='.repeat(60));
console.log('  ¿LAS ÓRDENES SE HICIERON, O SÓLO SE DIJO QUE SÍ?');
console.log('='.repeat(60));

if (conComprobaciones.length === 0) {
  console.log('\nNinguna orden dice todavía cómo se comprueba que está hecha.');
  console.log('Se agrega un bloque ```comprobar al final de cada orden.\n');
}

for (const o of conComprobaciones) {
  const hechas = o.total - o.fallan.length;
  const estado = o.fallan.length === 0 ? 'HECHA' : `FALTA (${hechas} de ${o.total})`;
  console.log(`\n  ${o.archivo}: ${estado}`);
  for (const f of o.fallan) console.log(`      falta -> ${f.linea}`);
}

if (sinComprobaciones.length > 0) {
  console.log(`\n  ${sinComprobaciones.length} orden(es) todavía no declaran cómo comprobarse:`);
  for (const a of sinComprobaciones) console.log(`      ${a}`);
}

const aMedias = conComprobaciones.filter((o) => o.fallan.length > 0);
console.log('\n' + '='.repeat(60));
if (aMedias.length === 0 && conComprobaciones.length > 0) {
  console.log('  Todas las órdenes con comprobaciones están hechas.');
} else if (aMedias.length > 0) {
  console.log(`  ${aMedias.length} orden(es) dicen estar hechas y les falta trabajo.`);
}
console.log('='.repeat(60));

// Informa, no frena: una orden a medias no es un error del codigo.
process.exit(0);
