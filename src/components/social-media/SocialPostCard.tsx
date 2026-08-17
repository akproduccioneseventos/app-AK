'use client';

import type { ReactNode } from 'react';
import type { SocialPlatform, SocialPost } from '@/types/social-media';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NewPostDialog } from './NewPostDialog';
import { Trash2, Edit, Loader2, Link as LinkIcon, Facebook, Instagram, Music, Copy, MessageSquare, Youtube, AtSign, ArchiveRestore } from 'lucide-react';
import NextImage from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SocialPostCardProps {
  post: SocialPost;
  onDelete: (postId: string) => Promise<void>;
  isDeleting: boolean;
  onUpdate: () => void;
  onDuplicate: (post: SocialPost) => void;
}

const formatDateTime = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleString('es-UY', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return 'Fecha inválida';
  }
};

const platformIcons: Record<SocialPlatform, ReactNode> = {
  Facebook: <Facebook className="h-5 w-5 text-blue-600" />,
  Instagram: <Instagram className="h-5 w-5 text-pink-500" />,
  Threads: <AtSign className="h-5 w-5 text-slate-800 dark:text-slate-100" />,
  TikTok: <Music className="h-5 w-5 text-black dark:text-white" />,
  YouTube: <Youtube className="h-5 w-5 text-red-600" />,
  X: <span className="inline-flex h-5 w-5 items-center justify-center text-sm font-black">X</span>,
  WhatsApp: <MessageSquare className="h-5 w-5 text-green-500" />,
};

export function SocialPostCard({ post, onDelete, isDeleting, onUpdate, onDuplicate }: SocialPostCardProps) {
  const handleDelete = () => onDelete(post.id);
  const isHistorical = post.status === 'Importado historial';
  const canPreviewMedia = Boolean(post.mediaUrl) && !(isHistorical && /^https?:\/\//i.test(post.mediaUrl || ''));

  return (
    <Card className="flex h-full flex-col shadow-md transition-shadow hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {platformIcons[post.platform]}
            <CardTitle className="text-lg font-headline">{post.platform}</CardTitle>
          </div>
          <Badge
            variant={post.status === 'Publicado' ? 'default' : 'outline'}
            className={isHistorical
              ? 'border-sky-300 bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-200'
              : post.status === 'Importado de IG'
                ? 'border-pink-300 bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300'
                : ''}
          >
            {isHistorical && <ArchiveRestore className="mr-1 h-3 w-3" />}
            {post.status}
          </Badge>
        </div>
        <CardDescription>
          Para: {post.isGeneralCampaign ? 'Campaña General' : post.eventName || 'Evento Específico'}
        </CardDescription>
        <p className="text-xs text-muted-foreground">Publicado: {formatDateTime(post.publishDate)}</p>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        {canPreviewMedia && post.mediaUrl && (
          <div className="relative aspect-video overflow-hidden rounded-md bg-muted">
            <NextImage src={post.mediaUrl} alt="Vista previa del post" fill className="object-cover" />
          </div>
        )}
        {isHistorical && post.archiveMediaPath && !canPreviewMedia && (
          <div className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            Archivo multimedia registrado: {post.archiveMediaPath}
          </div>
        )}
        <p className="line-clamp-4 text-sm text-foreground">{post.text}</p>
        {post.performance && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            {post.performance.likes !== undefined && <span>Me gusta: {post.performance.likes}</span>}
            {post.performance.views !== undefined && <span>Vistas: {post.performance.views}</span>}
            {post.performance.comments !== undefined && <span>Comentarios: {post.performance.comments}</span>}
            {post.performance.shares !== undefined && <span>Compartidos: {post.performance.shares}</span>}
          </div>
        )}
        {post.link && (
          <a href={post.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 break-all text-xs text-primary hover:underline">
            <LinkIcon className="h-3 w-3" />{post.link}
          </a>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-1 border-t pt-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDuplicate(post)} title="Duplicar">
          <Copy className="h-4 w-4" />
        </Button>
        <NewPostDialog onPostCreated={onUpdate} postToEdit={post}>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar"><Edit className="h-4 w-4" /></Button>
        </NewPostDialog>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" disabled={isDeleting} title="Eliminar">
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle>
              <AlertDialogDescription>Se eliminará la publicación guardada para {post.platform}. Esta acción no borra nada de la red social original.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
