'use server';

import { generateBlogPostAndSocialDraft } from '@/lib/blog-ai-generator';
import { verifySession } from '@/lib/auth/session-token';

export async function generateAIBlogPostFromAdmin(): Promise<{
  success: boolean;
  error?: string;
  blogPost?: {
    slug: string;
    title: string;
    category: string;
  };
  socialPost?: {
    id: string;
    platform: string;
  };
}> {
  const session = await verifySession();
  if (!session.success || session.user?.role !== 'admin') {
    return { success: false, error: 'Solo un administrador puede generar articulos por IA.' };
  }

  try {
    const result = await generateBlogPostAndSocialDraft();
    return { success: true, ...result };
  } catch (error: any) {
    console.error('[blog-actions] Error generating AI blog post:', error);
    return {
      success: false,
      error: error.message || 'No se pudo generar el articulo por IA.',
    };
  }
}
