'use server';

import { verifySession } from '@/lib/auth/session-token';
import type { MarketingAutomationResult } from '@/lib/marketing-automation';

/**
 * Estado del interruptor del recontacto automático.
 *
 * Sólo el administrador lo ve y lo cambia: son mensajes de WhatsApp a clientes
 * reales, así que no alcanza con tener sesión del equipo.
 */
export async function getRecontactoAutomaticoActivo(): Promise<boolean> {
  const session = await verifySession();
  if (!session.success || session.user?.role !== 'admin') return false;

  const { getAjustesDeRecontacto } = await import('@/lib/marketing/recontacto-automatico');
  return (await getAjustesDeRecontacto()).activo;
}

export async function setRecontactoAutomaticoActivo(
  activo: boolean,
): Promise<{ success: boolean; activo: boolean; error?: string }> {
  const session = await verifySession();
  if (!session.success || session.user?.role !== 'admin') {
    return { success: false, activo: false, error: 'Solo un administrador puede cambiar esto.' };
  }

  const { setAjustesDeRecontacto } = await import('@/lib/marketing/recontacto-automatico');
  const ajustes = await setAjustesDeRecontacto(activo === true);
  return { success: true, activo: ajustes.activo };
}

export async function runMarketingAutomationFromAdmin(
  options?: { force?: boolean }
): Promise<MarketingAutomationResult> {
  const session = await verifySession();
  if (!session.success || session.user?.role !== 'admin') {
    return {
      success: false,
      skipped: false,
      ranSeo: false,
      ranInstagram: false,
      source: 'admin',
      message: 'Solo un administrador puede ejecutar la automatizacion de marketing.',
      error: 'No autorizado',
    };
  }

  try {
    const { runMarketingAutomation } = await import('@/lib/marketing-automation');
    return await runMarketingAutomation({
      source: 'admin',
      force: options?.force === true,
    });
  } catch (error: any) {
    console.error('[marketing-automation] Admin run failed:', error);
    return {
      success: false,
      skipped: false,
      ranSeo: false,
      ranInstagram: false,
      source: 'admin',
      message: 'No se pudo ejecutar la automatizacion de marketing.',
      error: error.message || 'Error inesperado',
    };
  }
}
