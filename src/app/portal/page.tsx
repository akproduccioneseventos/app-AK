
'use client';

import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle, KeyRound, LogIn, ArrowRight, NotebookTextIcon, ListChecks, Music, Camera, Gift, FileText, UserCheck, Users, Globe, MessageSquare, Wand2, FileSignature, Zap } from 'lucide-react';
import type { FiestaEnPlanificacion, ClientPortalSettings } from '@/types/fiesta';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { notifyClientArrival } from '@/app/actions/fiesta/live.actions';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { CompanyLogo } from '@/components/company-logo';

const SESSION_KEY_PREFIX = 'portal_auth_';

const portalModules = [
    { id: 'checklist', label: 'Mis Tareas', href: '/portal/[fiestaId]/tareas', icon: ListChecks },
    { id: 'contrato', label: 'Ver y Firmar Contrato', href: '/portal/[fiestaId]/contrato', icon: FileSignature },
    { id: 'invitados', label: 'Asignación de Mesas', href: '/portal/mesas', icon: Users },
    { id: 'moodboard', label: 'Dream Designer (Moodboard)', href: '/portal/[fiestaId]/moodboard', icon: Wand2 },
    { id: 'musica', label: 'Sugerencias Musicales', href: '/portal/[fiestaId]/musica', icon: Music },
    { id: 'videoVida', label: 'Carga de Fotos para Video', href: '/portal/[fiestaId]/video-vida', icon: Camera },
    { id: 'listaRegalos', label: 'Configurar Regalos', icon: Gift },
    { id: 'documentos', label: 'Mis Documentos', href: '/portal/[fiestaId]/documentos', icon: FileText },
    { id: 'notasCliente', label: 'Notas Compartidas', href: '/portal/[fiestaId]/notas', icon: NotebookTextIcon },
    { id: 'paginaPublica', label: 'Acceso a Página Pública', href: '/evento/actual', icon: Globe },
    { id: 'fotografiaYFilmacion', label: 'Seguimiento de Fotografía/Video', href: '/portal/[fiestaId]/fotografia', icon: UserCheck },
];

