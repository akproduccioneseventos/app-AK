'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, MessageSquare, ArrowRight, ArrowLeft, Check, Gift,
  Users, CalendarDays, Home, Sparkles, Star, Phone, User,
  ChevronRight, Download, CalendarCheck, Zap, Clock, PartyPopper,
  X, Bot, Send, CheckCircle2, TrendingDown, Copy,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PublicFooter } from '@/components/public-footer';
import { generateBudgetAndLeadFromSimulator } from '@/app/actions/armado-rapido';
import { getArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import { getCuponesRegaloActivos } from '@/app/actions/cupones';
import { getMenus } from '@/app/actions/menus-catering';
import { getLandingSettings } from '@/app/actions/landing-editor';
import { getWhatsAppConfig } from '@/app/actions/whatsapp';
import { CountdownTimer } from '@/components/countdown-timer';
import type { Coupon } from '@/types/coupon';
import { esCuponRegalo } from '@/types/coupon';
import type { PaqueteArmadoRapido } from '@/types/armado-rapido';
import type { FullMenu } from '@/types/catering';
import type { LandingFaqItem } from '@/types/landing-editor';
import { cn } from '@/lib/utils';

// ─── Constants ───────────────────────────────────────────────────────────────

const WHATSAPP_NUMBER = '59898355530';
const STORAGE_KEY = 'ak_simulador_ak_v1';
const TOTAL_STEPS = 9; // steps 1-9 (step 0 = welcome)

// ─── Types ───────────────────────────────────────────────────────────────────

type EventType = 'cumpleanos' | 'quince' | 'boda' | 'empresarial';
type PackageType = 'basico' | 'intermedio' | 'premium';

interface SimuladorState {
  step: number;
  nombre: string;
  apellido: string;
  telefono: string;
  eventoFecha: string;
  eventoHoraInicio: string;
  eventoTipo: EventType | '';
  adultos: number;
  ninos: number;
  tieneSalon: boolean | null;
  paquete: PackageType | '';
  generatedId: string | null;
  savedAt: string;
}

interface ChatMessage {
  role: 'assistant' | 'user';
  text: string;
  key: string;
}

// ─── Pricing Data ─────────────────────────────────────────────────────────────

const EVENT_META: Record<EventType, { label: string; emoji: string; basePP: number; fixed: number }> = {
  cumpleanos: { label: 'Cumpleaños', emoji: '🎂', basePP: 620, fixed: 12000 },
  quince:     { label: '15 Años',   emoji: '🎀', basePP: 780, fixed: 15000 },
  boda:       { label: 'Boda',      emoji: '💍', basePP: 950, fixed: 20000 },
  empresarial:{ label: 'Empresarial',emoji: '🏢', basePP: 680, fixed: 10000 },
};

const PACKAGE_META: Record<PackageType, { label: string; description: string; multiplier: number; recommended?: boolean }> = {
  basico:     { label: 'Básico',     description: 'Simple pero bien organizada',         multiplier: 1.00 },
  intermedio: { label: 'Intermedio', description: 'Completa y sin preocuparme por nada', multiplier: 1.38, recommended: true },
  premium:    { label: 'Premium',    description: 'Nivel alto, todo incluido',           multiplier: 1.80 },
};

const SERVICES_BY_EVENT: Record<EventType, Record<PackageType, string[]>> = {
  cumpleanos: {
    basico:     ['Catering básico', 'Discoteca', 'Mobiliario esencial'],
    intermedio: ['Catering completo', 'Discoteca + iluminación', 'Mobiliario premium', 'Barra de tragos', 'Decoración temática'],
    premium:    ['Catering gourmet', 'Discoteca + iluminación LED', 'Mobiliario exclusivo', 'Barra premium', 'Decoración personalizada', 'Fotografía + video', 'Coordinador de evento'],
  },
  quince: {
    basico:     ['Catering básico', 'Discoteca', 'Mobiliario esencial', 'Decoración simple'],
    intermedio: ['Catering completo', 'Discoteca + iluminación', 'Mobiliario premium', 'Decoración especial', 'Fotografía', 'Glitter bar'],
    premium:    ['Catering gourmet', 'Discoteca + iluminación LED', 'Mobiliario exclusivo', 'Decoración de lujo', 'Fotografía + video profesional', 'Glitter bar', 'Entrada especial', 'Coordinación completa'],
  },
  boda: {
    basico:     ['Catering formal', 'Discoteca', 'Mobiliario', 'Decoración clásica'],
    intermedio: ['Catering formal completo', 'Discoteca + iluminación', 'Vajilla completa', 'Decoración elegante', 'Fotografía'],
    premium:    ['Catering gourmet', 'Discoteca + iluminación premium', 'Vajilla de lujo', 'Decoración personalizada', 'Fotografía + video', 'Coordinación completa', 'Barra de tragos premium'],
  },
  empresarial: {
    basico:     ['Catering práctico', 'Coffee break', 'Mobiliario básico'],
    intermedio: ['Catering completo', 'Coffee break premium', 'Mobiliario', 'Proyector + sonido'],
    premium:    ['Catering gourmet', 'Coffee break ejecutivo', 'Mobiliario premium', 'Proyector + sonido HD', 'Fotografía', 'Coordinación'],
  },
};

const GIFTS = [
  { id: 'invitacion', label: 'Invitación digital',     value: 1800,  emoji: '📱' },
  { id: 'fuegos',     label: 'Fuegos fríos',           value: 3500,  emoji: '✨' },
  { id: 'burbujas',   label: 'Lluvia de burbujas',     value: 2000,  emoji: '🫧' },
  { id: 'coffee',     label: 'Coffee break',           value: 2500,  emoji: '☕' },
  { id: 'pantalla',   label: 'Pantalla + proyector',   value: 4500,  emoji: '📽️' },
  { id: 'video',      label: 'Video de vida',          value: 5000,  emoji: '🎬' },
];

const DISCOUNT_RATE = 0.15;   // 15% as a decimal (0.15 = 15%)
const INFLATION_RATE = 0.25;  // how much we inflate the "original" displayed price

// ─── Pricing Helpers ──────────────────────────────────────────────────────────

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n);
}

function calcPrices(state: SimuladorState) {
  if (!state.eventoTipo || !state.paquete) return null;
  const meta = EVENT_META[state.eventoTipo as EventType];
  const pkg  = PACKAGE_META[state.paquete as PackageType];
  const totalGuests = state.adultos + state.ninos;
  const base = (meta.basePP * totalGuests + meta.fixed) * pkg.multiplier;
  const inflated = Math.round(base * (1 + INFLATION_RATE) / 1000) * 1000;
  const discount  = Math.round(inflated * DISCOUNT_RATE / 100) * 100;
  const final     = inflated - discount;
  const giftsValue = GIFTS.reduce((acc, g) => acc + g.value, 0);
  return { inflated, discount, final, giftsValue };
}

