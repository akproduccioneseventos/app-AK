'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
    Zap, Loader2, AlertTriangle, PartyPopper, Calendar, Users, Palette, 
    ListChecks, DollarSign, Camera, Gift, Archive, 
    Video, Globe, MessageSquare, LayoutDashboard, Star, Calculator, ShoppingCart, 
    ClipboardList, QrCode, Printer, Settings2, KeyRound, ClipboardCheck, ArrowRight, MapPin,
    ArrowLeft, Clock, FileSignature, FileText, Receipt, FileX, ChevronDown, Bell,
    Activity, ShieldCheck, Users2, Search, Music, Package, Truck, UserCheck,
    Monitor, Tv, Gamepad2, Sparkles, UtensilsCrossed, Wine, CreditCard,
    BookOpen, Image, Hash, Lock, X, CheckCircle2, Mic, Smartphone
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById, updateModulosContratadosFiestaActual } from '@/app/actions/fiesta-actual';
import type { FiestaEnPlanificacion, ModulosContratados } from '@/types/fiesta';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { defaultModulosContratados } from '@/lib/fiesta-defaults';
import { ALWAYS_VISIBLE_PLANNER_MODULE_IDS } from '@/lib/planner-modules';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { calcFiestaProgress } from '@/lib/fiesta-progress';

const formatDate = (dateString?: string) => {
  if (!dateString) return "Fecha no definida";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  } catch (e) { return "Fecha inválida"; }
};

type ModuleBadge = 'Cliente' | 'Invitado' | 'Operativo' | 'Pantalla' | 'Interno' | 'Impresión' | 'VIP';

interface ModuleDefinition {
  id: string;
  title: string;
  href: string;
  icon: React.ElementType;
  description: string;
  category: string;
  color: string;
  badge?: ModuleBadge;
}

