
'use server';

import { savePresupuesto } from './presupuestos';
import type { Presupuesto, ItemPresupuestado } from '@/types/presupuesto';
import { getServiciosEmpresa } from './servicios-empresa';
import type { ServicioEmpresa } from '@/types/empresa';
import { addCrmLead } from './crm';
import fs from 'fs/promises';
import path from 'path';
import type { TipoEvento } from '@/types/presupuesto';

// Define types for the configuration structure
interface ReglaPersonal {
    invitadosPorUnidad: number;
}
interface Reglas {
    personal: {
        mozo: ReglaPersonal;
        mozo_cocina: ReglaPersonal;
    };
    discoteca: {
        umbralInvitados: number;
        servicioMenor: string;
        servicioMayor: string;
    };
}
interface Paquete {
    id: string;
    nombre: string;
    descripcion: string;
    costoFijoAdicional: number;
    serviciosIncluidos: string[];
}
interface ArmadoRapidoConfig {
    paquetes: Paquete[];
    reglas: Reglas;
}


interface ArmadoRapidoData {
  clienteNombre: string;
  eventoTipo: TipoEvento;
  invitadosCantidad: number;
  eventoFecha?: string; // ISO String - Now optional
  salonFiestas: string;
  paqueteId: string; // ID of the selected package
}

async function getArmadoRapidoConfig(): Promise<ArmadoRapidoConfig> {
    const filePath = path.join(process.cwd(), 'src', 'data', 'armado-rapido-config.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
}

async function calcularServicios(
    invitados: number, 
    paquete: Paquete,
    reglas: Reglas,
    catalogo: ServicioEmpresa[]
): Promise<ItemPresupuestado[]> {
    const items: ItemPresupuestado[] = [];

    const findService = (name: string) => catalogo.find(s => s.nombre.toLowerCase() === name.toLowerCase());

    // Regla 1: Personal dinámico
    const cantidadMozos = Math.ceil(invitados / reglas.personal.mozo.invitadosPorUnidad);
    const mozoService = findService('mozo');
    if (mozoService && mozoService.precioVenta !== undefined) {
        items.push({
            idServicioCatalogo: mozoService.id,
            nombreServicio: mozoService.nombre,
            cantidad: cantidadMozos,
            unidad: mozoService.unidad,
            precioUnitario: mozoService.precioVenta,
            costoTotalItem: cantidadMozos * mozoService.precioVenta,
            categoriaServicio: mozoService.categoria,
        });
    }

    const cantidadCocina = Math.ceil(invitados / reglas.personal.mozo_cocina.invitadosPorUnidad);
    const mozoCocinaService = findService('mozo de cocina');
    if (mozoCocinaService && mozoCocinaService.precioVenta !== undefined) {
        items.push({
            idServicioCatalogo: mozoCocinaService.id,
            nombreServicio: mozoCocinaService.nombre,
            cantidad: cantidadCocina,
            unidad: mozoCocinaService.unidad,
            precioUnitario: mozoCocinaService.precioVenta,
            costoTotalItem: cantidadCocina * mozoCocinaService.precioVenta,
            categoriaServicio: mozoCocinaService.categoria,
        });
    }

    // Regla 2: Discoteca dinámica
    let discotecaServiceName = invitados <= reglas.discoteca.umbralInvitados ? reglas.discoteca.servicioMenor : reglas.discoteca.servicioMayor;
    const discotecaService = findService(discotecaServiceName);
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

    // Regla 3: Servicios base del paquete
    paquete.serviciosIncluidos.forEach(serviceName => {
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

    // Placeholder para menú a elección
    items.push({
        idServicioCatalogo: 'menu_placeholder',
        nombreServicio: "Menú Gastronómico a elección",
        cantidad: invitados,
        unidad: 'Por persona',
        precioUnitario: 0,
        costoTotalItem: 0,
        categoriaServicio: 'Servicio de catering',
    });

    return items;
}

export async function crearPresupuestoDesdeArmadoRapido(
    data: ArmadoRapidoData
): Promise<{ success: boolean; error?: string; presupuestoId?: string }> {
    try {
        if (!data.clienteNombre || !data.eventoTipo || !data.paqueteId || data.invitadosCantidad <= 0) {
            return { success: false, error: "Faltan datos esenciales del cliente o evento." };
        }
        
        const [config, catalogo] = await Promise.all([
            getArmadoRapidoConfig(),
            getServiciosEmpresa()
        ]);
        
        const paqueteSeleccionado = config.paquetes.find(p => p.id === data.paqueteId);
        if (!paqueteSeleccionado) {
            return { success: false, error: "El paquete seleccionado no es válido." };
        }

        const itemsCalculados = await calcularServicios(data.invitadosCantidad, paqueteSeleccionado, config.reglas, catalogo);
        const costoTotal = itemsCalculados.reduce((sum, item) => sum + item.costoTotalItem, 0) + paqueteSeleccionado.costoFijoAdicional;

        const presupuestoData: Omit<Presupuesto, 'id' | 'estado' | 'invoiceId'> = {
            clienteNombre: data.clienteNombre,
            eventoTipo: data.eventoTipo,
            invitadosCantidad: data.invitadosCantidad,
            eventoFecha: data.eventoFecha || new Date().toISOString(), // Use current date if none provided
            salonFiestas: data.salonFiestas,
            itemsPresupuestados: itemsCalculados,
            costoTotalEstimado: costoTotal,
            timestamp: new Date().toISOString(),
            notas: `Presupuesto inicial generado por Armado Rápido con el paquete "${paqueteSeleccionado.nombre}". Menú a confirmar por el cliente. ${!data.eventoFecha ? 'Fecha del evento a confirmar.' : ''}`
        };

        const resultPresupuesto = await savePresupuesto(presupuestoData);

        if (!resultPresupuesto.success || !resultPresupuesto.id) {
            throw new Error(resultPresupuesto.error || "No se pudo guardar el presupuesto generado.");
        }

        // Crear prospecto en CRM
        await addCrmLead({
            name: `Prospecto de ${data.eventoTipo}: ${data.clienteNombre}`,
            notes: `Generado desde Armado Rápido con paquete "${paqueteSeleccionado.nombre}".\nTipo: ${data.eventoTipo}\nInvitados: ${data.invitadosCantidad}\nPresupuesto Estimado: ${new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(costoTotal)}`,
        });

        return { success: true, presupuestoId: resultPresupuesto.id };

    } catch (error: any) {
        console.error("Error en crearPresupuestoDesdeArmadoRapido:", error);
        return { success: false, error: error.message || "Error desconocido al procesar la solicitud." };
    }
}
