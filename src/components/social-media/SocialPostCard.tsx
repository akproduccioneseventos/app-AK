
'use client';

import type { SocialPost } from '@/types/social-media';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NewPostDialog } from './NewPostDialog';
import { Trash2, Edit, Loader2, Link as LinkIcon, Facebook, Instagram, Music } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";


interface SocialPostCardProps {
  post: SocialPost;
  onDelete: (postId: string) => Promise<void>;
  isDeleting: boolean;
  onUpdate: () => void;
}

const formatDateTime = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  } catch (e) {
    return "Fecha inválida";
  }
};

const platformIcons = {
    Facebook: <Facebook className="w-5 h-5 text-blue-600" />,
    Instagram: <Instagram className="w-5 h-5 text-pink-500" />,
    TikTok: <Music className="w-5 h-5 text-black dark:text-white" />,
};

export function SocialPostCard({ post, onDelete, isDeleting, onUpdate }: SocialPostCardProps) {

  const handleDelete = () => {
    onDelete(post.id);
  };

  return (
    <Card className="flex flex-col h-full shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
                {platformIcons[post.platform]}
                <CardTitle className="text-lg font-headline">{post.platform}</CardTitle>
            </div>
            <Badge variant={post.status === 'Publicado' ? 'default' : 'secondary'}>{post.status}</Badge>
        </div>
        <CardDescription>
          Para: {post.isGeneralCampaign ? 'Campaña General' : post.eventName || 'Evento Específico'}
        </CardDescription>
         <p className="text-xs text-muted-foreground">Publicar: {formatDateTime(post.publishDate)}</p>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        {post.mediaUrl && (
          <div className="relative aspect-video rounded-md overflow-hidden bg-muted">
             <NextImage src={post.mediaUrl} alt="Vista previa del post" layout="fill" objectFit="cover" />
          </div>
        )}
        <p className="text-sm text-foreground line-clamp-4">{post.text}</p>
        {post.link && <a href={post.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline break-all flex items-center gap-1"><LinkIcon className="w-3 h-3"/>{post.link}</a>}
      </CardContent>
      <CardFooter className="flex justify-end gap-2 border-t pt-3">
        <NewPostDialog onPostCreated={onUpdate} postToEdit={post}>
             <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="w-4 h-4"/></Button>
        </NewPostDialog>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" disabled={isDeleting}>
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4" />}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle><AlertDialogDescription>Se eliminará la publicación para {post.platform}. Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
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
