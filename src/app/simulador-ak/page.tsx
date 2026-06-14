'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Loader2, MessageSquare, ArrowRight, Sparkles,
  Printer, Info, Share2, Send
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateBudgetAndLeadFromSimulator, getArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import { getBudgetDisplaySettings } from '@/app/actions/settings';
import { checkDateAvailability } from '@/app/actions/simulador-v2';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import { getMenus } from '@/app/actions/menus-catering';
import { getWhatsAppConfig } from '@/app/actions/whatsapp';
import { CompanyLogo } from '@/components/company-logo';
import { cn } from '@/lib/utils';
import { DatePickerDemo } from '@/components/date-picker-demo';
import {
  calculateSimulatorPricing,
  simulatorDetailsToBudgetItems,
  type SimulatorDetailedService,
  type SimulatorPriceStats,
} from '@/lib/simulator/pricing';
import {
  isPackageApplicableToEventType,
  type ArmadoRapidoConfig,
} from '@/types/armado-rapido';
import { defaultClubUruguayConfig } from '@/types/armado-rapido';
import { getCateringDishImage, getCateringMenuImage } from '@/lib/catering/menu-images';
import type { FullMenu, MenuItem } from '@/types/catering';
import type { ServicioEmpresa } from '@/types/empresa';
import { DEFAULT_ANNUAL_ADJUSTMENT_PERCENTAGE } from '@/lib/budget/formal-budget';

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

const menuItemToServicioEmpresa = (item: MenuItem & { precioVenta: number }): ServicioEmpresa => {
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
    imageUrl: item.imageUrl,
    isFeatured: item.isFeatured,
  };
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>}>
      <SimuladorAKContent />
    </Suspense>
  );
}

