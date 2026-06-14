'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { 
  Loader2, MessageSquare, ArrowRight, ArrowLeft, Check, Gift,
  Users, CalendarDays, Sparkles, Star, Phone, User,
  Download, Zap, Clock, PartyPopper, X, Send, CheckCircle2,
  CalendarCheck, ChevronRight, Menu, HelpCircle, AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateBudgetAndLeadFromSimulator, getArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import { getBudgetDisplaySettings } from '@/app/actions/settings';
import { checkDateAvailability } from '@/app/actions/simulador-v2';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import { getMenus } from '@/app/actions/menus-catering';
import { getWhatsAppConfig } from '@/app/actions/whatsapp';
import { CompanyLogo } from '@/components/company-logo';
import { Checkbox } from '@/components/ui/checkbox';
import {
  isPackageApplicableToEventType,
  type ArmadoRapidoConfig,
} from '@/types/armado-rapido';
import { defaultClubUruguayConfig } from '@/types/armado-rapido';
import type { FullMenu, MenuItem } from '@/types/catering';
import type { ServicioEmpresa } from '@/types/empresa';
import { cn } from '@/lib/utils';
import {
  DEFAULT_ANNUAL_ADJUSTMENT_PERCENTAGE,
} from '@/lib/budget/formal-budget';
import { getCateringDishImage } from '@/lib/catering/menu-images';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  calculateSimulatorPricing,
  simulatorDetailsToBudgetItems,
  type SimulatorDetailedService,
  type SimulatorPriceStats,
} from '@/lib/simulator/pricing';

// ─── Constants ───────────────────────────────────────────────────────────────

const WHATSAPP_NUMBER = '59898355530';
const DEFAULT_DISCOUNT = 15;

type EventType = 'cumpleanos' | 'cumpleanosInfantil' | 'quince' | 'boda' | 'empresarial';

const EVENT_META: Record<EventType, { label: string; emoji: string }> = {
  cumpleanos: { label: 'Cumpleaños', emoji: '🎂' },
  cumpleanosInfantil: { label: 'Cumpleaños infantil', emoji: '🧒' },
  quince:     { label: '15 años',   emoji: '🎀' },
  boda:       { label: 'Boda',      emoji: '💍' },
  empresarial:{ label: 'Evento empresarial', emoji: '🏢' },
};

interface ChatMessage {
  role: 'assistant' | 'user';
  text: string;
  key: string;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n);
}

function safeImageUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/')) return url;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol) ? url : undefined;
  } catch {
    return undefined;
  }
}

function menuItemToServicioEmpresa(item: MenuItem & { precioVenta: number }): ServicioEmpresa {
  return {
    id: item.id,
    nombre: item.name,
    tipoItem: 'Servicio',
    categoria: 'Servicio de catering',
    subcategoria: item.type,
    calculationMethod: 'porPersona',
    precioPorPersona: item.precioVenta,
    precioVenta: item.precioVenta,
    precioBase: item.precioVenta,
    valorUnitarioEstimado: item.totalDishCost,
    imageUrl: getCateringDishImage(item),
  };
}

