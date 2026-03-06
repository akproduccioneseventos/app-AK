'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle, PartyPopper, Calendar, Users, Palette, ChefHat, Music2, ListChecks, DollarSign, Camera, Gift, FileText, UserCheck, Clock, Archive, PackageSearch, Video, Globe, MessageSquare, LayoutDashboard, Star, Calculator, GlassWater, ShoppingCart, ClipboardList, QrCode, Printer, Settings2, KeyRound, ClipboardCheck, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById, updateModulosContratadosFiestaActual, type FiestaEnPlanificacion, type ModulosContratados } from '../../actions/fiesta-actual';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { defaultModulosContratados } from '@/lib/fiesta-defaults';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
  { id: 'configuracion', title: "Configuración", href: "configuracion", icon: Settings2, description: "Datos maestros del evento.", category: 'Gestión Central', color: "bg-slate-100 text-slate-600" },
  { id: 'resumenPlanificacion', title: "Consolidado", href: "resumen-planificacion", icon: ClipboardCheck, description: "Visión total de lo pactado.", category: 'Gestión Central', color: "bg-primary/10 text-primary" },
  { id: 'tareas', title: "Tareas", href: "tareas", icon: ListChecks, description: "Checklist operativo.", category: 'Gestión Central', color: "bg-slate-100 text-slate-600" },
  { id: 'documentos', title: "Documentos", href: "gestion-documental", icon: Archive, description: "Contratos y expedientes.", category: 'Gestión Central', color: "bg-slate-100 text-slate-600" },
  { id: 'costos', title: "Costos", href: "gestion-costos-rentabilidad", icon: DollarSign, description: "Rentabilidad real.", category: 'Gestión Central', color: "bg-emerald-100 text-emerald-600" },
  { id: 'reuniones', title: "Reuniones", href: "reuniones", icon: MessageSquare, description: "Minutas y acuerdos.", category: 'Gestión Central', color: "bg-blue-100 text-blue-600" },
  { id: 'resumenImprimible', title: "Para Imprimir", href: "resumen-imprimible", icon: Printer, description: "PDF operativo final.", category: 'Gestión Central', color: "bg-slate-100 text-slate-600" },
  
  // Planificación del Evento
  { id: 'invitados', title: "Invitados", href: "invitados", icon: Users, description: "Lista y confirmaciones.", category: 'Planificación del Evento', color: "bg-indigo-100 text-indigo-600" },
  { id: 'disenoSalon', title: "Diseño Salón", href: "invitados/layout", icon: LayoutDashboard, description: "Planimetría interactiva.", category: 'Planificación del Evento', color: "bg-indigo-100 text-indigo-600" },
  { id: 'decoracion', title: "Decoración", href: "decoracion", icon: Palette, description: "Estilo y ambientación.", category: 'Planificación del Evento', color: "bg-pink-100 text-pink-600" },
  { id: 'catering', title: "Gastronomía", href: "catering", icon: Calculator, description: "Cálculo de menú e insumos.", category: 'Planificación del Evento', color: "bg-orange-100 text-orange-600" },
  { id: 'personal', title: "Personal", href: "personal", icon: UserCheck, description: "Asignación de equipo.", category: 'Planificación del Evento', color: "bg-teal-100 text-teal-600" },
  { id: 'cargaOperativa', title: "Carga", href: "carga-operativa", icon: ClipboardList, description: "Logística de traslado.", category: 'Planificación del Evento', color: "bg-slate-100 text-slate-600" },
  { id: 'fotografia', title: "Foto y Video", href: "fotografia", icon: Camera, description: "Seguimiento de entrega.", category: 'Planificación del Evento', color: "bg-purple-100 text-purple-600" },
  { id: 'musica', title: "Música", href: "musica", icon: Music2, description: "Canciones y ambiente.", category: 'Planificación del Evento', color: "bg-violet-100 text-violet-600" },
  { id: 'itinerario', title: "Itinerario", href: "itinerario", icon: Clock, description: "Cronograma minuto a minuto.", category: 'Planificación del Evento', color: "bg-blue-100 text-blue-600" },
  
  // Portal del Cliente
  { id: 'portalCliente', title: "Portal Cliente", href: "portal-cliente", icon: KeyRound, description: "Centro de colaboración.", category: 'Portal del Cliente', color: "bg-amber-100 text-amber-600" },
  { id: 'paginaWeb', title: "Invitación Web", href: "pagina-web", icon: Globe, description: "Web pública interactiva.", category: 'Portal del Cliente', color: "bg-blue-100 text-blue-600" },
  { id: 'regalos', title: "Regalos", href: "regalos", icon: Gift, description: "Mesa de regalos digital.", category: 'Portal del Cliente', color: "bg-rose-100 text-rose-600" },
  { id: 'videoVida', title: "Video Vida", href: "video-vida", icon: Video, description: "Carga de fotos de infancia.", category: 'Portal del Cliente', color: "bg-indigo-100 text-indigo-600" },
  { id: 'feedback', title: "Feedback", href: "/settings/feedback", icon: Star, description: "Encuesta post-evento.", category: 'Portal del Cliente', color: "bg-yellow-100 text-yellow-600" },
  { id: 'mesasCliente', title: "Mesas (Cliente)", href: "/portal/mesas", icon: Users, description: "Organizador para el cliente.", category: 'Portal del Cliente', color: "bg-amber-100 text-amber-600" },

  // Herramientas Adicionales
  { id: 'checkin', title: "Check-in QR", href: "invitados/checkin-scanner", icon: QrCode, description: "Recepción de invitados.", category: 'Herramientas Adicionales', color: "bg-green-100 text-green-600" },
  { id: 'listaCompras', title: "Compras", href: "catering/lista-compras", icon: ShoppingCart, description: "Insumos necesarios.", category: 'Herramientas Adicionales', color: "bg-slate-100 text-slate-600" },
  { id: 'menuMesa', title: "Menú Mesa", href: "menu-mesa", icon: Printer, description: "Diseño impreso.", category: 'Herramientas Adicionales', color: "bg-slate-100 text-slate-600" },
  { id: 'cartaTragos', title: "Carta Tragos", href: "carta-tragos", icon: GlassWater, description: "Diseño para barra.", category: 'Herramientas Adicionales', color: "bg-purple-100 text-purple-600" },
  { id: 'muroSocial', title: "Muro Social", href: "/evento/social/[fiestaId]", icon: Camera, description: "Moderación de fotos en vivo.", category: 'Herramientas Adicionales', color: "bg-pink-100 text-pink-600" },
  { id: 'numerosMesa', title: "Números Mesa", href: "invitados/numeros-mesa", icon: Printer, description: "Impresión de señalética.", category: 'Herramientas Adicionales', color: "bg-slate-100 text-slate-600" },
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
      router.replace('/eventos');
      return;
    }

    const loadFiesta = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fiestaData = await getFiestaById(fiestaId);
        if (!fiestaData) throw new Error("No se encontró el evento.");
        setFiesta(fiestaData);
        const savedModules = fiestaData.modulosContratados || {};
        setModulosContratados({ ...defaultModulosContratados, ...savedModules });
      } catch (err: any) {
        setError(err.message || "Error al cargar los datos del evento.");
      } finally {
        setIsLoading(false);
      }
    };

    loadFiesta();
  }, [fiestaId, router]);

  const handleModuleToggle = async (moduleId: keyof ModulosContratados, checked: boolean) => {
    const updatedModules = { ...modulosContratados, [moduleId]: checked };
    setModulosContratados(updatedModules);
    try {
      if(fiesta) await updateModulosContratadosFiestaActual(fiesta.id, updatedModules);
    } catch(e: any) {
        toast({ title: "Error al guardar", variant: "destructive"});
        setModulosContratados(modulosContratados);
    }
  };
  
 const getLinkHref = (baseHref: string) => {
    if (!fiesta) return '#';
    const handlers: Record<string, () => string> = {
        "/fiestas/nueva/reuniones": () => `/fiestas/nueva/reuniones?fiestaId=${fiesta.id}`,
        "/fiestas/nueva/portal-cliente": () => `/fiestas/nueva/portal-cliente?fiestaId=${fiesta.id}`,
        "/evento/social/[fiestaId]": () => `/evento/social/${fiesta.id}`,
        "/portal/mesas": () => `/portal/mesas?fiestaId=${fiesta.id}`
    };
    return handlers[baseHref] ? handlers[baseHref]() : baseHref;
 };

  if (isLoading) {
    return <div className="flex justify-center items-center h-[calc(100vh-200px)]"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }
  if (error || !fiesta) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="w-16 h-16 mx-auto text-destructive mb-4" />
        <p className="text-xl font-bold text-slate-800">{error || "No se pudo cargar el evento."}</p>
        <Link href="/eventos" passHref><Button variant="outline" className="mt-6 rounded-xl"><ArrowLeft className="w-4 h-4 mr-2"/>Volver al Gestor</Button></Link>
      </div>
    );
  }

  const { configuracion } = fiesta;
  const confirmedGuests = fiesta.invitados?.filter(i => i.rsvp === 'Confirmado').reduce((sum, i) => sum + (i.partySize || 1), 0) || 0;
  const pendingTasks = fiesta.tareas?.filter(t => !t.completada).length || 0;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-primary rounded-3xl shadow-xl shadow-primary/20 text-white">
            <PartyPopper className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight font-headline text-slate-900">{configuracion.nombreEvento}</h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary"/> {formatDate(configuracion.fechaEvento)} 
                <span className="text-slate-300">•</span> 
                <MapPin className="w-4 h-4 text-primary"/> {configuracion.nombreLugar}
            </p>
          </div>
        </div>
        <Link href="/eventos" passHref><Button variant="outline" className="rounded-xl px-6"><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button></Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Invitados" value={configuracion.invitadosEstimados.toString()} icon={Users} description={`${confirmedGuests} confirmados`}/>
        <KpiCard title="Pendientes" value={pendingTasks} icon={ListChecks} />
        <KpiCard title="Presupuesto" value={new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(Number(configuracion.presupuestoEstimado))} icon={DollarSign} />
        <KpiCard title="Fecha" value={new Date(configuracion.fechaEvento!).toLocaleDateString('es-ES', {month: 'short', day: 'numeric'})} icon={Calendar} />
      </div>

       <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1" className="border-none">
          <AccordionTrigger className="bg-slate-100 hover:bg-slate-200 px-6 rounded-2xl transition-all">
            <div className="flex items-center gap-2 text-slate-700 font-bold">
              <Settings2 className="w-5 h-5 text-primary"/>
              Configurar Visibilidad de Módulos
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {moduleCategories.map(category => (
                        <div key={category} className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b pb-2">{category}</h4>
                            <div className="space-y-2">
                                {modules.filter(m => m.category === category).map(module => (
                                    <div key={`${category}-${module.id}`} className="flex items-center justify-between p-2 hover:bg-white rounded-xl transition-colors">
                                        <Label htmlFor={`switch-${module.id}`} className="text-xs font-semibold text-slate-600 cursor-pointer">{module.title}</Label>
                                        <Switch
                                            id={`switch-${module.id}`}
                                            checked={modulosContratados[module.id as keyof ModulosContratados]}
                                            onCheckedChange={(checked) => handleModuleToggle(module.id as keyof ModulosContratados, checked)}
                                            className="scale-75"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                 </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="space-y-12">
          {moduleCategories.map((category, catIdx) => {
            const categoryModules = modules.filter(m => m.category === category && modulosContratados[m.id as keyof ModulosContratados]);
            if (categoryModules.length === 0) return null;

            return (
              <div key={category} className="space-y-6">
                <div className="flex items-center gap-4">
                    <h3 className="text-2xl font-black font-headline text-slate-800 shrink-0">{category}</h3>
                    <div className="h-px bg-slate-200 flex-grow"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {categoryModules.map((module, mIdx) => {
                    const hrefWithId = module.href.startsWith('/') 
                        ? getLinkHref(module.href)
                        : `/fiestas/nueva/${module.href}?fiestaId=${fiesta.id}`;
                    return (
                      <motion.div
                        key={`${module.id}-${mIdx}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (catIdx * 0.1) + (mIdx * 0.05) }}
                      >
                        <Link href={hrefWithId} passHref className="block h-full">
                            <Card className="h-full border-none shadow-lg hover:shadow-2xl hover:translate-y-[-4px] transition-all duration-300 cursor-pointer flex flex-col group rounded-3xl overflow-hidden bg-white">
                            <CardHeader className="flex-row items-center gap-4 space-y-0 pb-4 p-6">
                                <div className={cn("p-3 rounded-2xl group-hover:scale-110 transition-all duration-500", module.color)}>
                                    <module.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-bold text-slate-800">{module.title}</CardTitle>
                                    <CardDescription className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-0.5">Módulo Activo</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow pt-0 px-6 pb-6">
                                <p className="text-xs text-muted-foreground leading-relaxed font-medium">{module.description}</p>
                            </CardContent>
                            <CardFooter className="bg-slate-50/50 p-3 flex justify-end">
                                <Button variant="ghost" size="sm" className="text-primary font-bold text-[10px] uppercase tracking-widest">
                                    Abrir <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform"/>
                                </Button>
                            </CardFooter>
                            </Card>
                        </Link>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

const MapPin = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
);

export default function PlannerDashboardPage() {
    return (
        <Suspense fallback={null}>
            <PlannerDashboardContent />
        </Suspense>
    );
}