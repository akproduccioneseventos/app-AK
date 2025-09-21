'use server';

import { initialFiestaActualData } from '@/lib/fiesta-defaults';
import type { FiestaEnPlanificacion, OtroDocumento, DocumentoTipo } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';
import path from 'path';
import fs from 'fs/promises';

const FIESTAS_DIR = 'fiestas';
const FIESTA_ACTUAL_ID = "fiesta_1762181514757";
const FIESTA_ACTUAL_FILE_PATH = path.join(FIESTAS_DIR, `${FIESTA_ACTUAL_ID}.json`);
const DATA_DIR = path.join(process.cwd(), 'src', 'data');

async function ensureDirectoryExists(dirPath: string) {
  try { await fs.access(dirPath); } catch { await fs.mkdir(dirPath, { recursive: true }); }
}

async function updateFiestaData(updateFn: (data: FiestaEnPlanificacion) => FiestaEnPlanificacion): Promise<{ success: boolean; error?: string }> {
  try {
    const currentData = await readData<FiestaEnPlanificacion>(FIESTA_ACTUAL_FILE_PATH, initialFiestaActualData);
    const updatedData = updateFn(currentData);
    await writeData(FIESTA_ACTUAL_FILE_PATH, updatedData);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function uploadDocumento(formData: FormData): Promise<{ success: boolean; error?: string }> {
    const file = formData.get('file') as File | null;
    const docType = formData.get('docType') as DocumentoTipo;
    const customName = formData.get('customName') as string;

    if (!file) return { success: false, error: 'No se proporcionó ningún archivo.' };

    try {
        const fiesta = await readData<FiestaEnPlanificacion>(FIESTA_ACTUAL_FILE_PATH, initialFiestaActualData);
        const docsDir = path.join(DATA_DIR, 'documentos-varios-fiesta', fiesta.id);
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
        
        await updateFiestaData(data => ({...data, otrosDocumentos: [...(data.otrosDocumentos || []), newDoc]}));
        return { success: true };
    } catch(e:any) {
        return { success: false, error: e.message };
    }
}

export async function deleteDocumento(docId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const fiesta = await readData<FiestaEnPlanificacion>(FIESTA_ACTUAL_FILE_PATH, initialFiestaActualData);
        const docToDelete = fiesta.otrosDocumentos?.find(d => d.id === docId);
        if (!docToDelete) {
            return { success: false, error: 'Documento no encontrado.' };
        }
        
        const filePath = path.join(DATA_DIR, 'documentos-varios-fiesta', fiesta.id, docToDelete.fileName);
        try { await fs.unlink(filePath); } catch (e) { console.warn(`No se pudo eliminar el archivo físico ${filePath}, puede que ya no exista.`); }

        await updateFiestaData(data => ({...data, otrosDocumentos: (data.otrosDocumentos || []).filter(d => d.id !== docId)}));

        return { success: true };
    } catch (e:any) {
        return { success: false, error: e.message };
    }
}
