
'use server';

import { addCrmLead } from './crm';

interface PresupuestoData {
    tipoFiesta: string;
    invitados: number;
    costoEstimado: string;
    nombre?: string;
    telefono?: string;
    email?: string;
}

export async function crearProspectoDesdeAsistente(
    data: PresupuestoData
): Promise<{ success: boolean; error?: string }> {
    try {
        const leadName = data.nombre ? `${data.nombre} (Prospecto Rápido)` : `Prospecto de ${data.tipoFiesta}`;
        let notes = `Generado desde Armado Rápido.\nTipo: ${data.tipoFiesta}\nInvitados: ${data.invitados}\nPresupuesto Estimado: ${data.costoEstimado}`;
        if (data.email) notes += `\nEmail: ${data.email}`;
        if (data.telefono) notes += `\nTeléfono: ${data.telefono}`;

        const result = await addCrmLead({
            name: leadName,
            notes: notes,
            currentStageId: 's1' // "Consultó" stage
        });

        if (!result.success) {
            throw new Error(result.error || "No se pudo crear el prospecto en el CRM.");
        }

        return { success: true };

    } catch (error: any) {
        console.error("Error creating lead from assistant:", error);
        return { success: false, error: error.message || "Error desconocido al procesar la solicitud." };
    }
}
