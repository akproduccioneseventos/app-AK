
'use client';

import React, { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2, ImageIcon, Palette, Type, UploadCloud, Eye, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, EventWebPageSettings } from '@/types/fiesta';
import { getFiestaActual, updatePortalSettingsFiestaActual as updatePortalSettings } from '@/app/actions/fiesta-actual';
import { defaultWebPageSettings } from '@/lib/fiesta-defaults';
import { Separator } from '@/components/ui/separator';
import { uploadPublicPageAsset } from '@/app/actions/fiesta/assets.actions';
import { merge, cloneDeep } from 'lodash';

// PREVIEW COMPONENT
const InvitationPreview: React.FC<{ fiesta: FiestaEnPlanificacion, webSettings: EventWebPageSettings, previewImage?: string | null }> = ({ fiesta, webSettings, previewImage }) => {
    const { configuracion } = fiesta;
    
    const imageUrl = previewImage || webSettings.coverImageUrl;
    
    const titleText = webSettings.pageTitle || configuracion.nombreEvento;
    const subtitleText = webSettings.heroSubtitle || configuracion.tipoCelebracion;

    const formatDate = (dateString?: string) => {
        if (!dateString) return "Fecha por confirmar";
        try {
            return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        } catch (e) { return "Fecha inválida"; }
    };

    return (
        <div className="w-full max-w-[320px] mx-auto aspect-[9/16] bg-gray-100 rounded-2xl shadow-xl p-2 border-4 border-black flex flex-col">
            <div className="w-full h-full bg-gray-800 rounded-lg overflow-hidden relative text-white flex flex-col justify-end p-6 text-center">
                {imageUrl ? (
                    <NextImage src={imageUrl} alt="Fondo de la invitación" layout="fill" objectFit="cover" className="opacity-50" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pink-400 to-purple-500">
                        <ImageIcon className="w-16 h-16 text-white/50" />
                    </div>
                )}
                
                <div className="relative z-10 space-y-4 bg-black/30 backdrop-blur-sm p-4 rounded-lg">
                    <p className="font-light text-sm tracking-wider">{subtitleText}</p>
                    <h2 className="text-4xl font-serif leading-tight">{titleText}</h2>
                    <Separator className="my-3 bg-white/50" />
                    <div className="space-y-1">
                        <p className="text-lg font-semibold flex items-center justify-center gap-1.5">
                            <Calendar className="w-4 h-4"/>
                            {formatDate(configuracion.fechaEvento)}
                        </p>
                        <p className="text-md">a las {configuracion.horaInicio} hs.</p>
                        <p className="text-sm font-light mt-1">{configuracion.nombreLugar}</p>
                    </div>
                </div>

                <div className="relative z-10 mt-6 flex flex-col gap-2">
                    <Button variant="secondary" size="sm" className="w-full bg-white/80 text-black hover:bg-white">Confirmar Asistencia</Button>
                    <Button variant="ghost" size="sm" className="w-full text-white hover:bg-white/20">Ver Lista de Regalos</Button>
                </div>
            </div>
        </div>
    );
};


export default function InvitacionDigitalPage() {
    const { toast } = useToast();
    const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
    const [webSettings, setWebSettings] = useState<EventWebPageSettings>(defaultWebPageSettings);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
    const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

    const publicPageUrl = typeof window !== 'undefined' && fiesta ? `${window.location.origin}/evento/actual?fiestaId=${fiesta.id}` : '';

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const fiestaData = await getFiestaActual();
            setFiesta(fiestaData);
            const mergedSettings = merge(cloneDeep(defaultWebPageSettings), fiestaData.webPageSettings || {});
            setWebSettings(mergedSettings);
            setCoverImagePreview(mergedSettings.coverImageUrl || null);
        } catch (err: any) {
            setError("No se pudo cargar la información del evento.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const handleSettingsChange = (field: keyof EventWebPageSettings, value: string) => {
        setWebSettings(prev => ({...prev, [field]: value}));
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverImageFile(file);
            setCoverImagePreview(URL.createObjectURL(file));
        }
    };
    
    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        if (!fiesta) return;
        setIsSaving(true);
        
        let finalSettings = { ...webSettings };

        try {
            if (coverImageFile) {
                const result = await uploadPublicPageAsset(fiesta.id, coverImageFile);
                if (result.success && result.url) {
                    finalSettings.coverImageUrl = result.url;
                } else {
                    throw new Error("No se pudo subir la imagen de portada.");
                }
            }

            const currentClientPortalSettings = fiesta.clientPortalSettings || {};
            const result = await updatePortalSettings(fiesta.id, currentClientPortalSettings, finalSettings);

            if (result.success) {
                toast({ title: "¡Diseño Guardado!" });
                await loadData();
            } else {
                throw new Error(result.error);
            }

        } catch (err: any) {
            toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>;
    if (error || !fiesta) return <div className="text-center text-destructive p-4"><AlertTriangle className="mx-auto w-8 h-8 mb-2"/>{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ImageIcon className="w-8 h-8 text-primary"/>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Diseño de Invitación Digital</h1>
                </div>
                <div className="flex gap-2">
                    <a href={publicPageUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="secondary"><Eye className="w-4 h-4 mr-2"/>Ver Página Pública</Button>
                    </a>
                    <Link href={`/fiestas/nueva/invitados?fiestaId=${fiesta.id}`} passHref>
                      <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <form onSubmit={handleSave} className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg"><Palette/>Apariencia</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="space-y-2">
                                <Label htmlFor="cover-image-upload">Foto Principal / Fondo</Label>
                                <Input id="cover-image-upload" type="file" accept="image/*" onChange={handleFileChange} />
                                <p className="text-xs text-muted-foreground">Sube una foto de la quinceañera o la pareja.</p>
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Type/>Textos</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                           <div className="space-y-1"><Label htmlFor="inv-title" className="text-xs">Título Principal</Label><Input id="inv-title" value={webSettings.pageTitle || ''} onChange={(e) => handleSettingsChange('pageTitle', e.target.value)} placeholder={fiesta.configuracion.nombreEvento}/></div>
                           <div className="space-y-1"><Label htmlFor="inv-subtitle" className="text-xs">Subtítulo</Label><Input id="inv-subtitle" value={webSettings.heroSubtitle || ''} onChange={(e) => handleSettingsChange('heroSubtitle', e.target.value)} placeholder={fiesta.configuracion.tipoCelebracion} /></div>
                        </CardContent>
                         <CardFooter>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
                                Guardar Cambios
                            </Button>
                         </CardFooter>
                    </Card>
                </form>
                <div className="lg:col-span-2">
                     <Card className="sticky top-20">
                        <CardHeader>
                            <CardTitle>Vista Previa de la Invitación</CardTitle>
                            <CardDescription>Así es como los invitados verán la página pública principal del evento.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center items-center p-4 bg-gray-200 dark:bg-gray-800 rounded-b-lg">
                           <InvitationPreview fiesta={fiesta} webSettings={webSettings} previewImage={coverImagePreview}/>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
