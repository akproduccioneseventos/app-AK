
'use server';

import type { SocialPost } from '@/types/social-media';
import fs from 'fs/promises';
import path from 'path';

const SOCIAL_MEDIA_DATA_DIR = path.join(process.cwd(), 'src', 'data');
const POSTS_FILE_PATH = path.join(SOCIAL_MEDIA_DATA_DIR, 'social-posts.json');
const ASSETS_DIR_NAME = 'social-media-assets';
const assetsDirectoryPath = path.join(SOCIAL_MEDIA_DATA_DIR, ASSETS_DIR_NAME);

async function ensureDataDirectoriesExist() {
  try { await fs.access(SOCIAL_MEDIA_DATA_DIR); } catch { await fs.mkdir(SOCIAL_MEDIA_DATA_DIR, { recursive: true }); }
  try { await fs.access(assetsDirectoryPath); } catch { await fs.mkdir(assetsDirectoryPath, { recursive: true }); }
}

async function readPostsFile(): Promise<SocialPost[]> {
  try {
    await ensureDataDirectoriesExist();
    await fs.access(POSTS_FILE_PATH);
    const fileContent = await fs.readFile(POSTS_FILE_PATH, 'utf-8');
    return fileContent.trim() === '' ? [] : JSON.parse(fileContent);
  } catch (error) {
    await writePostsFile([]); // Create file if it doesn't exist
    return [];
  }
}

async function writePostsFile(data: SocialPost[]): Promise<void> {
  await ensureDataDirectoriesExist();
  const sortedData = data.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
  await fs.writeFile(POSTS_FILE_PATH, JSON.stringify(sortedData, null, 2), 'utf-8');
}

export async function getSocialPosts(): Promise<SocialPost[]> {
  return readPostsFile();
}

export async function saveSocialPost(
  formData: FormData
): Promise<{ success: boolean; post?: SocialPost; error?: string }> {
  let posts = await readPostsFile();
  const postId = (formData.get('id') as string) || `post_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const mediaFile = formData.get('mediaFile') as File | null;
  const autoPublish = formData.get('autoPublish') === 'true';

  let mediaUrl: string | undefined = formData.get('existingMediaUrl') as string || undefined;
  let mediaType: 'image' | 'video' | undefined = formData.get('existingMediaType') as 'image' | 'video' || undefined;

  if (mediaFile && mediaFile.size > 0) {
    try {
      const fileExtension = path.extname(mediaFile.name);
      const newFilename = `${postId}${fileExtension}`;
      const filePath = path.join(assetsDirectoryPath, newFilename);
      const bytes = await mediaFile.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(bytes));
      
      mediaUrl = `/api/social-media-assets/${newFilename}`;
      mediaType = mediaFile.type.startsWith('image/') ? 'image' : 'video';

    } catch (fileError: any) {
      console.error("Error saving media file:", fileError);
      return { success: false, error: `Error al guardar el archivo multimedia: ${fileError.message}` };
    }
  }

  const postData: Omit<SocialPost, 'id' | 'createdAt' | 'updatedAt'> = {
    platform: formData.get('platform') as SocialPost['platform'],
    isGeneralCampaign: formData.get('isGeneralCampaign') === 'true',
    eventId: formData.get('eventId') as string || undefined,
    eventName: formData.get('eventName') as string || undefined,
    publishDate: formData.get('publishDate') as string,
    text: formData.get('text') as string,
    link: formData.get('link') as string || undefined,
    status: autoPublish ? 'Publicado' : (formData.get('status') as PostStatus),
    promotionCost: Number(formData.get('promotionCost')) || undefined,
    performance: {
        likes: Number(formData.get('performance.likes')) || undefined,
        views: Number(formData.get('performance.views')) || undefined,
        interactions: Number(formData.get('performance.interactions')) || undefined,
    },
    mediaUrl,
    mediaType,
  };

  const existingIndex = posts.findIndex(p => p.id === postId);
  let finalPost: SocialPost;

  if (existingIndex > -1) {
    // Update
    finalPost = { ...posts[existingIndex], ...postData, updatedAt: new Date().toISOString() };
    posts[existingIndex] = finalPost;
  } else {
    // Create
    finalPost = { ...postData, id: postId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    posts.push(finalPost);
  }
  
  if (autoPublish) {
    console.log(`[SIMULATION] Attempting to auto-publish post ${postId} to ${finalPost.platform}.`);
    // Simulate API call delay and potential failure
    await new Promise(resolve => setTimeout(resolve, 1500));
    const isSuccess = Math.random() > 0.1; // 90% success rate
    if (!isSuccess) {
      return { success: false, error: `Error simulado al publicar en ${finalPost.platform}.` };
    }
  }

  await writePostsFile(posts);
  return { success: true, post: finalPost };
}


export async function deleteSocialPost(postId: string): Promise<{ success: boolean, error?: string }> {
  let posts = await readPostsFile();
  const postToDelete = posts.find(p => p.id === postId);

  if (!postToDelete) {
    return { success: false, error: "Publicación no encontrada." };
  }

  // Delete associated media file if it exists
  if (postToDelete.mediaUrl) {
    try {
      const filename = path.basename(postToDelete.mediaUrl);
      const filePath = path.join(assetsDirectoryPath, filename);
      await fs.unlink(filePath);
    } catch (fileError: any) {
      console.warn(`Could not delete media file for post ${postId}: ${fileError.message}`);
    }
  }
  
  const updatedPosts = posts.filter(p => p.id !== postId);
  await writePostsFile(updatedPosts);
  return { success: true };
}
