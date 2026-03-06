'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle, PartyPopper, Calendar, Users, Palette, ChefHat, Music2, ListChecks, DollarSign, Camera, Gift, FileText, UserCheck, Clock, Archive, PackageSearch, Video, Globe, MessageSquare, LayoutDashboard, Star, Calculator, GlassWater, ShoppingCart, ClipboardList, QrCode, Printer, Settings2, KeyRound, ClipboardCheck, ArrowRight, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById, updateModulosContratadosFiestaActual, type FiestaEnPlanificacion, type ModulosContratados } from '../../actions/fiesta-actual';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { defaultModulosContratados } from '@/lib/fiesta-defaults';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

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
    <div className="space-y-10 pb-24">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-6">
          <div className="p-5 bg-primary rounded-[2rem] shadow-2xl shadow-primary/30 text-white transform hover:rotate-6 transition-transform duration-500">
            <PartyPopper className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-5xl font-black tracking-tighter text-slate-900 font-headline uppercase">{configuracion.nombreEvento}</h1>
            <p className="text-slate-500 font-bold flex items-center gap-3 mt-1">
                <Calendar className="w-4 h-4 text-primary"/> {formatDate(configuracion.fechaEvento)} 
                <span className="text-slate-300">•</span> 
                <MapPin className="w-4 h-4 text-primary"/> {configuracion.nombreLugar}
            </p>
          </div>
        </motion.div>
        <Link href="/eventos" passHref>
          <Button variant="outline" className="rounded-2xl px-8 h-12 border-slate-200 font-bold hover:bg-slate-50 transition-all">
            <ArrowLeft className="w-4 h-4 mr-3"/>Volver al Gestor
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Invitados" value={configuracion.invitadosEstimados.toString()} icon={Users} description={`${confirmedGuests} confirmados`}/>
        <KpiCard title="Pendientes" value={pendingTasks} icon={ListChecks} />
        <KpiCard title="Presupuesto" value={new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(Number(configuracion.presupuestoEstimado))} icon={DollarSign} />
        <KpiCard title="Fecha" value={new Date(configuracion.fechaEvento!).toLocaleDateString('es-ES', {month: 'short', day: 'numeric'})} icon={Calendar} />
      </div>

       <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1" className="border-none">
          <AccordionTrigger className="bg-white hover:bg-slate-50 px-8 h-16 rounded-[1.5rem] transition-all premium-shadow border-none">
            <div className="flex items-center gap-3 text-slate-700 font-black uppercase text-[10px] tracking-widest">
              <Settings2 className="w-5 h-5 text-primary"/>
              Configurar Visibilidad de Módulos
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-6">
            <div className="p-8 bg-white/50 backdrop-blur-xl rounded-[2rem] border border-slate-200 premium-shadow">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                    {moduleCategories.map(category => (
                        <div key={category} className="space-y-5">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 border-b border-primary/10 pb-3">{category}</h4>
                            <div className="space-y-1">
                                {modules.filter(m => m.category === category).map(module => (
                                    <div key={`${category}-${module.id}`} className="flex items-center justify-between p-2.5 hover:bg-white rounded-xl transition-all group">
                                        <Label htmlFor={`switch-${module.id}`} className="text-xs font-bold text-slate-600 cursor-pointer group-hover:text-primary transition-colors">{module.title}</Label>
                                        <Switch
                                            id={`switch-${module.id}`}
                                            checked={modulosContratados[module.id as keyof ModulosContratados]}
                                            onCheckedChange={(checked) => handleModuleToggle(module.id as keyof ModulosContratados, checked)}
                                            className="scale-75 data-[state=checked]:bg-primary"
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

      <div className="space-y-16">
          <AnimatePresence>
          {moduleCategories.map((category, catIdx) => {
            const categoryModules = modules.filter(m => m.category === category && modulosContratados[m.id as keyof ModulosContratados]);
            if (categoryModules.length === 0) return null;

            return (
              <motion.div 
                key={category} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <div className="flex items-center gap-6">
                    <h3 className="text-3xl font-black font-headline text-slate-800 shrink-0 tracking-tighter uppercase">{category}</h3>
                    <div className="h-px bg-gradient-to-r from-slate-200 to-transparent flex-grow"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {categoryModules.map((module, mIdx) => {
                    const hrefWithId = module.href.startsWith('/') 
                        ? getLinkHref(module.href)
                        : `/fiestas/nueva/${module.href}?fiestaId=${fiesta.id}`;
                    return (
                      <motion.div
                        key={`${module.id}-${mIdx}`}
                        whileHover={{ y: -8 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <Link href={hrefWithId} passHref className="block h-full">
                            <Card className="h-full border-none premium-shadow hover:shadow-primary/10 transition-all duration-500 cursor-pointer flex flex-col group rounded-[2.5rem] overflow-hidden bg-white">
                            <CardHeader className="flex-row items-center gap-5 space-y-0 pb-4 p-8">
                                <div className={cn("p-4 rounded-2xl group-hover:rotate-12 transition-all duration-500 shadow-inner", module.color)}>
                                    <module.icon className="w-7 h-7" />
                                </div>
                                <div className="min-w-0">
                                    <CardTitle className="text-lg font-black text-slate-800 truncate">{module.title}</CardTitle>
                                    <Badge className="bg-slate-100 text-slate-400 text-[8px] font-black tracking-widest uppercase border-none">Activo</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow pt-0 px-8 pb-8">
                                <p className="text-xs text-slate-400 leading-relaxed font-bold uppercase tracking-tighter line-clamp-2">{module.description}</p>
                            </CardContent>
                            <CardFooter className="bg-slate-50/50 p-4 flex justify-end px-8 border-t border-slate-50">
                                <Button variant="ghost" size="sm" className="text-primary font-black text-[10px] uppercase tracking-[0.2em] group-hover:bg-primary group-hover:text-white rounded-xl px-4 transition-all duration-500">
                                    Abrir <ArrowRight className="w-3.5 h-3.5 ml-2 group-hover:translate-x-1 transition-transform"/>
                                </Button>
                            </CardFooter>
                            </Card>
                        </Link>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            );
          })}
          </AnimatePresence>
      </div>
    </div>
  );
}

export default function PlannerDashboardPage() {
    return (
        <Suspense fallback={null}>
            <PlannerDashboardContent />
        </Suspense>
    );
}