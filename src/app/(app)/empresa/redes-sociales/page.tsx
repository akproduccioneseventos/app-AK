
'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Sparkles, PlusCircle, AlertTriangle, List, Calendar, Filter, X, Wand2, Bot, Copy, ExternalLink, MessageSquare, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SocialPost, SocialPlatform } from '@/types/social-media';
import { getSocialPosts, deleteSocialPost, generateDraftPostsFromPartyPhotos } from '@/app/actions/social-media';
import { NewPostDialog } from '@/components/social-media/NewPostDialog';
import { SocialPostCard } from '@/components/social-media/SocialPostCard';
import { SocialHistoryImportDialog } from '@/components/social-media/SocialHistoryImportDialog';
import { SocialHistoryPanel } from '@/components/social-media/SocialHistoryPanel';
import { SocialMediaCalendar } from '@/components/social-media/SocialMediaCalendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { getFiestaActual, getHistorialFiestas } from '@/app/actions/fiesta-actual';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

    const [isPartyDraftsDialogOpen, setIsPartyDraftsDialogOpen] = useState(false);
    const [selectedPartyIdForDrafts, setSelectedPartyIdForDrafts] = useState<string>('');
    const [isGeneratingDrafts, setIsGeneratingDrafts] = useState(false);

    const handleGenerateDraftsFromParty = async () => {
        if (!selectedPartyIdForDrafts) return;
        setIsGeneratingDrafts(true);
        try {
            const res = await generateDraftPostsFromPartyPhotos(selectedPartyIdForDrafts);
            if (res.success) {
                toast({
                    title: "Borradores generados con éxito",
                    description: `Se crearon ${res.createdCount} publicaciones en borrador listas para revisar y aprobar.`,
                });
                setIsPartyDraftsDialogOpen(false);
                setSelectedPartyIdForDrafts('');
                fetchData();
            } else {
                throw new Error(res.error || "No se pudieron generar los borradores.");
            }
        } catch (err: any) {
            toast({
                title: "No se pudieron generar borradores",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setIsGeneratingDrafts(false);
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
                <div className="flex flex-wrap items-center gap-2">
                    <Dialog open={isPartyDraftsDialogOpen} onOpenChange={setIsPartyDraftsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="border-amber-200 bg-amber-50/50 hover:bg-amber-100 text-amber-900 font-semibold shadow-sm">
                                <Camera className="w-4 h-4 mr-2 text-amber-600" />
                                Generar desde fiesta
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Camera className="w-5 h-5 text-amber-600" />
                                    Generar posteos desde fotos de fiesta
                                </DialogTitle>
                                <DialogDescription>
                                    La app seleccionará las mejores fotos aprobadas del evento y armará borradores con texto y etiquetas en el planificador para que los revises con un toque.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-slate-500">Seleccionar evento</label>
                                    <Select value={selectedPartyIdForDrafts} onValueChange={setSelectedPartyIdForDrafts}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Elegí una fiesta reciente..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allEvents.map((evt) => (
                                                <SelectItem key={evt.id} value={evt.id}>
                                                    {evt.configuracion?.nombreEvento || evt.configuracion?.clienteNombre || `Fiesta #${evt.id}`} {evt.configuracion?.fechaEvento ? `(${evt.configuracion.fechaEvento})` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsPartyDraftsDialogOpen(false)}>Cancelar</Button>
                                <Button
                                    onClick={handleGenerateDraftsFromParty}
                                    disabled={!selectedPartyIdForDrafts || isGeneratingDrafts}
                                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                                >
                                    {isGeneratingDrafts ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Generando borradores...
                                        </>
                                    ) : (
                                        'Crear 4 borradores'
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <Button asChild variant="default" className="bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-600/20">
                        <Link href="/empresa/presencia-digital">
                            <Sparkles className="w-4 h-4 mr-2 text-amber-200" />
                            Centro de Presencia Digital
                        </Link>
                    </Button>
                    <SocialHistoryImportDialog onImported={fetchData} />
                    <NewPostDialog onPostCreated={fetchData} />
                    <Button asChild variant="outline"><Link href="/empresa"><ArrowLeft className="w-4 h-4 mr-2" />Volver a Empresa</Link></Button>
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
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <span className="font-bold text-slate-800">Publicación desatendida y manual: </span>
                    <span>Instagram y Facebook se publican de forma automática a la fecha y hora programadas. TikTok, WhatsApp, Threads y X quedan organizadas en la pestaña &quot;Listos para copiar&quot; para subirlas con 1 clic.</span>
                </div>
            </div>

            <SocialHistoryPanel onSyncCompleted={fetchData} />

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
                        <Button asChild variant="outline" className="bg-white"><Link href="/landing/tecnologia-ak" target="_blank">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Ver Tecnologia AK
                            </Link></Button>
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
                                    <Button asChild size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700"><Link href={`/landing/${campaign.slug}`} target="_blank" className="flex-1">
                                            Abrir
                                        </Link></Button>
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
                        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 md:w-auto md:inline-flex">
                            <TabsTrigger value="list"><List className="w-4 h-4 mr-2"/>Todos ({filteredPosts.length})</TabsTrigger>
                            <TabsTrigger value="manual"><Copy className="w-4 h-4 mr-2"/>Listos para copiar ({filteredPosts.filter(p => p.status === 'Listo para copiar' || p.platform === 'TikTok' || p.platform === 'WhatsApp' || p.platform === 'Threads' || p.platform === 'X').length})</TabsTrigger>
                            <TabsTrigger value="failed"><AlertTriangle className="w-4 h-4 mr-2"/>Con error ({filteredPosts.filter(p => p.status === 'Falló' || p.status === 'Error' || !!p.lastError).length})</TabsTrigger>
                            <TabsTrigger value="calendar"><Calendar className="w-4 h-4 mr-2"/>Calendario</TabsTrigger>
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
                        <TabsContent value="manual" className="mt-4">
                            {isLoading ? (
                                <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary"/></div>
                            ) : filteredPosts.filter(p => p.status === 'Listo para copiar' || p.platform === 'TikTok' || p.platform === 'WhatsApp' || p.platform === 'Threads' || p.platform === 'X').length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredPosts.filter(p => p.status === 'Listo para copiar' || p.platform === 'TikTok' || p.platform === 'WhatsApp' || p.platform === 'Threads' || p.platform === 'X').map(post => <SocialPostCard key={post.id} post={post} onDelete={handleDelete} isDeleting={deletingPostId === post.id} onUpdate={fetchData} onDuplicate={handleDuplicatePost} />)}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-center py-10">No hay publicaciones pendientes para copiar manualmente.</p>
                            )}
                        </TabsContent>
                        <TabsContent value="failed" className="mt-4">
                            {isLoading ? (
                                <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary"/></div>
                            ) : filteredPosts.filter(p => p.status === 'Falló' || p.status === 'Error' || !!p.lastError).length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredPosts.filter(p => p.status === 'Falló' || p.status === 'Error' || !!p.lastError).map(post => <SocialPostCard key={post.id} post={post} onDelete={handleDelete} isDeleting={deletingPostId === post.id} onUpdate={fetchData} onDuplicate={handleDuplicatePost} />)}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-center py-10">No hay publicaciones con error.</p>
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
                    <p className="text-xs text-muted-foreground">Instagram y Facebook se publican de forma autónoma. Las demás redes quedan listas para copiar el texto e imagen con un solo toque.</p>
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
