'use server';

import { chatWithAssistant } from '@/ai/flows/assistant-flow';
import { getDashboardKpiData, type GlobalAlert } from './dashboard';
import { getCompanyInfo } from './settings';
import { getPresupuestos, savePresupuesto, addPagoToPresupuesto } from './presupuestos';
import { getCustomers, saveCustomer } from './customers';
import { saveInvoice } from './invoices';
import { getServiciosEmpresa, saveServicioEmpresa } from './servicios-empresa';
import { saveEmpleado } from './empleados';
import { saveProveedor } from './proveedores';
import { createNewFiestaForCustomer, getAllFiestas, saveFiesta } from './fiesta/fiesta.actions';
import type { Presupuesto } from '@/types/presupuesto';
import type { Invoice, InvoiceItem } from '@/types/invoice';
import type { Customer } from '@/types/customer';

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
    const [kpiResult, companyInfo, presupuestos, customers, servicios] = await Promise.all([
      getDashboardKpiData(),
      getCompanyInfo(),
      getPresupuestos(),
      getCustomers(),
      getServiciosEmpresa(),
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

PRESUPUESTOS RECIENTES (últimos 10):
${presupuestos.slice(-10).map(p => `- ID:${p.id} #${p.numero} ${p.clienteNombre} | ${p.eventoTipo} | $${p.totalConDescuento ?? p.costoTotalEstimado} | ${p.estado} | Fecha: ${p.eventoFecha || 'Sin fecha'}`).join('\n') || 'Sin presupuestos'}

CLIENTES (últimos 10):
${customers.slice(-10).map(c => `- ID:${c.id} ${c.name} | ${c.partyType ?? 'Sin tipo'} | ${c.partyDate ?? 'Sin fecha'} | Tel: ${c.phone || 'Sin tel'}`).join('\n') || 'Sin clientes'}

SERVICIOS DE EMPRESA (primeros 15):
${servicios.slice(0, 15).map(s => `- ID:${s.id} ${s.nombre} | ${s.categoria} | Precio venta: $${s.precioVenta ?? s.valorUnitarioEstimado}`).join('\n') || 'Sin servicios configurados'}
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
      } as unknown as Omit<Presupuesto, 'id'>);
      actionResult = budgetResult;
    }

    if (result.action?.type === 'import_budget_from_image' && result.action.data) {
      const d = result.action.data;
      try {
        // 1. Crear cliente si viene nombre
        let clienteId: string | undefined;
        if (d.clienteNombre) {
          const existingCustomer = customers.find(
            c => c.name.toLowerCase().includes(d.clienteNombre.toLowerCase())
          );
          if (existingCustomer) {
            clienteId = existingCustomer.id;
          } else {
            const newCustomer = await saveCustomer({
              name: d.clienteNombre,
              partyType: d.eventoTipo || '',
              partyDate: d.eventoFecha || '',
              guestCount: d.invitados || 0,
            });
            clienteId = newCustomer.id;
          }
        }
        // 2. Crear presupuesto
        const budgetResult = await savePresupuesto({
          clienteNombre: d.clienteNombre || 'Cliente importado',
          eventoTipo: d.eventoTipo || '',
          eventoFecha: d.eventoFecha || '',
          invitadosCantidad: d.invitados || 0,
          invitadosAdultos: d.invitados || 0,
          invitadosNinos: 0,
          invitadosAdolescentes: 0,
          itemsPresupuestados: [],
          notas: d.notas || 'Importado desde imagen/PDF vía Asistente AK',
          estado: 'Borrador',
        } as unknown as Omit<Presupuesto, 'id'>);
        // 3. Crear fiesta si tenemos clienteId
        let fiestaResult: any = null;
        if (clienteId) {
          const customerForFiesta = customers.find(c => c.id === clienteId) || {
            id: clienteId,
            name: d.clienteNombre,
            partyDate: d.eventoFecha,
            partyType: d.eventoTipo,
            guestCount: d.invitados,
          };
          fiestaResult = await createNewFiestaForCustomer({
            id: clienteId,
            name: customerForFiesta.name || d.clienteNombre,
            partyDate: d.eventoFecha,
            partyType: d.eventoTipo,
            guestCount: d.invitados,
          });
        }
        actionResult = { success: budgetResult.success, id: budgetResult.id, fiestaId: fiestaResult?.fiestaId };
      } catch (e: any) {
        actionResult = { success: false, error: e.message };
      }
    }

    if (result.action?.type === 'register_payment' && result.action.data) {
      const d = result.action.data;
      try {
        let presupuestoId = d.presupuestoId;
        if (!presupuestoId && d.clienteNombre) {
          const found = presupuestos
            .filter(p => p.clienteNombre.toLowerCase().includes(d.clienteNombre.toLowerCase()))
            .sort((a, b) => new Date(b.eventoFecha || 0).getTime() - new Date(a.eventoFecha || 0).getTime());
          presupuestoId = found[0]?.id;
        }
        if (!presupuestoId) {
          actionResult = { success: false, error: 'No se encontró el presupuesto para ese cliente.' };
        } else {
          const pagoResult = await addPagoToPresupuesto(presupuestoId, {
            fecha: new Date().toISOString(),
            monto: Number(d.monto) || 0,
            metodoPago: d.metodoPago || 'Efectivo',
            referencia: d.referencia,
          });
          actionResult = { success: pagoResult.success, presupuestoId, error: pagoResult.error };
        }
      } catch (e: any) {
        actionResult = { success: false, error: e.message };
      }
    }

    if (result.action?.type === 'create_invoice' && result.action.data) {
      const d = result.action.data;
      try {
        const customer: Customer = customers.find(c =>
          c.name.toLowerCase().includes((d.clienteNombre || '').toLowerCase())
        ) || {
          id: `tmp_${Date.now()}`,
          name: d.clienteNombre || 'Cliente',
          phone: '',
          partyDate: '',
          partyType: '',
          guestCount: 0,
          venueName: '',
        };
        const rawItems: Array<{ description?: string; quantity?: number; unitPrice?: number }> = Array.isArray(d.items) ? d.items : [];
        const invoiceItems: InvoiceItem[] = rawItems.map((item, i) => ({
          id: `item_${i}_${Date.now()}`,
          description: item.description || 'Servicio',
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          total: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
        }));
        const subtotal = invoiceItems.reduce((sum, i) => sum + i.total, 0);
        const invoiceData: Omit<Invoice, 'id' | 'invoiceNumber'> = {
          customer,
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          items: invoiceItems,
          subtotal,
          totalAmount: subtotal,
          status: 'Draft',
          notes: d.notas || 'Creada desde el Asistente AK',
          currency: d.currency || 'UYU',
          vendorName: companyInfo.companyName || 'AK Producciones',
          vendorAddress: companyInfo.companyAddress,
          vendorTaxId: companyInfo.companyTaxId,
        };
        const invoiceResult = await saveInvoice(invoiceData as any);
        actionResult = invoiceResult;
      } catch (e: any) {
        actionResult = { success: false, error: e.message };
      }
    }

    if (result.action?.type === 'update_service_price' && result.action.data) {
      const d = result.action.data;
      try {
        let servicio = d.servicioId
          ? servicios.find(s => s.id === d.servicioId)
          : servicios.find(s => s.nombre.toLowerCase().includes((d.servicioNombre || '').toLowerCase()));
        if (!servicio) {
          actionResult = { success: false, error: `No se encontró el servicio "${d.servicioNombre}".` };
        } else {
          const updated = await saveServicioEmpresa({ ...servicio, precioVenta: Number(d.nuevoPrecio) });
          actionResult = { success: updated.success, id: updated.id, error: updated.error };
        }
      } catch (e: any) {
        actionResult = { success: false, error: e.message };
      }
    }

    if (result.action?.type === 'create_employee' && result.action.data) {
      const d = result.action.data;
      try {
        const empResult = await saveEmpleado({
          nombre: d.nombre || '',
          cedula: d.cedula,
          fechaNacimiento: d.fechaNacimiento,
        });
        actionResult = empResult;
      } catch (e: any) {
        actionResult = { success: false, error: e.message };
      }
    }

    if (result.action?.type === 'create_supplier' && result.action.data) {
      const d = result.action.data;
      try {
        const provResult = await saveProveedor({
          tipo: d.tipo || 'Proveedor',
          nombre: d.nombre || '',
          nombreEmpresa: d.nombreEmpresa || d.nombre || '',
          servicioPrincipal: d.servicioPrincipal || '',
          telefono: d.telefono,
          email: d.email,
          notas: d.notas,
        });
        actionResult = provResult;
      } catch (e: any) {
        actionResult = { success: false, error: e.message };
      }
    }

    if (result.action?.type === 'create_event' && result.action.data) {
      const d = result.action.data;
      try {
        let clienteId: string;
        const existing = customers.find(c =>
          c.name.toLowerCase().includes((d.clienteNombre || '').toLowerCase())
        );
        if (existing) {
          clienteId = existing.id;
        } else {
          const newCustomer = await saveCustomer({
            name: d.clienteNombre || 'Cliente nuevo',
            phone: d.clientePhone || '',
            partyDate: d.eventoFecha || '',
            partyType: d.eventoTipo || '',
            guestCount: Number(d.invitados) || 0,
            venueName: d.venueName || '',
          });
          clienteId = newCustomer.id || `tmp_${Date.now()}`;
        }
        const fiestaResult = await createNewFiestaForCustomer({
          id: clienteId,
          name: d.clienteNombre || 'Cliente nuevo',
          partyDate: d.eventoFecha,
          partyType: d.eventoTipo,
          venueName: d.venueName,
          guestCount: Number(d.invitados) || 0,
        });
        actionResult = { success: fiestaResult.success, fiestaId: fiestaResult.fiestaId, clienteId, error: fiestaResult.error };
      } catch (e: any) {
        actionResult = { success: false, error: e.message };
      }
    }

    if (result.action?.type === 'update_event' && result.action.data) {
      const d = result.action.data;
      try {
        const allFiestas = await getAllFiestas();
        let fiesta = d.fiestaId
          ? allFiestas.find(f => f.id === d.fiestaId)
          : allFiestas.find(f =>
              (f.configuracion?.nombreEvento || '').toLowerCase().includes((d.clienteNombre || '').toLowerCase()) ||
              (f.configuracion?.clienteNombre || '').toLowerCase().includes((d.clienteNombre || '').toLowerCase())
            );
        if (!fiesta) {
          actionResult = { success: false, error: 'No se encontró el evento.' };
        } else {
          const updates = d.camposAActualizar || {};
          const updatedFiesta = {
            ...fiesta,
            configuracion: {
              ...fiesta.configuracion,
              ...(updates.fechaEvento ? { fechaEvento: updates.fechaEvento } : {}),
              ...(updates.nombreEvento ? { nombreEvento: updates.nombreEvento } : {}),
              ...(updates.venueName ? { lugarDelEvento: updates.venueName } : {}),
              ...(updates.cantidadInvitados ? { cantidadInvitados: Number(updates.cantidadInvitados) } : {}),
            },
          };
          const saveResult = await saveFiesta(updatedFiesta);
          actionResult = { success: saveResult.success, fiestaId: fiesta.id, error: saveResult.error };
        }
      } catch (e: any) {
        actionResult = { success: false, error: e.message };
      }
    }

    if (result.action?.type === 'generate_contract' && result.action.data) {
      const d = result.action.data;
      try {
        if (d.fiestaId) {
          actionResult = { success: true, href: `/fiestas/nueva/gestion-documental/contrato-digital?fiestaId=${d.fiestaId}` };
        } else if (d.clienteNombre) {
          const allFiestas = await getAllFiestas();
          const fiesta = allFiestas.find(f =>
            (f.configuracion?.clienteNombre || '').toLowerCase().includes(d.clienteNombre.toLowerCase())
          );
          actionResult = fiesta
            ? { success: true, href: `/fiestas/nueva/gestion-documental/contrato-digital?fiestaId=${fiesta.id}` }
            : { success: false, error: 'No se encontró el evento de ese cliente.' };
        } else {
          actionResult = { success: true, href: '/fiestas/nueva/gestion-documental/contrato-digital' };
        }
      } catch (e: any) {
        actionResult = { success: false, error: e.message };
      }
    }

    if (result.action?.type === 'check_availability' && result.action.data) {
      const d = result.action.data;
      try {
        const allFiestas = await getAllFiestas();
        const fecha = d.fecha || '';
        const eventosEnFecha = allFiestas.filter(f => {
          const fe = f.configuracion?.fechaEvento || '';
          return fe && fe.startsWith(fecha.substring(0, Math.min(10, fecha.length)));
        });
        actionResult = {
          success: true,
          fecha,
          disponible: eventosEnFecha.length === 0,
          eventosEnFecha: eventosEnFecha.map(f => ({
            nombre: f.configuracion?.nombreEvento || f.configuracion?.clienteNombre || 'Evento sin nombre',
            tipo: f.configuracion?.tipoCelebracion || '',
          })),
        };
      } catch (e: any) {
        actionResult = { success: false, error: e.message };
      }
    }

    if (result.action?.type === 'update_marketing_content' && result.action.data) {
      actionResult = { success: true, href: '/marketing' };
    }

    return {
      success: true,
      response: result.response,
      action: result.action ? { ...result.action, result: actionResult } as any : undefined,
    };
  } catch (error: any) {
    const errorMessage: string = error.message || '';
    if (
      (errorMessage.includes('FAILED_PRECONDITION') && errorMessage.includes('API key')) ||
      errorMessage.includes('GEMINI_API_KEY') ||
      errorMessage.includes('GOOGLE_API_KEY')
    ) {
      return {
        success: false,
        error: 'El Asistente IA no está configurado todavía. El administrador necesita configurar la API key de Google Gemini. Mientras tanto, podés usar las otras funciones de la app normalmente.',
      };
    }
    return { success: false, error: errorMessage || 'Error al procesar el mensaje' };
  }
}
