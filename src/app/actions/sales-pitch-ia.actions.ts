'use server';

import { generateSalesPitchFlow } from '@/ai/flows/generate-sales-pitch-flow';
import { hayPresupuestoParaIA } from '@/lib/ai/consumo-servidor';

import { requireAppSession } from '@/lib/auth/require-session';
export async function generateSalesPitchAction(
  clienteNombre: string,
  eventoTipo: string,
  invitados: number,
  precioTotal: number,
  servicios: string[]
): Promise<{ success: boolean; data?: string; error?: string }> {
  await requireAppSession();
  try {
    if (!(await hayPresupuestoParaIA())) {
      return {
        success: false,
        error: 'Se alcanzó el tope mensual de uso de IA. Probá de nuevo cuando se renueve el límite.',
      };
    }

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
