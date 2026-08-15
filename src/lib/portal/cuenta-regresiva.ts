/**
 * Lo que dice el portal del cliente sobre cuánto falta para la fiesta.
 *
 * Antes decía siempre "Faltan N días". El día de la fiesta mostraba
 * **"Faltan 0 días"**, que suena a error, y con un día decía "Faltan 1 días".
 * Es lo primero que ve el cliente al abrir su portal.
 */
export function textoDeCuentaRegresiva(dias: number | null): string {
  if (dias === null || !Number.isFinite(dias)) return 'Fecha a confirmar';
  if (dias < 0) return '¡Ya la festejaste!';
  if (dias === 0) return '¡Es hoy!';
  if (dias === 1) return '¡Es mañana!';
  return `Faltan ${dias} días`;
}
