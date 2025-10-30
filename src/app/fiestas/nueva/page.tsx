
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle, PartyPopper, Calendar, Users, Palette, ChefHat, Music2, ListChecks, DollarSign, Camera, Gift, FileText, UserCheck, Clock, Archive, PackageSearch, Video, Globe, MessageSquare, LayoutDashboard, Star, Calculator, GlassWater, ShoppingCart, ClipboardList, QrCode, Printer, Settings2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById, updateModulosContratadosFiestaActual, type FiestaEnPlanificacion, type ModulosContratados } from '../../actions/fiesta-actual';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { defaultModulosContratados } from '@/lib/fiesta-defaults';


const formatDate = (dateString?: string) => {
  if (!dateString) return "Fecha no definida";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  } catch (e) {
    return "Fecha inválida";
  }
};

const modules = [
  // Gestión Central
  { id: 'configuracion', title: "Configuración", href: "configuracion", icon: Settings2, description: "Datos generales del evento.", category: 'Gestión Central' },
  { id: 'tareas', title: "Tareas", href: "tareas", icon: ListChecks, description: "Checklist de pendientes.", category: 'Gestión Central' },
  { id: 'documentos', title: "Documentos", href: "gestion-documental", icon: Archive, description: "Contratos y archivos importantes.", category: 'Gestión Central' },
  { id: 'costos', title: "Costos", href: "gestion-costos-rentabilidad", icon: DollarSign, description: "Analiza la rentabilidad.", category: 'Gestión Central' },
  { id: 'resumenImprimible', title: "Resumen Imprimible", href: "resumen-imprimible", icon: Printer, description: "Genera un PDF con el resumen operativo del evento.", category: 'Gestión Central' },
  
  // Planificación del Evento
  { id: 'invitados', title: "Invitados y Salón", href: "invitados", icon: Users, description: "Gestiona tu lista y el diseño del salón.", category: 'Planificación del Evento' },
  { id: 'decoracion', title: "Decoración y Diseño", href: "decoracion", icon: Palette, description: "Define el estilo y la ambientación.", category: 'Planificación del Evento' },
  { id: 'catering', title: "Planificación Gastronómica", href: "catering", icon: Calculator, description: "Menús, repostería y bebidas.", category: 'Planificación del Evento' },
  { id: 'personal', title: "Personal", href: "personal", icon: UserCheck, description: "Asigna personal al evento.", category: 'Planificación del Evento' },
  { id: 'cargaOperativa', title: "Lista de Carga Operativa", href: "carga-operativa", icon: ClipboardList, description: "Checklist de carga de materiales.", category: 'Planificación del Evento' },

  // Portal del Cliente
  { id: 'reuniones', title: "Reuniones y Portal Cliente", href: "reuniones", icon: MessageSquare, description: "Gestiona reuniones y la experiencia del cliente.", category: 'Portal del Cliente' },
  { id: 'paginaWeb', title: "Página del Evento", href: "pagina-web", icon: Globe, description: "Personaliza la web que verán tus invitados.", category: 'Portal del Cliente' },
  { id: 'itinerario', title: "Itinerario", href: "itinerario", icon: Clock, description: "Organiza el cronograma del evento.", category: 'Portal del Cliente' },
  { id: 'musica', title: "Música", href: "musica", icon: Music2, description: "Define las preferencias musicales.", category: 'Portal del Cliente' },
  { id: 'regalos', title: "Lista de Regalos", href: "regalos", icon: Gift, description: "Configura la lista de regalos para los invitados.", category: 'Portal del Cliente' },
  { id: 'videoVida', title: "Video de Vida", href: "video-vida", icon: Video, description: "Gestiona las fotos del cliente.", category: 'Portal del Cliente' },
  { id: 'muroSocial', title: "Muro Social", href: "/evento/social/[fiestaId]", icon: Camera, description: "Modera la galería de fotos en vivo del evento.", category: 'Portal del Cliente' },
  { id: 'feedback', title: "Feedback y Testimonios", href: "/settings/feedback", icon: Star, description: "Gestiona la opinión de tus clientes post-evento.", category: 'Portal del Cliente' },
  { id: 'invitados', title: "Asignación de Mesas (Cliente)", href: "/portal/[fiestaId]/mesas", icon: Users, description: "Permite al cliente organizar sus invitados en las mesas.", category: 'Portal del Cliente' },
  
  // Herramientas Adicionales
  { id: 'checkin', title: "Check-in de Invitados (QR)", href: "invitados/checkin-scanner", icon: QrCode, description: "Escanea los QR de los invitados en la entrada.", category: 'Herramientas Adicionales' },
  { id: 'listaCompras', title: "Lista de Compras", href: "catering/lista-compras", icon: ShoppingCart, description: "Insumos y bebidas para el evento.", category: 'Herramientas Adicionales' },
  { id: 'menuMesa', title: "Menú de Mesa", href: "menu-mesa", icon: Printer, description: "Diseña el menú impreso para las mesas.", category: 'Herramientas Adicionales' },
  { id: 'cartaTragos', title: "Carta de Tragos", href: "carta-tragos", icon: GlassWater, description: "Diseña la carta de tragos para la barra.", category: 'Herramientas Adicionales' },
  { id: 'fotografia', title: "Fotografía y Video", href: "fotografia", icon: Camera, description: "Seguimiento de entregas.", category: 'Herramientas Adicionales' },
];

