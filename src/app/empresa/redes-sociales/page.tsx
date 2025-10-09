
'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Sparkles, PlusCircle, AlertTriangle, List, Calendar, Filter, X, Wand2, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SocialPost, SocialPlatform } from '@/types/social-media';
import { getSocialPosts, deleteSocialPost } from '@/app/actions/social-media';
import { NewPostDialog } from '@/components/social-media/NewPostDialog';
import { SocialPostCard } from '@/components/social-media/SocialPostCard';
import { SocialMediaCalendar } from '@/components/social-media/SocialMediaCalendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { getFiestaActual, getHistorialFiestas } from '@/app/actions/fiesta-actual';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function SocialMediaPageContent() {
    const [posts, setPosts] = useState<SocialPost[]>([]);
    const [allEvents, setAllEvents] = useState<FiestaEnPlanificacion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
    const [postToDuplicate, setPostToDuplicate] = useState<SocialPost | null>(null);
    const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);

    // Filtering State
    const [filteredPosts, setFilteredPosts] = useState<SocialPost[]>([]);
    const [eventFilter, setEventFilter] = useState<string>('all'); // 'all', 'general', or eventId
    const [platformFilter, setPlatformFilter] = useState<SocialPlatform | 'all'>('all');

    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [fetchedPosts, actual, historial] = await Promise.all([
                getSocialPosts(),
                getFiestaActual(),
                getHistorialFiestas(),
            ]);
            setPosts(fetchedPosts);
            const all = [actual, ...historial].filter(Boolean) as FiestaEnPlanificacion[];
            setAllEvents(all);
        } catch (err: any) {
            setError("No se pudieron cargar los datos.");
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        let tempPosts = posts;
        if (eventFilter !== 'all') {
            if (eventFilter === 'general') {
                tempPosts = tempPosts.filter(p => p.isGeneralCampaign);
            } else {
                tempPosts = tempPosts.filter(p => p.eventId === eventFilter);
            }
        }
        if (platformFilter !== 'all') {
            tempPosts = tempPosts.filter(p => p.platform === platformFilter);
        }
        setFilteredPosts(tempPosts);
    }, [posts, eventFilter, platformFilter]);

    const handleDuplicatePost = (post: SocialPost) => {
        setPostToDuplicate(post);
        setIsDuplicateDialogOpen(true);
    };

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
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Sparkles className="w-8 h-8 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Planificador de Contenido</h1>
                </div>
                <div className="flex gap-2">
                    <NewPostDialog onPostCreated={fetchData} />
                     <Link href="/empresa" passHref>
                        <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
                    </Link>
                </div>
            </div>
            {postToDuplicate && (
                <NewPostDialog 
                    isOpen={isDuplicateDialogOpen}
                    onOpenChange={setIsDuplicateDialogOpen}
                    onPostCreated={fetchData} 
                    postToDuplicate={postToDuplicate}
                />
            )}
            <CardDescription>Planifica, redacta con IA y organiza tu contenido para redes sociales. Luego copia y pega para publicar.</CardDescription>
            
            <Card className="shadow-lg border-primary/20">
                <CardHeader>
                    <CardTitle className="font-headline text-xl flex items-center gap-2">
                        <Bot className="w-6 h-6 text-primary" />
                        Asistente de Marketing con IA
                    </CardTitle>
                    <CardDescription>
                        ¿Necesitas inspiración? Utiliza nuestro asistente de IA para generar ideas, textos e imágenes para tus publicaciones.
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                     <Link href="/admin/asistente-ak" passHref>
                        <Button variant="secondary">
                            <Wand2 className="w-4 h-4 mr-2" />
                            Abrir Asistente de IA
                        </Button>
                    </Link>
                </CardFooter>
            </Card>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-xl">Gestor de Contenido</CardTitle>
                    <div className="flex flex-col md:flex-row gap-4 pt-2">
                        {/* Event Filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="outline"><Filter className="w-4 h-4 mr-2"/>Filtrar por Evento</Button></DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onSelect={() => setEventFilter('all')}>Todos los Eventos</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setEventFilter('general')}>Campañas Generales</DropdownMenuItem>
                                <DropdownMenuSeparator/>
                                {allEvents.map(e => <DropdownMenuItem key={e.id} onSelect={() => setEventFilter(e.id)}>{e.configuracion.nombreEvento}</DropdownMenuItem>)}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {/* Platform Filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="outline"><Filter className="w-4 h-4 mr-2"/>Filtrar por Plataforma</Button></DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onSelect={() => setPlatformFilter('all')}>Todas las Plataformas</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setPlatformFilter('Facebook')}>Facebook</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setPlatformFilter('Instagram')}>Instagram</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setPlatformFilter('TikTok')}>TikTok</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setPlatformFilter('WhatsApp')}>WhatsApp</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {(eventFilter !== 'all' || platformFilter !== 'all') && <Button variant="ghost" onClick={() => {setEventFilter('all'); setPlatformFilter('all');}}><X className="w-4 h-4 mr-2"/>Limpiar Filtros</Button>}
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="list">
                        <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex">
                            <TabsTrigger value="list"><List className="w-4 h-4 mr-2"/>Vista de Lista</TabsTrigger>
                            <TabsTrigger value="calendar"><Calendar className="w-4 h-4 mr-2"/>Vista de Calendario</TabsTrigger>
                        </TabsList>
                        <TabsContent value="list" className="mt-4">
                            {isLoading ? (
                                <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary"/></div>
                            ) : filteredPosts.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredPosts.map(post => <SocialPostCard key={post.id} post={post} onDelete={handleDelete} isDeleting={deletingPostId === post.id} onUpdate={fetchData} onDuplicate={handleDuplicatePost} />)}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-center py-10">No hay publicaciones que coincidan con los filtros seleccionados.</p>
                            )}
                        </TabsContent>
                        <TabsContent value="calendar" className="mt-4">
                        {isLoading ? (
                                <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary"/></div>
                            ) : (
                            <SocialMediaCalendar posts={filteredPosts} />
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
                <CardFooter>
                    <p className="text-xs text-muted-foreground">Usa este módulo para planificar tu contenido. Cuando sea la fecha de publicación, simplemente copia el texto y la imagen para pegarlo en tus redes.</p>
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
