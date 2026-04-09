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
    // finalResponse starts as the AI response; budget/import actions will replace it with verified data
    let finalResponse = result.response;

    if (result.action?.type === 'create_customer' && result.action.data) {
      const customerResult = await saveCustomer(result.action.data);
      actionResult = customerResult;
      if (!customerResult.success) {
        finalResponse = `❌ No se pudo guardar el cliente: ${customerResult.error || 'Error desconocido'}. Intentá de nuevo o ingresalo manualmente desde /customers/new.`;
      }
    }

    if (result.action?.type === 'create_budget' && result.action.data) {
      const d = result.action.data;
      const serviciosRaw: Array<{
        id?: string; nombre?: string; name?: string; descripcion?: string;
        cantidad?: number; precioUnitario?: number; precio?: number; categoria?: string; category?: string;
      }> = Array.isArray(d.servicios) ? d.servicios : [];
      const items = serviciosRaw.map((s, i) => {
        const qty = Number(s.cantidad) || 1;
        const price = Number(s.precioUnitario) || Number(s.precio) || 0;
        return {
          idServicioCatalogo: s.id || `asistente_${i}_${Date.now()}`,
          nombreServicio: s.nombre || s.name || 'Servicio',
          descripcionServicio: s.descripcion,
          cantidad: qty,
          precioUnitario: price,
          precioUnitarioPresupuesto: price,
          costoTotalItem: qty * price,
          categoriaServicio: s.categoria || s.category || 'Servicios',
        };
      });
      const budgetResult = await savePresupuesto({
        clienteNombre: d.clienteNombre || 'Cliente nuevo',
        eventoTipo: d.eventoTipo || '',
        eventoFecha: d.eventoFecha || '',
        invitadosCantidad: d.invitados || 0,
        invitadosAdultos: d.invitados || 0,
        invitadosNinos: 0,
        invitadosAdolescentes: 0,
        itemsPresupuestados: items,
        notas: d.notas || 'Creado desde el Asistente AK',
        estado: 'Borrador',
        senia: d.senia != null ? Number(d.senia) : undefined,
        saldo: d.saldo != null ? Number(d.saldo) : undefined,
        ajusteAnualPorcentaje: d.ajusteAnualPorcentaje != null ? Number(d.ajusteAnualPorcentaje) : undefined,
        fechaFirmaContrato: d.fechaFirmaContrato,
      } as unknown as Omit<Presupuesto, 'id'>);

      if (budgetResult.success && budgetResult.presupuesto) {
        const pres = budgetResult.presupuesto;
        const itemCount = pres.itemsPresupuestados?.length ?? 0;
        const total = pres.totalConDescuento ?? pres.costoTotalEstimado ?? 0;
        const href = `/presupuestos/${pres.id}/ver`;
        actionResult = { ...budgetResult, itemCount, total, href };
        if (itemCount > 0) {
          finalResponse = `✅ Se creó el presupuesto **#${pres.numero}** para **${pres.clienteNombre}** con **${itemCount} ${itemCount === 1 ? 'servicio' : 'servicios'}** y total **$${total.toLocaleString('es-UY')}**. Podés verlo acá: ${href}`;
        } else {
          finalResponse = `⚠️ Se creó el presupuesto **#${pres.numero}** para **${pres.clienteNombre}**, pero quedó **sin servicios** porque no pude estructurar los items desde los datos proporcionados. Podés editarlo y agregar los servicios manualmente: /presupuestos/${pres.id}/editar`;
        }
      } else {
        actionResult = budgetResult;
        finalResponse = `❌ No se pudo crear el presupuesto: ${budgetResult.error || 'Error desconocido'}. Intentá de nuevo o crealo manualmente desde /presupuestos/nuevo.`;
      }
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
        const importedServices: Array<{
          id?: string; nombre?: string; name?: string; descripcion?: string;
          cantidad?: number; precioUnitario?: number; precio?: number; categoria?: string; category?: string;
        }> = Array.isArray(d.servicios) ? d.servicios : [];
        const importedItems = importedServices.map((s, i) => {
          const qty = Number(s.cantidad) || 1;
          const price = Number(s.precioUnitario) || Number(s.precio) || 0;
          return {
            idServicioCatalogo: s.id || `importado_${i}_${Date.now()}`,
            nombreServicio: s.nombre || s.name || 'Servicio',
            descripcionServicio: s.descripcion,
            cantidad: qty,
            precioUnitario: price,
            precioUnitarioPresupuesto: price,
            costoTotalItem: qty * price,
            categoriaServicio: s.categoria || s.category || 'Servicios',
          };
        });
        const budgetResult = await savePresupuesto({
          clienteNombre: d.clienteNombre || 'Cliente importado',
          eventoTipo: d.eventoTipo || '',
          eventoFecha: d.eventoFecha || '',
          invitadosCantidad: d.invitados || 0,
          invitadosAdultos: d.invitados || 0,
          invitadosNinos: 0,
          invitadosAdolescentes: 0,
          itemsPresupuestados: importedItems,
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

        if (budgetResult.success && budgetResult.presupuesto) {
          const pres = budgetResult.presupuesto;
          const itemCount = pres.itemsPresupuestados?.length ?? 0;
          const total = pres.totalConDescuento ?? pres.costoTotalEstimado ?? 0;
          const href = `/presupuestos/${pres.id}/ver`;
          actionResult = { success: true, id: pres.id, fiestaId: fiestaResult?.fiestaId, itemCount, total, href };
          if (itemCount > 0) {
            finalResponse = `✅ Se importó el presupuesto **#${pres.numero}** para **${pres.clienteNombre}** con **${itemCount} ${itemCount === 1 ? 'servicio' : 'servicios'}** y total **$${total.toLocaleString('es-UY')}**. Podés verlo acá: ${href}` +
              (fiestaResult?.fiestaId ? ` | [Ver evento](/fiestas/nueva?fiestaId=${fiestaResult.fiestaId})` : '') +
              (importedItems.length === 0 && d.totalMonto ? `\n\n⚠️ Nota: no se detectaron servicios individuales en el archivo — se registró solo el total general.` : '');
          } else {
            finalResponse = `⚠️ Se creó un borrador **#${pres.numero}** para **${pres.clienteNombre}**, pero quedó **sin servicios** porque no pude extraer los items del archivo. Total extraído: $${d.totalMonto?.toLocaleString('es-UY') ?? 0}. Podés editarlo manualmente para completarlo: /presupuestos/${pres.id}/editar` +
              (fiestaResult?.fiestaId ? ` | [Ver evento](/fiestas/nueva?fiestaId=${fiestaResult.fiestaId})` : '');
          }
        } else {
          actionResult = { success: false, error: budgetResult.error };
          finalResponse = `❌ No se pudo importar el presupuesto: ${budgetResult.error || 'Error desconocido'}. Intentá de nuevo o subí el archivo nuevamente.`;
        }
      } catch (e: any) {
        actionResult = { success: false, error: e.message };
        finalResponse = `❌ Error al importar el presupuesto: ${e.message}. Intentá de nuevo.`;
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
        const allFiestas = await getAllFiestas();
        let fiesta = d.fiestaId
          ? allFiestas.find(f => f.id === d.fiestaId)
          : d.clienteNombre
          ? allFiestas.find(f =>
              (f.configuracion?.clienteNombre || '').toLowerCase().includes(d.clienteNombre.toLowerCase())
            )
          : undefined;

        // Save contract data to fiesta when found
        if (fiesta) {
          const contratoDatos = {
            senia: d.senia != null ? Number(d.senia) : fiesta.contratoDatos?.senia,
            saldo: d.saldo != null ? Number(d.saldo) : fiesta.contratoDatos?.saldo,
            ajusteAnualPorcentaje: (d.ajusteAnualPorcentaje ?? d.ajusteAnual) != null ? Number(d.ajusteAnualPorcentaje ?? d.ajusteAnual) : fiesta.contratoDatos?.ajusteAnualPorcentaje,
            fechaFirmaContrato: d.fechaFirmaContrato || fiesta.contratoDatos?.fechaFirmaContrato,
            clausulas: d.clausulas || fiesta.contratoDatos?.clausulas,
          };
          const updatedFiesta = { ...fiesta, contratoDatos };
          await saveFiesta(updatedFiesta);
          actionResult = { success: true, href: `/fiestas/nueva/gestion-documental/contrato-digital?fiestaId=${fiesta.id}` };
        } else if (d.fiestaId) {
          actionResult = { success: false, error: 'No se encontró el evento.' };
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

    if (result.action?.type === 'generate_social_post' && result.action.data) {
      // Content is already generated by the AI in action.data.content — just confirm success
      actionResult = { success: true, content: result.action.data.content };
    }

    if (result.action?.type === 'generate_whatsapp_message' && result.action.data) {
      // Content is already generated by the AI in action.data.content — just confirm success
      actionResult = { success: true, content: result.action.data.content };
    }

    if (result.action?.type === 'generate_promo' && result.action.data) {
      // Content is already generated by the AI in action.data.content — just confirm success
      actionResult = { success: true, content: result.action.data.content };
    }

    if (result.action?.type === 'update_marketing_content' && result.action.data) {
      actionResult = { success: true, href: '/marketing' };
    }

    return {
      success: true,
      response: finalResponse,
      action: result.action ? { ...result.action, result: actionResult } as any : undefined,
    };
  } catch (error: any) {
    const errorMessage: string = error.message || String(error) || '';
    console.error('[Asistente AK] Error en sendAssistantMessage:', errorMessage);

    const isApiKeyError =
      (errorMessage.includes('FAILED_PRECONDITION') && errorMessage.includes('API key')) ||
      errorMessage.includes('GEMINI_API_KEY') ||
      errorMessage.includes('GOOGLE_API_KEY') ||
      errorMessage.includes('API_KEY_INVALID') ||
      errorMessage.includes('403') ||
      errorMessage.includes('Forbidden') ||
      errorMessage.includes('denied access') ||
      errorMessage.includes('API key not valid') ||
      errorMessage.includes('not configured');

    if (isApiKeyError) {
      return {
        success: false,
        error: 'El asistente no está disponible: la clave de API de Gemini no está configurada o no es válida. Por favor, configurá la variable de entorno GOOGLE_API_KEY o GEMINI_API_KEY en el panel de despliegue.',
      };
    }

    // For quota exceeded errors
    if (
      errorMessage.includes('429') ||
      errorMessage.includes('RESOURCE_EXHAUSTED') ||
      errorMessage.includes('quota')
    ) {
      return {
        success: false,
        error: 'El asistente superó su cuota de uso. Intentá de nuevo en unos minutos o contactanos por WhatsApp al +59898355530.',
      };
    }

    // For model not found / unavailable
    if (
      errorMessage.includes('404') ||
      errorMessage.includes('NOT_FOUND') ||
      errorMessage.includes('model') ||
      errorMessage.includes('not found')
    ) {
      return {
        success: false,
        error: 'El modelo de IA no está disponible en este momento. Intentá de nuevo en unos minutos.',
      };
    }

    // Generic fallback - log error server-side, show generic message to user
    console.error('[Asistente AK] Unhandled error type:', errorMessage);
    return {
      success: false,
      error: 'El asistente encontró un error inesperado. Por favor, intentá de nuevo o contactanos por WhatsApp al +59898355530.',
    };
  }
}
