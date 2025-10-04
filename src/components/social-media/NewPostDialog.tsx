
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
  DialogClose,
} from "@/components/ui/dialog";
import { PlusCircle, Loader2, Sparkles, Wand2, Send, Link as LinkIcon, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveSocialPost } from '@/app/actions/social-media';
import type { SocialPost, SocialPlatform, PostStatus } from '@/types/social-media';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import NextImage from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { getFiestaActual, getHistorialFiestas } from '@/app/actions/fiesta-actual';
import { generateSocialPost, type GenerateSocialPostInput } from '@/ai/flows/generate-social-post-flow';


interface NewPostDialogProps {
    onPostCreated: () => void;
    postToEdit?: SocialPost | null;
    postToDuplicate?: SocialPost | null;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    children?: React.ReactNode;
}

export function NewPostDialog({ 
    onPostCreated, 
    postToEdit,
    postToDuplicate,
    isOpen: controlledIsOpen,
    onOpenChange: setControlledIsOpen,
    children 
}: NewPostDialogProps) {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isOpen = controlledIsOpen ?? internalIsOpen;
    const setIsOpen = setControlledIsOpen ?? setInternalIsOpen;

    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    
    // Form state
    const [platform, setPlatform] = useState<SocialPlatform | 'WhatsApp'>('Instagram');
    const [isGeneralCampaign, setIsGeneralCampaign] = useState(true);
    const [eventId, setEventId] = useState<string>('');
    const [publishDate, setPublishDate] = useState(new Date().toISOString().substring(0, 16));
    const [text, setText] = useState('');
    const [link, setLink] = useState('');
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [status, setStatus] = useState<PostStatus>('Programado');
    const [promotionCost, setPromotionCost] = useState('');
    const [performanceLikes, setPerformanceLikes] = useState('');
    
    const [sendToWhatsApp, setSendToWhatsApp] = useState(false);

    // AI State
    const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiSelectedEventId, setAiSelectedEventId] = useState<string>('');
    const [aiStyle, setAiStyle] = useState<'promocional' | 'elegante' | 'divertida'>('promocional');

    // Data for selectors
    const [allEvents, setAllEvents] = useState<FiestaEnPlanificacion[]>([]);
    
    const activePost = postToEdit || postToDuplicate;
    const isWhatsAppSelected = platform === 'WhatsApp';

    const resetForm = useCallback(() => {
        const isDuplicating = !!postToDuplicate;
        setPlatform(activePost?.platform || 'Instagram');
        setIsGeneralCampaign(activePost?.isGeneralCampaign ?? true);
        setEventId(activePost?.eventId || '');
        setPublishDate(isDuplicating ? new Date().toISOString().substring(0, 16) : (activePost?.publishDate ? new Date(activePost.publishDate).toISOString().substring(0, 16) : new Date().toISOString().substring(0, 16)));
        setText(activePost?.text || '');
        setLink(activePost?.link || '');
        setMediaFile(null);
        setMediaPreview(activePost?.mediaUrl || null);
        setStatus(isDuplicating ? 'Programado' : (activePost?.status || 'Programado'));
        setPromotionCost(isDuplicating ? '' : (activePost?.promotionCost?.toString() || ''));
        setPerformanceLikes(isDuplicating ? '' : (activePost?.performance?.likes?.toString() || ''));
        setSendToWhatsApp(false);
        setIsAiPanelOpen(false);
        setAiSelectedEventId('');
    }, [activePost, postToDuplicate]);

    useEffect(() => {
        if (isOpen) {
            resetForm();
            const fetchInitialData = async () => {
                const [actual, historial] = await Promise.all([getFiestaActual(), getHistorialFiestas()]);
                const all = [actual, ...historial].filter(Boolean) as FiestaEnPlanificacion[];
                setAllEvents(all);
                 if (activePost?.eventId) {
                    setAiSelectedEventId(activePost.eventId);
                } else if (actual) {
                    setAiSelectedEventId(actual.id);
                }
            };
            fetchInitialData();
        }
    }, [isOpen, resetForm, activePost]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setMediaFile(file);
            setMediaPreview(URL.createObjectURL(file));
        }
    };
    
    const handleGenerateWithAI = async () => {
        if (!aiSelectedEventId) {
            toast({ title: "Selecciona un evento", description: "Debes seleccionar un evento para generar el texto.", variant: "destructive" });
            return;
        }
        setIsGenerating(true);
        try {
            const selectedEvent = allEvents.find(e => e.id === aiSelectedEventId);
            if (!selectedEvent) throw new Error("Evento no encontrado.");
            
            const input: GenerateSocialPostInput = {
                eventName: selectedEvent.configuracion.nombreEvento,
                eventType: typeof selectedEvent.configuracion.tipoCelebracion === 'string' ? selectedEvent.configuracion.tipoCelebracion : 'Evento',
                eventDate: selectedEvent.configuracion.fechaEvento ? new Date(selectedEvent.configuracion.fechaEvento).toLocaleDateString('es-ES') : 'Próximamente',
                style: aiStyle,
            };
            
            const result = await generateSocialPost(input);
            setText(result.postText);
            toast({ title: "¡Texto Generado!", description: "El texto se ha insertado en el campo de la publicación."});
            setIsAiPanelOpen(false);
        } catch(e: any) {
            toast({ title: "Error de IA", description: e.message, variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData();
        if (postToEdit) formData.append('id', postToEdit.id);
        
        formData.append('platform', platform);
        formData.append('isGeneralCampaign', String(isGeneralCampaign));
        if (!isGeneralCampaign && eventId) {
            formData.append('eventId', eventId);
            formData.append('eventName', allEvents.find(e => e.id === eventId)?.configuracion.nombreEvento || 'Evento');
        }
        formData.append('publishDate', new Date(publishDate).toISOString());
        formData.append('text', text);
        if (link) formData.append('link', link);
        if (mediaFile) formData.append('mediaFile', mediaFile);
        if (activePost?.mediaUrl && !mediaFile) formData.append('existingMediaUrl', activePost.mediaUrl);
        if (activePost?.mediaType && !mediaFile) formData.append('existingMediaType', activePost.mediaType);
        
        formData.append('status', status);
        
        if (promotionCost) formData.append('promotionCost', promotionCost);
        if (performanceLikes) formData.append('performance.likes', performanceLikes);
        
        try {
            const result = await saveSocialPost(formData);
            if (result.success) {
                toast({ title: postToEdit ? "Publicación Actualizada" : (postToDuplicate ? "Publicación Duplicada" : "Publicación Creada") });

                if (isWhatsAppSelected && sendToWhatsApp) {
                    const whatsAppText = encodeURIComponent(text);
                    const whatsAppUrl = `https://wa.me/?text=${whatsAppText}`;
                    window.open(whatsAppUrl, '_blank');
                    toast({title: "Abriendo WhatsApp..."});
                }
                
                setIsOpen(false);
                onPostCreated();
            } else {
                throw new Error(result.error || "No se pudo guardar la publicación.");
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const dialogTitle = postToEdit ? 'Editar Publicación' : postToDuplicate ? 'Duplicar Publicación' : 'Nueva Publicación';
    const trigger = children ? <div onClick={() => setIsOpen(true)}>{children}</div> : (
        <Button variant="default"><PlusCircle className="w-5 h-5 mr-2" />Crear Publicación</Button>
    );

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {!children && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="font-headline text-xl">{dialogTitle}</DialogTitle>
                    <DialogDescription>Completa los detalles de tu post para redes sociales.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-2 max-h-[80vh] overflow-y-auto pr-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1"><Label htmlFor="platform">Plataforma</Label><Select value={platform} onValueChange={(val) => setPlatform(val as SocialPlatform | 'WhatsApp')}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Instagram">Instagram</SelectItem><SelectItem value="Facebook">Facebook</SelectItem><SelectItem value="TikTok">TikTok</SelectItem><SelectItem value="WhatsApp">WhatsApp</SelectItem></SelectContent></Select></div>
                        <div className="space-y-1"><Label htmlFor="publishDate">Fecha y Hora de Publicación</Label><Input id="publishDate" type="datetime-local" value={publishDate} onChange={e => setPublishDate(e.target.value)} required /></div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="isGeneralCampaign" checked={isGeneralCampaign} onCheckedChange={(checked) => setIsGeneralCampaign(!!checked)} />
                        <Label htmlFor="isGeneralCampaign">Es una campaña general (no vinculada a una fiesta)</Label>
                    </div>
                    {!isGeneralCampaign && (
                         <div className="space-y-1"><Label htmlFor="eventId">Vincular a Fiesta</Label><Select value={eventId} onValueChange={setEventId}><SelectTrigger><SelectValue placeholder="Seleccionar evento..."/></SelectTrigger><SelectContent>{allEvents.map(event => (<SelectItem key={event.id} value={event.id}>{event.configuracion.nombreEvento}</SelectItem>))}</SelectContent></Select></div>
                    )}
                    <div className="space-y-1"><Label htmlFor="text">Texto de la Publicación</Label><Textarea id="text" value={text} onChange={e => setText(e.target.value)} rows={6} placeholder="Escribe tu post aquí..." required /></div>
                    
                    <Card className="bg-muted/50 border-dashed">
                        <CardHeader className="p-3">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-md font-medium flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary"/>Asistente de Redacción IA</CardTitle>
                                <Button type="button" variant="secondary" size="sm" onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}>
                                    {isAiPanelOpen ? 'Cerrar Asistente' : 'Redactar con IA'}
                                </Button>
                            </div>
                        </CardHeader>
                        {isAiPanelOpen && (
                            <CardContent className="p-3 pt-0 space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1"><Label htmlFor="ai-event">Basado en el evento:</Label><Select value={aiSelectedEventId} onValueChange={setAiSelectedEventId}><SelectTrigger><SelectValue placeholder="Seleccionar evento"/></SelectTrigger><SelectContent>{allEvents.map(e => <SelectItem key={e.id} value={e.id}>{e.configuracion.nombreEvento}</SelectItem>)}</SelectContent></Select></div>
                                    <div className="space-y-1"><Label htmlFor="ai-style">Estilo del Post:</Label><Select value={aiStyle} onValueChange={(v) => setAiStyle(v as any)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="promocional">Promocional</SelectItem><SelectItem value="elegante">Elegante</SelectItem><SelectItem value="divertida">Divertido</SelectItem></SelectContent></Select></div>
                                </div>
                                <Button type="button" className="w-full" onClick={handleGenerateWithAI} disabled={isGenerating || !aiSelectedEventId}>
                                    {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Wand2 className="w-4 h-4 mr-2"/>}
                                    {isGenerating ? 'Generando...' : 'Generar Texto'}
                                </Button>
                            </CardContent>
                        )}
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1"><Label htmlFor="link">Enlace (Opcional)</Label><Input id="link" value={link} onChange={e => setLink(e.target.value)} placeholder="https://ejemplo.com" /></div>
                        <div className="space-y-1"><Label htmlFor="status">Estado</Label><Select value={status} onValueChange={(val) => setStatus(val as PostStatus)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Programado">Borrador / Programado</SelectItem><SelectItem value="Publicado">Publicado (Manual)</SelectItem></SelectContent></Select></div>
                    </div>
                     <div className="space-y-1"><Label htmlFor="mediaFile">Imagen o Video</Label><Input id="mediaFile" type="file" accept="image/*,video/*" onChange={handleFileChange} />
                     {mediaPreview && <div className="mt-2"><NextImage src={mediaPreview} alt="Vista previa" width={150} height={150} className="rounded-md object-cover"/></div>}
                     </div>
                     <Separator/>

                     {isWhatsAppSelected ? (
                        <div className="p-3 border rounded-lg bg-card">
                            <div className="flex items-center justify-between">
                            <Label htmlFor="sendToWhatsApp" className="flex flex-col space-y-1">
                                <span className="font-medium flex items-center gap-2">
                                    <Send className="w-4 h-4 text-green-500"/> Abrir en WhatsApp al Guardar
                                </span>
                                <span className="text-xs font-normal leading-snug text-muted-foreground">
                                    Generará un enlace para compartir el mensaje.
                                </span>
                            </Label>
                            <Switch id="sendToWhatsApp" checked={sendToWhatsApp} onCheckedChange={setSendToWhatsApp} />
                            </div>
                        </div>
                     ) : (
                         <div className="p-3 border rounded-lg bg-card text-muted-foreground">
                           <p className="text-sm"><span className="font-medium text-foreground">Planifica tu contenido aquí.</span> Cuando sea el momento de publicar, simplemente copia el texto y la imagen para pegarlo en tu red social.</p>
                        </div>
                     )}

                     <Separator/>
                     <h4 className="font-medium text-sm text-muted-foreground">Rendimiento (Opcional)</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1"><Label htmlFor="promotionCost">Costo Promoción ($)</Label><Input id="promotionCost" type="number" value={promotionCost} onChange={e => setPromotionCost(e.target.value)} placeholder="0.00" /></div>
                        <div className="space-y-1"><Label htmlFor="likes">Likes / Reacciones</Label><Input id="likes" type="number" value={performanceLikes} onChange={e => setPerformanceLikes(e.target.value)} placeholder="0" /></div>
                    </div>
                    <DialogFooter className="pt-3">
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>Cancelar</Button>
                        <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}{postToEdit ? 'Actualizar' : 'Crear'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
