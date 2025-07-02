

'use client';

import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, ClientPortalSettings, EventWebPageSettings, SocialGallerySettings, ClientTarea, TareaAsignadaA } from '@/types/fiesta';
import { getFiestaActual, updateClientPortalSettings, updateWebPageSettingsFiestaActual, updateSocialGallerySettings, updateClientChecklist } from '@/app/actions/fiesta-actual';
import { deleteSocialPost, clearGallery, getSocialPosts } from '@/app/actions/social-gallery';
import type { SocialGalleryPost } from '@/types/social-gallery';

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
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, Save, Loader2, AlertTriangle, Globe, Eye,
  ClipboardCheck, FileText, Banknote, Music2, Gift, Camera, StickyNote, Lock, QrCode, Clock, Wand2, Plus, PlusCircle, UserCog, User, Trash2, Users
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type PortalSettingsForm = {
    portal: ClientPortalSettings;
    web: EventWebPageSettings;
    social: SocialGallerySettings;
};

interface SectionCardProps {
    title: string;
    description: string;
    icon: React.ElementType;
    href: string;
    isExternal?: boolean;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, description, icon: Icon, href, isExternal }) => (
    <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex-row items-center gap-4 space-y-0 pb-2">
            <div className="p-2.5 bg-primary/10 rounded-lg"><Icon className="w-6 h-6 text-primary" /></div>
            <CardTitle className="font-headline text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">{description}</p></CardContent>
        <CardFooter>
            <Button asChild className="w-full">
                <Link href={href} target={isExternal ? "_blank" : "_self"} rel={isExternal ? "noopener noreferrer" : undefined}>
                    <Eye className="w-4 h-4 mr-2" /> Acceder
                </Link>
            </Button>
        </CardFooter>
    </Card>
);

