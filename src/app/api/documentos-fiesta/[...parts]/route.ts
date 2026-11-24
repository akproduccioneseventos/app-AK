import { isFileNotFoundError } from '@/lib/error-utils';

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import JSZip from 'jszip';
import { esDelEquipoDeLaFiesta } from '@/lib/auth/equipo-de-la-fiesta';
import { verifyPortalSession } from '@/lib/security/portal-session';
import { getFiestaByIdRaw } from '@/lib/fiesta/get-fiesta-raw';
import { downloadFromStorage } from '@/lib/firebase/storage';
import {
  fetchStorageBufferWithTimeout,
  getFiestaLocalAllowedDirs,
  isStorageUrlAllowed,
  leerArchivoSeguroDeFiesta,
  resolverRutaSeguraDeFiesta,
  validarFiestaIdSeguro,
} from '@/lib/security/safe-fiesta-file';

const DOCS_DIR = path.resolve(process.cwd(), 'src', 'data', 'documentos-varios-fiesta');
const MAX_DOC_SIZE = 50 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 15_000;

export async function GET(request: NextRequest, props: { params: Promise<{ parts: string[] }> }) {
  const params = await props.params;
  const parts = Array.isArray(params.parts) ? params.parts : [];
  if (parts.length !== 2) {
    return new NextResponse('Invalid path segments', { status: 400 });
  }
  const [fiestaId, filename] = parts;
  const safeFiestaId = validarFiestaIdSeguro(fiestaId);
  if (!safeFiestaId || !filename) {
    return new NextResponse('Invalid path segments', { status: 400 });
  }

  // Del equipo de ESA fiesta, no cualquier sesión: el personal también tiene una (auditoría 69).
  const fiestaRaw = await getFiestaByIdRaw(safeFiestaId);
  const hasAdminAccess = await esDelEquipoDeLaFiesta(fiestaRaw);
  const hasClientAccess = await verifyPortalSession(fiestaId);
  if (!hasAdminAccess && !hasClientAccess) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const docsAllowedDirs = getFiestaLocalAllowedDirs('documentos', safeFiestaId);

  // Handle the special 'download-all' command
  if (filename === 'download-all.zip') {
    if (!hasAdminAccess) return new NextResponse('Forbidden', { status: 403 });
    try {
      // Antes se pedia "la fiesta actual" y se comparaba: descargar los
      // documentos de una fiesta fallaba en cuanto habia otra mas proxima.
      const fiesta = fiestaRaw;
      if (!fiesta) {
        return NextResponse.json({ error: 'Fiesta no encontrada' }, { status: 404 });
      }

      const legacyFiesta = fiesta as typeof fiesta & {
        otrosDocumentos?: Array<{ fileName?: string }>;
      };
      const docsList = [
        ...(fiesta.othersDocumentos ?? []),
        ...(legacyFiesta.otrosDocumentos ?? []),
      ];
      const seenFileNames = new Set<string>();

      const zip = new JSZip();

      // Add all documents from 'otrosDocumentos' y 'othersDocumentos'
      let addedCount = 0;
      for (const doc of docsList) {
        if (!doc.fileName || seenFileNames.has(doc.fileName)) continue;
        seenFileNames.add(doc.fileName);

        if (/^https?:\/\//i.test(doc.fileName)) {
          if (!isStorageUrlAllowed(doc.fileName)) {
            console.warn(`[SSRF Guard] Blocked download of unsafe document URL: ${doc.fileName}`);
            continue;
          }
          try {
            const buf = await fetchStorageBufferWithTimeout(doc.fileName, MAX_DOC_SIZE, FETCH_TIMEOUT_MS);
            const rawName = path.basename(doc.fileName.split('?')[0]) || 'archivo';
            const safeRemoteName = rawName.replace(/\.\./g, '_');
            zip.file(safeRemoteName, buf);
            addedCount++;
          } catch (e) {
            console.error('Error fetching remote doc:', e);
          }
        } else if (doc.fileName.startsWith('data:')) {
          try {
            const dataParts = doc.fileName.split(',');
            const base64Data = dataParts[1];
            if (base64Data) {
              const buf = Buffer.from(base64Data, 'base64');
              if (buf.length > MAX_DOC_SIZE) continue;
              const mimeMatch = dataParts[0].match(/data:(.*?);/);
              const ext = mimeMatch ? '.' + mimeMatch[1].split('/')[1].replace(/[^a-z0-9]/gi, '') : '';
              const name = `documento-${addedCount + 1}${ext}`;
              zip.file(name, buf);
              addedCount++;
            }
          } catch (e) {
            console.error('Error decoding base64 doc:', e);
          }
        } else {
          const safeDocName = path.basename(doc.fileName);
          if (safeDocName !== doc.fileName || !resolverRutaSeguraDeFiesta(safeDocName, docsAllowedDirs)) {
            console.warn(`[Path Guard] Blocked unsafe document fileName: ${doc.fileName}`);
            continue;
          }
          try {
            const fileContent = await leerArchivoSeguroDeFiesta(safeDocName, docsAllowedDirs);
            zip.file(safeDocName, fileContent);
            addedCount++;
          } catch (error) {
            const fromStorage = await downloadFromStorage(`documentos-varios-fiesta/${safeFiestaId}/${safeDocName}`);
            if (fromStorage) {
              zip.file(safeDocName, fromStorage);
              addedCount++;
            } else {
              console.warn(`File not found, skipping: ${safeDocName}`, error);
            }
          }
        }
      }

      if (addedCount === 0) {
        return NextResponse.json({ error: 'No hay documentos para bajar' }, { status: 404 });
      }

      const zipContent = await zip.generateAsync({ type: 'nodebuffer' });
      const zipFilename = `documentos-${safeFiestaId.substring(0, 6)}.zip`;

      const headers = new Headers();
      headers.set('Content-Type', 'application/zip');
      headers.set('Content-Disposition', `attachment; filename="${zipFilename}"`);
      return new NextResponse(zipContent as BodyInit, { status: 200, headers });

    } catch (error: any) {
      console.error('Error creating all-documents zip:', error);
      return NextResponse.json({ error: 'Failed to create zip file.', details: error.message }, { status: 500 });
    }
  }

  // Sanitize to prevent directory traversal
  const safeFilename = path.basename(filename);
  if (safeFilename !== filename || !resolverRutaSeguraDeFiesta(safeFilename, docsAllowedDirs)) {
    return new NextResponse('Invalid path segments', { status: 400 });
  }

  if (!hasAdminAccess) {
    const fiesta = fiestaRaw;
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

  const expectedDocsDir = path.resolve(DOCS_DIR, safeFiestaId);
  const resolvedCandidate = path.resolve(expectedDocsDir, safeFilename);
  if (!resolvedCandidate.startsWith(expectedDocsDir + path.sep)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    let fileBuffer: Buffer;
    try {
      fileBuffer = await leerArchivoSeguroDeFiesta(safeFilename, docsAllowedDirs);
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
