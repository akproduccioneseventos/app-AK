'use server';

import { readData, writeData, createDataItem } from '@/lib/data-service';
import { idDelIntento } from '@/lib/intento-en-servidor';
import fs from 'fs/promises';
import { createHash } from 'crypto';
import path from 'path';

import type { Customer } from '@/types/customer';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Presupuesto, ItemPresupuestado } from '@/types/presupuesto';
import type { FiestaHistorica } from '@/types/fiesta-historica';
import { initialFiestaActualData } from '@/lib/fiesta-defaults';
import { saveFiesta } from './fiesta/fiesta.actions';
import { createNotification } from '@/lib/notifications/create-notification';
import { saveInvoice } from './invoices';
import type { Invoice } from '@/types/invoice';
import { PERMISOS } from '@/lib/auth/perfiles';
import { requirePermisoAlguno } from '@/lib/auth/require-session';
import { saveFiestaHistorica } from './fiestas-historicas';

const CUSTOMERS_FILE = 'customers.json';
const PRESUPUESTOS_FILE = 'presupuestos.json';
const CONTRACTS_DIR = path.join(process.cwd(), 'src', 'data', 'contracts');

async function ensureDirectoryExists(dirPath: string) {
    try { await fs.access(dirPath); } catch { await fs.mkdir(dirPath, { recursive: true }); }
}

