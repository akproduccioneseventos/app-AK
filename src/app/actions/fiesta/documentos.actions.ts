'use server';

import type { FiestaEnPlanificacion, OtroDocumento, DocumentoTipo, Tarea } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from './fiesta.actions';
import { headers } from 'next/headers';
import { registerBookingDeposit } from '../invoices';
import { leerFacturasSinGuardia } from '@/lib/invoices/leer-facturas';
import { isDepositReceiptInvoice } from '@/lib/commercial-flow/ledger-service';
import { addDays } from 'date-fns';
import { createNotification } from '@/lib/notifications/create-notification';
import { uploadToStorage, deleteFromStorage } from '@/lib/firebase/storage';
import { getPresupuestoById } from '../presupuestos';
import { resolveDepositAmount } from '@/lib/fiesta/sena-del-contrato';
import { generateBudgetToken } from '@/lib/auth/session-token';
import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';
import { verifyPortalSession } from '@/lib/security/portal-session';
import { requireAppSession, requirePermiso } from '@/lib/auth/require-session';
import { PERMISOS } from '@/lib/auth/perfiles';
import { getBudgetCollectibleTotal } from '@/lib/budget/financial-guardrails';

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
      // El portal ya está verificado: se lee SU presupuesto con el enlace de ese presupuesto. Sin el
      // enlace, el cliente sin cuenta del equipo recibía nada y veía 0 / seña por defecto (Codex 240, C1).
      const presupuesto = await getPresupuestoById(fiesta.presupuestoId, await generateBudgetToken(fiesta.presupuestoId));
      if (!presupuesto) {
        // No se inventan importes: si el presupuesto no se puede leer, se dice.
        return { success: false, error: 'No pudimos leer tu presupuesto. Probá de nuevo en un rato.' };
      }
      {
        // Lo que se le va a cobrar de verdad, con el ajuste anual si corresponde (pregunta 36): antes
        // el cliente veía antes de firmar un saldo $15.000 menor que el real.
        totalEstimado = getBudgetCollectibleTotal(presupuesto);
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
        // El archivo ya esta subido y ocupando lugar: si la ficha no se guarda, el
        // documento no aparece en ningun lado. Eso se avisa, no se calla.
        const guardado = await saveFiesta(updatedFiesta);
        if (!guardado.success) {
            return { success: false, error: guardado.error || 'El archivo se subio pero no se pudo guardar en el evento.' };
        }

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
    // Subir un documento si pedia permiso; borrarlo, no. Ahora pide el mismo que subir (barrido de la
    // pregunta 35, 21/10/2026): con sólo sesión, el personal borraba el contrato o la factura.
    const permiso = await requirePermiso(PERMISOS.CONTABILIDAD);
    if (!permiso.ok) return { success: false, error: permiso.error };
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
        // El archivo ya se borro: si la ficha no se guarda, el evento queda
        // apuntando a un documento que no existe.
        const guardado = await saveFiesta(updatedFiesta);
        if (!guardado.success) {
            return { success: false, error: guardado.error || 'El archivo se borro pero el evento no se pudo guardar.' };
        }

        return { success: true };
    } catch(e:any) {
        return { success: false, error: e.message };
    }
}

// --- TOQUE DE ORO 2: AUTOMATIZACIÓN DE FLUJOS (DOMINÓ) ---

/**
 * FIRMA DIGITAL DEL CONTRATO DESDE EL PORTAL DEL CLIENTE — sólo una CONSTANCIA (25 de
 * septiembre de 2026, decisión del dueño: "las dos, papel obligatorio").
 *
 * El cliente firma en su portal y queda registrado quién, cuándo, desde dónde, si aceptó el
 * plan de pagos y la huella del texto exacto que firmó. **Se guarda aparte
 * (`firmaDigitalConstancia`), NO en `contratoFirmaInfo`**: varias partes de la app leen
 * `contratoFirmaInfo.isSigned` como "contrato firmado" (etapa comercial, presupuesto
 * bloqueado, preparación). La reserva, la seña y el estado "Contratada" salen ÚNICAMENTE del
 * contrato en papel (`uploadPhysicalContract`). No hay atajo digital para contratar.
 */