function ClientPortalContent() {
    const searchParams = useSearchParams();
    const fiestaId = searchParams.get('fiestaId');
    const { toast } = useToast();

    const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isNotifying, setIsNotifying] = useState(false);

    useEffect(() => {
        if (!fiestaId) {
            setError("ID de evento no especificado en la URL.");
            setIsLoading(false);
            return;
        }

        const sessionKey = `${SESSION_KEY_PREFIX}${fiestaId}`;

        async function loadFiesta() {
            try {
                const fiestaData = await getFiestaById(fiestaId!);
                if (!fiestaData || !fiestaData.clientPortalSettings?.enabled) {
                    setError("El portal para este evento no está habilitado o el evento no existe.");
                } else {
                    setFiesta(fiestaData);
                    const storedAuthKey = sessionStorage.getItem(sessionKey);
                    if (storedAuthKey === fiestaData.clientPortalSettings.accessKey) {
                        setIsAuthenticated(true);
                    }
                }
            } catch (err: any) {
                setError("No se pudo cargar la información del evento.");
            } finally {
                setIsLoading(false);
            }
        }
        loadFiesta();
    }, [fiestaId]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === fiesta?.clientPortalSettings?.accessKey) {
            sessionStorage.setItem(`${SESSION_KEY_PREFIX}${fiestaId}`, password);
            setIsAuthenticated(true);
            setError(null);
        } else {
            setError("Contraseña incorrecta.");
        }
    };

    const handleArrivalNotify = async () => {
        if (!fiestaId) return;
        setIsNotifying(true);
        const res = await notifyClientArrival(fiestaId);
        if (res.success) {
            toast({ title: "¡Aviso enviado!", description: "El organizador ha sido notificado de tu llegada." });
        } else {
            toast({ title: "Error", description: "No se pudo enviar el aviso.", variant: "destructive" });
        }
        setIsNotifying(false);
    };
    
    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
    }
    
    if (error) {
        return <div className="flex items-center justify-center min-h-screen p-4"><Card className="max-w-md text-center bg-destructive/10"><CardHeader><AlertTriangle className="w-12 h-12 mx-auto text-destructive" /><CardTitle className="text-destructive">Acceso Denegado</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">{error}</p></CardContent></Card></div>;
    }

    if (!isAuthenticated || !fiesta) {
        // If the portal has no accessKey configured, show a friendly message
        if (fiesta && !fiesta.clientPortalSettings?.accessKey) {
            return (
                <div className="flex items-center justify-center min-h-screen p-4">
                    <Card className="max-w-md text-center">
                        <CardHeader>
                            <KeyRound className="w-12 h-12 mx-auto text-muted-foreground mb-2"/>
                            <CardTitle className="font-headline text-2xl">Portal del Cliente</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">El organizador aún no ha configurado una contraseña para este portal. Por favor, contacta a tu organizador.</p>
                        </CardContent>
                    </Card>
                </div>
            );
        }
        return (
            <div className="flex items-center justify-center min-h-screen p-4">
                <Card className="max-w-sm w-full">
                    <CardHeader className="text-center">
                        <div className="mb-3 opacity-40">
                          <CompanyLogo size="sm" className="mx-auto" />
                        </div>
                        <KeyRound className="w-12 h-12 mx-auto text-primary mb-2"/>
                        <CardTitle className="font-headline text-2xl">Portal del Cliente</CardTitle>
                        <CardDescription>Ingresa la contraseña proporcionada por tu organizador.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleLogin}>
                        <CardContent className="space-y-4">
                             <div className="space-y-1">
                                <Label htmlFor="portal-password">Contraseña</Label>
                                <Input id="portal-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                             </div>
                             {error && <p className="text-sm text-center text-destructive">{error}</p>}
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full"><LogIn className="w-4 h-4 mr-2"/>Ingresar</Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        );
    }
    
    const settings = fiesta.clientPortalSettings;
    if(!settings) return null;

    return (
        <div className="min-h-screen bg-muted/40 p-4 sm:p-8">
            <div className="max-w-2xl mx-auto space-y-6">
                <header className="text-center">
                    <div className="mb-4 opacity-40">
                      <CompanyLogo size="sm" className="mx-auto" />
                    </div>
                    <h1 className="text-3xl font-bold font-headline">{fiesta.configuracion.nombreEvento}</h1>
                    <p className="text-lg text-muted-foreground">¡Bienvenido/a a tu portal!</p>
                </header>

                <Card className="bg-primary text-white shadow-xl rounded-[2rem] border-none overflow-hidden animate-in fade-in slide-in-from-top-4 duration-700">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black uppercase tracking-widest opacity-80">Día del Evento</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-6">
                        <div className="flex flex-col gap-4">
                            <p className="text-lg font-bold">¿Ya estás llegando al salón?</p>
                            <Button 
                                onClick={handleArrivalNotify} 
                                disabled={isNotifying}
                                className="h-16 rounded-2xl bg-white text-primary hover:bg-slate-100 font-black text-lg shadow-2xl"
                            >
                                {isNotifying ? <Loader2 className="animate-spin mr-3"/> : <Zap className="w-6 h-6 mr-3"/>}
                                ¡ESTAMOS LLEGANDO!
                            </Button>
                            <p className="text-[10px] uppercase font-black tracking-widest text-center opacity-60">Presiona para avisar al organizador</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Módulos Disponibles</CardTitle>
                        <CardDescription>Desde aquí puedes colaborar en la organización de tu evento.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                       {portalModules.map(mod => {
                           const moduleSetting = settings[mod.id as keyof typeof settings];
                           const isVisible = (mod.id === 'contrato' && !moduleSetting) || (moduleSetting && (moduleSetting as any).visible);
                           
                           if (!isVisible) return null;
                           const Icon = mod.icon;
                           
                           let finalHref = mod.href?.replace('[fiestaId]', fiesta.id);
                           if (mod.id === 'listaRegalos') finalHref = `/fiestas/nueva/regalos?fiestaId=${fiesta.id}`;
                           const fullHref = finalHref ? (finalHref.includes('?') ? finalHref : `${finalHref}?fiestaId=${fiesta.id}`) : '#';

                           return (
                               <Link href={fullHref} key={mod.id} className="block">
                                    <div className="w-full flex items-center p-4 text-left border rounded-lg hover:bg-accent transition-colors">
                                        <Icon className="w-6 h-6 mr-4 text-primary shrink-0"/>
                                        <div className="flex-grow">
                                            <p className="font-semibold">{mod.label}</p>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-muted-foreground ml-auto shrink-0"/>
                                    </div>
                                </Link>
                           )
                       })}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function ClientPortalPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}>
            <ClientPortalContent />
        </Suspense>
    );
}