const modules: ModuleDefinition[] = [
  // 1. CENTRO DE PRODUCCIÓN
  { id: 'configuracion', title: "Configuración", href: "configuracion", icon: Settings2, description: "Datos maestros del evento.", category: 'CENTRO DE PRODUCCIÓN', color: "bg-slate-100 text-slate-600", badge: 'Interno' },
  { id: 'resumenPlanificacion', title: "Consolidado", href: "resumen-planificacion", icon: ClipboardCheck, description: "Visión total de lo pactado.", category: 'CENTRO DE PRODUCCIÓN', color: "bg-primary/10 text-primary", badge: 'Interno' },
  { id: 'tareas', title: "Tareas", href: "tareas", icon: ListChecks, description: "Checklist operativo del equipo.", category: 'CENTRO DE PRODUCCIÓN', color: "bg-slate-100 text-slate-600", badge: 'Interno' },
  { id: 'reuniones', title: "Reuniones", href: "reuniones", icon: MessageSquare, description: "Minutas y acuerdos con el cliente.", category: 'CENTRO DE PRODUCCIÓN', color: "bg-blue-100 text-blue-600", badge: 'Interno' },
  { id: 'documentos', title: "Documentos", href: "gestion-documental", icon: Archive, description: "Contratos, recibos y expedientes.", category: 'CENTRO DE PRODUCCIÓN', color: "bg-slate-100 text-slate-600", badge: 'Interno' },
  { id: 'costos', title: "Costos y Rentabilidad", href: "gestion-costos-rentabilidad", icon: DollarSign, description: "Márgenes y rentabilidad real del evento.", category: 'CENTRO DE PRODUCCIÓN', color: "bg-emerald-100 text-emerald-600", badge: 'Interno' },
  { id: 'planPagos', title: "Pagos", href: "plan-pagos", icon: CreditCard, description: "Plan de pagos y cuotas del evento.", category: 'CENTRO DE PRODUCCIÓN', color: "bg-green-100 text-green-600", badge: 'Interno' },

  // 2. OPERATIVA Y LOGÍSTICA
  { id: 'cargaOperativa', title: "Lista de Carga", href: "carga-operativa", icon: ClipboardList, description: "Lista operativa para utileros. Carga y retorno.", category: 'OPERATIVA Y LOGÍSTICA', color: "bg-amber-100 text-amber-700", badge: 'Operativo' },
  { id: 'logistica', title: "Logística", href: "logistica", icon: Truck, description: "Accesibilidad, estacionamiento y protocolo de lluvia.", category: 'OPERATIVA Y LOGÍSTICA', color: "bg-indigo-100 text-indigo-600", badge: 'Operativo' },
  { id: 'proveedoresPortal', title: "Proveedores", href: "proveedores-portal", icon: Users2, description: "Acceso restringido y coordinación con externos.", category: 'OPERATIVA Y LOGÍSTICA', color: "bg-cyan-100 text-cyan-700", badge: 'Operativo' },
  { id: 'personal', title: "Personal", href: "personal", icon: UserCheck, description: "Equipo asignado al evento y recibos.", category: 'OPERATIVA Y LOGÍSTICA', color: "bg-teal-100 text-teal-600", badge: 'Operativo' },
  { id: 'accesosPersonal', title: "Accesos Personal", href: "accesos-personal", icon: Lock, description: "Credenciales y control de acceso del equipo.", category: 'OPERATIVA Y LOGÍSTICA', color: "bg-slate-100 text-slate-600", badge: 'Operativo' },

  // 3. EXPERIENCIA DEL CLIENTE VIP
  { id: 'portalCliente', title: "Portal Cliente VIP", href: "portal-cliente", icon: KeyRound, description: "Centro de colaboración exclusivo para el cliente.", category: 'EXPERIENCIA DEL CLIENTE VIP', color: "bg-amber-100 text-amber-600", badge: 'Cliente' },
  { id: 'itinerario', title: "Itinerario", href: "itinerario", icon: Clock, description: "Cronograma minuto a minuto, vista cliente e interna.", category: 'EXPERIENCIA DEL CLIENTE VIP', color: "bg-blue-100 text-blue-600", badge: 'Cliente' },
  { id: 'musica', title: "Música", href: "musica", icon: Music, description: "Lista de temas y pedidos musicales del cliente.", category: 'EXPERIENCIA DEL CLIENTE VIP', color: "bg-purple-100 text-purple-600", badge: 'Cliente' },
  { id: 'videoVida', title: "Video de Vida", href: "video-vida", icon: Video, description: "Fotos de infancia y material para el video emotivo.", category: 'EXPERIENCIA DEL CLIENTE VIP', color: "bg-indigo-100 text-indigo-600", badge: 'Cliente' },
  { id: 'invitados', title: "Invitados", href: "invitados", icon: Users, description: "Lista completa, confirmaciones y gestión.", category: 'EXPERIENCIA DEL CLIENTE VIP', color: "bg-violet-100 text-violet-600", badge: 'Cliente' },

  // 4. PRODUCCIÓN MULTIMEDIA
  { id: 'fotografia', title: "Foto y Video", href: "fotografia", icon: Camera, description: "Seguimiento, entregas y material fotográfico.", category: 'PRODUCCIÓN MULTIMEDIA', color: "bg-purple-100 text-purple-600", badge: 'Interno' },
  { id: 'entretenimiento', title: "Entretenimiento", href: "entretenimiento", icon: Sparkles, description: "Fotocabina, 360, Bogue y Espejo Mágico conectados al QR, galería y muro social.", category: 'PRODUCCIÓN MULTIMEDIA', color: "bg-blue-100 text-blue-700", badge: 'Invitado' },
  { id: 'regalos', title: "Regalos", href: "regalos", icon: Gift, description: "Mesa de regalos digital para invitados.", category: 'PRODUCCIÓN MULTIMEDIA', color: "bg-violet-100 text-violet-700", badge: 'Invitado' },
  { id: 'buzon', title: "Buzón de Recuerdos", href: "buzon", icon: Mic, description: "Descarga de audios/videos del buzón y bienvenida.", category: 'PRODUCCIÓN MULTIMEDIA', color: "bg-purple-100 text-purple-700", badge: 'Cliente' },
  { id: 'postEvento', title: "Post-Evento", href: "post-evento", icon: Star, description: "NPS, galería y referidos post fiesta.", category: 'PRODUCCIÓN MULTIMEDIA', color: "bg-amber-100 text-amber-700", badge: 'Interno' },

  // 5. EXPERIENCIA DEL INVITADO VIP
  { id: 'paginaWeb', title: "Invitación Web", href: "pagina-web", icon: Globe, description: "Web pública interactiva para invitados.", category: 'EXPERIENCIA DEL INVITADO VIP', color: "bg-blue-100 text-blue-600", badge: 'Invitado' },
  { id: 'moduloInvitado', title: "Portal Invitado", href: "modulo-invitado", icon: Users, description: "Controla qué ve cada invitado en su portal.", category: 'EXPERIENCIA DEL INVITADO VIP', color: "bg-violet-100 text-violet-700", badge: 'Invitado' },
  { id: 'redSocial', title: "Red Social de la Fiesta", href: "social-fiesta-pro", icon: Smartphone, description: "Red social privada que funciona 30 días antes con interacción de invitados y feeds.", category: 'EXPERIENCIA DEL INVITADO VIP', color: "bg-fuchsia-100 text-fuchsia-700", badge: 'VIP' },
  { id: 'checkin', title: "QR / Check-in", href: "invitados/checkin-scanner", icon: QrCode, description: "Ingreso con QR y recepción de invitados.", category: 'EXPERIENCIA DEL INVITADO VIP', color: "bg-green-100 text-green-600", badge: 'Invitado' },
  { id: 'disenoSalon', title: "Mesas Asignadas", href: "invitados/layout", icon: LayoutDashboard, description: "Plano de mesas y asignación de invitados.", category: 'EXPERIENCIA DEL INVITADO VIP', color: "bg-indigo-100 text-indigo-600", badge: 'Invitado' },

  // 6. PANTALLA GIGANTE AK
  { id: 'enVivo', title: "Evento en Vivo", href: "en-vivo", icon: Zap, description: "Centro de operaciones para el día de la fiesta.", category: 'PANTALLA GIGANTE AK', color: "bg-primary text-white shadow-xl shadow-primary/30", badge: 'Pantalla' },
  { id: 'missionControl', title: "Mission Control", href: "mission-control", icon: Activity, description: "Control táctico minuto a minuto en tiempo real.", category: 'PANTALLA GIGANTE AK', color: "bg-indigo-600 text-white shadow-xl shadow-indigo-500/30", badge: 'Pantalla' },
  { id: 'muroSocial', title: "Muro Social & Pantalla", href: "muro-social", icon: Gamepad2, description: "Mural de fotos, playlist de pantalla, juegos interactivos y configuración de la pantalla gigante.", category: 'PANTALLA GIGANTE AK', color: "bg-violet-100 text-violet-700", badge: 'Pantalla' },
  { id: 'zonaDigital', title: "Zona Digital AK", href: "zona-digital", icon: Sparkles, description: "Retos, juegos, emojis, fotos, redes y experiencias para adolescentes.", category: 'PANTALLA GIGANTE AK', color: "bg-red-50 text-red-700", badge: 'Invitado' },
  { id: 'pantallasTotem', title: "Pantallas Tótem", href: "pantallas-totem", icon: Tv, description: "Tótems personalizados con QR, fotos sincronizadas, fondos en movimiento y modo pista.", category: 'PANTALLA GIGANTE AK', color: "bg-cyan-100 text-cyan-700", badge: 'Pantalla' },
  { id: 'readiness', title: "Readiness Score", href: "readiness", icon: ShieldCheck, description: "Semáforo de preparación del evento.", category: 'PANTALLA GIGANTE AK', color: "bg-emerald-100 text-emerald-700", badge: 'Interno' },
  { id: 'fiestaLista', title: "Fiesta Lista 100%", href: "fiesta-lista", icon: ClipboardCheck, description: "Checklist simple de demo, plantillas y salida a la luz.", category: 'PANTALLA GIGANTE AK', color: "bg-red-600 text-white shadow-xl shadow-red-500/25", badge: 'Interno' },
  { id: 'centroTotal', title: "Centro Total AK", href: "centro-total", icon: ShieldCheck, description: "Prueba de fiesta, salud, QR unico, post-fiesta, modo vendedor, agente y offline.", category: 'PANTALLA GIGANTE AK', color: "bg-slate-950 text-white shadow-xl shadow-slate-950/25", badge: 'Interno' },

  // 7. DISEÑO, SALÓN Y AMBIENTACIÓN
  { id: 'decoracion', title: "Decoración", href: "decoracion", icon: Palette, description: "Estilo, moodboard y ambientación del salón.", category: 'DISEÑO, SALÓN Y AMBIENTACIÓN', color: "bg-pink-100 text-pink-600", badge: 'Interno' },

  // 8. GASTRONOMÍA Y SERVICIO
  { id: 'catering', title: "Gastronomía / Catering", href: "catering", icon: UtensilsCrossed, description: "Cálculo de menú, insumos y porciones.", category: 'GASTRONOMÍA Y SERVICIO', color: "bg-orange-100 text-orange-600", badge: 'Interno' },
  { id: 'listaCompras', title: "Lista de Compras", href: "catering/lista-compras", icon: ShoppingCart, description: "Insumos necesarios para el catering.", category: 'GASTRONOMÍA Y SERVICIO', color: "bg-slate-100 text-slate-600", badge: 'Operativo' },
  { id: 'alergias', title: "Gestión Alimentaria", href: "alergias", icon: Users2, description: "Celíacos, alergias y dietas especiales.", category: 'GASTRONOMÍA Y SERVICIO', color: "bg-orange-100 text-orange-600", badge: 'Operativo' },
  { id: 'cartaTragos', title: "Carta de Tragos", href: "carta-tragos", icon: Wine, description: "Carta de bebidas para el evento.", category: 'GASTRONOMÍA Y SERVICIO', color: "bg-fuchsia-100 text-fuchsia-700", badge: 'Impresión' },
  { id: 'barraTecnologica', title: "Barra Tecnológica", href: "barra-tecnologica", icon: Wine, description: "Pantalla tactil de tragos, pantalla barman y fotos sociales con hashtag.", category: 'GASTRONOMÍA Y SERVICIO', color: "bg-rose-100 text-rose-700", badge: 'Invitado' },

  // 9. CARTELERÍA Y MATERIAL IMPRESO
  { id: 'carteleria', title: "Cartelería de Mesas", href: "carteleria", icon: Printer, description: "Kit completo: tragos, menú, QR y números.", category: 'CARTELERÍA Y MATERIAL IMPRESO', color: "bg-violet-100 text-violet-600", badge: 'Impresión' },
  { id: 'menuMesa', title: "Menú de Mesa", href: "menu-mesa", icon: BookOpen, description: "Menú impreso para cada mesa.", category: 'CARTELERÍA Y MATERIAL IMPRESO', color: "bg-slate-100 text-slate-600", badge: 'Impresión' },
  { id: 'numerosMesa', title: "Números de Mesa", href: "numeros-mesa", icon: Hash, description: "Impresión de señalética y números.", category: 'CARTELERÍA Y MATERIAL IMPRESO', color: "bg-slate-100 text-slate-600", badge: 'Impresión' },

  // 10. EVENTO EN VIVO / CENTRO DE OPERACIONES
  { id: 'feedback', title: "Feedback", href: "/settings/feedback", icon: Star, description: "Encuesta post-evento y NPS.", category: 'EVENTO EN VIVO / CENTRO DE OPERACIONES', color: "bg-yellow-100 text-yellow-600", badge: 'Interno' },
  { id: 'resumenImprimible', title: "Resumen Imprimible", href: "resumen-imprimible", icon: Printer, description: "Resumen completo listo para imprimir.", category: 'EVENTO EN VIVO / CENTRO DE OPERACIONES', color: "bg-slate-100 text-slate-600", badge: 'Operativo' },
];

