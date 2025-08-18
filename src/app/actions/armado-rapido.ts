
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
export interface ReglaDinamica {
    servicioCatalogoId: string; // ID del servicio en el catálogo
    invitadosPorUnidad: number;
}

export interface ReglaCondicional {
    umbralInvitados: number;
    servicioMenorId: string;
    servicioMayorId: string;
}
export interface Reglas {
    dinamicas: ReglaDinamica[];
    condicionales: ReglaCondicional[];
}
export interface Paquete {
    id: string;
    nombre: string;
    descripcion: string;
    serviciosIncluidosIds: string[]; // IDs from servicios-empresa.json
    costoFijoAdicional?: number;
}
export interface ArmadoRapidoConfig {
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

const ARMADO_RAPIDO_CONFIG_PATH = path.join(process.cwd(), 'src', 'data', 'armado-rapido-config.json');

export async function getArmadoRapidoConfig(): Promise<ArmadoRapidoConfig> {
    const fileContent = await fs.readFile(ARMADO_RAPIDO_CONFIG_PATH, 'utf-8');
    const config = JSON.parse(fileContent);
    // Asegurar que costoFijoAdicional exista
    config.paquetes = config.paquetes.map((p: Paquete) => ({ ...p, costoFijoAdicional: p.costoFijoAdicional || 0 }));
    return config;
}

export async function saveArmadoRapidoConfig(
    config: ArmadoRapidoConfig
): Promise<{ success: boolean; error?: string }> {
    try {
        await fs.writeFile(ARMADO_RAPIDO_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
        return { success: true };
    } catch (error: any) {
        console.error("Error writing armado-rapido-config.json:", error);
        return { success: false, error: error.message || "No se pudo guardar la configuración." };
    }
}


async function calcularServicios(
    invitados: number, 
    paquete: Paquete,
    reglas: Reglas,
    catalogo: ServicioEmpresa[]
): Promise<ItemPresupuestado[]> {
    const items: ItemPresupuestado[] = [];
    const findService = (serviceId: string) => catalogo.find(s => s.id === serviceId);

    // 1. Reglas dinámicas (basadas en cantidad)
    reglas.dinamicas.forEach(regla => {
        const cantidad = Math.ceil(invitados / regla.invitadosPorUnidad);
        if (cantidad > 0) {
            const servicio = findService(regla.servicioCatalogoId);
            if (servicio && servicio.precioVenta !== undefined) {
                items.push({
                    idServicioCatalogo: servicio.id,
                    nombreServicio: servicio.nombre,
                    cantidad: cantidad,
                    unidad: servicio.unidad,
                    precioUnitario: servicio.precioVenta,
                    costoTotalItem: cantidad * servicio.precioVenta,
                    categoriaServicio: servicio.categoria,
                });
            }
        }
    });

    // 2. Reglas condicionales (basadas en umbrales)
    reglas.condicionales.forEach(regla => {
        const servicioId = invitados <= regla.umbralInvitados ? regla.servicioMenorId : regla.servicioMayorId;
        const servicio = findService(servicioId);
        if (servicio && servicio.precioVenta !== undefined) {
            items.push({
                idServicioCatalogo: servicio.id,
                nombreServicio: servicio.nombre,
                cantidad: 1,
                unidad: servicio.unidad,
                precioUnitario: servicio.precioVenta,
                costoTotalItem: servicio.precioVenta,
                categoriaServicio: servicio.categoria,
            });
        }
    });

    // 3. Servicios base del paquete
    paquete.serviciosIncluidosIds.forEach(servicioId => {
        const servicio = findService(servicioId);
        if (servicio && servicio.precioVenta !== undefined) {
            items.push({
                idServicioCatalogo: servicio.id,
                nombreServicio: servicio.nombre,
                cantidad: 1,
                unidad: servicio.unidad,
                precioUnitario: servicio.precioVenta,
                costoTotalItem: servicio.precioVenta,
                categoriaServicio: servicio.categoria,
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
        const costoTotal = itemsCalculados.reduce((sum, item) => sum + item.costoTotalItem, 0) + (paqueteSeleccionado.costoFijoAdicional || 0);

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
            notes: `Generado desde Armado Rápido con paquete "${paqueteSeleccionado.nombre}".\nTipo: ${data.eventoTipo}\nInvitados: ${data.invitadosCantidad}\nSalón: ${data.salonFiestas}\nPresupuesto Estimado: ${new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(costoTotal)}`,
        });

        return { success: true, presupuestoId: resultPresupuesto.id };

    } catch (error: any) {
        console.error("Error en crearPresupuestoDesdeArmadoRapido:", error);
        return { success: false, error: error.message || "Error desconocido al procesar la solicitud." };
    }
}
