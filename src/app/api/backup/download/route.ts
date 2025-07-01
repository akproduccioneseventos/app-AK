import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';

const dataDirectory = path.join(process.cwd(), 'src', 'data');

async function addFilesToZip(zip: JSZip, directoryPath: string, parentPath: string = '') {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directoryPath, entry.name);
    const zipPath = path.join(parentPath, entry.name);
    if (entry.isDirectory()) {
      await addFilesToZip(zip.folder(entry.name)!, fullPath, zipPath);
    } else {
      const fileContent = await fs.readFile(fullPath);
      zip.file(entry.name, fileContent);
    }
  }
}

export async function GET() {
  try {
    const zip = new JSZip();
    
    // Check if the data directory exists
    try {
      await fs.access(dataDirectory);
    } catch (e) {
      return new NextResponse(JSON.stringify({ error: 'Data directory not found.' }), { status: 404 });
    }

    await addFilesToZip(zip, dataDirectory);

    const zipContent = await zip.generateAsync({ type: 'nodebuffer' });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `ak-producciones-backup-${timestamp}.zip`;

    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);

    return new NextResponse(zipContent, { status: 200, headers });

  } catch (error: any) {
    console.error('Error creating backup:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to create backup.', details: error.message }), { status: 500 });
  }
}
