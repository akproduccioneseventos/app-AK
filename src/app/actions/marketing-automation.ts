'use server';

import { verifySession } from '@/lib/auth/session-token';
import { runMarketingAutomation } from '@/lib/marketing-automation';

export async function runMarketingAutomationFromAdmin(options?: { force?: boolean }) {
  const session = await verifySession();
  if (!session.success || session.user?.role !== 'admin') {
    return {
      success: false,
      skipped: false,
      ranSeo: false,
      ranInstagram: false,
      message: 'Solo un administrador puede ejecutar la automatizacion de marketing.',
      error: 'No autorizado',
    };
  }

  try {
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
      message: 'No se pudo ejecutar la automatizacion de marketing.',
      error: error.message || 'Error inesperado',
    };
  }
}
