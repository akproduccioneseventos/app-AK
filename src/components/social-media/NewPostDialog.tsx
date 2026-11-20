'use client';

import { useState, useEffect, type FormEvent, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle, Loader2, Sparkles, Wand2, Send, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  saveSocialPost,
  publicarPosteoAhoraAction,
  adaptarTextoPorRedAction,
} from '@/app/actions/social-media';
import { getSocialConnectionsPublicas } from '@/app/actions/social-connections';
import type { SocialPost, SocialPlatform, PostStatus } from '@/types/social-media';
import type { SocialConnection } from '@/types/settings';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import NextImage from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { getFiestaActual, getHistorialFiestas } from '@/app/actions/fiesta-actual';
import { aFechaHoraLocal, aIsoUruguay } from '@/lib/fechas/fecha-local';
import {
  getFaltaMediaPorRed,
  armarFeedbackPublicacionMultiRed,
  adaptarTextoFallbackPorRed,
  sanitizarTextoPublicacion,
  type AdaptedPlatformVersion,
} from '@/lib/social-media/adaptar-post-por-red';

export { getFaltaMediaPorRed, armarFeedbackPublicacionMultiRed, adaptarTextoFallbackPorRed };

interface NewPostDialogProps {
    onPostCreated: () => void;
    postToEdit?: SocialPost | null;
    postToDuplicate?: SocialPost | null;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    initialConnections?: SocialConnection[];
    children?: React.ReactNode;
}


const ALL_PLATFORMS: Array<{ id: SocialPlatform; label: string; badge: string }> = [
  { id: 'Instagram', label: 'Instagram', badge: 'Automático / 1 Toque' },
  { id: 'Facebook', label: 'Facebook', badge: 'Automático / 1 Toque' },
  { id: 'TikTok', label: 'TikTok', badge: 'Directo / 1 Toque' },
  { id: 'YouTube', label: 'YouTube Shorts', badge: 'Directo / 1 Toque' },
  { id: 'Google', label: 'Google Business', badge: 'Directo / 1 Toque' },
  { id: 'Threads', label: 'Threads', badge: 'Directo / 1 Toque' },
  { id: 'X', label: 'X (Twitter)', badge: 'Directo / 1 Toque' },
  { id: 'Pinterest', label: 'Pinterest', badge: 'Directo / 1 Toque' },
  { id: 'WhatsApp', label: 'WhatsApp', badge: '1 Toque' },
];

