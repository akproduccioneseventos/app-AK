
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';
import { getFiestaActual } from '@/app/actions/fiesta-actual';

const DOCS_DIR = path.resolve(process.cwd(), 'src', 'data', 'documentos-varios-fiesta');

// Helper to add a file to the zip if it exists
async function addFileToZip(zip: JSZip, filePath: string, zipPath: string) {
  try {
    await fs.access(filePath);
    const fileContent = await fs.readFile(filePath);
    zip.file(zipPath, fileContent);
  } catch (error) {
    console.warn(`File not found, skipping: ${filePath}`);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { parts: string[] } }
) {
  const [fiestaId, filename] = params.parts;

  // Handle the special 'download-all' command
  if (filename === 'download-all.zip') {
    try {
      const fiesta = await getFiestaActual();
      if (fiesta.id !== fiestaId) {
        return NextResponse.json({ error: 'Fiesta ID mismatch' }, { status: 400 });
      }

      const zip = new JSZip();
      
      // Add all documents from 'otrosDocumentos'
      if (fiesta.otrosDocumentos && fiesta.otrosDocumentos.length > 0) {
        const docsDir = path.join(DOCS_DIR, fiestaId);
        for (const doc of fiesta.otrosDocumentos) {
          const filePath = path.join(docsDir, doc.fileName);
          await addFileToZip(zip, filePath, doc.fileName);
        }
      }

      const zipContent = await zip.generateAsync({ type: 'nodebuffer' });
      const zipFilename = `documentos-${fiestaId.substring(0, 6)}.zip`;

      const headers = new Headers();
      headers.set('Content-Type', 'application/zip');
      headers.set('Content-Disposition', `attachment; filename="${zipFilename}"`);
      return new NextResponse(zipContent, { status: 200, headers });

    } catch (error: any) {
      console.error('Error creating all-documents zip:', error);
      return NextResponse.json({ error: 'Failed to create zip file.', details: error.message }, { status: 500 });
    }
  }


  if (!fiestaId || !filename) {
    return new NextResponse('Fiesta ID and Filename are required', { status: 400 });
  }

  // Sanitize to prevent directory traversal
  const safeFiestaId = path.basename(fiestaId);
  const safeFilename = path.basename(filename);
  if (safeFiestaId !== fiestaId || safeFilename !== filename) {
    return new NextResponse('Invalid path segments', { status: 400 });
  }

  const filePath = path.join(DOCS_DIR, safeFiestaId, safeFilename);

  if (!filePath.startsWith(DOCS_DIR)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    await fs.access(filePath);
    const fileBuffer = await fs.readFile(filePath);

    const headers = new Headers();
    headers.set('Content-Type', 'application/octet-stream');
    headers.set('Content-Disposition', `inline; filename="${safeFilename}"`);

    return new NextResponse(fileBuffer, { status: 200, headers });
  } catch (error) {
    console.error(`Error serving fiesta document ${safeFilename}:`, error);
    // @ts-ignore
    if (error.code === 'ENOENT') {
      return new NextResponse('Document file not found', { status: 404 });
    }
    return new NextResponse('Error serving file', { status: 500 });
  }
}
