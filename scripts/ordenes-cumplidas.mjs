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

// Se miran las ordenes Y el inventario de lo que la app dice tener. Lo segundo
// es lo que pidio el dueno: *"una auditoria que revise que todo lo que tiene la
// app este, para que no pase esto"*. Una app que dice tener algo y no lo tiene
// le miente al que la usa y al que la vende.
const INVENTARIO = path.join(process.cwd(), 'docs', 'QUE-HAY-EN-LA-APP.md');

const archivos = fs.existsSync(CARPETA)
  ? fs.readdirSync(CARPETA).filter((f) => f.endsWith('.md')).sort()
  : [];
if (fs.existsSync(INVENTARIO)) archivos.push('../QUE-HAY-EN-LA-APP.md');

// Y lo arreglado. Pedido del dueno el 1 de septiembre de 2026: *"todo lo que te
// pregunto y corregis debe estar registrado en la lista para no volver a
// repetirlo, y debe figurar si es real que funciona; si no, no termino mas"*.
// Anotar un arreglo en prosa no dice si SIGUE andando: esto lo comprueba.
const RESUELTO = path.join(process.cwd(), 'docs', 'YA-RESUELTO.md');
if (fs.existsSync(RESUELTO)) archivos.push('../YA-RESUELTO.md');

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

// ----- La comparacion con el rubro, funcion por funcion -----
//
// Pedido del dueno el 1 de septiembre de 2026: *"vas a tener que hacer un nuevo
// mecanismo para eso tambien, que no vuelva a pasar; si paso en la fotocabina,
// me aseguro que paso en los otros entretenimientos"*.
//
// El problema: se investigan diez plataformas, se escribe en la orden lo que
// parecio importante, y **lo que no entro en la orden se pierde**. Nadie vuelve
// a mirar la lista completa.
//
// Esto la deja escrita y la cuenta sola. En `docs/COMPARACION-CON-EL-RUBRO.md`,
// un bloque por modulo:
//
//     ```rubro Fotocabina
//     Tanda de fotos :: usa: fotosPorTanda en src/app/evento/fotocabina/[fiestaId]/page.tsx
//     Fondo sin tela :: FALTA
//     ```
//
// Y contesta: "Fotocabina: 18 de 26 funciones del rubro".
function leerRubro(texto) {
  const bloques = [...texto.matchAll(/```rubro ([^\n]+)\n([\s\S]*?)```/g)];
  return bloques.map((b) => {
    const modulo = b[1].trim();
    const funciones = b[2]
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'))
      .map((linea) => {
        const [nombre, ...resto] = linea.split('::');
        const cond = resto.join('::').trim();
        if (!cond || /^FALTA$/i.test(cond)) {
          return { nombre: nombre.trim(), tenemos: false };
        }
        const [tipo, ...v] = cond.split(':');
        return {
          nombre: nombre.trim(),
          tenemos: comprobar({ tipo: tipo.trim(), valor: v.join(':').trim() }),
        };
      });
    return { modulo, funciones };
  });
}

const RUBRO = path.join(process.cwd(), 'docs', 'COMPARACION-CON-EL-RUBRO.md');
const comparaciones = fs.existsSync(RUBRO) ? leerRubro(fs.readFileSync(RUBRO, 'utf8')) : [];

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

if (comparaciones.length > 0) {
  console.log('\n' + '='.repeat(60));
  console.log('  CONTRA EL RUBRO: qué tienen ellos y qué tenemos nosotros');
  console.log('='.repeat(60));
  for (const c of comparaciones) {
    const tenemos = c.funciones.filter((f) => f.tenemos).length;
    console.log(`\n  ${c.modulo}: ${tenemos} de ${c.funciones.length} funciones del rubro`);
    const faltan = c.funciones.filter((f) => !f.tenemos);
    for (const f of faltan) console.log(`      falta -> ${f.nombre}`);
  }
  console.log('');
}

// Informa, no frena: una orden a medias no es un error del codigo.
process.exit(0);
