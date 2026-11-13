/**
 * LO QUE GUARDA SE PRUEBA CONTRA LA BASE (pedido del dueño, 13/11/2026: "pensá un método para que no suceda").
 *
 * La prueba funcional del auditor (12/11) encontró once acciones que contestaban "listo" y no habían guardado lo que
 * decían: precios que volvían negativos, bajas que no llegaban a la base, una celiaquía que no se iba. Las pruebas de Jest
 * daban verde porque usan una base de mentira que se porta MEJOR que la real (guarda listas vacías y campos sin valor,
 * que la real ignora) o reemplazan justo la pieza donde estaba la falla.
 *
 * El método: toda acción que guarda plata o comida, o que borra, tiene una prueba en `tests/firebase/` (corre contra el
 * emulador de la base con `npm run test:rules`, que está en la puerta) que hace la acción, VUELVE A LEER de la base y,
 * si la acción se puede deshacer, hace la ida y vuelta. Las que hoy no la tienen están en
 * `docs/ida-y-vuelta-pendientes.json`, y esa lista sólo puede achicarse:
 *  - una acción nueva de ese tipo sin prueba contra la base no deja publicar;
 *  - una acción de la lista que ya tiene su prueba tiene que salir de la lista.
 */
import fs from 'fs';
import path from 'path';

const RAIZ = process.cwd();
const ACCIONES = path.join(RAIZ, 'src/app/actions');
const PRUEBAS_CONTRA_LA_BASE = path.join(RAIZ, 'tests/firebase');
const PENDIENTES = path.join(RAIZ, 'docs/ida-y-vuelta-pendientes.json');

const TOCA_PLATA = /['"`](presupuestos\.json|invoices\.json|gastos-generales\.json|servicios-empresa\.json|salones\.json|cupones\.json|recibos[\w-]*\.json|price-adjustments[\w-]*\.json)['"`]|\b(pagosCliente|planDePagos|pagosProveedores|gestionCostos|precioVenta|precioPorPersona|montoPagado|eventSalary|planPagos|adjustAllService\w+)\b/;
const TOCA_COMIDA = /\b(isCeliac|dietaryRestriction|restriccionesAlimentarias|menuAsignadoId|insumos\.json|menus-catering\.json|menus\.json)\b/;
const GUARDA = /\b(writeData|writeToFirestore|mutate\w+|mutar\w+|updateFiesta\w*|runTransaction|\.set\(|\.update\(|\.delete\()/;
const BORRA = /^(delete|remove|borrar|eliminar|reset|quitar|revert)/i;

function archivos(dir: string, ext = /\.ts$/): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) return archivos(f, ext);
    return ext.test(e.name) && !/\.test\.ts$/.test(e.name) ? [f] : [];
  });
}

/** Las acciones exportadas, cada una con su cuerpo hasta la siguiente función de primer nivel. */
function acciones(texto: string): Map<string, string> {
  const re = /^(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*[<(]|^(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\(/gm;
  const marcas: Array<[string, number, boolean]> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto))) marcas.push([m[1] || m[2], m.index, /^export/.test(m[0])]);
  const cuerpos = new Map<string, string>();
  marcas.forEach(([nombre, desde], i) => cuerpos.set(nombre, texto.slice(desde, i + 1 < marcas.length ? marcas[i + 1][1] : undefined)));
  // Una acción que sólo llama a una función del mismo archivo (revertPriceAdjustment → revertPriceAdjustmentInterno)
  // se mira con el cuerpo de esa función: si no, la puerta de entrada se escapa del control (se probó).
  const salida = new Map<string, string>();
  for (const [nombre, , exportada] of marcas) {
    if (!exportada) continue;
    let cuerpo = cuerpos.get(nombre) || '';
    for (const [otra, suCuerpo] of cuerpos) {
      if (otra !== nombre && new RegExp(`\\b${otra}\\s*\\(`).test(cuerpo)) cuerpo += `\n${suCuerpo}`;
    }
    salida.set(nombre, cuerpo);
  }
  return salida;
}

export function accionesQueGuardanLoImportante(raiz = ACCIONES): string[] {
  const salida: string[] = [];
  for (const archivo of archivos(raiz)) {
    const texto = fs.readFileSync(archivo, 'utf8');
    if (!/^['"]use server['"]/m.test(texto)) continue;
    for (const [nombre, cuerpo] of acciones(texto)) {
      if (!GUARDA.test(cuerpo)) continue;
      const importante = TOCA_PLATA.test(cuerpo) || TOCA_COMIDA.test(cuerpo) || BORRA.test(nombre);
      if (importante) salida.push(`${path.relative(raiz, archivo).replace(/\\/g, '/')}:${nombre}`);
    }
  }
  return salida.sort();
}

function textoDeLasPruebasContraLaBase(): string {
  return fs.readdirSync(PRUEBAS_CONTRA_LA_BASE)
    .filter((f) => f.endsWith('.test.ts'))
    .map((f) => fs.readFileSync(path.join(PRUEBAS_CONTRA_LA_BASE, f), 'utf8'))
    .join('\n');
}

export function probadaContraLaBase(accion: string, textoDePruebas: string): boolean {
  const nombre = accion.split(':')[1];
  return new RegExp(`\\b${nombre}\\b`).test(textoDePruebas);
}

describe('Lo que guarda plata, comida o borra se prueba contra la base de verdad', () => {
  const pendientes: string[] = JSON.parse(fs.readFileSync(PENDIENTES, 'utf8')).pendientes;
  const todas = accionesQueGuardanLoImportante();
  const pruebas = textoDeLasPruebasContraLaBase();
  if (process.env.AK_ARMAR_PENDIENTES === 'true') {
    // Sólo para armar la lista la primera vez (13/11/2026). Después, la lista se achica a mano.
    const sinPrueba = todas.filter((a) => !probadaContraLaBase(a, pruebas));
    fs.writeFileSync(PENDIENTES, `${JSON.stringify({ nota: 'Acciones que guardan plata, comida o borran y todavía no tienen prueba contra la base (tests/firebase). Sólo se achica: ver src/__tests__/lo-que-guarda-se-prueba-contra-la-base.test.ts.', pendientes: sinPrueba }, null, 2)}\n`);
  }

  it('ninguna acción nueva de ese tipo entra sin su prueba contra la base', () => {
    const nuevasSinPrueba = todas.filter((a) => !probadaContraLaBase(a, pruebas) && !pendientes.includes(a));
    expect(nuevasSinPrueba).toEqual([]);
  });

  it('la lista de pendientes sólo se achica: lo que ya tiene prueba, o ya no existe, sale de la lista', () => {
    const sobran = pendientes.filter((a) => !todas.includes(a) || probadaContraLaBase(a, pruebas));
    expect(sobran).toEqual([]);
  });

  it('el control frena de verdad: una acción de plata inventada sin prueba aparece', () => {
    const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'ida-y-vuelta-'));
    fs.writeFileSync(path.join(tmp, 'x.ts'), "'use server';\nexport async function cobrarAlgo() {\n  await writeData('invoices.json', []);\n}\n");
    expect(accionesQueGuardanLoImportante(tmp)).toEqual(['x.ts:cobrarAlgo']);
  });
});
