import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';
import { requireVerifiedAdmin } from '@/lib/auth/verify-session-cookie';

const dataDirectory = path.join(process.cwd(), 'src', 'data');

export async function POST(request: Request) {
  // Require admin session before allowing backup upload
  try {
    await requireVerifiedAdmin();
  } catch {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('backupFile') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se ha subido ningún archivo.' }, { status: 400 });
    }

    if (file.type !== 'application/zip') {
      return NextResponse.json({ error: 'El archivo debe ser de tipo .zip.' }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Borrar el directorio de datos actual para asegurar una restauración limpia
    await fs.rm(dataDirectory, { recursive: true, force: true });
    await fs.mkdir(dataDirectory, { recursive: true });

    // Cargar y extraer el zip
    const zip = await JSZip.loadAsync(fileBuffer);
    
    const writeFilePromises: Promise<void>[] = [];

    zip.forEach((relativePath, zipEntry) => {
      // Security check: ensure files are not written outside the data directory.
      const resolvedPath = path.resolve(dataDirectory, relativePath);
      if (!resolvedPath.startsWith(path.resolve(dataDirectory))) {
        console.warn(`Skipping potentially malicious zip entry: ${relativePath}`);
        return; // Skip this entry
      }

      if (!zipEntry.dir) {
        const writePromise = zipEntry.async('nodebuffer').then(async (content) => {
           // Ensure subdirectory exists before writing file
           const dirName = path.dirname(resolvedPath);
           await fs.mkdir(dirName, { recursive: true });
           await fs.writeFile(resolvedPath, content);
        });
        writeFilePromises.push(writePromise);
      }
    });

    await Promise.all(writeFilePromises);

    return NextResponse.json({ success: true, message: 'Backup restaurado correctamente.' });

  } catch (error: any) {
    console.error('Error restaurando el backup:', error);
    return NextResponse.json({ error: 'Fallo al restaurar el backup.', details: error.message }, { status: 500 });
  }
}
