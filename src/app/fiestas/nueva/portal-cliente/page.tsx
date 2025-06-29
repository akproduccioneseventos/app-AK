
'use client';

import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, ClientPortalSettings, EventWebPageSettings, SocialGallerySettings } from '@/types/fiesta';
import { getFiestaActual, updateClientPortalSettings, updateWebPageSettingsFiestaActual, updateSocialGallerySettings } from '@/app/actions/fiesta-actual';
import { defaultClientPortalSettings, defaultWebPageSettings, defaultSocialGallerySettings } from '@/lib/fiesta-defaults';
import QRCodeStylized from 'qrcode.react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import NextImage from 'next/image';
import {
  ArrowLeft, Save, Loader2, AlertTriangle, Globe, Eye,
  ClipboardCheck, FileText, Banknote, FileSignature, Users,
  Music2, ChefHat, Image as ImageIcon, Trash2, ExternalLink, Lock, Camera, QrCode
} from 'lucide-react';

type PortalSettingsForm = {
    portal: ClientPortalSettings;
    web: EventWebPageSettings;
    social: SocialGallerySettings;
};

export default function PortalClientePage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<PortalSettingsForm>({
        portal: defaultClientPortalSettings,
        web: defaultWebPageSettings,
        social: defaultSocialGallerySettings,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fiestaId, setFiestaId] = useState<string>('');

    const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
    const [storyImagePreview, setStoryImagePreview] = useState<string | null>(null);
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

    const loadSettings = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fiestaData = await getFiestaActual();
            setFiestaId(fiestaData.id);
            setSettings({
                portal: fiestaData.clientPortalSettings || defaultClientPortalSettings,
                web: fiestaData.webPageSettings || defaultWebPageSettings,
                social: fiestaData.socialGallerySettings || defaultSocialGallerySettings,
            });
            setCoverImagePreview(fiestaData.webPageSettings?.coverImageUrl || null);
            setStoryImagePreview(fiestaData.webPageSettings?.ourStoryImageUrl || null);
            setGalleryPreviews(fiestaData.webPageSettings?.galleryImageUrls || []);
        } catch (err: any) {
            setError("No se pudo cargar la configuración del portal.");
            toast({ title: "Error al Cargar", description: err.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);
    
    const handlePortalSettingChange = (key: keyof ClientPortalSettings, value: boolean | string) => {
        setSettings(prev => ({ ...prev, portal: { ...prev.portal, [key]: value } }));
    };
    
    const handleWebSettingChange = (key: keyof EventWebPageSettings, value: string | boolean) => {
        setSettings(prev => ({ ...prev, web: { ...prev.web, [key]: value } }));
    };

    const handleSocialSettingChange = (key: keyof SocialGallerySettings, value: boolean) => {
        setSettings(prev => ({ ...prev, social: { ...prev.social, [key]: value } }));
    };

    const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>, setPreview: React.Dispatch<React.SetStateAction<string | null>>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => { setPreview(reader.result as string); };
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    };
    
    const handleGalleryImagesChange = (event: ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            const newPreviews = Array.from(files).map(file => URL.createObjectURL(file));
            setGalleryPreviews(prev => [...prev, ...newPreviews].slice(-10));
        }
    };

    const removeGalleryImage = (indexToRemove: number) => {
        setGalleryPreviews(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        
        const finalWebSettings: EventWebPageSettings = {
            ...settings.web,
            coverImageUrl: coverImagePreview || undefined,
            ourStoryImageUrl: storyImagePreview || undefined,
            galleryImageUrls: galleryPreviews,
        };

        try {
            const [portalResult, webResult, socialResult] = await Promise.all([
                updateClientPortalSettings(settings.portal),
                updateWebPageSettingsFiestaActual(finalWebSettings),
                updateSocialGallerySettings(settings.social)
            ]);

            if (portalResult.success && webResult.success && socialResult.success) {
                toast({ title: "¡Configuración Guardada!", description: "Se han guardado todas las configuraciones." });
                if (portalResult.updatedData) setSettings(prev => ({ ...prev, portal: portalResult.updatedData! }));
                if (webResult.updatedData) {
                  setSettings(prev => ({ ...prev, web: webResult.updatedData! }));
                  setCoverImagePreview(webResult.updatedData.coverImageUrl || null);
                  setStoryImagePreview(webResult.updatedData.ourStoryImageUrl || null);
                  setGalleryPreviews(webResult.updatedData.galleryImageUrls || []);
                }
                 if (socialResult.updatedData) setSettings(prev => ({ ...prev, social: socialResult.updatedData! }));
            } else {
                throw new Error(portalResult.error || webResult.error || socialResult.error || "Error desconocido al guardar.");
            }
        } catch (err: any) {
            toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    if (error) return <div className="text-center text-destructive p-4"><AlertTriangle className="mx-auto w-10 h-10 mb-2"/>{error}</div>;

    const portalSections = [
        { id: "showPresupuesto", label: "Presupuesto Detallado", icon: FileText },
        { id: "showPagos", label: "Resumen de Pagos", icon: Banknote },
        { id: "showContrato", label: "Contrato del Evento", icon: FileSignature },
        { id: "showInvitados", label: "Lista de Invitados y RSVP", icon: Users },
        { id: "showMusica", label: "Selección de Música", icon: Music2 },
        { id: "showMenu", label: "Menú Contratado", icon: ChefHat },
    ];

    const webSections = [
        { id: "showCountdown", label: "Contador Regresivo" },
        { id: "showOurStory", label: "Nuestra Historia" },
        { id: "showEventDetails", label: "Detalles del Evento" },
        { id: "showDressCode", label: "Código de Vestimenta" },
        { id: "showGiftRegistry", label: "Lista de Regalos" },
        { id: "showGallery", label: "Galería de Fotos" },
        { id: "showRsvp", label: "Formulario de Confirmación (RSVP)" },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ClipboardCheck className="w-8 h-8 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Portal del Cliente y Página Pública</h1>
                </div>
                <Link href="/fiestas/nueva" passHref><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Columna Izquierda: Portal del Cliente */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="shadow-lg sticky top-20">
                            <CardHeader>
                                <CardTitle className="font-headline text-xl">Portal Privado del Cliente</CardTitle>
                                <CardDescription>Controla qué información puede ver tu cliente.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                                    <Label htmlFor="portal-enabled" className="text-base font-medium">Activar Portal</Label>
                                    <Switch id="portal-enabled" checked={settings.portal.enabled} onCheckedChange={(val) => handlePortalSettingChange('enabled', val)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="portal-password" className="flex items-center gap-2"><Lock className="w-4 h-4 text-primary/80"/>Contraseña de Acceso</Label>
                                    <Input 
                                        id="portal-password"
                                        type="text"
                                        value={settings.portal.accessKey || ''}
                                        onChange={(e) => handlePortalSettingChange('accessKey', e.target.value)}
                                        placeholder="Deja en blanco para acceso público"
                                        disabled={!settings.portal.enabled || isSaving}
                                    />
                                    <p className="text-xs text-muted-foreground">Si estableces una contraseña, tu cliente deberá ingresarla para ver el portal.</p>
                                </div>
                                <Separator />
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-muted-foreground">Secciones Visibles para el Cliente:</h4>
                                    {portalSections.map(section => (
                                        <div key={section.id} className="flex items-center justify-between text-sm">
                                            <Label htmlFor={`portal-${section.id}`} className="flex items-center gap-2 font-normal">
                                                <section.icon className="w-4 h-4 text-primary/80"/>{section.label}
                                            </Label>
                                            <Switch id={`portal-${section.id}`} checked={settings.portal[section.id as keyof ClientPortalSettings] as boolean} onCheckedChange={(val) => handlePortalSettingChange(section.id as keyof ClientPortalSettings, val)} disabled={!settings.portal.enabled} />
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-2">
                                     <a href="/portal" target="_blank" rel="noopener noreferrer">
                                        <Button type="button" variant="outline" size="sm" className="w-full">
                                            <Eye className="w-4 h-4 mr-2"/> Previsualizar Portal del Cliente
                                        </Button>
                                    </a>
                                </div>
                            </CardContent>
                        </Card>
                         <Card className="shadow-lg scroll-mt-24" id="social-gallery">
                            <CardHeader>
                                <CardTitle className="font-headline text-xl flex items-center gap-2"><Camera className="w-6 h-6 text-primary"/>Galería Social Interactiva</CardTitle>
                                <CardDescription>Activa una galería en vivo para que los invitados suban fotos.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                                    <Label htmlFor="social-gallery-enabled" className="text-base font-medium">Activar Galería Social</Label>
                                    <Switch id="social-gallery-enabled" checked={settings.social.enabled} onCheckedChange={(val) => handleSocialSettingChange('enabled', val)} />
                                </div>
                                {settings.social.enabled && (
                                <div className="space-y-4 pt-4 border-t">
                                    <div className="flex items-center justify-between text-sm">
                                        <Label htmlFor="social-likes-enabled" className="font-normal">Permitir "Me Gusta"</Label>
                                        <Switch id="social-likes-enabled" checked={settings.social.allowLikes} onCheckedChange={(val) => handleSocialSettingChange('allowLikes', val)} />
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <Label htmlFor="social-comments-enabled" className="font-normal">Permitir Comentarios</Label>
                                        <Switch id="social-comments-enabled" checked={settings.social.allowComments} onCheckedChange={(val) => handleSocialSettingChange('allowComments', val)} />
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <Label htmlFor="social-uploads-enabled" className="font-normal">Permitir Subir Fotos</Label>
                                        <Switch id="social-uploads-enabled" checked={settings.social.uploadsActive} onCheckedChange={(val) => handleSocialSettingChange('uploadsActive', val)} />
                                    </div>
                                    <Separator />
                                    <div className="space-y-2">
                                        <Label>Enlace y QR para Invitados</Label>
                                        <div className="flex gap-2">
                                            <Input value={`${typeof window !== 'undefined' ? window.location.origin : ''}/evento/social/${fiestaId}`} readOnly />
                                            <Button type="button" size="sm" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/evento/social/${fiestaId}`); toast({title: "Enlace Copiado"}); }}>Copiar</Button>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <QRCodeStylized value={`${typeof window !== 'undefined' ? window.location.origin : ''}/evento/social/${fiestaId}`} size={128} />
                                        <p className="text-xs text-muted-foreground">Muestra este QR en el evento.</p>
                                    </div>
                                </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Columna Derecha: Página Pública */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle className="font-headline text-xl">Página Pública del Evento</CardTitle>
                                <CardDescription>Configura la página que compartirás con los invitados.</CardDescription>
                                 <a href="/evento/actual" target="_blank" rel="noopener noreferrer">
                                    <Button type="button" variant="secondary" size="sm" className="mt-2">
                                        <ExternalLink className="w-4 h-4 mr-2"/> Ver Página Pública
                                    </Button>
                                </a>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <h3 className="text-lg font-medium font-headline text-primary border-b pb-2">Información General</h3>
                                <div className="space-y-2"><Label htmlFor="page-title">Título</Label><Input id="page-title" value={settings.web.pageTitle || ''} onChange={(e) => handleWebSettingChange('pageTitle', e.target.value)} /></div>
                                <div className="space-y-2"><Label htmlFor="hero-subtitle">Subtítulo</Label><Input id="hero-subtitle" value={settings.web.heroSubtitle || ''} onChange={(e) => handleWebSettingChange('heroSubtitle', e.target.value)} /></div>
                                <div className="space-y-2"><Label htmlFor="welcome-message">Mensaje de Bienvenida</Label><Textarea id="welcome-message" value={settings.web.welcomeMessage || ''} onChange={(e) => handleWebSettingChange('welcomeMessage', e.target.value)} rows={3} /></div>
                                <div className="space-y-2"><Label htmlFor="cover-image-upload">Imagen de Portada</Label><Input id="cover-image-upload" type="file" accept="image/*" onChange={(e) => handleImageFileChange(e, setCoverImagePreview)} />
                                {coverImagePreview && <NextImage src={coverImagePreview} alt="Vista previa Portada" width={200} height={120} className="rounded object-cover mt-2" data-ai-hint="event cover photo"/>}</div>

                                <Separator />
                                <h3 className="text-lg font-medium font-headline text-primary border-b pb-2">Secciones Visibles para Invitados</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {webSections.map(section => (
                                    <div key={section.id} className="flex items-center space-x-2">
                                        <Checkbox id={`web-${section.id}`} checked={settings.web[section.id as keyof EventWebPageSettings] as boolean} onCheckedChange={(val) => handleWebSettingChange(section.id as keyof EventWebPageSettings, !!val)} />
                                        <Label htmlFor={`web-${section.id}`} className="text-sm font-normal">{section.label}</Label>
                                    </div>
                                ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="flex justify-end pt-6 border-t mt-8">
                    <Button type="submit" size="lg" disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Save className="w-5 h-5 mr-2"/>}
                        Guardar Toda la Configuración
                    </Button>
                </div>
            </form>
        </div>
    );
}
