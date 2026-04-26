
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { fiestaId: string; filename: string } }
) {
  const { fiestaId, filename } = params;

  if (!fiestaId || !filename) {
    return new NextResponse('Fiesta ID and Filename are required', { status: 400 });
  }

  // Sanitize to prevent directory traversal
  const safeFiestaId = path.basename(fiestaId);
  const safeFilename = path.basename(filename);
  if (safeFiestaId !== fiestaId || safeFilename !== filename) {
    return new NextResponse('Invalid path segments', { status: 400 });
  }

  const assetsDirectory = path.resolve(process.cwd(), 'src', 'data', 'video-vida-photos');
  const filePath = path.join(assetsDirectory, safeFiestaId, safeFilename);

  if (!filePath.startsWith(assetsDirectory)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    await fs.access(filePath);
    const fileBuffer = await fs.readFile(filePath);

    let contentType = 'application/octet-stream';
    const ext = path.extname(safeFilename).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.webp') contentType = 'image/webp';

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `inline; filename="${safeFilename}"`);

    return new NextResponse(fileBuffer, { status: 200, headers });
  } catch (error) {
    if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
      return new NextResponse('File not found', { status: 404 });
    }
    return new NextResponse('Error serving file', { status: 500 });
  }
}
