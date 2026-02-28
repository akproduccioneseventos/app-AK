
'use server';

import { readData, writeData } from '@/lib/data-service';
import fs from 'fs/promises';
import path from 'path';

import type { Customer } from '@/types/customer';
import type { FiestaEnPlanificacion, Tarea } from '@/types/fiesta';
import type { Presupuesto, ItemPresupuestado } from '@/types/presupuesto';
import type { FiestaHistorica } from '@/types/fiesta-historica';
import { initialFiestaActualData } from '@/lib/fiesta-defaults';
import { saveFiesta } from './fiesta/fiesta.actions';
import { createNotification } from './notifications';
import { saveInvoice } from './invoices';
import type { Invoice, Payment } from '@/types/invoice';
import { saveFiestaHistorica } from './fiestas-historicas';

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

    if (!clienteNombre || !eventoFecha || !montoTotalStr) {
        return { success: false, error: "Nombre, fecha y monto son requeridos." };
    }

    const montoTotal = parseFloat(montoTotalStr);
    if (isNaN(montoTotal) || montoTotal <= 0) {
        return { success: false, error: "El monto total debe ser un número válido." };
    }

    try {
        // 1. Create and Save Customer
        const customerId = `cust_hist_${Date.now()}`;
        let uniqueFilename: string | undefined = undefined;

        if (contractFile && contractFile.size > 0) {
            await ensureDirectoryExists(CONTRACTS_DIR);
            uniqueFilename = `contract_${customerId}_${contractFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const bytes = await contractFile.arrayBuffer();
            await fs.writeFile(path.join(CONTRACTS_DIR, uniqueFilename), Buffer.from(bytes));
        }

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

        // 2. Create simplified Presupuesto Items
        const items: ItemPresupuestado[] = [{
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
        }];

        // 3. Create a simplified Presupuesto
        const presupuestoId = `pres_hist_${Date.now()}`;
        const newPresupuesto: Presupuesto = {
            id: presupuestoId,
            clienteNombre: clienteNombre,
            eventoTipo: 'Histórico',
            eventoFecha: eventoFecha,
            invitadosCantidad: 1, 
            salonFiestas: 'N/A (Histórico)',
            itemsPresupuestados: items,
            costoTotalEstimado: montoTotal,
            estado: 'Facturado',
            ajusteAnualActivo: true,
            timestamp: new Date().toISOString(),
            notas: `Registro histórico cargado el ${new Date().toLocaleDateString()}. Contrato adjunto.`
        };
        
        const presupuestos = await readData<Presupuesto[]>(PRESUPUESTOS_FILE, []);
        presupuestos.push(newPresupuesto);
        await writeData(PRESUPUESTOS_FILE, presupuestos);

        // 4. Create a simplified, PAID Invoice
        const newInvoice: Omit<Invoice, 'id'> = {
            invoiceNumber: `HIST-${presupuestoId.slice(-5)}`,
            customer: newCustomer,
            issueDate: eventoFecha,
            dueDate: eventoFecha,
            items: [{
                id: `item_hist_${Date.now()}`,
                description: `Servicios históricos para ${clienteNombre}`,
                quantity: 1, unitPrice: montoTotal, total: montoTotal,
            }],
            subtotal: montoTotal,
            totalAmount: montoTotal,
            status: 'Paid',
            currency: 'UYU',
            vendorName: 'AK Producciones',
            payments: [{
                id: `pay_hist_${Date.now()}`,
                paymentDate: eventoFecha,
                amount: montoTotal,
                method: 'Otro',
                notes: 'Pago registrado desde carga histórica'
            }]
        };
        const invoiceResult = await saveInvoice(newInvoice, presupuestoId);
        if (!invoiceResult.success || !invoiceResult.id) {
            throw new Error('Fallo al crear la factura histórica.');
        }

        // 5. Create and save the "Fiesta Historica" record for future duplications
        const historicalRecord: Omit<FiestaHistorica, 'id' | 'fechaCreacion'> = {
          nombreEvento: `Histórico: ${clienteNombre}`,
          clienteId: customerId,
          clienteNombre: clienteNombre,
          anioOriginal: new Date(eventoFecha).getFullYear(),
          lugar: 'N/A (Histórico)',
          tipoFiesta: 'Histórico',
          cantidadInvitados: 1,
          presupuestoTotalOriginal: montoTotal,
          detalleCostos: items,
          checklistBase: [],
          contratoUrl: uniqueFilename,
          observaciones: `Carga histórica del ${new Date().toLocaleDateString()}`
        };
        await saveFiestaHistorica(historicalRecord);

        // 6. Save the Fiesta as an ACTIVE (but archived) event
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
            presupuestoId: presupuestoId,
            invoiceIds: [invoiceResult.id]
        };
        const saveFiestaResult = await saveFiesta(newFiesta);
        
        // 7. Notification
        await createNotification({
          mensaje: `Se cargó el evento histórico de ${clienteNombre}.`,
          href: `/contabilidad/fiestas-historicas`,
          icono: 'Archive',
        });

        return { success: true };
    } catch (error: any) {
        console.error("Error processing historic record:", error);
        return { success: false, error: error.message || "Un error desconocido ocurrió durante el proceso." };
    }
}
