import { readDataConDetalle } from '@/lib/data-service';
import type { DecisionDuenio } from './reglas-de-la-ia';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

const ARCHIVO_APRENDIZAJE = 'ia-aprendizaje.json';

async function leerDecisiones(): Promise<DecisionDuenio[]> {
  const resultado = await readDataConDetalle<DecisionDuenio[]>(ARCHIVO_APRENDIZAJE, []);
  return resultado.huboFalla || !Array.isArray(resultado.valor) ? [] : resultado.valor;
}

function normalizarTipo(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[_-]/g, '').trim();
}

function contieneImportes(texto: string): boolean {
  return /(?:[$€£]\s*\d|\b\d[\d.,]*\s*(?:uyu|pesos?|d[oó]lares?|usd|eur)\b|\b(?:precio|presupuesto|costo|cuota|saldo|cobro|pago)\s*[:=]?\s*[$\d])/i.test(texto);
}

function contienePII(texto: string): boolean {
  return /(?:\b\d{7,}\b|\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b|\b(?:598|09)\d[\s-]?\d{3}[\s-]?\d{3,4}\b)/i.test(texto);
}

export function resumirGuiaDeEstilo(textos: string[]): string {
  const todos = textos.join(' ').toLocaleLowerCase('es-UY');
  const rasgos = [
    /c[aá]lid|cercan|afectuos/.test(todos) ? 'cálido y cercano' : '',
    /profesional|formal/.test(todos) ? 'profesional' : '',
    /breve|corto|conciso|direct/.test(todos) ? 'breve y directo' : '',
    /alegr|divertid|entusiast|energ/.test(todos) ? 'alegre y enérgico' : '',
    /rioplat|uruguay|vos|ten[eé]s/.test(todos) ? 'español rioplatense uruguayo' : '',
  ].filter(Boolean);
  return rasgos.length ? rasgos.join(', ') : 'cálido, profesional y directo';
}

/**
 * Retorna los últimos textos (hasta 5) aprobados o corregidos por el dueño
 * para un tipo de tarea específico (ej: 'web-evento', 'seguimiento-comercial', etc.)
 */
export async function aprenderDeLoAprobado(tipoTarea: string): Promise<string[]> {
  try {
    const decisiones = await leerDecisiones();
    if (!Array.isArray(decisiones) || decisiones.length === 0) {
      return [];
    }

    const normBuscado = normalizarTipo(tipoTarea || '');
    if (!normBuscado) return [];

    const aprobadas = decisiones.filter((d) => {
      const normTarea = normalizarTipo(d.tipoTarea || '');
      const coincide = normTarea === normBuscado;
      const aceptada = d.decision === 'si' || d.decision === 'cambiar';
      return coincide && aceptada && typeof d.fecha === 'string' && Number.isFinite(Date.parse(d.fecha));
    }).sort((a, b) => Date.parse(b.fecha!) - Date.parse(a.fecha!));

    const textos: string[] = [];
    for (const d of aprobadas) {
      const texto = (d.textoFinal || d.textoPropuesto || '').trim();
      if (contieneImportes(texto) || contienePII(texto)) continue;
      if (texto && !textos.includes(texto)) {
        textos.push(texto);
      }
      if (textos.length >= 5) {
        break;
      }
    }

    return textos;
  } catch (error) {
    console.warn('[Aprendizaje] Error al leer textos aprobados:', error);
    return [];
  }
}

/**
 * Devuelve los nombres de las plantillas más elegidas por el dueño o en las fiestas,
 * ordenadas por frecuencia descendente.
 */
export async function getPlantillasMasElegidas(): Promise<string[]> {
  const conteo: Record<string, number> = {};

  try {
    const decisiones = await leerDecisiones();
    if (Array.isArray(decisiones)) {
      for (const d of decisiones) {
        const plantilla = d.detalles?.plantilla;
        if (typeof plantilla === 'string' && plantilla.trim()) {
          conteo[plantilla] = (conteo[plantilla] || 0) + 1;
        }
      }
    }
  } catch {
    // Si falla aprendizaje, continuamos con fiestas
  }

  try {
    const { leerFiestasCrudas } = await import('@/lib/fiesta/leer-fiestas');
    const fiestas: FiestaEnPlanificacion[] = await leerFiestasCrudas(false);

    if (Array.isArray(fiestas)) {
      for (const f of fiestas) {
        const plantilla =
          (f.invitacionConfig as any)?.plantilla ||
          f.invitacionDigital?.plantilla ||
          (f as any).invitacionData?.plantilla;
        if (typeof plantilla === 'string' && plantilla.trim()) {
          conteo[plantilla] = (conteo[plantilla] || 0) + 1;
        }
      }
    }
  } catch {
    // Silencioso
  }

  const ordenadas = Object.entries(conteo)
    .sort((a, b) => b[1] - a[1])
    .map(([nombre]) => nombre);

  if (ordenadas.length === 0) {
    return ['Grazia', 'Allegria', 'XvModerna', 'BodaMinimalista', 'FiestaNoche'];
  }

  return ordenadas;
}