export async function processHistoricRecord(formData: FormData): Promise<{ success: boolean; error?: string }> {
    await requirePermisoAlguno(PERMISOS.CONTABILIDAD); // Plata: no cualquier sesión (candado de plata, 6/10/2026).
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

    if (contractFile && typeof contractFile === 'object') {
        if (contractFile.size > 10 * 1024 * 1024) {
            return { success: false, error: "El archivo de contrato no puede superar los 10 MB." };
        }
        if (contractFile.size > 0 || contractFile.name) {
            const isValidType = Boolean(
                contractFile.type === 'application/pdf' ||
                contractFile.type?.startsWith('image/') ||
                /\.(pdf|jpg|jpeg|png|webp)$/i.test(contractFile.name || '')
            );
            if (!isValidType) {
                return { success: false, error: "El archivo de contrato debe ser un PDF o una imagen." };
            }
        }
    }

    try {
        const rawIntento = formData.get('idIntento') || formData.get('intentoId');
        const intentoKey = idDelIntento('hist', rawIntento);
        const seed = intentoKey || `hist_${Date.now()}`;

        const customerId = `cust_${seed}`;
        const presupuestoId = `pres_${seed}`;
        const pagoId = `pago_${seed}`;
        const fiestaId = `fiesta_${seed}`;

        const SIN_BASE = () => process.env.AK_USE_LOCAL_JSON_ONLY === 'true';

        // 1. Cliente: verificar si ya existe customerId en CUSTOMERS_FILE. Si ya existe, reutilizarlo.
        const customers = await readData<Customer[]>(CUSTOMERS_FILE, []);
        let customer = customers.find(c => c.id === customerId);

        if (!customer) {
            let uniqueFilename: string | undefined = undefined;

            if (contractFile && contractFile.size > 0) {
                await ensureDirectoryExists(CONTRACTS_DIR);
                uniqueFilename = `contract_${customerId}_${contractFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                const bytes = await contractFile.arrayBuffer();
                await fs.writeFile(path.join(CONTRACTS_DIR, uniqueFilename), Buffer.from(bytes));
            }

            customer = {
                id: customerId,
                name: clienteNombre,
                partyDate: eventoFecha,
                estadoCliente: 'Antiguo',
                contractFileName: uniqueFilename,
            };

            if (!SIN_BASE()) {
                await createDataItem('customers.json', 'clientes', customerId, customer);
            } else {
                customers.push(customer);
                await writeData(CUSTOMERS_FILE, customers, (a, b) => (a.name || '').localeCompare(b.name || ''));
            }
        }

        // 2. Presupuesto: verificar si ya existe presupuestoId en PRESUPUESTOS_FILE. Si ya existe, reutilizarlo.
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

        const presupuestos = await readData<Presupuesto[]>(PRESUPUESTOS_FILE, []);
        let presupuesto = presupuestos.find(p => p.id === presupuestoId);

        if (!presupuesto) {
            presupuesto = {
                id: presupuestoId,
                clienteNombre: clienteNombre,
                eventoTipo: 'Histórico',
                eventoFecha: eventoFecha,
                invitadosCantidad: 1,
                salonFiestas: 'N/A (Histórico)',
                itemsPresupuestados: items,
                costoTotalEstimado: montoTotal,
                totalConDescuento: montoTotal,
                pagosCliente: [{
                    id: pagoId,
                    fecha: eventoFecha,
                    monto: montoTotal,
                    metodoPago: 'Otro',
                    referencia: `AK_SYNC:historico:${presupuestoId}`,
                    estadoPago: 'confirmado',
                }],
                estado: 'Facturado',
                ajusteAnualActivo: true,
                timestamp: new Date().toISOString(),
                notas: `Registro histórico cargado el ${new Date().toLocaleDateString()}. Contrato adjunto.`
            };

            if (!SIN_BASE()) {
                await createDataItem('presupuestos.json', 'presupuestos', presupuestoId, presupuesto);
            } else {
                presupuestos.push(presupuesto);
                await writeData(PRESUPUESTOS_FILE, presupuestos);
            }
        }

        // 3. Factura: buscar si ya existe factura para presupuestoId.
        const { getInvoicesByPresupuestoId, saveInvoice: saveInvoiceFromImport } = await import('./invoices');
        const facturas = typeof getInvoicesByPresupuestoId === 'function'
            ? await getInvoicesByPresupuestoId(presupuestoId)
            : [];
        let invoiceId: string;

        if (facturas.length > 0) {
            invoiceId = facturas[0].id;
        } else {
            const newInvoice: Omit<Invoice, 'id'> = {
                // El número sale del presupuesto entero: dos cargas distintas no chocan aunque sus
                // intentos terminen igual, y el reintento de la misma carga da el mismo número.
                invoiceNumber: `HIST-${createHash('sha256').update(presupuestoId).digest('hex').slice(0, 10).toUpperCase()}`,
                customer: customer,
                issueDate: eventoFecha,
                dueDate: eventoFecha,
                sourcePresupuestoId: presupuestoId,
                items: [{
                    id: `item_${seed}`,
                    description: `Servicios históricos para ${clienteNombre}`,
                    quantity: 1, unitPrice: montoTotal, total: montoTotal,
                }],
                subtotal: montoTotal,
                totalAmount: montoTotal,
                status: 'Paid',
                currency: 'UYU',
                vendorName: 'AK Producciones',
                payments: [{
                    id: `pay_${seed}`,
                    paymentDate: eventoFecha,
                    amount: montoTotal,
                    method: 'Otro',
                    notes: 'Pago registrado desde carga histórica'
                }]
            };
            const saveInvoiceFn = saveInvoiceFromImport || saveInvoice;
            const invoiceResult = await saveInvoiceFn(newInvoice, presupuestoId);
            if (!invoiceResult.success || !invoiceResult.id) {
                throw new Error(invoiceResult.error || 'Fallo al crear la factura histórica.');
            }
            invoiceId = invoiceResult.id;
        }

        // 4. Fiesta histórica: verificar si ya existe registro histórico.
        const { getFiestasHistoricas } = await import('./fiestas-historicas');
        const historicas = await getFiestasHistoricas();
        const yaHist = historicas.find(h => h.clienteId === customerId);
        if (!yaHist) {
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
                contratoUrl: customer.contractFileName,
                observaciones: `Carga histórica del ${new Date().toLocaleDateString()}`
            };
            const histRes = await saveFiestaHistorica(historicalRecord);
            if (!histRes.success) throw new Error(histRes.error || "No se pudo guardar el registro histórico.");
        }

        // 5. Fiesta activa/archivada: verificar si ya existe fiestaId.
        const { getFiestaByIdRaw } = await import('@/lib/fiesta/get-fiesta-raw');
        const yaFiesta = await getFiestaByIdRaw(fiestaId);
        if (!yaFiesta) {
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
                invoiceIds: [invoiceId]
            };
            const saveFiestaResult = await saveFiesta(newFiesta);
            if (!saveFiestaResult.success) {
                return {
                    success: false,
                    error: 'Se guardaron el presupuesto y la factura, pero no la fiesta. No vuelvas a cargarlo: avisale al administrador.',
                };
            }
        }

        // 6. Notification
        // no-mira-el-resultado: notificacion accesoria para el equipo, la fiesta historica ya se guardo
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

export async function extractContractDataAction(input: { fileDataUri: string }) {
    await requirePermisoAlguno(PERMISOS.CONTABILIDAD, PERMISOS.ADMINISTRACION);
    const { hayPresupuestoParaIA } = await import('@/lib/ai/consumo-servidor');
    if (!(await hayPresupuestoParaIA())) {
        throw new Error('Presupuesto de IA alcanzado para este período.');
    }
    const { extractContractData } = await import('@/ai/flows/extract-contract-data');
    return extractContractData(input);
}