export default function PortalUnificadoPage() {
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
    const [socialPosts, setSocialPosts] = useState<SocialGalleryPost[]>([]);
    const [isLoadingPosts, setIsLoadingPosts] = useState(false);
    const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
    const [isClearingGallery, setIsClearingGallery] = useState(false);
    
    // Checklist State
    const [tareas, setTareas] = useState<ClientTarea[]>([]);
    const [isSavingChecklist, setIsSavingChecklist] = useState(false);
    const [newTaskText, setNewTaskText] = useState('');
    const [newTaskAssignedTo, setNewTaskAssignedTo] = useState<TareaAsignadaA>('Cliente');


    const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
    const [storyImagePreview, setStoryImagePreview] = useState<string | null>(null);
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

    const loadData = useCallback(async (fiestaIdToLoad?: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const fiestaData = await getFiestaActual();
            const currentFiestaId = fiestaIdToLoad || fiestaData.id;
            setFiestaId(currentFiestaId);
            setSettings({
                portal: fiestaData.clientPortalSettings || defaultClientPortalSettings,
                web: fiestaData.webPageSettings || defaultWebPageSettings,
                social: fiestaData.socialGallerySettings || defaultSocialGallerySettings,
            });
            setTareas(fiestaData.clientChecklist || []);
            setCoverImagePreview(fiestaData.webPageSettings?.coverImageUrl || null);
            setStoryImagePreview(fiestaData.webPageSettings?.ourStoryImageUrl || null);
            setGalleryPreviews(fiestaData.webPageSettings?.galleryImageUrls || []);

            if (fiestaData.socialGallerySettings?.enabled) {
                await loadSocialPosts(currentFiestaId);
            }
        } catch (err: any) {
            setError("No se pudo cargar la configuración del portal.");
            toast({ title: "Error al Cargar", description: err.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const loadSocialPosts = async (id: string) => {
        setIsLoadingPosts(true);
        try {
            const posts = await getSocialPosts(id);
            setSocialPosts(posts);
        } catch (e) {
            toast({ title: "Error", description: "No se pudieron cargar las fotos de la galería social.", variant: "destructive" });
        } finally {
            setIsLoadingPosts(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const handlePortalSettingChange = (key: keyof ClientPortalSettings | keyof ClientPortalSettings['checklist'], value: boolean | string) => {
        const keys = (key as string).split('.');
        if (keys.length > 1) {
            const [parentKey, childKey] = keys as [keyof ClientPortalSettings, string];
            setSettings(prev => ({
                ...prev,
                portal: {
                    ...prev.portal,
                    [parentKey]: {
                        // @ts-ignore
                        ...prev.portal[parentKey],
                        [childKey]: value
                    }
                }
            }));
        } else {
             setSettings(prev => ({ ...prev, portal: { ...prev.portal, [key as keyof ClientPortalSettings]: value } }));
        }
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

    // Checklist handlers
    const handleChecklistSave = async (updatedTareas: ClientTarea[]) => {
      setIsSavingChecklist(true);
      const result = await updateClientChecklist(updatedTareas);
      if (!result.success) {
        toast({ title: "Error al guardar checklist", description: result.error, variant: "destructive" });
        await loadData();
      }
      setIsSavingChecklist(false);
    };

    const handleAddTask = (e: FormEvent) => {
      e.preventDefault();
      if (!newTaskText.trim()) { toast({ title: "Título Requerido", variant: "destructive" }); return; }
      const newTask: ClientTarea = {
        id: `task_client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        texto: newTaskText.trim(),
        completada: false,
        asignadaA: newTaskAssignedTo,
      };
      const updatedTareas = [newTask, ...tareas];
      setTareas(updatedTareas);
      handleChecklistSave(updatedTareas); // Asynchronously save
      setNewTaskText('');
    };

    const toggleTaskCompletion = async (taskId: string) => {
      const updatedTareas = tareas.map(task =>
        task.id === taskId ? { ...task, completada: !task.completada } : task
      );
      setTareas(updatedTareas);
      await handleChecklistSave(updatedTareas);
    };

    const deleteTask = async (taskId: string) => {
      const updatedTareas = tareas.filter(task => task.id !== taskId);
      setTareas(updatedTareas);
      await handleChecklistSave(updatedTareas);
    };

    const completedCount = tareas.filter(task => task.completada).length;
    const totalCount = tareas.length;
    const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

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
                await loadData(fiestaId);
            } else {
                throw new Error(portalResult.error || webResult.error || socialResult.error || "Error desconocido al guardar.");
            }
        } catch (err: any) {
            toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDeletePost = async (postId: string) => {
        setDeletingPostId(postId);
        const result = await deleteSocialPost(postId);
        if(result.success) {
            toast({title: "Publicación eliminada"});
            await loadSocialPosts(fiestaId);
        } else {
            toast({title: "Error", description: result.error, variant: "destructive"});
        }
        setDeletingPostId(null);
    };

    const handleClearGallery = async () => {
        setIsClearingGallery(true);
        const result = await clearGallery(fiestaId);
        if(result.success) {
            toast({title: "Galería Vaciada", description: "Todas las fotos y comentarios han sido eliminados."});
            await loadSocialPosts(fiestaId);
        } else {
            toast({title: "Error", description: result.error, variant: "destructive"});
        }
        setIsClearingGallery(false);
    };

    if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    if (error) return <div className="text-center text-destructive p-4"><AlertTriangle className="mx-auto w-10 h-10 mb-2"/>{error}</div>;

    const portalSections = [
        { id: "documentos", title: "Documentos", label: "Documentos (Contrato/Presupuesto/Facturas)", icon: FileText, href: "/fiestas/nueva/gestion-documental", isExternal: false },
        { id: "itinerario", title: "Itinerario", label: "Itinerario del Evento", icon: Clock, href: "/fiestas/nueva/itinerario", isExternal: false },
        { id: "musica", title: "Música", label: "Preferencias Musicales", icon: Music2, href: "/fiestas/nueva/musica", isExternal: false },
        { id: "videoVida", title: "Video de Vida", label: "Carga de Fotos para Video de Vida", icon: Camera, href: "/fiestas/nueva/video-vida", isExternal: false },
        { id: "listaRegalos", title: "Regalos", label: "Lista de Regalos", icon: Gift, href: "/fiestas/nueva/regalos", isExternal: false },
    ];
    
    const accesosDirectos = [
        { title: "Checklist Cliente", href: "#checklist-cliente", icon: ClipboardCheck, isExternal: false },
        { title: "Gestión de Invitados", href: "/fiestas/nueva/invitados", icon: Users, isExternal: false },
        { title: "Itinerario", href: "/fiestas/nueva/itinerario", icon: Clock, isExternal: false },
        { title: "Música", href: "/fiestas/nueva/musica", icon: Music2, isExternal: false },
        { title: "Video de Vida", href: "/fiestas/nueva/video-vida", icon: Camera, isExternal: false },
        { title: "Lista de Regalos", href: "/fiestas/nueva/regalos", icon: Gift, isExternal: false },
        { title: "Documentos", href: "/fiestas/nueva/gestion-documental", icon: FileText, isExternal: false },
        { title: "Notas del Cliente", href: "/fiestas/nueva/notas-cliente", icon: StickyNote, isExternal: false },
        { title: "Ver Página Pública", href: `/evento/actual`, icon: Globe, isExternal: true },
        { title: "Ver Galería Social", href: `/evento/social/${fiestaId}`, icon: Camera, isExternal: true },
    ];


    const webSections = [
        { id: "showCountdown", label: "Contador Regresivo" },
        { id: "showOurStory", label: "Nuestra Historia" },
        { id: "showEventDetails", label: "Detalles del Evento" },
        { id: "showPrograma", label: "Cronograma del Evento" },
        { id: "showDressCode", label: "Código de Vestimenta" },
        { id: "showGiftRegistry", label: "Lista de Regalos" },
        { id: "showGallery", label: "Galería de Fotos" },
        { id: "showRsvp", label: "Formulario de Confirmación (RSVP)" },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Globe className="w-8 h-8 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Portal del Cliente</h1>
                </div>
                <Link href="/fiestas/nueva" passHref><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Columna Izquierda: Portales y Checklist */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="shadow-lg sticky top-20">
                            <CardHeader>
                                <CardTitle className="font-headline text-xl">Panel de Control</CardTitle>
                                <CardDescription>Gestiona la experiencia del cliente y la página pública.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                                    <Label htmlFor="portal-enabled" className="text-base font-medium">Activar Portal del Cliente</Label>
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
                                </div>
                                <Separator />
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-muted-foreground">Secciones Visibles para el Cliente:</h4>
                                     <div className="flex items-center justify-between text-sm">
                                        <Label htmlFor="portal-checklist.visible" className="flex items-center gap-2 font-normal"><ClipboardCheck className="w-4 h-4 text-primary/80"/>Checklist Cliente</Label>
                                        <div className="flex items-center gap-2">
                                          <Switch id="portal-checklist.visible" checked={settings.portal.checklist.visible} onCheckedChange={(val) => handlePortalSettingChange('checklist.visible', val)} disabled={!settings.portal.enabled} />
                                          <Select value={settings.portal.checklist.editable ? 'edit' : 'view'} onValueChange={(v) => handlePortalSettingChange('checklist.editable', v === 'edit')} disabled={!settings.portal.checklist.visible || !settings.portal.enabled}>
                                            <SelectTrigger className="h-7 text-xs w-[80px]"><SelectValue/></SelectTrigger>
                                            <SelectContent><SelectItem value="view">Ver</SelectItem><SelectItem value="edit">Editar</SelectItem></SelectContent>
                                          </Select>
                                        </div>
                                    </div>
                                    {portalSections.map(section => (
                                        <div key={section.id} className="flex items-center justify-between text-sm">
                                            <Label htmlFor={`portal-${section.id}.visible`} className="flex items-center gap-2 font-normal">
                                                <section.icon className="w-4 h-4 text-primary/80"/>{section.label}
                                            </Label>
                                             <Switch id={`portal-${section.id}.visible`} checked={(settings.portal as any)[section.id]?.visible} onCheckedChange={(val) => handlePortalSettingChange(`${section.id}.visible`, val)} disabled={!settings.portal.enabled} />
                                        </div>
                                    ))}
                                </div>
                                <Separator className="my-4" />
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Accesos directos a módulos</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {accesosDirectos.map(link => (
                                        <Button asChild variant="outline" size="sm" className="justify-start text-left h-auto py-2" key={link.href}>
                                            <Link href={link.href} target={link.isExternal ? "_blank" : "_self"}>
                                                <link.icon className="w-4 h-4 mr-2 shrink-0" />
                                                {link.title}
                                            </Link>
                                        </Button>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    {/* Columna Derecha: Página Pública, Checklist y Galería Social */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="shadow-lg" id="checklist-cliente">
                           <CardHeader>
                                <CardTitle className="font-headline text-xl flex items-center gap-2"><ClipboardCheck className="text-primary"/>Checklist Compartida con Cliente</CardTitle>
                                <CardDescription>Gestiona las tareas que el cliente verá en su portal.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="space-y-3 p-3 border rounded-md bg-muted/30">
                                      <form onSubmit={handleAddTask}>
                                        <div className="space-y-1"><Label htmlFor="task-text">Título de la Tarea</Label><Input id="task-text" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} placeholder="Ej: Enviar lista de invitados..." required /></div>
                                        <div className="space-y-1 mt-2"><Label>Asignar a:</Label><div className="flex gap-4"><div className="flex items-center space-x-2"><Checkbox id="assign-cliente" checked={newTaskAssignedTo === 'Cliente'} onCheckedChange={() => setNewTaskAssignedTo('Cliente')}/><Label htmlFor="assign-cliente">Cliente</Label></div><div className="flex items-center space-x-2"><Checkbox id="assign-organizador" checked={newTaskAssignedTo === 'Organizador'} onCheckedChange={() => setNewTaskAssignedTo('Organizador')}/><Label htmlFor="assign-organizador">Organizador</Label></div></div></div>
                                        <Button type="submit" size="sm" disabled={isSavingChecklist} className="mt-2"><PlusCircle className="w-4 h-4 mr-2" />Añadir Tarea</Button>
                                      </form>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Progreso: {completedCount}/{totalCount}</Label>
                                        <Progress value={progressPercentage} className="h-2" />
                                    </div>
                                    {tareas.length > 0 && (
                                        <ScrollArea className="h-48 pr-3 border rounded-md p-2">
                                            <ul className="space-y-2">
                                                {tareas.map((task) => (
                                                    <li key={task.id} className="flex items-start gap-3">
                                                        <Checkbox id={`task-client-${task.id}`} checked={task.completada} onCheckedChange={() => toggleTaskCompletion(task.id)} className="mt-1" disabled={isSavingChecklist} />
                                                        <div className="flex-grow"><Label htmlFor={`task-client-${task.id}`} className={`font-medium cursor-pointer ${task.completada ? 'line-through text-muted-foreground' : ''}`}>{task.texto}</Label><div className={`text-xs flex items-center gap-1 ${task.asignadaA === 'Cliente' ? 'text-blue-600' : 'text-purple-600'}`}>{task.asignadaA === 'Cliente' ? <User className="w-3 h-3"/> : <UserCog className="w-3 h-3"/>}{task.asignadaA}</div></div>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteTask(task.id)} disabled={isSavingChecklist}><Trash2 className="w-4 h-4" /></Button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </ScrollArea>
                                    )}
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
