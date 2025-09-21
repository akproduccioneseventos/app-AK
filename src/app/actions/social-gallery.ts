
'use server';

import type { SocialGalleryPost, SocialComment } from '@/types/social-gallery';
import { readData, writeData } from '@/lib/data-service';
import fs from 'fs/promises';
import path from 'path';

const SOCIAL_GALLERY_DIR_NAME = 'social-gallery';
const SOCIAL_GALLERY_DIR = path.join(process.cwd(), 'src', 'data', SOCIAL_GALLERY_DIR_NAME);
const METADATA_FILE = path.join(SOCIAL_GALLERY_DIR_NAME, 'metadata.json');
const MAX_PHOTOS_PER_EVENT = 200;

async function ensureDataDirectoryExists() {
  try { await fs.access(SOCIAL_GALLERY_DIR); } catch { await fs.mkdir(SOCIAL_GALLERY_DIR, { recursive: true }); }
}

async function getMetadata(): Promise<SocialGalleryPost[]> {
  return readData<SocialGalleryPost[]>(METADATA_FILE, []);
}

async function writeMetadata(data: SocialGalleryPost[]): Promise<void> {
  await writeData(METADATA_FILE, data, (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function getSocialPosts(fiestaId: string): Promise<SocialGalleryPost[]> {
  const allPosts = await getMetadata();
  return allPosts.filter(post => post.fiestaId === fiestaId);
}

export async function uploadSocialPost(formData: FormData): Promise<{ success: boolean; post?: SocialGalleryPost; error?: string }> {
  const fiestaId = formData.get('fiestaId') as string;
  const file = formData.get('file') as File;
  const authorName = formData.get('authorName') as string || 'Anónimo';

  if (!fiestaId || !file) return { success: false, error: "Faltan datos (ID de fiesta o archivo)." };
  
  const allPosts = await getMetadata();
  if (allPosts.filter(p => p.fiestaId === fiestaId).length >= MAX_PHOTOS_PER_EVENT) {
    return { success: false, error: `Se ha alcanzado el límite de ${MAX_PHOTOS_PER_EVENT} fotos para este evento.` };
  }

  const eventPhotoDirPath = path.join(SOCIAL_GALLERY_DIR, fiestaId);
  try {
    await ensureDataDirectoryExists();
    await fs.mkdir(eventPhotoDirPath, { recursive: true });

    const fileExtension = path.extname(file.name);
    const postId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newFilename = `${postId}${fileExtension}`;
    const filePath = path.join(eventPhotoDirPath, newFilename);

    const bytes = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(bytes));

    const newPost: SocialGalleryPost = {
      id: postId,
      fiestaId: fiestaId,
      imageUrl: `/api/social-gallery/${fiestaId}/${newFilename}`,
      timestamp: new Date().toISOString(),
      authorName: authorName,
      likes: 0,
      comments: [],
    };
    allPosts.push(newPost);
    await writeMetadata(allPosts);
    
    return { success: true, post: newPost };
  } catch (error: any) {
    return { success: false, error: "Error al guardar la imagen: " + error.message };
  }
}

export async function addLikeToPost(postId: string): Promise<{ success: boolean; error?: string }> {
    const allPosts = await getMetadata();
    const postIndex = allPosts.findIndex(p => p.id === postId);
    if (postIndex === -1) return { success: false, error: "Publicación no encontrada." };
    
    allPosts[postIndex].likes = (allPosts[postIndex].likes || 0) + 1;
    await writeMetadata(allPosts);
    return { success: true };
}

export async function addCommentToPost(postId: string, commentText: string, authorName: string): Promise<{ success: boolean; error?: string }> {
    const allPosts = await getMetadata();
    const postIndex = allPosts.findIndex(p => p.id === postId);
    if (postIndex === -1) return { success: false, error: "Publicación no encontrada." };

    const newComment: SocialComment = {
        id: `comment_${Date.now()}`,
        authorName: authorName || 'Anónimo',
        text: commentText,
        timestamp: new Date().toISOString(),
    };
    if (!allPosts[postIndex].comments) {
        allPosts[postIndex].comments = [];
    }
    allPosts[postIndex].comments.push(newComment);
    await writeMetadata(allPosts);
    return { success: true };
}

export async function deleteSocialPost(postId: string): Promise<{ success: boolean; error?: string }> {
  const allPosts = await getMetadata();
  const postToDelete = allPosts.find(p => p.id === postId);
  
  if (!postToDelete) return { success: false, error: "Publicación no encontrada para eliminar." };
  
  try {
    const filename = path.basename(postToDelete.imageUrl);
    const filePath = path.join(SOCIAL_GALLERY_DIR, postToDelete.fiestaId, filename);
    await fs.unlink(filePath);
  } catch (fileError: any) {
    console.warn(`Could not delete file for post ${postId}: ${fileError.message}`);
  }
  
  await writeMetadata(allPosts.filter(p => p.id !== postId));
  return { success: true };
}

export async function clearGallery(fiestaId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const eventPhotoDirPath = path.join(SOCIAL_GALLERY_DIR, fiestaId);
        await fs.rm(eventPhotoDirPath, { recursive: true, force: true });
    } catch (dirError: any) {
        console.warn(`Could not delete directory for fiesta ${fiestaId}: ${dirError.message}`);
    }

    const allPosts = await getMetadata();
    await writeMetadata(allPosts.filter(p => p.fiestaId !== fiestaId));
    return { success: true };
}

export async function getPhotoFilePathsForZip(fiestaId: string): Promise<{ path: string, name: string }[]> {
    const eventPhotoDirPath = path.join(SOCIAL_GALLERY_DIR, fiestaId);
    try {
        await fs.access(eventPhotoDirPath);
        const filenames = await fs.readdir(eventPhotoDirPath);
        return filenames.map(name => ({
            path: path.join(eventPhotoDirPath, name),
            name: name
        }));
    } catch {
        return [];
    }
}
