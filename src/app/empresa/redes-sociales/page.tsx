
'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Sparkles, PlusCircle, AlertTriangle, List, Calendar, Filter, X, Wand2, Bot, Copy, ExternalLink, MessageSquare } from 'lucide-react';
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
import { CAMPAIGN_LANDINGS } from '@/lib/marketing/campaign-landings';

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
            setPosts(Array.isArray(fetchedPosts) ? fetchedPosts : []);
            const all = [actual, ...(Array.isArray(historial) ? historial : [])].filter(Boolean) as FiestaEnPlanificacion[];
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
        let tempPosts = Array.isArray(posts) ? posts : [];
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

    const buildCampaignUrl = (slug: string) => {
        if (typeof window === 'undefined') return `/landing/${slug}`;
        return `${window.location.origin}/landing/${slug}`;
    };

    const copyCampaignLink = async (slug: string) => {
        const url = buildCampaignUrl(slug);
        try {
            await navigator.clipboard.writeText(url);
            toast({ title: 'Link copiado', description: url });
        } catch {
            toast({ title: 'No se pudo copiar', description: 'Abrí la landing y copiá el enlace desde el navegador.', variant: 'destructive' });
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
                     <Link href="/empresa">
                        <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver a Empresa</Button>
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

            <Card className="border-emerald-100 bg-emerald-50/40 shadow-sm">
                <CardHeader>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle className="font-headline text-xl flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-emerald-600" />
                                Landings para publicidad
                            </CardTitle>
                            <CardDescription>
                                Links listos para campanas. Usalos en Meta Ads, historias, estados de WhatsApp o publicaciones.
                            </CardDescription>
                        </div>
                        <Link href="/landing/tecnologia-ak" target="_blank">
                            <Button variant="outline" className="bg-white">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Ver Tecnologia AK
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {CAMPAIGN_LANDINGS.map((campaign) => (
                            <div key={campaign.slug} className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">{campaign.shortTitle}</p>
                                <h3 className="mt-1 text-base font-black text-slate-900">{campaign.hero.headline.replace('\n', ' ')}</h3>
                                <p className="mt-2 min-h-[54px] text-xs leading-5 text-slate-500">{campaign.objective}</p>
                                <div className="mt-4 flex gap-2">
                                    <Button size="sm" variant="outline" className="flex-1" onClick={() => copyCampaignLink(campaign.slug)}>
                                        <Copy className="w-3.5 h-3.5 mr-1.5" />
                                        Copiar
                                    </Button>
                                    <Link href={`/landing/${campaign.slug}`} target="_blank" className="flex-1">
                                        <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700">
                                            Abrir
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
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
