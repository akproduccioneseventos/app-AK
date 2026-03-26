'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    Zap, Loader2, AlertTriangle, PartyPopper, Calendar, Users, Palette, 
    ListChecks, DollarSign, Camera, Gift, Archive, 
    Video, Globe, MessageSquare, LayoutDashboard, Star, Calculator, ShoppingCart, 
    ClipboardList, QrCode, Printer, Settings2, KeyRound, ClipboardCheck, ArrowRight, MapPin,
    ArrowLeft, Clock
} from 'lucide-react';
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
  } catch (e) { return "Fecha inválida"; }
};

const modules = [
  { id: 'configuracion', title: "Configuración", href: "configuracion", icon: Settings2, description: "Datos maestros del evento.", category: 'Gestión Central', color: "bg-slate-100 text-slate-600" },
  { id: 'resumenPlanificacion', title: "Consolidado", href: "resumen-planificacion", icon: ClipboardCheck, description: "Visión total de lo pactado.", category: 'Gestión Central', color: "bg-primary/10 text-primary" },
  { id: 'tareas', title: "Tareas", href: "tareas", icon: ListChecks, description: "Checklist operativo.", category: 'Gestión Central', color: "bg-slate-100 text-slate-600" },
  { id: 'documentos', title: "Documentos", href: "gestion-documental", icon: Archive, description: "Contratos y expedientes.", category: 'Gestión Central', color: "bg-slate-100 text-slate-600" },
  { id: 'costos', title: "Costos", href: "gestion-costos-rentabilidad", icon: DollarSign, description: "Rentabilidad real.", category: 'Gestión Central', color: "bg-emerald-100 text-emerald-600" },
  { id: 'reuniones', title: "Reuniones", href: "reuniones", icon: MessageSquare, description: "Minutas y acuerdos.", category: 'Gestión Central', color: "bg-blue-100 text-blue-600" },
  
  { id: 'invitados', title: "Invitados", href: "invitados", icon: Users, description: "Lista y confirmaciones.", category: 'Planificación del Evento', color: "bg-indigo-100 text-indigo-600" },
  { id: 'disenoSalon', title: "Diseño Salón", href: "invitados/layout", icon: LayoutDashboard, description: "Planimetría interactiva.", category: 'Planificación del Evento', color: "bg-indigo-100 text-indigo-600" },
  { id: 'decoracion', title: "Decoración", href: "decoracion", icon: Palette, description: "Estilo y ambientación.", category: 'Planificación del Evento', color: "bg-pink-100 text-pink-600" },
  { id: 'catering', title: "Gastronomía", href: "catering", icon: Calculator, description: "Cálculo de menú e insumos.", category: 'Planificación del Evento', color: "bg-orange-100 text-orange-600" },
  { id: 'cargaOperativa', title: "Carga", href: "carga-operativa", icon: ClipboardList, description: "Logística de traslado.", category: 'Planificación del Evento', color: "bg-slate-100 text-slate-600" },
  { id: 'fotografia', title: "Foto y Video", href: "fotografia", icon: Camera, description: "Seguimiento de entrega.", category: 'Planificación del Evento', color: "bg-purple-100 text-purple-600" },
  { id: 'itinerario', title: "Itinerario", href: "itinerario", icon: Clock, description: "Cronograma minuto a minuto.", category: 'Planificación del Evento', color: "bg-blue-100 text-blue-600" },
  
  { id: 'enVivo', title: "EVENTO EN VIVO", href: "en-vivo", icon: Zap, description: "Modo táctico para el día de la fiesta.", category: 'Evento en Vivo', color: "bg-primary text-white shadow-xl shadow-primary/30" },

  { id: 'portalCliente', title: "Portal Cliente", href: "portal-cliente", icon: KeyRound, description: "Centro de colaboración.", category: 'Portal del Cliente', color: "bg-amber-100 text-amber-600" },
  { id: 'paginaWeb', title: "Invitación Web", href: "pagina-web", icon: Globe, description: "Web pública interactiva.", category: 'Portal del Cliente', color: "bg-blue-100 text-blue-600" },
  { id: 'regalos', title: "Regalos", href: "regalos", icon: Gift, description: "Mesa de regalos digital.", category: 'Portal del Cliente', color: "bg-rose-100 text-rose-600" },
  { id: 'videoVida', title: "Video Vida", href: "video-vida", icon: Video, description: "Carga de fotos de infancia.", category: 'Portal del Cliente', color: "bg-indigo-100 text-indigo-600" },
  { id: 'feedback', title: "Feedback", href: "/settings/feedback", icon: Star, description: "Encuesta post-evento.", category: 'Portal del Cliente', color: "bg-yellow-100 text-yellow-600" },

  { id: 'checkin', title: "Check-in QR", href: "invitados/checkin-scanner", icon: QrCode, description: "Recepción de invitados.", category: 'Herramientas Adicionales', color: "bg-green-100 text-green-600" },
  { id: 'listaCompras', title: "Compras", href: "catering/lista-compras", icon: ShoppingCart, description: "Insumos necesarios.", category: 'Herramientas Adicionales', color: "bg-slate-100 text-slate-600" },
  { id: 'menuMesa', title: "Menú Mesa", href: "menu-mesa", icon: Printer, description: "Diseño impreso.", category: 'Herramientas Adicionales', color: "bg-slate-100 text-slate-600" },
  { id: 'numerosMesa', title: "Números Mesa", href: "invitados/numeros-mesa", icon: Printer, description: "Impresión de señalética.", category: 'Herramientas Adicionales', color: "bg-slate-100 text-slate-600" },
];

