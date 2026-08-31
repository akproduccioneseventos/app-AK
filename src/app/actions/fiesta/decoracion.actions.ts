
'use server';

import type { FiestaEnPlanificacion, DecoracionData, MoodboardItem, DecoItem, CostoItem } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from './fiesta.actions';
import { updateGestionCostos } from './costos.actions';
import { generateGeminiImage } from '@/lib/ai/gemini-image';
import { requireAppSession } from '@/lib/auth/require-session';
import { leerFiestasCrudas } from '@/lib/fiesta/leer-fiestas';

export async function updateDecoracion(fiestaId: string, decoracion: DecoracionData): Promise<{ success: boolean; updatedData?: DecoracionData; error?: string }> {
  // SIN cuenta del equipo a proposito: el CLIENTE arma su tablero de decoracion
  // desde su portal. El guardado de abajo ya pide sesion del equipo O la clave del
  // cliente de esta fiesta.
  try {
    const currentData = await getFiestaById(fiestaId);
    if (!currentData) throw new Error("Fiesta no encontrada");
    const updatedData = { ...currentData, decoracion };
    const result = await saveFiesta(updatedData);
    if (!result.success) throw new Error(result.error);

    // Auto-sincronización de costos de decoración con el módulo de gestión de costos
    if (decoracion.itemsDecoracion && decoracion.itemsDecoracion.length > 0) {
      void syncDecoGastosToModule(fiestaId, decoracion.itemsDecoracion).catch(() => {});
    }

    return { success: true, updatedData: result.fiesta?.decoracion };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function addMoodboardItem(fiestaId: string, url: string, description?: string): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
    try {
        const fiesta = await getFiestaById(fiestaId);
        if (!fiesta) throw new Error("Fiesta no encontrada");

        const decoracion = fiesta.decoracion || {};
        const items = decoracion.moodboardItems || [];

        const newItem: MoodboardItem = {
            id: `mood_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            url,
            description,
            likedByClient: false,
            uploadedBy: 'Organizador',
            timestamp: new Date().toISOString()
        };

        const updatedDecoracion = { ...decoracion, moodboardItems: [...items, newItem] };
        await updateDecoracion(fiestaId, updatedDecoracion);
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function deleteMoodboardItem(fiestaId: string, itemId: string): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
    try {
        const fiesta = await getFiestaById(fiestaId);
        if (!fiesta) throw new Error("Fiesta no encontrada");

        const decoracion = fiesta.decoracion || {};
        const items = (decoracion.moodboardItems || []).filter(i => i.id !== itemId);

        const updatedDecoracion = { ...decoracion, moodboardItems: items };
        await updateDecoracion(fiestaId, updatedDecoracion);
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function toggleLikeMoodboardItem(fiestaId: string, itemId: string): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
    try {
        const fiesta = await getFiestaById(fiestaId);
        if (!fiesta) throw new Error("Fiesta no encontrada");

        const decoracion = fiesta.decoracion || {};
        const items = (decoracion.moodboardItems || []).map(i =>
            i.id === itemId ? { ...i, likedByClient: !i.likedByClient } : i
        );

        const updatedDecoracion = { ...decoracion, moodboardItems: items };
        await updateDecoracion(fiestaId, updatedDecoracion);
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/**
 * Sincroniza los costos internos de los items de decoración con el módulo de Gestión de Costos.
 * Los items de decoración tienen costos internos (gastos) que NO se suman al presupuesto del cliente,
 * pero sí deben reflejarse en los gastos operativos del evento.
 */
export async function syncDecoGastosToModule(
  fiestaId: string,
  itemsDecoracion: DecoItem[]
): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) throw new Error("Fiesta no encontrada");

    const costos = fiesta.gestionCostos || { costosItems: [], ingresosTotalesEstimados: 0 };
    const otherItems = (costos.costosItems || []).filter(c => !c.id.startsWith('deco_'));

    const decoItems: CostoItem[] = itemsDecoracion
      .filter(item => {
        const costo = item.costoUnitario ?? item.precioUnitario ?? 0;
        return costo > 0;
      })
      .map(item => {
        const costo = item.costoUnitario ?? item.precioUnitario ?? 0;
        return {
          id: `deco_${item.id}`,
          nombre: `Decoración: ${item.nombre}${item.cantidad > 1 ? ` (x${item.cantidad})` : ''}`,
          category: 'Decoración',
          montoEstimado: Math.round(costo * item.cantidad), // Integer amount as gestionCostos uses whole currency units
          notas: item.notas || `Gasto interno de decoración - ${item.categoria}`,
        };
      });

    const updatedCostos = {
      ...costos,
      costosItems: [...otherItems, ...decoItems],
    };

    await updateGestionCostos(fiestaId, updatedCostos);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function enviarOpinionDecoracion(
  fiestaId: string,
  leGusta: boolean,
  comentario?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) throw new Error("Fiesta no encontrada");

    const decoracion = fiesta.decoracion || {};
    const updatedDecoracion: DecoracionData = {
      ...decoracion,
      opinionCliente: {
        leGusta,
        comentario: comentario?.trim() || undefined,
        fecha: new Date().toISOString(),
      },
    };

    const res = await updateDecoracion(fiestaId, updatedDecoracion);
    if (!res.success) throw new Error(res.error);

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function generarVisualizacionSalonAi(
  fiestaId: string,
  salonFotoUrl?: string
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  await requireAppSession();
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) throw new Error("Fiesta no encontrada");

    const decoracion = fiesta.decoracion || {};
    const fotosExistentes = decoracion.fotosGeneradasAi || [];

    if (fotosExistentes.length >= 3) {
      return {
        success: false,
        error: "Se alcanzó el tope de 3 imágenes generadas con IA para esta fiesta.",
      };
    }

    const estilo = decoracion.estiloDecoracion || 'elegante';
    const paleta = decoracion.colorPalette || { primary: '#9333ea', secondary: '#111827', accent: '#f59e0b' };
    const items = (decoracion.itemsDecoracion || []).map(i => i.nombre).slice(0, 8).join(', ');
    const tema = decoracion.tema || fiesta.configuracion.nombreEvento || 'Fiesta de gala';

    const prompt = [
      `Fotografía profesional y realista de un salón de eventos decorado para ${tema}.`,
      `Estilo de ambientación: ${estilo}.`,
      `Paleta de colores: color principal ${paleta.primary}, color secundario ${paleta.secondary}, detalles y acentos en ${paleta.accent}.`,
      items ? `Elementos decorativos presentes: ${items}.` : '',
      `Iluminación ambiental cálida con guirnaldas, luces tenues, centros de mesa y mobiliario premium. Gran angular, calidad fotográfica 4K, elegante y festivo.`,
    ].filter(Boolean).join(' ');

    const imageUrl = await generateGeminiImage({
      prompt,
      aspectRatio: '16:9',
      imageSize: '1K',
    });

    if (!imageUrl) {
      return { success: false, error: "No se pudo generar la imagen del salón decorado. Intentá de nuevo en unos minutos." };
    }

    const nextFotos = [...fotosExistentes, imageUrl];
    await updateDecoracion(fiestaId, { ...decoracion, fotosGeneradasAi: nextFotos });

    return { success: true, imageUrl };
  } catch (e: any) {
    return { success: false, error: e.message || "Error al generar la imagen con IA." };
  }
}

export async function getDisponibilidadElementosDecoracion(
  fechaEvento: string,
  fiestaActualId?: string
): Promise<Array<{ nombreItem: string; fiestaNombre: string; fiestaId: string }>> {
  await requireAppSession();
  if (!fechaEvento) return [];
  try {
    const rawFiestas = await leerFiestasCrudas();
    const result: Array<{ nombreItem: string; fiestaNombre: string; fiestaId: string }> = [];

    const targetDate = fechaEvento.split('T')[0];

    for (const f of rawFiestas) {
      if (f.id === fiestaActualId) continue;
      const fDate = f.configuracion?.fechaEvento?.split('T')[0];
      if (fDate === targetDate) {
        const items = f.decoracion?.itemsDecoracion || [];
        for (const it of items) {
          result.push({
            nombreItem: it.nombre,
            fiestaNombre: f.configuracion?.nombreEvento || 'Otra fiesta',
            fiestaId: f.id,
          });
        }
      }
    }

    return result;
  } catch (e) {
    console.error('[decoracion] error comprobando disponibilidad de elementos', e);
    return [];
  }
}