function SimuladorAKContent() {
  const { toast } = useToast();
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // App Config States
  const [config, setConfig] = useState<ArmadoRapidoConfig | null>(null);
  const [serviciosCatalogo, setServiciosCatalogo] = useState<ServicioEmpresa[]>([]);
  const [annualAdjustmentPercentage, setAnnualAdjustmentPercentage] = useState<number>(DEFAULT_ANNUAL_ADJUSTMENT_PERCENTAGE);
  const [availableMenus, setAvailableMenus] = useState<FullMenu[]>([]);
  const [empresaPhone, setEmpresaPhone] = useState<string>(WHATSAPP_NUMBER);
  const [isLoading, setIsLoading] = useState(true);

  // Form selections states
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteContacto, setClienteContacto] = useState('');
  const [eventoTipo, setEventoTipo] = useState<EventType | ''>('cumpleanos');
  const [adultos, setAdultos] = useState<number>(80);
  const [ninosYAdolescentes, setNinosYAdolescentes] = useState<number>(10);
  const [duracionHoras, setDuracionHoras] = useState<number>(5);
  const [eventoFecha, setEventoFecha] = useState<Date | undefined>(undefined);
  const [selectedPaqueteId, setSelectedPaqueteId] = useState<string>('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedEntradas, setSelectedEntradas] = useState<string[]>([]);
  const [selectedPrincipal, setSelectedPrincipal] = useState<string>('');
  const [selectedInfantil, setSelectedInfantil] = useState<string>('');
  const [incluirClubUruguay, setIncluirClubUruguay] = useState(false);
  const [tieneSalon, setTieneSalon] = useState<boolean | null>(null);
  const [eventoHoraInicio, setEventoHoraInicio] = useState<string>('21:00');

  // IA Chat States
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { role: 'assistant', text: '¡Hola! Soy Sofía, tu copiloto de eventos en AK Producciones 👋', key: 'welcome_1' },
    { role: 'assistant', text: 'Configurá los datos de tu fiesta a la izquierda y charlemos por acá. Te ayudo a optimizar el presupuesto y elegir los mejores servicios en un toque.', key: 'welcome_2' },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [suggestionPill, setSuggestionPill] = useState<{ label: string; messageToSubmit: string } | null>(null);
  const [pulsingFields, setPulsingFields] = useState<Record<string, boolean>>({});
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  // Conversion States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Load configuration
  useEffect(() => {
    Promise.all([
      getArmadoRapidoConfig().catch(() => null),
      getBudgetDisplaySettings().catch(() => null),
      getServiciosEmpresa().catch(() => [] as ServicioEmpresa[]),
      getMenus().catch(() => [] as FullMenu[]),
      getWhatsAppConfig().catch(() => null),
    ]).then(([armadoConfig, budgetSettings, servicios, menus, waConfig]) => {
      if (armadoConfig) {
        setConfig(armadoConfig);
      }
      if (budgetSettings?.annualAdjustmentPercentage !== undefined) {
        setAnnualAdjustmentPercentage(budgetSettings.annualAdjustmentPercentage);
      }
      if (Array.isArray(servicios)) {
        setServiciosCatalogo(servicios.filter(s => s.tipoItem === 'Servicio'));
      }
      if (Array.isArray(menus)) {
        setAvailableMenus(menus);
      }
      if (waConfig?.phoneNumber) {
        setEmpresaPhone(waConfig.phoneNumber);
      }
      setIsLoading(false);
    });
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isAiLoading]);

  // Extract menus dynamically based on catalog/config
  const { entradasDisponibles, principalesDisponibles, menusNinoDisponibles } = useMemo(() => {
    if (!config || !availableMenus.length) {
      return { entradasDisponibles: [], principalesDisponibles: [], menusNinoDisponibles: [] };
    }
    const allDishes: MenuItem[] = [];
    availableMenus.forEach(menu => {
      if (menu.items) {
        menu.items.forEach(item => {
          if (!allDishes.some(d => d.id === item.id)) {
            allDishes.push(item);
          }
        });
      }
    });

    const getPlatoSettings = (platoId: string) => {
        return config.platosVisibles?.find(p => p.id === platoId) || { id: platoId, visible: true, recommended: false };
    };

    const sortDishes = (a: any, b: any) => {
        const setA = getPlatoSettings(a.id);
        const setB = getPlatoSettings(b.id);
        const featuredA = Boolean(a.isFeatured || setA.recommended);
        const featuredB = Boolean(b.isFeatured || setB.recommended);
        if (featuredA && !featuredB) return -1;
        if (!featuredA && featuredB) return 1;
        const pA = a.precioVenta || 0;
        const pB = b.precioVenta || 0;
        return pB - pA;
    };

    const visibleDishes = allDishes.filter(d => getPlatoSettings(d.id).visible);

    const withPrices = visibleDishes.map(dish => {
      const match = allDishes.find(ad => ad.id === dish.id);
      const sellPrice = match ? (match.suggestedSellingPrice ?? ((match.totalDishCost || 0) * (1 + (match.profitMargin ?? 120) / 100))) : 0;
      return {
        ...dish,
        precioVenta: sellPrice,
      };
    }).sort(sortDishes);

    return {
      entradasDisponibles: withPrices.filter(d => d.type === 'Entrada').map(d => menuItemToServicioEmpresa(d as any)),
      principalesDisponibles: withPrices.filter(d => d.type === 'Plato Principal').map(d => menuItemToServicioEmpresa(d as any)),
      menusNinoDisponibles: withPrices.filter(d => d.type === 'Menú Infantil/Adolescente' || d.type === 'Menú Infantil').map(d => menuItemToServicioEmpresa(d as any)),
    };
  }, [config, availableMenus]);

  const allSimuladorServices = useMemo(() => {
    return [...entradasDisponibles, ...principalesDisponibles, ...menusNinoDisponibles, ...serviciosCatalogo];
  }, [entradasDisponibles, principalesDisponibles, menusNinoDisponibles, serviciosCatalogo]);
  const applicablePackages = useMemo(() => {
    const eventLabel = eventoTipo ? EVENT_META[eventoTipo]?.label : '';
    return (config?.paquetes || []).filter((pkg) =>
      isPackageApplicableToEventType(pkg, eventLabel)
    );
  }, [config, eventoTipo]);
  const packageSummaries = useMemo<Map<string, {
    total: number;
    services: SimulatorDetailedService[];
  }>>(() => {
    if (!config || !allSimuladorServices.length) return new Map();

    return new Map(applicablePackages.map((pkg) => {
      const pricing = calculateSimulatorPricing({
        config,
        services: allSimuladorServices,
        adultos,
        ninosYAdolescentes,
        selectedPaqueteId: pkg.id,
        eventoFecha,
        annualAdjustmentPercentage,
      });

      return [pkg.id, {
        total: pricing.totalFinal,
        services: pricing.detallados,
      }];
    }));
  }, [
    config,
    allSimuladorServices,
    applicablePackages,
    adultos,
    ninosYAdolescentes,
    eventoFecha,
    annualAdjustmentPercentage,
  ]);

  useEffect(() => {
    if (selectedPaqueteId && !applicablePackages.some((pkg) => pkg.id === selectedPaqueteId)) {
      setSelectedPaqueteId('');
    }
  }, [applicablePackages, selectedPaqueteId]);

  // Both public simulators use the same pricing engine and save today's price.
  const priceStats = useMemo<SimulatorPriceStats | null>(() => {
    if (!config || !allSimuladorServices.length) return null;

    const selected = [
      ...selectedServices,
      ...selectedEntradas,
      ...(selectedPrincipal ? [selectedPrincipal] : []),
      ...(selectedInfantil ? [selectedInfantil] : []),
    ].map((id) => ({ id }));

    const clubUruguayCfg = config.clubUruguayConfig || defaultClubUruguayConfig;
    const syntheticServices = tieneSalon === false && incluirClubUruguay && clubUruguayCfg.activo
      ? [{
          servicio: {
            id: 'serv_salon_club_uruguay',
            nombre: 'Salón Club Uruguay',
            tipoItem: 'Servicio' as const,
            categoria: 'Otros servicios' as const,
            precioVenta: clubUruguayCfg.precio,
            precioBase: clubUruguayCfg.precio,
            calculationMethod: 'fijo' as const,
          },
        }]
      : [];

    return calculateSimulatorPricing({
      config,
      services: allSimuladorServices,
      adultos,
      ninosYAdolescentes,
      selectedPaqueteId,
      selectedServices: selected,
      syntheticServices,
      eventoFecha,
      annualAdjustmentPercentage,
    });
  }, [
    config, allSimuladorServices, adultos, ninosYAdolescentes, selectedPaqueteId,
    selectedServices, selectedEntradas, selectedPrincipal, selectedInfantil,
    tieneSalon, incluirClubUruguay, eventoFecha, annualAdjustmentPercentage
  ]);

  // Flash pulse highlight animation for fields changed by AI
  const triggerPulseHighlight = (changes: any) => {
    const fields: Record<string, boolean> = {};
    Object.keys(changes).forEach(key => {
      fields[key] = true;
    });
    setPulsingFields(fields);
    setTimeout(() => {
      setPulsingFields({});
    }, 3000);
  };

  // Submit chat message to server action
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    if (!textToSend) setInputMessage('');
    
    // Add user bubble
    const userMsgKey = `user_${Date.now()}`;
    setChatHistory(prev => [...prev, { role: 'user', text, key: userMsgKey }]);
    setIsAiLoading(true);
    setSuggestionPill(null);

    try {
      const { chatWithBudgetCopilot } = await import('@/app/actions/simulador-copilot');

      const currentState = {
        eventoTipo,
        adultos,
        ninosYAdolescentes,
        eventoFecha: eventoFecha?.toISOString().split('T')[0],
        eventoHoraInicio,
        selectedPaqueteId,
        selectedServices,
        selectedEntradas,
        selectedPrincipal,
        selectedInfantil,
        incluirClubUruguay,
        duracionHoras,
      };

      const historyToSend = chatHistory.map(m => ({
        role: m.role,
        content: m.text
      }));

      const res = await chatWithBudgetCopilot({
        message: text,
        history: historyToSend,
        currentState,
      });

      // Add assistant bubble
      const botMsgKey = `bot_${Date.now()}`;
      setChatHistory(prev => [...prev, { role: 'assistant', text: res.response, key: botMsgKey }]);

      // Check if IA returned structured simulator changes
      if (res.action?.type === 'apply_changes' && res.action.changes) {
        const changes = res.action.changes;
        
        if (changes.eventoTipo !== undefined && changes.eventoTipo in EVENT_META) {
          setEventoTipo(changes.eventoTipo as EventType);
        }
        if (changes.adultos !== undefined) setAdultos(changes.adultos);
        if (changes.ninosYAdolescentes !== undefined) setNinosYAdolescentes(changes.ninosYAdolescentes);
        if (changes.eventoFecha !== undefined) setEventoFecha(new Date(changes.eventoFecha));
        if (changes.selectedPaqueteId !== undefined) setSelectedPaqueteId(changes.selectedPaqueteId);
        if (changes.selectedServices !== undefined) setSelectedServices(changes.selectedServices);
        if (changes.selectedEntradas !== undefined) setSelectedEntradas(changes.selectedEntradas);
        if (changes.selectedPrincipal !== undefined) setSelectedPrincipal(changes.selectedPrincipal);
        if (changes.selectedInfantil !== undefined) setSelectedInfantil(changes.selectedInfantil);
        if (changes.incluirClubUruguay !== undefined) setIncluirClubUruguay(changes.incluirClubUruguay);
        if (changes.duracionHoras !== undefined) setDuracionHoras(changes.duracionHoras);

        triggerPulseHighlight(changes);
        toast({
          title: 'Presupuesto optimizado por Sofía',
          description: 'Se aplicaron los cambios sugeridos a la izquierda.',
        });
      }

      if (res.suggestionPill) {
        setSuggestionPill(res.suggestionPill);
      }

    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Error de red',
        description: 'Sofía tuvo un problemita de señal. Probá de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  // Trigger CRM creation and lead generation
  const handleSaveBudget = async () => {
    if (!clienteNombre.trim() || !clienteContacto.trim()) {
      toast({
        title: 'Faltan datos de contacto',
        description: 'Por favor, ingresá tu Nombre y Teléfono en la sección inicial de la izquierda.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const items = simulatorDetailsToBudgetItems(priceStats?.detallados || []);

      const result = await generateBudgetAndLeadFromSimulator({
        clienteNombre: clienteNombre.trim(),
        clienteContacto,
        eventoFecha: eventoFecha?.toISOString() || new Date().toISOString(),
        adultos,
        ninos: ninosYAdolescentes,
        subtotal: priceStats?.subtotalVenta ?? 0,
        costoEstimado: priceStats?.totalFinal ?? 0,
        descuentoGeneral: priceStats?.discountPercentage ?? DEFAULT_DISCOUNT,
        ajusteAnualActivo: Boolean(priceStats?.annualProjection.applies),
        ajusteAnualPorcentaje: priceStats?.annualProjection.adjustmentPct ?? annualAdjustmentPercentage,
        paqueteNombre: config?.paquetes.find(p => p.id === selectedPaqueteId)?.nombre || 'A medida',
        serviciosIncluidos: items.map(i => i.idServicioCatalogo),
        items,
      }, {
        source: 'simulator_assistant',
        eventoTipo: eventoTipo ? EVENT_META[eventoTipo as EventType]?.label : 'Evento',
        salonFiestas: tieneSalon === false && incluirClubUruguay ? 'Club Uruguay' : (tieneSalon ? 'Salón propio' : 'A definir'),
      });

      if (result.success && result.presupuestoId) {
        setGeneratedId(result.presupuestoId);
        if (result.token) setToken(result.token);

        setChatHistory(prev => [
          ...prev,
          { role: 'assistant', text: `✅ ¡Bárbaro ${clienteNombre}! Tu presupuesto quedó guardado bajo el número *#${result.presupuestoId}*.`, key: 'success_1' },
          { role: 'assistant', text: 'Escribime por WhatsApp pulsando el botón verde de abajo para coordinar una reunión sin costo y congelar los precios.', key: 'success_2' }
        ]);

        toast({
          title: 'Presupuesto guardado',
          description: '¡Revisá el chat del asistente para ver los próximos pasos!',
        });

        // Open chat drawer on mobile
        setIsMobileChatOpen(true);
      } else {
        throw new Error(result.error || 'Error al guardar');
      }

    } catch (e: any) {
      toast({
        title: 'Error al procesar',
        description: e.message || 'No se pudo guardar el presupuesto.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWhatsAppLink = () => {
    const pkgName = config?.paquetes.find(p => p.id === selectedPaqueteId)?.nombre || 'A medida';
    const totalEst = priceStats ? formatCurrency(priceStats.totalFinal) : 'A definir';
    const text = `¡Hola! Usé el Simulador Inteligente de AK Producciones.
*Nombre:* ${clienteNombre}
*Invitados:* ${adultos + ninosYAdolescentes} personas
*Paquete:* ${pkgName}
*Total estimado:* ${totalEst}
*Presupuesto:* #${generatedId || 'A generar'}
${generatedId ? `*Link:* ${window.location.origin}/presupuestos/${generatedId}/ver?cliente=1&token=${token || ''}` : ''}`;
    
    return `https://wa.me/${empresaPhone}?text=${encodeURIComponent(text)}`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
        <p className="text-sm text-slate-500">Iniciando simulador inteligente...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-purple-500/30">
      
      {/* HEADER BANNER */}
      <header className="sticky top-0 z-50 flex flex-col gap-3 border-b border-slate-200 bg-white/80 backdrop-blur-xl px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:py-5 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <CompanyLogo className="h-9 w-auto shrink-0 sm:h-10" />
          <div className="min-w-0">
            <h1 className="flex items-center gap-1.5 text-base font-black uppercase tracking-wider text-transparent bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text sm:text-xl">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Simulador Inteligente AK
            </h1>
            <p className="hidden text-xs text-slate-500 sm:block">Diseñá tu fiesta ideal en tiempo real con asistencia de IA</p>
          </div>
        </div>
        <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
          <Button asChild variant="outline" className="min-w-0 flex-1 rounded-full border-white/10 px-3 text-xs text-slate-600 hover:bg-white/5 sm:flex-none">
            <Link href="/simulador-de-presupuesto">
              <span className="sm:hidden">Paquetes manuales</span>
              <span className="hidden sm:inline">Elegir paquetes manualmente</span>
            </Link>
          </Button>
          <Button 
            onClick={() => setIsMobileChatOpen(true)}
            className="md:hidden bg-purple-600 hover:bg-purple-700 text-white rounded-full p-2 h-9 w-9 flex items-center justify-center relative"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
          </Button>
        </div>
      </header>

      {/* BODY SPLIT LAYOUT */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] lg:grid-cols-[1.15fr_0.85fr] relative overflow-hidden">
        
        {/* LEFT PANEL: STRUCTURED FORM */}
        <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(100vh-80px)] space-y-6">
          
          {/* STEP 1: CLIENT INFO */}
          <Card className={cn(
            "bg-white/80 backdrop-blur-lg border-slate-200 text-white rounded-3xl transition-all duration-300 shadow-xl shadow-slate-200/50",
            pulsingFields.nombre && "ring-2 ring-purple-500 bg-purple-50"
          )}>
            <CardHeader className="pb-3">
              <CardTitle className="text-md font-bold uppercase tracking-wider text-purple-600 flex items-center gap-2">
                <User className="w-4 h-4" /> 1. Datos de Contacto
              </CardTitle>
              <CardDescription className="text-slate-500">Ingresá tus datos para guardar el avance</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Nombre y Apellido</Label>
                <Input 
                  placeholder="Ej: Laura Pérez" 
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  className="bg-white border-slate-200 focus:border-purple-500 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider">WhatsApp/Teléfono</Label>
                <Input 
                  placeholder="Ej: 099123456" 
                  value={clienteContacto}
                  onChange={(e) => setClienteContacto(e.target.value)}
                  className="bg-white border-slate-200 focus:border-purple-500 rounded-xl"
                />
              </div>
            </CardContent>
          </Card>

          {/* STEP 2: EVENT GENERALS */}
          <Card className={cn(
            "bg-white/80 backdrop-blur-lg border-slate-200 text-white rounded-3xl transition-all duration-300 shadow-xl shadow-slate-200/50",
            (pulsingFields.eventoTipo || pulsingFields.eventoFecha || pulsingFields.duracionHoras) && "ring-2 ring-purple-500 bg-purple-50"
          )}>
            <CardHeader className="pb-3">
              <CardTitle className="text-md font-bold uppercase tracking-wider text-purple-600 flex items-center gap-2">
                <CalendarDays className="w-4 h-4" /> 2. Configuración de tu Fiesta
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Tipo de Evento</Label>
                <select
                  value={eventoTipo}
                  onChange={(e) => setEventoTipo(e.target.value as EventType)}
                  className="w-full bg-white/5 border border-white/10 hover:border-slate-300 rounded-xl px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="" className="bg-slate-900">Seleccionar...</option>
                  {Object.entries(EVENT_META).map(([key, meta]) => (
                    <option key={key} value={key} className="bg-slate-900">{meta.emoji} {meta.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Fecha del Evento</Label>
                <DatePickerDemo
                  selectedDate={eventoFecha}
                  onDateChange={async (date: Date | undefined) => {
                    setEventoFecha(date);
                    if (date) {
                      const dateStr = date.toISOString().split('T')[0];
                      const check = await checkDateAvailability(dateStr);
                      if (check.isOccupied) {
                        toast({
                          title: 'Fecha no disponible',
                          description: 'Ya tenemos otro evento reservado para esta fecha.',
                          variant: 'destructive',
                        });
                      }
                    }
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Duración de la Fiesta</Label>
                <select
                  value={duracionHoras}
                  onChange={(e) => setDuracionHoras(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 hover:border-slate-300 rounded-xl px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value={3} className="bg-slate-900">Menos de 4 horas (Fiesta Chica)</option>
                  <option value={5} className="bg-slate-900">Mas de 4 horas (Fiesta Grande)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Ubicación / Salón</Label>
                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                    <input 
                      type="radio" 
                      name="tieneSalon" 
                      checked={tieneSalon === true}
                      onChange={() => { setTieneSalon(true); setIncluirClubUruguay(false); }}
                      className="accent-purple-500"
                    />
                    Salón Propio
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                    <input 
                      type="radio" 
                      name="tieneSalon" 
                      checked={tieneSalon === false}
                      onChange={() => setTieneSalon(false)}
                      className="accent-purple-500"
                    />
                    Sugerir Salón (Club Uruguay)
                  </label>
                </div>
              </div>

              {tieneSalon === false && config?.clubUruguayConfig?.activo && (
                <div className="sm:col-span-2 flex items-center justify-between p-3.5 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
                  <div className="space-y-0.5">
                    <p className="text-xs font-black text-white">🏛️ Salón Club Uruguay</p>
                    <p className="text-[10px] text-purple-300">Céntrico, elegante y con bonificación especial.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white mr-1">{formatCurrency(config.clubUruguayConfig.precio)}</span>
                    <Checkbox
                      checked={incluirClubUruguay}
                      onCheckedChange={(checked) => setIncluirClubUruguay(Boolean(checked))}
                      className="border-slate-300 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                    />
                  </div>
                </div>
              )}

            </CardContent>
          </Card>

          {/* STEP 3: GUEST COUNT */}
          <Card className={cn(
            "bg-white border-slate-200 text-white rounded-3xl transition-all duration-300",
            (pulsingFields.adultos || pulsingFields.ninosYAdolescentes) && "ring-2 ring-purple-500 bg-purple-50"
          )}>
            <CardHeader className="pb-3">
              <CardTitle className="text-md font-bold uppercase tracking-wider text-purple-600 flex items-center gap-2">
                <Users className="w-4 h-4" /> 3. Cantidad de Invitados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase text-slate-600">
                  <span>Adultos</span>
                  <span className="text-purple-600 text-sm font-black">{adultos}</span>
                </div>
                <input 
                  type="range" 
                  min={20} 
                  max={300} 
                  value={adultos}
                  onChange={(e) => setAdultos(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase text-slate-600">
                  <span>Niños y Adolescentes</span>
                  <span className="text-purple-600 text-sm font-black">{ninosYAdolescentes}</span>
                </div>
                <input 
                  type="range" 
                  min={0} 
                  max={150} 
                  value={ninosYAdolescentes}
                  onChange={(e) => setNinosYAdolescentes(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

            </CardContent>
          </Card>

          {/* STEP 4: PACKAGE SELECTION */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 pl-1">
              4. Elegí un Paquete Base
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {applicablePackages.map(pkg => {
                const summary = packageSummaries.get(pkg.id);
                const isSelected = selectedPaqueteId === pkg.id;
                return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setSelectedPaqueteId(pkg.id)}
                  className={cn(
                    "p-4 rounded-3xl border text-left flex flex-col min-h-[190px] transition-all relative overflow-hidden group",
                    isSelected
                      ? "bg-purple-500/20 border-purple-400 shadow-[0_0_24px_rgba(168,85,247,0.22)] text-white"
                      : "bg-slate-900/80 border-white/20 text-white hover:border-purple-400/70 hover:bg-slate-800"
                  )}
                >
                  <div className="space-y-1 relative z-10 transition-transform duration-300 group-hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-base font-black uppercase tracking-wide text-white">{pkg.nombre}</p>
                      {pkg.recommended && (
                        <Badge className="bg-amber-400 text-slate-950 text-[9px] font-black uppercase py-0.5 px-1.5 rounded-full">Recomendado</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{pkg.descripcion}</p>
                  </div>
                  <div className="my-3 h-px bg-white/10" />
                  <div className="flex-1 space-y-1.5">
                    {(summary?.services || []).map((service) => (
                      <div key={service.id} className="flex items-start gap-2 text-xs text-slate-200">
                        {service.esRegalo
                          ? <Gift className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
                          : <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300" />}
                        <span className="leading-snug">
                          {service.nombre}
                          {service.esRegalo && <strong className="ml-1 text-emerald-300">sin costo</strong>}
                        </span>
                      </div>
                    ))}
                    {!summary?.services.length && (
                      <p className="text-xs text-amber-200">Los servicios de este paquete todavía no están vinculados al catálogo.</p>
                    )}
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-3 w-full relative z-10">
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Estimado para tu fiesta</span>
                      <strong className="text-lg text-white">{summary ? formatCurrency(summary.total) : 'A calcular'}</strong>
                    </div>
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center border-2",
                      isSelected ? "bg-purple-500 border-purple-300 text-white" : "border-slate-500 bg-slate-950"
                    )}>
                      {isSelected && <Check className="w-4 h-4" />}
                    </div>
                  </div>
                </button>
                );
              })}
            </div>
          </div>

          {/* STEP 5: CATERING & ADDITIONAL SERVICES */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 pl-1">
              5. Menús y Servicios Adicionales
            </h3>
            <Accordion type="single" collapsible className="w-full space-y-2">
              
              {/* STARTERS (ENTRADAS) */}
              {entradasDisponibles.length > 0 && (
                <AccordionItem value="entradas" className="border border-slate-200 bg-white/5 rounded-2xl overflow-hidden px-4">
                  <AccordionTrigger className="text-sm font-bold text-zinc-200 hover:no-underline py-4">
                    🍢 Entradas del Catering (Máx {duracionHoras > 4 ? 2 : 1})
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4 grid gap-3 sm:grid-cols-2">
                    {entradasDisponibles.map(dish => {
                      const isSelected = selectedEntradas.includes(dish.id);
                      return (
                        <button
                          key={dish.id}
                          type="button"
                          onClick={() => {
                            setSelectedEntradas(prev => {
                              if (prev.includes(dish.id)) return prev.filter(id => id !== dish.id);
                              const max = duracionHoras > 4 ? 2 : 1;
                              if (prev.length >= max) {
                                return [...prev.slice(1), dish.id];
                              }
                              return [...prev, dish.id];
                            });
                          }}
                          className={cn(
                            "p-3 rounded-xl border flex items-center justify-between gap-3 text-left transition-all",
                            isSelected ? "bg-purple-600/10 border-purple-500 text-white" : "bg-white border-slate-200 text-slate-500 hover:text-white"
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold line-clamp-1">{dish.nombre}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{formatCurrency(dish.precioVenta || 0)} p/p</p>
                          </div>
                          <div className={cn(
                            "w-4 h-4 rounded-md border flex items-center justify-center shrink-0",
                            isSelected ? "bg-purple-600 border-purple-500 text-white" : "border-zinc-700"
                          )}>
                            {isSelected && <Check className="w-2.5 h-2.5" />}
                          </div>
                        </button>
                      );
                    })}
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* MAIN DISH */}
              {principalesDisponibles.length > 0 && (
                <AccordionItem value="principal" className="border border-slate-200 bg-white/5 rounded-2xl overflow-hidden px-4">
                  <AccordionTrigger className="text-sm font-bold text-zinc-200 hover:no-underline py-4">
                    🍽️ Plato Principal
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4 grid gap-3 sm:grid-cols-2">
                    {principalesDisponibles.map(dish => {
                      const isSelected = selectedPrincipal === dish.id;
                      return (
                        <button
                          key={dish.id}
                          type="button"
                          onClick={() => setSelectedPrincipal(isSelected ? '' : dish.id)}
                          className={cn(
                            "p-3 rounded-xl border flex items-center justify-between gap-3 text-left transition-all",
                            isSelected ? "bg-purple-600/10 border-purple-500 text-white" : "bg-white border-slate-200 text-slate-500 hover:text-white"
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold line-clamp-1">{dish.nombre}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{formatCurrency(dish.precioVenta || 0)} p/p</p>
                          </div>
                          <div className={cn(
                            "w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
                            isSelected ? "bg-purple-600 border-purple-500 text-white" : "border-zinc-700"
                          )}>
                            {isSelected && <Check className="w-2.5 h-2.5" />}
                          </div>
                        </button>
                      );
                    })}
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* CHILDRENS MENU */}
              {menusNinoDisponibles.length > 0 && ninosYAdolescentes > 0 && (
                <AccordionItem value="infantil" className="border border-slate-200 bg-white/5 rounded-2xl overflow-hidden px-4">
                  <AccordionTrigger className="text-sm font-bold text-zinc-200 hover:no-underline py-4">
                    🍔 Menú Infantil / Postres
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4 grid gap-3 sm:grid-cols-2">
                    {menusNinoDisponibles.map(dish => {
                      const isSelected = selectedInfantil === dish.id;
                      return (
                        <button
                          key={dish.id}
                          type="button"
                          onClick={() => setSelectedInfantil(isSelected ? '' : dish.id)}
                          className={cn(
                            "p-3 rounded-xl border flex items-center justify-between gap-3 text-left transition-all",
                            isSelected ? "bg-purple-600/10 border-purple-500 text-white" : "bg-white border-slate-200 text-slate-500 hover:text-white"
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold line-clamp-1">{dish.nombre}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{formatCurrency(dish.precioVenta || 0)} p/p</p>
                          </div>
                          <div className={cn(
                            "w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
                            isSelected ? "bg-purple-600 border-purple-500 text-white" : "border-zinc-700"
                          )}>
                            {isSelected && <Check className="w-2.5 h-2.5" />}
                          </div>
                        </button>
                      );
                    })}
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* ADDITIONAL SERVICES */}
              {serviciosCatalogo.length > 0 && (
                <AccordionItem value="servicios" className="border border-slate-200 bg-white/5 rounded-2xl overflow-hidden px-4">
                  <AccordionTrigger className="text-sm font-bold text-zinc-200 hover:no-underline py-4">
                    ➕ Servicios Extras Opcionales
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4 grid gap-3 sm:grid-cols-2">
                    {serviciosCatalogo.map(serv => {
                      const isSelected = selectedServices.includes(serv.id);
                      return (
                        <button
                          key={serv.id}
                          type="button"
                          onClick={() => {
                            setSelectedServices(prev => 
                              prev.includes(serv.id) ? prev.filter(id => id !== serv.id) : [...prev, serv.id]
                            );
                          }}
                          className={cn(
                            "p-3 rounded-xl border flex items-center justify-between gap-3 text-left transition-all",
                            isSelected ? "bg-purple-600/10 border-purple-500 text-white" : "bg-white border-slate-200 text-slate-500 hover:text-white"
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold line-clamp-1">{serv.nombre}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {formatCurrency(serv.precioVenta || serv.precioPorPersona || serv.precioBase || 0)}
                              {serv.calculationMethod === 'porPersona' ? ' p/p' : ''}
                            </p>
                          </div>
                          <div className={cn(
                            "w-4 h-4 rounded-md border flex items-center justify-center shrink-0",
                            isSelected ? "bg-purple-600 border-purple-500 text-white" : "border-zinc-700"
                          )}>
                            {isSelected && <Check className="w-2.5 h-2.5" />}
                          </div>
                        </button>
                      );
                    })}
                  </AccordionContent>
                </AccordionItem>
              )}

            </Accordion>
          </div>

          {/* FINAL BUDGET SUMMARY CARD */}
          {priceStats && (
            <Card className="bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 border-purple-500/30 text-white rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(168,85,247,0.25)] relative transform transition-all duration-500 hover:scale-[1.02]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              <CardHeader className="pb-3 border-b border-white/5">
                <CardTitle className="text-sm font-black uppercase tracking-wider text-purple-600 flex items-center justify-between">
                  <span>Resumen de tu Presupuesto</span>
                  {generatedId && <Badge className="bg-emerald-600 font-bold tracking-wider"># {generatedId}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal de Servicios</span>
                    <span>{formatCurrency(priceStats.subtotalVenta)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Bonificación Especial ({priceStats.discountPercentage}%)</span>
                    <span>- {formatCurrency(priceStats.descPromo)}</span>
                  </div>
                  {priceStats.ahorroRegalos > 0 && (
                    <div className="flex justify-between text-purple-600 font-semibold">
                      <span>Regalos y Extras Incluidos (Ahorro)</span>
                      <span>+ {formatCurrency(priceStats.ahorroRegalos)}</span>
                    </div>
                  )}
                  {priceStats.ajusteAnual > 0 && (
                    <div className="flex justify-between text-amber-500 font-medium">
                      <span>Proyección de Ajuste Anual ({priceStats.annualProjection.adjustmentPct}%)</span>
                      <span>+ {formatCurrency(priceStats.ajusteAnual)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Total Estimado Vigente</p>
                    <p className="text-3xl font-black text-white">{formatCurrency(priceStats.totalFinal)}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Precio por persona</p>
                    <p className="text-sm font-black text-purple-300">{formatCurrency(priceStats.precioPorPersona)} / persona</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-black/20 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="text-[10px] text-slate-500 leading-normal max-w-xs">
                  *Este presupuesto es de carácter orientativo y se ajusta según la fecha seleccionada. Para congelar el precio es necesario coordinar la reserva.
                </p>
                <Button 
                  onClick={handleSaveBudget} 
                  disabled={isSubmitting}
                  className="rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-600 bg-[length:200%_auto] animate-gradient hover:from-purple-600 hover:via-pink-600 hover:to-indigo-700 text-white font-bold tracking-wide w-full sm:w-auto shadow-xl shadow-purple-500/20 transform transition-all active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Guardando...
                    </>
                  ) : (
                    <>
                      Guardar Presupuesto <ArrowRight className="w-4 h-4 ml-1.5" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}

        </div>

        {/* RIGHT PANEL: IA COPILOT CHAT (DESKTOP) */}
        <div className="hidden md:flex flex-col border-l border-slate-200 bg-white/60 backdrop-blur-xl max-h-[calc(100vh-80px)] overflow-hidden">
          <ChatWindow />
        </div>

      </div>

      {/* MOBILE CHAT DRAWER */}
      <AnimatePresence>
        {isMobileChatOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 md:hidden flex flex-col justify-end"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
              className="bg-white w-full h-[80vh] rounded-t-3xl border-t border-slate-200 flex flex-col overflow-hidden"
            >
              <div className="px-4 py-3 flex items-center justify-between border-b border-slate-200 shrink-0 bg-white">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
                  <p className="font-bold text-sm text-slate-900">Sofía - Copiloto de Presupuestos</p>
                </div>
                <Button 
                  onClick={() => setIsMobileChatOpen(false)}
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full text-slate-500 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-hidden relative flex flex-col">
                <ChatWindow />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );

  // Chat window element
  function ChatWindow() {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        
        {/* MESSAGES LIST */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {chatHistory.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div 
                key={msg.key}
                className={cn(
                  "flex w-full items-end gap-2",
                  isUser ? "justify-end" : "justify-start"
                )}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                )}
                <div 
                  className={cn(
                    "px-4 py-2.5 rounded-2xl text-xs max-w-[80%] leading-relaxed",
                    isUser 
                      ? "bg-purple-600 text-white rounded-br-none shadow-md" 
                      : "bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm"
                  )}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
          
          {isAiLoading && (
            <div className="flex w-full items-end gap-2 justify-start">
              <div className="w-7 h-7 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <div className="bg-white border border-slate-200 text-slate-900 px-4 py-2.5 rounded-2xl rounded-bl-none text-xs leading-relaxed shadow-sm flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin text-purple-600" />
                <span>Sofía está escribiendo</span>
                <span className="flex gap-0.5 ml-1">
                  <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1 h-1 bg-purple-600 rounded-full" />
                  <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1 h-1 bg-purple-600 rounded-full" />
                  <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1 h-1 bg-purple-600 rounded-full" />
                </span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* CONTROLS AREA */}
        <div className="p-4 border-t border-white/5 bg-slate-950/30 space-y-3 shrink-0">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {[
              { label: 'Recomendame un paquete', message: 'Recomendame el paquete que más me conviene con esta cantidad de invitados y explicame qué incluye.' },
              { label: 'Quiero gastar menos', message: 'Optimizá este presupuesto para gastar menos sin sacar lo esencial.' },
              { label: 'Revisá mi fiesta', message: 'Revisá toda mi configuración y decime qué falta o qué cambiarías.' },
            ].map((quickAction) => (
              <button
                key={quickAction.label}
                type="button"
                onClick={() => handleSendMessage(quickAction.message)}
                disabled={isAiLoading}
                className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-left text-[10px] font-black text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {quickAction.label}
              </button>
            ))}
          </div>
          

          {/* DYNAMIC PILL SUGGESTIONS */}
          {suggestionPill && !isAiLoading && (
            <div className="flex justify-center w-full pb-2">
              <button
                type="button"
                onClick={() => handleSendMessage(suggestionPill.messageToSubmit)}
                className="px-3.5 py-1.5 rounded-full border border-purple-500/30 bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-purple-950/20"
              >
                <Zap className="w-3.5 h-3.5 text-purple-600" /> {suggestionPill.label}
              </button>
            </div>
          )}

          {/* CRM WHATSAPP CONVERSION */}
          {generatedId && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col gap-2">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs font-black text-white">¡Presupuesto Guardado!</p>
                  <p className="text-[10px] text-slate-500">Ponte en contacto para coordinar la seña.</p>
                </div>
              </div>
              <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold py-2.5 flex items-center justify-center gap-1.5 shadow-lg">
                <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer">
                  <Phone className="w-3.5 h-3.5 fill-white" /> Conversar por WhatsApp
                </a>
              </Button>
            </div>
          )}

          {/* CHAT BOX */}
          <div className="flex items-center gap-2 bg-slate-900 border border-white/20 rounded-2xl px-3.5 py-2.5 focus-within:border-cyan-400 transition">
            <input
              type="text"
              placeholder="Preguntale a Sofía..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
              disabled={isAiLoading}
              className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder:text-slate-400"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isAiLoading || !inputMessage.trim()}
              className="rounded-full bg-cyan-500 p-2 text-slate-950 hover:bg-cyan-300 disabled:bg-slate-700 disabled:text-slate-400 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    );
  }
}

export default function SimuladorAKPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-900 gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
        <p className="text-sm text-slate-500">Iniciando simulador inteligente...</p>
      </div>
    }>
      <SimuladorAKContent />
    </Suspense>
  );
}
