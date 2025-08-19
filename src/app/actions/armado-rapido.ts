
'use server';

import fs from 'fs/promises';
import path from 'path';
import type { ArmadoRapidoConfig, Paquete, Regla } from '@/types/armado-rapido';
import { getServiciosEmpresa } from './servicios-empresa';
import { savePresupuesto } from './presupuestos';
import { addCrmLead } from './crm';

const CONFIG_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'armado-rapido-config.json');

const defaultPaquetes: Paquete[] = [
    {
      id: 'paq_1',
      nombre: 'Paquete Básico',
      serviciosIncluidos: [],
    },
    {
      id: 'paq_2',
      nombre: 'Paquete Intermedio',
      serviciosIncluidos: [],
    },
    {
      id: 'paq_3',
      nombre: 'Paquete Premium',
      serviciosIncluidos: [],
    },
];

const defaultReglas: Regla[] = [];


const defaultConfig: ArmadoRapidoConfig = {
    paquetes: defaultPaquetes,
    reglas: defaultReglas,
    configuracionGeneral: {
        titulo: "Arma tu Presupuesto al Instante",
        descripcion: "Selecciona un paquete base y personalízalo para obtener una cotización estimada para tu evento.",
    }
};

async function readConfigFile(): Promise<ArmadoRapidoConfig> {
  try {
    await fs.access(CONFIG_FILE_PATH);
    const fileContent = await fs.readFile(CONFIG_FILE_PATH, 'utf-8');
    const config = JSON.parse(fileContent);
    // Ensure all parts of the config exist, falling back to defaults if not
    return {
      paquetes: config.paquetes || defaultPaquetes,
      reglas: config.reglas || defaultReglas,
      configuracionGeneral: config.configuracionGeneral || defaultConfig.configuracionGeneral
    };
  } catch (error) {
    // If the file doesn't exist, create it with the default config
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    return defaultConfig;
  }
}

async function writeConfigFile(config: ArmadoRapidoConfig): Promise<void> {
  await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

export async function getArmadoRapidoConfig(): Promise<ArmadoRapidoConfig> {
  return await readConfigFile();
}

export async function saveArmadoRapidoConfig(config: ArmadoRapidoConfig): Promise<{ success: boolean; error?: string }> {
  try {
    // Remove description and costoFijoAdicional before saving
    const cleanedConfig = {
        ...config,
        paquetes: config.paquetes.map(({ descripcion, costoFijoAdicional, ...rest }) => rest)
    };
    await writeConfigFile(cleanedConfig);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Function that generates the budget based on selections
export async function generateQuickBudget(
  selectedPackageId: string,
  extraServicesIds: string[],
  guestCount: number,
  clientName: string,
  eventType: string,
  eventDate?: Date
): Promise<{ success: boolean, presupuestoId?: string, leadId?: string, error?: string }> {
    try {
        const [config, allServices] = await Promise.all([
            getArmadoRapidoConfig(),
            getServiciosEmpresa()
        ]);
        
        const selectedPackage = config.paquetes.find(p => p.id === selectedPackageId);
        if (!selectedPackage) {
            return { success: false, error: "Paquete seleccionado no encontrado." };
        }

        const itemsPresupuestados = [];
        let costoTotal = 0;

        // Add services from the package
        for (const servicioId of selectedPackage.serviciosIncluidos) {
            const servicio = allServices.find(s => s.id === servicioId);
            if (servicio && servicio.precioVenta !== undefined) {
                itemsPresupuestados.push({
                    idServicioCatalogo: servicio.id,
                    nombreServicio: servicio.nombre,
                    cantidad: servicio.unidad === 'Por persona' ? guestCount : 1,
                    unidad: servicio.unidad,
                    precioUnitario: servicio.precioVenta,
                    costoTotalItem: (servicio.unidad === 'Por persona' ? guestCount : 1) * servicio.precioVenta,
                    categoriaServicio: servicio.categoria,
                });
                costoTotal += (servicio.unidad === 'Por persona' ? guestCount : 1) * servicio.precioVenta;
            }
        }

        // Add extra selected services
        for (const servicioId of extraServicesIds) {
             const servicio = allServices.find(s => s.id === servicioId);
            if (servicio && servicio.precioVenta !== undefined) {
                 itemsPresupuestados.push({
                    idServicioCatalogo: servicio.id,
                    nombreServicio: servicio.nombre,
                    cantidad: servicio.unidad === 'Por persona' ? guestCount : 1,
                    unidad: servicio.unidad,
                    precioUnitario: servicio.precioVenta,
                    costoTotalItem: (servicio.unidad === 'Por persona' ? guestCount : 1) * servicio.precioVenta,
                    categoriaServicio: servicio.categoria,
                });
                costoTotal += (servicio.unidad === 'Por persona' ? guestCount : 1) * servicio.precioVenta;
            }
        }

        const notasPresupuesto = `Presupuesto inicial generado por Armado Rápido con el paquete "${selectedPackage.nombre}". Menú a confirmar por el cliente. ${eventDate ? '' : 'Fecha del evento a confirmar.'}`;

        // Create a lead in the CRM
        const leadResult = await addCrmLead({
            name: `Prospecto de ${eventType}: ${clientName}`,
            notes: `Generado desde Armado Rápido con paquete "${selectedPackage.nombre}".\nTipo: ${eventType}\nInvitados: ${guestCount}\nPresupuesto Estimado: ${new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(costoTotal)}`
        });
        
        if (!leadResult.success) {
            // Log the error but continue to create the budget
            console.error("Could not create CRM lead:", leadResult.error);
        }

        // Save the new budget
        const budgetResult = await savePresupuesto({
            clienteNombre: clientName,
            eventoTipo: eventType,
            invitadosCantidad: guestCount,
            eventoFecha: eventDate ? eventDate.toISOString() : new Date().toISOString(),
            itemsPresupuestados,
            costoTotalEstimado: costoTotal,
            salonFiestas: 'A confirmar', 
            timestamp: new Date().toISOString(),
            notas: notasPresupuesto,
        });

        if (budgetResult.success && budgetResult.id) {
            return { success: true, presupuestoId: budgetResult.id, leadId: leadResult.lead?.id };
        } else {
            return { success: false, error: budgetResult.error || "No se pudo guardar el presupuesto." };
        }

    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
