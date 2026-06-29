import { NextResponse } from 'next/server';
import { generateBlogPostAndSocialDraft } from '@/lib/blog-ai-generator';

export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}

async function handleCron(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret') || request.headers.get('Authorization')?.replace('Bearer ', '');
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
      return NextResponse.json(
        { error: 'CRON_SECRET no esta configurado para el cron publico.' },
        { status: 503 }
      );
    }

    if (secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await generateBlogPostAndSocialDraft();

    return NextResponse.json({
      success: true,
      message: 'Post de blog y borrador de redes sociales generados correctamente por IA.',
      ...result,
    });
  } catch (error: any) {
    console.error('[cron-blog] Error running blog generation cron:', error);
    return NextResponse.json(
      { error: error.message || 'Ocurrio un error inesperado al correr el cron de IA.' },
      { status: 500 }
    );
  }
}
