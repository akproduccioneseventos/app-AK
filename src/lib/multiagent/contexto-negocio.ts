/**
 * Lo que el asistente SABE del negocio, armado con cuentas y no con la intuición del modelo.
 *
 * Antes el asistente recibía la cartera de fiestas sólo en algunos agentes, cortada en 20, sin
 * orden y mezclando fiestas pasadas; los saldos eran los últimos 12 presupuestos. Contestaba
 * "no veo nada" o inventaba. Acá viven los tres bloques que reciben TODOS los agentes:
 *
 *  - FIESTAS PRÓXIMOS 30 DÍAS (ordenadas por fecha, con los días que faltan).
 *  - PLATA: total que te deben, calculado sobre TODOS los presupuestos vivos y con la misma
 *    cuenta que la ficha y el panel (`getBudgetPaymentSummary`: sólo cuentan los pagos
 *    confirmados). Sólo se arma para quien tiene el permiso de contabilidad.
 *  - AGENDA: hoy y esta semana, con la misma cuenta que `ver_mi_semana`.
 *
 * Son funciones puras (reciben los datos ya leídos) para poder probarlas sin base. Un `null`
 * quiere decir "no se pudo leer": el bloque lo dice y NO se parece a "no hay nada".
 */
import { getBudgetPaymentSummary } from '@/lib/budget/financial-guardrails';
import { hoyEnUruguay } from '@/lib/utils';

/** Tope de caracteres de todo lo que cambia con los datos del día (sin el manual ni el mapa). */
export const TOPE_DATOS_EN_TIEMPO_REAL = 8000;

const TOPE_BLOQUE = 2400;
const DIAS_PROXIMOS = 30;
const DIAS_SEMANA = 7;