export async function signContractDigitally(
    fiestaId: string,
    signerName: string,
    acceptedPlanPagos?: boolean,
    /** Huella (sha256) del texto que el cliente tenía en pantalla al tocar "Firmar". */
    huellaVista?: string,
): Promise<{ success: boolean; error?: string }> {
    if (!(await verifyPortalSession(fiestaId))) {
      return { success: false, error: 'Sesión del portal no autorizada.' };
    }
    try {
        const nombre = String(signerName || '').trim().slice(0, 120) || 'Cliente';
        const h = await headers();
        const ip = (h.get('x-forwarded-for') || h.get('x-real-ip') || '').split(',')[0].trim() || undefined;
        const { createHash } = await import('crypto');
        let error: string | null = null;
        let firmadaAhora = false;
        let nombreEvento = fiestaId;
        // Todo se decide adentro de la escritura (Codex 240, C3 y C4): dos firmas a la vez ya no pisan
        // la primera, y si el texto cambió después de que el cliente lo leyó, no se le atribuye el nuevo.
        const guardado = await actualizarFiesta(fiestaId, (actual) => {
            error = null;
            firmadaAhora = false;
            nombreEvento = actual.configuracion?.nombreEvento || actual.id;
            // Ya firmado (en el portal o en papel): no se firma dos veces ni se cambia la constancia.
            if (actual.firmaDigitalConstancia || actual.contratoFirmaInfo?.isSigned) return actual;
            const texto = actual.contratoServicioTexto;
            if (!texto || !texto.trim()) { error = 'El contrato todavía no está listo para firmar.'; return actual; }
            if (actual.contratoDatos?.planPagos?.activo && !acceptedPlanPagos) {
                error = 'Para firmar tenés que aceptar el plan de pagos.';
                return actual;
            }
            const textoHuella = createHash('sha256').update(texto).digest('hex');
            if (!huellaVista || huellaVista !== textoHuella) {
                error = 'El contrato cambió desde que lo abriste. Recargá la página, leelo de nuevo y volvé a firmar.';
                return actual;
            }
            firmadaAhora = true;
            return {
                ...actual,
                firmaDigitalConstancia: {
                    signedAt: new Date().toISOString(),
                    signedBy: nombre,
                    ...(ip ? { ip } : {}),
                    textoHuella,
                    planPagosAceptado: Boolean(acceptedPlanPagos),
                },
            };
        });
        if (!guardado.success) return { success: false, error: guardado.error || 'No se pudo registrar la firma.' };
        if (error) return { success: false, error };
        if (!guardado.updatedFiesta && !firmadaAhora) return { success: false, error: 'Evento no encontrado.' };
        if (!firmadaAhora) return { success: true };

        createNotification({
            titulo: 'El cliente firmó el contrato en su portal',
            mensaje: `${nombre} firmó en el portal el contrato de ${nombreEvento}. Falta el contrato firmado en papel para confirmar la reserva.`,
            href: `/fiestas/nueva/gestion-documental/contrato-servicio?fiestaId=${fiestaId}`,
            icono: 'ListChecks',
            tipo: 'info',
            entidadRelacionadaId: fiestaId,
            rolDestino: 'admin',
        }).catch(err => console.warn('Error creating digital contract notification:', err));
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e?.message || 'No se pudo registrar la firma.' };
    }
}

/**
 * Sube el contrato firmado en papel y deja el evento como Contratado.
 *
 * Pide sesion del equipo. Esto no es solo subir un archivo: marca el contrato
 * como firmado y cambia el estado del evento, que es lo que dispara el cobro de
 * la senia y la organizacion. Sin la guarda, cualquiera de afuera podia dar por
 * firmado un contrato que nadie firmo.
 */
