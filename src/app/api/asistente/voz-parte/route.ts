import { NextRequest, NextResponse } from 'next/server';
import { hasAppSession } from '@/lib/auth/require-session';
import { getParteDeLaManana } from '@/lib/automatico/parte-manana';
import { generarAudioWavSintetico, sintetizarVozReal } from '@/lib/asistente/voz-parte';
import { getAsistenteSettings } from '@/lib/asistente/avisar-al-duenio';

export async function GET(request: NextRequest) {
  try {
    if (!(await hasAppSession())) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const textoParam = searchParams.get('texto');
    const vozParam = searchParams.get('voz');

    const settings = await getAsistenteSettings();
    const vozSeleccionada = vozParam || settings.vozSeleccionada || 'es-ES-Journey-F';

    let textoHablado = textoParam;
    if (!textoHablado) {
      const parte = await getParteDeLaManana();
      textoHablado = parte.textoHablado;
    }

    // Sintetizar con la voz neuronal más realista disponible
    const audioBuffer = await sintetizarVozReal(textoHablado, {
      voz: vozSeleccionada,
    });

    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
      },
    });
  } catch (error: any) {
    const fallbackBuffer = generarAudioWavSintetico(2);
    return new NextResponse(new Uint8Array(fallbackBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': fallbackBuffer.length.toString(),
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await hasAppSession())) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const textoHablado = body.texto || 'Hola Alexander, asistente listo.';
    const settings = await getAsistenteSettings();
    const vozSeleccionada = body.voz || settings.vozSeleccionada || 'es-ES-Journey-F';

    const audioBuffer = await sintetizarVozReal(textoHablado, {
      voz: vozSeleccionada,
      apiKey: body.apiKey,
    });

    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': audioBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error sintetizando voz.' },
      { status: 500 }
    );
  }
}
