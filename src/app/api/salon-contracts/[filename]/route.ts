
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  const filename = params.filename;

  if (!filename) {
    return new NextResponse('Filename is required', { status: 400 });
  }

  // Sanitize filename to prevent directory traversal
  const safeFilename = path.basename(filename);
  if (safeFilename !== filename) {
    return new NextResponse('Invalid filename', { status: 400 });
  }
  
  const salonContractsDirectoryPath = path.resolve(process.cwd(), 'src', 'data', 'salon-contracts');
  const filePath = path.join(salonContractsDirectoryPath, safeFilename);

  // Final check to ensure the resolved path is within the intended directory
  if (!filePath.startsWith(salonContractsDirectoryPath)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    await fs.access(filePath); // Check if file exists
    const fileBuffer = await fs.readFile(filePath);

    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `inline; filename="${safeFilename}"`);

    return new NextResponse(fileBuffer, { status: 200, headers });
  } catch (error) {
    console.error(`Error serving salon contract ${safeFilename}:`, error);
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: unknown }).code === 'ENOENT') {
      return new NextResponse('Salon contract file not found', { status: 404 });
    }
    return new NextResponse('Error serving file', { status: 500 });
  }
}
