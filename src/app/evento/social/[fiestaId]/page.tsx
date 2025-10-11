
'use client';

import React, { useState, useEffect, useCallback, type FormEvent, useRef, type ChangeEvent, use } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getSocialPosts, uploadSocialPost, addLikeToPost, addCommentToPost, deleteSocialPost, clearGallery } from '@/app/actions/social-gallery';
import type { SocialGalleryPost, SocialComment } from '@/types/social-gallery';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions'; // Corrected import
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import NextImage from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Loader2, AlertTriangle, Heart, MessageCircle, Send, Upload, RefreshCw, PartyPopper, MonitorPlay, X, Trash2, Download } from 'lucide-react';
import { WatermarkedImage } from '@/components/watermarked-image';
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

const PostCard: React.FC<{ 
  post: SocialGalleryPost; 
  onLike: (postId: string) => void; 
  onComment: (postId: string, text: string) => Promise<void>; 
  currentAuthor: string;
  onDelete?: (postId: string) => void;
  isAdminView: boolean;
}> = ({ post, onLike, onComment, currentAuthor, onDelete, isAdminView }) => {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  const handleCommentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await onComment(post.id, commentText);
    setCommentText('');
  };

  const formattedTimestamp = formatDistanceToNow(new Date(post.timestamp), {
    addSuffix: true,
    locale: es,
  });

  return (
    <Card className="shadow-lg overflow-hidden flex flex-col bg-card">
       <CardHeader className="flex flex-row items-center justify-between gap-3 p-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-primary font-bold">
              {post.authorName.charAt(0).toUpperCase()}
          </div>
          <div>
              <p className="font-semibold text-sm">{post.authorName}</p>
              <p className="text-xs text-muted-foreground">{formattedTimestamp}</p>
          </div>
        </div>
        {isAdminView && onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="w-4 h-4"/></Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle><AlertDialogDescription>Se eliminará esta foto. Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(post.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardHeader>
      <CardContent className="p-0 flex-grow">
        <WatermarkedImage containerClassName="aspect-square relative bg-muted" src={post.imageUrl} alt={`Foto de ${post.authorName}`} layout="fill" objectFit="cover" />
      </CardContent>
      <CardFooter className="p-3 flex flex-col items-start gap-2">
        <div className="w-full flex justify-between items-center">
            <div className="flex items-center gap-1">
                 <Button variant="ghost" size="sm" onClick={() => onLike(post.id)} className="flex items-center gap-1.5 px-2 h-8 text-muted-foreground hover:text-red-500">
                    <Heart className={`w-5 h-5 ${post.likes > 0 ? 'text-red-500 fill-current' : ''}`} />
                    <span className="text-sm font-medium">{post.likes}</span>
                </Button>
                 <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 px-2 h-8 text-muted-foreground hover:text-primary">
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">{post.comments.length}</span>
                </Button>
            </div>
        </div>
        {showComments && (
            <div className="w-full pt-3 border-t space-y-2">
                <div className="max-h-32 overflow-y-auto space-y-2 pr-2 text-sm">
                    {post.comments.length > 0 ? post.comments.map(c => (
                        <div key={c.id} className="bg-muted p-2 rounded-md">
                            <span className="font-semibold">{c.authorName}:</span> {c.text}
                        </div>
                    )) : <p className="text-xs text-muted-foreground text-center py-2">Sin comentarios. ¡Sé el primero!</p>}
                </div>
                 <form onSubmit={handleCommentSubmit} className="flex gap-2 items-center">
                    <Input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder={`Añadir comentario como ${currentAuthor}...`} className="h-9 text-sm"/>
                    <Button type="submit" size="icon" className="h-9 w-9 flex-shrink-0" disabled={!commentText.trim()}><Send className="w-4 h-4"/></Button>
                 </form>
            </div>
        )}
      </CardFooter>
    </Card>
  );
};


export default function SocialGalleryPage({ params: paramsProp }: { params: { fiestaId: string } }) {
  const params = use(paramsProp);
  const { toast } = useToast();
  
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [posts, setPosts] = useState<SocialGalleryPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [isAdminView, setIsAdminView] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Dialog state
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  
  // Projection mode state
  const [projectionMode, setProjectionMode] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const fetchData = useCallback(async (showLoadingIndicator = true) => {
    if(showLoadingIndicator) setIsLoading(true);
    try {
      const [fetchedPosts, fiestaData] = await Promise.all([
          getSocialPosts(params.fiestaId),
          getFiestaById(params.fiestaId) 
      ]);
      setPosts(fetchedPosts);
      setFiesta(fiestaData);
    } catch (e) {
      toast({ title: "Error al cargar galería", variant: "destructive" });
    } finally {
      if(showLoadingIndicator) setIsLoading(false);
    }
  }, [params.fiestaId, toast]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
        fetchData(false);
    }, 5000); 
    return () => clearInterval(interval);
  }, [fetchData]);
  
  useEffect(() => {
    if (projectionMode && posts.length > 0) {
        const timer = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % posts.length);
        }, 7000); // Change slide every 7 seconds
        return () => clearInterval(timer);
    }
  }, [projectionMode, posts.length]);
  
  useEffect(() => {
    if(typeof window !== 'undefined') {
        const savedName = localStorage.getItem('socialGalleryAuthorName');
        if (savedName) setAuthorName(savedName);

        const sessionAuth = sessionStorage.getItem('ak_producciones_auth_session');
        setIsAdminView(sessionAuth === 'true');
    }
  }, []);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
         toast({ title: "Archivo demasiado grande", description: "El tamaño máximo es 10MB.", variant: "destructive" });
         return;
      }
      setFileToUpload(file);
      setUploadPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!fileToUpload || !authorName) {
        toast({ title: "Faltan datos", description: "Por favor, ingresa tu nombre y selecciona un archivo.", variant: "destructive" });
        return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append('fiestaId', params.fiestaId);
    formData.append('file', fileToUpload);
    formData.append('authorName', authorName);

    const result = await uploadSocialPost(formData);
    if (result.success) {
      toast({ title: "¡Foto subida!", description: "Tu foto ahora es parte de la galería." });
      await fetchData(false);
      setIsUploadDialogOpen(false);
      setFileToUpload(null);
      setUploadPreview(null);
    } else {
      toast({ title: "Error al subir", description: result.error, variant: "destructive" });
    }
    setIsUploading(false);
  };
  
  const handleLike = async (postId: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? {...p, likes: p.likes + 1} : p));
    await addLikeToPost(postId);
  };
  
  const handleComment = async (postId: string, text: string) => {
    if (!authorName) {
        toast({description: "Por favor ingresa tu nombre para comentar."});
        return;
    }
    await addCommentToPost(postId, text, authorName);
    await fetchData(false);
  };

  const handleDelete = async (postId: string) => {
    await deleteSocialPost(postId);
    toast({ title: "Foto eliminada" });
    await fetchData(false);
  };

  const handleClearGallery = async () => {
    setIsClearing(true);
    await clearGallery(params.fiestaId);
    toast({ title: "Galería Limpiada", variant: "destructive" });
    await fetchData();
    setIsClearing(false);
  };
  
  const handleAuthorNameChange = (name: string) => {
      setAuthorName(name);
      localStorage.setItem('socialGalleryAuthorName', name);
  };

  return (
    <div className="min-h-screen bg-muted/30">
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>Sube tu Momento</DialogTitle><DialogDescription>Comparte una foto con todos los invitados.</DialogDescription></DialogHeader>
                 <form onSubmit={handleUploadSubmit} className="space-y-4">
                    {uploadPreview ? <div className="relative aspect-video"><NextImage src={uploadPreview} alt="Vista previa" layout="fill" objectFit="contain" className="rounded-md"/></div>
                    : <div className="h-48 border-2 border-dashed rounded-md flex flex-col items-center justify-center bg-background"><Label htmlFor="file-upload-dialog" className="cursor-pointer text-center text-muted-foreground p-4"><Upload className="w-8 h-8 mx-auto mb-2"/>Selecciona o arrastra una foto aquí</Label><Input id="file-upload-dialog" type="file" onChange={handleFileSelect} className="hidden" accept="image/jpeg,image/png,image/gif" /></div>}
                    <DialogFooter><Button type="submit" disabled={isUploading || !fileToUpload}>{isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Upload className="w-4 h-4 mr-2"/>}{isUploading ? "Subiendo..." : "Publicar Foto"}</Button></DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-5xl mx-auto p-3 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold font-headline text-primary flex items-center gap-2">
                <PartyPopper/>
                {fiesta?.webPageSettings?.pageTitle || fiesta?.configuracion.nombreEvento || 'Galería Social'}
            </h1>
            <p className="text-sm text-muted-foreground">¡Comparte tus momentos del evento!</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
             <Input value={authorName} onChange={e => handleAuthorNameChange(e.target.value)} placeholder="Tu nombre..." className="h-10 text-base flex-grow"/>
             <Button onClick={() => setIsUploadDialogOpen(true)} disabled={!authorName} className="h-10"><Upload className="w-5 h-5"/><span className="ml-2 hidden sm:inline">Subir Foto</span></Button>
             <Button variant="outline" onClick={() => setProjectionMode(true)} className="h-10"><MonitorPlay className="w-5 h-5"/><span className="ml-2 hidden sm:inline">Proyección</span></Button>
             <Button variant="ghost" size="icon" onClick={() => fetchData(true)} disabled={isLoading} className="h-10 w-10"><RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`}/></Button>
          </div>
        </div>
        {isAdminView && (
          <div className="bg-yellow-100 dark:bg-yellow-900/50 p-2 text-center text-xs text-yellow-800 dark:text-yellow-300 flex justify-center items-center gap-4">
            <span>Estás viendo como administrador.</span>
            <div className="flex gap-2">
                <a href={`/api/social-gallery/${params.fiestaId}/download`} download>
                    <Button size="sm" variant="outline" className="h-7"><Download className="w-4 h-4 mr-1.5"/>Descargar Todo</Button>
                </a>
                <AlertDialog>
                    <AlertDialogTrigger asChild><Button size="sm" variant="destructive" className="h-7" disabled={isClearing}><Trash2 className="w-4 h-4 mr-1.5"/>Vaciar Galería</Button></AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>¿Vaciar la galería?</AlertDialogTitle><AlertDialogDescription>Esta acción eliminará permanentemente todas las fotos y comentarios. Es irreversible.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleClearGallery} className="bg-destructive hover:bg-destructive/90">Sí, Vaciar Galería</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto p-4">
        {isLoading && posts.length === 0 ? <div className="text-center py-20 flex flex-col items-center gap-3"><Loader2 className="w-10 h-10 animate-spin text-primary"/><p className="text-muted-foreground">Cargando galería...</p></div>
        : posts.length === 0 ? <div className="text-center py-20 text-muted-foreground bg-card p-8 rounded-lg shadow-inner"><h2 className="text-2xl font-semibold text-foreground mb-2">¡Sé el primero en compartir!</h2><p>La galería está vacía. Sube la primera foto para empezar a crear recuerdos.</p></div>
        : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{posts.map(post => <PostCard key={post.id} post={post} onLike={handleLike} onComment={handleComment} currentAuthor={authorName} isAdminView={isAdminView} onDelete={handleDelete}/>)}</div>}
      </main>
      
      {projectionMode && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4">
            <Button onClick={() => setProjectionMode(false)} variant="ghost" size="icon" className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/80 text-white hover:text-white h-10 w-10"><X className="w-6 h-6"/></Button>
            <div className="relative w-full h-full">
                {posts.map((post, index) => (
                    <div key={post.id} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
                        <WatermarkedImage src={post.imageUrl} layout="fill" objectFit="contain" alt={`Foto de ${post.authorName}`} />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white flex justify-between items-end">
                            <div>
                                <p className="font-bold text-lg">@{post.authorName}</p>
                                {post.comments.slice(-2).map((c, i) => (
                                    <p key={i} className="text-sm opacity-90"><span className="font-semibold">{c.authorName}:</span> {c.text}</p>
                                ))}
                            </div>
                            <div className="flex items-center gap-4 text-xl">
                                <div className="flex items-center gap-2"><Heart className={`w-6 h-6 ${post.likes > 0 ? 'text-red-400 fill-current' : ''}`} /> {post.likes}</div>
                                <div className="flex items-center gap-2"><MessageCircle className="w-6 h-6" /> {post.comments.length}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
}
