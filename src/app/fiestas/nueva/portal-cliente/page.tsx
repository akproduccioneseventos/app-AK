
'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, ClientPortalSettings, ClientTarea, TareaAsignadaA } from '@/types/fiesta';
import { getFiestaActual, updateClientChecklist, updateClientPortalSettings } from '@/app/actions/fiesta-actual';
import { defaultClientPortalSettings } from '@/lib/fiesta-defaults';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, Save, Loader2, AlertTriangle, Globe, Eye,
  ClipboardCheck, FileText, Music2, Gift, Camera, StickyNote, Lock, Clock, PlusCircle, User, UserCog, Trash2, Users
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    const [portalSettings, setPortalSettings] = useState<ClientPortalSettings>(defaultClientPortalSettings);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fiestaId, setFiestaId] = useState<string>('');
    
    // Checklist State
    const [tareas, setTareas] = useState<ClientTarea[]>([]);
    const [isSavingChecklist, setIsSavingChecklist] = useState(false);
    const [newTaskText, setNewTaskText] = useState('');
    const [newTaskAssignedTo, setNewTaskAssignedTo] = useState<TareaAsignadaA>('Cliente');


    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fiestaData = await getFiestaActual();
            setFiestaId(fiestaData.id);
            setPortalSettings(fiestaData.clientPortalSettings || defaultClientPortalSettings);
            setTareas(fiestaData.clientChecklist || []);
        } catch (err: any) {
            setError("No se pudo cargar la configuración del portal.");
            toast({ title: "Error al Cargar", description: err.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const handleNestedSettingChange = <T extends keyof ClientPortalSettings>(
        section: T,
        property: keyof ClientPortalSettings[T],
        value: boolean
    ) => {
        setPortalSettings(prev => {
            if (!prev || typeof prev[section] !== 'object') return prev;
            
            const updatedSection = {
                ...prev[section],
                [property]: value
            };

            return {
                ...prev,
                [section]: updatedSection
            };
        });
    };

    // Checklist handlers
    const handleChecklistSave = async (updatedTareas: ClientTarea[]) => {
      setIsSavingChecklist(true);
      const result = await updateClientChecklist(updatedTareas);
      if (!result.success) {
        toast({ title: "Error al guardar checklist", description: result.error, variant: "destructive" });
        await loadData(); // Revert
      }
      setIsSavingChecklist(false);
    };

    const handleAddTask = () => {
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
      setNewTaskAssignedTo('Cliente');
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
        try {
            const portalResult = await updateClientPortalSettings(portalSettings);
            if (portalResult.success) {
                toast({ title: "¡Configuración Guardada!", description: "Se han guardado las configuraciones del portal." });
                await loadData();
            } else {
                throw new Error(portalResult.error || "Error desconocido al guardar.");
            }
        } catch (err: any) {
            toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    if (error) return <div className="text-center text-destructive p-4"><AlertTriangle className="mx-auto w-10 h-10 mb-2"/>{error}</div>;

    const portalModuleList = [
        { id: 'checklist', label: 'Checklist Cliente', icon: ClipboardCheck, editable: true },
        { id: 'documentos', label: 'Documentos', icon: FileText, editable: false },
        { id: 'itinerario', label: 'Itinerario', icon: Clock, editable: false },
        { id: 'musica', label: 'Música', icon: Music2, editable: true },
        { id: 'videoVida', label: 'Video de Vida', icon: Camera, editable: true },
        { id: 'listaRegalos', label: 'Lista de Regalos', icon: Gift, editable: false },
        { id: 'notasCliente', label: 'Notas del Cliente', icon: StickyNote, editable: true },
    ];
    
    const accesosDirectos = [
        { title: "Gestionar Invitados", href: "/fiestas/nueva/invitados", icon: Users },
        { title: "Ver Página Pública", href: `/evento/actual`, icon: Globe, isExternal: true },
        { title: "Ver Galería Social", href: `/evento/social/${fiestaId}`, icon: Camera, isExternal: true },
        { title: "Gestionar Itinerario", href: "/fiestas/nueva/itinerario", icon: Clock },
        { title: "Gestionar Música", href: "/fiestas/nueva/musica", icon: Music2 },
        { title: "Gestionar Lista Regalos", href: "/fiestas/nueva/regalos", icon: Gift },
        { title: "Gestionar Video de Vida", href: "/fiestas/nueva/video-vida", icon: Camera },
        { title: "Gestionar Documentos", href: "/fiestas/nueva/gestion-documental", icon: FileText },
        { title: "Ver/Editar Notas Cliente", href: "/fiestas/nueva/notas-cliente", icon: StickyNote },
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
                    {/* Columna Izquierda: Panel de Control */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="shadow-lg sticky top-20">
                            <CardHeader>
                                <CardTitle className="font-headline text-xl">Panel de Control</CardTitle>
                                <CardDescription>Gestiona la experiencia del cliente y la página pública.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                                    <Label htmlFor="portal-enabled" className="text-base font-medium">Activar Portal del Cliente</Label>
                                    <Switch id="portal-enabled" checked={portalSettings.enabled} onCheckedChange={(val) => setPortalSettings(p => p ? {...p, enabled: val} : null)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="portal-password" className="flex items-center gap-2"><Lock className="w-4 h-4 text-primary/80"/>Contraseña de Acceso</Label>
                                    <Input 
                                        id="portal-password"
                                        type="text"
                                        value={portalSettings.accessKey || ''}
                                        onChange={(e) => setPortalSettings(p => p ? {...p, accessKey: e.target.value} : null)}
                                        placeholder="Deja en blanco para acceso público"
                                        disabled={!portalSettings.enabled || isSaving}
                                    />
                                </div>
                                <Separator />
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-muted-foreground">Secciones Visibles para el Cliente:</h4>
                                     {portalModuleList.map(section => {
                                        const sectionKey = section.id as keyof Omit<ClientPortalSettings, 'enabled' | 'accessKey'>;
                                        const sectionSettings = portalSettings[sectionKey];

                                        if (!sectionSettings) {
                                            return <div key={section.id} className="text-xs text-destructive">Error: No se encontró config. para {section.label}</div>;
                                        }
                                        
                                        const canBeEditable = 'editable' in sectionSettings;

                                        return (
                                            <div key={section.id} className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-background">
                                                <Label htmlFor={`portal-${section.id}.visible`} className="flex items-center gap-2 font-normal cursor-pointer">
                                                    <section.icon className="w-4 h-4 text-primary/80" />
                                                    {section.label}
                                                </Label>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        id={`portal-${section.id}.visible`}
                                                        checked={sectionSettings.visible}
                                                        onCheckedChange={(val) => handleNestedSettingChange(sectionKey, 'visible', val)}
                                                        disabled={!portalSettings.enabled || isSaving}
                                                    />
                                                    {section.editable && canBeEditable && (
                                                        <Select
                                                            value={(sectionSettings as {editable?: boolean}).editable ? 'edit' : 'view'}
                                                            onValueChange={(v) => handleNestedSettingChange(sectionKey, 'editable', v === 'edit')}
                                                            disabled={!sectionSettings.visible || !portalSettings.enabled || isSaving}
                                                        >
                                                            <SelectTrigger className="h-7 text-xs w-[80px]"><SelectValue/></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="view">Ver</SelectItem>
                                                                <SelectItem value="edit">Editar</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Columna Derecha: Contenido Principal */}
                    <div className="lg:col-span-2 space-y-6">
                         <Card>
                            <CardHeader>
                                <CardTitle className="font-headline text-xl">Accesos directos a módulos</CardTitle>
                                <CardDescription>Navega rápidamente a las secciones principales de gestión del evento.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {accesosDirectos.map(link => (
                                    <Button asChild variant="outline" className="justify-start text-left h-auto py-2" key={link.href}>
                                        <Link href={link.href} target={link.isExternal ? "_blank" : "_self"}>
                                            <link.icon className="w-4 h-4 mr-2 shrink-0" />
                                            {link.title}
                                        </Link>
                                    </Button>
                                ))}
                            </CardContent>
                        </Card>
                        <Card className="shadow-lg" id="checklist-cliente">
                           <CardHeader>
                                <CardTitle className="font-headline text-xl flex items-center gap-2"><ClipboardCheck className="text-primary"/>Checklist Compartida con Cliente</CardTitle>
                                <CardDescription>Gestiona las tareas que el cliente verá en su portal.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="space-y-3 p-3 border rounded-md bg-muted/30">
                                      <div className="space-y-1"><Label htmlFor="task-text">Título de la Tarea</Label><Input id="task-text" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} placeholder="Ej: Enviar lista de invitados..." required /></div>
                                      <div className="space-y-1 mt-2"><Label>Asignar a:</Label><div className="flex gap-4"><div className="flex items-center space-x-2"><Checkbox id="assign-cliente" checked={newTaskAssignedTo === 'Cliente'} onCheckedChange={() => setNewTaskAssignedTo('Cliente')}/><Label htmlFor="assign-cliente">Cliente</Label></div><div className="flex items-center space-x-2"><Checkbox id="assign-organizador" checked={newTaskAssignedTo === 'Organizador'} onCheckedChange={() => setNewTaskAssignedTo('Organizador')}/><Label htmlFor="assign-organizador">Organizador</Label></div></div></div>
                                      <Button type="button" onClick={handleAddTask} size="sm" disabled={isSavingChecklist || !newTaskText.trim()} className="mt-2"><PlusCircle className="w-4 h-4 mr-2" />Añadir Tarea</Button>
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
                                                        <Checkbox id={`task-client-${task.id}`} checked={task.completada} onCheckedChange={() => toggleTaskCompletion(task.id)} className="mt-1" disabled={isSavingChecklist || !portalSettings.checklist.editable} />
                                                        <div className="flex-grow">
                                                            <Label htmlFor={`task-client-${task.id}`} className={`font-medium cursor-pointer ${task.completada ? 'line-through text-muted-foreground' : ''}`}>{task.texto}</Label>
                                                            <div className={`text-xs flex items-center gap-1 ${task.asignadaA === 'Cliente' ? 'text-blue-600' : 'text-purple-600'}`}>{task.asignadaA === 'Cliente' ? <User className="w-3 h-3"/> : <UserCog className="w-3 h-3"/>}{task.asignadaA}</div>
                                                        </div>
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
