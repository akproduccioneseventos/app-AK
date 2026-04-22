import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { getLifeStoryVideoPhotos } from '@/app/actions/fiesta/video-vida.actions';

export async function GET(
  request: Request,
  { params }: { params: { fiestaId: string } }
) {
  const { fiestaId } = params;

  if (!fiestaId) {
    return NextResponse.json({ error: 'Fiesta ID is required.' }, { status: 400 });
  }

  try {
    const photoUrls = await getLifeStoryVideoPhotos(fiestaId);

    if (photoUrls.length === 0) {
      return NextResponse.json({ error: 'No photos found for this event.' }, { status: 404 });
    }

    const zip = new JSZip();

    for (const url of photoUrls) {
      let fileContent: Buffer;
      let name: string;
      if (url.startsWith('https://') || url.startsWith('http://')) {
        const res = await fetch(url);
        if (!res.ok) continue;
        fileContent = Buffer.from(await res.arrayBuffer());
        name = url.split('/').pop()?.split('?')[0] ?? `photo_${Date.now()}.jpg`;
      } else {
        // Legacy local path
        const fs = await import('fs/promises');
        const path = await import('path');
        fileContent = await fs.readFile(url);
        name = path.basename(url);
      }
      zip.file(name, fileContent);
    }

    const zipContent = await zip.generateAsync({ type: 'nodebuffer' });
    const zipFilename = `video-de-vida-${fiestaId}.zip`;

    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', `attachment; filename="${zipFilename}"`);

    return new NextResponse(zipContent as BodyInit, { status: 200, headers });

  } catch (error: any) {
    console.error(`Error creating zip for fiesta ${fiestaId}:`, error);
    return NextResponse.json({ error: 'Failed to create zip file.', details: error.message }, { status: 500 });
  }
}
