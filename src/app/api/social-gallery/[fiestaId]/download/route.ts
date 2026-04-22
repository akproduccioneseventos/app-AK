import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { getPhotoFilePathsForZip } from '@/app/actions/social-gallery';

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
      return NextResponse.json({ error: 'No photos found for this event gallery.' }, { status: 404 });
    }

    const zip = new JSZip();
    
    for (const photo of photoPaths) {
      let fileContent: Buffer;
      if (photo.path.startsWith('https://') || photo.path.startsWith('http://')) {
        const res = await fetch(photo.path);
        if (!res.ok) continue;
        fileContent = Buffer.from(await res.arrayBuffer());
      } else {
        const fs = await import('fs/promises');
        fileContent = await fs.readFile(photo.path);
      }
      zip.file(photo.name, fileContent);
    }
    
    const zipContent = await zip.generateAsync({ type: 'nodebuffer' });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `galeria-social-${fiestaId}-${timestamp}.zip`;

    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);

    return new NextResponse(zipContent as BodyInit, { status: 200, headers });

  } catch (error: any) {
    console.error(`Error creating social gallery zip for fiesta ${fiestaId}:`, error);
    return NextResponse.json({ error: 'Failed to create zip file.', details: error.message }, { status: 500 });
  }
}
