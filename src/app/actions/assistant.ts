'use server';

import { chatWithAssistant } from '@/ai/flows/assistant-flow';
import { getDashboardKpiData, type GlobalAlert } from './dashboard';
import { getCompanyInfo } from './settings';
import { getPresupuestos, savePresupuesto } from './presupuestos';
import { getCustomers, saveCustomer } from './customers';

export async function sendAssistantMessage(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  imageDataUri?: string
): Promise<{
  success: boolean;
  response?: string;
  action?: { type: string; data?: any; result?: any };
  error?: string;
}> {
  try {
    // 1. Armar contexto rico con datos reales del negocio
    const [kpiResult, companyInfo, presupuestos, customers] = await Promise.all([
      getDashboardKpiData(),
      getCompanyInfo(),
      getPresupuestos(),
      getCustomers(),
    ]);

    const kpi = kpiResult.success ? kpiResult.data : null;

    const context = `
FECHA Y HORA ACTUAL: ${new Date().toLocaleString('es-UY', { timeZone: 'America/Montevideo' })}

EMPRESA:
- Nombre: ${companyInfo.companyName || 'AK Producciones'}
- Dirección: ${companyInfo.companyAddress || 'Salto, Uruguay'}
- Contacto: ${companyInfo.companyContact || 'akproduccionessalto@gmail.com'}
- RUT: ${companyInfo.companyTaxId || 'No configurado'}

KPIs:
- Próximo evento: ${kpi?.proximoEvento ? `${kpi.proximoEvento.nombre} (${kpi.proximoEvento.fecha})` : 'Sin eventos próximos'}
- Presupuestos pendientes: ${kpi?.presupuestosPendientes ?? 0}
- Facturas por vencer: ${kpi?.facturasPorVencer ?? 0}
- Alertas activas: ${kpi?.alerts?.length ?? 0}
${kpi?.alerts?.map((a: GlobalAlert) => `  · [${a.severity}] ${a.title}: ${a.description}`).join('\n') || ''}

PRESUPUESTOS RECIENTES (últimos 5):
${presupuestos.slice(-5).map(p => `- #${p.numero} ${p.clienteNombre} | ${p.eventoTipo} | $${p.totalConDescuento ?? p.costoTotalEstimado} | ${p.estado}`).join('\n') || 'Sin presupuestos'}

CLIENTES (últimos 5):
${customers.slice(-5).map(c => `- ${c.name} | ${c.partyType ?? 'Sin tipo'} | ${c.partyDate ?? 'Sin fecha'}`).join('\n') || 'Sin clientes'}
`;

    // 2. Llamar al flow
    const result = await chatWithAssistant({
      message,
      history,
      context,
      imageDataUri,
    });

    // 3. Ejecutar acciones si la IA las pidió
    let actionResult: any = null;

    if (result.action?.type === 'create_customer' && result.action.data) {
      const customerResult = await saveCustomer(result.action.data);
      actionResult = customerResult;
    }

    if (result.action?.type === 'create_budget' && result.action.data) {
      const budgetResult = await savePresupuesto({
        clienteNombre: result.action.data.clienteNombre || 'Cliente nuevo',
        eventoTipo: result.action.data.eventoTipo || '',
        eventoFecha: result.action.data.eventoFecha || '',
        invitadosCantidad: result.action.data.invitados || 0,
        invitadosAdultos: result.action.data.invitados || 0,
        invitadosNinos: 0,
        invitadosAdolescentes: 0,
        itemsPresupuestados: [],
        notas: 'Creado desde el Asistente AK',
        estado: 'Borrador',
      } as Omit<import('@/types/presupuesto').Presupuesto, 'id'>);
      actionResult = budgetResult;
    }

    return {
      success: true,
      response: result.response,
      action: result.action ? { ...result.action, result: actionResult } : undefined,
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al procesar el mensaje' };
  }
}
