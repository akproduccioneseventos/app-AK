'use server';

import type { FiestaEnPlanificacion, OtroDocumento, DocumentoTipo } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';
import path from 'path';
import fs from 'fs/promises';
import { getFiestaById, saveFiesta } from './fiesta.actions';

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
    } catch (e:any) {
        return { success: false, error: e.message };
    }
}
