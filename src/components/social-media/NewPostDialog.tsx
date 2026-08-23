
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
import { PlusCircle, Loader2, Sparkles, Wand2, Send, Link as LinkIcon, Lock, Image as ImageIcon } from 'lucide-react';
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
    }, [activePost, postToDuplicate]);

    useEffect(() => {
        if (isOpen) {
            resetForm();
            const fetchInitialData = async () => {
                const [actual, historial] = await Promise.all([getFiestaActual(), getHistorialFiestas()]);
                const all = [actual, ...(Array.isArray(historial) ? historial : [])].filter(Boolean) as FiestaEnPlanificacion[];
                setAllEvents(all);
            };
            fetchInitialData();
        }
    }, [isOpen, resetForm]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setMediaFile(file);
            setMediaPreview(URL.createObjectURL(file));
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
        if (mediaFile) {
            formData.append('mediaFile', mediaFile);
        } else if (activePost?.mediaUrl) { // Carry over existing media if no new file
             formData.append('existingMediaUrl', activePost.mediaUrl);
             if(activePost.mediaType) formData.append('existingMediaType', activePost.mediaType);
        }
        
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
        <Button variant="default" onClick={() => setIsOpen(true)}><PlusCircle className="w-5 h-5 mr-2" />Crear Publicación</Button>
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
                        <div className="space-y-1">
                            <Label htmlFor="platform">Plataforma</Label>
                            <Select value={platform} onValueChange={(val) => setPlatform(val as SocialPlatform | 'WhatsApp')}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Instagram">Instagram — Sale solo a la hora que elijas</SelectItem>
                                    <SelectItem value="Facebook">Facebook — Sale solo a la hora que elijas</SelectItem>
                                    <SelectItem value="TikTok">TikTok — Te lo dejamos listo para copiar</SelectItem>
                                    <SelectItem value="WhatsApp">WhatsApp — Te lo dejamos listo para copiar</SelectItem>
                                    <SelectItem value="Threads">Threads — Te lo dejamos listo para copiar</SelectItem>
                                    <SelectItem value="X">X (Twitter) — Te lo dejamos listo para copiar</SelectItem>
                                    <SelectItem value="Pinterest">Pinterest — Te lo dejamos listo para copiar</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1"><Label htmlFor="link">Enlace (Opcional)</Label><Input id="link" value={link} onChange={e => setLink(e.target.value)} placeholder="https://ejemplo.com" /></div>
                        <div className="space-y-1"><Label htmlFor="status">Estado</Label><Select value={status} onValueChange={(val) => setStatus(val as PostStatus)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Programado">Programado</SelectItem><SelectItem value="Publicado">Publicado</SelectItem><SelectItem value="Listo para copiar">Listo para copiar</SelectItem><SelectItem value="Borrador">Borrador</SelectItem></SelectContent></Select></div>
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
                     ) : platform === 'Instagram' || platform === 'Facebook' ? (
                         <div className="p-3 border rounded-lg bg-emerald-50/60 border-emerald-200 text-emerald-950">
                            <p className="text-xs leading-relaxed"><span className="font-bold">Publicación automática:</span> {platform} se publicará de forma autónoma a la hora elegida usando la conexión configurada en Ajustes.</p>
                        </div>
                     ) : (
                         <div className="p-3 border rounded-lg bg-amber-50/60 border-amber-200 text-amber-950">
                            <p className="text-xs leading-relaxed"><span className="font-bold">Listo para copiar:</span> Esta red no admite publicación automática desatendida. Te dejamos el texto y la foto listos para copiar y subir en 1 toque.</p>
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