// ─── Assistant Script ─────────────────────────────────────────────────────────

function getAssistantMessages(step: number, state: SimuladorState): ChatMessage[] {
  const prices = state.paquete && state.eventoTipo ? calcPrices(state) : null;
  const eventMeta = state.eventoTipo ? EVENT_META[state.eventoTipo as EventType] : null;
  const pkgMeta   = state.paquete   ? PACKAGE_META[state.paquete as PackageType] : null;
  const nombre    = state.nombre || 'vos';

  const msgs: Record<number, ChatMessage[]> = {
    0: [
      { role: 'assistant', text: '¡Hola! Soy el Asistente AK 👋', key: 'w1' },
      { role: 'assistant', text: 'Te ayudo a armar el presupuesto de tu fiesta en minutos, sin vueltas y sin sorpresas 😊', key: 'w2' },
      { role: 'assistant', text: 'Contame un poco sobre tu evento y yo me encargo del resto.', key: 'w3' },
    ],
    1: [
      { role: 'assistant', text: 'Primero, ¿cómo te llamás? 😊', key: 's1_1' },
      { role: 'assistant', text: 'Con tu nombre y teléfono guardamos tu presupuesto para que puedas retomarlo cuando quieras.', key: 's1_2' },
    ],
    2: [
      ...(state.nombre ? [{ role: 'assistant' as const, text: `¡Buenísimo ${state.nombre}! 🎉`, key: 's2_0' }] : []),
      { role: 'assistant', text: '¿Cuándo es el evento y de qué tipo? Esto me ayuda a afinar los precios.', key: 's2_1' },
      { role: 'assistant', text: 'Tranquilo/a si la fecha no está 100% confirmada, después la ajustamos.', key: 's2_2' },
    ],
    3: [
      ...(eventMeta ? [{ role: 'assistant' as const, text: `${eventMeta.emoji} Un ${eventMeta.label}, ¡qué lindo momento!`, key: 's3_0' }] : []),
      { role: 'assistant', text: '¿Cuántos invitados tenés en mente? Eso define el catering, el personal y el espacio.', key: 's3_1' },
    ],
    4: [
      { role: 'assistant', text: `Para ${state.adultos + state.ninos} personas ya tengo una idea del espacio que necesitás 👌`, key: 's4_1' },
      { role: 'assistant', text: '¿Ya tenés salón o querés que te mostremos una opción completa?', key: 's4_2' },
      ...(state.tieneSalon === false ? [{ role: 'assistant' as const, text: 'Te cuento que el Club Uruguay es ideal para este tipo de eventos: céntrico, capacidad hasta 200 personas y precio especial si contratás el servicio completo con nosotros 🏛️', key: 's4_3' }] : []),
    ],
    5: [
      { role: 'assistant', text: '¿Cómo te imaginás tu fiesta?', key: 's5_1' },
      { role: 'assistant', text: 'No hay respuesta incorrecta, cada opción está armada para que el resultado sea increíble 🔥', key: 's5_2' },
    ],
    6: [
      ...(pkgMeta ? [{ role: 'assistant' as const, text: `¡Excelente elección! El paquete ${pkgMeta.label} es perfecto para lo que necesitás 💪`, key: 's6_0' }] : []),
      { role: 'assistant', text: 'Basándome en tu tipo de evento activé los servicios más importantes automáticamente. Chequeá que todo esté bien 👇', key: 's6_1' },
    ],
    7: [
      { role: 'assistant', text: '¡Mirá todo lo que te regalamos incluido en el precio! 🎁', key: 's7_1' },
      { role: 'assistant', text: 'Estos beneficios no los sumamos al total, son un regalo de nuestra parte por confiar en AK Producciones.', key: 's7_2' },
      ...(prices ? [{ role: 'assistant' as const, text: `El valor de esos regalos es ${formatCurrency(prices.giftsValue)}. ¡Y son tuyos sin costo extra! 🎉`, key: 's7_3' }] : []),
    ],
    8: [
      { role: 'assistant', text: '⚡ Las fechas de fin de semana se reservan rápido, especialmente en temporada alta.', key: 's8_1' },
      ...(prices ? [{ role: 'assistant' as const, text: `Tu total final es ${formatCurrency(prices.final)}, con un descuento de ${formatCurrency(prices.discount)} aplicado por contratar en este momento.`, key: 's8_2' }] : []),
      { role: 'assistant', text: '¿Hablamos? En una sola reunión resolvés todo y tu fiesta queda lista 🚀', key: 's8_3' },
    ],
  };
  return msgs[step] ?? [];
}

// ─── Step Components ──────────────────────────────────────────────────────────