const moduleCategories = [
  'CENTRO DE PRODUCCIÓN',
  'OPERATIVA Y LOGÍSTICA',
  'EXPERIENCIA DEL CLIENTE VIP',
  'PRODUCCIÓN MULTIMEDIA',
  'EXPERIENCIA DEL INVITADO VIP',
  'PANTALLA GIGANTE AK',
  'DISEÑO, SALÓN Y AMBIENTACIÓN',
  'GASTRONOMÍA Y SERVICIO',
  'CARTELERÍA Y MATERIAL IMPRESO',
  'EVENTO EN VIVO / CENTRO DE OPERACIONES',
];

const categoryMeta: Record<string, { icon: React.ElementType; color: string; description: string }> = {
  'CENTRO DE PRODUCCIÓN':              { icon: Settings2,       color: 'text-slate-700 bg-slate-100',   description: 'Configuración, tareas, reuniones, documentos y finanzas.' },
  'OPERATIVA Y LOGÍSTICA':             { icon: Truck,           color: 'text-amber-700 bg-amber-100',   description: 'Lista de carga, logística, proveedores y personal.' },
  'EXPERIENCIA DEL CLIENTE VIP':       { icon: KeyRound,        color: 'text-amber-600 bg-amber-50',    description: 'Portal VIP, itinerario, música, video de vida e invitados.' },
  'PRODUCCIÓN MULTIMEDIA':             { icon: Camera,          color: 'text-purple-700 bg-purple-100', description: 'Foto, video, regalos y material del evento.' },
  'EXPERIENCIA DEL INVITADO VIP':      { icon: Globe,           color: 'text-blue-700 bg-blue-100',     description: 'Invitación web, portal, red social, QR, check-in y mesas.' },
  'PANTALLA GIGANTE AK':               { icon: Tv,              color: 'text-indigo-700 bg-indigo-100', description: 'Evento en vivo, muro social, playlist, mission control y readiness.' },
  'DISEÑO, SALÓN Y AMBIENTACIÓN':      { icon: Palette,         color: 'text-pink-700 bg-pink-100',     description: 'Decoración, moodboard y ambientación del salón.' },
  'GASTRONOMÍA Y SERVICIO':            { icon: UtensilsCrossed, color: 'text-orange-700 bg-orange-100', description: 'Catering, menú, alergias, lista de compras y tragos.' },
  'CARTELERÍA Y MATERIAL IMPRESO':     { icon: Printer,         color: 'text-violet-700 bg-violet-100', description: 'Cartelería, números de mesa y menú impreso.' },
  'EVENTO EN VIVO / CENTRO DE OPERACIONES': { icon: Zap,        color: 'text-primary bg-primary/10',   description: 'Feedback, cierre del evento y resumen imprimible.' },
};