const moduleCategories = [
    'Gestión Central', 
    'Planificación del Evento',
    'Portal del Cliente',
    'Herramientas Adicionales',
];


function PlannerDashboardContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');
  
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [modulosContratados, setModulosContratados] = useState<ModulosContratados>(defaultModulosContratados);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fiestaId) {
      toast({ title: "Selecciona un Evento", description: "Serás redirigido para que elijas un evento.", variant: "default" });
      router.replace('/eventos');
      return;
    }

    const loadFiesta = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fiestaData = await getFiestaById(fiestaId);
        if (!fiestaData) throw new Error("No se encontró el evento especificado.");
        setFiesta(fiestaData);
        setModulosContratados(fiestaData.modulosContratados || defaultModulosContratados);
      } catch (err: any) {
        setError(err.message || "Error al cargar los datos del evento.");
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    loadFiesta();
  }, [fiestaId, toast, router]);

  const handleModuleToggle = async (moduleId: keyof ModulosContratados, checked: boolean) => {
    const updatedModules = { ...modulosContratados, [moduleId]: checked };
    setModulosContratados(updatedModules);
    try {
      if(fiesta) await updateModulosContratadosFiestaActual(fiesta.id, updatedModules);
    } catch(e: any) {
        toast({ title: "Error al guardar", description: e.message, variant: "destructive"});
        setModulosContratados(modulosContratados); // Revert on error
    }
  };

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

       <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Settings2 className="w-5 h-5"/>
              Configurar Módulos Visibles
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-4 bg-muted/30 rounded-md">
                 <Accordion type="multiple" className="w-full space-y-2" defaultValue={['Gestión Central']}>
                    {moduleCategories.map(category => (
                        <AccordionItem key={category} value={category} className="border rounded-md bg-background">
                            <AccordionTrigger className="px-4 py-2 text-sm font-medium hover:no-underline">{category}</AccordionTrigger>
                            <AccordionContent className="p-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {modules.filter(m => m.category === category).map(module => (
                                    <div key={module.id} className="flex items-center space-x-2">
                                        <Switch
                                            id={`switch-${module.id}`}
                                            checked={modulosContratados[module.id as keyof ModulosContratados]}
                                            onCheckedChange={(checked) => handleModuleToggle(module.id as keyof ModulosContratados, checked)}
                                        />
                                        <Label htmlFor={`switch-${module.id}`} className="text-sm font-normal">{module.title}</Label>
                                    </div>
                                ))}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                 </Accordion>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Módulos del Planificador</CardTitle>
          <CardDescription>Accede a las diferentes secciones para organizar cada detalle de tu evento.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {moduleCategories.map(category => {
            const categoryModules = modules.filter(m => m.category === category && modulosContratados[m.id as keyof ModulosContratados]);
            if (categoryModules.length === 0) return null;

            return (
              <div key={category}>
                <h3 className="text-lg font-semibold mb-3 font-headline">{category}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {categoryModules.map(module => {
                    const hrefWithId = module.href.startsWith('/') 
                        ? module.href.replace('[fiestaId]', fiesta.id)
                        : `/fiestas/nueva/${module.href}?fiestaId=${fiesta.id}`;
                    return (
                      <Link key={module.href} href={hrefWithId} passHref>
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
                </div>
                 {category !== moduleCategories[moduleCategories.length - 1] && <Separator className="mt-6"/>}
              </div>
            );
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