function Suspense({ children, fallback }: { children: React.ReactNode, fallback: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? <>{children}</> : <>{fallback}</>;
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
  const [eventoTipo, setEventoTipo] = useState<EventType | ''>('');
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

  // Flow State
  const [currentChatStep, setCurrentChatStep] = useState<string>('name');
  const [paquetesOrServicios, setPaquetesOrServicios] = useState<string>('');

  // Date warning and suggestions
  const [dateWarning, setDateWarning] = useState('');
  const [dateSuggestions, setDateSuggestions] = useState<string[]>([]);

  // IA Chat States
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { role: 'assistant', text: '¡Hola! Soy Sofía, tu asistente virtual en AK Producciones 👋. Contame, ¿cuál es tu nombre completo?', key: 'welcome_1' },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [suggestionPill, setSuggestionPill] = useState<{ label: string; messageToSubmit: string } | null>(null);

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
  }, [chatHistory, isAiLoading, currentChatStep]);

  // Save budget automatically when budget_ready is reached
  useEffect(() => {
    if (currentChatStep === 'budget_ready' && priceStats && !isSubmitting && !generatedId) {
      handleSaveBudget();
    }
  }, [currentChatStep]);

  // Extract menus dynamically
  const { entradasDisponibles, principalesDisponibles, menusNinoDisponibles } = useMemo(() => {
    if (!config || !availableMenus.length) {
      return { entradasDisponibles: [], principalesDisponibles: [], menusNinoDisponibles: [] };
    }
    const allDishes: (MenuItem & { imageUrl?: string; isFeatured?: boolean })[] = [];
    availableMenus.forEach(menu => {
      if (menu.items) {
        menu.items.forEach(item => {
          if (!allDishes.some(d => d.id === item.id)) {
            allDishes.push({
              ...item,
              imageUrl: getCateringDishImage(item) || getCateringMenuImage(menu),
              isFeatured: Boolean(item.isFeatured || menu.featured)
            });
          }
        });
      }
    });

    const enhancedDishes = allDishes.map(item => ({
      ...item,
      precioVenta: item.suggestedSellingPrice ?? ((item.totalDishCost || 0) * (1 + (item.profitMargin ?? 120) / 100)),
    }));

    return {
      entradasDisponibles: enhancedDishes.filter(d => d.type === 'Entrada').map(menuItemToServicioEmpresa),
      principalesDisponibles: enhancedDishes.filter(d => d.type === 'Plato Principal').map(menuItemToServicioEmpresa),
      menusNinoDisponibles: enhancedDishes.filter(d => d.type === 'Menú Infantil/Adolescente' || d.type === 'Menú Infantil').map(menuItemToServicioEmpresa),
    };
  }, [config, availableMenus]);

  const allSimuladorServices = useMemo<ServicioEmpresa[]>(() => {
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

  const handleEventoFechaChange = useCallback(async (date: Date | undefined) => {
    setEventoFecha(date);
    if (!date) {
      setDateWarning('');
      setDateSuggestions([]);
      return;
    }
    const availability = await checkDateAvailability(date.toISOString());
    if (availability.isOccupied) {
      setDateWarning('⚠️ Fecha no disponible. Te sugerimos estas fechas cercanas:');
      setDateSuggestions(availability.suggestions || []);
    } else {
      setDateWarning('');
      setDateSuggestions([]);
    }
  }, []);

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

    let nextStep = currentChatStep;
    let changesToApply: any = {};

    // Guided step-by-step validations
    if (currentChatStep === 'name') {
      setClienteNombre(text);
      nextStep = 'phone';
      changesToApply.clienteNombre = text;
      changesToApply.currentChatStep = 'phone';
    } else if (currentChatStep === 'phone') {
      const cleanedPhone = text.replace(/\s+/g, '');
      if (!/^\d{9}$/.test(cleanedPhone)) {
        setIsAiLoading(false);
        const botMsgKey = `bot_err_${Date.now()}`;
        setChatHistory(prev => [...prev, 
          { role: 'assistant', text: 'Por favor, ingresá un número de teléfono móvil uruguayo de 9 dígitos (ej: 099123456).', key: botMsgKey }
        ]);
        return;
      }
      setClienteContacto(cleanedPhone);
      nextStep = 'date';
      changesToApply.clienteContacto = cleanedPhone;
      changesToApply.currentChatStep = 'date';
    } else if (currentChatStep === 'date') {
      let finalDate = eventoFecha;
      if (!finalDate) {
        const parsedDate = new Date(text);
        if (isNaN(parsedDate.getTime())) {
          setIsAiLoading(false);
          const botMsgKey = `bot_err_${Date.now()}`;
          setChatHistory(prev => [...prev, 
            { role: 'assistant', text: 'Por favor, elegí la fecha usando el calendario o ingresala en formato AAAA-MM-DD.', key: botMsgKey }
          ]);
          return;
        }
        finalDate = parsedDate;
        setEventoFecha(parsedDate);
      }
      changesToApply.eventoFecha = finalDate.toISOString().split('T')[0];
      nextStep = 'type';
      changesToApply.currentChatStep = 'type';
    } else if (currentChatStep === 'type') {
      const lower = text.toLowerCase();
      let matchedType: EventType | '' = '';
      if (lower.includes('boda') || lower.includes('casamiento') || lower.includes('💍')) matchedType = 'boda';
      else if (lower.includes('15') || lower.includes('quince') || lower.includes('🎀')) matchedType = 'quince';
      else if (lower.includes('infantil') || lower.includes('nene') || lower.includes('🧒')) matchedType = 'cumpleanosInfantil';
      else if (lower.includes('cumple') || lower.includes('🎂')) matchedType = 'cumpleanos';
      else if (lower.includes('empresa') || lower.includes('corporativo') || lower.includes('🏢')) matchedType = 'empresarial';
      
      if (!matchedType) {
        setIsAiLoading(false);
        const botMsgKey = `bot_err_${Date.now()}`;
        setChatHistory(prev => [...prev, 
          { role: 'assistant', text: 'Por favor, seleccioná uno de los tipos de evento válidos.', key: botMsgKey }
        ]);
        return;
      }
      setEventoTipo(matchedType);
      nextStep = 'guests_adults';
      changesToApply.eventoTipo = matchedType;
      changesToApply.currentChatStep = 'guests_adults';
    } else if (currentChatStep === 'guests_adults') {
      const num = parseInt(text.replace(/\D/g, ''));
      if (isNaN(num) || num <= 0) {
        setIsAiLoading(false);
        const botMsgKey = `bot_err_${Date.now()}`;
        setChatHistory(prev => [...prev, 
          { role: 'assistant', text: 'Por favor, ingresá una cantidad de adultos válida mayor a 0.', key: botMsgKey }
        ]);
        return;
      }
      setAdultos(num);
      nextStep = 'guests_kids';
      changesToApply.adultos = num;
      changesToApply.currentChatStep = 'guests_kids';
    } else if (currentChatStep === 'guests_kids') {
      const num = parseInt(text.replace(/\D/g, ''));
      const kidsVal = isNaN(num) ? 0 : num;
      setNinosYAdolescentes(kidsVal);
      nextStep = 'hours';
      changesToApply.ninosYAdolescentes = kidsVal;
      changesToApply.currentChatStep = 'hours';
    } else if (currentChatStep === 'hours') {
      const isMore = text.toLowerCase().includes('mas') || text.toLowerCase().includes('más') || text.includes('5');
      const hours = isMore ? 5 : 3;
      setDuracionHoras(hours);
      nextStep = 'menu';
      changesToApply.duracionHoras = hours;
      changesToApply.currentChatStep = 'menu';
    } else if (currentChatStep === 'menu') {
      const chosen = availableMenus.find(m => text.toLowerCase().includes(m.name.toLowerCase()) || m.id === text);
      if (!chosen && !selectedPrincipal) {
        setIsAiLoading(false);
        const botMsgKey = `bot_err_${Date.now()}`;
        setChatHistory(prev => [...prev, 
          { role: 'assistant', text: 'Por favor, seleccioná uno de los menús disponibles.', key: botMsgKey }
        ]);
        return;
      }
      if (chosen) {
        setSelectedPrincipal(chosen.id);
        changesToApply.selectedPrincipal = chosen.id;
      }
      nextStep = 'package_choice';
      changesToApply.currentChatStep = 'package_choice';
    } else if (currentChatStep === 'package_choice') {
      const isPack = text.toLowerCase().includes('paquete');
      const mode = isPack ? 'paquetes' : 'servicios';
      setPaquetesOrServicios(mode);
      nextStep = isPack ? 'package_select' : 'service_select';
      changesToApply.paquetesOrServicios = mode;
      changesToApply.currentChatStep = nextStep;
    } else if (currentChatStep === 'package_select') {
      const chosenPkg = config?.paquetes.find(p => text.toLowerCase().includes(p.nombre.toLowerCase()) || p.id === text);
      if (!chosenPkg && !selectedPaqueteId) {
        setIsAiLoading(false);
        const botMsgKey = `bot_err_${Date.now()}`;
        setChatHistory(prev => [...prev, 
          { role: 'assistant', text: 'Por favor, elegí uno de los paquetes cerrados.', key: botMsgKey }
        ]);
        return;
      }
      if (chosenPkg) {
        setSelectedPaqueteId(chosenPkg.id);
        changesToApply.selectedPaqueteId = chosenPkg.id;
      }
      nextStep = 'budget_ready';
      changesToApply.currentChatStep = 'budget_ready';
    } else if (currentChatStep === 'service_select') {
      nextStep = 'budget_ready';
      changesToApply.currentChatStep = 'budget_ready';
    }

    setCurrentChatStep(nextStep);

    try {
      const { chatWithBudgetCopilot } = await import('@/app/actions/simulador-copilot');

      const currentState = {
        eventoTipo: changesToApply.eventoTipo || eventoTipo,
        adultos: changesToApply.adultos || adultos,
        ninosYAdolescentes: changesToApply.ninosYAdolescentes || ninosYAdolescentes,
        eventoFecha: changesToApply.eventoFecha || eventoFecha?.toISOString().split('T')[0],
        eventoHoraInicio,
        selectedPaqueteId: changesToApply.selectedPaqueteId || selectedPaqueteId,
        selectedServices: selectedServices,
        selectedEntradas,
        selectedPrincipal: changesToApply.selectedPrincipal || selectedPrincipal,
        selectedInfantil,
        incluirClubUruguay,
        duracionHoras: changesToApply.duracionHoras || duracionHoras,
        currentChatStep: nextStep,
        clienteNombre: changesToApply.clienteNombre || clienteNombre,
        clienteContacto: changesToApply.clienteContacto || clienteContacto,
        paquetesOrServicios: changesToApply.paquetesOrServicios || paquetesOrServicios,
      };

      const historyToSend = chatHistory.map(m => ({
        role: m.role,
        content: m.text
      }));

      // Let AI generate contextual uruguayan response
      const res = await chatWithBudgetCopilot({
        message: text,
        history: historyToSend,
        currentState,
      });

      // Add assistant bubble
      const botMsgKey = `bot_${Date.now()}`;
      setChatHistory(prev => [...prev, { role: 'assistant', text: res.response, key: botMsgKey }]);

      // Process structural state sync
      if (res.action?.type === 'apply_changes' && res.action.changes) {
        const changes = res.action.changes;
        if (changes.eventoTipo !== undefined && changes.eventoTipo in EVENT_META) {
          setEventoTipo(changes.eventoTipo as EventType);
        }
        if (changes.adultos !== undefined) setAdultos(changes.adultos);
        if (changes.ninosYAdolescentes !== undefined) setNinosYAdolescentes(changes.ninosYAdolescentes);
        if (changes.eventoFecha !== undefined) setEventoFecha(new Date(changes.eventoFecha));
        if (changes.selectedPaqueteId !== undefined) {
          setSelectedPaqueteId(changes.selectedPaqueteId);
          setGeneratedId(null); // Force regenerate budget code
        }
        if (changes.selectedServices !== undefined) setSelectedServices(changes.selectedServices);
        if (changes.selectedPrincipal !== undefined) setSelectedPrincipal(changes.selectedPrincipal);
        if (changes.duracionHoras !== undefined) setDuracionHoras(changes.duracionHoras);
        if (changes.currentChatStep !== undefined) setCurrentChatStep(changes.currentChatStep);
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

  // Trigger CRM creation and lead generation in background
  const handleSaveBudget = async () => {
    setIsSubmitting(true);
    try {
      const items = simulatorDetailsToBudgetItems(priceStats?.detallados || []);
      const result = await generateBudgetAndLeadFromSimulator({
        clienteNombre: clienteNombre.trim() || 'Cliente Chat',
        clienteContacto: clienteContacto || '099000000',
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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchPackage = async (paqueteId: string) => {
    setIsAiLoading(true);
    setSelectedPaqueteId(paqueteId);
    setGeneratedId(null); // Clear ID to force regenerations
    
    const pkg = config?.paquetes.find(p => p.id === paqueteId);
    const textToSend = `Quiero cambiar al paquete ${pkg?.nombre || 'básico'}`;

    // Temporarily trigger message update
    const botMsgKey = `bot_switch_${Date.now()}`;
    setChatHistory(prev => [...prev, 
      { role: 'user', text: textToSend, key: `user_switch_${Date.now()}` }
    ]);

    try {
      const { chatWithBudgetCopilot } = await import('@/app/actions/simulador-copilot');

      const currentState = {
        eventoTipo,
        adultos,
        ninosYAdolescentes,
        eventoFecha: eventoFecha?.toISOString().split('T')[0],
        eventoHoraInicio,
        selectedPaqueteId: paqueteId,
        selectedServices,
        selectedEntradas,
        selectedPrincipal,
        selectedInfantil,
        incluirClubUruguay,
        duracionHoras,
        currentChatStep: 'budget_ready',
        clienteNombre,
        clienteContacto,
        paquetesOrServicios: 'paquetes',
      };

      const res = await chatWithBudgetCopilot({
        message: textToSend,
        history: chatHistory.map(m => ({ role: m.role, content: m.text })),
        currentState,
      });

      setChatHistory(prev => [...prev, { role: 'assistant', text: res.response, key: botMsgKey }]);
      toast({ title: 'Presupuesto actualizado', description: `Cambiado a ${pkg?.nombre} con éxito.` });
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
      setCurrentChatStep('budget_ready');
    }
  };

  const buildWhatsAppHref = () => {
    const pkgName = config?.paquetes.find(p => p.id === selectedPaqueteId)?.nombre || 'A medida';
    const totalEst = priceStats ? formatCurrency(priceStats.totalFinal) : '$0';
    const text = `¡Hola AK Producciones! Estuve chateando con Sofía y armé un presupuesto para mi fiesta.
*Cliente:* ${clienteNombre}
*Teléfono:* ${clienteContacto}
*Fecha:* ${eventoFecha ? eventoFecha.toLocaleDateString('es-UY') : 'A definir'}
*Fiesta:* ${eventoTipo ? EVENT_META[eventoTipo]?.label : 'A definir'}
*Invitados:* ${adultos + ninosYAdolescentes} personas
*Paquete:* ${pkgName}
*Total estimado:* ${totalEst}
*Presupuesto:* #${generatedId || 'A generar'}
${generatedId ? `*Link:* ${window.location.origin}/presupuestos/${generatedId}/ver?cliente=1&token=${token || ''}` : ''}`;
    
    return `https://wa.me/${empresaPhone}?text=${encodeURIComponent(text)}`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
        <p className="text-sm text-slate-500">Iniciando simulador inteligente...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-500/30 relative">
      
      {/* Background glow effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#2e1065_0%,#09090b_80%)] pointer-events-none z-0" />

      {/* HEADER */}
      <header className="sticky top-0 z-50 flex flex-col gap-3 border-b border-white/10 bg-black/60 backdrop-blur-xl px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:py-5 shadow-lg shrink-0">
        <div className="flex min-w-0 items-center gap-3">
          <CompanyLogo className="h-9 w-auto shrink-0 sm:h-10 brightness-0 invert" />
          <div className="min-w-0">
            <h1 className="flex items-center gap-1.5 text-base font-black uppercase tracking-wider text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text sm:text-xl">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Asistente Inteligente AK
            </h1>
            <p className="hidden text-xs text-slate-400 sm:block">Chateá con Sofía y armá tu presupuesto de fiesta ideal al instante</p>
          </div>
        </div>
        <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
          <Button asChild variant="outline" className="min-w-0 flex-1 rounded-full border-white/10 px-4 text-xs text-slate-300 bg-white/5 hover:bg-white/10 sm:flex-none">
            <Link href="/simulador-de-presupuesto">
              <span>Simulador Manual</span>
            </Link>
          </Button>
        </div>
      </header>

      {/* BODY CHAT CONTAINER */}
      <div className="flex-1 flex justify-center items-center p-2 sm:p-4 md:p-6 z-10 overflow-hidden max-h-[calc(100vh-80px)]">
        <div className="w-full max-w-4xl bg-zinc-900/40 border border-white/10 rounded-[2.5rem] shadow-2xl backdrop-blur-3xl overflow-hidden flex flex-col h-[82vh]">
          <ChatWindow />
        </div>
      </div>

    </div>
  );

  // Chat window element
  function ChatWindow() {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        
        {/* MESSAGES LIST */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
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
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </div>
                )}
                <div 
                  className={cn(
                    "px-4 py-3 rounded-2xl text-xs max-w-[85%] leading-relaxed shadow-lg font-medium",
                    isUser 
                      ? "bg-purple-600 text-white rounded-br-none shadow-purple-500/15" 
                      : "bg-zinc-800/80 border border-white/5 text-zinc-100 rounded-bl-none"
                  )}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                </div>
              </div>
            );
          })}
          
          {isAiLoading && (
            <div className="flex w-full items-end gap-2 justify-start">
              <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <div className="bg-zinc-800/80 border border-white/5 text-zinc-200 px-4 py-3 rounded-2xl rounded-bl-none text-xs leading-relaxed shadow-lg flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                <span>Sofía está escribiendo</span>
                <span className="flex gap-0.5 ml-1">
                  <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1 h-1 bg-purple-400 rounded-full" />
                  <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1 h-1 bg-purple-400 rounded-full" />
                  <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1 h-1 bg-purple-400 rounded-full" />
                </span>
              </div>
            </div>
          )}

          {/* INLINE INTERACTIVE WIDGETS */}
          {!isAiLoading && (
            <div className="pl-10 space-y-4">
              
              {/* DATE PICKER WIDGET */}
              {currentChatStep === 'date' && (
                <div className="flex flex-col gap-3 p-4 bg-zinc-900/60 border border-white/10 rounded-3xl max-w-sm mt-2 shadow-xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Elegí la fecha de tu fiesta:</p>
                  <DatePickerDemo selectedDate={eventoFecha} onDateChange={handleEventoFechaChange} />
                  {dateWarning && (
                    <div className="text-[10px] text-amber-400 font-bold leading-normal">
                      {dateWarning}
                    </div>
                  )}
                  {dateSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {dateSuggestions.slice(0, 3).map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => {
                            const d = new Date(suggestion);
                            setEventoFecha(d);
                            setDateWarning('');
                            setDateSuggestions([]);
                          }}
                          className="bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg px-2 py-1 text-[10px] font-bold transition-all"
                        >
                          {new Date(suggestion).toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })}
                        </button>
                      ))}
                    </div>
                  )}
                  {eventoFecha && (
                    <Button
                      onClick={() => handleSendMessage(eventoFecha.toISOString().split('T')[0])}
                      className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold h-10 w-full text-xs"
                    >
                      Confirmar Fecha <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  )}
                </div>
              )}

              {/* EVENT TYPE SELECTION */}
              {currentChatStep === 'type' && (
                <div className="grid grid-cols-2 gap-2 max-w-md mt-2">
                  {(Object.keys(EVENT_META) as EventType[]).map((key) => {
                    const meta = EVENT_META[key];
                    return (
                      <button
                        key={key}
                        onClick={() => handleSendMessage(meta.label)}
                        className="p-3 bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all hover:scale-105"
                      >
                        <span className="text-2xl">{meta.emoji}</span>
                        <span className="text-[10px] font-black text-zinc-100 uppercase tracking-wider text-center">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* GUEST ADULTS */}
              {currentChatStep === 'guests_adults' && (
                <div className="flex flex-col gap-3 p-4 bg-zinc-900/60 border border-white/10 rounded-3xl max-w-sm mt-2 shadow-xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">¿Cuántos adultos son?</p>
                  <div className="flex items-center justify-between gap-4 py-2">
                    <Button size="icon" variant="outline" className="rounded-full border-white/20 h-10 w-10 text-white hover:bg-white/10 hover:text-white" onClick={() => setAdultos(a => Math.max(10, a - 5))}>-</Button>
                    <span className="text-3xl font-black text-white">{adultos}</span>
                    <Button size="icon" variant="outline" className="rounded-full border-white/20 h-10 w-10 text-white hover:bg-white/10 hover:text-white" onClick={() => setAdultos(a => Math.min(1000, a + 5))}>+</Button>
                  </div>
                  <Button
                    onClick={() => handleSendMessage(`Son ${adultos} adultos`)}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold h-10 w-full text-xs"
                  >
                    Confirmar Cantidad <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              )}

              {/* GUEST KIDS */}
              {currentChatStep === 'guests_kids' && (
                <div className="flex flex-col gap-3 p-4 bg-zinc-900/60 border border-white/10 rounded-3xl max-w-sm mt-2 shadow-xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">¿Cuántos niños / adolescentes?</p>
                  <div className="flex items-center justify-between gap-4 py-2">
                    <Button size="icon" variant="outline" className="rounded-full border-white/20 h-10 w-10 text-white hover:bg-white/10 hover:text-white" onClick={() => setNinosYAdolescentes(k => Math.max(0, k - 5))}>-</Button>
                    <span className="text-3xl font-black text-white">{ninosYAdolescentes}</span>
                    <Button size="icon" variant="outline" className="rounded-full border-white/20 h-10 w-10 text-white hover:bg-white/10 hover:text-white" onClick={() => setNinosYAdolescentes(k => Math.min(500, k + 5))}>+</Button>
                  </div>
                  <Button
                    onClick={() => handleSendMessage(`Son ${ninosYAdolescentes} niños y adolescentes`)}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold h-10 w-full text-xs"
                  >
                    Confirmar Cantidad <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              )}

              {/* DURATION SELECTION */}
              {currentChatStep === 'hours' && (
                <div className="flex gap-2 max-w-sm mt-2">
                  <button
                    onClick={() => handleSendMessage("Menos de 4 horas")}
                    className="flex-1 p-4 bg-zinc-900/60 hover:bg-zinc-800 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all text-center"
                  >
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Corta Duración</span>
                    <span className="text-xs font-black text-white uppercase mt-1">Menos de 4h</span>
                  </button>
                  <button
                    onClick={() => handleSendMessage("Más de 4 horas")}
                    className="flex-1 p-4 bg-zinc-900/60 hover:bg-zinc-800 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all text-center"
                  >
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Servicio Completo</span>
                    <span className="text-xs font-black text-white uppercase mt-1">Más de 4h</span>
                  </button>
                </div>
              )}

              {/* MENU CAROUSEL */}
              {currentChatStep === 'menu' && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin max-w-xl mt-2">
                  {availableMenus.map((m) => (
                    <div key={m.id} className="min-w-[220px] max-w-[240px] p-4 bg-zinc-900/60 border border-white/10 rounded-3xl flex flex-col justify-between gap-3 shadow-md shrink-0">
                      <div>
                        <span className="text-xs font-black text-white uppercase tracking-wider">{m.name}</span>
                        <p className="text-[10px] text-slate-400 mt-1 leading-normal line-clamp-3">{m.description || 'Catering para todo tipo de eventos'}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSendMessage(m.name)}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-[10px] h-8 uppercase tracking-widest"
                      >
                        Elegir {m.name}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* PACKAGE CHOICE */}
              {currentChatStep === 'package_choice' && (
                <div className="flex gap-2 max-w-md mt-2">
                  <button
                    onClick={() => handleSendMessage("Quiero hacerlo por paquetes cerrados")}
                    className="flex-1 p-4 bg-zinc-900/60 hover:bg-zinc-800 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all text-center"
                  >
                    <span className="text-2xl">📦</span>
                    <span className="text-[10px] font-black text-white uppercase mt-2">Por Paquetes Cerrados</span>
                  </button>
                  <button
                    onClick={() => handleSendMessage("Quiero elegir servicio a servicio")}
                    className="flex-1 p-4 bg-zinc-900/60 hover:bg-zinc-800 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all text-center"
                  >
                    <span className="text-2xl">🛠️</span>
                    <span className="text-[10px] font-black text-white uppercase mt-2">Servicio a Servicio</span>
                  </button>
                </div>
              )}

              {/* PACKAGE SELECT */}
              {currentChatStep === 'package_select' && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin max-w-xl mt-2">
                  {config?.paquetes.map((p) => {
                    const price = packageSummaries.get(p.id)?.total || 0;
                    return (
                      <div key={p.id} className="min-w-[240px] max-w-[260px] p-4 bg-zinc-900/60 border border-white/10 rounded-3xl flex flex-col justify-between gap-3 shadow-md shrink-0">
                        <div>
                          <div className="flex justify-between items-start gap-1">
                            <span className="text-xs font-black text-white uppercase tracking-wider truncate">{p.nombre}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 leading-normal line-clamp-3">{p.descripcion}</p>
                          <p className="text-sm font-black text-purple-400 mt-2">{formatCurrency(price)}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleSendMessage(p.nombre)}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-[10px] h-8 uppercase tracking-widest"
                        >
                          Seleccionar
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* SERVICE SELECT WIDGET */}
              {currentChatStep === 'service_select' && (
                <div className="p-4 bg-zinc-900/60 border border-white/10 rounded-3xl max-w-md mt-2 space-y-4 shadow-xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Elegí los servicios adicionales que querés:</p>
                  <div className="max-h-52 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                    {serviciosCatalogo.map(s => {
                      const isChecked = selectedServices.includes(s.id);
                      return (
                        <label key={s.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors border border-white/5 bg-zinc-950/20">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedServices(prev => [...prev, s.id]);
                              } else {
                                setSelectedServices(prev => prev.filter(id => id !== s.id));
                              }
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-white leading-none truncate">{s.nombre}</p>
                            <p className="text-[9px] text-slate-400 mt-1">{formatCurrency(s.precioVenta || s.precioPorPersona || 0)}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  <Button
                    onClick={() => handleSendMessage("Confirmar selección de servicios")}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold h-10 w-full text-xs uppercase tracking-widest"
                  >
                    Confirmar Selección ({selectedServices.length})
                  </Button>
                </div>
              )}

              {/* BUDGET SUMMARY CARD AT THE END */}
              {currentChatStep === 'budget_ready' && priceStats && (
                <div className="max-w-2xl mt-4 space-y-6">
                  
                  {/* DETAIL SHEET */}
                  <Card className="border-white/10 shadow-2xl rounded-[2rem] overflow-hidden bg-zinc-900/60 text-white backdrop-blur-md">
                    <CardHeader className="text-center bg-zinc-950/40 p-6 border-b border-white/5">
                      <CompanyLogo className="brightness-0 invert opacity-80 mx-auto mb-2" />
                      <CardTitle className="text-lg font-black uppercase tracking-widest text-transparent bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text">Tu Presupuesto Estimado</CardTitle>
                      <p className="text-[10px] text-slate-400">AK Producciones — Salto, Uruguay</p>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 space-y-6">
                      <div className="border border-white/5 rounded-2xl overflow-hidden bg-black/20">
                        <Table>
                          <TableHeader className="bg-white/5">
                            <TableRow className="border-white/5 hover:bg-transparent">
                              <TableHead className="text-[9px] font-black uppercase pl-6 py-3 text-slate-300">Servicio / Categoría</TableHead>
                              <TableHead className="text-center text-[9px] font-black uppercase text-slate-300">Cant.</TableHead>
                              <TableHead className="text-right pr-6 text-[9px] font-black uppercase text-slate-300">Subtotal</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {priceStats.detallados.map(item => (
                              <TableRow key={item.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                <TableCell className="pl-6 py-3">
                                  <p className="font-bold text-xs text-white">{item.nombre}</p>
                                </TableCell>
                                <TableCell className="text-center text-xs font-black text-slate-400">{item.cantidad}</TableCell>
                                <TableCell className="text-right pr-6">
                                  {item.esRegalo ? (
                                    <span className="text-[9px] font-black text-green-400 uppercase tracking-tighter">Regalo</span>
                                  ) : <span className="text-xs font-black text-slate-200">{formatCurrency(item.costoTotal)}</span>}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* SUMMARY BLOCK */}
                      <div className="max-w-sm ml-auto space-y-2.5 py-4 px-6 bg-black/40 rounded-2xl border border-white/5 shadow-inner">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-400 tracking-wider">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(priceStats.subtotalBruto)}</span>
                        </div>
                        {priceStats.ahorroRegalos > 0 && (
                          <div className="flex justify-between items-center text-[9px] font-black text-emerald-400 uppercase tracking-wider">
                            <span>Bonificación Regalos:</span>
                            <span>-{formatCurrency(priceStats.ahorroRegalos)}</span>
                          </div>
                        )}
                        {priceStats.descPromo > 0 && (
                          <div className="flex justify-between items-center text-[9px] font-black uppercase text-amber-400 tracking-wider">
                            <span>Descuento Especial:</span>
                            <span>-{formatCurrency(priceStats.descPromo)}</span>
                          </div>
                        )}
                        <Separator className="bg-white/10" />
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-xs font-black uppercase text-white">Total Final:</span>
                          <span className="text-xl font-black text-purple-400">{formatCurrency(priceStats.totalFinal)}</span>
                        </div>
                      </div>

                      {/* RESERVATION BANNER */}
                      <div className="bg-purple-950/20 p-4 rounded-2xl border border-purple-500/10 w-full text-xs space-y-1 text-purple-200">
                        <h4 className="font-black uppercase tracking-widest text-[9px] flex items-center gap-1.5"><Info className="w-3.5 h-3.5"/> Información de Contratación</h4>
                        <p className="leading-relaxed">Seña para congelar fecha: **{formatCurrency(priceStats.totalFinal * 0.3)}** (30% del total).</p>
                        <p className="leading-relaxed">El saldo restante se financia en cuotas fijas o reajustables hasta el día de la fiesta.</p>
                      </div>

                      {/* ACTIONS */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Button
                          asChild
                          className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest w-full rounded-xl"
                        >
                          <a href={buildWhatsAppHref()} target="_blank" rel="noopener noreferrer">
                            <Share2 className="w-4 h-4 mr-2"/> Coordinar Reunión
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          disabled={!generatedId}
                          onClick={() => {
                            if (!generatedId) return;
                            window.open(`/presupuestos/${generatedId}/ver?imprimir=1&cliente=1&direct=1&token=${token || ''}`, '_blank');
                          }}
                          className="h-11 border-white/10 text-slate-300 hover:bg-white/5 hover:text-white font-bold text-xs uppercase tracking-widest w-full rounded-xl bg-transparent"
                        >
                          <Printer className="w-4 h-4 mr-2"/> Descargar PDF
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* DOWNGRADE / UPGRADE WIDGET */}
                  {selectedPaqueteId && (
                    <div className="p-4 bg-zinc-900/60 border border-white/10 rounded-3xl space-y-3 shadow-xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Opciones de Ajuste de Presupuesto:</p>
                      <div className="flex flex-wrap gap-2">
                        {config?.paquetes
                          .filter(p => p.id !== selectedPaqueteId)
                          .map(p => (
                            <button
                              key={p.id}
                              disabled={isAiLoading}
                              onClick={() => handleSwitchPackage(p.id)}
                              className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase text-slate-300 tracking-wider transition-all"
                            >
                              Cambiar a {p.nombre}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* QUICK SUGGESTION PILL */}
        {suggestionPill && !isAiLoading && (
          <div className="px-4 py-2 bg-zinc-900/80 border-t border-white/5 flex items-center justify-start shrink-0">
            <button
              onClick={() => handleSendMessage(suggestionPill.messageToSubmit)}
              className="bg-purple-600/20 hover:bg-purple-600/35 border border-purple-500/35 rounded-full px-4 py-1.5 text-xs text-purple-200 font-bold tracking-wide transition-all shadow-md"
            >
              ✨ {suggestionPill.label}
            </button>
          </div>
        )}

        {/* INPUT AREA */}
        <div className="p-4 border-t border-white/10 bg-zinc-950/60 flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
            placeholder="Escribile tu respuesta o pregunta a Sofía..."
            disabled={isAiLoading}
            className="flex-1 bg-zinc-800/80 border border-white/10 rounded-2xl px-4 py-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-40 disabled:cursor-not-allowed"
          />
          <Button
            size="icon"
            onClick={() => handleSendMessage()}
            disabled={isAiLoading || !inputMessage.trim()}
            className="rounded-2xl h-10 w-10 bg-purple-600 hover:bg-purple-700 text-white shrink-0 disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

      </div>
    );
  }
}
