
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
  
  const proofsDirectoryPath = path.join(process.cwd(), 'src', 'data', 'payment-proofs');
  const filePath = path.join(proofsDirectoryPath, safeFilename);

  try {
    await fs.access(filePath); // Check if file exists
    const fileBuffer = await fs.readFile(filePath);

    // Determine content type from file extension
    let contentType = 'application/octet-stream';
    const ext = path.extname(safeFilename).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.gif') contentType = 'image/gif';


    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `inline; filename="${safeFilename}"`);

    return new NextResponse(fileBuffer, { status: 200, headers });
  } catch (error) {
    console.error(`Error serving payment proof ${safeFilename}:`, error);
    // @ts-ignore
    if (error.code === 'ENOENT') {
      return new NextResponse('Payment proof not found', { status: 404 });
    }
    return new NextResponse('Error serving file', { status: 500 });
  }
}
