'use server';

import { chatWithAssistant } from '@/ai/flows/assistant-flow';
import { getDashboardKpiData, type GlobalAlert } from './dashboard';
import { getCompanyInfo } from './settings';
import { getPresupuestos, savePresupuesto, addPagoToPresupuesto, updatePresupuesto } from './presupuestos';
import { getCustomers, saveCustomer } from './customers';
import { getServiciosEmpresa, saveServicioEmpresa } from './servicios-empresa';
import { getEmpleados, saveEmpleado } from './empleados';
import { getProveedores, saveProveedor } from './proveedores';
import { saveInvoice, getInvoices } from './invoices';
import { getAllFiestas, saveFiesta, createNewFiestaForCustomer } from './fiesta/fiesta.actions';
import type { Presupuesto } from '@/types/presupuesto';

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
    const [kpiResult, companyInfo, presupuestos, customers, servicios, fiestas] = await Promise.all([
      getDashboardKpiData(),
      getCompanyInfo(),
      getPresupuestos(),
      getCustomers(),
      getServiciosEmpresa(),
      getAllFiestas(),
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
${presupuestos.slice(-10).map(p => `- ID:${p.id} #${p.numero} ${p.clienteNombre} | ${p.eventoTipo} | ${p.eventoFecha} | $${p.totalConDescuento ?? p.costoTotalEstimado} | ${p.estado}`).join('\n') || 'Sin presupuestos'}

CLIENTES (últimos 10):
${customers.slice(-10).map(c => `- ID:${c.id} ${c.name} | Tel:${c.phone || '-'} | ${c.partyType ?? 'Sin tipo'} | ${c.partyDate ?? 'Sin fecha'}`).join('\n') || 'Sin clientes'}

EVENTOS/FIESTAS ACTIVOS:
${fiestas.slice(0, 10).map(f => `- ID:${f.id} ${f.configuracion.nombreEvento} | ${f.configuracion.tipoCelebracion} | ${f.configuracion.fechaEvento} | ${f.estado}`).join('\n') || 'Sin eventos'}

CATÁLOGO DE SERVICIOS (primeros 20):
${servicios.slice(0, 20).map(s => `- ID:${s.id} ${s.nombre} | ${s.categoria} | Precio:$${s.precioVenta ?? s.valorUnitarioEstimado}`).join('\n') || 'Sin servicios'}
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
        salonFiestas: result.action.data.salonFiestas || '',
        clienteContacto: result.action.data.clienteContacto || '',
        costoTotalEstimado: 0,
      } as Omit<Presupuesto, 'id'>);
      actionResult = budgetResult;
    }

    if (result.action?.type === 'import_budget_from_image' && result.action.data) {
      const d = result.action.data;
      try {
        // Step 1: Create or find customer
        let customerId: string | undefined;
        const existingCustomer = customers.find(c =>
          c.name.toLowerCase().includes((d.clienteNombre || '').toLowerCase()) ||
          (d.clienteNombre || '').toLowerCase().includes(c.name.toLowerCase())
        );
        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          const customerRes = await saveCustomer({
            name: d.clienteNombre || 'Cliente importado',
            phone: d.clienteContacto || '',
            email: d.clienteEmail || '',
            partyDate: d.eventoFecha || '',
            partyType: d.eventoTipo || '',
            venueName: d.salonFiestas || '',
            guestCount: d.invitadosCantidad || 0,
          }, { skipFiestaCreation: true });
          if (customerRes.success) customerId = customerRes.id;
        }

        // Step 2: Build items from extracted services
        const itemsPresupuestados = (d.servicios || []).map((srv: any, idx: number) => ({
          idServicioCatalogo: `imported_${idx}`,
          nombreServicio: srv.nombre || srv.name || `Servicio ${idx + 1}`,
          cantidad: srv.cantidad || 1,
          unidad: 'Unidad',
          precioUnitario: srv.precio || 0,
          precioUnitarioPresupuesto: srv.precio || 0,
          costoTotalItem: (srv.precio || 0) * (srv.cantidad || 1),
        }));

        // Step 3: Create budget
        const totalCalculado = d.total || itemsPresupuestados.reduce((s: number, i: any) => s + i.costoTotalItem, 0);
        const seña = d.senia || d.seña || 0;

        const budgetRes = await savePresupuesto({
          clienteNombre: d.clienteNombre || 'Cliente importado',
          clienteContacto: d.clienteContacto || '',
          eventoTipo: d.eventoTipo || 'Otro',
          eventoFecha: d.eventoFecha || '',
          invitadosCantidad: d.invitadosCantidad || 0,
          invitadosAdultos: d.invitadosCantidad || 0,
          invitadosNinos: 0,
          invitadosAdolescentes: 0,
          salonFiestas: d.salonFiestas || '',
          itemsPresupuestados,
          costoTotalEstimado: totalCalculado,
          totalConDescuento: totalCalculado,
          notas: `Importado desde imagen por el Asistente AK. Seña: $${seña}`,
          estado: d.estado === 'Aceptado' || (d.estado || '').toLowerCase().includes('contrat') || (d.estado || '').toLowerCase().includes('firmad') ? 'Aceptado' : 'Enviado',
        } as Omit<Presupuesto, 'id'>);

        // Step 4: Create fiesta/event linked to customer
        let fiestaId: string | undefined;
        if (customerId) {
          const fiestaRes = await createNewFiestaForCustomer({
            id: customerId,
            name: d.clienteNombre || 'Cliente importado',
            partyDate: d.eventoFecha || '',
            partyType: d.eventoTipo || '',
            venueName: d.salonFiestas || '',
            guestCount: d.invitadosCantidad || 0,
          });
          if (fiestaRes.success) fiestaId = fiestaRes.fiestaId;
        }

        // Step 5: Register seña payment if present
        if (seña > 0 && budgetRes.success && budgetRes.id) {
          await addPagoToPresupuesto(budgetRes.id, {
            fecha: d.eventoFecha || new Date().toISOString(),
            monto: seña,
            metodoPago: 'Efectivo',
            referencia: 'Seña registrada al importar desde imagen',
          });
        }

        actionResult = {
          success: budgetRes.success,
          presupuestoId: budgetRes.id,
          customerId,
          fiestaId,
          clienteNombre: d.clienteNombre,
          total: totalCalculado,
          senia: seña,
          error: budgetRes.error,
        };
      } catch (e: any) {
        actionResult = { success: false, error: e.message || 'Error al importar el presupuesto' };
      }
    }

    if (result.action?.type === 'register_payment' && result.action.data) {
      const d = result.action.data;
      try {
        // Find the matching budget by client name
        const matchingBudget = presupuestos
          .filter(p => p.estado !== 'Rechazado')
          .find(p => p.clienteNombre.toLowerCase().includes((d.clienteNombre || '').toLowerCase()) ||
            (d.clienteNombre || '').toLowerCase().includes(p.clienteNombre.toLowerCase()));

        if (!matchingBudget) {
          actionResult = { success: false, error: `No encontré ningún presupuesto para "${d.clienteNombre}". Verificá el nombre del cliente.` };
        } else {
          const pagoRes = await addPagoToPresupuesto(matchingBudget.id, {
            fecha: d.fecha || new Date().toISOString(),
            monto: Number(d.monto) || 0,
            metodoPago: d.metodoPago || 'Efectivo',
            referencia: d.referencia || (d.tipo === 'seña' ? 'Seña registrada desde Asistente AK' : 'Pago registrado desde Asistente AK'),
          });
          actionResult = {
            success: pagoRes.success,
            presupuestoId: matchingBudget.id,
            clienteNombre: matchingBudget.clienteNombre,
            monto: d.monto,
            error: pagoRes.error,
          };
        }
      } catch (e: any) {
        actionResult = { success: false, error: e.message || 'Error al registrar el pago' };
      }
    }

    if (result.action?.type === 'create_invoice' && result.action.data) {
      const d = result.action.data;
      try {
        // Try to find matching customer
        const matchingCustomer = customers.find(c =>
          c.name.toLowerCase().includes((d.clienteNombre || '').toLowerCase()) ||
          (d.clienteNombre || '').toLowerCase().includes(c.name.toLowerCase())
        );

        const items = (d.items || []).length > 0 ? d.items : [{
          description: d.eventoTipo ? `${d.eventoTipo} - ${d.clienteNombre}` : `Evento de ${d.clienteNombre}`,
          quantity: 1,
          unitPrice: d.total || 0,
        }];

        const invoiceRes = await saveInvoice({
          clientName: d.clienteNombre || 'Cliente',
          clientId: matchingCustomer?.id,
          issueDate: new Date().toISOString(),
          dueDate: d.eventoFecha || new Date().toISOString(),
          status: 'Draft',
          taxRate: 0,
          notes: d.notas || `Factura generada desde el Asistente AK`,
          items,
        });
        actionResult = {
          success: invoiceRes.success,
          invoiceId: invoiceRes.id,
          clienteNombre: d.clienteNombre,
          error: invoiceRes.error,
        };
      } catch (e: any) {
        actionResult = { success: false, error: e.message || 'Error al crear la factura' };
      }
    }

    if (result.action?.type === 'update_service_price' && result.action.data) {
      const d = result.action.data;
      try {
        // Find the matching service
        const matchingService = servicios.find(s =>
          s.nombre.toLowerCase().includes((d.nombreServicio || '').toLowerCase()) ||
          (d.nombreServicio || '').toLowerCase().includes(s.nombre.toLowerCase())
        );

        if (!matchingService) {
          actionResult = { success: false, error: `No encontré ningún servicio llamado "${d.nombreServicio}". Revisá el catálogo de servicios.` };
        } else {
          const campo = d.campo || 'precioVenta';
          const updatedService = {
            ...matchingService,
            [campo]: Number(d.nuevoPrecio) || 0,
            ...(campo === 'precioVenta' ? { precioVenta: Number(d.nuevoPrecio) || 0 } : {}),
            ...(campo === 'valorUnitarioEstimado' ? { valorUnitarioEstimado: Number(d.nuevoPrecio) || 0 } : {}),
          };
          const saveRes = await saveServicioEmpresa(updatedService);
          actionResult = {
            success: saveRes.success,
            servicioId: matchingService.id,
            nombreServicio: matchingService.nombre,
            nuevoPrecio: d.nuevoPrecio,
            error: saveRes.error,
          };
        }
      } catch (e: any) {
        actionResult = { success: false, error: e.message || 'Error al actualizar el precio' };
      }
    }

    if (result.action?.type === 'create_employee' && result.action.data) {
      const d = result.action.data;
      try {
        const empleadoRes = await saveEmpleado({
          nombre: d.nombre || '',
          cedula: d.cedula || '',
          fechaNacimiento: d.fechaNacimiento || '',
          rolIds: [],
        });
        actionResult = {
          success: empleadoRes.success,
          empleadoId: empleadoRes.id,
          nombre: d.nombre,
          error: empleadoRes.error,
        };
      } catch (e: any) {
        actionResult = { success: false, error: e.message || 'Error al crear el empleado' };
      }
    }

    if (result.action?.type === 'create_supplier' && result.action.data) {
      const d = result.action.data;
      try {
        const proveedorRes = await saveProveedor({
          tipo: 'Proveedor',
          nombre: d.nombre || d.nombreEmpresa || '',
          nombreEmpresa: d.nombreEmpresa || d.nombre || '',
          servicioPrincipal: d.servicioPrincipal || 'Servicios generales',
          telefono: d.telefono || '',
          email: d.email || '',
          notas: d.notas || '',
        });
        actionResult = {
          success: proveedorRes.success,
          proveedorId: proveedorRes.id,
          nombreEmpresa: d.nombreEmpresa || d.nombre,
          error: proveedorRes.error,
        };
      } catch (e: any) {
        actionResult = { success: false, error: e.message || 'Error al crear el proveedor' };
      }
    }

    if (result.action?.type === 'create_event' && result.action.data) {
      const d = result.action.data;
      try {
        // Find or use provided clienteId
        let customerId = d.clienteId;
        if (!customerId && d.clienteNombre) {
          const matchingCustomer = customers.find(c =>
            c.name.toLowerCase().includes((d.clienteNombre || '').toLowerCase()) ||
            (d.clienteNombre || '').toLowerCase().includes(c.name.toLowerCase())
          );
          customerId = matchingCustomer?.id;
        }

        if (!customerId) {
          // Create customer first
          const customerRes = await saveCustomer({
            name: d.clienteNombre || 'Nuevo cliente',
            partyDate: d.eventoFecha || '',
            partyType: d.eventoTipo || '',
            venueName: d.salonFiestas || '',
            guestCount: d.invitadosCantidad || 0,
          }, { skipFiestaCreation: true });
          if (customerRes.success) customerId = customerRes.id;
        }

        const fiestaRes = await createNewFiestaForCustomer({
          id: customerId || `temp_${Date.now()}`,
          name: d.clienteNombre || 'Nuevo evento',
          partyDate: d.eventoFecha || '',
          partyType: d.eventoTipo || '',
          venueName: d.salonFiestas || '',
          guestCount: d.invitadosCantidad || 0,
        });
        actionResult = {
          success: fiestaRes.success,
          fiestaId: fiestaRes.fiestaId,
          clienteNombre: d.clienteNombre,
          customerId,
          error: fiestaRes.error,
        };
      } catch (e: any) {
        actionResult = { success: false, error: e.message || 'Error al crear el evento' };
      }
    }

    if (result.action?.type === 'update_event' && result.action.data) {
      const d = result.action.data;
      try {
        let targetFiesta = d.fiestaId ? fiestas.find(f => f.id === d.fiestaId) : null;
        if (!targetFiesta && d.clienteNombre) {
          targetFiesta = fiestas.find(f =>
            f.configuracion.nombreEvento?.toLowerCase().includes((d.clienteNombre || '').toLowerCase()) ||
            (d.clienteNombre || '').toLowerCase().includes((f.configuracion.nombreEvento || '').toLowerCase())
          );
        }

        if (!targetFiesta) {
          actionResult = { success: false, error: `No encontré ningún evento para "${d.clienteNombre}". Verificá el nombre.` };
        } else {
          const updatedFiesta = {
            ...targetFiesta,
            configuracion: {
              ...targetFiesta.configuracion,
              ...(d.cambios || {}),
            },
          };
          const saveRes = await saveFiesta(updatedFiesta);
          actionResult = {
            success: saveRes.success,
            fiestaId: targetFiesta.id,
            nombreEvento: targetFiesta.configuracion.nombreEvento,
            error: saveRes.error,
          };
        }
      } catch (e: any) {
        actionResult = { success: false, error: e.message || 'Error al actualizar el evento' };
      }
    }

    if (result.action?.type === 'check_availability' && result.action.data) {
      const d = result.action.data;
      try {
        const targetDate = d.fecha ? new Date(d.fecha) : null;
        const targetMes = d.mes ? Number(d.mes) : null;
        const targetAño = d.año || d.anio ? Number(d.año || d.anio) : new Date().getFullYear();

        let eventosEnFecha: typeof fiestas = [];
        if (targetDate) {
          const dateStr = targetDate.toISOString().split('T')[0];
          eventosEnFecha = fiestas.filter(f =>
            f.configuracion.fechaEvento?.startsWith(dateStr)
          );
        } else if (targetMes) {
          eventosEnFecha = fiestas.filter(f => {
            const fe = f.configuracion.fechaEvento;
            if (!fe) return false;
            const d = new Date(fe);
            return d.getMonth() + 1 === targetMes && d.getFullYear() === targetAño;
          });
        }

        actionResult = {
          success: true,
          libre: eventosEnFecha.length === 0,
          eventos: eventosEnFecha.map(f => ({
            nombre: f.configuracion.nombreEvento,
            fecha: f.configuracion.fechaEvento,
            tipo: f.configuracion.tipoCelebracion,
          })),
          fecha: d.fecha,
          mes: d.mes,
        };
      } catch (e: any) {
        actionResult = { success: false, error: e.message || 'Error al consultar disponibilidad' };
      }
    }

    if (result.action?.type === 'generate_contract' && result.action.data) {
      const d = result.action.data;
      // Find the fiesta to link to
      let targetFiesta = d.fiestaId ? fiestas.find(f => f.id === d.fiestaId) : null;
      if (!targetFiesta && d.clienteNombre) {
        targetFiesta = fiestas.find(f =>
          f.configuracion.nombreEvento?.toLowerCase().includes((d.clienteNombre || '').toLowerCase()) ||
          (d.clienteNombre || '').toLowerCase().includes((f.configuracion.nombreEvento || '').toLowerCase())
        );
      }
      actionResult = {
        success: true,
        fiestaId: targetFiesta?.id,
        clienteNombre: d.clienteNombre,
        href: targetFiesta ? `/fiestas/${targetFiesta.id}/contrato` : '/fiestas/nueva/contrato',
      };
    }

    if (result.action?.type === 'query_data') {
      // Data is already in context, the AI's response has the answer
      actionResult = { success: true };
    }

    if (result.action?.type === 'update_marketing_content') {
      // Navigate to the marketing section
      actionResult = {
        success: true,
        href: '/marketing',
        message: 'Navegá a la sección de Marketing para gestionar el contenido.',
      };
    }

    return {
      success: true,
      response: result.response,
      action: result.action ? { ...result.action, result: actionResult } : undefined,
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
