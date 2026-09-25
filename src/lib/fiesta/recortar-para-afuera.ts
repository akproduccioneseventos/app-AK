import type { FiestaEnPlanificacion } from '@/types/fiesta';

/**
 * LO QUE VIAJA A QUIEN NO ES DEL EQUIPO (25 de septiembre de 2026).
 *
 * `getFiestaById` es una acción del servidor que usan también las pantallas públicas —la
 * invitación, el muro, la pantalla en vivo—. **Cualquiera que tenga el número de la fiesta, que
 * va en el enlace que reciben 200 invitados, la podía llamar y recibía la fiesta entera**: los
 * sueldos del personal, los costos, el contrato, los avisos de pago, el teléfono de cada
 * invitado y su credencial. Lo pedían las órdenes 64 y 67 (pregunta 14) y se había escapado.
 *
 * - **Sin sesión de nadie:** se saca lo interno del equipo, lo privado del cliente y, de cada
 *   invitado, el contacto, las notas y la credencial.
 * - **Con la sesión del portal de ESA fiesta (el cliente):** se saca sólo lo interno del equipo.
 *   El contrato, sus pagos y las credenciales de sus invitados son suyos.
 *
 * Los campos se BORRAN (quedan ausentes), no se vacían: así `preserveFiestaSecrets` sabe que no
 * los cambió nadie y los repone al guardar. Si no, una pantalla pública que lee y guarda la
 * fiesta borraría los sueldos o el contrato sin querer.
 */
export const CAMPOS_DEL_EQUIPO = [
  'personalAsignado',
  'gestionCostos',
  'pagosProveedores',
  'carasIndexadas',
  'comprasSugeridas',
  'listaDeCargaOperativa',
  'estadosCompra',
  'googleSyncWarning',
  'referidoPor',
  'referidosGenerados',
] as const;

export const CAMPOS_DEL_CLIENTE = [
  'contratoServicioTexto',
  'contratoSalonTexto',
  'contratoGenerado',
  'contratoDatos',
  'contratoFirmaInfo',
  'firmaDigitalConstancia',
  'planDePagos',
  'clientPaymentNotifications',
  'clientMenuChangeRequests',
  'clientServiceChangeRequests',
  'clientGuestCountChangeRequests',
  'clientNotes',
  'clientChecklist',
  'mensajesCliente',
  'othersDocumentos',
  'documentosRequeridos',
  'invoiceIds',
  'reuniones',
  'tareas',
  'npsScore',
] as const;

export const CAMPOS_PRIVADOS_DEL_INVITADO = [
  'contacto',
  'notes',
  'guestAccessToken',
  'alergiasEspecificas',
  'readinessScore',
] as const;

export function recortarFiestaParaAfuera(
  fiesta: FiestaEnPlanificacion,
  quien: { esCliente: boolean },
): FiestaEnPlanificacion {
  const copia: Record<string, unknown> = { ...fiesta };
  for (const campo of CAMPOS_DEL_EQUIPO) delete copia[campo];
  if (quien.esCliente) return copia as unknown as FiestaEnPlanificacion;

  for (const campo of CAMPOS_DEL_CLIENTE) delete copia[campo];
  if (Array.isArray(fiesta.invitados)) {
    copia.invitados = fiesta.invitados.map((inv) => {
      const limpio: Record<string, unknown> = { ...inv };
      for (const campo of CAMPOS_PRIVADOS_DEL_INVITADO) delete limpio[campo];
      return limpio;
    });
  }
  if (fiesta.configuracion) {
    const { clienteId: _clienteId, ...config } = fiesta.configuracion as unknown as Record<string, unknown>;
    copia.configuracion = config;
  }
  return copia as unknown as FiestaEnPlanificacion;
}

/**
 * Al guardar: lo que llegó AUSENTE porque se recortó se repone desde lo guardado. Lo que llega
 * presente, aunque sea vacío, se respeta: eso es alguien que lo cambió a propósito.
 */
export function reponerLoRecortado(
  entra: FiestaEnPlanificacion,
  guardada: FiestaEnPlanificacion,
): FiestaEnPlanificacion {
  const salida: Record<string, unknown> = { ...entra };
  const origen = guardada as unknown as Record<string, unknown>;
  for (const campo of [...CAMPOS_DEL_EQUIPO, ...CAMPOS_DEL_CLIENTE]) {
    if (!(campo in salida) && campo in origen) salida[campo] = origen[campo];
  }
  const configEntra = entra.configuracion as unknown as Record<string, unknown> | undefined;
  const configGuardada = guardada.configuracion as unknown as Record<string, unknown> | undefined;
  if (configEntra && configGuardada && !('clienteId' in configEntra) && 'clienteId' in configGuardada) {
    salida.configuracion = { ...configEntra, clienteId: configGuardada.clienteId };
  }
  if (Array.isArray(entra.invitados) && Array.isArray(guardada.invitados)) {
    const porId = new Map(guardada.invitados.map((i) => [i.id, i as unknown as Record<string, unknown>]));
    salida.invitados = entra.invitados.map((inv) => {
      const antes = porId.get(inv.id);
      if (!antes) return inv;
      const junto: Record<string, unknown> = { ...inv };
      for (const campo of CAMPOS_PRIVADOS_DEL_INVITADO) {
        if (!(campo in junto) && campo in antes) junto[campo] = antes[campo];
      }
      return junto;
    });
  }
  return salida as unknown as FiestaEnPlanificacion;
}
