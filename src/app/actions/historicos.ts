'use server';

import { readData, writeData } from '@/lib/data-service';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

import type { Customer } from '@/types/customer';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Presupuesto } from '@/types/presupuesto';
import { initialFiestaActualData } from '@/lib/fiesta-defaults';
import { archiveFiesta, saveFiesta } from './fiesta/fiesta.actions';
import { createNotification } from './notifications';

const CUSTOMERS_FILE = 'customers.json';
const PRESUPUESTOS_FILE = 'presupuestos.json';
const CONTRACTS_DIR = path.join(process.cwd(), 'src', 'data', 'contracts');

async function ensureDirectoryExists(dirPath: string) {
    try { await fs.access(dirPath); } catch { await fs.mkdir(dirPath, { recursive: true }); }
}

export async function processHistoricRecord(formData: FormData): Promise<{ success: boolean; error?: string }> {
    const clienteNombre = formData.get('clienteNombre') as string;
    const eventoFecha = formData.get('eventoFecha') as string;
    const montoTotalStr = formData.get('montoTotal') as string;
    const contractFile = formData.get('contractFile') as File | null;

    if (!clienteNombre || !eventoFecha || !montoTotalStr || !contractFile) {
        return { success: false, error: "Todos los campos son requeridos." };
    }

    const montoTotal = parseFloat(montoTotalStr);
    if (isNaN(montoTotal) || montoTotal <= 0) {
        return { success: false, error: "El monto total debe ser un número válido." };
    }

    try {
        // 1. Create and Save Customer
        const customerId = `cust_hist_${Date.now()}`;
        const uniqueFilename = `contract_${customerId}_${contractFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

        await ensureDirectoryExists(CONTRACTS_DIR);
        const bytes = await contractFile.arrayBuffer();
        await fs.writeFile(path.join(CONTRACTS_DIR, uniqueFilename), Buffer.from(bytes));

        const newCustomer: Customer = {
            id: customerId,
            name: clienteNombre,
            partyDate: eventoFecha,
            estadoCliente: 'Antiguo',
            contractFileName: uniqueFilename,
        };
        const customers = await readData<Customer[]>(CUSTOMERS_FILE, []);
        customers.push(newCustomer);
        await writeData(CUSTOMERS_FILE, customers, (a, b) => (a.name || '').localeCompare(b.name || ''));

        // 2. Create Fiesta for the Customer
        const fiestaId = `fiesta_hist_${Date.now()}`;
        const newFiesta: FiestaEnPlanificacion = {
            ...initialFiestaActualData,
            id: fiestaId,
            configuracion: {
                ...initialFiestaActualData.configuracion,
                clienteId: customerId,
                nombreEvento: `Histórico: ${clienteNombre}`,
                fechaEvento: eventoFecha,
            },
        };
        
        // 3. Create a simplified Presupuesto
        const presupuestoId = `pres_hist_${Date.now()}`;
        const newPresupuesto: Presupuesto = {
            id: presupuestoId,
            clienteNombre: clienteNombre,
            eventoTipo: 'Histórico',
            eventoFecha: eventoFecha,
            invitadosCantidad: 1, // Default value for historic records
            salonFiestas: 'N/A (Histórico)',
            itemsPresupuestados: [{
                idServicioCatalogo: 'historic_item',
                nombreServicio: 'Servicios según contrato histórico adjunto',
                cantidad: 1,
                precioUnitario: montoTotal,
                precioUnitarioPresupuesto: montoTotal,
                costoTotalItem: montoTotal,
                esRegalo: false,
                categoriaServicio: 'Otros servicios',
                calculationMethod: 'fijo',
                precioBase: montoTotal,
            }],
            costoTotalEstimado: montoTotal,
            estado: 'Facturado',
            ajusteAnualActivo: true, // As requested by the user
            timestamp: new Date().toISOString(),
            notas: `Registro histórico cargado el ${new Date().toLocaleDateString()}. Contrato adjunto.`
        };
        
        newFiesta.presupuestoId = presupuestoId;
        const presupuestos = await readData<Presupuesto[]>(PRESUPUESTOS_FILE, []);
        presupuestos.push(newPresupuesto);
        await writeData(PRESUPUESTOS_FILE, presupuestos);

        // 4. Save Fiesta temporarily to be archived
        const fiestaPath = path.join('fiestas', `${fiestaId}.json`);
        await writeData(fiestaPath, newFiesta);
        
        // 5. Archive Fiesta
        const archiveResult = await archiveFiesta(fiestaId);
        if (!archiveResult.success) {
            // This is not a critical failure, we can just warn about it.
            console.warn(`Record histórico creado, pero no se pudo archivar el evento ${fiestaId}. Deberá archivarse manualmente.`);
        }
        
        await createNotification({
          mensaje: `Se cargó un registro histórico para ${clienteNombre}.`,
          href: `/customers/${customerId}`,
          icono: 'Archive',
        });

        return { success: true };
    } catch (error: any) {
        console.error("Error processing historic record:", error);
        return { success: false, error: error.message || "Un error desconocido ocurrió durante el proceso." };
    }
}
