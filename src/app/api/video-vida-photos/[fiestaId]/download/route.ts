
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';

const DATA_DIR = path.join(process.cwd(), 'src', 'data', 'video-vida-photos');

export async function GET(
  request: Request,
  { params }: { params: { fiestaId: string } }
) {
  const { fiestaId } = params;

  if (!fiestaId) {
    return NextResponse.json({ error: 'Fiesta ID is required.' }, { status: 400 });
  }

  try {
    const eventPhotoDir = path.join(DATA_DIR, fiestaId);
    await fs.access(eventPhotoDir);
    const filenames = await fs.readdir(eventPhotoDir);
    
    if (filenames.length === 0) {
      return NextResponse.json({ error: 'No photos found for this event.' }, { status: 404 });
    }

    const zip = new JSZip();
    
    for (const name of filenames.sort((a,b) => a.localeCompare(b, undefined, { numeric: true }))) {
      const filePath = path.join(eventPhotoDir, name);
      const fileContent = await fs.readFile(filePath);
      zip.file(name, fileContent);
    }
    
    const zipContent = await zip.generateAsync({ type: 'nodebuffer' });
    const zipFilename = `video-de-vida-${fiestaId}.zip`;

    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', `attachment; filename="${zipFilename}"`);

    return new NextResponse(zipContent, { status: 200, headers });

  } catch (error: any) {
    console.error(`Error creating zip for fiesta ${fiestaId}:`, error);
     if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json({ error: 'No photos found for this event.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to create zip file.', details: error.message }, { status: 500 });
  }
}