const moduleCategories = [
    'Gestión Central', 
    'Planificación del Evento',
    'Evento en Vivo',
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
    if (!fiestaId) { router.replace('/eventos'); return; }
    const loadFiesta = async () => {
      setIsLoading(true);
      try {
        const fiestaData = await getFiestaById(fiestaId);
        if (!fiestaData) throw new Error("No se encontró el evento.");
        setFiesta(fiestaData);
        setModulosContratados({ ...defaultModulosContratados, ...(fiestaData.modulosContratados || {}) });
      } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
    };
    loadFiesta();
  }, [fiestaId, router]);

  const handleModuleToggle = async (moduleId: keyof ModulosContratados, checked: boolean) => {
    const updatedModules = { ...modulosContratados, [moduleId]: checked };
    setModulosContratados(updatedModules);
    try {
      if(fiesta) await updateModulosContratadosFiestaActual(fiesta.id, updatedModules);
    } catch(e: any) { toast({ title: "Error al guardar", variant: "destructive"}); }
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  if (error || !fiesta) return <div className="text-center py-20 px-4"><AlertTriangle className="mx-auto text-destructive mb-4" /><p className="font-bold text-slate-800">{error || "Error al cargar."}</p></div>;

  return (
    <div className="space-y-6 sm:space-y-10 pb-24 px-1 sm:px-0">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 sm:gap-6 w-full md:w-auto">
          <div className="p-4 sm:p-5 bg-primary rounded-[1.5rem] shadow-2xl text-white shrink-0"><PartyPopper className="w-8 h-8 sm:w-10 sm:h-10" /></div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-4xl md:text-5xl font-black tracking-tighter text-slate-900 font-headline uppercase truncate">{fiesta.configuracion.nombreEvento}</h1>
            <div className="text-slate-500 font-bold flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] sm:text-base">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0"/> {formatDate(fiesta.configuracion.fechaEvento)}</span>
                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0"/> {fiesta.configuracion.nombreLugar}</span>
            </div>
          </div>
        </motion.div>
        <div className="flex gap-2 w-full sm:w-auto">
            <Link href={`/fiestas/nueva/en-vivo?fiestaId=${fiestaId}`} className="flex-1 sm:flex-none">
                <Button className="rounded-2xl px-6 sm:px-8 h-12 bg-primary shadow-xl font-black tracking-widest w-full text-xs sm:text-sm">
                    <Zap className="w-4 h-4 mr-2 sm:mr-3 animate-pulse"/> EN VIVO
                </Button>
            </Link>
            <Link href="/eventos" className="flex-1 sm:flex-none">
                <Button variant="outline" className="rounded-2xl px-6 sm:px-8 h-12 border-slate-200 font-bold hover:bg-slate-50 transition-all w-full text-xs sm:text-sm">
                    <ArrowLeft className="w-4 h-4 mr-2 sm:mr-3"/>Volver
                </Button>
            </Link>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Invitados" value={fiesta.configuracion.invitadosEstimados.toString()} icon={Users} />
        <KpiCard title="Tareas" value={fiesta.tareas?.filter(t => !t.completada).length || 0} icon={ListChecks} />
        <div className="hidden sm:block">
            <KpiCard title="Presupuesto" value={new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(Number(fiesta.configuracion.presupuestoEstimado))} icon={DollarSign} />
        </div>
        <div className="sm:hidden">
            <KpiCard title="Ingreso" value={new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(Number(fiesta.configuracion.presupuestoEstimado)).split(',')[0]} icon={DollarSign} />
        </div>
        <KpiCard title="Fecha" value={new Date(fiesta.configuracion.fechaEvento!).toLocaleDateString('es-ES', {month: 'short', day: 'numeric'})} icon={Calendar} />
      </div>

       <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="settings" className="border-none">
          <AccordionTrigger className="bg-white hover:bg-slate-50 px-4 h-16 rounded-2xl premium-shadow border-none group">
            <div className="flex items-center gap-3 text-slate-700 font-black uppercase text-[10px] tracking-widest">
              <Settings2 className="w-5 h-5 text-primary shrink-0 group-hover:rotate-90 transition-transform duration-500"/> Configurar Módulos
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-6">
            <div className="p-4 sm:p-8 bg-white/50 backdrop-blur-xl rounded-[2rem] border border-slate-200 premium-shadow">
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {moduleCategories.map(category => (
                        <div key={category} className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 border-b pb-3">{category}</h4>
                            <div className="space-y-1">
                                {modules.filter(m => m.category === category).map(module => (
                                    <div key={module.id} className="flex items-center justify-between p-2 rounded-xl group hover:bg-white transition-colors">
                                        <Label htmlFor={`switch-${module.id}`} className="text-xs font-bold text-slate-600 cursor-pointer group-hover:text-primary">{module.title}</Label>
                                        <Switch id={`switch-${module.id}`} checked={modulosContratados[module.id as keyof ModulosContratados]} onCheckedChange={(checked) => handleModuleToggle(module.id as keyof ModulosContratados, checked)} className="scale-75" />
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

      <div className="space-y-10 sm:space-y-16">
          <AnimatePresence>
          {moduleCategories.map((category) => {
            const categoryModules = modules.filter(m => m.category === category && (modulosContratados[m.id as keyof ModulosContratados] || m.id === 'enVivo'));
            if (categoryModules.length === 0) return null;
            return (
              <motion.div key={category} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
                <div className="flex items-center gap-4"><h3 className="text-xl sm:text-2xl md:text-3xl font-black font-headline text-slate-800 shrink-0 tracking-tighter uppercase">{category}</h3><div className="h-px bg-gradient-to-r from-slate-200 to-transparent flex-grow"></div></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
                  {categoryModules.map((module) => (
                    <motion.div key={module.id} whileHover={{ y: -8 }}>
                        <Link href={module.href.startsWith('/') ? `${module.href}?fiestaId=${fiesta.id}` : `/fiestas/nueva/${module.href}?fiestaId=${fiesta.id}`}>
                            <Card className="h-full border-none premium-shadow hover:shadow-primary/10 transition-all duration-500 cursor-pointer flex flex-col group rounded-[2.5rem] overflow-hidden bg-white">
                            <CardHeader className="flex-row items-center gap-4 space-y-0 pb-4 p-6 sm:p-8">
                                <div className={cn("p-3 sm:p-4 rounded-2xl group-hover:rotate-12 transition-all duration-500 shadow-inner shrink-0", module.color)}><module.icon className="w-6 h-6 sm:w-7 sm:h-7" /></div>
                                <div className="min-w-0">
                                    <CardTitle className="text-sm sm:text-lg font-black text-slate-800">{module.title}</CardTitle>
                                    <Badge className="bg-slate-100 text-slate-400 text-[8px] font-black tracking-widest uppercase border-none h-4">Activo</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow pt-0 px-6 sm:px-8 pb-6"><p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-tighter line-clamp-2">{module.description}</p></CardContent>
                            <CardFooter className="bg-slate-50/50 p-3 sm:p-4 flex justify-end px-6 sm:px-8 border-t border-slate-50">
                                <Button variant="ghost" size="sm" className="text-primary font-black text-[10px] uppercase tracking-[0.2em] group-hover:bg-primary group-hover:text-white rounded-xl px-4 h-8 transition-all">Abrir <ArrowRight className="w-3.5 h-3.5 ml-2 group-hover:translate-x-1 transition-transform"/></Button>
                            </CardFooter>
                            </Card>
                        </Link>
                    </motion.div>
                  ))}
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
