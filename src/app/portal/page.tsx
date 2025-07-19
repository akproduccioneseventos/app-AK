
'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Eye, Lock, FileText, Banknote, Music2, Gift, Camera, StickyNote, ClipboardCheck, Clock } from 'lucide-react';
import type { FiestaEnPlanificacion, ClientTarea, TareaAsignadaA } from '@/types/fiesta';
import { getFiestaActual, updateClientChecklist, updateClientNotes } from '@/app/actions/fiesta-actual';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { AkAssistant } from '@/components/asistente-ak/AkAssistant';


const formatDate = (dateString?: string) => {
  if (!dateString) return "Fecha no definida";
  try { return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }); } 
  catch (e) { return "Fecha inválida"; }
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

export default function ClientPortalPage() {
    const { toast } = useToast();
    const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [authError, setAuthError] = useState('');
    const [portalSessionKey, setPortalSessionKey] = useState<string | null>(null);

    // Client-editable modules state
    const [clientChecklist, setClientChecklist] = useState<ClientTarea[]>([]);
    const [clientNotes, setClientNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fiestaData = await getFiestaActual();
            setFiesta(fiestaData);
            setPortalSessionKey(`portal_auth_${fiestaData.id}`); // Set session key based on fiesta ID
            setClientChecklist(fiestaData.clientChecklist || []);
            setClientNotes(fiestaData.clientNotes || '');

            // Determine authorization right after loading data
            const requiresAuth = fiestaData.clientPortalSettings?.accessKey && fiestaData.clientPortalSettings.accessKey.trim() !== '';
            if (!requiresAuth) {
                setIsAuthorized(true);
            } else {
                const sessionAuth = sessionStorage.getItem(`portal_auth_${fiestaData.id}`);
                if (sessionAuth === 'true') {
                    setIsAuthorized(true);
                }
            }
        } catch (err: any) {
            setError("No se pudo cargar la información del portal. Por favor, contacta al organizador.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleAuthSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (passwordInput === fiesta?.clientPortalSettings?.accessKey) {
            if (portalSessionKey) {
                sessionStorage.setItem(portalSessionKey, 'true');
            }
            setIsAuthorized(true);
            setAuthError('');
        } else {
            setAuthError('Contraseña incorrecta.');
        }
    };

    const handleToggleTask = async (taskId: string) => {
        const updatedTasks = clientChecklist.map(task => 
            task.id === taskId ? {...task, completada: !task.completada} : task
        );
        setClientChecklist(updatedTasks);
        setIsSaving(true);
        const result = await updateClientChecklist(updatedTasks);
        if(!result.success){
            toast({title: "Error", description: "No se pudo actualizar la tarea.", variant: "destructive"});
            await loadData(); // Revert
        }
        setIsSaving(false);
    };

    const handleNotesSave = async () => {
        setIsSaving(true);
        const result = await updateClientNotes(clientNotes);
        if (result.success) {
            toast({title: "Notas Guardadas"});
        } else {
            toast({title: "Error", description: "No se pudieron guardar las notas.", variant: "destructive"});
            await loadData(); // Revert
        }
        setIsSaving(false);
    }
    
    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="ml-4 text-lg">Cargando Portal...</p></div>;
    }
    
    if (error || !fiesta) {
        return <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
            <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
            <h1 className="text-2xl font-bold">Error de Acceso</h1>
            <p className="text-muted-foreground mt-2">{error || "No se encontró la información del evento."}</p>
        </div>;
    }

    if (!fiesta.clientPortalSettings?.enabled) {
         return <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
            <Lock className="w-16 h-16 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold">Portal Desactivado</h1>
            <p className="text-muted-foreground mt-2">El portal para este evento no está activado. Por favor, contacta al organizador.</p>
        </div>;
    }

    if (!isAuthorized) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-headline"><Lock className="w-5 h-5 text-primary"/>Acceso al Portal</CardTitle>
                        <CardDescription>Por favor, ingresa la contraseña para continuar.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleAuthSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="portal-password">Contraseña</Label>
                                <Input 
                                    id="portal-password" 
                                    type="password" 
                                    value={passwordInput} 
                                    onChange={(e) => setPasswordInput(e.target.value)} 
                                    required 
                                />
                            </div>
                            {authError && <p className="text-sm text-destructive">{authError}</p>}
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full">Ingresar</Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        );
    }
    
    const { configuracion, clientPortalSettings } = fiesta;

    const sections: (SectionCardProps | null)[] = [
        clientPortalSettings?.paginaPublica?.visible ? {
            title: "Página Pública del Evento", description: "Ver la página principal con la cuenta regresiva, RSVP, etc.", icon: Globe,
            href: "/evento/actual", isExternal: true,
        } : null,
        clientPortalSettings?.documentos?.visible ? {
            title: "Documentos", description: "Accede a tu contrato, presupuesto y facturas.", icon: FileText,
            href: `/fiestas/nueva/gestion-documental`
        } : null,
        clientPortalSettings?.videoVida?.visible ? {
            title: "Video de Vida", description: "Sube fotos para el video emotivo.", icon: Camera,
            href: `/video-vida/${fiesta.id}`,
        } : null,
    ];
    
    const availableSections = sections.filter(Boolean) as SectionCardProps[];

    return (
        <div className="min-h-screen bg-muted/40 p-4 sm:p-6 md:p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                <header className="mb-8 text-center">
                    <h1 className="text-4xl font-bold tracking-tight font-headline">{configuracion.nombreEvento}</h1>
                    <p className="text-lg text-muted-foreground">Portal del Cliente | {formatDate(configuracion.fechaEvento)}</p>
                </header>

                {availableSections.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {availableSections.map(section => <SectionCard key={section.title} {...section} />)}
                    </div>
                )}
                
                {clientPortalSettings.checklist.visible && (
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="font-headline text-xl flex items-center gap-2"><ClipboardCheck className="text-primary"/>Checklist Compartido</CardTitle>
                            <CardDescription>Tareas importantes a completar antes de la fiesta. Marca las que hayas finalizado.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-auto max-h-60 pr-3">
                                <ul className="space-y-3">
                                    {clientChecklist.map(task => (
                                        <li key={task.id} className={`flex items-start gap-3 p-2 border-l-4 rounded-r-md ${task.completada ? 'border-green-300 bg-green-50' : 'border-border bg-card'}`}>
                                            <Checkbox id={`task-client-${task.id}`} checked={task.completada} onCheckedChange={() => handleToggleTask(task.id)} className="mt-1" disabled={isSaving || !clientPortalSettings.checklist.editable}/>
                                            <div>
                                                <Label htmlFor={`task-client-${task.id}`} className={`font-medium cursor-pointer ${task.completada ? 'line-through text-muted-foreground' : ''}`}>{task.texto}</Label>
                                                <p className="text-xs text-muted-foreground">Asignado a: {task.asignadaA}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                )}

                {clientPortalSettings.notasCliente.visible && (
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="font-headline text-xl flex items-center gap-2"><StickyNote className="text-primary"/>Notas y Preferencias</CardTitle>
                            <CardDescription>Deja aquí cualquier nota, preferencia o detalle importante para el organizador.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea 
                                placeholder="Escribe aquí tus notas..."
                                rows={5}
                                value={clientNotes}
                                onChange={(e) => setClientNotes(e.target.value)}
                                disabled={!clientPortalSettings.notasCliente.editable || isSaving}
                            />
                        </CardContent>
                        {clientPortalSettings.notasCliente.editable && <CardFooter><Button onClick={handleNotesSave} disabled={isSaving}>Guardar Notas</Button></CardFooter>}
                    </Card>
                )}
            </div>
            <AkAssistant />
        </div>
    );
}
