
'use client';

import type { SocialPost, SocialPlatform } from '@/types/social-media';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NewPostDialog } from './NewPostDialog';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { publicarPosteoAhoraAction } from '@/app/actions/social-media';
import { Trash2, Edit, Loader2, Link as LinkIcon, Facebook, Instagram, Music, Copy, MessageSquare, Youtube, AtSign, Twitter, Pin, Send, AlertCircle, Check, Globe } from 'lucide-react';
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

const platformIcons: Record<SocialPlatform, React.ReactNode> = {
    Facebook: <Facebook className="w-5 h-5 text-blue-600" />,
    Instagram: <Instagram className="w-5 h-5 text-pink-500" />,
    Google: <Globe className="w-5 h-5 text-blue-500" />,
    TikTok: <Music className="w-5 h-5 text-black dark:text-white" />,
    WhatsApp: <MessageSquare className="w-5 h-5 text-green-500" />,
    YouTube: <Youtube className="w-5 h-5 text-red-600" />,
    Threads: <AtSign className="w-5 h-5 text-slate-800" />,
    X: <Twitter className="w-5 h-5 text-slate-800" />,
    Pinterest: <Pin className="w-5 h-5 text-red-600" />,
};

export function SocialPostCard({ post, onDelete, isDeleting, onUpdate, onDuplicate }: SocialPostCardProps) {
  const { toast } = useToast();
  const [isPublishingNow, setIsPublishingNow] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const handleDelete = () => {
    onDelete(post.id);
  };

  const handlePublishNow = async () => {
    setIsPublishingNow(true);
    try {
      const res = await publicarPosteoAhoraAction(post.id);
      if (res.success) {
        toast({
          title: "Publicación realizada",
          description: res.message || "La publicación se envió correctamente.",
        });
        onUpdate();
      } else {
        toast({
          title: "No se pudo publicar",
          description: res.error || "Revisá la conexión con la red social.",
          variant: "destructive",
        });
        onUpdate();
      }
    } catch (err: any) {
      toast({
        title: "Error inesperado",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsPublishingNow(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(post.text);
    setCopiedText(true);
    toast({ title: "Texto copiado al portapapeles" });
    setTimeout(() => setCopiedText(false), 2000);
  };

  const isFailed = post.status === 'Falló' || post.status === 'Error' || !!post.lastError;
  const isPublished = post.status === 'Publicado' || post.status === 'Importado de IG' || post.status === 'Importado historial';
  const isAutoPlatform = post.platform === 'Instagram' || post.platform === 'Facebook';

  return (
    <Card className={`flex flex-col h-full shadow-md hover:shadow-lg transition-shadow ${isFailed ? 'border-rose-300 bg-rose-50/20' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
                {platformIcons[post.platform]}
                <CardTitle className="text-lg font-headline">{post.platform}</CardTitle>
            </div>
            <Badge 
              variant={isPublished ? 'default' : isFailed ? 'destructive' : 'secondary'}
              className={
                post.status === 'Listo para copiar'
                  ? 'border-amber-300 text-amber-900 bg-amber-50'
                  : post.status === 'Importado de IG'
                    ? 'border-pink-300 text-pink-700 bg-pink-50 dark:bg-pink-950 dark:text-pink-300'
                    : ''
              }
            >
              {post.status}
            </Badge>
        </div>
        <CardDescription>
          Para: {post.isGeneralCampaign ? 'Campaña General' : post.eventName || 'Evento Específico'}
        </CardDescription>
         <p className="text-xs text-muted-foreground">Publicar: {formatDateTime(post.publishDate)}</p>
         {post.lastError && (
           <div className="mt-1 flex items-start gap-1 text-xs text-rose-700 font-medium bg-rose-50 p-2 rounded border border-rose-200">
             <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
             <span>{post.lastError}</span>
           </div>
         )}
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        {post.mediaUrl && (
          <div className="relative aspect-video rounded-md overflow-hidden bg-muted">
             <NextImage src={post.mediaUrl} alt="Vista previa del post" layout="fill" objectFit="cover" />
          </div>
        )}
        <p className="text-sm text-foreground line-clamp-4 whitespace-pre-wrap">{post.text}</p>
        {post.link && <a href={post.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline break-all flex items-center gap-1"><LinkIcon className="w-3 h-3"/>{post.link}</a>}
      </CardContent>
      <CardFooter className="flex flex-wrap justify-between items-center gap-2 border-t pt-3">
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-8 gap-1"
            onClick={handleCopyText}
            title="Copiar texto"
          >
            {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedText ? 'Copiado' : 'Copiar'}
          </Button>

          {!isPublished && isAutoPlatform && (
            <Button
              size="sm"
              variant="default"
              className="text-xs h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handlePublishNow}
              disabled={isPublishingNow}
              title="Publicar ahora en la red social"
            >
              {isPublishingNow ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Publicar ahora
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDuplicate(post)} title="Duplicar">
              <Copy className="w-4 h-4"/>
          </Button>
          <NewPostDialog onPostCreated={onUpdate} postToEdit={post}>
               <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar"><Edit className="w-4 h-4"/></Button>
          </NewPostDialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" disabled={isDeleting} title="Eliminar">
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
        </div>
      </CardFooter>
    </Card>
  );
}
