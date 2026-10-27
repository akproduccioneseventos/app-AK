import fs from 'fs';
import path from 'path';
import { readData } from '@/lib/data-service';
import type { DecisionDuenio } from './reglas-de-la-ia';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

const ARCHIVO_APRENDIZAJE = 'ia-aprendizaje.json';

async function leerDecisiones(): Promise<DecisionDuenio[]> {
  try {
    const localPath = path.join(process.cwd(), 'data', ARCHIVO_APRENDIZAJE);
    if (fs.existsSync(localPath)) {
      const content = fs.readFileSync(localPath, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Seguir con readData
  }

  if (process.env.NODE_ENV === 'test' && !process.env.FIRESTORE_EMULATOR_HOST) {
    return [];
  }

  try {
    return await readData<DecisionDuenio[]>(ARCHIVO_APRENDIZAJE, []);
  } catch {
    return [];
  }
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

    const normBuscado = (tipoTarea || '').toLowerCase().replace(/[_-]/g, '');

    const aprobadas = decisiones.filter((d) => {
      const normTarea = (d.tipoTarea || '').toLowerCase().replace(/[_-]/g, '');
      const coincide = normTarea.includes(normBuscado) || normBuscado.includes(normTarea);
      const aceptada = d.decision === 'si' || d.decision === 'cambiar';
      return coincide && aceptada;
    });

    const textos: string[] = [];
    for (const d of aprobadas) {
      const texto = (d.textoFinal || d.textoPropuesto || '').trim();
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
    const localFiestas = path.join(process.cwd(), 'data', 'fiestas.json');
    let fiestas: FiestaEnPlanificacion[] = [];
    if (fs.existsSync(localFiestas)) {
      try {
        fiestas = JSON.parse(fs.readFileSync(localFiestas, 'utf8'));
      } catch {
        // Fallback a readData
      }
    }
    if ((!fiestas || fiestas.length === 0) && (process.env.NODE_ENV !== 'test' || process.env.FIRESTORE_EMULATOR_HOST)) {
      fiestas = await readData<FiestaEnPlanificacion[]>('fiestas.json', []);
    }

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
