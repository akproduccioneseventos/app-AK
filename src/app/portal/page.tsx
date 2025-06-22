
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Eye, Lock, FileText, Banknote, FileSignature, Users, Music2, ChefHat, ExternalLink, ClipboardUser, Globe } from 'lucide-react';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import Link from 'next/link';

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
            <Link href={href} passHref legacyBehavior>
                <a target={isExternal ? "_blank" : "_self"} rel={isExternal ? "noopener noreferrer" : undefined} className="w-full">
                    <Button className="w-full">
                        <Eye className="w-4 h-4 mr-2" /> Ver Sección
                    </Button>
                </a>
            </Link>
        </CardFooter>
    </Card>
);

export default function ClientPortalPage() {
    const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fiestaData = await getFiestaActual();
            setFiesta(fiestaData);
        } catch (err: any) {
            setError("No se pudo cargar la información del portal. Por favor, contacta al organizador.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
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
    
    const { configuracion, clientPortalSettings } = fiesta;

    const sections: (SectionCardProps | null)[] = [
        clientPortalSettings.showPresupuesto && fiesta.presupuestoId ? {
            title: "Presupuesto", description: "Revisa el presupuesto detallado de tu evento.", icon: FileText,
            href: `/presupuestos/${fiesta.presupuestoId}/ver`
        } : null,
        clientPortalSettings.showPagos && fiesta.invoiceIds && fiesta.invoiceIds.length > 0 ? {
            title: "Pagos y Facturas", description: "Consulta el estado de tus pagos y facturas.", icon: Banknote,
            href: `/invoices/${fiesta.invoiceIds[0]}` // Links to the first invoice for now
        } : null,
        clientPortalSettings.showContrato ? {
            title: "Contrato", description: "Accede al contrato del evento.", icon: FileSignature,
            href: `#` // Placeholder link
        } : null,
        clientPortalSettings.showInvitados ? {
            title: "Lista de Invitados", description: "Consulta la lista de invitados y sus confirmaciones.", icon: Users,
            href: `/fiestas/nueva/invitados` // Links to planner view, could be a readonly view later
        } : null,
        clientPortalSettings.showMusica ? {
            title: "Selección Musical", description: "Revisa las preferencias musicales para la fiesta.", icon: Music2,
            href: `/fiestas/nueva/musica`
        } : null,
         clientPortalSettings.showMenu && fiesta.menuAsignadoId ? {
            title: "Menú Contratado", description: "Detalles del menú seleccionado para el evento.", icon: ChefHat,
            href: `/fiestas/nueva/catering/menu/${fiesta.menuAsignadoId}/editar` // Links to edit view for now
        } : null,
    ];
    
    const availableSections = sections.filter(Boolean) as SectionCardProps[];

    return (
        <div className="min-h-screen bg-muted/40 p-4 sm:p-6 md:p-8">
            <div className="max-w-5xl mx-auto">
                <header className="mb-8 text-center">
                    <ClipboardUser className="w-12 h-12 mx-auto text-primary mb-3" />
                    <h1 className="text-4xl font-bold tracking-tight font-headline">{configuracion.nombreEvento}</h1>
                    <p className="text-lg text-muted-foreground">Portal del Cliente | {formatDate(configuracion.fechaEvento)}</p>
                </header>

                <Card className="mb-8 shadow-lg">
                    <CardHeader>
                        <CardTitle className="font-headline text-xl flex items-center gap-2"><Globe className="text-primary"/>Página Pública del Evento</CardTitle>
                        <CardDescription>Este es el enlace que puedes compartir con tus invitados.</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Link href="/evento/actual" passHref legacyBehavior>
                           <a target="_blank" rel="noopener noreferrer" className="w-full">
                                <Button className="w-full">
                                    Visitar Página Pública <ExternalLink className="w-4 h-4 ml-2"/>
                                </Button>
                            </a>
                        </Link>
                    </CardFooter>
                </Card>

                {availableSections.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {availableSections.map(section => <SectionCard key={section.title} {...section} />)}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No hay secciones activas para mostrar en este momento.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

