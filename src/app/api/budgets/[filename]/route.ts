
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
// We don't need getBudgetFilePath here as we construct path directly

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
  
  const budgetsDirectoryPath = path.join(process.cwd(), 'src', 'data', 'budgets');
  const filePath = path.join(budgetsDirectoryPath, safeFilename);

  try {
    await fs.access(filePath); // Check if file exists
    const fileBuffer = await fs.readFile(filePath);

    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf'); // Assuming budgets are PDFs
    headers.set('Content-Disposition', `inline; filename="${safeFilename}"`);

    return new NextResponse(fileBuffer, { status: 200, headers });
  } catch (error) {
    console.error(`Error serving budget ${safeFilename}:`, error);
    // @ts-ignore
    if (error.code === 'ENOENT') {
      return new NextResponse('Budget file not found', { status: 404 });
    }
    return new NextResponse('Error serving file', { status: 500 });
  }
}
