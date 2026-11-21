'use server';

import { requirePermisoAlguno } from '@/lib/auth/require-session';
import { PERMISOS } from '@/lib/auth/perfiles';
import {
  extraerCharlasDesdeArchivos,
  procesarCharlasViejasWhatsApp,
  type ResultadoRescateCharlas,
} from '@/lib/whatsapp/rescatar-charlas';

const MAX_FILES = 50;
const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // 50 MB

export async function rescatarCharlasViejasAction(
  formData: FormData,
): Promise<{ success: boolean; data?: ResultadoRescateCharlas; error?: string }> {
  await requirePermisoAlguno(PERMISOS.CRM);

  try {
    const rawFiles = formData.getAll('archivos');
    const files = rawFiles.filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length === 0) {
      return { success: false, error: 'Subí al menos un archivo .txt o .zip de "Exportar chat" de WhatsApp.' };
    }
    if (files.length > MAX_FILES) {
      return { success: false, error: `Podés subir hasta ${MAX_FILES} archivos por tanda.` };
    }

    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > MAX_TOTAL_BYTES) {
      return { success: false, error: 'Los archivos superan el máximo de 50 MB por tanda.' };
    }

    const buffers = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        buffer: Buffer.from(await file.arrayBuffer()),
      })),
    );

    const { charlas, errores } = await extraerCharlasDesdeArchivos(buffers);
    if (charlas.length === 0) {
      return {
        success: false,
        error: errores[0] || 'No se encontraron conversaciones válidas en los archivos subidos.',
      };
    }

    const resultado = await procesarCharlasViejasWhatsApp(charlas);
    resultado.errores.push(...errores);

    return { success: true, data: resultado };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'No se pudieron procesar las charlas subidas.',
    };
  }
}
