import type { ProfitAndLossData } from '@/app/actions/reportes';
import { armarResumenParaElContador } from '@/lib/contabilidad/resumen-para-el-contador';
import { getCompanyInfo } from '@/app/actions/settings';
import { readData } from '@/lib/data-service';
import type { GoogleWorkspaceAccount } from '@/types/google-workspace';
import {
  sendGoogleGmailMessage,
  ensureFreshGoogleAccount,
  hasServiceAccountKey,
  getServiceAccountAccessToken,
  GOOGLE_WORKSPACE_SCOPES,
} from '@/lib/google-workspace';

export type ResultadoMandarAlContador = { success: boolean; error?: string; notice?: string; enviadoA?: string };

/**
 * Manda por mail al contador el resumen armado con `datos`. NO es una acción del servidor a
 * propósito: los números tienen que venir de `getProfitAndLossData`, calculados en el servidor
 * (lo hace `mandarAlContador` en `src/app/actions/reportes.ts`). Si esto fuera una acción, desde
 * el navegador se le podía mandar al contador cualquier número con el sello de AK.
 */
export async function mandarResumenAlContador(
  datos: ProfitAndLossData,
  nombreDelMes: string,
): Promise<ResultadoMandarAlContador> {
  const company = await getCompanyInfo();
  if (!company.emailContador || !company.emailContador.trim()) {
    return {
      success: false,
      error: 'Falta configurar el mail del contador en Ajustes de Empresa.',
      notice: 'Falta mail del contador en Ajustes',
    };
  }

  const { asunto, texto, csv } = armarResumenParaElContador(datos, nombreDelMes);

  const accounts = await readData<GoogleWorkspaceAccount[]>('_google-workspace-accounts.json', []);
  let companyAccount = accounts.find((a) => a.kind === 'company');
  if (!companyAccount && hasServiceAccountKey()) {
    const saToken = await getServiceAccountAccessToken();
    if (saToken) {
      companyAccount = {
        id: 'company',
        kind: 'company',
        email: 'akproduccionessalto@gmail.com',
        calendarId: process.env.GOOGLE_WORKSPACE_CALENDAR_ID || 'primary',
        accessToken: saToken,
        scope: GOOGLE_WORKSPACE_SCOPES.join(' '),
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        connectedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'connected',
      };
    }
  }

  const freshCompany = companyAccount ? await ensureFreshGoogleAccount(companyAccount).catch(() => null) : null;
  if (!freshCompany || freshCompany.status !== 'connected' || !freshCompany.accessToken) {
    return {
      success: false,
      error: 'Conectá Google en Ajustes para enviar mails.',
      notice: 'Conectá Google en Ajustes',
    };
  }

  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #1e293b; line-height: 1.6;">
      <h2 style="color: #e11d48; margin-top: 0;">AK Producciones</h2>
      <div style="white-space: pre-wrap; font-size: 15px; margin: 16px 0;">
        ${texto.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
      </div>
      <p style="font-size: 13px; color: #64748b;">(Se adjunta la planilla detallada en formato CSV)</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0 10px 0;" />
      <p style="font-size: 12px; color: #64748b; margin: 0;">
        AK Producciones — Salto, Uruguay | www.akproducciones.uy
      </p>
    </div>
  `;

  const filename = `resumen-${nombreDelMes.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`;

  await sendGoogleGmailMessage(freshCompany, company.emailContador.trim(), asunto, html, {
    filename,
    content: csv,
    contentType: 'text/csv; charset=UTF-8',
  });

  return { success: true, enviadoA: company.emailContador.trim() };
}
