'use server';

import { generateSalesPitchFlow } from '@/ai/flows/generate-sales-pitch-flow';

export async function generateSalesPitchAction(
  clienteNombre: string,
  eventoTipo: string,
  invitados: number,
  precioTotal: number,
  servicios: string[]
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const message = await generateSalesPitchFlow({
      clienteNombre,
      eventoTipo,
      invitados,
      precioTotal,
      servicios,
    });

    if (!message) {
      return { success: false, error: 'La IA no pudo generar el mensaje.' };
    }

    return { success: true, data: message };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
