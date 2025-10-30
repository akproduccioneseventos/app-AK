
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle, KeyRound, LogIn, ArrowRight, NotebookTextIcon, ListChecks, Music, Camera, Gift, FileText, UserCheck, Users } from 'lucide-react';
import type { FiestaEnPlanificacion, ClientPortalSettings } from '@/types/fiesta';
import { getFiestaById } from '@/app/actions/fiesta-actual';
import Link from 'next/link';

const SESSION_KEY_PREFIX = 'portal_auth_';

const portalModules = [
    { id: 'checklist', label: 'Mis Tareas', href: '/portal/[fiestaId]/tareas', icon: ListChecks },
    { id: 'invitados', label: 'Asignación de Mesas', href: '/portal/mesas', icon: Users },
    { id: 'musica', label: 'Sugerencias Musicales', href: '/portal/[fiestaId]/musica', icon: Music },
    { id: 'videoVida', label: 'Carga de Fotos para Video', href: '/portal/[fiestaId]/video-vida', icon: Camera },
    { id: 'listaRegalos', label: 'Configurar Regalos', href: '/fiestas/nueva/regalos', icon: Gift },
    { id: 'documentos', label: 'Mis Documentos', href: '/portal/[fiestaId]/documentos', icon: FileText },
    { id: 'notasCliente', label: 'Notas Compartidas', href: '/portal/[fiestaId]/notas', icon: NotebookTextIcon },
    { id: 'paginaPublica', label: 'Acceso a Página Pública', href: '/evento/actual', icon: 'Globe' },
    { id: 'fotografiaYFilmacion', label: 'Seguimiento de Fotografía/Video', href: '/portal/[fiestaId]/fotografia', icon: UserCheck },
];

function ClientPortalContent() {
    const searchParams = useSearchParams();
    const fiestaId = searchParams.get('fiestaId');

    const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!fiestaId) {
            setError("ID de evento no especificado en la URL.");
            setIsLoading(false);
            return;
        }

        const sessionKey = `${SESSION_KEY_PREFIX}${fiestaId}`;

        async function loadFiesta() {
            try {
                const fiestaData = await getFiestaById(fiestaId);
                if (!fiestaData || !fiestaData.clientPortalSettings?.enabled) {
                    setError("El portal para este evento no está habilitado o el evento no existe.");
                } else {
                    setFiesta(fiestaData);
                    // Check session storage for authentication
                    if (sessionStorage.getItem(sessionKey) === 'true') {
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
            sessionStorage.setItem(`${SESSION_KEY_PREFIX}${fiestaId}`, 'true');
            setIsAuthenticated(true);
            setError(null);
        } else {
            setError("Contraseña incorrecta.");
        }
    };
    
    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
    }
    
    if (error) {
        return <div className="flex items-center justify-center min-h-screen p-4"><Card className="max-w-md text-center bg-destructive/10"><CardHeader><AlertTriangle className="w-12 h-12 mx-auto text-destructive" /><CardTitle className="text-destructive">Acceso Denegado</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">{error}</p></CardContent></Card></div>;
    }

    if (!isAuthenticated || !fiesta) {
        return (
            <div className="flex items-center justify-center min-h-screen p-4">
                <Card className="max-w-sm w-full">
                    <CardHeader className="text-center">
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
                    <h1 className="text-3xl font-bold font-headline">{fiesta.configuracion.nombreEvento}</h1>
                    <p className="text-lg text-muted-foreground">¡Bienvenido/a a tu portal!</p>
                </header>

                <Card>
                    <CardHeader>
                        <CardTitle>Módulos Disponibles</CardTitle>
                        <CardDescription>Desde aquí puedes colaborar en la organización de tu evento.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                       {portalModules.map(mod => {
                           const moduleSetting = settings[mod.id as keyof typeof settings];
                           if (!moduleSetting || !moduleSetting.visible) return null;
                           const Icon = mod.icon;
                           
                           const finalHref = mod.href.replace('[fiestaId]', fiesta.id);

                           return (
                               <Link href={`${finalHref}?fiestaId=${fiesta.id}`} key={mod.id} passHref>
                                    <Button variant="outline" className="w-full h-auto justify-start p-4 text-left">
                                        <Icon className="w-6 h-6 mr-4 text-primary"/>
                                        <div className="flex-grow">
                                            <p className="font-semibold">{mod.label}</p>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-muted-foreground ml-auto"/>
                                    </Button>
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
