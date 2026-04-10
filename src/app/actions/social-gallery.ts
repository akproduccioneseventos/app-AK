
'use server';

import type { SocialGalleryPost, SocialComment, ChatMessage } from '@/types/social-gallery';
import { readData, writeData } from '@/lib/data-service';
import { uploadToStorage, deleteFromStorage } from '@/lib/firebase/storage';
import path from 'path';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';

const SOCIAL_GALLERY_DIR_NAME = 'social-gallery';
const SOCIAL_CHAT_DIR_NAME = 'social-chat';
const METADATA_FILE = path.join(SOCIAL_GALLERY_DIR_NAME, 'metadata.json');
const MAX_PHOTOS_PER_EVENT = 200;

// Photo Gallery Functions
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
  const authorName = (formData.get('authorName') as string) || 'Anónimo';
  const dedication = (formData.get('dedication') as string) || undefined;
  const momentTag = (formData.get('momentTag') as string) || undefined;

  if (!fiestaId || !file) return { success: false, error: "Faltan datos (ID de fiesta o archivo)." };
  
  const allPosts = await getMetadata();
  const fiestaData = await getFiestaById(fiestaId);
  const limit = fiestaData?.socialGallerySettings?.maxPhotos ?? MAX_PHOTOS_PER_EVENT;
  if (allPosts.filter(p => p.fiestaId === fiestaId).length >= limit) {
    return { success: false, error: `Se ha alcanzado el límite de ${limit} fotos para este evento.` };
  }

  try {
    const fileExtension = path.extname(file.name);
    const postId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newFilename = `${postId}${fileExtension}`;
    const storagePath = `social-gallery/${fiestaId}/${newFilename}`;

    const bytes = await file.arrayBuffer();
    const imageUrl = await uploadToStorage(Buffer.from(bytes), storagePath, file.type || 'image/jpeg', true);

    const newPost: SocialGalleryPost = {
      id: postId,
      fiestaId: fiestaId,
      imageUrl,
      timestamp: new Date().toISOString(),
      authorName: authorName,
      likes: 0,
      comments: [],
      ...(dedication ? { dedication } : {}),
      ...(momentTag ? { momentTag } : {}),
    };
    allPosts.push(newPost);
    await writeMetadata(allPosts);
    
    return { success: true, post: newPost };
  } catch (error: any) {
    return { success: false, error: "Error al guardar la imagen: " + error.message };
  }
}

export async function addLikeToPost(postId: string): Promise<{ success: boolean; post?: SocialGalleryPost; error?: string }> {
    const allPosts = await getMetadata();
    const postIndex = allPosts.findIndex(p => p.id === postId);
    if (postIndex === -1) return { success: false, error: "Publicación no encontrada." };
    
    allPosts[postIndex].likes = (allPosts[postIndex].likes || 0) + 1;
    await writeMetadata(allPosts);
    return { success: true, post: allPosts[postIndex] };
}

export async function addCommentToPost(postId: string, text: string, authorName: string = 'Anónimo'): Promise<{ success: boolean; comment?: SocialComment, error?: string }> {
    const allPosts = await getMetadata();
    const postIndex = allPosts.findIndex(p => p.id === postId);
    if (postIndex === -1) return { success: false, error: "Publicación no encontrada." };

    const newComment: SocialComment = {
        id: `comment_${Date.now()}`,
        authorName: authorName,
        text: text,
        timestamp: new Date().toISOString(),
    };
    if (!allPosts[postIndex].comments) {
        allPosts[postIndex].comments = [];
    }
    allPosts[postIndex].comments.push(newComment);
    await writeMetadata(allPosts);
    return { success: true, comment: newComment };
}

export async function deleteSocialPost(postId: string): Promise<{ success: boolean; error?: string }> {
  const allPosts = await getMetadata();
  const postToDelete = allPosts.find(p => p.id === postId);
  
  if (!postToDelete) return { success: false, error: "Publicación no encontrada para eliminar." };
  
  try {
    await deleteFromStorage(postToDelete.imageUrl);
  } catch (fileError: any) {
    console.warn(`Could not delete file for post ${postId}: ${fileError.message}`);
  }
  
  await writeMetadata(allPosts.filter(p => p.id !== postId));
  return { success: true };
}

export async function clearGallery(fiestaId: string): Promise<{ success: boolean; error?: string }> {
    const allPosts = await getMetadata();
    const fiestaPostsToDelete = allPosts.filter(p => p.fiestaId === fiestaId);

    // Delete each photo from Firebase Storage
    await Promise.allSettled(
      fiestaPostsToDelete.map(post => deleteFromStorage(post.imageUrl))
    );

    await writeMetadata(allPosts.filter(p => p.fiestaId !== fiestaId));
    
    return { success: true };
}

export async function getPhotoFilePathsForZip(fiestaId: string): Promise<{ path: string, name: string }[]> {
    // Photos are now in Firebase Storage — return their public URLs as paths
    const allPosts = await getMetadata();
    const fiestasPosts = allPosts.filter(p => p.fiestaId === fiestaId);
    return fiestasPosts.map(post => {
        let name: string;
        try {
            name = new URL(post.imageUrl).pathname.split('/').filter(Boolean).pop() || post.id;
        } catch {
            name = post.id;
        }
        return { path: post.imageUrl, name };
    });
}

// --- Live Chat Functions ---

const getChatFilePath = (fiestaId: string) => path.join(SOCIAL_CHAT_DIR_NAME, `${fiestaId}.json`);

export async function getChatMessages(fiestaId: string): Promise<ChatMessage[]> {
    return readData<ChatMessage[]>(getChatFilePath(fiestaId), []);
}

export async function addChatMessage(fiestaId: string, text: string, authorName: string = 'Anónimo'): Promise<{ success: boolean; message?: ChatMessage; error?: string }> {
    if (!fiestaId || !text.trim()) {
        return { success: false, error: "Datos del mensaje incompletos." };
    }
    try {
        const messages = await getChatMessages(fiestaId);
        const newMessage: ChatMessage = {
            id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            fiestaId,
            authorName,
            text,
            timestamp: new Date().toISOString(),
        };
        messages.push(newMessage);
        await writeData(getChatFilePath(fiestaId), messages);
        return { success: true, message: newMessage };
    } catch (error: any) {
        return { success: false, error: "No se pudo guardar el mensaje en el chat." };
    }
}
