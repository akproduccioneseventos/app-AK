import { PERMISOS, perfilDe, puede } from '@/lib/auth/perfiles';
import type { AkAgentType } from '@/types/multiagent';

/**
 * Control único compartido entre la API `/api/multiagent/message` y las acciones del equipo:
 * el perfil `personal` no usa el asistente del equipo y los agentes `contable` / `comercial`
 * exigen sus respectivos permisos sin depender únicamente de la ruta HTTP.
 */
export function validarAccesoAlAgente(
  user: Parameters<typeof puede>[0] & Parameters<typeof perfilDe>[0],
  agentType?: AkAgentType | string,
): { ok: true } | { ok: false; error: string } {
  if (perfilDe(user) === 'personal') {
    return { ok: false, error: 'Tu perfil no tiene acceso a ese asistente.' };
  }
  if (agentType === 'contable' && !puede(user, PERMISOS.CONTABILIDAD)) {
    return { ok: false, error: 'Tu perfil no tiene acceso al módulo contable.' };
  }
  if (agentType === 'comercial' && !puede(user, PERMISOS.CRM)) {
    return { ok: false, error: 'Tu perfil no tiene acceso al módulo comercial.' };
  }
  return { ok: true };
}
