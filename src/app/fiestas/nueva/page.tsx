
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle, PartyPopper, Calendar, Users, Palette, ChefHat, Music2, ListChecks, DollarSign, Camera, Gift, FileText, UserCheck, Clock, Archive, PackageSearch, Video, Globe, MessageSquare, LayoutDashboard, Link as LinkIcon, Image as ImageIcon, Menu } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById } from '@/app/actions/fiesta-actual';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { KpiCard } from '@/components/dashboard/kpi-card';

const formatDate = (dateString?: string) => {
  if (!dateString) return "Fecha no definida";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) {
    return "Fecha inválida";
  }
};

const modules = [
  { title: "Configuración", href: "configuracion", icon: Users, description: "Datos generales del evento." },
  { title: "Tareas", href: "tareas", icon: ListChecks, description: "Checklist de pendientes." },
  { title: "Invitados", href: "invitados", icon: Users, description: "Gestiona tu lista de invitados." },
  { title: "Página del Evento", href: "pagina-web", icon: Globe, description: "Personaliza la web que verán tus invitados." },
  { title: "Diseño de Salón", href: "invitados/layout", icon: LayoutDashboard, description: "Organiza las mesas y asientos." },
  { title: "Diseño y Decoración", href: "decoracion", icon: Palette, description: "Define el estilo y la ambientación." },
  { title: "Catering", href: "catering", icon: ChefHat, description: "Planifica el menú gastronómico." },
  { title: "Menú para Mesas", href: "menu-mesa", icon: Menu, description: "Imprime el menú para cada mesa." },
  { title: "Música", href: "musica", icon: Music2, description: "Define las preferencias musicales." },
  { title: "Personal", href: "personal", icon: UserCheck, description: "Asigna personal al evento." },
  { title: "Itinerario", href: "itinerario", icon: Clock, description: "Organiza el cronograma." },
  { title: "Documentos", href: "gestion-documental", icon: Archive, description: "Contratos y archivos importantes." },
  { title: "Costos", href: "gestion-costos-rentabilidad", icon: DollarSign, description: "Analiza la rentabilidad." },
  { title: "Carga Operativa", href: "carga-operativa", icon: PackageSearch, description: "Checklist de carga de materiales." },
  { title: "Fotografía y Video", href: "fotografia", icon: Camera, description: "Seguimiento de entregas." },
  { title: "Video de Vida", href: "video-vida", icon: Video, description: "Gestiona las fotos del cliente." },
  { title: "Reuniones", href: "reuniones", icon: MessageSquare, description: "Agenda y minutas de reuniones." },
  { title: "Muro Social (En Vivo)", href: "/evento/social/[fiestaId]", icon: ImageIcon, description: "Galería de fotos de los invitados en tiempo real." },
];

function PlannerDashboardContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');
  
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fiestaId) {
      toast({
        title: "Selecciona un Evento",
        description: "Serás redirigido para que elijas un evento con el cual trabajar.",
        variant: "default"
      });
      router.replace('/eventos');
      return;
    }

    const loadFiesta = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fiestaData = await getFiestaById(fiestaId);
        if (!fiestaData) {
          throw new Error("No se encontró el evento especificado.");
        }
        setFiesta(fiestaData);
      } catch (err: any) {
        setError(err.message || "Error al cargar los datos del evento.");
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    loadFiesta();
  }, [fiestaId, toast, router]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-[calc(100vh-200px)]"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }
  if (error || !fiesta) {
    return (
      <div className="text-center py-10">
        <AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-3" />
        <p className="font-semibold text-lg text-destructive">{error || "No se pudo cargar el evento."}</p>
        <Link href="/eventos" passHref><Button variant="outline" className="mt-4"><ArrowLeft className="w-4 h-4 mr-2"/>Volver al Gestor de Eventos</Button></Link>
      </div>
    );
  }

  const { configuracion } = fiesta;
  const confirmedGuests = fiesta.invitados?.filter(i => i.rsvp === 'Confirmado').reduce((sum, i) => sum + (i.partySize || 1), 0) || 0;
  const pendingTasks = fiesta.tareas?.filter(t => !t.completada).length || 0;
  const totalCost = fiesta.gestionCostos?.ingresosTotalesEstimados || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <PartyPopper className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">{configuracion.nombreEvento}</h1>
            <p className="text-muted-foreground">{formatDate(configuracion.fechaEvento)} - {configuracion.nombreLugar}</p>
          </div>
        </div>
        <Link href="/eventos" passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2"/>Volver al Gestor de Eventos</Button></Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Invitados Estimados" value={configuracion.invitadosEstimados.toString()} icon={Users} description={`${confirmedGuests} confirmados`}/>
        <KpiCard title="Tareas Pendientes" value={pendingTasks} icon={ListChecks} />
        <KpiCard title="Presupuesto" value={new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(Number(configuracion.presupuestoEstimado))} icon={DollarSign} description="Valor estimado del evento."/>
        <KpiCard title="Fecha del Evento" value={formatDate(configuracion.fechaEvento)} icon={Calendar} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Módulos del Planificador</CardTitle>
          <CardDescription>Accede a las diferentes secciones para organizar cada detalle de tu evento.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {modules.map(module => {
            const href = module.href.startsWith('/') 
                ? module.href.replace('[fiestaId]', fiesta.id)
                : `/fiestas/nueva/${module.href}?fiestaId=${fiesta.id}`;
            return (
              <Link key={module.href} href={href} passHref>
                <Card className="h-full hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer flex flex-col">
                  <CardHeader className="flex-row items-center gap-3 space-y-0 pb-2">
                    <div className="p-2 bg-primary/10 rounded-md"><module.icon className="w-5 h-5 text-primary" /></div>
                    <CardTitle className="text-base font-semibold">{module.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow pt-0">
                    <p className="text-xs text-muted-foreground">{module.description}</p>
                  </CardContent>
                </Card>
              </Link>
            )
           })}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PlannerDashboardPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center h-screen">
                <Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="ml-3 text-lg">Cargando planificador...</p></div>
        }>
            <PlannerDashboardContent />
        </Suspense>
    );
}
