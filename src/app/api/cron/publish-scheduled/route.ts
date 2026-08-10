import { NextResponse } from 'next/server';
import { readData } from '@/lib/data-service';
import type { SocialPost } from '@/types/social-media';
import { publishSocialPostToMeta } from '@/app/actions/meta-publish.actions';

const POSTS_FILE = 'social-posts.json';

export async function GET(request: Request) {
  // Proteger la ruta de Cron con secreto si está configurado
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const posts = await readData<SocialPost[]>(POSTS_FILE, []);
    const now = new Date();

    // Filtrar publicaciones programadas cuyo horario ya haya llegado
    const scheduledPosts = posts.filter(post => {
      if (post.status !== 'Programado') return false;
      const pubDate = new Date(post.publishDate);
      return pubDate <= now;
    });

    let publishedCount = 0;
    let errorCount = 0;
    const results = [];

    for (const post of scheduledPosts) {
      const res = await publishSocialPostToMeta(post.id);
      if (res.success) {
        publishedCount++;
      } else {
        errorCount++;
      }
      results.push({ id: post.id, platform: post.platform, success: res.success, error: res.error });
    }

    return NextResponse.json({
      success: true,
      processed: scheduledPosts.length,
      publishedCount,
      errorCount,
      results,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
