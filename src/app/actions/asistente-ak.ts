
'use server';

import { savePresupuesto } from './presupuestos';
import type { Presupuesto, ItemPresupuestado } from '@/types/presupuesto';
import { getServiciosEmpresa } from './servicios-empresa';
import type { ServicioEmpresa } from '@/types/empresa';


interface ArmadoRapidoData {
  clienteNombre: string;
  eventoTipo: string;
  invitadosCantidad: number;
  eventoFecha: string; // ISO String
  salonFiestas: string;
}

// Esta es la lógica central que construye el presupuesto basado en reglas.
// Fase 1: Implementa un paquete "Servicio Completo" estándar.
async function calcularServicios(invitados: number, catalogo: ServicioEmpresa[]): Promise<ItemPresupuestado[]> {
    const items: ItemPresupuestado[] = [];

    const findService = (name: string) => catalogo.find(s => s.nombre.toLowerCase() === name.toLowerCase());

    // Regla 1: Mozos y Personal de Cocina (1 cada 25 invitados)
    const cantidadPersonal = Math.ceil(invitados / 25);
    const mozoService = findService('mozo');
    if (mozoService && mozoService.precioVenta !== undefined) {
        items.push({
            idServicioCatalogo: mozoService.id,
            nombreServicio: mozoService.nombre,
            cantidad: cantidadPersonal,
            unidad: mozoService.unidad,
            precioUnitario: mozoService.precioVenta,
            costoTotalItem: cantidadPersonal * mozoService.precioVenta,
            categoriaServicio: mozoService.categoria,
        });
    }
    const mozoCocinaService = findService('mozo de cocina');
    if (mozoCocinaService && mozoCocinaService.precioVenta !== undefined) {
        items.push({
            idServicioCatalogo: mozoCocinaService.id,
            nombreServicio: mozoCocinaService.nombre,
            cantidad: cantidadPersonal,
            unidad: mozoCocinaService.unidad,
            precioUnitario: mozoCocinaService.precioVenta,
            costoTotalItem: cantidadPersonal * mozoCocinaService.precioVenta,
            categoriaServicio: mozoCocinaService.categoria,
        });
    }

    // Regla 2: Discoteca según cantidad de invitados
    let discotecaService;
    if (invitados <= 70) {
        discotecaService = findService('discoteca básica');
    } else {
        discotecaService = findService('discoteca intermedia');
    }
    if (discotecaService && discotecaService.precioVenta !== undefined) {
         items.push({
            idServicioCatalogo: discotecaService.id,
            nombreServicio: discotecaService.nombre,
            cantidad: 1,
            unidad: discotecaService.unidad,
            precioUnitario: discotecaService.precioVenta,
            costoTotalItem: discotecaService.precioVenta,
            categoriaServicio: discotecaService.categoria,
        });
    }

    // Regla 3: Servicios base que siempre se incluyen en el paquete completo
    const serviciosBase = ['decoracion basica', 'cheff', 'metre'];
    serviciosBase.forEach(serviceName => {
        const service = findService(serviceName);
        if (service && service.precioVenta !== undefined) {
            items.push({
                idServicioCatalogo: service.id,
                nombreServicio: service.nombre,
                cantidad: 1,
                unidad: service.unidad,
                precioUnitario: service.precioVenta,
                costoTotalItem: service.precioVenta,
                categoriaServicio: service.categoria,
            });
        }
    });

    // Nota: El menú se deja pendiente para que el cliente lo elija en una fase posterior.
    // Aquí se podría añadir un item placeholder si se quisiera.
    items.push({
        idServicioCatalogo: 'menu_placeholder',
        nombreServicio: "Menú Gastronómico a elección",
        cantidad: invitados,
        unidad: 'Por persona',
        precioUnitario: 0, // El precio se actualizará cuando el cliente elija
        costoTotalItem: 0,
        categoriaServicio: 'Servicio de catering',
    });


    return items;
}


export async function crearPresupuestoDesdeArmadoRapido(
    data: ArmadoRapidoData
): Promise<{ success: boolean; error?: string, presupuestoId?: string }> {
    try {
        if (!data.clienteNombre || !data.eventoTipo || data.invitadosCantidad <= 0) {
            return { success: false, error: "Faltan datos esenciales del cliente o evento." };
        }
        
        const catalogo = await getServiciosEmpresa();
        const itemsCalculados = await calcularServicios(data.invitadosCantidad, catalogo);

        const costoTotal = itemsCalculados.reduce((sum, item) => sum + item.costoTotalItem, 0);

        const presupuestoData: Omit<Presupuesto, 'id' | 'estado' | 'invoiceId'> = {
            clienteNombre: data.clienteNombre,
            eventoTipo: data.eventoTipo,
            invitadosCantidad: data.invitadosCantidad,
            eventoFecha: data.eventoFecha,
            salonFiestas: data.salonFiestas,
            itemsPresupuestados: itemsCalculados,
            costoTotalEstimado: costoTotal,
            timestamp: new Date().toISOString(),
            notas: "Presupuesto inicial generado por el Armado Rápido. Menú a confirmar por el cliente."
        };

        const result = await savePresupuesto(presupuestoData);

        if (!result.success || !result.id) {
            throw new Error(result.error || "No se pudo guardar el presupuesto generado.");
        }

        return { success: true, presupuestoId: result.id };

    } catch (error: any) {
        console.error("Error en crearPresupuestoDesdeArmadoRapido:", error);
        return { success: false, error: error.message || "Error desconocido al procesar la solicitud." };
    }
}
