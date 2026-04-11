
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';
import { requireVerifiedAdmin } from '@/lib/auth/verify-session-cookie';

const dataDirectory = path.join(process.cwd(), 'src', 'data');

async function addFilesToZip(zip: JSZip, directoryPath: string, parentPath: string) {
  try {
    const entries = await fs.readdir(directoryPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directoryPath, entry.name);
      if (entry.isDirectory()) {
        const folder = zip.folder(entry.name);
        if (folder) {
          await addFilesToZip(folder, fullPath, path.join(parentPath, entry.name));
        }
      } else {
        const fileContent = await fs.readFile(fullPath);
        zip.file(entry.name, fileContent);
      }
    }
  } catch (error) {
    // If a directory doesn't exist, we can just skip it.
    // This can happen if a feature is enabled but no data has been created yet.
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error(`Error processing directory ${directoryPath}:`, error);
      throw error; // Re-throw other errors
    }
  }
}

export async function GET() {
  // Require admin session before allowing backup download
  try {
    await requireVerifiedAdmin();
  } catch {
    return new NextResponse(JSON.stringify({ error: 'No autorizado.' }), { status: 401 });
  }

  try {
    const zip = new JSZip();
    
    // Check if the main data directory exists
    try {
      await fs.access(dataDirectory);
    } catch (e) {
      return new NextResponse(JSON.stringify({ error: 'Data directory not found.' }), { status: 404 });
    }

    const entries = await fs.readdir(dataDirectory, { withFileTypes: true });

    for (const entry of entries) {
       // Exclude the 'backups' directory from the root of the zip
      if (entry.name === 'backups') {
        continue;
      }
      
      const fullPath = path.join(dataDirectory, entry.name);
      if (entry.isDirectory()) {
        const folder = zip.folder(entry.name);
        if(folder) {
            await addFilesToZip(folder, fullPath, entry.name);
        }
      } else {
        const fileContent = await fs.readFile(fullPath);
        zip.file(entry.name, fileContent);
      }
    }

    const zipContent = await zip.generateAsync({ type: 'nodebuffer' });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `ak-producciones-backup-${timestamp}.zip`;

    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);

    return new NextResponse(zipContent as BodyInit, { status: 200, headers });

  } catch (error: any) {
    console.error('Error creating backup:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to create backup.', details: error.message }), { status: 500 });
  }
}
