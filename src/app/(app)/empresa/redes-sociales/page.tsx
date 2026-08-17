'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Camera, Copy, ExternalLink, Filter, List, Loader2, MessageSquare, Sparkles, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { SocialPlatform, SocialPost } from '@/types/social-media';
import { deleteSocialPost, generateDraftPostsFromPartyPhotos, getSocialPosts } from '@/app/actions/social-media';
import { NewPostDialog } from '@/components/social-media/NewPostDialog';
import { SocialPostCard } from '@/components/social-media/SocialPostCard';
import { SocialMediaCalendar } from '@/components/social-media/SocialMediaCalendar';
import { SocialHistoryImportDialog } from '@/components/social-media/SocialHistoryImportDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CAMPAIGN_LANDINGS } from '@/lib/marketing/campaign-landings';

const FILTER_PLATFORMS: SocialPlatform[] = [
  'Facebook',
  'Instagram',
  'Threads',
  'TikTok',
  'YouTube',
  'X',
  'WhatsApp',
];

function SocialMediaPageContent() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [allEvents, setAllEvents] = useState<FiestaEnPlanificacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [postToDuplicate, setPostToDuplicate] = useState<SocialPost | null>(null);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [filteredPosts, setFilteredPosts] = useState<SocialPost[]>([]);
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<SocialPlatform | 'all'>('all');
  const [isPartyDraftsDialogOpen, setIsPartyDraftsDialogOpen] = useState(false);
  const [selectedPartyIdForDrafts, setSelectedPartyIdForDrafts] = useState<string>('');
  const [isGeneratingDrafts, setIsGeneratingDrafts] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedPosts, actual, historial] = await Promise.all([
        getSocialPosts(),
        getFiestaActual(),
        getHistorialFiestas(),
      ]);
      setPosts(Array.isArray(fetchedPosts) ? fetchedPosts : []);
      const all = [actual, ...(Array.isArray(historial) ? historial : [])].filter(Boolean) as FiestaEnPlanificacion[];
      setAllEvents(all);
    } catch (err) {
      toast({
        title: 'No se pudieron cargar los datos',
        description: err instanceof Error ? err.message : 'Intentá de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    let visible = Array.isArray(posts) ? posts : [];
    if (eventFilter !== 'all') {
      visible = eventFilter === 'general'
        ? visible.filter((post) => post.isGeneralCampaign)
        : visible.filter((post) => post.eventId === eventFilter);
    }
    if (platformFilter !== 'all') visible = visible.filter((post) => post.platform === platformFilter);
    setFilteredPosts(visible);
  }, [posts, eventFilter, platformFilter]);

  const handleDelete = async (postId: string) => {
    setDeletingPostId(postId);
    try {
      const result = await deleteSocialPost(postId);
      if (!result.success) throw new Error(result.error || 'No se pudo eliminar la publicación.');
      toast({ title: 'Publicación eliminada' });
      await fetchData();
    } catch (err) {
      toast({
        title: 'Error al eliminar',
        description: err instanceof Error ? err.message : 'Intentá de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setDeletingPostId(null);
    }
  };

  const handleGenerateDraftsFromParty = async () => {
    if (!selectedPartyIdForDrafts) return;
    setIsGeneratingDrafts(true);
    try {
      const result = await generateDraftPostsFromPartyPhotos(selectedPartyIdForDrafts);
      if (!result.success) throw new Error(result.error || 'No se pudieron generar los borradores.');
      toast({
        title: 'Borradores generados',
        description: `Se crearon ${result.createdCount} publicaciones en borrador listas para revisar.`,
      });
      setIsPartyDraftsDialogOpen(false);
      setSelectedPartyIdForDrafts('');
      await fetchData();
    } catch (err) {
      toast({
        title: 'No se pudieron generar borradores',
        description: err instanceof Error ? err.message : 'Intentá de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingDrafts(false);
    }
  };

  const buildCampaignUrl = (slug: string) => typeof window === 'undefined'
    ? `/landing/${slug}`
    : `${window.location.origin}/landing/${slug}`;

  const copyCampaignLink = async (slug: string) => {
    const url = buildCampaignUrl(slug);
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copiado', description: url });
    } catch {
      toast({
        title: 'No se pudo copiar',
        description: 'Abrí la landing y copiá el enlace desde el navegador.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Planificador de Contenido</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SocialHistoryImportDialog onImported={fetchData} />
          <Dialog open={isPartyDraftsDialogOpen} onOpenChange={setIsPartyDraftsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-amber-200 bg-amber-50/50 font-semibold text-amber-900 shadow-sm hover:bg-amber-100">
                <Camera className="mr-2 h-4 w-4 text-amber-600" />
                Generar desde fiesta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-amber-600" />
                  Generar posteos desde fotos de fiesta
                </DialogTitle>
                <DialogDescription>
                  La app seleccionará las mejores fotos aprobadas del evento y armará borradores con texto y etiquetas para que los revises.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500">Seleccionar evento</label>
                  <Select value={selectedPartyIdForDrafts} onValueChange={setSelectedPartyIdForDrafts}>
                    <SelectTrigger><SelectValue placeholder="Elegí una fiesta reciente..." /></SelectTrigger>
                    <SelectContent>
                      {allEvents.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.configuracion?.nombreEvento || event.configuracion?.clienteNombre || `Fiesta #${event.id}`}
                          {event.configuracion?.fechaEvento ? ` (${event.configuracion.fechaEvento})` : ''}
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
                  className="bg-amber-600 font-bold text-white hover:bg-amber-700"
                >
                  {isGeneratingDrafts
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generando...</>
                    : 'Crear 4 borradores'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <NewPostDialog onPostCreated={fetchData} />
          <Button asChild variant="outline">
            <Link href="/empresa"><ArrowLeft className="mr-2 h-4 w-4" />Volver a Empresa</Link>
          </Button>
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

      <CardDescription>
        Planificá lo nuevo y cargá el historial viejo para que la IA de marketing conozca qué se publicó antes y evite repetir contenido.
      </CardDescription>

      <Card className="border-sky-100 bg-sky-50/40 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-headline">Memoria histórica de redes</CardTitle>
          <CardDescription>
            Usá “Importar historial” una sola vez por red con el archivo oficial. Después las conexiones automáticas siguen agregando lo nuevo sin borrar lo anterior.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="border-emerald-100 bg-emerald-50/40 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl font-headline">
                <MessageSquare className="h-5 w-5 text-emerald-600" />
                Landings para publicidad
              </CardTitle>
              <CardDescription>Links listos para campañas, historias, estados de WhatsApp o publicaciones.</CardDescription>
            </div>
            <Button asChild variant="outline" className="bg-white">
              <Link href="/landing/tecnologia-ak" target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />Ver Tecnología AK
              </Link>
            </Button>
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
                    <Copy className="mr-1.5 h-3.5 w-3.5" />Copiar
                  </Button>
                  <Button asChild size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700">
                    <Link href={`/landing/${campaign.slug}`} target="_blank" className="flex-1">Abrir</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline">Gestor de Contenido</CardTitle>
          <div className="flex flex-col gap-4 pt-2 md:flex-row">
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="outline"><Filter className="mr-2 h-4 w-4" />Filtrar por Evento</Button></DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => setEventFilter('all')}>Todos los Eventos</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setEventFilter('general')}>Campañas Generales</DropdownMenuItem>
                <DropdownMenuSeparator />
                {allEvents.map((event) => (
                  <DropdownMenuItem key={event.id} onSelect={() => setEventFilter(event.id)}>
                    {event.configuracion.nombreEvento}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="outline"><Filter className="mr-2 h-4 w-4" />Filtrar por Plataforma</Button></DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => setPlatformFilter('all')}>Todas las Plataformas</DropdownMenuItem>
                {FILTER_PLATFORMS.map((platform) => (
                  <DropdownMenuItem key={platform} onSelect={() => setPlatformFilter(platform)}>{platform}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {(eventFilter !== 'all' || platformFilter !== 'all') && (
              <Button variant="ghost" onClick={() => { setEventFilter('all'); setPlatformFilter('all'); }}>
                <X className="mr-2 h-4 w-4" />Limpiar Filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list">
            <TabsList className="grid w-full grid-cols-2 md:inline-flex md:w-auto">
              <TabsTrigger value="list"><List className="mr-2 h-4 w-4" />Vista de Lista</TabsTrigger>
              <TabsTrigger value="calendar"><Calendar className="mr-2 h-4 w-4" />Vista de Calendario</TabsTrigger>
            </TabsList>
            <TabsContent value="list" className="mt-4">
              {isLoading ? (
                <div className="py-10 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></div>
              ) : filteredPosts.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredPosts.map((post) => (
                    <SocialPostCard
                      key={post.id}
                      post={post}
                      onDelete={handleDelete}
                      isDeleting={deletingPostId === post.id}
                      onUpdate={fetchData}
                      onDuplicate={(item) => { setPostToDuplicate(item); setIsDuplicateDialogOpen(true); }}
                    />
                  ))}
                </div>
              ) : (
                <p className="py-10 text-center text-muted-foreground">No hay publicaciones que coincidan con los filtros seleccionados.</p>
              )}
            </TabsContent>
            <TabsContent value="calendar" className="mt-4">
              {isLoading
                ? <div className="py-10 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></div>
                : <SocialMediaCalendar posts={filteredPosts} />}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            El historial importado queda solo dentro de la app. Borrarlo acá tampoco borra la publicación original de la red.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function SocialMediaPage() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <SocialMediaPageContent />
    </Suspense>
  );
}