export function formatoPlata(valor: number): string {
  const n = Math.round(Number(valor) || 0);
  const miles = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${n < 0 ? '-' : ''}$${miles}`;
}

export function acotarTexto(texto: string, tope: number): string {
  if (texto.length <= tope) return texto;
  return `${texto.slice(0, Math.max(0, tope - 40)).trimEnd()}\n  …(recortado por largo)`;
}

/** `AAAA-MM-DD` en hora de Uruguay de lo que venga (fecha suelta o ISO con hora). */
export function diaUruguay(valor: unknown): string | null {
  if (typeof valor !== 'string' || !valor.trim()) return null;
  const texto = valor.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;
  const fecha = new Date(texto);
  if (Number.isNaN(fecha.getTime())) return null;
  return hoyEnUruguay(fecha);
}

function diasEntre(desde: string, hasta: string): number {
  const [ya, ma, da] = desde.split('-').map(Number);
  const [yb, mb, db] = hasta.split('-').map(Number);
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86400000);
}

export function nombreDeFiesta(fiesta: any): string {
  return (
    fiesta?.configuracion?.nombreEvento ||
    fiesta?.configuracion?.nombreFiesta ||
    fiesta?.nombreEvento ||
    fiesta?.nombre ||
    fiesta?.id ||
    'Fiesta sin nombre'
  );
}

/** Una fiesta suspendida, cancelada o archivada no entra en ninguna cuenta. */
export function esFiestaViva(fiesta: any): boolean {
  if (!fiesta || fiesta.archived === true || fiesta.archivada === true) return false;
  return !/(suspend|cancel|archiv)/i.test(String(fiesta.estado || ''));
}

function tareasPendientes(fiesta: any): any[] {
  return (Array.isArray(fiesta?.tareas) ? fiesta.tareas : []).filter((t: any) => !t?.completada && !t?.hecha);
}

function diasEnPalabras(dias: number): string {
  if (dias === 0) return 'HOY';
  if (dias === 1) return 'mañana';
  if (dias < 0) return `hace ${Math.abs(dias)} días`;
  return `en ${dias} días`;
}

// ── Fiestas ──────────────────────────────────────────────────────────────────

export function bloqueFiestasProximas(fiestas: any[] | null, hoy: string = hoyEnUruguay()): string {
  if (fiestas === null) return 'FIESTAS PRÓXIMOS 30 DÍAS: no se pudo leer la lista de fiestas ahora; no tengo datos de fechas.';
  const vivas = fiestas.filter(esFiestaViva);
  const conDia = vivas
    .map((f) => ({ f, dia: diaUruguay(f?.configuracion?.fechaEvento) }))
    .filter((x): x is { f: any; dia: string } => x.dia !== null);

  const esteMes = conDia.filter((x) => x.dia.slice(0, 7) === hoy.slice(0, 7)).length;
  const proximas = conDia
    .map((x) => ({ ...x, dias: diasEntre(hoy, x.dia) }))
    .filter((x) => x.dias >= 0 && x.dias <= DIAS_PROXIMOS)
    .sort((a, b) => a.dia.localeCompare(b.dia));

  const lineas = proximas.slice(0, 15).map(({ f, dia, dias }) => {
    const pend = tareasPendientes(f).length;
    return `  • ${nombreDeFiesta(f)} | ${dia} | ${diasEnPalabras(dias)} | ${f.estado || 'sin estado'} | ${pend} tareas pendientes | id:${f.id}`;
  });
  if (proximas.length > 15) lineas.push(`  …y ${proximas.length - 15} más.`);

  return acotarTexto([
    `FIESTAS PRÓXIMOS 30 DÍAS (${proximas.length}) — fiestas en total este mes: ${esteMes} — hoy es ${hoy}:`,
    ...(lineas.length ? lineas : ['  No hay fiestas cargadas en los próximos 30 días.']),
  ].join('\n'), TOPE_BLOQUE);
}

// ── Plata ────────────────────────────────────────────────────────────────────

export interface Deudor {
  cliente: string;
  evento: string;
  deuda: number;
}

/**
 * Cuánto se debe, sobre TODOS los presupuestos contratados y vivos. Es la misma cuenta que usa
 * `cuanto_me_deben`: un presupuesto archivado o que no está aceptado/facturado ("Pendiente
 * Verificación", borrador, rechazado) no es plata a cobrar, y un pago que no está confirmado no
 * se descuenta como cobrado.
 */
export function calcularDeudas(presupuestos: any[]): { total: number; deudores: Deudor[] } {
  const deudores: Deudor[] = [];
  let total = 0;
  for (const p of presupuestos) {
    if (!p || p.archived || (p.estado !== 'Aceptado' && p.estado !== 'Facturado')) continue;
    const saldo = getBudgetPaymentSummary(p, { includeAnnualAdjustment: true }).balance;
    if (saldo > 0) {
      total += saldo;
      deudores.push({
        cliente: p.clienteNombre || p.cliente?.nombre || 'Cliente',
        evento: p.tipoEvento || p.eventoTipo || 'Fiesta',
        deuda: saldo,
      });
    }
  }
  deudores.sort((a, b) => b.deuda - a.deuda);
  return { total, deudores };
}

export interface CuotaVencida {
  fiesta: string;
  descripcion: string;
  monto: number;
  diasDeAtraso: number;
}

/** Cuotas del plan de pagos de cada fiesta viva que ya pasaron su vencimiento sin cobrarse. */
export function cuotasVencidas(fiestas: any[], hoy: string = hoyEnUruguay()): CuotaVencida[] {
  const vencidas: CuotaVencida[] = [];
  for (const f of fiestas.filter(esFiestaViva)) {
    const cuotas = Array.isArray(f?.planDePagos?.cuotas) ? f.planDePagos.cuotas : [];
    for (const c of cuotas) {
      if (String(c?.estado || '').toLowerCase() === 'pagado') continue;
      const dia = diaUruguay(c?.fechaVencimiento);
      if (!dia) continue;
      const atraso = diasEntre(dia, hoy);
      if (atraso <= 0) continue;
      const falta = Math.max(0, (Number(c.monto) || 0) - (Number(c.montoPagado) || 0));
      if (falta <= 0) continue;
      vencidas.push({ fiesta: nombreDeFiesta(f), descripcion: c.descripcion || 'Cuota', monto: falta, diasDeAtraso: atraso });
    }
  }
  return vencidas.sort((a, b) => b.diasDeAtraso - a.diasDeAtraso);
}

export function bloquePlata(
  presupuestos: any[] | null,
  fiestas: any[] | null,
  hoy: string = hoyEnUruguay(),
): string {
  if (presupuestos === null) {
    return 'PLATA: no se pudieron leer los presupuestos ahora; no tengo el total que te deben (no quiere decir que no te deban nada).';
  }
  const { total, deudores } = calcularDeudas(presupuestos);
  const top = deudores.slice(0, 5).map((d) => `  • ${d.cliente} (${d.evento}): ${formatoPlata(d.deuda)}`);
  const lineas = [
    `PLATA: total que te deben ${formatoPlata(total)} en ${deudores.length} presupuestos contratados (sólo pagos confirmados; sin archivados ni pendientes de verificación).`,
    ...(top.length ? ['  Los 5 que más deben:', ...top] : ['  Nadie debe saldo.']),
  ];
  if (fiestas === null) {
    lineas.push('  Cuotas vencidas: no se pudo leer el plan de pagos de las fiestas ahora.');
  } else {
    const vencidas = cuotasVencidas(fiestas, hoy);
    if (vencidas.length) {
      lineas.push(`  Cuotas vencidas sin cobrar (${vencidas.length}), total ${formatoPlata(vencidas.reduce((a, c) => a + c.monto, 0))}:`);
      for (const c of vencidas.slice(0, 5)) {
        lineas.push(`  • ${c.fiesta} — ${c.descripcion}: ${formatoPlata(c.monto)} (${c.diasDeAtraso} días de atraso)`);
      }
    } else {
      lineas.push('  Sin cuotas vencidas en los planes de pago cargados.');
    }
  }
  return acotarTexto(lineas.join('\n'), TOPE_BLOQUE);
}

// ── Agenda (misma cuenta que ver_mi_semana) ──────────────────────────────────

export interface ResumenSemana {
  fiestas: Array<{ fiesta: any; dia: string; dias: number }>;
  tareas: Array<{ fiesta: string; texto: string }>;
}

export function resumenDeLaSemana(fiestas: any[], hoy: string = hoyEnUruguay()): ResumenSemana {
  const proximas = fiestas
    .filter(esFiestaViva)
    .map((f) => ({ fiesta: f, dia: diaUruguay(f?.configuracion?.fechaEvento) }))
    .filter((x): x is { fiesta: any; dia: string } => x.dia !== null)
    .map((x) => ({ ...x, dias: diasEntre(hoy, x.dia) }))
    .filter((x) => x.dias >= 0 && x.dias <= DIAS_SEMANA)
    .sort((a, b) => a.dia.localeCompare(b.dia));

  const tareas = proximas.flatMap(({ fiesta }) =>
    tareasPendientes(fiesta).map((t: any) => ({ fiesta: nombreDeFiesta(fiesta), texto: String(t.titulo || t.texto || 'Tarea sin texto') })),
  );
  return { fiestas: proximas, tareas };
}

export function bloqueAgenda(fiestas: any[] | null, hoy: string = hoyEnUruguay()): string {
  if (fiestas === null) return 'AGENDA: no se pudo leer la agenda ahora; no tengo datos de hoy ni de la semana.';
  const { fiestas: semana, tareas } = resumenDeLaSemana(fiestas, hoy);
  const deHoy = semana.filter((x) => x.dias === 0);
  const resto = semana.filter((x) => x.dias > 0);
  const lineas = [
    `AGENDA (hoy ${hoy} y próximos ${DIAS_SEMANA} días):`,
    deHoy.length ? `  HOY: ${deHoy.map((x) => nombreDeFiesta(x.fiesta)).join(', ')}` : '  HOY: ninguna fiesta.',
    resto.length
      ? `  Esta semana: ${resto.map((x) => `${nombreDeFiesta(x.fiesta)} (${x.dia}, ${diasEnPalabras(x.dias)})`).join('; ')}`
      : '  Esta semana: ninguna otra fiesta.',
    tareas.length
      ? `  Tareas pendientes de esas fiestas (${tareas.length}): ${tareas.slice(0, 8).map((t) => `[${t.fiesta}] ${t.texto}`).join('; ')}${tareas.length > 8 ? '; …' : ''}`
      : '  Sin tareas pendientes en las fiestas de la semana.',
  ];
  return acotarTexto(lineas.join('\n'), TOPE_BLOQUE);
}

// ── Memoria ──────────────────────────────────────────────────────────────────

export const TOPE_APRENDIZAJES_EN_EL_PROMPT = 5;

/**
 * Los aprendizajes que se guardan solos (cada respuesta deja uno "low" y cada chat uno "medium")
 * realimentaban al propio asistente con ruido. Al prompt sólo entra lo marcado de confianza alta
 * (lo que una persona o el sistema confirmó), con tope.
 */
export function aprendizajesAprobados<T extends { confidence?: string }>(aprendizajes: T[] | undefined | null): T[] {
  return (aprendizajes || []).filter((l) => l?.confidence === 'high').slice(0, TOPE_APRENDIZAJES_EN_EL_PROMPT);
}

/** Primera línea de toda respuesta armada sin la IA. */
export const LINEA_MODO_RESPALDO = 'La IA no está respondiendo ahora; esto es un resumen automático de tus datos.';

// ── Avisos de lectura ────────────────────────────────────────────────────────

/** Antepone, en claro, lo que no se pudo leer: la respuesta no puede sonar completa. */
export function conAvisoDeLectura(respuesta: string, sinLeer: string[], falloTotal = false): string {
  if (falloTotal) {
    return `No pude leer los datos del negocio ahora mismo, así que esta respuesta no usa cifras reales de la app.\n\n${respuesta}`;
  }
  if (sinLeer.length === 0) return respuesta;
  return `Ojo: ahora no pude leer ${sinLeer.join(', ')}; lo que te diga de eso puede estar incompleto.\n\n${respuesta}`;
}
