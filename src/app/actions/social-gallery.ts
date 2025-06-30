
'use server';

import type { SocialGalleryPost, SocialComment } from '@/types/social-gallery';
import fs from 'fs/promises';
import path from 'path';

const SOCIAL_GALLERY_DIR = path.join(process.cwd(), 'src', 'data', 'social-gallery');
const SOCIAL_GALLERY_METADATA_FILE = path.join(SOCIAL_GALLERY_DIR, 'metadata.json');

async function ensureDataDirectoryExists() {
  try {
    await fs.access(SOCIAL_GALLERY_DIR);
  } catch {
    await fs.mkdir(SOCIAL_GALLERY_DIR, { recursive: true });
  }
}

async function readMetadataFile(): Promise<SocialGalleryPost[]> {
  try {
    await ensureDataDirectoryExists();
    await fs.access(SOCIAL_GALLERY_METADATA_FILE);
    const fileContent = await fs.readFile(SOCIAL_GALLERY_METADATA_FILE, 'utf-8');
    return fileContent.trim() === '' ? [] : JSON.parse(fileContent);
  } catch (error) {
    await writeMetadataFile([]); // Create file if it doesn't exist
    return [];
  }
}

async function writeMetadataFile(data: SocialGalleryPost[]): Promise<void> {
  await ensureDataDirectoryExists();
  const sortedData = data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  await fs.writeFile(SOCIAL_GALLERY_METADATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}


export async function getSocialPosts(fiestaId: string): Promise<SocialGalleryPost[]> {
  const allPosts = await readMetadataFile();
  return allPosts.filter(post => post.fiestaId === fiestaId);
}

export async function uploadSocialPost(formData: FormData): Promise<{ success: boolean; post?: SocialGalleryPost; error?: string }> {
  const fiestaId = formData.get('fiestaId') as string;
  const file = formData.get('file') as File;
  const authorName = formData.get('authorName') as string || 'Anónimo';

  if (!fiestaId || !file) {
    return { success: false, error: "Faltan datos (ID de fiesta o archivo)." };
  }

  const eventPhotoDirPath = path.join(SOCIAL_GALLERY_DIR, fiestaId);
  try {
    await fs.mkdir(eventPhotoDirPath, { recursive: true });

    const fileExtension = path.extname(file.name);
    const postId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newFilename = `${postId}${fileExtension}`;
    const filePath = path.join(eventPhotoDirPath, newFilename);

    const bytes = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(bytes));

    const allPosts = await readMetadataFile();
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
    await writeMetadataFile(allPosts);
    
    return { success: true, post: newPost };
  } catch (error: any) {
    return { success: false, error: "Error al guardar la imagen: " + error.message };
  }
}

export async function addLikeToPost(postId: string): Promise<{ success: boolean; error?: string }> {
    const allPosts = await readMetadataFile();
    const postIndex = allPosts.findIndex(p => p.id === postId);
    if (postIndex === -1) {
        return { success: false, error: "Publicación no encontrada." };
    }
    allPosts[postIndex].likes = (allPosts[postIndex].likes || 0) + 1;
    await writeMetadataFile(allPosts);
    return { success: true };
}

export async function addCommentToPost(postId: string, commentText: string, authorName: string): Promise<{ success: boolean; error?: string }> {
    const allPosts = await readMetadataFile();
    const postIndex = allPosts.findIndex(p => p.id === postId);
    if (postIndex === -1) {
        return { success: false, error: "Publicación no encontrada." };
    }
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
    await writeMetadataFile(allPosts);
    return { success: true };
}

export async function deleteSocialPost(postId: string): Promise<{ success: boolean; error?: string }> {
  const allPosts = await readMetadataFile();
  const postToDelete = allPosts.find(p => p.id === postId);
  
  if (!postToDelete) {
    return { success: false, error: "Publicación no encontrada para eliminar." };
  }
  
  const remainingPosts = allPosts.filter(p => p.id !== postId);
  
  // Delete the physical file
  try {
    const filename = path.basename(postToDelete.imageUrl);
    const filePath = path.join(SOCIAL_GALLERY_DIR, postToDelete.fiestaId, filename);
    await fs.unlink(filePath);
  } catch (fileError: any) {
    // Log the error but continue to remove metadata, as the file might already be gone.
    console.warn(`Could not delete file for post ${postId}: ${fileError.message}`);
  }
  
  await writeMetadataFile(remainingPosts);
  return { success: true };
}

export async function clearGallery(fiestaId: string): Promise<{ success: boolean; error?: string }> {
    const allPosts = await readMetadataFile();
    const postsOfFiesta = allPosts.filter(p => p.fiestaId === fiestaId);
    
    // Delete physical directory
    try {
        const eventPhotoDirPath = path.join(SOCIAL_GALLERY_DIR, fiestaId);
        await fs.rm(eventPhotoDirPath, { recursive: true, force: true });
    } catch (dirError: any) {
        console.warn(`Could not delete directory for fiesta ${fiestaId}: ${dirError.message}`);
    }

    // Remove metadata
    const remainingPosts = allPosts.filter(p => p.fiestaId !== fiestaId);
    await writeMetadataFile(remainingPosts);
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