const badgeColors: Record<ModuleBadge, string> = {
  Cliente:   'bg-amber-100 text-amber-700 border-amber-200',
  Invitado:  'bg-blue-100 text-blue-700 border-blue-200',
  Operativo: 'bg-teal-100 text-teal-700 border-teal-200',
  Pantalla:  'bg-indigo-100 text-indigo-700 border-indigo-200',
  Interno:   'bg-slate-100 text-slate-600 border-slate-200',
  Impresión: 'bg-violet-100 text-violet-700 border-violet-200',
  VIP:        'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
};

type QuickMode = 'dia-evento' | 'preparacion' | 'cliente' | 'tecnologia' | null;

const quickModes: { id: QuickMode; label: string; icon: React.ElementType; color: string; moduleIds: string[] }[] = [
  { id: 'dia-evento',  label: 'Día del Evento',  icon: Zap,       color: 'bg-primary text-white',             moduleIds: ['centroTotal', 'enVivo', 'missionControl', 'itinerario', 'checkin', 'cargaOperativa', 'readiness', 'fiestaLista', 'muroSocial', 'zonaDigital', 'pantallasTotem', 'entretenimiento', 'barraTecnologica'] },
  { id: 'preparacion', label: 'Preparación',     icon: ListChecks, color: 'bg-teal-600 text-white',           moduleIds: ['centroTotal', 'fiestaLista', 'tareas', 'portalCliente', 'invitados', 'decoracion', 'catering', 'carteleria'] },
  { id: 'cliente',     label: 'Vista Cliente',   icon: KeyRound,  color: 'bg-amber-500 text-white',           moduleIds: ['portalCliente', 'itinerario', 'videoVida', 'invitados', 'musica', 'planPagos'] },
  { id: 'tecnologia',  label: 'Tecnología AK',   icon: Monitor,   color: 'bg-indigo-600 text-white',          moduleIds: ['centroTotal', 'paginaWeb', 'moduloInvitado', 'redSocial', 'muroSocial', 'zonaDigital', 'pantallasTotem', 'entretenimiento', 'barraTecnologica', 'enVivo', 'checkin'] },
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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMode, setActiveMode] = useState<QuickMode>(null);

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
    const previousModules = modulosContratados;
    const updatedModules = { ...modulosContratados, [moduleId]: checked };
    setModulosContratados(updatedModules);
    try {
      if (!fiesta) throw new Error('No hay un evento cargado.');
      const result = await updateModulosContratadosFiestaActual(fiesta.id, updatedModules);
      if (!result.success) throw new Error(result.error || 'No se pudo actualizar el módulo.');
      return true;
    } catch(e: any) {
      setModulosContratados(previousModules);
      toast({ title: "Error al guardar", description: e.message, variant: "destructive"});
      return false;
    }
  };

  const isModuleActive = (moduleId: string) =>
    ALWAYS_VISIBLE_PLANNER_MODULE_IDS.some(id => id === moduleId) || !!modulosContratados[moduleId as keyof ModulosContratados];

  const filteredModules = useMemo(() => {
    if (activeMode) {
      const modeIds = quickModes.find(m => m.id === activeMode)?.moduleIds ?? [];
      return modules.filter(m => modeIds.includes(m.id));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return modules.filter(m =>
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        (m.badge && m.badge.toLowerCase().includes(q))
      );
    }
    return modules;
  }, [searchQuery, activeMode]);
  const progress = useMemo(() => fiesta ? calcFiestaProgress(fiesta) : null, [fiesta]);

  if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  if (error || !fiesta) return <div className="text-center py-20 px-4"><AlertTriangle className="mx-auto text-destructive mb-4" /><p className="font-bold text-slate-800">{error || "Error al cargar."}</p></div>;

  const visibleCategories = activeMode || searchQuery.trim()
    ? Array.from(new Set(filteredModules.map(m => m.category)))
    : moduleCategories;

  return (
    <div className="space-y-6 sm:space-y-10 pb-24 px-1 sm:px-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 sm:gap-6 w-full md:w-auto">
          <div className="p-4 sm:p-5 bg-primary rounded-[1.5rem] shadow-2xl text-white shrink-0"><PartyPopper className="w-8 h-8 sm:w-10 sm:h-10" /></div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/70 mb-0.5">Centro de Producción Premium</p>
            <h1 className="text-xl sm:text-4xl md:text-5xl font-black tracking-tighter text-slate-900 font-headline uppercase truncate">{fiesta.configuracion.nombreEvento}</h1>
            <div className="text-slate-500 font-bold flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] sm:text-base">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0"/> {formatDate(fiesta.configuracion.fechaEvento)}</span>
                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0"/> {fiesta.configuracion.nombreLugar}</span>
            </div>
          </div>
        </motion.div>
        <div className="flex gap-2 w-full sm:w-auto">
            <Button asChild className="rounded-2xl px-6 sm:px-8 h-12 bg-primary shadow-xl font-black tracking-widest w-full text-xs sm:text-sm"><Link href={`/fiestas/nueva/en-vivo?fiestaId=${fiestaId}`} className="flex-1 sm:flex-none">
                    <Zap className="w-4 h-4 mr-2 sm:mr-3 animate-pulse"/> EN VIVO
                </Link></Button>
            <Button asChild variant="outline" className="rounded-2xl px-6 sm:px-8 h-12 border-slate-200 font-bold hover:bg-slate-50 transition-all w-full text-xs sm:text-sm"><Link href="/eventos" className="flex-1 sm:flex-none">
                    <ArrowLeft className="w-4 h-4 mr-2 sm:mr-3"/>Volver
                </Link></Button>
        </div>
      </div>

      {/* KPIs */}
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

      {progress && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 premium-shadow"
          aria-labelledby="next-actions-title"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">Guía diaria</p>
              <h2 id="next-actions-title" className="text-lg font-black text-slate-900">Qué hacer ahora</h2>
            </div>
            <Badge variant="outline" className="border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">
              Preparación {progress.overallPercentage}%
            </Badge>
          </div>

          {progress.alertas.length > 0 ? (
            <div className="mt-4 grid gap-2 lg:grid-cols-3">
              {progress.alertas.slice(0, 3).map((alerta) => {
                const content = (
                  <>
                    <AlertTriangle className={cn(
                      'h-4 w-4 shrink-0',
                      alerta.tipo === 'urgente' ? 'text-rose-600' : 'text-amber-600'
                    )} />
                    <span className="min-w-0 flex-1 text-sm font-bold text-slate-700">{alerta.mensaje}</span>
                    {alerta.accionUrl && <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />}
                  </>
                );

                return alerta.accionUrl ? (
                      <Link
                    key={alerta.id}
                    href={alerta.accionUrl}
                    className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    {content}
                  </Link>
                ) : (
                  <div key={alerta.id} className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    {content}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <p className="text-sm font-bold">No hay bloqueos críticos. Podés continuar con la preparación habitual.</p>
            </div>
          )}
        </motion.section>
      )}


      {/* Pre-event alerts banner */}
      {(() => {
        if (!fiesta.configuracion.fechaEvento) return null;
        const now = new Date();
        const eventDate = new Date(fiesta.configuracion.fechaEvento);
        const diffMs = eventDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (daysLeft < 0 || daysLeft > 7) return null;

        const alertConfig =
          daysLeft <= 1 ? { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-900', icon: 'text-amber-600', label: daysLeft <= 0 ? '¡HOY ES EL EVENTO! 🎉' : '¡MAÑANA ES EL EVENTO! 🚨' } :
          daysLeft <= 2 ? { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-800', icon: 'text-orange-500', label: `Faltan ${daysLeft} días para el evento 🔔` } :
          daysLeft <= 3 ? { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', icon: 'text-amber-500', label: `Faltan ${daysLeft} días para el evento ⏰` } :
          { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', icon: 'text-blue-500', label: `Faltan ${daysLeft} días para el evento 📅` };

        const pendingTasks = fiesta.tareas?.filter(t => !t.completada).length || 0;
        return (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-center gap-3 p-4 rounded-2xl border ${alertConfig.bg}`}>
            <Bell className={`w-5 h-5 shrink-0 ${alertConfig.icon}`} />
            <div className="flex-1 min-w-0">
              <p className={`font-black text-sm ${alertConfig.text}`}>{alertConfig.label}</p>
              {pendingTasks > 0 && (
                <p className={`text-xs font-bold mt-0.5 ${alertConfig.text} opacity-70`}>{pendingTasks} tarea{pendingTasks !== 1 ? 's' : ''} pendiente{pendingTasks !== 1 ? 's' : ''} — ¡revisá el checklist!</p>
              )}
            </div>
          </motion.div>
        );
      })()}

      {/* Generate Documents PDF – Quick Action Dropdown */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center justify-between gap-4 p-4 sm:p-5 bg-white rounded-2xl premium-shadow border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-black text-slate-800 text-sm sm:text-base tracking-tight">Generar Documentos PDF</p>
              <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest">Recibo, Contrato y Cancelación — Diseño Premium</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0 rounded-xl font-black text-[10px] uppercase tracking-widest gap-1.5">
                PDF <ChevronDown className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-slate-400">Documentos Disponibles</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/fiestas/nueva/gestion-documental/recibo-pago?fiestaId=${fiestaId}`} className="flex items-center gap-3 cursor-pointer">
                  <Receipt className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-bold text-sm">Recibo de Pago</p>
                    <p className="text-[10px] text-slate-400">Historial + Saldo pendiente</p>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/fiestas/nueva/gestion-documental/recibo-pago?fiestaId=${fiestaId}&includeContrato=true`} className="flex items-center gap-3 cursor-pointer">
                  <Receipt className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <p className="font-bold text-sm">Recibo + Contrato</p>
                    <p className="text-[10px] text-slate-400">Recibo pág. 1 · Contrato pág. 2–3</p>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/fiestas/nueva/gestion-documental/contrato-servicio?fiestaId=${fiestaId}`} className="flex items-center gap-3 cursor-pointer">
                  <FileSignature className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <p className="font-bold text-sm">Contrato de Servicios</p>
                    <p className="text-[10px] text-slate-400">16 cláusulas autocompletas</p>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/fiestas/nueva/gestion-documental/cancelacion-contrato?fiestaId=${fiestaId}`} className="flex items-center gap-3 cursor-pointer">
                  <FileX className="w-4 h-4 text-destructive shrink-0" />
                  <div>
                    <p className="font-bold text-sm">Constancia de Cancelación</p>
                    <p className="text-[10px] text-slate-400">Multa 30% + monto acordado</p>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/fiestas/nueva/gestion-documental/cancelacion-parcial?fiestaId=${fiestaId}`} className="flex items-center gap-3 cursor-pointer">
                  <FileX className="w-4 h-4 text-orange-500 shrink-0" />
                  <div>
                    <p className="font-bold text-sm">Cancelación Parcial</p>
                    <p className="text-[10px] text-slate-400">Baja de uno o más servicios</p>
                  </div>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      {fiesta.presupuestoId && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between gap-4 p-4 sm:p-5 bg-white rounded-2xl premium-shadow border border-slate-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-violet-100 rounded-xl shrink-0">
                <DollarSign className="w-5 h-5 text-violet-700" />
              </div>
              <div>
                <p className="font-black text-slate-800 text-sm sm:text-base tracking-tight">Modificar presupuesto contratado</p>
                <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest">Los cambios se reflejan en el portal del cliente</p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="rounded-xl font-black text-[10px] uppercase tracking-widest"><Link href={`/presupuestos/${fiesta.presupuestoId}/edit`} className="shrink-0">
                Editar presupuesto
              </Link></Button>
          </div>
        </motion.div>
      )}

      {/* Configurar Módulos accordion */}
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
                                        <Switch id={`switch-${module.id}`} checked={!!modulosContratados[module.id as keyof ModulosContratados]} onCheckedChange={(checked) => handleModuleToggle(module.id as keyof ModulosContratados, checked)} className="scale-75" />
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

      {/* Search bar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            aria-label="Buscar módulos del evento"
            placeholder="Buscá un módulo… (ej: cartelería, invitados, muro)"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setActiveMode(null); }}
            className="pl-11 pr-10 h-12 rounded-2xl border-slate-200 bg-white premium-shadow text-sm font-bold placeholder:text-slate-400 placeholder:font-normal focus-visible:ring-primary"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick mode filters */}
        <div className="flex flex-wrap gap-2">
          {quickModes.map(mode => (
            <button
              key={mode.id}
              onClick={() => { setActiveMode(activeMode === mode.id ? null : mode.id); setSearchQuery(''); }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border",
                activeMode === mode.id
                  ? cn(mode.color, "border-transparent shadow-lg scale-105")
                  : "bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary"
              )}
            >
              <mode.icon className="w-3.5 h-3.5" />
              {mode.label}
            </button>
          ))}
          {(activeMode || searchQuery) && (
            <button
              onClick={() => { setActiveMode(null); setSearchQuery(''); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest bg-slate-100 text-slate-500 hover:bg-slate-200 border border-transparent transition-all"
            >
              <X className="w-3.5 h-3.5" /> Limpiar
            </button>
          )}
        </div>

        {activeMode && (
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-xl border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <p className="text-xs font-bold text-primary">{quickModes.find(m => m.id === activeMode)?.label} — mostrando {filteredModules.length} módulo{filteredModules.length !== 1 ? 's' : ''}</p>
          </div>
        )}
      </motion.div>

      {/* Module grid grouped by category */}
      <div className="space-y-10 sm:space-y-16">
        <AnimatePresence>
          {visibleCategories.map((category) => {
            const meta = categoryMeta[category];
            const CategoryIcon = meta?.icon ?? Settings2;
            const allCategoryModules = filteredModules.filter(m => m.category === category);
            if (allCategoryModules.length === 0) return null;

            return (
              <motion.div key={category} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-5">
                {/* Category header */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={cn("p-2.5 rounded-xl shrink-0", meta?.color ?? 'text-slate-600 bg-slate-100')}>
                    <CategoryIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-xl md:text-2xl font-black font-headline text-slate-800 tracking-tighter uppercase">{category}</h3>
                    {meta?.description && <p className="text-[10px] text-slate-400 font-bold hidden sm:block">{meta.description}</p>}
                  </div>
                  <div className="h-px bg-gradient-to-r from-slate-200 to-transparent flex-grow hidden sm:block" />
                </div>

                {/* Modules Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {allCategoryModules.map((module) => {
                    const active = isModuleActive(module.id);
                    const moduleHref = module.href.startsWith('/') ? `${module.href}?fiestaId=${fiesta.id}` : `/fiestas/nueva/${module.href}?fiestaId=${fiesta.id}`;
                    return (
                      <motion.div key={module.id} whileHover={{ y: -6, scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                        <Link
                          href={moduleHref}
                          onClick={async event => {
                            if (!active) {
                              event.preventDefault();
                              const saved = await handleModuleToggle(module.id as keyof ModulosContratados, true);
                              if (saved) router.push(moduleHref);
                            }
                          }}
                        >
                          <Card className={cn(
                            "h-full border border-slate-100 transition-all duration-500 cursor-pointer flex flex-col group rounded-[2rem] overflow-hidden bg-white/80 backdrop-blur-md hover:shadow-2xl",
                              active
                                ? "hover:shadow-primary/10"
                              : "hover:shadow-slate-400/10"
                          )}>
                            <CardHeader className="flex-row items-center gap-4 space-y-0 pb-3 p-5 sm:p-6">
                              <div className={cn(
                                "p-3 rounded-2xl group-hover:rotate-12 transition-all duration-500 shadow-inner shrink-0",
                                active ? module.color : "bg-slate-100 text-slate-400"
                              )}>
                                <module.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <CardTitle className={cn("text-sm sm:text-base font-black leading-tight transition-colors", active ? "text-slate-800" : "text-slate-500")}>
                                  {module.title}
                                </CardTitle>
                                {module.badge && (
                                  <span className={cn(
                                    "inline-block mt-1 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full border",
                                    active ? badgeColors[module.badge] : "bg-slate-50 text-slate-400 border-slate-100"
                                  )}>
                                    {module.badge}
                                  </span>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="flex-grow pt-0 px-5 sm:px-6 pb-4">
                              <p className="text-[10px] sm:text-xs text-slate-400 font-medium line-clamp-2">{module.description}</p>
                            </CardContent>
                            <CardFooter className="bg-slate-50/50 p-3 flex justify-between items-center px-5 sm:px-6 border-t border-slate-50">
                              {active ? (
                                <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-600">
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                  </span>
                                  Activo
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                  <span className="h-2 w-2 rounded-full bg-slate-300"></span>
                                  Inactivo
                                </span>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "font-black text-[10px] uppercase tracking-[0.2em] rounded-xl px-3 h-7 transition-all",
                                  active
                                    ? "text-primary group-hover:bg-primary group-hover:text-white"
                                    : "text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-700"
                                )}
                              >
                                {active ? "Abrir" : "Activar y Abrir"} <ArrowRight className="w-3 h-3 ml-1.5 group-hover:translate-x-1 transition-transform"/>
                              </Button>
                            </CardFooter>
                          </Card>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredModules.length === 0 && (
          <div className="text-center py-20">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-4" />
            <p className="font-bold text-slate-500">No encontramos módulos que coincidan con tu búsqueda.</p>
            <p className="text-sm text-slate-400 mt-1">Probá con otro término o limpiá el filtro.</p>
          </div>
        )}
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
