
import { useState } from 'react';
import type { SocialPost } from '@/types/social-media';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NewPostDialog } from './NewPostDialog';
import { Trash2, Edit, Loader2, Link as LinkIcon, Facebook, Instagram, Music, Copy, MessageSquare, Send, ExternalLink, AlertCircle } from 'lucide-react';
import NextImage from 'next/image';
import { publishSocialPostToMeta } from '@/app/actions/meta-publish.actions';
import { useToast } from '@/hooks/use-toast';
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
  onDuplicate: (post: SocialPost) => void;
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
    WhatsApp: <MessageSquare className="w-5 h-5 text-green-500" />,
};

export function SocialPostCard({ post, onDelete, isDeleting, onUpdate, onDuplicate }: SocialPostCardProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const { toast } = useToast();

  const handleDelete = () => {
    onDelete(post.id);
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(post.text);
      toast({ title: 'Texto copiado', description: 'El texto del posteo se copió al portapapeles.' });
    } catch {
      toast({ title: 'Error al copiar', variant: 'destructive' });
    }
  };

  const handlePublishNow = async () => {
    setIsPublishing(true);
    try {
      const res = await publishSocialPostToMeta(post.id);
      if (res.success) {
        toast({ title: '¡Publicado con éxito!', description: `La publicación se subió a ${post.platform}.` });
        onUpdate();
      } else {
        toast({
          title: 'No se pudo publicar automáticamente',
          description: res.error || 'Verificá tu conexión a Meta o copiá el texto a mano.',
          variant: 'destructive',
        });
        onUpdate();
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsPublishing(false);
    }
  };

  const statusVariant = post.status === 'Publicado' 
    ? 'default' 
    : post.status === 'Error' 
      ? 'destructive' 
      : 'secondary';

  return (
    <Card className="flex flex-col h-full shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
                {platformIcons[post.platform]}
                <CardTitle className="text-lg font-headline">{post.platform}</CardTitle>
            </div>
            <Badge variant={statusVariant}>{post.status}</Badge>
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
        
        {post.publishError && (
          <div className="flex items-start gap-1.5 p-2 rounded bg-amber-50 text-amber-800 text-xs border border-amber-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{post.publishError}</span>
          </div>
        )}

        {post.link && <a href={post.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline break-all flex items-center gap-1"><LinkIcon className="w-3 h-3"/>{post.link}</a>}
      </CardContent>

      <CardFooter className="flex flex-col gap-2 border-t pt-3">
        {/* Acciones principales de publicación y enlace */}
        <div className="flex w-full justify-between items-center gap-2">
          {post.metaPostUrl ? (
            <Button asChild variant="outline" size="sm" className="w-full text-xs">
              <a href={post.metaPostUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Ver en {post.platform}
              </a>
            </Button>
          ) : (post.platform === 'Facebook' || post.platform === 'Instagram') ? (
            <Button
              variant="default"
              size="sm"
              className="w-full text-xs bg-emerald-600 hover:bg-emerald-700"
              onClick={handlePublishNow}
              disabled={isPublishing}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Publicando...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Publicar Ahora
                </>
              )}
            </Button>
          ) : null}

          <Button variant="outline" size="sm" className="text-xs whitespace-nowrap" onClick={handleCopyText} title="Copiar texto para pegar a mano">
            <Copy className="w-3.5 h-3.5 mr-1" />
            Copiar
          </Button>
        </div>

        {/* Acciones secundarias (duplicar, editar, eliminar) */}
        <div className="flex w-full justify-end gap-1 pt-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDuplicate(post)} title="Duplicar">
              <Copy className="w-3.5 h-3.5"/>
          </Button>
          <NewPostDialog onPostCreated={onUpdate} postToEdit={post}>
               <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar"><Edit className="w-3.5 h-3.5"/></Button>
          </NewPostDialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" disabled={isDeleting} title="Eliminar">
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Trash2 className="w-3.5 h-3.5" />}
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
        </div>
      </CardFooter>
    </Card>
  );
}
