
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';

const dataDirectory = path.join(process.cwd(), 'src', 'data');

async function addFilesToZip(zip: JSZip, directoryPath: string, parentPath: string = '') {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    // Skip the backups directory itself to prevent recursive zipping
    if (entry.name === 'backups' && parentPath === '') continue;

    const fullPath = path.join(directoryPath, entry.name);
    const zipPath = path.join(parentPath, entry.name);
    if (entry.isDirectory()) {
      // For directories, create a folder in the zip and recurse
      await addFilesToZip(zip.folder(entry.name)!, fullPath, zipPath);
    } else {
      // For files, read content and add to zip
      const fileContent = await fs.readFile(fullPath);
      zip.file(entry.name, fileContent);
    }
  }
}

export async function GET() {
  try {
    const zip = new JSZip();
    
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
        await addFilesToZip(zip.folder(entry.name)!, fullPath, entry.name);
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

    return new NextResponse(zipContent, { status: 200, headers });

  } catch (error: any) {
    console.error('Error creating backup:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to create backup.', details: error.message }), { status: 500 });
  }
}
