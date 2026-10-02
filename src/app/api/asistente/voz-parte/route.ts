import { NextRequest, NextResponse } from 'next/server';
import { hasAppSession } from '@/lib/auth/require-session';
import { sintetizarVozGemini } from '@/lib/asistente/voz-parte';

export async function GET(request: NextRequest) {
  try {
    if (!(await hasAppSession())) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const texto = searchParams.get('texto');
    const voz = searchParams.get('voz') || 'es-ES-Journey-F';

    if (!texto) {
      return NextResponse.json({ error: 'Falta el texto a sintetizar' }, { status: 400 });
    }

    const audioBuffer = await sintetizarVozGemini(texto, { voz });

    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
      },
    });
  } catch (error: any) {
    // Si no hay clave de Gemini o falla la llamada, devolvemos error 503 explícito
    // para que el reproductor caiga limpiamente a speechSynthesis del navegador.
    // NUNCA devolvemos un pitido ni tonos haciéndose pasar por voz (Orden 110).
    return NextResponse.json(
      { error: error?.message || 'Voz de Gemini TTS no disponible en este momento.' },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await hasAppSession())) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const texto = body.texto;
    const voz = body.voz || 'es-ES-Journey-F';

    if (!texto) {
      return NextResponse.json({ error: 'Falta el texto a sintetizar' }, { status: 400 });
    }

    const audioBuffer = await sintetizarVozGemini(texto, { voz, apiKey: body.apiKey });

    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': audioBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Voz de Gemini TTS no disponible.' },
      { status: 503 }
    );
  }
}
