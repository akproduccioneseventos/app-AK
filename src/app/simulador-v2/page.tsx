'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { PublicFooter } from '@/components/public-footer';
import {
  checkDuplicateClient,
  checkDateAvailability,
  saveSimuladorV2Lead,
} from '@/app/actions/simulador-v2';
import type { SimV2State, SimV2Step, SimV2TipoEvento, SimV2Paquete } from '@/types/simulador-v2';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  AlertTriangle,
  Gift,
  MessageCircle,
  Calendar,
  FileText,
  Sparkles,
  Users,
  Clock,
  Building2,
  Star,
} from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────

const TOTAL_STEPS = 13;
const LS_KEY = 'simulador_v2_state';
const WA_NUMBER = '59898355530';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const DISCOUNT_PERCENTAGE = 20;
const ADULTS_PER_WAITER = 20;
const MIN_WAITERS = 2;
const GUESTS_PER_KITCHEN_STAFF = 40;
const LITERS_PER_ADULT = 1.5;

function parseEventDate(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00`);
}

const BASE_RATES: Record<SimV2TipoEvento, { perPerson: number; base: number }> = {
  'Cumpleaños': { perPerson: 800, base: 5000 },
  '15 años': { perPerson: 950, base: 8000 },
  'Boda': { perPerson: 1100, base: 12000 },
  'Evento empresarial': { perPerson: 750, base: 6000 },
};

const PACKAGE_MULTIPLIERS: Record<SimV2Paquete, number> = {
  'Básico': 0.85,
  'Intermedio': 1.0,
  'Premium': 1.3,
};

const SERVICES_BY_TYPE: Record<SimV2TipoEvento, { id: string; nombre: string; descripcion: string; optional?: boolean }[]> = {
  'Cumpleaños': [
    { id: 'catering', nombre: '🍽️ Catering', descripcion: 'Menú completo para todos los invitados' },
    { id: 'discoteca', nombre: '🎵 Discoteca', descripcion: 'DJ y sonido profesional' },
    { id: 'mobiliario', nombre: '🪑 Mobiliario', descripcion: 'Mesas, sillas y mantelería' },
    { id: 'decoracion_basica', nombre: '🎈 Decoración básica', descripcion: 'Globos y ambientación temática' },
    { id: 'pista_led', nombre: '💡 Pista LED', descripcion: 'Pista de baile iluminada', optional: true },
    { id: 'candy_bar', nombre: '🍬 Candy bar', descripcion: 'Mesa de dulces y postres', optional: true },
  ],
  '15 años': [
    { id: 'catering_completo', nombre: '🍽️ Catering completo', descripcion: 'Menú de gala con entrada y postre' },
    { id: 'discoteca_iluminacion', nombre: '🎵 Discoteca + iluminación', descripcion: 'DJ, sonido e iluminación especial' },
    { id: 'fotografia_video', nombre: '📸 Fotografía + video', descripcion: 'Cobertura completa del evento' },
    { id: 'decoracion_especial', nombre: '💐 Decoración especial', descripcion: 'Decoración temática de quinceañera' },
    { id: 'pista_led', nombre: '💡 Pista LED', descripcion: 'Pista de baile iluminada', optional: true },
    { id: 'glitter_bar', nombre: '✨ Glitter bar', descripcion: 'Estación de brillantina y maquillaje', optional: true },
  ],
  'Boda': [
    { id: 'catering_formal', nombre: '🍽️ Catering formal', descripcion: 'Menú de boda con maridaje' },
    { id: 'vajilla_completa', nombre: '🍷 Vajilla completa', descripcion: 'Cristalería y cubertería premium' },
    { id: 'decoracion_elegante', nombre: '🌸 Decoración elegante', descripcion: 'Flores, centros de mesa y arcos' },
    { id: 'coordinacion', nombre: '📋 Coordinación', descripcion: 'Wedding planner el día del evento' },
    { id: 'flores_premium', nombre: '🌹 Flores premium', descripcion: 'Arreglos florales de alta gama', optional: true },
    { id: 'video_clip', nombre: '🎬 Video clip', descripcion: 'Edición cinematográfica del evento', optional: true },
  ],
  'Evento empresarial': [
    { id: 'catering_practico', nombre: '🍽️ Catering práctico', descripcion: 'Lunch o cena ejecutiva' },
    { id: 'coffee_break', nombre: '☕ Coffee break', descripcion: 'Estación de café y snacks' },
    { id: 'proyector', nombre: '📽️ Proyector', descripcion: 'Pantalla y proyector HD' },
    { id: 'sonido', nombre: '🔊 Sonido', descripcion: 'Sistema de audio profesional' },
    { id: 'decoracion_corporativa', nombre: '🏢 Decoración corporativa', descripcion: 'Ambientación con marca', optional: true },
    { id: 'streaming', nombre: '📡 Streaming', descripcion: 'Transmisión en vivo del evento', optional: true },
  ],
};

const BENEFITS = [
  { id: 'invitacion_digital', label: '🎁 Invitación digital', value: 800 },
  { id: 'fuegos_frios', label: '🎁 Fuegos fríos', value: 2500 },
  { id: 'lluvia_burbujas', label: '🎁 Lluvia de burbujas', value: 1200 },
  { id: 'coffee_bienvenida', label: '🎁 Coffee break de bienvenida', value: 1800 },
  { id: 'pantalla_proyector', label: '🎁 Pantalla + proyector', value: 3000 },
  { id: 'video_vida', label: '🎁 Video de vida', value: 2200 },
];

const TIPO_EVENTO_OPTIONS: { value: SimV2TipoEvento; emoji: string; desc: string }[] = [
  { value: 'Cumpleaños', emoji: '🎂', desc: 'Festejá tu día con estilo' },
  { value: '15 años', emoji: '🎀', desc: 'La fiesta que siempre soñaste' },
  { value: 'Boda', emoji: '💍', desc: 'El día más especial de tu vida' },
  { value: 'Evento empresarial', emoji: '🏢', desc: 'Profesionalismo y elegancia' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeTotal(state: SimV2State): { subtotal: number; total: number; totalConDescuento: number } {
  const tipo = state.tipoEvento || 'Cumpleaños';
  const paquete = state.paquete || 'Intermedio';
  const guests = (state.adultos || 0) + (state.adolescentes || 0);
  const rates = BASE_RATES[tipo];
  const multiplier = PACKAGE_MULTIPLIERS[paquete];
  const subtotal = (rates.perPerson * guests + rates.base) * multiplier;
  const totalConDescuento = subtotal * (1 - DISCOUNT_PERCENTAGE / 100);
  return { subtotal, total: subtotal * (100 / (100 - DISCOUNT_PERCENTAGE)), totalConDescuento };
}

function formatDateLabel(isoDate: string): string {
  const d = parseEventDate(isoDate);
  return d.toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'short' });
}

function getWhatsAppMessage(state: SimV2State, total: number): string {
  const name = `${state.nombre} ${state.apellido}`.trim();
  const fecha = state.fechaEvento ? formatDateLabel(state.fechaEvento) : 'a definir';
  const guests = (state.adultos || 0) + (state.adolescentes || 0);
  return encodeURIComponent(
    `Hola! Soy ${name} y completé el simulador de presupuesto.\n` +
      `📅 Fecha: ${fecha}\n` +
      `🎉 Evento: ${state.tipoEvento || 'N/A'}\n` +
      `👥 Invitados: ${guests}\n` +
      `📦 Paquete: ${state.paquete || 'N/A'}\n` +
      `💰 Total estimado: ${formatCurrency(total)}\n\n` +
      `Me gustaría coordinar una entrevista para avanzar.`
  );
}

// ─── Initial state ────────────────────────────────────────────────────────────

const INITIAL_STATE: SimV2State = {
  nombre: '',
  apellido: '',
  telefono: '',
  adultos: 30,
  adolescentes: 0,
  currentStep: 1,
};

// ─── Step wrapper animations ──────────────────────────────────────────────────

const stepVariants = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -60 },
};

// ─── Main Wizard Component ────────────────────────────────────────────────────

function SimuladorV2Wizard() {
  const [state, setState] = useState<SimV2State>(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showContinueDialog, setShowContinueDialog] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<{
    existingClientName?: string;
    existingLeadId?: string;
    existingPresupuestoId?: string;
  } | null>(null);
  const [dateOccupied, setDateOccupied] = useState(false);
  const [dateSuggestions, setDateSuggestions] = useState<string[]>([]);
  const [saveDone, setSaveDone] = useState(false);
  const [hasLocalState, setHasLocalState] = useState(false);
  const [localStateLoaded, setLocalStateLoaded] = useState(false);
  const [toggledServices, setToggledServices] = useState<Record<string, boolean>>({});

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as SimV2State;
        if (parsed.nombre && parsed.currentStep > 1) {
          setHasLocalState(true);
          setLocalStateLoaded(false);
          return;
        }
      }
    } catch {
      // ignore
    }
    setLocalStateLoaded(true);
  }, []);

  // Persist to localStorage on state change
  const persistState = useCallback((s: SimV2State) => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ ...s, savedAt: new Date().toISOString() }));
    } catch {
      // ignore
    }
  }, []);

  const updateState = useCallback(
    (updates: Partial<SimV2State>) => {
      setState(prev => {
        const next = { ...prev, ...updates };
        persistState(next);
        return next;
      });
    },
    [persistState]
  );

  const goTo = useCallback(
    (step: SimV2Step) => {
      setError(null);
      updateState({ currentStep: step });
    },
    [updateState]
  );

  const goNext = useCallback(() => {
    const next = Math.min(state.currentStep + 1, TOTAL_STEPS) as SimV2Step;
    goTo(next);
  }, [state.currentStep, goTo]);

  const goBack = useCallback(() => {
    const prev = Math.max(state.currentStep - 1, 1) as SimV2Step;
    goTo(prev);
  }, [state.currentStep, goTo]);

  // ── Step 1 handler ───────────────────────────────────────────────────────
  const handleStep1Continue = async () => {
    if (!state.nombre.trim() || !state.apellido.trim() || !state.telefono.trim()) {
      setError('Por favor completá todos los campos.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await checkDuplicateClient(state.nombre, state.apellido, state.telefono);
      if (result.isDuplicate) {
        setDuplicateInfo({
          existingClientName: result.existingClientName,
          existingLeadId: result.existingLeadId,
          existingPresupuestoId: result.existingPresupuestoId,
        });
        setShowContinueDialog(true);
      } else {
        goNext();
      }
    } catch {
      setError('Error al verificar. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2 handler ───────────────────────────────────────────────────────
  const handleStep2Continue = async () => {
    if (!state.fechaEvento) {
      setError('Elegí una fecha para el evento.');
      return;
    }
    setLoading(true);
    setError(null);
    setDateOccupied(false);
    setDateSuggestions([]);
    try {
      const result = await checkDateAvailability(state.fechaEvento);
      if (result.isOccupied) {
        setDateOccupied(true);
        setDateSuggestions(result.suggestions || []);
      } else {
        goNext();
      }
    } catch {
      goNext();
    } finally {
      setLoading(false);
    }
  };

  // ── Step 13 save handler ─────────────────────────────────────────────────
  const handleSave = async () => {
    if (saveDone) return;
    setLoading(true);
    try {
      const result = await saveSimuladorV2Lead(state);
      if (result.success) {
        setSaveDone(true);
        updateState({ leadId: result.leadId, presupuestoId: result.presupuestoId });
        // Clear localStorage
        try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
      }
    } catch {
      // non-blocking
    } finally {
      setLoading(false);
    }
  };

  // Auto-save on step 13
  useEffect(() => {
    if (state.currentStep === 13 && !saveDone) {
      handleSave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentStep]);

  // ── Services toggle ──────────────────────────────────────────────────────
  const getActiveServices = useCallback(() => {
    const tipo = state.tipoEvento || 'Cumpleaños';
    const allServices = SERVICES_BY_TYPE[tipo] || [];
    const defaults = allServices
      .filter(s => !s.optional)
      .map(s => s.id);
    const optionals = allServices
      .filter(s => s.optional)
      .map(s => s.id)
      .filter(id => toggledServices[id]);
    return [...defaults, ...optionals];
  }, [state.tipoEvento, toggledServices]);

  // Sync active services into state when on step 7
  useEffect(() => {
    if (state.currentStep === 7 || state.currentStep === 8) {
      updateState({ serviciosActivados: getActiveServices() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toggledServices, state.currentStep, state.tipoEvento]);

  // ── Computed values ──────────────────────────────────────────────────────
  const totalGuests = (state.adultos || 0) + (state.adolescentes || 0);
  const mozosRecomendados = Math.max(MIN_WAITERS, Math.ceil((state.adultos || 0) / ADULTS_PER_WAITER));
  const cocinerosRecomendados = Math.max(1, Math.ceil(totalGuests / GUESTS_PER_KITCHEN_STAFF));
  const bebidasEstimadas = Math.round((state.adultos || 0) * LITERS_PER_ADULT);
  const { subtotal, total, totalConDescuento } = computeTotal(state);
  const benefitsTotal = BENEFITS.reduce((sum, b) => sum + b.value, 0);

  // Show "restore" prompt
  if (!localStateLoaded && hasLocalState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md w-full text-center text-white"
        >
          <div className="text-4xl mb-4">👋</div>
          <h2 className="text-xl font-bold mb-2">¡Ya tenés un presupuesto en progreso!</h2>
          <p className="text-white/70 mb-6 text-sm">
            Encontramos una sesión guardada. ¿Querés continuar donde quedaste o empezar de nuevo?
          </p>
          <div className="flex flex-col gap-3">
            <Button
              className="bg-violet-500 hover:bg-violet-400 text-white"
              onClick={() => {
                try {
                  const saved = localStorage.getItem(LS_KEY);
                  if (saved) {
                    const parsed = JSON.parse(saved) as SimV2State;
                    setState(parsed);
                  }
                } catch { /* ignore */ }
                setLocalStateLoaded(true);
                setHasLocalState(false);
              }}
            >
              Continuar donde quedé
            </Button>
            <Button
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
              onClick={() => {
                try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
                setState(INITIAL_STATE);
                setLocalStateLoaded(true);
                setHasLocalState(false);
              }}
            >
              Empezar de nuevo
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const step = state.currentStep;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-900 to-slate-900 flex flex-col">
      {/* Header / Progress */}
      <div className="w-full max-w-2xl mx-auto px-4 pt-6 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/60 text-xs font-medium tracking-wide uppercase">
            AK Producciones
          </span>
          <span className="text-white/60 text-xs">
            Paso {step} de {TOTAL_STEPS}
          </span>
        </div>
        <Progress value={(step / TOTAL_STEPS) * 100} className="h-1.5 bg-white/20" />
      </div>

      {/* Duplicate dialog */}
      {showContinueDialog && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
          >
            <div className="text-3xl mb-3 text-center">✨</div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
              ¡Ya te conocemos!
            </h3>
            <p className="text-gray-600 text-sm text-center mb-5">
              Ya encontramos un presupuesto tuyo
              {duplicateInfo?.existingClientName ? (
                <> a nombre de <strong>{duplicateInfo.existingClientName}</strong></>
              ) : null}.
              ¿Querés continuar ese presupuesto o crear uno nuevo?
            </p>
            <div className="flex flex-col gap-2">
              <Button
                className="bg-violet-600 hover:bg-violet-500 text-white"
                onClick={() => {
                  if (duplicateInfo?.existingLeadId) {
                    updateState({ leadId: duplicateInfo.existingLeadId });
                  }
                  if (duplicateInfo?.existingPresupuestoId) {
                    updateState({ presupuestoId: duplicateInfo.existingPresupuestoId });
                  }
                  setShowContinueDialog(false);
                  goNext();
                }}
              >
                Continuar existente
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowContinueDialog(false);
                  goNext();
                }}
              >
                Crear nuevo
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.28, ease: 'easeInOut' }}
            >
              {/* ── STEP 1: Identificación ───────────────────────────── */}
              {step === 1 && (
                <StepCard title="¡Hola! Contanos quién sos 👋" subtitle="Para personalizar tu presupuesto necesitamos conocerte">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-white/70 text-sm mb-1 block">Nombre</label>
                        <Input
                          value={state.nombre}
                          onChange={e => updateState({ nombre: e.target.value })}
                          placeholder="Ej: María"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-violet-400"
                        />
                      </div>
                      <div>
                        <label className="text-white/70 text-sm mb-1 block">Apellido</label>
                        <Input
                          value={state.apellido}
                          onChange={e => updateState({ apellido: e.target.value })}
                          placeholder="Ej: García"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-violet-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-white/70 text-sm mb-1 block">Teléfono / WhatsApp</label>
                      <Input
                        value={state.telefono}
                        onChange={e => updateState({ telefono: e.target.value })}
                        placeholder="Ej: 098 355 530"
                        type="tel"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-violet-400"
                      />
                    </div>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <NavButtons onNext={handleStep1Continue} loading={loading} hidePrev />
                  </div>
                </StepCard>
              )}

              {/* ── STEP 2: Fecha ────────────────────────────────────── */}
              {step === 2 && (
                <StepCard title="¿Cuándo es tu evento? 📅" subtitle="Verificamos disponibilidad en tiempo real">
                  <div className="space-y-4">
                    <div>
                      <label className="text-white/70 text-sm mb-1 block">Fecha del evento</label>
                      <input
                        type="date"
                        value={state.fechaEvento || ''}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => {
                          setDateOccupied(false);
                          setDateSuggestions([]);
                          updateState({ fechaEvento: e.target.value });
                        }}
                        className="w-full rounded-lg bg-white/10 border border-white/20 text-white px-3 py-2 focus:outline-none focus:border-violet-400 [color-scheme:dark]"
                      />
                    </div>

                    {dateOccupied && (
                      <div className="bg-amber-500/20 border border-amber-400/40 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-amber-300 font-semibold mb-3">
                          <AlertTriangle className="w-4 h-4" />
                          Esa fecha ya está reservada 😕 Pero mirá estas opciones disponibles 👇
                        </div>
                        <div className="flex flex-col gap-2">
                          {dateSuggestions.map(d => (
                            <button
                              key={d}
                              onClick={() => {
                                updateState({ fechaEvento: d });
                                setDateOccupied(false);
                                setDateSuggestions([]);
                              }}
                              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg px-4 py-2 text-sm text-left capitalize transition-colors"
                            >
                              📅 {formatDateLabel(d)}
                            </button>
                          ))}
                          <button
                            onClick={() => { setDateOccupied(false); setDateSuggestions([]); }}
                            className="text-white/50 text-sm hover:text-white/80 mt-1 underline"
                          >
                            Elegir otra fecha
                          </button>
                        </div>
                      </div>
                    )}

                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <NavButtons onPrev={goBack} onNext={handleStep2Continue} loading={loading} />
                  </div>
                </StepCard>
              )}

              {/* ── STEP 3: Tipo de evento ────────────────────────────── */}
              {step === 3 && (
                <StepCard title="¿Qué tipo de evento es? 🎉" subtitle="Eso nos ayuda a personalizar todo">
                  <div className="grid grid-cols-2 gap-3">
                    {TIPO_EVENTO_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { updateState({ tipoEvento: opt.value }); goNext(); }}
                        className={cn(
                          'rounded-2xl border-2 p-5 text-left transition-all hover:scale-105',
                          state.tipoEvento === opt.value
                            ? 'border-violet-400 bg-violet-500/30'
                            : 'border-white/20 bg-white/10 hover:border-violet-400/50 hover:bg-white/15'
                        )}
                      >
                        <div className="text-3xl mb-2">{opt.emoji}</div>
                        <div className="text-white font-semibold text-sm">{opt.value}</div>
                        <div className="text-white/50 text-xs mt-1">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                  <div className="mt-4">
                    <NavButtons onPrev={goBack} hideNext />
                  </div>
                </StepCard>
              )}

              {/* ── STEP 4: Duración ─────────────────────────────────── */}
              {step === 4 && (
                <StepCard title="¿Cuánto dura el evento? ⏱️" subtitle="Esto afecta la cantidad de personal incluida">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {[
                      { value: 'hasta4' as const, label: 'Hasta 4 horas', icon: '⏰', note: '1 entrada incluida' },
                      { value: 'mas4' as const, label: 'Más de 4 horas', icon: '🌙', note: '2 entradas incluidas' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { updateState({ duracion: opt.value }); goNext(); }}
                        className={cn(
                          'rounded-2xl border-2 p-6 text-left transition-all hover:scale-105',
                          state.duracion === opt.value
                            ? 'border-violet-400 bg-violet-500/30'
                            : 'border-white/20 bg-white/10 hover:border-violet-400/50'
                        )}
                      >
                        <div className="text-4xl mb-3">{opt.icon}</div>
                        <div className="text-white font-bold text-lg mb-1">{opt.label}</div>
                        <div className="text-violet-300 text-sm font-medium">{opt.note}</div>
                      </button>
                    ))}
                  </div>
                  <div className="mt-4">
                    <NavButtons onPrev={goBack} hideNext />
                  </div>
                </StepCard>
              )}

              {/* ── STEP 5: Invitados ────────────────────────────────── */}
              {step === 5 && (
                <StepCard title="¿Cuántos invitados? 👥" subtitle="Estimamos el personal y los insumos necesarios">
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <NumberInput
                        label="👨‍👩‍👧 Adultos"
                        value={state.adultos}
                        onChange={v => updateState({ adultos: v })}
                        min={0}
                      />
                      <NumberInput
                        label="🧒 Adolescentes / Niños"
                        value={state.adolescentes}
                        onChange={v => updateState({ adolescentes: v })}
                        min={0}
                      />
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 grid grid-cols-2 gap-3">
                      <InfoChip icon={<Users className="w-4 h-4" />} label="Total invitados" value={String(totalGuests)} />
                      <InfoChip icon={<Star className="w-4 h-4" />} label="Mozos estimados" value={`~${Math.max(MIN_WAITERS, Math.ceil((state.adultos || 0) / ADULTS_PER_WAITER))}`} />
                    </div>
                    <NavButtons onPrev={goBack} onNext={goNext} />
                  </div>
                </StepCard>
              )}

              {/* ── STEP 6: Salón ────────────────────────────────────── */}
              {step === 6 && (
                <StepCard title="¿Tenés salón? 🏛️" subtitle="Podemos incluir el Club Uruguay si lo necesitás">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <button
                        onClick={() => updateState({ tieneSalon: true, incluirClubUruguay: false })}
                        className={cn(
                          'rounded-2xl border-2 p-5 text-left transition-all',
                          state.tieneSalon === true
                            ? 'border-violet-400 bg-violet-500/30'
                            : 'border-white/20 bg-white/10 hover:border-violet-400/50'
                        )}
                      >
                        <div className="text-2xl mb-1">✅ Sí, ya tengo salón</div>
                        <div className="text-white/60 text-sm">Ingresá el nombre del lugar</div>
                        {state.tieneSalon && (
                          <Input
                            value={state.salonNombre || ''}
                            onChange={e => updateState({ salonNombre: e.target.value })}
                            placeholder="Nombre del salón"
                            className="mt-3 bg-white/10 border-white/30 text-white placeholder:text-white/40"
                            onClick={e => e.stopPropagation()}
                          />
                        )}
                      </button>

                      <button
                        onClick={() => updateState({ tieneSalon: false })}
                        className={cn(
                          'rounded-2xl border-2 p-5 text-left transition-all',
                          state.tieneSalon === false
                            ? 'border-violet-400 bg-violet-500/30'
                            : 'border-white/20 bg-white/10 hover:border-violet-400/50'
                        )}
                      >
                        <div className="text-2xl mb-1">🔍 No, quiero salón incluido</div>
                        <div className="text-white/60 text-sm">Te recomendamos el Club Uruguay</div>
                      </button>
                    </div>

                    {state.tieneSalon === false && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-violet-600/40 to-purple-600/40 border border-violet-400/40 rounded-2xl p-5"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="w-5 h-5 text-violet-300" />
                          <span className="text-white font-bold">💎 Club Uruguay — Tu salón ideal</span>
                        </div>
                        <div className="text-white/70 text-sm space-y-1 mb-4">
                          <div>🏛️ Capacidad: 50 a 200 personas</div>
                          <div>📍 Ubicación céntrica en Salto</div>
                          <div>✨ Infraestructura completa incluida</div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className={cn(
                              'flex-1',
                              state.incluirClubUruguay
                                ? 'bg-violet-500 hover:bg-violet-400'
                                : 'bg-white/20 hover:bg-white/30'
                            )}
                            onClick={() => updateState({ incluirClubUruguay: true })}
                          >
                            {state.incluirClubUruguay ? '✓ Incluido' : 'Incluir'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-white/30 text-white hover:bg-white/10"
                            onClick={() => updateState({ incluirClubUruguay: false })}
                          >
                            No incluir
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    <NavButtons onPrev={goBack} onNext={goNext} />
                  </div>
                </StepCard>
              )}

              {/* ── STEP 7: Activación de servicios ──────────────────── */}
              {step === 7 && (
                <StepCard
                  title="Servicios incluidos 🎪"
                  subtitle={`Según tu tipo de evento (${state.tipoEvento || 'Cumpleaños'})`}
                >
                  <div className="space-y-3">
                    {(SERVICES_BY_TYPE[state.tipoEvento || 'Cumpleaños'] || []).map(srv => {
                      const isDefault = !srv.optional;
                      const isActive = isDefault || toggledServices[srv.id];
                      return (
                        <div
                          key={srv.id}
                          className={cn(
                            'flex items-center gap-3 rounded-xl border p-3 transition-all',
                            isActive
                              ? 'border-violet-400/60 bg-violet-500/20'
                              : 'border-white/10 bg-white/5'
                          )}
                        >
                          <div className={cn('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                            isActive ? 'bg-violet-500' : 'bg-white/20')}>
                            {isActive ? <Check className="w-3 h-3 text-white" /> : null}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-sm font-medium">{srv.nombre}</div>
                            <div className="text-white/50 text-xs">{srv.descripcion}</div>
                          </div>
                          {srv.optional && (
                            <button
                              onClick={() => setToggledServices(prev => ({ ...prev, [srv.id]: !prev[srv.id] }))}
                              className={cn(
                                'text-xs px-2 py-1 rounded-lg border transition-colors',
                                isActive
                                  ? 'border-violet-400 text-violet-300 bg-violet-500/20'
                                  : 'border-white/20 text-white/50 hover:border-violet-400/50'
                              )}
                            >
                              {isActive ? 'Quitar' : 'Agregar'}
                            </button>
                          )}
                          {isDefault && (
                            <span className="text-xs text-violet-300 bg-violet-500/20 px-2 py-0.5 rounded-full">Incluido</span>
                          )}
                        </div>
                      );
                    })}
                    <NavButtons onPrev={goBack} onNext={() => { updateState({ serviciosActivados: getActiveServices() }); goNext(); }} />
                  </div>
                </StepCard>
              )}

              {/* ── STEP 8: Paquete ──────────────────────────────────── */}
              {step === 8 && (
                <StepCard title="Elegí tu paquete 📦" subtitle="Seleccioná el nivel que mejor se adapta">
                  <div className="space-y-3">
                    {(['Básico', 'Intermedio', 'Premium'] as SimV2Paquete[]).map(pkg => {
                      const guests = totalGuests || 30;
                      const rates = BASE_RATES[state.tipoEvento || 'Cumpleaños'];
                      const mult = PACKAGE_MULTIPLIERS[pkg];
                      const price = (rates.perPerson * guests + rates.base) * mult * 0.8;
                      const isSelected = state.paquete === pkg;
                      const isRecommended = pkg === 'Intermedio';

                      return (
                        <button
                          key={pkg}
                          onClick={() => updateState({ paquete: pkg })}
                          className={cn(
                            'w-full rounded-2xl border-2 p-4 text-left transition-all',
                            isSelected
                              ? 'border-violet-400 bg-violet-500/30'
                              : 'border-white/20 bg-white/10 hover:border-violet-300/50'
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-bold">{pkg}</span>
                              {isRecommended && (
                                <span className="text-xs bg-violet-500 text-white px-2 py-0.5 rounded-full">⭐ Recomendado</span>
                              )}
                            </div>
                            <span className="text-violet-300 font-bold text-lg">{formatCurrency(price)}</span>
                          </div>
                          <div className="text-white/60 text-xs">
                            {pkg === 'Básico' && '✓ Servicios esenciales · Ideal para eventos íntimos'}
                            {pkg === 'Intermedio' && '✓ Todo lo esencial + extras · La opción más popular'}
                            {pkg === 'Premium' && '✓ Experiencia completa · El evento de tus sueños'}
                          </div>
                          <div className="text-white/40 text-xs mt-1">
                            {formatCurrency(Math.round(price / (guests || 1)))} por invitado
                          </div>
                        </button>
                      );
                    })}
                    <NavButtons onPrev={goBack} onNext={() => state.paquete ? goNext() : setError('Elegí un paquete para continuar.')} />
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                  </div>
                </StepCard>
              )}

              {/* ── STEP 9: Optimización automática ─────────────────── */}
              {step === 9 && (
                <StepCard title="Optimización automática ⚡" subtitle="Calculamos el equipo ideal para tu evento">
                  <div className="space-y-3">
                    {[
                      { icon: '🤵', label: 'Mozos recomendados', value: `${mozosRecomendados} personas`, note: '1 mozo por cada 20 adultos' },
                      { icon: '👨‍🍳', label: 'Personal de cocina', value: `${cocinerosRecomendados} persona${cocinerosRecomendados > 1 ? 's' : ''}`, note: `1 por cada ${GUESTS_PER_KITCHEN_STAFF} invitados` },
                      { icon: '🍹', label: 'Bebidas estimadas', value: `${bebidasEstimadas} litros`, note: `${LITERS_PER_ADULT}L por adulto` },
                    ].map(item => (
                      <div key={item.label} className="bg-white/10 rounded-xl p-4 flex items-center gap-4">
                        <div className="text-3xl">{item.icon}</div>
                        <div>
                          <div className="text-white font-semibold">{item.label}</div>
                          <div className="text-violet-300 font-bold">{item.value}</div>
                          <div className="text-white/40 text-xs">{item.note}</div>
                        </div>
                      </div>
                    ))}
                    {totalGuests > 80 && (
                      <div className="bg-amber-500/20 border border-amber-400/30 rounded-xl p-4 text-amber-300 text-sm">
                        💡 Recomendamos agregar 1 coordinador adicional para eventos de más de 80 personas.
                      </div>
                    )}
                    <NavButtons onPrev={goBack} onNext={() => { updateState({ mozosRecomendados }); goNext(); }} nextLabel="Confirmar optimización" />
                  </div>
                </StepCard>
              )}

              {/* ── STEP 10: Beneficios ───────────────────────────────── */}
              {step === 10 && (
                <StepCard title="🎁 Beneficios incluidos" subtitle="Sin costo adicional — ¡son todos tuyos!">
                  <div className="space-y-3">
                    {BENEFITS.map(b => (
                      <div key={b.id} className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Gift className="w-4 h-4 text-violet-300 flex-shrink-0" />
                          <span className="text-white text-sm">{b.label}</span>
                        </div>
                        <span className="text-violet-300 font-semibold text-sm">{formatCurrency(b.value)}</span>
                      </div>
                    ))}
                    <div className="bg-violet-600/30 border border-violet-400/40 rounded-xl p-4 text-center">
                      <div className="text-white/60 text-sm mb-1">Recibís beneficios por valor de</div>
                      <div className="text-2xl font-bold text-violet-300">{formatCurrency(benefitsTotal)}</div>
                      <div className="text-white/40 text-xs mt-1">sin costo adicional</div>
                    </div>
                    <NavButtons onPrev={goBack} onNext={goNext} />
                  </div>
                </StepCard>
              )}

              {/* ── STEP 11: Resumen ─────────────────────────────────── */}
              {step === 11 && (
                <StepCard title="Resumen de tu presupuesto 📋" subtitle="Todo lo que incluye tu cotización">
                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-xl p-4 space-y-2 text-sm">
                      <div className="flex justify-between text-white/70">
                        <span>Tipo de evento</span>
                        <span className="text-white font-medium">{state.tipoEvento}</span>
                      </div>
                      <div className="flex justify-between text-white/70">
                        <span>Fecha</span>
                        <span className="text-white font-medium capitalize">
                          {state.fechaEvento ? formatDateLabel(state.fechaEvento) : 'A definir'}
                        </span>
                      </div>
                      <div className="flex justify-between text-white/70">
                        <span>Invitados</span>
                        <span className="text-white font-medium">{totalGuests} personas</span>
                      </div>
                      <div className="flex justify-between text-white/70">
                        <span>Paquete</span>
                        <span className="text-white font-medium">{state.paquete}</span>
                      </div>
                      <div className="flex justify-between text-white/70">
                        <span>Duración</span>
                        <span className="text-white font-medium">
                          {state.duracion === 'mas4' ? 'Más de 4 horas' : 'Hasta 4 horas'}
                        </span>
                      </div>
                      {state.tieneSalon === false && state.incluirClubUruguay && (
                        <div className="flex justify-between text-white/70">
                          <span>Salón</span>
                          <span className="text-white font-medium">Club Uruguay</span>
                        </div>
                      )}
                      {state.tieneSalon && state.salonNombre && (
                        <div className="flex justify-between text-white/70">
                          <span>Salón</span>
                          <span className="text-white font-medium">{state.salonNombre}</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 space-y-2 text-sm">
                      <div className="flex justify-between text-white/60">
                        <span>Valor de lista</span>
                        <span className="line-through">{formatCurrency(total)}</span>
                      </div>
                      <div className="flex justify-between text-green-400 font-medium">
                        <span>Descuento 20%</span>
                        <span>− {formatCurrency(total - totalConDescuento)}</span>
                      </div>
                      <div className="border-t border-white/10 pt-2 flex justify-between">
                        <span className="text-white font-bold text-base">TOTAL FINAL</span>
                        <span className="text-violet-300 font-bold text-xl">{formatCurrency(totalConDescuento)}</span>
                      </div>
                      <div className="text-white/40 text-xs text-right">
                        {formatCurrency(Math.round(totalConDescuento / (totalGuests || 1)))} por invitado
                      </div>
                    </div>

                    <NavButtons onPrev={goBack} onNext={goNext} />
                  </div>
                </StepCard>
              )}

              {/* ── STEP 12: Urgencia ────────────────────────────────── */}
              {step === 12 && (
                <StepCard title="⏰ Las fechas se reservan rápido" subtitle="No pierdas la oportunidad">
                  <div className="space-y-4">
                    <div className="bg-amber-500/20 border border-amber-400/30 rounded-2xl p-6 text-center">
                      <div className="text-4xl mb-3">📅</div>
                      <p className="text-white font-semibold mb-2">
                        Los fines de semana en{' '}
                        {state.fechaEvento
                          ? parseEventDate(state.fechaEvento).toLocaleDateString('es-UY', { month: 'long', year: 'numeric' })
                          : 'los próximos meses'}{' '}
                        ya tienen eventos confirmados.
                      </p>
                      <p className="text-white/60 text-sm">
                        Asegurá tu fecha hoy y no pierdas la oportunidad de tener el evento perfecto.
                      </p>
                    </div>
                    <div className="bg-violet-600/20 border border-violet-400/30 rounded-xl p-4">
                      <div className="flex items-center gap-3 text-violet-300">
                        <Clock className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm font-medium">
                          Tu presupuesto de <strong>{formatCurrency(totalConDescuento)}</strong> está listo para compartir
                        </p>
                      </div>
                    </div>
                    <NavButtons onPrev={goBack} onNext={goNext} nextLabel="¡Quiero asegurar mi fecha!" />
                  </div>
                </StepCard>
              )}

              {/* ── STEP 13: Conversión final ─────────────────────────── */}
              {step === 13 && (
                <div className="space-y-6">
                  <StepCard title="🎉 ¡Todo listo!" subtitle="Tu presupuesto fue generado exitosamente">
                    <div className="space-y-4">
                      {saveDone ? (
                        <div className="flex items-center gap-2 bg-green-500/20 border border-green-400/30 rounded-xl px-4 py-3 text-green-300 text-sm">
                          <Check className="w-4 h-4" />
                          Tu presupuesto fue guardado en nuestro sistema
                        </div>
                      ) : loading ? (
                        <div className="flex items-center gap-2 text-white/60 text-sm">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Guardando tu presupuesto...
                        </div>
                      ) : null}

                      <div className="bg-violet-600/30 border border-violet-400/40 rounded-2xl p-5 text-center">
                        <div className="text-white/60 text-sm mb-1">Tu presupuesto estimado</div>
                        <div className="text-3xl font-bold text-violet-300">{formatCurrency(totalConDescuento)}</div>
                        <div className="text-white/40 text-xs mt-1">
                          {state.tipoEvento} · {totalGuests} invitados · Paquete {state.paquete}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        <Button
                          className="w-full bg-green-600 hover:bg-green-500 text-white flex items-center justify-center gap-2 h-12"
                          onClick={() => {
                            const msg = getWhatsAppMessage(state, totalConDescuento);
                            window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
                          }}
                        >
                          <Calendar className="w-4 h-4" />
                          📅 Agendar entrevista
                        </Button>

                        <Button
                          className="w-full bg-emerald-700 hover:bg-emerald-600 text-white flex items-center justify-center gap-2 h-12"
                          onClick={() => {
                            const msg = getWhatsAppMessage(state, totalConDescuento);
                            window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
                          }}
                        >
                          <MessageCircle className="w-4 h-4" />
                          💬 Enviar consulta por WhatsApp
                        </Button>

                        <Button
                          variant="outline"
                          className="w-full border-white/30 text-white hover:bg-white/10 flex items-center justify-center gap-2 h-12"
                          onClick={() => window.print()}
                        >
                          <FileText className="w-4 h-4" />
                          🖨️ Descargar / Imprimir PDF
                        </Button>
                      </div>
                    </div>
                  </StepCard>

                  <div className="print:hidden">
                    <PublicFooter variant="dark" />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/10">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {subtitle && <p className="text-white/50 text-sm mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function NavButtons({
  onPrev,
  onNext,
  loading,
  hidePrev,
  hideNext,
  nextLabel = 'Continuar',
}: {
  onPrev?: () => void;
  onNext?: () => void;
  loading?: boolean;
  hidePrev?: boolean;
  hideNext?: boolean;
  nextLabel?: string;
}) {
  return (
    <div className={cn('flex gap-3 mt-2', hidePrev ? 'justify-end' : 'justify-between')}>
      {!hidePrev && (
        <Button
          variant="outline"
          className="border-white/30 text-white hover:bg-white/10 flex items-center gap-1"
          onClick={onPrev}
          disabled={loading}
        >
          <ChevronLeft className="w-4 h-4" />
          Volver
        </Button>
      )}
      {!hideNext && (
        <Button
          className="bg-violet-600 hover:bg-violet-500 text-white flex items-center gap-1 flex-1 sm:flex-none sm:min-w-32"
          onClick={onNext}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              {nextLabel}
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </Button>
      )}
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  return (
    <div className="bg-white/10 rounded-xl p-4">
      <label className="text-white/70 text-sm block mb-2">{label}</label>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold flex items-center justify-center transition-colors"
        >
          −
        </button>
        <span className="text-white font-bold text-xl w-10 text-center">{value}</span>
        <button
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold flex items-center justify-center transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}

function InfoChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-violet-300">{icon}</div>
      <div>
        <div className="text-white/50 text-xs">{label}</div>
        <div className="text-white font-bold">{value}</div>
      </div>
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function SimuladorV2Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="flex items-center gap-3 text-white">
            <Sparkles className="w-6 h-6 animate-pulse" />
            <span>Cargando simulador...</span>
          </div>
        </div>
      }
    >
      <SimuladorV2Wizard />
    </Suspense>
  );
}
