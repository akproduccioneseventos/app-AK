'use server';

import { generateTimelineFlow } from '@/ai/flows/generate-timeline-flow';
import type { ProgramaEventoItem } from '@/types/fiesta';

export async function generateTimelineAction(
  eventoTipo: string,
  horaInicio: string,
  duracionHoras: number,
  serviciosContratados: string[]
): Promise<{ success: boolean; data?: ProgramaEventoItem[]; error?: string }> {
  try {
    const items = await generateTimelineFlow({
      eventoTipo,
      horaInicio,
      duracionHoras,
      serviciosContratados,
    });

    if (!items || items.length === 0) {
      return { success: false, error: 'La IA no pudo generar el cronograma.' };
    }

    const formatItems: ProgramaEventoItem[] = items.map((item, index) => ({
      id: `prog_ia_${Date.now()}_${index}`,
      hora: item.hora || '20:00',
      titulo: item.titulo || 'Actividad',
      descripcion: item.descripcion || '',
      descripcionCliente: item.descripcionCliente || '',
      icono: item.icono || 'Clock',
      visibleParaCliente: true,
    }));

    return { success: true, data: formatItems };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