export function NewPostDialog({
    onPostCreated,
    postToEdit,
    postToDuplicate,
    isOpen: controlledIsOpen,
    onOpenChange: setControlledIsOpen,
    initialConnections,
    children
}: NewPostDialogProps) {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isOpen = controlledIsOpen ?? internalIsOpen;
    const setIsOpen = setControlledIsOpen ?? setInternalIsOpen;

    const [isSaving, setIsSaving] = useState(false);
    const [isAdapting, setIsAdapting] = useState(false);
    const { toast } = useToast();

    // Conexiones reales (Orden 326 Bloque 4)
    const [connections, setConnections] = useState<SocialConnection[]>(initialConnections || []);
    const connectedPlatformIds = useMemo(() => {
        const set = new Set<SocialPlatform>();
        for (const c of connections) {
            if (c.isConnected) {
                set.add(c.platform as SocialPlatform);
            }
        }
        return set;
    }, [connections]);

    // Form state
    const [platform, setPlatform] = useState<SocialPlatform | 'WhatsApp'>('Instagram');
    const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(() =>
        (initialConnections || [])
            .filter((c) => c.isConnected)
            .map((c) => c.platform as SocialPlatform)
    );
    const [isGeneralCampaign, setIsGeneralCampaign] = useState(true);
    const [eventId, setEventId] = useState<string>('');
    const [publishDate, setPublishDate] = useState(() => aFechaHoraLocal());
    const [text, setText] = useState('');
    const [link, setLink] = useState('');
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [status, setStatus] = useState<PostStatus>('Programado');
    const [promotionCost, setPromotionCost] = useState('');
    const [performanceLikes, setPerformanceLikes] = useState('');
    const [adaptedVersions, setAdaptedVersions] = useState<Partial<Record<SocialPlatform, AdaptedPlatformVersion>>>({});
    const [publishResultBanner, setPublishResultBanner] = useState<string | null>(null);

    const [sendToWhatsApp, setSendToWhatsApp] = useState(false);

    // Data for selectors
    const [allEvents, setAllEvents] = useState<FiestaEnPlanificacion[]>([]);

    const activePost = postToEdit || postToDuplicate;
    const isWhatsAppSelected = platform === 'WhatsApp';

    const hasImage = useMemo(() => {
        if (mediaFile) return mediaFile.type.startsWith('image/');
        if (activePost?.mediaType === 'image') return true;
        if (mediaPreview && activePost?.mediaType !== 'video') return true;
        return false;
    }, [mediaFile, activePost, mediaPreview]);

    const hasVideo = useMemo(() => {
        if (mediaFile) return mediaFile.type.startsWith('video/');
        return activePost?.mediaType === 'video';
    }, [mediaFile, activePost]);

    const resetForm = useCallback((connsToUse?: SocialConnection[]) => {
        const isDuplicating = !!postToDuplicate;
        const connsList = connsToUse || connections;
        const preSelected = connsList
            .filter((c) => c.isConnected && ALL_PLATFORMS.some((p) => p.id === c.platform))
            .map((c) => c.platform as SocialPlatform);

        setPlatform(activePost?.platform || preSelected[0] || 'Instagram');
        setSelectedPlatforms(
            postToEdit && activePost?.platform
                ? [activePost.platform]
                : preSelected
        );
        setIsGeneralCampaign(activePost?.isGeneralCampaign ?? true);
        setEventId(activePost?.eventId || '');
        setPublishDate(isDuplicating || !activePost?.publishDate ? aFechaHoraLocal() : aFechaHoraLocal(activePost.publishDate));
        setText(activePost?.text || '');
        setLink(activePost?.link || '');
        setMediaFile(null);
        setMediaPreview(activePost?.mediaUrl || null);
        setStatus(isDuplicating ? 'Programado' : (activePost?.status || 'Programado'));
        setPromotionCost(isDuplicating ? '' : (activePost?.promotionCost?.toString() || ''));
        setPerformanceLikes(isDuplicating ? '' : (activePost?.performance?.likes?.toString() || ''));
        setSendToWhatsApp(false);
        setAdaptedVersions({});
        setPublishResultBanner(null);
    }, [activePost, postToDuplicate, postToEdit, connections]);

    useEffect(() => {
        if (isOpen) {
            const fetchInitialData = async () => {
                const [actual, historial, conns] = await Promise.all([
                    getFiestaActual().catch(() => null),
                    getHistorialFiestas().catch(() => []),
                    initialConnections ? Promise.resolve(initialConnections) : getSocialConnectionsPublicas().catch(() => []),
                ]);
                const all = [actual, ...(Array.isArray(historial) ? historial : [])].filter(Boolean) as FiestaEnPlanificacion[];
                setAllEvents(all);
                const validConns = Array.isArray(conns) ? conns : [];
                setConnections(validConns);
                resetForm(validConns);
            };
            fetchInitialData();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setMediaFile(file);
            setMediaPreview(URL.createObjectURL(file));
        }
    };

    const togglePlatform = (p: SocialPlatform) => {
        if (!connectedPlatformIds.has(p)) return;
        setSelectedPlatforms(prev =>
            prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
        );
    };

    const selectAllPlatforms = () => {
        const allConnected = ALL_PLATFORMS.filter(p => connectedPlatformIds.has(p.id)).map(p => p.id);
        if (selectedPlatforms.length === allConnected.length && allConnected.length > 0) {
            setSelectedPlatforms([]);
        } else {
            setSelectedPlatforms(allConnected);
        }
    };

    const handleAdaptarPorRed = async () => {
        if (!text.trim()) {
            toast({ title: 'Escribí primero el texto base', variant: 'destructive' });
            return;
        }
        const elegibles = selectedPlatforms.filter((p) => !getFaltaMediaPorRed(p, hasImage, hasVideo));
        if (elegibles.length === 0) {
            toast({ title: 'No hay redes elegibles seleccionadas', variant: 'destructive' });
            return;
        }
        setIsAdapting(true);
        try {
            const res = await adaptarTextoPorRedAction({
                textoBase: text,
                plataformas: elegibles,
                link,
            });
            if (res.success && res.versions) {
                setAdaptedVersions((prev) => ({ ...prev, ...res.versions }));
                toast({
                    title: res.aiUsed ? 'Versiones adaptadas con IA' : 'Versiones adaptadas por red',
                    description: 'Podés editar cada texto antes de publicar.',
                });
            } else {
                const fallback: Partial<Record<SocialPlatform, AdaptedPlatformVersion>> = {};
                for (const p of elegibles) {
                    fallback[p] = adaptarTextoFallbackPorRed(text, p, link);
                }
                setAdaptedVersions((prev) => ({ ...prev, ...fallback }));
            }
        } catch {
            const fallback: Partial<Record<SocialPlatform, AdaptedPlatformVersion>> = {};
            for (const p of elegibles) {
                fallback[p] = adaptarTextoFallbackPorRed(text, p, link);
            }
            setAdaptedVersions((prev) => ({ ...prev, ...fallback }));
        } finally {
            setIsAdapting(false);
        }
    };

    const updateAdaptedVersion = (plat: SocialPlatform, patch: Partial<AdaptedPlatformVersion>) => {
        setAdaptedVersions((prev) => {
            const current = prev[plat] || adaptarTextoFallbackPorRed(text, plat, link);
            return {
                ...prev,
                [plat]: {
                    ...current,
                    ...patch,
                },
            };
        });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setPublishResultBanner(null);

        const platformsRequested: SocialPlatform[] = postToEdit
            ? [platform as SocialPlatform]
            : selectedPlatforms;

        if (platformsRequested.length === 0) {
            toast({
                title: 'Seleccioná al menos una red conectada',
                variant: 'destructive',
            });
            setIsSaving(false);
            return;
        }

        const faltantesMedia: Array<{ platform: SocialPlatform; reason: string }> = [];
        const elegibles: SocialPlatform[] = [];

        for (const plat of platformsRequested) {
            const faltaReason = !postToEdit ? getFaltaMediaPorRed(plat, hasImage, hasVideo) : null;
            if (faltaReason) {
                faltantesMedia.push({ platform: plat, reason: faltaReason });
            } else {
                elegibles.push(plat);
            }
        }

        const crossPlatformGroupId = elegibles.length > 1 ? `grp_${Date.now()}` : undefined;
        let exitosas = 0;
        const fallos: Array<{ platform: SocialPlatform; reason: string }> = [...faltantesMedia];

        try {
            for (const plat of elegibles) {
                const version = adaptedVersions[plat];
                const rawText = version?.text || text;
                const cleanText = sanitizarTextoPublicacion(
                    plat === 'Pinterest' && version?.title && !rawText.startsWith(version.title)
                        ? `${version.title}\n\n${rawText}`
                        : rawText,
                );
                const finalLink = version?.link || link;

                const formData = new FormData();
                if (postToEdit) formData.append('id', postToEdit.id);

                formData.append('platform', plat);
                formData.append('isGeneralCampaign', String(isGeneralCampaign));
                if (!isGeneralCampaign && eventId) {
                    formData.append('eventId', eventId);
                    formData.append('eventName', allEvents.find(ev => ev.id === eventId)?.configuracion.nombreEvento || 'Evento');
                }
                formData.append('publishDate', aIsoUruguay(publishDate));
                formData.append('text', cleanText);
                if (finalLink) formData.append('link', finalLink);
                if (mediaFile) {
                    formData.append('mediaFile', mediaFile);
                } else if (activePost?.mediaUrl) {
                     formData.append('existingMediaUrl', activePost.mediaUrl);
                     if (activePost.mediaType) formData.append('existingMediaType', activePost.mediaType);
                }

                formData.append('status', status);
                if (crossPlatformGroupId) formData.append('crossPlatformGroupId', crossPlatformGroupId);

                if (promotionCost) formData.append('promotionCost', promotionCost);
                if (performanceLikes) formData.append('performance.likes', performanceLikes);

                const result = await saveSocialPost(formData);
                if (!result.success) {
                    fallos.push({ platform: plat, reason: result.error || 'No se pudo guardar' });
                    continue;
                }

                if (status === 'Publicado' && result.post?.id) {
                    const pubRes = await publicarPosteoAhoraAction(result.post.id);
                    if (!pubRes.success) {
                        fallos.push({ platform: plat, reason: pubRes.error || 'Error al publicar' });
                        continue;
                    }
                }

                exitosas++;
            }

            const total = platformsRequested.length;
            const mensajeFinal = armarFeedbackPublicacionMultiRed({
                publicadas: exitosas,
                total,
                motivosFallo: fallos,
            });

            if (fallos.length > 0) {
                setPublishResultBanner(mensajeFinal);
                toast({
                    title: mensajeFinal,
                    variant: exitosas > 0 ? 'default' : 'destructive',
                });
                if (exitosas > 0) {
                    onPostCreated();
                }
            } else {
                toast({
                    title: postToEdit
                        ? "Publicación Actualizada"
                        : `Publicado en ${exitosas} de ${total} redes`,
                    description: elegibles.join(', '),
                });

                if (elegibles.includes('WhatsApp') && sendToWhatsApp) {
                    const whatsAppText = encodeURIComponent(adaptedVersions.WhatsApp?.text || text);
                    const whatsAppUrl = `https://wa.me/?text=${whatsAppText}`;
                    window.open(whatsAppUrl, '_blank');
                    toast({ title: "Abriendo WhatsApp..." });
                }

                setIsOpen(false);
                onPostCreated();
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const dialogTitle = postToEdit ? 'Editar Publicación' : postToDuplicate ? 'Duplicar Publicación' : 'Nueva Publicación Multi-Red';
    const trigger = children ? <div onClick={() => setIsOpen(true)}>{children}</div> : (
        <Button variant="default" onClick={() => setIsOpen(true)}><PlusCircle className="w-5 h-5 mr-2" />Crear Publicación</Button>
    );

    const eligibleSelectedPlatforms = selectedPlatforms.filter((p) => !getFaltaMediaPorRed(p, hasImage, hasVideo));

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {!children && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="font-headline text-xl">{dialogTitle}</DialogTitle>
                    <DialogDescription>
                        {postToEdit
                            ? 'Editá los detalles del posteo.'
                            : 'Escribí tu posteo una sola vez y saldrá adaptado en todas las redes conectadas.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2 max-h-[80vh] overflow-y-auto pr-4">
                    {/* Selector Multi-Red conectado automáticamente (Orden 326 Bloque 4) */}
                    {!postToEdit ? (
                        <div className="space-y-2 rounded-xl border border-purple-100 bg-purple-50/50 p-3.5">
                            <div className="flex items-center justify-between">
                                <Label className="font-black text-slate-900 text-sm">
                                    Redes conectadas ({eligibleSelectedPlatforms.length} listas de {connectedPlatformIds.size} conectadas)
                                </Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs h-7 text-purple-700 hover:text-purple-900 font-bold"
                                    onClick={selectAllPlatforms}
                                >
                                    {selectedPlatforms.length === connectedPlatformIds.size && connectedPlatformIds.size > 0
                                        ? 'Deseleccionar todas'
                                        : '⚡ Seleccionar conectadas'}
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                                {ALL_PLATFORMS.map((plat) => {
                                    const estaConectada = connectedPlatformIds.has(plat.id);
                                    const faltaMedia = estaConectada ? getFaltaMediaPorRed(plat.id, hasImage, hasVideo) : null;
                                    const isSelected = estaConectada && selectedPlatforms.includes(plat.id);

                                    if (!estaConectada) {
                                        return (
                                            <div
                                                key={plat.id}
                                                className="flex items-center justify-between p-2 rounded-lg border border-slate-200 bg-slate-100/80 text-slate-400 text-xs"
                                            >
                                                <span className="font-medium">{plat.label}</span>
                                                <Link
                                                    href="/settings?tab=social-connections"
                                                    className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-slate-300 text-purple-700 hover:bg-purple-50"
                                                >
                                                    Conectar
                                                </Link>
                                            </div>
                                        );
                                    }

                                    return (
                                        <button
                                            key={plat.id}
                                            type="button"
                                            onClick={() => togglePlatform(plat.id)}
                                            aria-pressed={isSelected}
                                            className={`flex flex-col items-start justify-between p-2 rounded-lg border text-left text-xs transition ${
                                                faltaMedia
                                                    ? 'bg-slate-200 text-slate-500 border-slate-300'
                                                    : isSelected
                                                    ? 'bg-purple-600 text-white border-purple-700 shadow-sm font-bold'
                                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 font-bold'
                                            }`}
                                        >
                                            <div className="w-full flex items-center justify-between gap-1">
                                                <span className="font-bold">{plat.label}</span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                                    faltaMedia
                                                        ? 'bg-slate-300 text-slate-600'
                                                        : isSelected
                                                        ? 'bg-white/20 text-white'
                                                        : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {faltaMedia ? '—' : isSelected ? '✓' : '+'}
                                                </span>
                                            </div>
                                            {faltaMedia && (
                                                <span className="text-[10px] text-slate-600 mt-0.5 leading-tight">
                                                    {plat.label}: {faltaMedia}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <Label htmlFor="platform">Plataforma</Label>
                            <Select value={platform} onValueChange={(val) => setPlatform(val as SocialPlatform | 'WhatsApp')}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    {ALL_PLATFORMS.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.label} — {p.badge}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1"><Label htmlFor="publishDate">Fecha y Hora de Publicación</Label><Input id="publishDate" type="datetime-local" value={publishDate} onChange={e => setPublishDate(e.target.value)} required /></div>
                        <div className="space-y-1"><Label htmlFor="status">Estado Inicial</Label><Select value={status} onValueChange={(val) => setStatus(val as PostStatus)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Programado">Programado</SelectItem><SelectItem value="Publicado">Publicado</SelectItem><SelectItem value="Listo para copiar">Listo para copiar</SelectItem><SelectItem value="Borrador">Borrador</SelectItem></SelectContent></Select></div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="isGeneralCampaign" checked={isGeneralCampaign} onCheckedChange={(checked) => setIsGeneralCampaign(!!checked)} />
                        <Label htmlFor="isGeneralCampaign">Es una campaña general (no vinculada a una fiesta)</Label>
                    </div>
                    {!isGeneralCampaign && (
                         <div className="space-y-1"><Label htmlFor="eventId">Vincular a Fiesta</Label><Select value={eventId} onValueChange={setEventId}><SelectTrigger><SelectValue placeholder="Seleccionar evento..."/></SelectTrigger><SelectContent>{allEvents.map(event => (<SelectItem key={event.id} value={event.id}>{event.configuracion.nombreEvento}</SelectItem>))}</SelectContent></Select></div>
                    )}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                            <Label htmlFor="text">Texto de la Publicación</Label>
                            {!postToEdit && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAdaptarPorRed}
                                    disabled={isAdapting || !text.trim() || eligibleSelectedPlatforms.length === 0}
                                    className="h-7 text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
                                >
                                    {isAdapting ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 mr-1" />}
                                    Adaptar con IA por red
                                </Button>
                            )}
                        </div>
                        <Textarea id="text" value={text} onChange={e => setText(e.target.value)} rows={5} placeholder="Escribí tu post aquí..." required />
                    </div>

                    {/* Versiones adaptadas editables antes de publicar (Orden 326 Bloque 4) */}
                    {!postToEdit && Object.keys(adaptedVersions).length > 0 && (
                        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                                <Sparkles className="w-4 h-4 text-purple-600" />
                                <span>Versiones adaptadas por red (editables antes de publicar)</span>
                            </div>
                            {eligibleSelectedPlatforms.map((plat) => {
                                const ver = adaptedVersions[plat];
                                if (!ver) return null;
                                return (
                                    <div key={plat} className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-900">{plat}</span>
                                            {plat === 'Google' && (
                                                <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold">
                                                    Botón: {ver.ctaLabel || 'Consultar'}
                                                </span>
                                            )}
                                            {plat === 'X' && (
                                                <span className="text-[10px] text-slate-500">
                                                    {ver.text.length}/280
                                                </span>
                                            )}
                                        </div>
                                        {plat === 'Pinterest' && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                <Input
                                                    value={ver.title || ''}
                                                    onChange={(e) => updateAdaptedVersion(plat, { title: e.target.value })}
                                                    placeholder="Título para Pinterest"
                                                    className="h-8 text-xs"
                                                />
                                                <Input
                                                    value={ver.link || ''}
                                                    onChange={(e) => updateAdaptedVersion(plat, { link: e.target.value })}
                                                    placeholder="Enlace web"
                                                    className="h-8 text-xs"
                                                />
                                            </div>
                                        )}
                                        <Textarea
                                            value={ver.text}
                                            onChange={(e) => updateAdaptedVersion(plat, { text: e.target.value })}
                                            rows={3}
                                            className="text-xs"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1"><Label htmlFor="link">Enlace (Opcional)</Label><Input id="link" value={link} onChange={e => setLink(e.target.value)} placeholder="https://akproducciones.uy" /></div>
                        <div className="space-y-1"><Label htmlFor="promotionCost">Inversión Publicitaria ($)</Label><Input id="promotionCost" type="number" min={0} value={promotionCost} onChange={e => setPromotionCost(e.target.value)} placeholder="0" /></div>
                    </div>
                     <div className="space-y-1">
                        <Label>Imagen o Video</Label>
                        <div className="flex gap-2">
                           <Input id="mediaFile" type="file" accept="image/*,video/*" onChange={handleFileChange} className="flex-grow"/>
                        </div>
                     {mediaPreview && <div className="mt-2"><NextImage src={mediaPreview} alt="Vista previa" width={150} height={150} className="rounded-md object-cover"/></div>}
                     </div>
                     <Separator/>

                     {isWhatsAppSelected ? (
                        <div className="p-3 border rounded-lg bg-green-50/60 border-green-200 text-green-950">
                            <div className="flex items-center justify-between">
                            <Label htmlFor="sendToWhatsApp" className="flex flex-col space-y-1">
                                <span className="font-medium flex items-center gap-2">
                                    <Send className="w-4 h-4 text-green-600"/> Abrir en WhatsApp al Guardar
                                </span>
                                <span className="text-xs font-normal leading-snug text-green-700">
                                    Te deja el texto listo y abre WhatsApp para compartirlo en un estado o chat.
                                </span>
                            </Label>
                            <Switch id="sendToWhatsApp" checked={sendToWhatsApp} onCheckedChange={setSendToWhatsApp} />
                            </div>
                        </div>
                     ) : (
                         <div className="p-3 border rounded-lg bg-emerald-50/60 border-emerald-200 text-emerald-950">
                            <p className="text-xs leading-relaxed"><span className="font-bold">Multi-red inteligente:</span> Se publicará en las redes conectadas que cumplan sus requisitos de foto o video. Las redes sin imagen o video quedan en gris sin frenar a las demás.</p>
                        </div>
                     )}

                     {publishResultBanner && (
                        <div role="status" className="p-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-950 text-xs font-semibold flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <span>{publishResultBanner}</span>
                        </div>
                     )}

                     <Separator/>
                     <h4 className="font-medium text-sm text-muted-foreground">Rendimiento (Opcional)</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1"><Label htmlFor="promotionCostPerf">Costo Promoción ($)</Label><Input id="promotionCostPerf" type="number" min={0} value={promotionCost} onChange={e => setPromotionCost(e.target.value)} placeholder="0.00" /></div>
                        <div className="space-y-1"><Label htmlFor="likes">Likes / Reacciones</Label><Input id="likes" type="number" value={performanceLikes} onChange={e => setPerformanceLikes(e.target.value)} placeholder="0" /></div>
                    </div>
                    <DialogFooter className="pt-3">
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>Cancelar</Button>
                        <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}{postToEdit ? 'Actualizar' : 'Publicar / Crear'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
