import type { AutoBackupStatus } from '@/app/actions/backup';

export type EstadoRespaldo = 'cargando' | 'no-se-pudo-saber' | 'al-dia' | 'vencido';

/**
 * Orden 59 - Bloque A: Determina el estado del cartel de respaldos.
 *
 * Distingue cuatro estados sinceros:
 * 1. 'cargando': mientras se consulta el estado. Neutro.
 * 2. 'no-se-pudo-saber': la consulta falló o dio null sin respuesta. Ámbar, nunca verde.
 * 3. 'al-dia': confirmado y con respaldo reciente. Verde.
 * 4. 'vencido': sin respaldo reciente (>24hs) o con fallas repetidas. Rojo.
 */
export function comoEstaElRespaldo(params: {
  cargando: boolean;
  backupStatus: AutoBackupStatus | null;
  falloConsulta?: boolean;
}): EstadoRespaldo {
  if (params.cargando) return 'cargando';
  if (params.falloConsulta || !params.backupStatus) return 'no-se-pudo-saber';
  if (params.backupStatus.isStale || params.backupStatus.hasRepeatedErrors) return 'vencido';
  return 'al-dia';
}

