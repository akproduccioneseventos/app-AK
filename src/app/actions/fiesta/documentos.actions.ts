
'use server';

import type { FiestaEnPlanificacion, OtroDocumento, DocumentoTipo, Tarea } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from './fiesta.actions';
import { headers } from 'next/headers';
import { getInvoices, registerBookingDeposit } from '../invoices';
import { isDepositReceiptInvoice } from '@/lib/commercial-flow/ledger-service';
import { addDays } from 'date-fns';
import { createNotification } from '@/lib/notifications/create-notification';
import { uploadToStorage, deleteFromStorage } from '@/lib/firebase/storage';
import { getPresupuestoById } from '../presupuestos';
import { verifyPortalSession } from '@/lib/security/portal-session';
import { requireAppSession } from '@/lib/auth/require-session';

/** Default deposit amount used only when no presupuesto or plan de pagos seña is available. */
const DEFAULT_DEPOSIT_AMOUNT = 20000;

/** Returns a pre-signing summary for the given event so the UI can show it. */
export async function getContractSigningSummary(fiestaId: string): Promise<{
  success: boolean;
  summary?: {
    nombreEvento: string;
    clienteNombre: string;
    salon: string;
    fechaEvento: string;
    totalEstimado: number;
    senia: number;
    saldo: number;
    presupuestoId?: string;
  };
  error?: string;
}> {
  try {
    if (!(await verifyPortalSession(fiestaId))) {
      return { success: false, error: 'Sesión del portal no autorizada.' };
    }
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Evento no encontrado' };

    let totalEstimado = 0;
    let senia = DEFAULT_DEPOSIT_AMOUNT;

    if (fiesta.presupuestoId) {
      const presupuesto = await getPresupuestoById(fiesta.presupuestoId);
      if (presupuesto) {
        totalEstimado = presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado;
        if (presupuesto.senia && presupuesto.senia > 0) {
          senia = presupuesto.senia;
        } else if (totalEstimado > 0) {
          // Default: 20% of total if no explicit seña
          senia = Math.round(totalEstimado * 0.2);
        }
      }
    }

    const saldo = totalEstimado > 0 ? totalEstimado - senia : 0;

    // Derive the client name from the fiesta configuration
    const clienteNombre =
      fiesta.configuracion.protagonista1Nombre ||
      fiesta.configuracion.protagonista2Nombre ||
      fiesta.configuracion.nombreEvento.split(' de ').slice(1).join(' de ') ||
      fiesta.configuracion.nombreEvento;

    return {
      success: true,
      summary: {
        nombreEvento: fiesta.configuracion.nombreEvento,
        clienteNombre,
        salon: fiesta.configuracion.nombreLugar || 'Sin salón definido',
        fechaEvento: fiesta.configuracion.fechaEvento || '',
        totalEstimado,
        senia,
        saldo,
        presupuestoId: fiesta.presupuestoId,
      },
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/** Resolves the booking deposit amount for a fiesta from its linked presupuesto. */
async function resolveDepositAmount(fiesta: FiestaEnPlanificacion): Promise<number> {
  if (fiesta.presupuestoId) {
    try {
      const presupuesto = await getPresupuestoById(fiesta.presupuestoId);
      if (presupuesto) {
        if (presupuesto.senia && presupuesto.senia > 0) {
          return presupuesto.senia;
        }
        const total = presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado;
        if (total > 0) {
          return Math.round(total * 0.2);
        }
      }
    } catch {
      // fall through to default
    }
  }
  // Check plan de pagos for a seña cuota
  const seniaCuota = fiesta.planDePagos?.cuotas?.find(c =>
    c.descripcion?.toLowerCase().includes('seña') || c.descripcion?.toLowerCase().includes('señal')
  );
  if (seniaCuota && seniaCuota.monto > 0) return seniaCuota.monto;

  return DEFAULT_DEPOSIT_AMOUNT; // fallback default
}

/**
 * Guarda un documento adjunto de un evento.
 *
 * Pide sesion del equipo: se usa solo desde las pantallas internas de gestion
 * documental. Antes no la pedia y el archivo se subia al deposito antes de que
 * nadie comprobara quien era: aunque despues el guardado fallara, el archivo ya
 * habia quedado ahi, ocupando lugar que se paga.
 */
export async function uploadDocumento(formData: FormData): Promise<{ success: boolean; error?: string }> {
    await requireAppSession();

    const file = formData.get('file') as File | null;
    const docType = formData.get('docType') as DocumentoTipo;
    const customName = formData.get('customName') as string;
    const fiestaId = formData.get('fiestaId') as string;

    if (!file) return { success: false, error: 'No se proporcionó ningún archivo.' };
    if (!fiestaId) return { success: false, error: 'ID de fiesta no proporcionado.' };

    try {
        const fiesta = await getFiestaById(fiestaId);
        if (!fiesta) throw new Error("Fiesta no encontrada");

        const docId = `doc_${Date.now()}`;
        const safeFilename = `${docId}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const storagePath = `documentos-varios-fiesta/${fiestaId}/${safeFilename}`;

        const bytes = await file.arrayBuffer();
        const fileUrl = await uploadToStorage(Buffer.from(bytes), storagePath, file.type || 'application/octet-stream', false);
        
        const newDoc: OtroDocumento = {
            id: docId,
            nombre: customName.trim() || file.name,
            tipo: docType,
            fileName: fileUrl,
            timestamp: new Date().toISOString(),
        };
        
        const updatedFiesta = {
            ...fiesta,
            othersDocumentos: [...(fiesta.othersDocumentos || []), newDoc]
        };
        await saveFiesta(updatedFiesta);

        return { success: true };
    } catch(e:any) {
        return { success: false, error: e.message };
    }
}

export async function deleteDocumento(fiestaId: string, docId: string): Promise<{ success: boolean; error?: string }> {
    // El control tiene que estar ACA ARRIBA, no mas abajo.
    //
    // Antes no habia ninguno: el guardado del final (`saveFiesta`) si pide permiso,
    // asi que parecia protegida. Pero el archivo se borra del almacenamiento ANTES
    // de ese guardado. Un desconocido con el numero de la fiesta y del documento
    // borraba el contrato o la factura de verdad, el guardado le fallaba despues, y
    // quedaba la ficha apuntando a un archivo que ya no existe.
    //
    // Subir un documento si pedia permiso; borrarlo, no.
    await requireAppSession();
    try {
        const fiesta = await getFiestaById(fiestaId);
        if (!fiesta) throw new Error("Fiesta no encontrada");

        const docToDelete = fiesta.othersDocumentos?.find(d => d.id === docId);
        if (!docToDelete) {
            return { success: false, error: 'Documento no encontrado.' };
        }
        
        // Delete from Firebase Storage (fileName is now a URL or storage path)
        if (docToDelete.fileName) {
            await deleteFromStorage(docToDelete.fileName).catch(e => {
                console.warn('No se pudo eliminar el archivo de Storage:', e?.message);
            });
        }

        const updatedFiesta = {
            ...fiesta,
            othersDocumentos: (fiesta.othersDocumentos || []).filter(d => d.id !== docId)
        };
        await saveFiesta(updatedFiesta);

        return { success: true };
    } catch(e:any) {
        return { success: false, error: e.message };
    }
}

// --- TOQUE DE ORO 2: AUTOMATIZACIÓN DE FLUJOS (DOMINÓ) ---

export async function signContractDigitally(fiestaId: string, signerName: string, acceptedPlanPagos?: boolean): Promise<{ success: boolean; error?: string }> {
    if (!(await verifyPortalSession(fiestaId))) {
      return { success: false, error: 'Sesión del portal no autorizada.' };
    }
    return { success: false, error: 'La firma digital está deshabilitada. Por favor, firme físicamente el contrato.' };
}

/**
 * Sube el contrato firmado en papel y deja el evento como Contratado.
 *
 * Pide sesion del equipo. Esto no es solo subir un archivo: marca el contrato
 * como firmado y cambia el estado del evento, que es lo que dispara el cobro de
 * la senia y la organizacion. Sin la guarda, cualquiera de afuera podia dar por
 * firmado un contrato que nadie firmo.
 */
export async function uploadPhysicalContract(formData: FormData): Promise<{ success: boolean; error?: string }> {
    await requireAppSession();

    const file = formData.get('file') as File | null;
    const fiestaId = formData.get('fiestaId') as string;

    if (!file || !fiestaId) return { success: false, error: 'Faltan datos.' };

    try {
        const fiesta = await getFiestaById(fiestaId);
        if (!fiesta) throw new Error("Evento no encontrado");

        const newFilename = `contrato_fisico_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const storagePath = `contracts/signed-physical/${fiestaId}/${newFilename}`;

        const bytes = await file.arrayBuffer();
        await uploadToStorage(Buffer.from(bytes), storagePath, file.type || 'application/pdf', false);

        const updatedFiesta: FiestaEnPlanificacion = {
            ...fiesta,
            estado: 'Contratada',
            contratoFirmaInfo: {
                isSigned: true,
                signedAt: new Date().toISOString(),
                method: 'physical',
                physicalContractUrl: storagePath
            }
        };

        // Habilitar portal del cliente
        if (updatedFiesta.clientPortalSettings) {
            updatedFiesta.clientPortalSettings.enabled = true;
            updatedFiesta.clientPortalSettings.checklist.visible = true;
            updatedFiesta.clientPortalSettings.checklist.editable = true;
            updatedFiesta.clientPortalSettings.musica.visible = true;
            updatedFiesta.clientPortalSettings.moodboard.visible = true;
        }

        // Generar Factura de Seña si no existe (monto desde presupuesto)
        const eventInvoiceIds = new Set(updatedFiesta.invoiceIds || []);
        const existingInvoices = await getInvoices();
        const hasDeposit = existingInvoices.some(invoice =>
            isDepositReceiptInvoice(invoice)
            && (eventInvoiceIds.has(invoice.id) || invoice.sourceFiestaId === fiesta.id)
        );
        if (!hasDeposit) {
            try {
                const depositAmount = await resolveDepositAmount(fiesta);
                const depositResult = await registerBookingDeposit({
                    fiestaId: fiesta.id,
                    amount: depositAmount,
                    method: 'Transferencia',
                    date: new Date().toISOString(),
                    skipFiestaSave: true
                });
                if (depositResult.success && depositResult.invoiceId) {
                    updatedFiesta.invoiceIds = [...(updatedFiesta.invoiceIds || []), depositResult.invoiceId];
                }
            } catch (e) {
                console.warn("No se pudo auto-generar factura de seña:", e);
            }
        }

        // Cargar tareas iniciales si está vacío
        if (!updatedFiesta.tareas || updatedFiesta.tareas.length === 0) {
            const initialTasks: Omit<Tarea, 'id'>[] = [
                { texto: "Definir paleta de colores en Dream Designer", completada: false, asignadaA: 'Cliente', fechaLimite: addDays(new Date(), 7).toISOString() },
                { texto: "Cargar primeras 10 fotos en Video de Vida", completada: false, asignadaA: 'Cliente' },
                { texto: "Confirmar lista base de invitados", completada: false, asignadaA: 'Cliente' },
                { texto: "Revisión técnica de Discoteca e Iluminación", completada: false, asignadaA: 'Organizador' }
            ];
            updatedFiesta.tareas = initialTasks.map((t, i) => ({ ...t, id: `auto_task_${Date.now()}_${i}_${Math.random().toString(36).substring(7)}` }));
        }

        await saveFiesta(updatedFiesta);

        // Sincronizar fiesta con presupuesto
        if (updatedFiesta.presupuestoId) {
            try {
                const { syncFiestaFromBudget } = await import('./fiesta.actions');
                await syncFiestaFromBudget(updatedFiesta.id);
            } catch (e) {
                console.warn("No se pudo sincronizar fiesta desde presupuesto:", e);
            }
        }

        // NOTIFICACIÓN: Contrato físico cargado
        createNotification({
            titulo: 'Contrato Físico Registrado',
            mensaje: `Contrato físico escaneado y registrado para ${fiesta.configuracion.nombreEvento || fiesta.id}.`,
            href: `/fiestas/nueva/gestion-documental/contrato-servicio?fiestaId=${fiestaId}`,
            icono: 'ListChecks',
            tipo: 'exito',
            entidadRelacionadaId: fiestaId,
            rolDestino: 'admin',
        }).catch(err => console.warn('Error creating physical contract notification:', err));

        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
