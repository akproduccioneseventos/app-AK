
'use server';

import type { FiestaEnPlanificacion, OtroDocumento, DocumentoTipo, Tarea } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from './fiesta.actions';
import { headers } from 'next/headers';
import { registerBookingDeposit } from '../invoices';
import { addDays } from 'date-fns';
import { createNotification } from '../notifications';
import { uploadToStorage, deleteFromStorage } from '@/lib/firebase/storage';
import { getPresupuestoById } from '../presupuestos';

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

export async function uploadDocumento(formData: FormData): Promise<{ success: boolean; error?: string }> {
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
    try {
        const fiesta = await getFiestaById(fiestaId);
        if (!fiesta) throw new Error("Evento no encontrado");

        const headersList = await headers();
        const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'IP desconocida';

        const updatedFiesta: FiestaEnPlanificacion = {
            ...fiesta,
            estado: 'Contratada',
            contratoFirmaInfo: {
                isSigned: true,
                signedAt: new Date().toISOString(),
                method: 'digital',
                signedBy: signerName,
                ip: ip
            }
        };

        // Save plan acceptance if the contract has a plan and client accepted it
        if (
            acceptedPlanPagos &&
            updatedFiesta.contratoDatos?.planPagos
        ) {
            updatedFiesta.contratoDatos = {
                ...updatedFiesta.contratoDatos,
                planPagos: {
                    ...updatedFiesta.contratoDatos.planPagos,
                    aceptadoPorCliente: true,
                    aceptadoAt: new Date().toISOString(),
                },
            };
        }

        // 1. AUTOMATIZACIÓN: Habilitar portal del cliente
        if (updatedFiesta.clientPortalSettings) {
            updatedFiesta.clientPortalSettings.enabled = true;
            updatedFiesta.clientPortalSettings.checklist.visible = true;
            updatedFiesta.clientPortalSettings.checklist.editable = true;
            updatedFiesta.clientPortalSettings.musica.visible = true;
            updatedFiesta.clientPortalSettings.moodboard.visible = true;
        }

        // 2. AUTOMATIZACIÓN: Generar Factura de Seña (monto desde presupuesto)
        // Solo si no existe ya una factura de seña
        const hasDeposit = updatedFiesta.invoiceIds?.length && updatedFiesta.invoiceIds.some(id => id.includes('SEÑA'));
        if (!hasDeposit) {
            try {
                const depositAmount = await resolveDepositAmount(fiesta);
                await registerBookingDeposit({
                    fiestaId: fiesta.id,
                    amount: depositAmount,
                    method: 'Transferencia',
                    date: new Date().toISOString()
                });
            } catch (e) {
                console.warn("No se pudo auto-generar factura de seña:", e);
            }
        }

        // 3. AUTOMATIZACIÓN: Cargar tareas iniciales si está vacío
        if (!updatedFiesta.tareas || updatedFiesta.tareas.length === 0) {
            const eventDate = fiesta.configuracion.fechaEvento ? new Date(fiesta.configuracion.fechaEvento) : new Date();
            const initialTasks: Omit<Tarea, 'id'>[] = [
                { texto: "Definir paleta de colores en Dream Designer", completada: false, asignadaA: 'Cliente', fechaLimite: addDays(new Date(), 7).toISOString() },
                { texto: "Cargar primeras 10 fotos en Video de Vida", completada: false, asignadaA: 'Cliente' },
                { texto: "Confirmar lista base de invitados", completada: false, asignadaA: 'Cliente' },
                { texto: "Revisión técnica de Discoteca e Iluminación", completada: false, asignadaA: 'Organizador' }
            ];
            updatedFiesta.tareas = initialTasks.map((t, i) => ({ ...t, id: `auto_task_${Date.now()}_${i}_${Math.random().toString(36).substring(7)}` }));
        }

        await saveFiesta(updatedFiesta);

        // 4. SINCRONIZACIÓN: Sincronizar con presupuesto si existe
        if (updatedFiesta.presupuestoId) {
            try {
                const { syncFiestaFromBudget } = await import('./fiesta.actions');
                await syncFiestaFromBudget(updatedFiesta.id);
            } catch (e) {
                console.warn("No se pudo sincronizar fiesta desde presupuesto:", e);
            }
        }

        // 5. NOTIFICACIÓN: Contrato firmado digitalmente
        createNotification({
            titulo: 'Contrato Firmado',
            mensaje: `Contrato firmado digitalmente por ${signerName} — ${fiesta.configuracion.nombreEvento || fiesta.id}.`,
            href: `/fiestas/nueva/gestion-documental/contrato-servicio?fiestaId=${fiestaId}`,
            icono: 'ListChecks',
            tipo: 'exito',
            entidadRelacionadaId: fiestaId,
            rolDestino: 'admin',
        }).catch(err => console.warn('Error creating contract signature notification:', err));

        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function uploadPhysicalContract(formData: FormData): Promise<{ success: boolean; error?: string }> {
    const file = formData.get('file') as File | null;
    const fiestaId = formData.get('fiestaId') as string;

    if (!file || !fiestaId) return { success: false, error: 'Faltan datos.' };

    try {
        const fiesta = await getFiestaById(fiestaId);
        if (!fiesta) throw new Error("Evento no encontrado");

        const newFilename = `contrato_fisico_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const storagePath = `contracts/signed-physical/${fiestaId}/${newFilename}`;

        const bytes = await file.arrayBuffer();
        const publicUrl = await uploadToStorage(Buffer.from(bytes), storagePath, file.type || 'application/pdf', false);

        const updatedFiesta: FiestaEnPlanificacion = {
            ...fiesta,
            estado: 'Contratada',
            contratoFirmaInfo: {
                isSigned: true,
                signedAt: new Date().toISOString(),
                method: 'physical',
                physicalContractUrl: publicUrl
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
        const hasDeposit = updatedFiesta.invoiceIds?.length && updatedFiesta.invoiceIds.some(id => id.includes('SEÑA'));
        if (!hasDeposit) {
            try {
                const depositAmount = await resolveDepositAmount(fiesta);
                await registerBookingDeposit({
                    fiestaId: fiesta.id,
                    amount: depositAmount,
                    method: 'Transferencia',
                    date: new Date().toISOString()
                });
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
