
'use client';

import { useState, useEffect, useCallback, type FormEvent, useRef, type ChangeEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertTriangle, Heart, MessageSquare, Send, Upload, RefreshCw, X } from 'lucide-react';
import NextImage from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { getSocialPosts, uploadSocialPost, addLikeToPost, addCommentToPost } from '@/app/actions/social-gallery';
import type { SocialGalleryPost, SocialComment } from '@/types/social-gallery';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

const PostCard: React.FC<{ post: SocialGalleryPost; onLike: (postId: string) => void; onComment: (postId: string, text: string) => void; }> = ({ post, onLike, onComment }) => {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  const handleCommentSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onComment(post.id, commentText);
    setCommentText('');
  };

  return (
    <Card className="shadow-md overflow-hidden">
      <CardContent className="p-0">
        <div className="aspect-square relative bg-muted">
          <NextImage src={post.imageUrl} alt={`Foto de ${post.authorName}`} layout="fill" objectFit="cover" />
        </div>
      </CardContent>
      <CardFooter className="p-3 flex flex-col items-start gap-2">
        <div className="w-full flex justify-between items-center">
            <div className="flex items-center gap-3">
                 <Button variant="ghost" size="sm" onClick={() => onLike(post.id)} className="flex items-center gap-1.5 px-2 h-8">
                    <Heart className={`w-4 h-4 ${post.likes > 0 ? 'text-red-500 fill-current' : ''}`} />
                    <span className="text-xs">{post.likes}</span>
                </Button>
                 <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 px-2 h-8">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-xs">{post.comments.length}</span>
                </Button>
            </div>
            <p className="text-xs text-muted-foreground">Por: <span className="font-medium">{post.authorName}</span></p>
        </div>
        {showComments && (
            <div className="w-full pt-2 border-t space-y-2">
                <div className="max-h-32 overflow-y-auto space-y-1 pr-2">
                    {post.comments.map(c => (
                        <div key={c.id} className="text-xs bg-muted p-1.5 rounded-md">
                            <span className="font-semibold">{c.authorName}:</span> {c.text}
                        </div>
                    ))}
                    {post.comments.length === 0 && <p className="text-xs text-muted-foreground text-center">Sin comentarios.</p>}
                </div>
                 <form onSubmit={handleCommentSubmit} className="flex gap-2 items-center">
                    <Input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Añadir comentario..." className="h-8 text-xs"/>
                    <Button type="submit" size="icon" className="h-8 w-8 flex-shrink-0"><Send className="w-4 h-4"/></Button>
                 </form>
            </div>
        )}
      </CardFooter>
    </Card>
  );
};


export default function SocialGalleryPage({ params }: { params: { fiestaId: string } }) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [posts, setPosts] = useState<SocialGalleryPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [authorName, setAuthorName] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedPosts = await getSocialPosts(params.fiestaId);
      setPosts(fetchedPosts);
    } catch (e) {
      toast({ title: "Error al cargar galería", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [params.fiestaId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  useEffect(() => {
    const savedName = localStorage.getItem('socialGalleryAuthorName');
    if (savedName) setAuthorName(savedName);
  }, []);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!authorName) {
        toast({ title: "Por favor, ingresa tu nombre antes de subir una foto.", variant: "default" });
        return;
    }
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('fiestaId', params.fiestaId);
    formData.append('file', file);
    formData.append('authorName', authorName);

    const result = await uploadSocialPost(formData);
    if (result.success) {
      toast({ title: "¡Foto subida!", description: "Tu foto ahora es parte de la galería." });
      await fetchData();
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
    const tempCommentId = `temp_${Date.now()}`;
    setPosts(prev => prev.map(p => p.id === postId ? {...p, comments: [...p.comments, {id: tempCommentId, authorName, text, timestamp: new Date().toISOString()}]} : p));
    await addCommentToPost(postId, text, authorName);
    await fetchData(); // Re-fetch to get real comment ID and ensure consistency
  };
  
  const handleAuthorNameChange = (name: string) => {
      setAuthorName(name);
      localStorage.setItem('socialGalleryAuthorName', name);
  };


  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-4xl mx-auto p-3 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold font-headline text-primary">Galería Social</h1>
            <p className="text-sm text-muted-foreground">¡Comparte tus momentos del evento!</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <Input value={authorName} onChange={e => handleAuthorNameChange(e.target.value)} placeholder="Tu nombre..." className="h-9 text-sm flex-grow"/>
             <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading || !authorName} className="flex-shrink-0">
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4"/>}
                <span className="ml-2 hidden sm:inline">Subir Foto</span>
             </Button>
             <Input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
             <Button variant="ghost" size="icon" onClick={fetchData} disabled={isLoading}><RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}/></Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {isLoading && posts.length === 0 ? (
          <div className="text-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary"/></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p>Aún no hay fotos. ¡Sé el primero en subir una!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {posts.map(post => (
              <PostCard key={post.id} post={post} onLike={handleLike} onComment={handleComment}/>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

