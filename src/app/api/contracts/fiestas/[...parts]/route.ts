

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

  const contractsDirectory = path.resolve(process.cwd(), 'src', 'data', 'contracts', 'fiestas');
  const filePath = path.join(contractsDirectory, safeFiestaId, safeFilename);

  // Final check to ensure the resolved path is within the intended directory
  if (!filePath.startsWith(contractsDirectory)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    await fs.access(filePath); // Check if file exists
    const fileBuffer = await fs.readFile(filePath);

    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf'); // Assuming contracts are PDFs
    headers.set('Content-Disposition', `inline; filename="${safeFilename}"`);

    return new NextResponse(fileBuffer, { status: 200, headers });
  } catch (error) {
    console.error(`Error serving fiesta contract ${safeFilename}:`, error);
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: unknown }).code === 'ENOENT') {
      return new NextResponse('Contract file not found', { status: 404 });
    }
    return new NextResponse('Error serving file', { status: 500 });
  }
}