const STEP_LABELS = [
  'Bienvenida', 'Tus datos', 'El evento', 'Invitados',
  'Salón', 'Tu estilo', 'Servicios', 'Regalos', 'Resumen',
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SimuladorAKPage() {
  const { toast } = useToast();
  const chatEndRef  = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedId, setGeneratedId] = useState<string | null>(null);

  const [state, setState] = useState<SimuladorState>({
    step: 0,
    nombre: '',
    apellido: '',
    telefono: '',
    eventoFecha: '',
    eventoHoraInicio: '',
    eventoTipo: '',
    adultos: 80,
    ninos: 10,
    tieneSalon: null,
    paquete: '',
    generatedId: null,
    savedAt: '',
  });

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [savedState, setSavedState] = useState<SimuladorState | null>(null);
  const [cuponRegalo, setCuponRegalo] = useState<Coupon | null>(null);
  const [dynamicPaquetes, setDynamicPaquetes] = useState<PaqueteArmadoRapido[]>([]);
  const [availableMenus, setAvailableMenus] = useState<FullMenu[]>([]);
  const [landingFaqs, setLandingFaqs] = useState<LandingFaqItem[]>([]);
  const [empresaPhone, setEmpresaPhone] = useState<string>(WHATSAPP_NUMBER);

  // ── Persistence ──────────────────────────────────────────────────────────

  useEffect(() => {
    getCuponesRegaloActivos().then(list => {
      if (list.length > 0) setCuponRegalo(list[0]);
    }).catch((err) => {
      console.error('Error al cargar cupones regalo:', err);
    });
    // Load dynamic config (packages, menus, FAQs) for the assistant
    Promise.all([
      getArmadoRapidoConfig().catch(() => null),
      getMenus().catch(() => [] as FullMenu[]),
      getLandingSettings().catch(() => null),
      getWhatsAppConfig().catch(() => null),
    ]).then(([armadoConfig, menus, landingCfg, waConfig]) => {
      if (armadoConfig?.paquetes?.length) setDynamicPaquetes(armadoConfig.paquetes);
      if (Array.isArray(menus) && menus.length > 0) setAvailableMenus(menus);
      if (landingCfg?.faqs?.length) setLandingFaqs(landingCfg.faqs);
      if (waConfig?.phoneNumber) setEmpresaPhone(waConfig.phoneNumber);
    });
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: SimuladorState = JSON.parse(raw);
        if (parsed.step > 0 && parsed.nombre) {
          setSavedState(parsed);
          setShowResumeModal(true);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const saveProgress = useCallback((s: SimuladorState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...s, savedAt: new Date().toISOString() }));
    } catch {
      // ignore
    }
  }, []);

  // ── Chat history management ───────────────────────────────────────────────

  useEffect(() => {
    const msgs = getAssistantMessages(state.step, state);
    if (msgs.length === 0) return;
    const existingKeys = new Set(chatHistory.map(m => m.key));
    const newMsgs = msgs.filter(m => !existingKeys.has(m.key));
    if (newMsgs.length > 0) {
      setChatHistory(prev => [...prev, ...newMsgs]);
    }
  // state.nombre triggers a new greeting message; include it so the assistant
  // re-evaluates when the user's name is set (step 1 → step 2 transition).
  }, [state.step, state.nombre, state.eventoTipo, state.paquete, state.tieneSalon]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [chatHistory]);

  // ── Navigation ────────────────────────────────────────────────────────────

  const goNext = useCallback(() => {
    setState(prev => {
      const next = { ...prev, step: prev.step + 1 };
      saveProgress(next);
      return next;
    });
  }, [saveProgress]);

  const goPrev = useCallback(() => {
    setState(prev => ({ ...prev, step: Math.max(0, prev.step - 1) }));
  }, []);

  const updateState = useCallback(<K extends keyof SimuladorState>(key: K, value: SimuladorState[K]) => {
    setState(prev => {
      const next = { ...prev, [key]: value };
      saveProgress(next);
      return next;
    });
  }, [saveProgress]);

  // ── Duplicate check ───────────────────────────────────────────────────────

  const checkDuplicate = useCallback((): boolean => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const saved: SimuladorState = JSON.parse(raw);
      return (
        saved.nombre.toLowerCase() === state.nombre.toLowerCase() &&
        saved.apellido.toLowerCase() === state.apellido.toLowerCase() &&
        saved.telefono === state.telefono &&
        !!saved.generatedId
      );
    } catch { return false; }
  }, [state.nombre, state.apellido, state.telefono]);

  // ── Final submit ──────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    const prices = calcPrices(state);
    const totalGuests = state.adultos + state.ninos;
    const eventMeta = state.eventoTipo ? EVENT_META[state.eventoTipo as EventType] : null;
    const pkgMeta   = state.paquete   ? PACKAGE_META[state.paquete as PackageType] : null;
    const services  = state.eventoTipo && state.paquete
      ? SERVICES_BY_EVENT[state.eventoTipo as EventType][state.paquete as PackageType]
      : [];

    try {
      const items = services.map((name, idx) => ({
        idServicioCatalogo: `ak_sim_${idx}`,
        nombreServicio: name,
        cantidad: 1,
        precioUnitario: prices ? Math.round(prices.final / services.length) : 0,
        precioUnitarioPresupuesto: prices ? Math.round(prices.final / services.length) : 0,
        categoriaServicio: 'Servicio',
        esRegalo: false,
      }));

      const result = await generateBudgetAndLeadFromSimulator({
        clienteNombre:   `${state.nombre} ${state.apellido}`.trim(),
        clienteContacto: state.telefono,
        eventoFecha:     state.eventoFecha || new Date().toISOString(),
        eventoHoraInicio: state.eventoHoraInicio || undefined,
        adultos:         state.adultos,
        ninos:           state.ninos,
        subtotal:        prices?.inflated ?? 0,
        costoEstimado:   prices?.final ?? 0,
        descuentoGeneral: DISCOUNT_RATE * 100,
        paqueteNombre:   pkgMeta?.label,
        serviciosIncluidos: items.map(i => i.idServicioCatalogo),
        items,
      });

      if (result.success && result.presupuestoId) {
        setGeneratedId(result.presupuestoId);
        setState(prev => {
          const next = { ...prev, generatedId: result.presupuestoId! };
          saveProgress(next);
          return next;
        });
        setChatHistory(prev => [
          ...prev,
          { role: 'assistant', text: `✅ ¡Listo ${state.nombre}! Tu presupuesto quedó guardado. ¿Hablamos?`, key: 'done_1' },
          { role: 'assistant', text: 'Escribime por WhatsApp o agendá una reunión sin costo. En una sola charla resolvemos todo 🙌', key: 'done_2' },
        ]);
      } else {
        throw new Error(result.error || 'Error al guardar');
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }, [state, saveProgress, toast]);

  // ── WhatsApp message ──────────────────────────────────────────────────────

  const buildWAMessage = useCallback(() => {
    const prices = calcPrices(state);
    const eventMeta = state.eventoTipo ? EVENT_META[state.eventoTipo as EventType] : null;
    const pkgMeta   = state.paquete   ? PACKAGE_META[state.paquete as PackageType] : null;
    const parts = [
      `Hola! Usé el simulador de AK Producciones.`,
      `Nombre: ${state.nombre} ${state.apellido}`,
      state.eventoFecha ? `Fecha evento: ${state.eventoFecha.split('T')[0]}` : '',
      state.eventoHoraInicio ? `Hora inicio: ${state.eventoHoraInicio}` : '',
      eventMeta ? `Tipo: ${eventMeta.label}` : '',
      `Invitados: ${state.adultos + state.ninos} personas`,
      pkgMeta ? `Paquete: ${pkgMeta.label}` : '',
      prices ? `Total estimado: ${formatCurrency(prices.final)}` : '',
      generatedId ? `Nro presupuesto: ${generatedId}` : '',
      `\nMe gustaría coordinar una reunión para cerrar los detalles 🎉`,
    ].filter(Boolean);
    return encodeURIComponent(parts.join('\n'));
  }, [state, generatedId]);

  // ── Print/PDF ─────────────────────────────────────────────────────────────

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // ── Prices ────────────────────────────────────────────────────────────────

  const prices = calcPrices(state);
  const progress = state.step === 0 ? 0 : Math.round((state.step / TOTAL_STEPS) * 100);

  // ── Resume modal ──────────────────────────────────────────────────────────

  if (showResumeModal && savedState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-900 to-pink-900 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-4"
        >
          <div className="text-4xl">👋</div>
          <h2 className="text-xl font-black text-slate-800">¡Ya tenés un presupuesto!</h2>
          <p className="text-slate-500 text-sm">
            Encontramos un presupuesto de <strong>{savedState.nombre}</strong>. ¿Querés continuar o empezar de cero?
          </p>
          <div className="flex flex-col gap-3 pt-2">
            <Button
              className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-2xl h-12"
              onClick={() => {
                setState(savedState);
                const msgs = getAssistantMessages(savedState.step, savedState);
                setChatHistory(msgs);
                setShowResumeModal(false);
              }}
            >
              Continuar donde estaba
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-2xl h-12 bg-transparent border-white/20 text-white hover:bg-white/10"
              onClick={() => {
                localStorage.removeItem(STORAGE_KEY);
                setShowResumeModal(false);
              }}
            >
              Empezar de cero
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Layout ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-900 to-pink-900 flex flex-col print:bg-white">

      {/* Print header */}
      <div className="hidden print:block p-8">
        <h1 className="text-2xl font-black">AK Producciones · Presupuesto Estimado</h1>
        <p className="text-sm text-slate-500 mt-1">Generado el {new Date().toLocaleDateString('es-UY')}</p>
        <PrintSummary state={state} prices={prices} />
      </div>

      <div className="print:hidden flex flex-col lg:flex-row flex-1 gap-0">

        {/* ── Left: Wizard ────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col items-center justify-start px-4 pt-8 pb-4 lg:pt-12 lg:pb-8 min-h-screen lg:min-h-0">

          {/* Brand */}
          <div className="flex items-center gap-2 mb-6 lg:mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-black text-lg tracking-tight">AK Producciones</span>
          </div>

          {/* Progress */}
          {state.step > 0 && (
            <div className="w-full max-w-lg mb-6">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-violet-300 text-xs font-semibold uppercase tracking-wider">
                  Paso {state.step} de {TOTAL_STEPS}
                </span>
                <span className="text-violet-300 text-xs font-semibold">{STEP_LABELS[state.step]}</span>
              </div>
              <Progress value={progress} className="h-1.5 bg-violet-800 [&>div]:bg-gradient-to-r [&>div]:from-violet-400 [&>div]:to-pink-400" />
            </div>
          )}

          {/* Step card */}
          <div className="w-full max-w-lg">
            <AnimatePresence mode="wait">
              <motion.div
                key={state.step}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
              >
                {state.step === 0 && (
                  <StepWelcome onStart={goNext} cuponRegalo={cuponRegalo} />
                )}
                {state.step === 1 && (
                  <StepClientInfo state={state} onChange={updateState} onNext={goNext} onPrev={goPrev} checkDuplicate={checkDuplicate} />
                )}
                {state.step === 2 && (
                  <StepEventBasics state={state} onChange={updateState} onNext={goNext} onPrev={goPrev} />
                )}
                {state.step === 3 && (
                  <StepGuests state={state} onChange={updateState} onNext={goNext} onPrev={goPrev} />
                )}
                {state.step === 4 && (
                  <StepSalon state={state} onChange={updateState} onNext={goNext} onPrev={goPrev} />
                )}
                {state.step === 5 && (
                  <StepPackage state={state} onChange={updateState} onNext={goNext} onPrev={goPrev} dynamicPaquetes={dynamicPaquetes} />
                )}
                {state.step === 6 && (
                  <StepServices state={state} onNext={goNext} onPrev={goPrev} dynamicPaquetes={dynamicPaquetes} availableMenus={availableMenus} />
                )}
                {state.step === 7 && (
                  <StepGifts prices={prices} onNext={goNext} onPrev={goPrev} />
                )}
                {state.step === 8 && (
                  <StepConversion
                    state={state}
                    prices={prices}
                    generatedId={generatedId}
                    isSubmitting={isSubmitting}
                    onSubmit={handleSubmit}
                    onPrev={goPrev}
                    waUrl={`https://wa.me/${empresaPhone}?text=${buildWAMessage()}`}
                    onPrint={handlePrint}
                    rawWAMessage={decodeURIComponent(buildWAMessage())}
                    empresaPhone={empresaPhone}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Mini price ticker (steps 6-8) */}
          {state.step >= 6 && prices && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 flex items-center gap-3 bg-white/10 backdrop-blur rounded-2xl px-5 py-2.5 border border-white/20"
            >
              <TrendingDown className="w-4 h-4 text-green-400" />
              <span className="text-white/60 text-xs line-through">{formatCurrency(prices.inflated)}</span>
              <Badge className="bg-green-500 text-white text-xs px-2">-{Math.round(DISCOUNT_RATE * 100)}%</Badge>
              <span className="text-white font-black text-sm">{formatCurrency(prices.final)}</span>
            </motion.div>
          )}
        </div>

        {/* ── Right: Chat Panel ────────────────────────────────────────────── */}
        <div className="lg:w-80 xl:w-96 bg-black/30 backdrop-blur-xl border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col">
          {/* Chat header */}
          <div className="flex items-center gap-3 p-4 border-b border-white/10">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm leading-none">Asistente AK</p>
              <p className="text-violet-300 text-xs mt-0.5">Organizador experto · En línea</p>
            </div>
            <div className="ml-auto flex-shrink-0">
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
              </span>
            </div>
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-64 lg:max-h-none">
            {chatHistory.map((msg, idx) => (
              <motion.div
                key={msg.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  'flex',
                  msg.role === 'assistant' ? 'justify-start' : 'justify-end',
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    'rounded-2xl px-3.5 py-2 text-sm max-w-[80%] leading-relaxed',
                    msg.role === 'assistant'
                      ? 'bg-white/10 text-white rounded-tl-none'
                      : 'bg-violet-500 text-white rounded-tr-none',
                  )}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat footer hint */}
          <div className="p-3 border-t border-white/10">
            {landingFaqs.length > 0 && (
              <div className="mb-2 space-y-1">
                <p className="text-violet-400 text-[10px] uppercase tracking-widest font-bold mb-1">Preguntas frecuentes:</p>
                {landingFaqs.slice(0, 3).map(faq => (
                  <button
                    key={faq.id}
                    onClick={() => {
                      const answer: ChatMessage = { role: 'assistant', text: faq.answer, key: `faq_${faq.id}` };
                      const question: ChatMessage = { role: 'user', text: faq.question, key: `faq_q_${faq.id}` };
                      setChatHistory(prev => [...prev, question, answer]);
                    }}
                    className="w-full text-left text-xs text-violet-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl px-3 py-2 transition-colors leading-tight"
                  >
                    {faq.question}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
              <MessageSquare className="w-4 h-4 text-violet-400 flex-shrink-0" />
              <span className="text-violet-300 text-xs">Asistente guiado · Paso a paso</span>
            </div>
          </div>
        </div>
      </div>

      <div className="print:hidden">
        <PublicFooter className="border-t border-white/10 bg-black/20" />
      </div>
    </div>
  );
}

// ─── Step: Welcome ────────────────────────────────────────────────────────────

function StepWelcome({ onStart, cuponRegalo }: { onStart: () => void; cuponRegalo: Coupon | null }) {
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

  const getMensaje = (cupon: Coupon): string => {
    if (esCuponRegalo(cupon) && cupon.mensajeOferta) {
      return cupon.mensajeOferta
        .replace('{fecha}', formatDate(cupon.fechaFin))
        .replace('{regalo}', cupon.serviciosRegalados[0]?.nombre ?? 'un regalo');
    }
    if (esCuponRegalo(cupon)) {
      return `Si contratás antes del ${formatDate(cupon.fechaFin)}, te regalamos ${cupon.serviciosRegalados[0]?.nombre ?? 'un regalo especial'}`;
    }
    return '';
  };

  return (
    <div className="rounded-3xl bg-white/10 backdrop-blur border border-white/20 p-8 text-center space-y-6">
      {cuponRegalo && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-r from-pink-500/80 to-violet-600/80 border border-pink-400/40 p-4 space-y-3"
        >
          <div className="flex items-center justify-center gap-2 text-white font-bold text-sm">
            <Gift className="w-5 h-5 text-yellow-300" />
            <span>¡Oferta especial por tiempo limitado!</span>
          </div>
          <p className="text-white/90 text-sm leading-snug">🎁 {getMensaje(cuponRegalo)}</p>
          <CountdownTimer targetDate={cuponRegalo.fechaFin} />
        </motion.div>
      )}
      <div className="text-6xl">🎉</div>
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
          Organizá tu fiesta sin vueltas
        </h1>
        <p className="text-violet-200 mt-3 leading-relaxed">
          Organizar una fiesta puede ser un caos: precios, proveedores, tiempos…<br />
          Acá lo resolvés todo en minutos. 👇
        </p>
      </div>
      <div className="flex flex-col gap-2 text-sm text-violet-300">
        {['Una pregunta por pantalla', 'Presupuesto en tiempo real', 'Cotización sin compromiso'].map((t, i) => (
          <div key={i} className="flex items-center gap-2 justify-center">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span>{t}</span>
          </div>
        ))}
      </div>
      <Button
        onClick={onStart}
        size="lg"
        className="w-full bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white font-black rounded-2xl h-14 text-base shadow-lg shadow-violet-900/50"
      >
        Empezar mi presupuesto
        <ArrowRight className="ml-2 w-5 h-5" />
      </Button>
      <p className="text-violet-400 text-xs">AK Producciones · Salto, Uruguay</p>
    </div>
  );
}

// ─── Step: Client Info ────────────────────────────────────────────────────────

function StepClientInfo({
  state, onChange, onNext, onPrev, checkDuplicate,
}: {
  state: SimuladorState;
  onChange: <K extends keyof SimuladorState>(k: K, v: SimuladorState[K]) => void;
  onNext: () => void;
  onPrev: () => void;
  checkDuplicate: () => boolean;
}) {
  const { toast } = useToast();
  const canNext = state.nombre.trim().length > 1 && state.apellido.trim().length > 1 && state.telefono.trim().length >= 8;

  const handleNext = () => {
    if (checkDuplicate()) {
      toast({
        title: '¡Ya tenés un presupuesto!',
        description: 'Encontramos uno guardado. Podés continuar desde donde lo dejaste.',
      });
    }
    onNext();
  };

  return (
    <StepCard title="¿Cómo te llamás?" icon={<User className="w-6 h-6" />}>
      <div className="space-y-4">
        <div>
          <Label className="text-violet-200 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Nombre</Label>
          <Input
            value={state.nombre}
            onChange={e => onChange('nombre', e.target.value)}
            placeholder="Tu nombre"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl h-12 focus:border-violet-400"
          />
        </div>
        <div>
          <Label className="text-violet-200 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Apellido</Label>
          <Input
            value={state.apellido}
            onChange={e => onChange('apellido', e.target.value)}
            placeholder="Tu apellido"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl h-12 focus:border-violet-400"
          />
        </div>
        <div>
          <Label className="text-violet-200 text-xs font-semibold uppercase tracking-wider mb-1.5 block">
            <Phone className="w-3.5 h-3.5 inline mr-1" />
            WhatsApp / Teléfono
          </Label>
          <Input
            type="tel"
            value={state.telefono}
            onChange={e => onChange('telefono', e.target.value)}
            placeholder="09X XXX XXX"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl h-12 focus:border-violet-400"
          />
        </div>
      </div>
      <StepNav onPrev={onPrev} onNext={handleNext} canNext={canNext} showPrev />
    </StepCard>
  );
}

// ─── Step: Event Basics ───────────────────────────────────────────────────────

function StepEventBasics({
  state, onChange, onNext, onPrev,
}: {
  state: SimuladorState;
  onChange: <K extends keyof SimuladorState>(k: K, v: SimuladorState[K]) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const EVENT_OPTIONS: { value: EventType; label: string; emoji: string }[] = [
    { value: 'cumpleanos', label: 'Cumpleaños', emoji: '🎂' },
    { value: 'quince',     label: '15 Años',   emoji: '🎀' },
    { value: 'boda',       label: 'Boda',      emoji: '💍' },
    { value: 'empresarial',label: 'Empresarial',emoji: '🏢' },
  ];
  const canNext = !!state.eventoTipo;

  return (
    <StepCard title="¿Qué tipo de evento es?" icon={<CalendarDays className="w-6 h-6" />}>
      <div>
        <Label className="text-violet-200 text-xs font-semibold uppercase tracking-wider mb-3 block">Fecha del evento</Label>
        <Input
          type="date"
          value={state.eventoFecha ? state.eventoFecha.split('T')[0] : ''}
          onChange={e => onChange('eventoFecha', e.target.value ? `${e.target.value}T00:00:00` : '')}
          className="bg-white/10 border-white/20 text-white rounded-xl h-12 mb-4 focus:border-violet-400 [color-scheme:dark]"
        />
        <Label className="text-violet-200 text-xs font-semibold uppercase tracking-wider mb-2 block">Hora de inicio</Label>
        <Input
          type="time"
          value={state.eventoHoraInicio || ''}
          onChange={e => onChange('eventoHoraInicio', e.target.value)}
          className="bg-white/10 border-white/20 text-white rounded-xl h-12 mb-4 focus:border-violet-400 [color-scheme:dark]"
        />
      </div>
      <div>
        <Label className="text-violet-200 text-xs font-semibold uppercase tracking-wider mb-3 block">Tipo de evento</Label>
        <div className="grid grid-cols-2 gap-2.5">
          {EVENT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange('eventoTipo', opt.value)}
              className={cn(
                'rounded-2xl p-4 text-left transition-all border-2 flex flex-col gap-1',
                state.eventoTipo === opt.value
                  ? 'bg-violet-500/40 border-violet-400 shadow-lg'
                  : 'bg-white/5 border-white/10 hover:bg-white/10',
              )}
            >
              <span className="text-2xl">{opt.emoji}</span>
              <span className="text-white font-bold text-sm">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
      <StepNav onPrev={onPrev} onNext={onNext} canNext={canNext} showPrev />
    </StepCard>
  );
}

// ─── Step: Guests ─────────────────────────────────────────────────────────────

function StepGuests({
  state, onChange, onNext, onPrev,
}: {
  state: SimuladorState;
  onChange: <K extends keyof SimuladorState>(k: K, v: SimuladorState[K]) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  return (
    <StepCard title="¿Cuántos invitados?" icon={<Users className="w-6 h-6" />}>
      <div className="space-y-5">
        <div>
          <Label className="text-violet-200 text-xs font-semibold uppercase tracking-wider mb-1.5 flex justify-between">
            <span>Adultos</span>
            <span className="text-white font-black text-base">{state.adultos}</span>
          </Label>
          <input
            type="range"
            min={10} max={400} step={5}
            value={state.adultos}
            onChange={e => onChange('adultos', +e.target.value)}
            className="w-full accent-violet-400 h-2 rounded-full cursor-pointer"
          />
          <div className="flex justify-between text-violet-400 text-xs mt-1"><span>10</span><span>400</span></div>
        </div>
        <div>
          <Label className="text-violet-200 text-xs font-semibold uppercase tracking-wider mb-1.5 flex justify-between">
            <span>Niños / Adolescentes</span>
            <span className="text-white font-black text-base">{state.ninos}</span>
          </Label>
          <input
            type="range"
            min={0} max={100} step={5}
            value={state.ninos}
            onChange={e => onChange('ninos', +e.target.value)}
            className="w-full accent-violet-400 h-2 rounded-full cursor-pointer"
          />
          <div className="flex justify-between text-violet-400 text-xs mt-1"><span>0</span><span>100</span></div>
        </div>
        <div className="bg-white/10 rounded-2xl p-4 text-center">
          <p className="text-violet-200 text-xs mb-0.5">Total de invitados</p>
          <p className="text-white font-black text-3xl">{state.adultos + state.ninos}</p>
          <p className="text-violet-300 text-xs mt-0.5">personas</p>
        </div>
      </div>
      <StepNav onPrev={onPrev} onNext={onNext} canNext showPrev />
    </StepCard>
  );
}

// ─── Step: Salon ──────────────────────────────────────────────────────────────

function StepSalon({
  state, onChange, onNext, onPrev,
}: {
  state: SimuladorState;
  onChange: <K extends keyof SimuladorState>(k: K, v: SimuladorState[K]) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const canNext = state.tieneSalon !== null;
  return (
    <StepCard title="¿Ya tenés salón?" icon={<Home className="w-6 h-6" />}>
      <div className="space-y-3">
        <button
          onClick={() => onChange('tieneSalon', true)}
          className={cn(
            'w-full rounded-2xl p-4 text-left transition-all border-2 flex items-center gap-3',
            state.tieneSalon === true
              ? 'bg-violet-500/40 border-violet-400'
              : 'bg-white/5 border-white/10 hover:bg-white/10',
          )}
        >
          <span className="text-2xl">🏛️</span>
          <div>
            <p className="text-white font-bold">Sí, ya tengo salón</p>
            <p className="text-violet-300 text-xs">Continúo con los demás servicios</p>
          </div>
          {state.tieneSalon === true && <Check className="ml-auto w-5 h-5 text-violet-400" />}
        </button>
        <button
          onClick={() => onChange('tieneSalon', false)}
          className={cn(
            'w-full rounded-2xl p-4 text-left transition-all border-2 flex flex-col gap-2',
            state.tieneSalon === false
              ? 'bg-violet-500/40 border-violet-400'
              : 'bg-white/5 border-white/10 hover:bg-white/10',
          )}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">✨</span>
            <div>
              <p className="text-white font-bold">No, quiero salón incluido</p>
              <p className="text-violet-300 text-xs">Te mostramos opciones</p>
            </div>
            {state.tieneSalon === false && <Check className="ml-auto w-5 h-5 text-violet-400" />}
          </div>
          {state.tieneSalon === false && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-xl p-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4 text-amber-400" />
                <p className="text-amber-300 font-bold text-sm">💎 Club Uruguay — Opción destacada</p>
              </div>
              <ul className="text-amber-200/80 text-xs space-y-0.5 ml-6">
                <li>• Capacidad: 50 a 200 personas</li>
                <li>• Ubicación céntrica en Salto</li>
                <li>• Descuento exclusivo por servicio completo</li>
              </ul>
            </motion.div>
          )}
        </button>
      </div>
      <StepNav onPrev={onPrev} onNext={onNext} canNext={canNext} showPrev />
    </StepCard>
  );
}

// ─── Step: Package ────────────────────────────────────────────────────────────

function StepPackage({
  state, onChange, onNext, onPrev, dynamicPaquetes,
}: {
  state: SimuladorState;
  onChange: <K extends keyof SimuladorState>(k: K, v: SimuladorState[K]) => void;
  onNext: () => void;
  onPrev: () => void;
  dynamicPaquetes?: PaqueteArmadoRapido[];
}) {
  const canNext = !!state.paquete;
  const staticOptions: { value: PackageType; emoji: string }[] = [
    { value: 'basico',     emoji: '⚡' },
    { value: 'intermedio', emoji: '🔥' },
    { value: 'premium',    emoji: '👑' },
  ];

  // Use dynamic packages if available, otherwise fall back to hardcoded PACKAGE_META
  const hasDynamic = dynamicPaquetes && dynamicPaquetes.length > 0;

  return (
    <StepCard title="¿Cómo te imaginás tu fiesta?" icon={<Star className="w-6 h-6" />}>
      <div className="space-y-2.5">
        {hasDynamic ? (
          dynamicPaquetes.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => onChange('paquete', pkg.id as PackageType)}
              className={cn(
                'w-full rounded-2xl p-4 text-left transition-all border-2 flex items-center gap-3 relative',
                state.paquete === pkg.id
                  ? 'bg-violet-500/40 border-violet-400'
                  : 'bg-white/5 border-white/10 hover:bg-white/10',
              )}
            >
              <span className="text-2xl">🎉</span>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold">{pkg.nombre}</p>
                {pkg.descripcion && <p className="text-violet-300 text-xs">{pkg.descripcion}</p>}
              </div>
              {state.paquete === pkg.id && <Check className="w-5 h-5 text-violet-400 flex-shrink-0" />}
            </button>
          ))
        ) : (
          staticOptions.map(opt => {
            const meta = PACKAGE_META[opt.value];
            return (
              <button
                key={opt.value}
                onClick={() => onChange('paquete', opt.value)}
                className={cn(
                  'w-full rounded-2xl p-4 text-left transition-all border-2 flex items-center gap-3 relative',
                  state.paquete === opt.value
                    ? 'bg-violet-500/40 border-violet-400'
                    : 'bg-white/5 border-white/10 hover:bg-white/10',
                )}
              >
                <span className="text-2xl">{opt.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold">{meta.label}</p>
                  <p className="text-violet-300 text-xs">{meta.description}</p>
                </div>
                {meta.recommended && (
                  <Badge className="bg-amber-500 text-white text-xs absolute -top-2 right-3">Más elegido</Badge>
                )}
                {state.paquete === opt.value && <Check className="w-5 h-5 text-violet-400 flex-shrink-0" />}
              </button>
            );
          })
        )}
      </div>
      <StepNav onPrev={onPrev} onNext={onNext} canNext={canNext} showPrev />
    </StepCard>
  );
}

// ─── Step: Services ───────────────────────────────────────────────────────────

function StepServices({
  state, onNext, onPrev, dynamicPaquetes, availableMenus,
}: {
  state: SimuladorState;
  onNext: () => void;
  onPrev: () => void;
  dynamicPaquetes?: PaqueteArmadoRapido[];
  availableMenus?: FullMenu[];
}) {
  const hasDynamic = dynamicPaquetes && dynamicPaquetes.length > 0;
  const dynamicPkg = hasDynamic ? dynamicPaquetes.find(p => p.id === state.paquete) : null;

  const services: string[] = dynamicPkg
    ? (dynamicPkg.serviciosIncluidos || []).map(s => s.id)
    : (state.eventoTipo && state.paquete && (SERVICES_BY_EVENT as Record<string, Record<string, string[]>>)[state.eventoTipo]?.[state.paquete])
      ? (SERVICES_BY_EVENT as Record<string, Record<string, string[]>>)[state.eventoTipo][state.paquete]
      : [];

  const pkgLabel = dynamicPkg ? dynamicPkg.nombre : (state.paquete ? PACKAGE_META[state.paquete as PackageType]?.label : null);

  // Show menus if available
  const relevantMenus = (availableMenus || []).slice(0, 3);

  return (
    <StepCard title="Servicios incluidos" icon={<Zap className="w-6 h-6" />}>
      <p className="text-violet-300 text-sm mb-4">
        Basándome en tu evento y paquete <strong className="text-white">{pkgLabel}</strong>, activé automáticamente los servicios más importantes:
      </p>
      <div className="space-y-2">
        {services.map((service, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3"
          >
            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
            <span className="text-white text-sm">{service}</span>
          </motion.div>
        ))}
      </div>
      {relevantMenus.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-violet-300 text-xs font-bold uppercase tracking-wide">Menús disponibles:</p>
          {relevantMenus.map((menu) => (
            <div key={menu.id} className="bg-white/5 rounded-xl px-4 py-3 flex items-center gap-2">
              <span className="text-lg">🍽️</span>
              <div>
                <p className="text-white text-sm font-medium">{menu.name}</p>
                {menu.description && <p className="text-violet-300 text-xs">{menu.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-violet-400 text-xs mt-3">* En la reunión podemos ajustar, agregar o quitar servicios.</p>
      <StepNav onPrev={onPrev} onNext={onNext} canNext showPrev />
    </StepCard>
  );
}

// ─── Step: Gifts ──────────────────────────────────────────────────────────────

function StepGifts({
  prices, onNext, onPrev,
}: {
  prices: ReturnType<typeof calcPrices>;
  onNext: () => void;
  onPrev: () => void;
}) {
  return (
    <StepCard title="🎁 Beneficios incluidos sin costo extra" icon={<Gift className="w-6 h-6" />}>
      <p className="text-violet-300 text-sm mb-4">
        Estos beneficios no los sumamos al total. Son un regalo nuestro por confiar en AK Producciones.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {GIFTS.map((gift, i) => (
          <motion.div
            key={gift.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06 }}
            className="bg-gradient-to-br from-amber-500/15 to-yellow-500/10 border border-amber-500/25 rounded-xl p-3 flex flex-col gap-1"
          >
            <span className="text-xl">{gift.emoji}</span>
            <p className="text-white text-xs font-semibold leading-tight">{gift.label}</p>
            <p className="text-amber-300 text-xs font-black">{formatCurrency(gift.value)}</p>
          </motion.div>
        ))}
      </div>
      {prices && (
        <div className="mt-4 bg-green-500/15 border border-green-500/30 rounded-2xl p-4 text-center">
          <p className="text-green-300 text-xs mb-1">Valor total de beneficios</p>
          <p className="text-green-400 font-black text-2xl">{formatCurrency(prices.giftsValue)}</p>
          <p className="text-green-300/70 text-xs mt-0.5">Incluidos sin costo adicional 🎉</p>
        </div>
      )}
      <StepNav onPrev={onPrev} onNext={onNext} canNext showPrev />
    </StepCard>
  );
}

// ─── Step: Conversion ────────────────────────────────────────────────────────

function StepConversion({
  state, prices, generatedId, isSubmitting, onSubmit, onPrev, waUrl, onPrint, rawWAMessage, empresaPhone,
}: {
  state: SimuladorState;
  prices: ReturnType<typeof calcPrices>;
  generatedId: string | null;
  isSubmitting: boolean;
  onSubmit: () => void;
  onPrev: () => void;
  waUrl: string;
  onPrint: () => void;
  rawWAMessage: string;
  empresaPhone: string;
}) {
  const { toast } = useToast();
  const submitted = !!generatedId;

  return (
    <StepCard title="Tu presupuesto está listo" icon={<PartyPopper className="w-6 h-6" />}>
      {/* Urgency */}
      <div className="bg-orange-500/15 border border-orange-500/30 rounded-2xl p-4 flex items-start gap-3 mb-5">
        <Clock className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-orange-300 font-bold text-sm">Las fechas se reservan rápido</p>
          <p className="text-orange-200/70 text-xs mt-0.5">Especialmente los fines de semana. Reservar cuanto antes asegura tu fecha.</p>
        </div>
      </div>

      {/* Price breakdown */}
      {prices && (
        <div className="bg-white/5 rounded-2xl p-4 space-y-2 mb-5">
          <div className="flex justify-between text-sm">
            <span className="text-violet-300">Valor de referencia</span>
            <span className="text-white/50 line-through">{formatCurrency(prices.inflated)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-green-400 flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5" /> Descuento</span>
            <span className="text-green-400 font-bold">- {formatCurrency(prices.discount)}</span>
          </div>
          <div className="border-t border-white/10 pt-2 flex justify-between">
            <span className="text-white font-black">TOTAL FINAL</span>
            <span className="text-white font-black text-xl">{formatCurrency(prices.final)}</span>
          </div>
        </div>
      )}

      {/* CTA buttons */}
      <div className="space-y-3">
        {!submitted ? (
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white font-black rounded-2xl h-12"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando tu presupuesto...</>
            ) : (
              <><CheckCircle2 className="w-4 h-4 mr-2" /> Guardar mi presupuesto</>
            )}
          </Button>
        ) : (
          <div className="flex items-center gap-2 bg-green-500/15 border border-green-500/30 rounded-2xl p-3 justify-center">
            <Check className="w-5 h-5 text-green-400" />
            <span className="text-green-300 font-bold text-sm">Presupuesto guardado ✓</span>
          </div>
        )}

        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1eb955] text-white font-black rounded-2xl h-12 transition-colors text-sm"
        >
          <MessageSquare className="w-5 h-5" />
          Enviar por WhatsApp
        </a>

        <Button
          variant="outline"
          className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent rounded-2xl h-10 font-bold text-sm"
          onClick={() => {
            navigator.clipboard.writeText(rawWAMessage).then(() => {
              toast({ description: 'Mensaje copiado al portapapeles' });
            }).catch(() => {
              toast({ description: 'No se pudo copiar el mensaje', variant: 'destructive' });
            });
          }}
        >
          <Copy className="w-4 h-4 mr-2" /> Copiar mensaje
        </Button>

        <Button
          variant="outline"
          className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent rounded-2xl h-12 font-bold"
          onClick={() => {
            const msg = encodeURIComponent(
              `Hola ${state.nombre}! Quería coordinar una reunión para cerrar los detalles de tu evento. ¿Cuándo te vendría bien?`
            );
            window.open(`https://wa.me/${empresaPhone}?text=${msg}`, '_blank');
          }}
        >
          <CalendarCheck className="w-5 h-5 mr-2" />
          Agendar entrevista sin costo
        </Button>

        <Button
          variant="ghost"
          className="w-full text-violet-300 hover:text-white hover:bg-white/10 rounded-2xl h-10 text-sm"
          onClick={onPrint}
        >
          <Download className="w-4 h-4 mr-2" />
          Descargar / Guardar PDF
        </Button>
      </div>

      <div className="mt-4 text-center">
        <p className="text-violet-400 text-xs">
          En una sola reunión ves todo y resolvés la fiesta completa 👍
        </p>
      </div>

      <div className="mt-4">
        <button onClick={onPrev} className="flex items-center gap-1.5 text-violet-400 hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
      </div>
    </StepCard>
  );
}

// ─── Shared Components ────────────────────────────────────────────────────────

function StepCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white/10 backdrop-blur border border-white/20 p-6 md:p-8 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-violet-500/30 flex items-center justify-center text-violet-300">
          {icon}
        </div>
        <h2 className="text-white font-black text-xl leading-tight">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function StepNav({
  onPrev, onNext, canNext, showPrev = false,
}: {
  onPrev: () => void;
  onNext: () => void;
  canNext: boolean;
  showPrev?: boolean;
}) {
  return (
    <div className="flex items-center justify-between pt-2">
      {showPrev ? (
        <button onClick={onPrev} className="flex items-center gap-1.5 text-violet-400 hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
      ) : <div />}
      <Button
        onClick={onNext}
        disabled={!canNext}
        className="bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white font-black rounded-2xl px-6 h-11 disabled:opacity-40"
      >
        Siguiente <ArrowRight className="ml-1.5 w-4 h-4" />
      </Button>
    </div>
  );
}

// ─── Print Summary ────────────────────────────────────────────────────────────

function PrintSummary({ state, prices }: { state: SimuladorState; prices: ReturnType<typeof calcPrices> }) {
  const eventMeta = state.eventoTipo ? EVENT_META[state.eventoTipo as EventType] : null;
  const pkgMeta   = state.paquete   ? PACKAGE_META[state.paquete as PackageType] : null;
  const services  = state.eventoTipo && state.paquete
    ? SERVICES_BY_EVENT[state.eventoTipo as EventType][state.paquete as PackageType]
    : [];

  return (
    <div className="mt-6 space-y-4">
      <div>
        <h2 className="font-bold text-lg">Datos del cliente</h2>
        <p>Nombre: {state.nombre} {state.apellido}</p>
        <p>Teléfono: {state.telefono}</p>
      </div>
      {eventMeta && <p>Tipo de evento: {eventMeta.emoji} {eventMeta.label}</p>}
      {state.eventoFecha && <p>Fecha: {state.eventoFecha.split('T')[0]}</p>}
      {state.eventoHoraInicio && <p>Hora de inicio: {state.eventoHoraInicio}</p>}
      <p>Invitados: {state.adultos} adultos + {state.ninos} niños = {state.adultos + state.ninos} total</p>
      {pkgMeta && <p>Paquete: {pkgMeta.label}</p>}
      {services.length > 0 && (
        <div>
          <h2 className="font-bold text-lg mt-4">Servicios incluidos</h2>
          <ul className="list-disc ml-5">
            {services.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
      <div>
        <h2 className="font-bold text-lg mt-4">Beneficios incluidos sin costo extra</h2>
        <ul className="list-disc ml-5">
          {GIFTS.map(g => <li key={g.id}>{g.emoji} {g.label} (valor: {formatCurrency(g.value)})</li>)}
        </ul>
      </div>
      {prices && (
        <div className="mt-4">
          <h2 className="font-bold text-lg">Resumen de precios</h2>
          <p>Valor de referencia: <s>{formatCurrency(prices.inflated)}</s></p>
          <p>Descuento ({Math.round(DISCOUNT_RATE * 100)}%): -{formatCurrency(prices.discount)}</p>
          <p className="font-black text-xl">TOTAL FINAL: {formatCurrency(prices.final)}</p>
        </div>
      )}
      <p className="text-xs text-gray-500 mt-6">WhatsApp: 098 355 530 · AK Producciones · Salto, Uruguay</p>
    </div>
  );
}
