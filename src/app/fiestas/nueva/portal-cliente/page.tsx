
'use client';

import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, ClientPortalSettings, EventWebPageSettings } from '@/types/fiesta';
import { getFiestaActual, updateClientPortalSettings, updateWebPageSettingsFiestaActual } from '@/app/actions/fiesta-actual';
import { defaultClientPortalSettings, defaultWebPageSettings } from '@/lib/fiesta-defaults';

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
  Music2, ChefHat, Image as ImageIcon, Trash2, ExternalLink
} from 'lucide-react';

type PortalSettingsForm = {
    portal: ClientPortalSettings;
    web: EventWebPageSettings;
};

export default function PortalClientePage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<PortalSettingsForm>({
        portal: defaultClientPortalSettings,
        web: defaultWebPageSettings
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
    const [storyImagePreview, setStoryImagePreview] = useState<string | null>(null);
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

    const loadSettings = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fiestaData = await getFiestaActual();
            setSettings({
                portal: fiestaData.clientPortalSettings || defaultClientPortalSettings,
                web: fiestaData.webPageSettings || defaultWebPageSettings,
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
        setSettings(prev => ({
            ...prev,
            portal: { ...prev.portal, [key]: value }
        }));
    };
    
    const handleWebSettingChange = (key: keyof EventWebPageSettings, value: string | boolean) => {
        setSettings(prev => ({
            ...prev,
            web: { ...prev.web, [key]: value }
        }));
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
            const [portalResult, webResult] = await Promise.all([
                updateClientPortalSettings(settings.portal),
                updateWebPageSettingsFiestaActual(finalWebSettings)
            ]);

            if (portalResult.success && webResult.success) {
                toast({ title: "¡Configuración Guardada!", description: "Se han guardado las configuraciones del portal y la página web." });
                if (portalResult.updatedData) setSettings(prev => ({ ...prev, portal: portalResult.updatedData! }));
                if (webResult.updatedData) {
                  setSettings(prev => ({ ...prev, web: webResult.updatedData! }));
                  setCoverImagePreview(webResult.updatedData.coverImageUrl || null);
                  setStoryImagePreview(webResult.updatedData.ourStoryImageUrl || null);
                  setGalleryPreviews(webResult.updatedData.galleryImageUrls || []);
                }
            } else {
                throw new Error(portalResult.error || webResult.error || "Error desconocido al guardar.");
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
                                {/* Contenido movido de pagina-web/page.tsx aquí */}
                                <h3 className="text-lg font-medium font-headline text-primary border-b pb-2">Información General</h3>
                                <div className="space-y-2"><Label htmlFor="page-title">Título</Label><Input id="page-title" value={settings.web.pageTitle || ''} onChange={(e) => handleWebSettingChange('pageTitle', e.target.value)} /></div>
                                <div className="space-y-2"><Label htmlFor="hero-subtitle">Subtítulo</Label><Input id="hero-subtitle" value={settings.web.heroSubtitle || ''} onChange={(e) => handleWebSettingChange('heroSubtitle', e.target.value)} /></div>
                                <div className="space-y-2"><Label htmlFor="welcome-message">Mensaje de Bienvenida</Label><Textarea id="welcome-message" value={settings.web.welcomeMessage || ''} onChange={(e) => handleWebSettingChange('welcomeMessage', e.target.value)} rows={3} /></div>
                                <div className="space-y-2"><Label htmlFor="cover-image-upload">Imagen de Portada</Label><Input id="cover-image-upload" type="file" accept="image/*" onChange={(e) => handleImageFileChange(e, setCoverImagePreview)} />
                                {coverImagePreview && <NextImage src={coverImagePreview} alt="Vista previa Portada" width={200} height={120} className="rounded object-cover mt-2" />}</div>

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
