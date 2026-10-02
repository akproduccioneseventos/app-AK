import { NextRequest, NextResponse } from 'next/server';
import { hasAppSession } from '@/lib/auth/require-session';
import { getParteDeLaManana } from '@/lib/automatico/parte-manana';
import { generarAudioWavSintetico } from '@/lib/asistente/voz-parte';

export async function GET(request: NextRequest) {
  try {
    if (!(await hasAppSession())) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const fecha = searchParams.get('fecha');

    // Obtener el parte de la mañana
    const parte = await getParteDeLaManana();

    // Generar o servir audio de voz para el texto hablado
    const duracion = Math.min(10, Math.max(2, (parte.textoHablado.length / 25)));
    const audioBuffer = generarAudioWavSintetico(duracion);

    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error generando voz del parte matutino.' },
      { status: 500 }
    );
  }
}
