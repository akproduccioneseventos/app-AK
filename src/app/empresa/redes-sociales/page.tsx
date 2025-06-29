
'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Sparkles, PlusCircle, AlertTriangle, List, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SocialPost } from '@/types/social-media';
import { getSocialPosts, deleteSocialPost } from '@/app/actions/social-media';
import { NewPostDialog } from '@/components/social-media/NewPostDialog';
import { SocialPostCard } from '@/components/social-media/SocialPostCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


function SocialMediaPageContent() {
    const [posts, setPosts] = useState<SocialPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedPosts = await getSocialPosts();
            setPosts(fetchedPosts);
        } catch (err: any) {
            setError("No se pudieron cargar las publicaciones.");
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDelete = async (postId: string) => {
        setDeletingPostId(postId);
        try {
            const result = await deleteSocialPost(postId);
            if (result.success) {
                toast({ title: "Publicación Eliminada", variant: "destructive" });
                fetchData();
            } else {
                throw new Error(result.error || "No se pudo eliminar la publicación.");
            }
        } catch (err: any) {
             toast({ title: "Error al Eliminar", description: err.message, variant: "destructive" });
        } finally {
            setDeletingPostId(null);
        }
    };
    
    const scheduledPosts = posts.filter(p => p.status === 'Programado');
    const publishedPosts = posts.filter(p => p.status === 'Publicado');

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Sparkles className="w-8 h-8 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Redes Sociales y Publicaciones</h1>
                </div>
                <div className="flex gap-2">
                    <NewPostDialog onPostCreated={fetchData} />
                     <Link href="/empresa" passHref>
                        <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
                    </Link>
                </div>
            </div>
            <CardDescription>Planifica, redacta con IA y sigue el rendimiento de tus campañas en redes sociales.</CardDescription>
            
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-xl">Gestor de Contenido</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="programadas">
                        <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex">
                            <TabsTrigger value="programadas"><Calendar className="w-4 h-4 mr-2"/>Programadas ({scheduledPosts.length})</TabsTrigger>
                            <TabsTrigger value="publicadas"><List className="w-4 h-4 mr-2"/>Publicadas ({publishedPosts.length})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="programadas" className="mt-4">
                            {isLoading ? (
                                <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary"/></div>
                            ) : scheduledPosts.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {scheduledPosts.map(post => <SocialPostCard key={post.id} post={post} onDelete={handleDelete} isDeleting={deletingPostId === post.id} onUpdate={fetchData} />)}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-center py-10">No hay publicaciones programadas.</p>
                            )}
                        </TabsContent>
                         <TabsContent value="publicadas" className="mt-4">
                           {isLoading ? (
                                <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary"/></div>
                            ) : publishedPosts.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {publishedPosts.map(post => <SocialPostCard key={post.id} post={post} onDelete={handleDelete} isDeleting={deletingPostId === post.id} onUpdate={fetchData} />)}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-center py-10">No hay publicaciones pasadas.</p>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
                 <CardFooter>
                     <p className="text-xs text-muted-foreground">Las vistas de calendario y estadísticas se añadirán en futuras actualizaciones.</p>
                 </CardFooter>
            </Card>
        </div>
    )
}


export default function SocialMediaPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <SocialMediaPageContent />
        </Suspense>
    )
}
