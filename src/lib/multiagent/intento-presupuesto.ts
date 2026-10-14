import 'server-only';
import { createHash } from 'crypto';

export function clavePresupuestoChat(requestId: string | undefined, ordinal: number): string {
  if (!requestId || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(requestId)
    || !Number.isSafeInteger(ordinal) || ordinal < 1) {
    throw new Error('Falta identificar este intento. Actualiza la pantalla antes de guardar un presupuesto.');
  }
  // Cada presupuesto del pedido tiene su propia clave; el reintento conserva la misma.
  const hash = createHash('sha256').update(JSON.stringify([requestId.toLowerCase(), 'presupuesto', ordinal])).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}
