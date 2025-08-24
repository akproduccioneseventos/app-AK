
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { parts: string[] } }
) {
  const [fiestaId, filename] = params.parts;

  if (!fiestaId || !filename) {
    return new NextResponse('Fiesta ID and Filename are required', { status: 400 });
  }

  // Sanitize to prevent directory traversal
  const safeFiestaId = path.basename(fiestaId);
  const safeFilename = path.basename(filename);
  if (safeFiestaId !== fiestaId || safeFilename !== filename) {
    return new NextResponse('Invalid path segments', { status: 400 });
  }

  const docsDirectory = path.resolve(process.cwd(), 'src', 'data', 'documentos-varios-fiesta');
  const filePath = path.join(docsDirectory, safeFiestaId, safeFilename);

  // Final check to ensure the resolved path is within the intended directory
  if (!filePath.startsWith(docsDirectory)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    await fs.access(filePath); // Check if file exists
    const fileBuffer = await fs.readFile(filePath);

    const headers = new Headers();
    // For simplicity, we'll serve everything as a generic stream, letting the browser decide.
    // A more robust solution might inspect the file extension to set the correct MIME type.
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
