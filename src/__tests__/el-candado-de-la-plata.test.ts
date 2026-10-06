/**
 * EL CANDADO DE LA PLATA (pedido del dueño, 6/10/2026: "que esto no pase más").
 *
 * Durante meses aparecieron, de a una, acciones que mueven plata y pedían sólo "tener sesión": el
 * personal y el operador también tienen sesión. Cada vez se arreglaba la que alguien encontraba.
 * Este control no depende de que alguien se acuerde: recorre TODAS las acciones del servidor y, si
 * una toca plata (presupuestos, facturas, cobros, cuotas, gastos, precios, costos, pagos a
 * proveedores, sueldos) y no pide el permiso del perfil, la puerta no deja publicar.
 *
 * Vale para lo que programe cualquiera, Claude, Gemini o Codex. Una acción pública a propósito se
 * anota abajo CON EL MOTIVO; no se agrega a la lista para que el control se calle.
 *
 * Se probó rompiéndolo: sacando el permiso de `saveGastoGeneral`, `approvePresupuesto` o
 * `updatePagosProveedores`, el control nombra esa acción y da rojo.
 */
import fs from 'fs';
import path from 'path';

const RAIZ = path.join(process.cwd(), 'src/app/actions');

/** Qué cuenta como "toca plata": los archivos y los campos donde vive la plata. */
const TOCA_PLATA = /['"`](presupuestos\.json|invoices\.json|facturas|gastos-generales\.json|gastos_generales|servicios-empresa\.json|cupones\.json|recibos[\w-]*\.json|price-adjustments[\w-]*\.json)['"`]|\b(pagosCliente|planDePagos|pagosProveedores|gestionCostos|clientPaymentNotifications|precioVenta|precioPorPersona|montoPagado|eventSalary|leerFacturasSinGuardia)\b/;

/** Qué cuenta como "pide el perfil": un permiso concreto, no la sesión sola. */
const PIDE_PERFIL = /requirePermiso\w*\(|requireEventPermission\(|verifySessionConPermiso\(|sesionConPermiso\(|\bpuede\(|permisoDeGastos\(|nivelDePresupuestos\(|requireAdminSession\(|role !== ['"]admin['"]|requireEquipo\(|esEquipoParaFiesta\(|verifyPortalSession\(/;

/** Públicas o sin plata de verdad, a propósito. Cada una con su motivo. */
const A_PROPOSITO: Record<string, string> = {
  'armado-rapido.ts:getPublicBudgetsByPhone': 'el prospecto recupera sus presupuestos con su celular; freno por conexión y sólo presupuestos de prospecto',
  'simulador-copilot.ts:chatWithBudgetCopilot': 'copiloto público del simulador: sólo lee los precios públicos del catálogo, con freno de pedidos',
  'servicios-empresa.ts:getServiciosEmpresaPublicos': 'la lista de precios que ve cualquiera en la web: sólo precios de venta, sin costos',
  'assistant.ts:sendAssistantMessage': 'no toca la plata directo: lo hace por acciones que tienen su propio candado',
  'fiesta/carga-operativa.actions.ts:updateListaDeCargaOperativa': '"precioVenta" ahí es una cantidad de equipos, no plata',
  'fiesta/carga-operativa.actions.ts:generateCargaFromActivos': '"precioVenta" ahí es una cantidad de equipos, no plata',
};

function archivos(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) return archivos(f);
    return /\.ts$/.test(e.name) && !/\.test\.ts$/.test(e.name) ? [f] : [];
  });
}

/** Cada función del archivo con su cuerpo (hasta la siguiente función). */
function funciones(texto: string): Map<string, string> {
  // Sólo las de primer nivel (empiezan la línea): las de adentro de una función son parte de su
  // cuerpo. Contarlas cortaba el cuerpo a la mitad y el control no veía la plata (se probó).
  const re = /^(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*[<(]|^(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\(/gm;
  const marcas: Array<[string, number]> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto))) marcas.push([m[1] || m[2], m.index]);
  const salida = new Map<string, string>();
  marcas.forEach(([nombre, desde], i) => salida.set(nombre, texto.slice(desde, i + 1 < marcas.length ? marcas[i + 1][1] : undefined)));
  return salida;
}

function accionesDePlataSinCandado(raiz = RAIZ): string[] {
  const faltan: string[] = [];
  for (const archivo of archivos(raiz)) {
    const texto = fs.readFileSync(archivo, 'utf-8');
    if (!/^\s*['"]use server['"]/.test(texto)) continue;
    // El archivo de plata suele ir en una constante (`const PRESUPUESTOS_FILE = 'presupuestos.json'`):
    // usar la constante también es tocar plata. Sin esto el control no veía `approvePresupuesto`.
    const constantes = [...texto.matchAll(/^const\s+(\w+)\s*=\s*(['"`][^'"`]+['"`])/gm)]
      .filter((m) => TOCA_PLATA.test(m[2]))
      .map((m) => m[1]);
    const marca = constantes.length ? new RegExp(`${TOCA_PLATA.source}|\\b(${constantes.join('|')})\\b`) : TOCA_PLATA;
    const todas = funciones(texto);
    const tocaDirecto = (cuerpo: string) => marca.test(cuerpo);
    // También toca plata si llama a una función del mismo archivo que la toca (un paso).
    const tocaPlata = (nombre: string, cuerpo: string) => tocaDirecto(cuerpo)
      || [...todas].some(([otra, suCuerpo]) => otra !== nombre && new RegExp(`\\b${otra}\\(`).test(cuerpo) && tocaDirecto(suCuerpo));
    for (const [nombre, cuerpo] of todas) {
      if (!new RegExp(`export\\s+(async\\s+)?function\\s+${nombre}\\b`).test(texto)) continue;
      if (!tocaPlata(nombre, cuerpo)) continue;
      const clave = `${path.relative(raiz, archivo).replace(/\\/g, '/')}:${nombre}`;
      if (A_PROPOSITO[clave]) continue;
      if (PIDE_PERFIL.test(cuerpo)) continue;
      // Si delega en una función del mismo archivo que sí pide el perfil, vale.
      const delega = [...todas].some(([otra, suCuerpo]) => otra !== nombre && new RegExp(`\\b${otra}\\(`).test(cuerpo) && PIDE_PERFIL.test(suCuerpo));
      if (!delega) faltan.push(clave);
    }
  }
  return faltan;
}

describe('El candado de la plata', () => {
  it('ninguna acción del servidor toca plata sin pedir el permiso del perfil', () => {
    const faltan = accionesDePlataSinCandado();
    if (faltan.length) {
      throw new Error(
        'Estas acciones tocan plata y piden sólo sesión (el personal también tiene una):\n' +
        faltan.map((f) => `  - ${f}`).join('\n') +
        '\n\nPedí el permiso del perfil (requirePermiso(PERMISOS.CONTABILIDAD), requireEventPermission...). ' +
        'Si de verdad es pública, anotala en A_PROPOSITO con el motivo.',
      );
    }
  });

  it('cada excepción sigue existiendo (si se borró la acción, se borra de la lista)', () => {
    for (const clave of Object.keys(A_PROPOSITO)) {
      const [archivo, nombre] = clave.split(':');
      const texto = fs.readFileSync(path.join(RAIZ, archivo), 'utf-8');
      expect(texto).toMatch(new RegExp(`export async function ${nombre}\\b`));
    }
  });
});
