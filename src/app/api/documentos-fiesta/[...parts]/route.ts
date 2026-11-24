import { isFileNotFoundError } from '@/lib/error-utils';

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';
import { getFiestaActual } from '@/app/actions/fiesta/fiesta.actions';
import { esDelEquipoDeLaFiesta } from '@/lib/auth/equipo-de-la-fiesta';
import { verifyPortalSession } from '@/lib/security/portal-session';
import { getFiestaByIdRaw } from '@/lib/fiesta/get-fiesta-raw';
import { downloadFromStorage } from '@/lib/firebase/storage';

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

export async function GET(request: NextRequest, props: { params: Promise<{ parts: string[] }> }) {
  const params = await props.params;
  const [fiestaId, filename] = params.parts;

  // Del equipo de ESA fiesta, no cualquier sesión: el personal también tiene una (auditoría 69).
  const hasAdminAccess = fiestaId ? await esDelEquipoDeLaFiesta(await getFiestaByIdRaw(fiestaId)) : false;
  const hasClientAccess = fiestaId ? await verifyPortalSession(fiestaId) : false;
  if (!hasAdminAccess && !hasClientAccess) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Handle the special 'download-all' command
  if (filename === 'download-all.zip') {
    if (!hasAdminAccess) return new NextResponse('Forbidden', { status: 403 });
    try {
      // Antes se pedia "la fiesta actual" y se comparaba: descargar los
      // documentos de una fiesta fallaba en cuanto habia otra mas proxima.
      const fiesta = await getFiestaByIdRaw(fiestaId);
      if (!fiesta) {
        return NextResponse.json({ error: 'Fiesta no encontrada' }, { status: 404 });
      }

      const zip = new JSZip();
      
      // Add all documents from 'otrosDocumentos'
      let addedCount = 0;
      if (fiesta.othersDocumentos && fiesta.othersDocumentos.length > 0) {
        const docsDir = path.join(DOCS_DIR, fiestaId);
        for (const doc of fiesta.othersDocumentos) {
          if (!doc.fileName) continue;
          if (doc.fileName.startsWith('http')) {
            try {
              const res = await fetch(doc.fileName);
              if (res.ok) {
                const buf = Buffer.from(await res.arrayBuffer());
                const name = path.basename(doc.fileName.split('?')[0]) || 'archivo';
                zip.file(name, buf);
                addedCount++;
              }
            } catch (e) {
              console.error('Error fetching remote doc:', e);
            }
          } else if (doc.fileName.startsWith('data:')) {
            try {
              const parts = doc.fileName.split(',');
              const base64Data = parts[1];
              if (base64Data) {
                const buf = Buffer.from(base64Data, 'base64');
                const mimeMatch = parts[0].match(/data:(.*?);/);
                const ext = mimeMatch ? '.' + mimeMatch[1].split('/')[1] : '';
                const name = `documento-${Date.now()}${ext}`;
                zip.file(name, buf);
                addedCount++;
              }
            } catch (e) {
              console.error('Error decoding base64 doc:', e);
            }
          } else {
            const filePath = path.join(docsDir, doc.fileName);
            try {
              await fs.access(filePath);
              const fileContent = await fs.readFile(filePath);
              zip.file(doc.fileName, fileContent);
              addedCount++;
            } catch (error) {
              const fromStorage = await downloadFromStorage(`documentos-varios-fiesta/${fiestaId}/${path.basename(doc.fileName)}`);
              if (fromStorage) {
                zip.file(doc.fileName, fromStorage);
                addedCount++;
              } else {
                console.warn(`File not found, skipping: ${filePath}`);
              }
            }
          }
        }
      }

      if (addedCount === 0) {
        return NextResponse.json({ error: 'No hay documentos para bajar' }, { status: 404 });
      }

      const zipContent = await zip.generateAsync({ type: 'nodebuffer' });
      const zipFilename = `documentos-${fiestaId.substring(0, 6)}.zip`;

      const headers = new Headers();
      headers.set('Content-Type', 'application/zip');
      headers.set('Content-Disposition', `attachment; filename="${zipFilename}"`);
      return new NextResponse(zipContent as BodyInit, { status: 200, headers });

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

  if (!hasAdminAccess) {
    const fiesta = await getFiestaByIdRaw(safeFiestaId);
    const legacyFiesta = fiesta as typeof fiesta & {
      documentos?: Array<{ fileName?: string }>;
      otrosDocumentos?: Array<{ fileName?: string }>;
    };
    const allowedDocuments = [
      ...(legacyFiesta?.documentos ?? []),
      ...(legacyFiesta?.otrosDocumentos ?? []),
      ...(fiesta?.othersDocumentos ?? []),
    ];
    const isClientDocument = allowedDocuments.some(doc => doc.fileName === safeFilename);
    if (!fiesta?.clientPortalSettings?.enabled || !isClientDocument) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  const filePath = path.join(DOCS_DIR, safeFiestaId, safeFilename);

  if (!filePath.startsWith(DOCS_DIR)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    let fileBuffer: Buffer;
    try {
      await fs.access(filePath);
      fileBuffer = await fs.readFile(filePath);
    } catch (fsErr) {
      const fromStorage = await downloadFromStorage(`documentos-varios-fiesta/${safeFiestaId}/${safeFilename}`);
      if (!fromStorage) throw fsErr;
      fileBuffer = fromStorage;
    }

    // Determine content type from file extension if possible
    let contentType = 'application/octet-stream'; // generic binary
    const ext = path.extname(safeFilename).toLowerCase();
    if (ext === '.pdf') contentType = 'application/pdf';
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    if (ext === '.png') contentType = 'image/png';
    if (ext === '.txt') contentType = 'text/plain';

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `inline; filename="${safeFilename}"`);

    return new NextResponse(fileBuffer as BodyInit, { status: 200, headers });
  } catch (error) {
    console.error(`Error serving fiesta document ${safeFilename}:`, error);
    if (isFileNotFoundError(error)) {
      return new NextResponse('Document file not found', { status: 404 });
    }
    return new NextResponse('Error serving file', { status: 500 });
  }
}