export async function uploadPhysicalContract(formData: FormData): Promise<{
    success: boolean;
    error?: string;
    warning?: string;
    reciboPendiente?: string;
}> {
    // El contrato en papel da la fiesta por contratada y anota la seña: es plata (auditoría con
    // las 35 preguntas, 5/10/2026). Antes alcanzaba cualquier sesión, y sin contabilidad la seña
    // no se cargaba y nadie se enteraba.
    const permiso = await requirePermiso(PERMISOS.CONTABILIDAD);
    if (!permiso.ok) return { success: false, error: permiso.error };

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

        return await dejarLaFiestaContratada(fiesta, {
            isSigned: true,
            signedAt: new Date().toISOString(),
            method: 'physical',
            physicalContractUrl: storagePath
        }, {
            titulo: 'Contrato Físico Registrado',
            mensaje: `Contrato físico escaneado y registrado para ${fiesta.configuracion.nombreEvento || fiesta.id}.`,
        });
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/**
 * Deja la fiesta contratada: estado, portal del cliente, recibo de seña y tareas iniciales.
 * Sale sólo del contrato en papel (decisión del dueño): la firma del portal es una constancia.
 */
async function dejarLaFiestaContratada(
    fiesta: FiestaEnPlanificacion,
    firma: NonNullable<FiestaEnPlanificacion['contratoFirmaInfo']>,
    aviso: { titulo: string; mensaje: string },
): Promise<{ success: boolean; error?: string; warning?: string; reciboPendiente?: string }> {
    const fiestaId = fiesta.id;
        const updatedFiesta: FiestaEnPlanificacion = {
            ...fiesta,
            estado: 'Contratada',
            contratoFirmaInfo: firma,
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
        // Lectura interna dentro de una accion ya guardada: firmar el contrato no
        // exige el permiso de contabilidad, y esto solo mira si ya hay recibo de sena.
        const existingInvoices = await leerFacturasSinGuardia();
        const hasDeposit = existingInvoices.some(invoice =>
            isDepositReceiptInvoice(invoice)
            && (eventInvoiceIds.has(invoice.id) || invoice.sourceFiestaId === fiesta.id)
        );
        let motivoReciboPendiente: string | undefined;

        if (!hasDeposit) {
            try {
                const depositAmount = await resolveDepositAmount(fiesta);
                if (depositAmount === null) {
                    throw new Error('No se pudo leer el presupuesto para calcular la seña: el recibo queda pendiente.');
                }
                const depositResult = await registerBookingDeposit({
                    fiestaId: fiesta.id,
                    amount: depositAmount,
                    method: 'Transferencia',
                    date: new Date().toISOString(),
                    skipFiestaSave: true
                });
                if (depositResult.success && depositResult.invoiceId) {
                    updatedFiesta.invoiceIds = [...(updatedFiesta.invoiceIds || []), depositResult.invoiceId];
                    delete updatedFiesta.reciboSenaPendiente;
                } else if (!depositResult.success) {
                    const motivo = depositResult.error || 'No se pudo generar el recibo de seña.';
                    motivoReciboPendiente = motivo;
                    updatedFiesta.reciboSenaPendiente = {
                        motivo,
                        fecha: new Date().toISOString()
                    };
                }
            } catch (e: any) {
                console.warn("No se pudo auto-generar factura de seña:", e);
                const motivo = (e && typeof e.message === 'string' && e.message) ? e.message : 'Error al generar el recibo de seña.';
                motivoReciboPendiente = motivo;
                updatedFiesta.reciboSenaPendiente = {
                    motivo,
                    fecha: new Date().toISOString()
                };
            }
        } else {
            delete updatedFiesta.reciboSenaPendiente;
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

        /**
         * FIRMAR EL CONTRATO ES LO MAS CARO QUE TIENE ESTA PANTALLA.
         *
         * Aca se pasa la fiesta a "Contratada", se habilita el portal del cliente y
         * se genera la factura de sena. Si el guardado falla y nadie lo mira, el
         * contrato figura firmado, **no hay factura de sena, el portal no se abre y
         * la fiesta sigue esperando firma**. Y encima sale la notificacion diciendo
         * que quedo registrado.
         */
        const guardado = await saveFiesta(updatedFiesta);
        if (!guardado.success) {
            return { success: false, error: guardado.error || 'El contrato quedo registrado pero el evento no se pudo guardar. No quedo como contratado.' };
        }

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
            titulo: aviso.titulo,
            mensaje: aviso.mensaje,
            href: `/fiestas/nueva/gestion-documental/contrato-servicio?fiestaId=${fiestaId}`,
            icono: 'ListChecks',
            tipo: 'exito',
            entidadRelacionadaId: fiestaId,
            rolDestino: 'admin',
        }).catch(err => console.warn('Error creating contract notification:', err));

        return {
            success: true,
            ...(motivoReciboPendiente ? { reciboPendiente: motivoReciboPendiente, warning: motivoReciboPendiente } : {})
        };
}


