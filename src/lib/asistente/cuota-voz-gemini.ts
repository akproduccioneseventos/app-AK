import 'server-only';

import { mutarDocumentoConTransaccion } from '@/lib/generic-json-store';
import { hoyEnUruguay } from '@/lib/utils';

export const TOPE_DIARIO_VOZ_GEMINI = 100;
const USO_FILE = 'asistente/voz-uso.json';

/** Reserva atómicamente un uso compartido por la voz web y WhatsApp. */
export async function reservarCupoDiarioVozGemini(): Promise<boolean> {
  const hoy = hoyEnUruguay();
  let tomado = false;
  await mutarDocumentoConTransaccion<{ fecha?: string; cantidad?: number }>(USO_FILE, {}, (uso) => {
    const cantidad = uso.fecha === hoy ? uso.cantidad || 0 : 0;
    tomado = cantidad < TOPE_DIARIO_VOZ_GEMINI;
    return tomado ? { fecha: hoy, cantidad: cantidad + 1 } : null;
  });
  return tomado;
}
