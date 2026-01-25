'use server';

import { readData, writeData } from '@/lib/data-service';
import fs from 'fs/promises';
import path from 'path';

import type { Customer } from '@/types/customer';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Presupuesto } from '@/types/presupuesto';
import { initialFiestaActualData } from '@/lib/fiesta-defaults';
import { saveFiesta } from './fiesta/fiesta.actions';
import { createNotification } from './notifications';
import { saveInvoice } from './invoices';
import type { Invoice, Payment } from '@/types/invoice';

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

        // 2. Create Fiesta Object (in memory)
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
            vendorName: 'AK Producciones', // Placeholder, consider moving to settings
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

        // 5. Save the Fiesta as an ACTIVE event
        newFiesta.presupuestoId = presupuestoId;
        newFiesta.invoiceIds = [invoiceResult.id];
        const saveFiestaResult = await saveFiesta(newFiesta);
        if (!saveFiestaResult.success) {
            throw new Error(saveFiestaResult.error || "No se pudo guardar la nueva fiesta activa.");
        }
        
        // 6. Notification
        await createNotification({
          mensaje: `Se cargó el evento histórico de ${clienteNombre}.`,
          href: `/fiestas/nueva?fiestaId=${fiestaId}`,
          icono: 'Archive',
        });

        return { success: true };
    } catch (error: any) {
        console.error("Error processing historic record:", error);
        return { success: false, error: error.message || "Un error desconocido ocurrió durante el proceso." };
    }
}
