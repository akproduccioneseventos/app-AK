
'use server';

import type { FiestaEnPlanificacion, OtroDocumento, DocumentoTipo, Tarea } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';
import path from 'path';
import fs from 'fs/promises';
import { getFiestaById, saveFiesta, syncFiestaFromBudget } from './fiesta.actions';
import { headers } from 'next/headers';
import { registerBookingDeposit } from '../invoices';
import { subDays } from 'date-fns';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');

async function ensureDirectoryExists(dirPath: string) {
  try { await fs.access(dirPath); } catch { await fs.mkdir(dirPath, { recursive: true }); }
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

        const docsDir = path.join(DATA_DIR, 'documentos-varios-fiesta', fiestaId);
        await ensureDirectoryExists(docsDir);
        
        const docId = `doc_${Date.now()}`;
        const newFilename = `${docId}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const filePath = path.join(docsDir, newFilename);

        const bytes = await file.arrayBuffer();
        await fs.writeFile(filePath, Buffer.from(bytes));
        
        const newDoc: OtroDocumento = {
            id: docId,
            nombre: customName.trim() || file.name,
            tipo: docType,
            fileName: newFilename,
            timestamp: new Date().toISOString(),
        };
        
        const updatedFiesta = {
            ...fiesta,
            otrosDocumentos: [...(fiesta.otrosDocumentos || []), newDoc]
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

        const docToDelete = fiesta.otrosDocumentos?.find(d => d.id === docId);
        if (!docToDelete) {
            return { success: false, error: 'Documento no encontrado.' };
        }
        
        const filePath = path.join(DATA_DIR, 'documentos-varios-fiesta', fiestaId, docToDelete.fileName);
        try { await fs.unlink(filePath); } catch (e) { console.warn(`No se pudo eliminar el archivo físico ${filePath}, puede que ya no exista.`); }

        const updatedFiesta = {
            ...fiesta,
            otrosDocumentos: (fiesta.otrosDocumentos || []).filter(d => d.id !== docId)
        };
        await saveFiesta(updatedFiesta);

        return { success: true };
    } catch(e:any) {
        return { success: false, error: e.message };
    }
}

// --- TOQUE DE ORO 2: AUTOMATIZACIÓN DE FLUJOS (DOMINÓ) ---

export async function signContractDigitally(fiestaId: string, signerName: string): Promise<{ success: boolean; error?: string }> {
    try {
        const fiesta = await getFiestaById(fiestaId);
        if (!fiesta) throw new Error("Evento no encontrado");

        const headersList = headers();
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

        // 1. AUTOMATIZACIÓN: Habilitar portal del cliente
        if (updatedFiesta.clientPortalSettings) {
            updatedFiesta.clientPortalSettings.enabled = true;
            updatedFiesta.clientPortalSettings.checklist.visible = true;
            updatedFiesta.clientPortalSettings.checklist.editable = true;
            updatedFiesta.clientPortalSettings.musica.visible = true;
            updatedFiesta.clientPortalSettings.moodboard.visible = true;
        }

        // 2. AUTOMATIZACIÓN: Generar Factura de Seña ($20.000)
        // Solo si no existe ya una factura de seña
        const hasDeposit = updatedFiesta.invoiceIds?.length && updatedFiesta.invoiceIds.some(id => id.includes('SEÑA'));
        if (!hasDeposit) {
            try {
                await registerBookingDeposit({
                    fiestaId: fiesta.id,
                    amount: 20000,
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
                { texto: "Definir paleta de colores en Dream Designer", completada: false, asignadaA: 'Cliente', fechaLimite: subDays(new Date(), -7).toISOString() },
                { texto: "Cargar primeras 10 fotos en Video de Vida", completada: false, asignadaA: 'Cliente' },
                { texto: "Confirmar lista base de invitados", completada: false, asignadaA: 'Cliente' },
                { texto: "Revisión técnica de Discoteca e Iluminación", completada: false, asignadaA: 'Organizador' }
            ];
            updatedFiesta.tareas = initialTasks.map(t => ({ ...t, id: `auto_task_${Date.now()}_${Math.random().toString(36).substring(7)}` }));
        }

        await saveFiesta(updatedFiesta);

        // 4. AUTOMATIZACIÓN: Sincronizar fiesta con presupuesto (servicios, personal, etc.)
        if (updatedFiesta.presupuestoId) {
            try {
                await syncFiestaFromBudget(updatedFiesta.id);
            } catch (e) {
                console.warn("No se pudo sincronizar fiesta desde presupuesto:", e);
            }
        }

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

        const contractsDir = path.join(DATA_DIR, 'contracts', 'signed-physical', fiestaId);
        await ensureDirectoryExists(contractsDir);

        const newFilename = `contrato_fisico_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const filePath = path.join(contractsDir, newFilename);

        const bytes = await file.arrayBuffer();
        await fs.writeFile(filePath, Buffer.from(bytes));

        const publicUrl = `/api/signed-contracts/${fiestaId}/${newFilename}`;

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

        // Generar Factura de Seña si no existe
        const hasDeposit = updatedFiesta.invoiceIds?.length && updatedFiesta.invoiceIds.some(id => id.includes('SEÑA'));
        if (!hasDeposit) {
            try {
                await registerBookingDeposit({
                    fiestaId: fiesta.id,
                    amount: 20000,
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
                { texto: "Definir paleta de colores en Dream Designer", completada: false, asignadaA: 'Cliente', fechaLimite: subDays(new Date(), -7).toISOString() },
                { texto: "Cargar primeras 10 fotos en Video de Vida", completada: false, asignadaA: 'Cliente' },
                { texto: "Confirmar lista base de invitados", completada: false, asignadaA: 'Cliente' },
                { texto: "Revisión técnica de Discoteca e Iluminación", completada: false, asignadaA: 'Organizador' }
            ];
            updatedFiesta.tareas = initialTasks.map(t => ({ ...t, id: `auto_task_${Date.now()}_${Math.random().toString(36).substring(7)}` }));
        }

        await saveFiesta(updatedFiesta);

        // Sincronizar fiesta con presupuesto
        if (updatedFiesta.presupuestoId) {
            try {
                await syncFiestaFromBudget(updatedFiesta.id);
            } catch (e) {
                console.warn("No se pudo sincronizar fiesta desde presupuesto:", e);
            }
        }

        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
