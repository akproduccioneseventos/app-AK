
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';
import { getPhotoFilePathsForZip } from '@/app/actions/video-vida';


export async function GET(
  request: Request,
  { params }: { params: { fiestaId: string } }
) {
  const { fiestaId } = params;

  if (!fiestaId) {
    return NextResponse.json({ error: 'Fiesta ID is required.' }, { status: 400 });
  }

  try {
    const photoPaths = await getPhotoFilePathsForZip(fiestaId);
    
    if (photoPaths.length === 0) {
      return NextResponse.json({ error: 'No photos found for this event.' }, { status: 404 });
    }

    const zip = new JSZip();
    
    for (const photo of photoPaths) {
      const fileContent = await fs.readFile(photo.path);
      zip.file(photo.name, fileContent);
    }
    
    const zipContent = await zip.generateAsync({ type: 'nodebuffer' });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `video-vida-${fiestaId}-${timestamp}.zip`;

    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);

    return new NextResponse(zipContent, { status: 200, headers });

  } catch (error: any) {
    console.error(`Error creating zip for fiesta ${fiestaId}:`, error);
    return NextResponse.json({ error: 'Failed to create zip file.', details: error.message }, { status: 500 });
  }
}

