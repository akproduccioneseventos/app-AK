'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import type { DietaryRestriction, InvitacionDigitalConfig, InvitacionDigitalCronograma, InvitacionSectionId, InvitacionSectionConfig, InvitacionTypographyConfig } from '@/types/fiesta';
import type { SocialConnection } from '@/types/settings';
import { TIPO_EVENTO_LABELS } from '@/lib/invitacion-config-defaults';
import { submitPublicRsvp } from '@/app/actions/fiesta/invitados.actions';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { MapPin, Clock, Gift, CreditCard, Copy, Check, Calendar, Heart, Users, ChevronDown, MessageCircle, Camera, Shirt, Loader2, Instagram, Facebook, Volume2, VolumeX, Music, X, ChevronLeft, ChevronRight, Sparkles, HelpCircle, Hotel, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { SplashScreen } from '@/components/invitacion/SplashScreen';
import { buildGoogleCalendarUrl } from '@/lib/calendar-links';
import { formatEventDate, parseEventDate } from '@/lib/public-experience/event-date';
import { XVThemeEffects } from '@/components/invitacion/xv-theme-effects';
import { canUseNextImage } from '@/lib/next-image-url';

interface Props {
  config: InvitacionDigitalConfig;
  fiestaId: string;
  socialConnections?: SocialConnection[];
  isEditorMode?: boolean;
  onConfigChange?: (nextConfig: InvitacionDigitalConfig) => void;
}

// â”€â”€â”€ Typography helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function getHeroTitleClass(typography?: InvitacionTypographyConfig): string {
  const mobile = typography?.heroTitleMobile || 'text-3xl sm:text-5xl';
  const desktop = typography?.heroTitleDesktop || 'lg:text-7xl';
  return `${mobile} ${desktop}`;
}

export function getSectionTitleClass(typography?: InvitacionTypographyConfig): string {
  return typography?.sectionTitle || 'text-xl sm:text-3xl';
}

export function getBodyTextClass(typography?: InvitacionTypographyConfig): string {
  return typography?.body || 'text-sm sm:text-base';
}

export function getButtonTextClass(typography?: InvitacionTypographyConfig): string {
  return typography?.button || 'text-sm';
}

export function getSectionSpacingClass(typography?: InvitacionTypographyConfig): string {
  const spacing = typography?.spacing;
  if (spacing === 'compact') return 'py-8';
  if (spacing === 'spacious') return 'py-20';
  return 'py-16';
}

// â”€â”€â”€ Section visibility / ordering helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const DEFAULT_SECTION_ORDER: Record<InvitacionSectionId, number> = {
  hero: 1,
  bienvenida: 2,
  contador: 3,
  cronograma: 4,
  ubicacion: 5,
  dressCode: 6,
  galeria: 7,
  regalos: 8,
  rsvp: 9,
  muroSocial: 10,
  ctaAk: 11,
  footer: 12,
  historia: 13,
  faq: 14,
  logistica: 15,
};

/**
 * Returns whether a section should be visible based on the sectionsConfig.
 * Sections not explicitly listed in sectionsConfig default to visible=true
 * (opt-in hiding rather than opt-in showing).
 */
export function isSectionVisible(
  sectionId: InvitacionSectionId,
  sectionsConfig?: InvitacionSectionConfig[]
): boolean {
  if (!sectionsConfig || sectionsConfig.length === 0) return true;
  const cfg = sectionsConfig.find((s) => s.id === sectionId);
  return cfg ? cfg.visible : true;
}

export function getSectionOrder(
  sectionId: InvitacionSectionId,
  sectionsConfig?: InvitacionSectionConfig[]
): number {
  if (!sectionsConfig) return DEFAULT_SECTION_ORDER[sectionId] ?? 99;
  const cfg = sectionsConfig.find((s) => s.id === sectionId);
  return cfg ? cfg.order : (DEFAULT_SECTION_ORDER[sectionId] ?? 99);
}


// ---------- COUNTDOWN ----------
function Countdown({ fechaEvento }: { fechaEvento: string }) {
  const [timeLeft, setTimeLeft] = useState({ dias: 0, horas: 0, minutos: 0, segundos: 0 });

  useEffect(() => {
    // La fecha viene sin hora. Leida de la forma directa apunta a las nueve de la
    // noche del dia anterior, asi que la cuenta regresiva llegaba a cero antes de
    // tiempo. `parseEventDate` la ubica en el dia correcto.
    const target = parseEventDate(fechaEvento)?.getTime() ?? new Date(fechaEvento).getTime();
    let timeoutId: ReturnType<typeof setTimeout>;

    const update = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        dias: Math.floor(diff / (1000 * 60 * 60 * 24)),
        horas: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutos: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        segundos: Math.floor((diff % (1000 * 60)) / 1000),
      });
      if (diff > 0) {
        timeoutId = setTimeout(update, 1000);
      }
    };

    update();
    return () => clearTimeout(timeoutId);
  }, [fechaEvento]);

  return (
    <div className="flex justify-center gap-3 sm:gap-6">
      {Object.entries(timeLeft).map(([label, value]) => (
        <div key={label} className="text-center">
          <div className="text-3xl sm:text-5xl font-bold tabular-nums" style={{ color: 'var(--inv-primary)' }}>
            {String(value).padStart(2, '0')}
          </div>
          <div className="text-xs sm:text-sm text-gray-500 mt-1 capitalize">{label}</div>
        </div>
      ))}
    </div>
  );
}

function RsvpSection({ fiestaId, texto, typography, onSuccess }: { fiestaId: string; texto?: string; typography?: InvitacionTypographyConfig; onSuccess?: () => void }) {
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [asistencia, setAsistencia] = useState<'Confirmado' | 'Rechazado' | 'Tal vez'>('Confirmado');
  const [personas, setPersonas] = useState('1');
  const [acompanantes, setAcompanantes] = useState('');
  const [dietaryRestriction, setDietaryRestriction] = useState<DietaryRestriction>('Ninguna');
  const [alergiasEspecificas, setAlergiasEspecificas] = useState('');
  const [cancion, setCancion] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [requiereAccesibilidad, setRequiereAccesibilidad] = useState(false);
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [step, setStep] = useState<number>(1);
  const isNoAsiste = asistencia === 'Rechazado';
  const totalSteps = isNoAsiste ? 2 : 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setIsSubmitting(true);
    setError('');
    try {
      const companionNames = acompanantes
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      const cancionesDJ = cancion.trim() ? [cancion.trim()] : [];
      const result = await submitPublicRsvp(fiestaId, {
        nombre: nombre.trim(),
        contacto: contacto.trim() || undefined,
        asistencia,
        partySize: isNoAsiste ? 1 : parseInt(personas, 10) || 1,
        companionNames: isNoAsiste ? undefined : (companionNames.length > 0 ? companionNames : undefined),
        dietaryRestriction: isNoAsiste ? 'Ninguna' : dietaryRestriction,
        alergiasEspecificas: isNoAsiste ? undefined : (alergiasEspecificas.trim() || undefined),
        cancionesDJ: isNoAsiste ? [] : cancionesDJ,
        mensaje: mensaje.trim() || undefined,
        requiereAccesibilidad: isNoAsiste ? false : requiereAccesibilidad,
      });
      if (result.success) {
        setSent(true);
        if (onSuccess) onSuccess();
      } else {
        setError(result.error || 'No se pudo confirmar. Intentá de nuevo.');
      }
    } catch {
      setError('Error de conexión. Intentá de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!nombre.trim()) {
        setError('Por favor ingresá tu nombre completo.');
        return;
      }
      setError('');
      if (isNoAsiste) {
        setStep(2); // Ir directo al paso del mensaje
      } else {
        setStep(2);
      }
    } else if (step === 2) {
      if (isNoAsiste) {
        // Enviar formulario en paso 2 si no asiste
        return;
      }
      setStep(3);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const asistenciaOptions: { value: 'Confirmado' | 'Rechazado' | 'Tal vez'; label: string; emoji: string }[] = [
    { value: 'Confirmado', label: 'Asistiré', emoji: 'âœ…' },
    { value: 'Tal vez', label: 'Tal vez', emoji: 'ðŸ¤”' },
    { value: 'Rechazado', label: 'No puedo', emoji: 'âŒ' },
  ];

  if (sent) {
    const confirmLabels: Record<string, string> = {
      Confirmado: '¡Hasta pronto!',
      'Tal vez': '¡Gracias por avisarnos!',
      Rechazado: 'Te vamos a extrañar.',
    };
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8 space-y-4 max-w-md mx-auto"
      >
        <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center shadow-lg bg-green-50 animate-bounce">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800">¡Confirmación recibida!</h3>
        <p className="text-gray-500 font-medium">{confirmLabels[asistencia] ?? 'Gracias por responder.'}</p>
        <p className="text-sm text-gray-400">Hemos guardado tu confirmación para el evento.</p>
      </motion.div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
      {texto && step === 1 && <p className="text-center text-xs sm:text-sm text-gray-500 leading-relaxed mb-4">{texto}</p>}

      {/* Progress Bar */}
      <div className="relative pt-1">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-gray-500">
          <span>Paso {step} de {totalSteps}</span>
          <span>{Math.round((step / totalSteps) * 100)}%</span>
        </div>
        <div className="overflow-hidden h-1.5 text-xs flex rounded bg-gray-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(step / totalSteps) * 100}%` }}
            transition={{ duration: 0.3 }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center"
            style={{ backgroundColor: 'var(--inv-primary)' }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 overflow-hidden min-h-[300px] flex flex-col justify-between">
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">Nombre completo *</label>
                  <Input
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    required
                    placeholder="Tu nombre y apellido"
                    className="h-11 rounded-lg border-gray-200 focus-visible:ring-[var(--inv-primary)]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">WhatsApp / Celular (opcional)</label>
                  <Input
                    value={contacto}
                    onChange={e => setContacto(e.target.value)}
                    placeholder="Ej: 099 123 456"
                    className="h-11 rounded-lg border-gray-200"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-gray-600">¿Asistirás al evento?</label>
                  <div className="grid grid-cols-3 gap-2">
                    {asistenciaOptions.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setAsistencia(opt.value);
                        }}
                        className={cn(
                          'flex flex-col items-center justify-center rounded-lg border-2 px-1 py-2 text-xs font-bold transition-all duration-300 hover:scale-[1.03]',
                          asistencia === opt.value
                            ? 'border-transparent text-white shadow-md'
                            : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
                        )}
                        style={asistencia === opt.value ? { backgroundColor: 'var(--inv-primary)' } : {}}
                      >
                        <span className="text-xl mb-1">{opt.emoji}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && !isNoAsiste && (
              <motion.div
                key="step2-asiste"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Total de personas (incluyéndote)</label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={personas}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 1;
                      setPersonas(Math.min(20, Math.max(1, val)).toString());
                    }}
                    className="h-11 rounded-lg border-gray-200"
                  />
                </div>

                {parseInt(personas, 10) > 1 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-1"
                  >
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">Nombres de acompañantes</label>
                    <Input
                      value={acompanantes}
                      onChange={e => setAcompanantes(e.target.value)}
                      placeholder="Separados por coma: ej. María, Juan"
                      className="h-11 rounded-lg border-gray-200"
                    />
                  </motion.div>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">Restricción alimentaria</label>
                  <select
                    value={dietaryRestriction}
                    onChange={e => setDietaryRestriction(e.target.value as typeof dietaryRestriction)}
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--inv-primary)]"
                  >
                    <option value="Ninguna">Sin restricciones (Menú Común)</option>
                    <option value="Celiaco">Celíaco/a (Sin Gluten)</option>
                    <option value="Vegetariano">Vegetariano/a</option>
                    <option value="Vegano">Vegano/a</option>
                    <option value="Sin Lactosa">Sin Lactosa</option>
                    <option value="Otro">Otra alergia/restricción</option>
                  </select>
                </div>

                {(dietaryRestriction === 'Otro' || dietaryRestriction === 'Celiaco') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">Detalla tu restricción o alergia</label>
                    <Input
                      value={alergiasEspecificas}
                      onChange={e => setAlergiasEspecificas(e.target.value)}
                      placeholder="Ej. alergia al maní, intolerancia..."
                      className="h-11 rounded-lg border-gray-200"
                    />
                  </motion.div>
                )}
              </motion.div>
            )}

            {((step === 2 && isNoAsiste) || (step === 3 && !isNoAsiste)) && (
              <motion.div
                key="step-final"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {!isNoAsiste && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Sugerencia para el DJ (opcional)</label>
                    <Input
                      value={cancion}
                      onChange={e => setCancion(e.target.value)}
                      placeholder="Artista - Nombre de canción"
                      className="rounded-xl border-gray-200 h-11"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Mensaje para la familia (opcional)</label>
                  <textarea
                    value={mensaje}
                    onChange={e => setMensaje(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--inv-primary)]"
                    rows={3}
                    placeholder={isNoAsiste ? "Escribí unas palabras de disculpa o cariño..." : "Dejá un mensaje especial..."}
                  />
                </div>

                {!isNoAsiste && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                    <input
                      type="checkbox"
                      id="accesibilidad"
                      checked={requiereAccesibilidad}
                      onChange={e => setRequiereAccesibilidad(e.target.checked)}
                      className="w-4 h-4 rounded text-[var(--inv-primary)] focus:ring-[var(--inv-primary)]"
                    />
                    <label htmlFor="accesibilidad" className="text-xs text-gray-600 leading-snug">Necesito asistencia de accesibilidad (movilidad reducida, etc.)</label>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && <p className="text-xs text-red-500 text-center font-semibold mt-2">{error}</p>}

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-100 mt-4">
          {step > 1 && (
            <Button
              type="button"
              onClick={prevStep}
              className="flex-1 rounded-xl h-11 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 font-bold transition-transform active:scale-95"
            >
              Atrás
            </Button>
          )}

          {step < totalSteps ? (
            <Button
              type="button"
              onClick={nextStep}
              className="flex-1 rounded-xl h-11 font-bold text-white shadow-md hover:opacity-95 transition-all active:scale-95"
              style={{ backgroundColor: 'var(--inv-primary)' }}
            >
              Siguiente
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isSubmitting}
              className={cn('flex-1 rounded-xl h-11 font-bold text-white shadow-md transition-all active:scale-95', getButtonTextClass(typography))}
              style={{ backgroundColor: 'var(--inv-primary)' }}
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Confirmar'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

// ---------- COPY ALIAS BUTTON ----------
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors" style={{ color: 'var(--inv-primary)', backgroundColor: 'var(--inv-secondary)' }}>
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  );
}

// ---------- SECTION WRAPPER ----------
const Section: React.FC<{ children: React.ReactNode; className?: string; id?: string; typography?: InvitacionTypographyConfig }> = ({ children, className, id, typography }) => (
  <motion.section
    id={id}
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
    className={cn('px-4 sm:px-8', getSectionSpacingClass(typography), className)}
  >
    {children}
  </motion.section>
);

// ---------- AUXILIARY PREMIUM COMPONENTS ----------

function Confetti() {
  const pieces = Array.from({ length: 80 });
  const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#f43f5e', '#a855f7'];
  return (
    <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden">
      {pieces.map((_, idx) => {
        const size = Math.random() * 8 + 6;
        const color = colors[idx % colors.length];
        return (
          <motion.div
            key={idx}
            initial={{
              opacity: 1,
              x: `${Math.random() * 100}vw`,
              y: -20,
              scale: 1,
              rotate: 0
            }}
            animate={{
              y: '105vh',
              rotate: Math.random() * 360 * 3,
              x: `${Math.random() * 100}vw`,
              opacity: [1, 1, 0]
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              ease: 'linear',
              delay: Math.random() * 0.5
            }}
            style={{
              width: size,
              height: size,
              borderRadius: idx % 2 === 0 ? '50%' : '20%',
              backgroundColor: color,
              position: 'absolute'
            }}
          />
        );
      })}
    </div>
  );
}

function TiltCard({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-150, 150], [10, -10]);
  const rotateY = useTransform(x, [-150, 150], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;
    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
        ...style
      }}
      className={className}
    >
      <div style={{ transform: 'translateZ(10px)' }} className="h-full w-full">
        {children}
      </div>
    </motion.div>
  );
}

function BackgroundMusicPlayer({ src, splashDone }: { src?: string; splashDone: boolean }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fallback royalty-free beautiful piano track
  const defaultMusicUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
  const musicSrc = src || defaultMusicUrl;

  useEffect(() => {
    audioRef.current = new Audio(musicSrc);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.4;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [musicSrc]);

  useEffect(() => {
    if (splashDone && audioRef.current && !playing) {
      audioRef.current.play()
        .then(() => setPlaying(true))
        .catch(() => {
          console.log("Autoplay blocked, waiting for user click.");
        });
    }
  }, [splashDone, playing]);

  useEffect(() => {
    const unlockAudio = () => {
      if (splashDone && audioRef.current && !playing) {
        audioRef.current.play()
          .then(() => {
            setPlaying(true);
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
          })
          .catch(() => {});
      }
    };
    if (splashDone && !playing) {
      window.addEventListener('click', unlockAudio);
      window.addEventListener('touchstart', unlockAudio);
    }
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, [splashDone, playing]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setPlaying(true))
        .catch(err => console.log(err));
    }
  };

  return (
    <div className="fixed top-6 right-6 z-[99]">
      <motion.button
        type="button"
        onClick={togglePlay}
        aria-label={playing ? 'Pausar musica' : 'Reproducir musica'}
        className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-md border shadow-lg flex items-center justify-center relative hover:scale-105 active:scale-95 transition-transform duration-300 focus:outline-none"
        style={{ borderColor: 'var(--inv-primary)' }}
        animate={playing ? { rotate: 360 } : {}}
        transition={playing ? { duration: 12, repeat: Infinity, ease: 'linear' } : {}}
      >
        {playing ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex gap-[2.5px] items-end h-3.5">
              {[...Array(3)].map((_, i) => (
                <motion.span
                  key={i}
                  animate={{ height: [3, 12, 3] }}
                  transition={{
                    duration: 0.5 + i * 0.15,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="w-[2px] rounded-full"
                  style={{ backgroundColor: 'var(--inv-primary)' }}
                />
              ))}
            </div>
          </div>
        ) : (
          <VolumeX className="w-5 h-5" style={{ color: 'var(--inv-primary)' }} />
        )}
      </motion.button>
    </div>
  );
}

interface FAQItem {
  pregunta: string;
  respuesta: string;
}

function FAQAccordion({ items, colorPrincipal }: { items: FAQItem[]; colorPrincipal: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3 max-w-xl mx-auto text-left">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i} className="rounded-2xl border border-gray-200/80 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full px-5 py-4 flex items-center justify-between font-semibold text-gray-800 text-sm sm:text-base text-left transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 flex-shrink-0" style={{ color: colorPrincipal }} />
                <span>{item.pregunta}</span>
              </div>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-gray-400"
              >
                <ChevronDown className="w-5 h-5" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  <div className="px-5 pb-5 pt-1 text-sm text-gray-600 leading-relaxed border-t border-gray-100">
                    {item.respuesta}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

interface Hito {
  fecha?: string;
  titulo: string;
  descripcion: string;
  fotoUrl?: string;
}

function StoryTimeline({ hitos, colorPrincipal, colorSecundario }: { hitos: Hito[]; colorPrincipal: string; colorSecundario: string }) {
  return (
    <div className="relative max-w-2xl mx-auto">
      {/* Central Line */}
      <div className="absolute left-4 sm:left-1/2 top-2 bottom-2 w-0.5 bg-gray-200 -translate-x-1/2" />

      <div className="space-y-12">
        {hitos.map((hito, i) => {
          const isEven = i % 2 === 0;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={cn(
                "relative flex flex-col sm:flex-row items-start sm:items-center w-full",
                isEven ? "sm:flex-row-reverse" : ""
              )}
            >
              {/* Central Point */}
              <div className="absolute left-4 sm:left-1/2 top-4 sm:top-auto w-6 h-6 rounded-full border-4 bg-white -translate-x-1/2 flex items-center justify-center shadow" style={{ borderColor: colorPrincipal }} />

              {/* Card Container */}
              <div className={cn(
                "w-full sm:w-[45%] pl-10 sm:pl-0",
                isEven ? "sm:text-right sm:pr-8" : "sm:pl-8"
              )}>
                <div className="bg-white/75 backdrop-blur-md rounded-2xl p-5 border border-white/40 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: colorPrincipal }} />
                  {hito.fecha && (
                    <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-3 shadow-sm text-white" style={{ backgroundColor: colorPrincipal }}>
                      {hito.fecha}
                    </span>
                  )}
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1.5">{hito.titulo}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{hito.descripcion}</p>
                  {hito.fotoUrl && (
                    <div className="relative mt-4 rounded-xl overflow-hidden aspect-video shadow-inner">
                      {canUseNextImage(hito.fotoUrl) ? (
                        <Image src={hito.fotoUrl} alt={hito.titulo} fill sizes="(max-width: 640px) 100vw, 640px" className="object-cover" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element -- Invitation media may use an external host outside Next's allowlist.
                        <img src={hito.fotoUrl} alt={hito.titulo} className="w-full h-full object-cover" loading="lazy" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

interface Hospedaje {
  nombre: string;
  direccion: string;
  linkBooking?: string;
  telefono?: string;
}

function LogisticaCards({ hospedajes, colorPrincipal, colorSecundario }: { hospedajes: Hospedaje[]; colorPrincipal: string; colorSecundario: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
      {hospedajes.map((hotel, i) => (
        <TiltCard key={i}>
          <div className="bg-white/75 backdrop-blur-md rounded-2xl p-5 border border-white/40 h-full flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: colorSecundario }}>
                <Hotel className="w-5 h-5" style={{ color: colorPrincipal }} />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2">{hotel.nombre}</h3>
              <p className="text-xs sm:text-sm text-gray-500 mb-4">{hotel.direccion}</p>
            </div>
            {hotel.linkBooking && (
              <a
                href={hotel.linkBooking}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center text-xs font-semibold py-2 px-4 rounded-xl text-white shadow transition-all hover:scale-[1.02] flex items-center justify-center gap-1.5 mt-2"
                style={{ backgroundColor: colorPrincipal }}
              >
                Reservar en Booking
              </a>
            )}
          </div>
        </TiltCard>
      ))}
    </div>
  );
}

// ---------- TEMPLATE STYLES ----------
function getTemplateStyles(plantillaId: string): {
  fontHeading: string;
  fontBody: string;
  heroOverlay: string;
  sectionAltBg: string;
  borderStyle: string;
  badgeClass: string;
} {
  switch (plantillaId) {
    case 'XV_NeonParty':
      return {
        fontHeading: 'font-body font-black tracking-widest uppercase',
        fontBody: 'font-body text-gray-200 bg-slate-950',
        heroOverlay: 'from-slate-950 via-slate-950/60 to-transparent',
        sectionAltBg: 'bg-slate-900 border-y border-fuchsia-500/25',
        borderStyle: 'border-fuchsia-500/30',
        badgeClass: 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40',
      };
    case 'XV_PrincesaClasica':
      return {
        fontHeading: 'font-playfair italic tracking-wide font-medium',
        fontBody: 'font-body text-zinc-800 bg-[#fff9f9]',
        heroOverlay: 'from-rose-950/40 via-rose-100/5 to-transparent',
        sectionAltBg: 'bg-[#fff4f4] border-y border-rose-100',
        borderStyle: 'border-rose-100',
        badgeClass: 'bg-rose-50 text-rose-700 border border-rose-100',
      };
    case 'XV_GlowInTheDark':
      return {
        fontHeading: 'font-body font-black tracking-widest uppercase',
        fontBody: 'font-body text-gray-100 bg-purple-950',
        heroOverlay: 'from-purple-950 via-purple-900/50 to-transparent',
        sectionAltBg: 'bg-purple-900/60 border-y border-purple-500/20',
        borderStyle: 'border-lime-400/35',
        badgeClass: 'bg-lime-400/25 text-lime-300 border border-lime-400/40',
      };
    case 'XV_MinimalChic':
      return {
        fontHeading: 'font-body font-light tracking-[0.25em] uppercase',
        fontBody: 'font-body font-light text-neutral-800 bg-neutral-50/10',
        heroOverlay: 'from-neutral-900/40 via-neutral-100/5 to-transparent',
        sectionAltBg: 'bg-neutral-50 border-y border-neutral-100',
        borderStyle: 'border-neutral-200',
        badgeClass: 'bg-neutral-100 text-neutral-800 border border-neutral-200',
      };
    case 'EleganteDorado':
      return {
        fontHeading: 'font-playfair font-bold tracking-wide',
        fontBody: 'font-body text-zinc-800 bg-[#fdfbf7]',
        heroOverlay: 'from-black/55 via-black/20 to-transparent',
        sectionAltBg: 'bg-gradient-to-b from-[#fbf8f2] to-[#fdfbf7] border-y border-amber-100/60',
        borderStyle: 'border-amber-100/70',
        badgeClass: 'bg-amber-50 text-amber-800 border border-amber-100/40',
      };
    case 'ModernoMinimalista':
      return {
        fontHeading: 'font-body font-medium tracking-normal',
        fontBody: 'font-body text-gray-800 bg-white',
        heroOverlay: 'from-black/45 to-transparent',
        sectionAltBg: 'bg-gray-50 border-y border-gray-100',
        borderStyle: 'border-gray-200',
        badgeClass: 'bg-gray-100 text-gray-700 border border-gray-200',
      };
    case 'RomanticoFloral':
      return {
        fontHeading: 'font-dancing text-3xl sm:text-4xl font-semibold',
        fontBody: 'font-body text-zinc-800 bg-[#fffbfc]',
        heroOverlay: 'from-pink-950/40 via-rose-800/10 to-transparent',
        sectionAltBg: 'bg-gradient-to-b from-[#fff5f7] to-white border-y border-pink-100',
        borderStyle: 'border-pink-100',
        badgeClass: 'bg-pink-50 text-pink-700 border border-pink-100',
      };
    case 'FiestaVibrante':
      return {
        fontHeading: 'font-body font-black tracking-tight',
        fontBody: 'font-body text-gray-800 bg-white',
        heroOverlay: 'from-purple-950/50 via-indigo-900/10 to-transparent',
        sectionAltBg: 'bg-gradient-to-br from-indigo-50/30 to-purple-50/30 border-y border-purple-100/50',
        borderStyle: 'border-purple-100',
        badgeClass: 'bg-purple-50 text-purple-700 border border-purple-100/40',
      };
    default:
      return {
        fontHeading: 'font-playfair font-bold tracking-wide',
        fontBody: 'font-body text-gray-800 bg-white',
        heroOverlay: 'from-black/50 via-black/15 to-transparent',
        sectionAltBg: 'bg-gray-50 border-y border-gray-100',
        borderStyle: 'border-gray-200',
        badgeClass: 'bg-gray-100 text-gray-700 border border-gray-200',
      };
  }
}

function EditableText({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!editing) {
      setDraft(value);
    }
  }, [value, editing]);

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => {
          onChange(draft.trim());
          setEditing(false);
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            onChange(draft.trim());
            setEditing(false);
          }
        }}
        className={cn('bg-black/20 text-current text-center outline-none border-b-2 border-current rounded px-1', className)}
      />
    );
  }

  return (
    <span onClick={() => setEditing(true)} className={cn('cursor-text hover:bg-white/10 rounded px-1 transition-colors', className)}>
      {value || 'Clic para editar'}
    </span>
  );
}

// ---------- MAIN COMPONENT ----------
export function InvitacionPublicaClient({ config, fiestaId, socialConnections = [], isEditorMode = false, onConfigChange }: Props) {
  const styles = getTemplateStyles(config.plantillaId);
  const tipoLabel = TIPO_EVENTO_LABELS[config.tipoEvento] || 'Evento Especial';
  const isBoda = config.tipoEvento === 'boda';
  const secondName = config.nombreHomenajeado2;
  const [heroImageError, setHeroImageError] = useState(false);
  const [splashDone, setSplashDone] = useState(isEditorMode);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [rsvpConfirmed, setRsvpConfirmed] = useState(false);

  useEffect(() => {
    setHeroImageError(false);
  }, [config.fotoPortada]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activePhotoIndex === null) return;
      if (e.key === 'Escape') {
        setActivePhotoIndex(null);
      } else if (e.key === 'ArrowRight' && activePhotoIndex < config.galeriaFotos.length - 1) {
        setActivePhotoIndex(activePhotoIndex + 1);
      } else if (e.key === 'ArrowLeft' && activePhotoIndex > 0) {
        setActivePhotoIndex(activePhotoIndex - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhotoIndex, config.galeriaFotos]);

  // Antes se armaba con `new Date(texto)` y se formateaba sin zona horaria: la
  // fecha "2026-08-01" se leia como medianoche en Londres y en Uruguay caia el
  // dia anterior. El invitado veia "viernes 31 de julio" para una fiesta del
  // sabado 1 de agosto, y ademas el servidor y su celular mostraban dias
  // distintos en la misma pantalla.
  const formatDate = (dateStr: string) => formatEventDate(dateStr) ?? 'Fecha por confirmar';

  const hasLocation = !!(config.nombreSalon || config.direccionSalon || config.linkMaps);
  const calendarUrl = buildGoogleCalendarUrl({
    title: `${config.nombreHomenajeada || 'Fiesta'}${secondName ? ` & ${secondName}` : ''}`,
    startDate: config.fechaEvento,
    startTime: config.horaEvento,
    location: [config.nombreSalon, config.direccionSalon].filter(Boolean).join(' - '),
    details: `Invitacion digital de ${config.nombreHomenajeada || 'la fiesta'}.`,
  });
  const hasDressCode = config.mostrarDressCode && !!(config.dressCode && config.dressCode.tipo);
  const hasGifts = config.regalos?.tipo !== 'ninguno';
  const hasGallery = config.galeriaFotos && config.galeriaFotos.length > 0;
  const hasCronograma = config.cronograma && config.cronograma.length > 0;
  const hasWhatsApp = !!config.whatsappNumero;
  const hasSocialPortal = config.portalSocialActivo;

  const cssVars = {
    '--inv-primary': config.colorPrincipal,
    '--inv-secondary': config.colorSecundario,
    '--inv-accent': config.colorAcento,
  } as React.CSSProperties;

  // â”€â”€â”€ Build ordered middle sections â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  type SectionEntry = { id: InvitacionSectionId; order: number; el: React.ReactNode };
  const sectionEntries: SectionEntry[] = [];

  const PLACEHOLDER_EL = (id: string) => (
    <Section key={`${id}-placeholder`} className="text-center max-w-lg mx-auto" typography={config.typography}>
      <p className={cn(getBodyTextClass(config.typography), 'text-gray-600 italic')}>
        AK esta preparando esta seccion para que se vea perfecta cuando el organizador la active.
      </p>
    </Section>
  );

  const addSectionEntry = (
    id: InvitacionSectionId,
    condition: boolean,
    el: React.ReactNode,
    showPlaceholder = false
  ) => {
    if (!isSectionVisible(id, config.sectionsConfig)) return;
    if (!condition) {
      if (showPlaceholder) {
        sectionEntries.push({ id, order: getSectionOrder(id, config.sectionsConfig), el: PLACEHOLDER_EL(id) });
      }
      return;
    }
    sectionEntries.push({ id, order: getSectionOrder(id, config.sectionsConfig), el });
  };

  addSectionEntry('bienvenida', !!config.textoBienvenida, (
    <Section key="bienvenida" id="bienvenida" className="text-center max-w-2xl mx-auto" typography={config.typography}>
      <div className="w-16 h-px mx-auto mb-8" style={{ backgroundColor: 'var(--inv-primary)' }} />
      {isEditorMode && onConfigChange ? (
        <EditableText
          value={config.textoBienvenida || ''}
          onChange={(value) => onConfigChange({ ...config, textoBienvenida: value })}
          className="text-lg sm:text-xl text-gray-600 leading-relaxed border-gray-400"
        />
      ) : (
        <p className={cn(getBodyTextClass(config.typography), 'text-gray-600 leading-relaxed')}>{config.textoBienvenida}</p>
      )}
      <div className="w-16 h-px mx-auto mt-8" style={{ backgroundColor: 'var(--inv-primary)' }} />
    </Section>
  ));

  addSectionEntry('contador', config.contadorActivo && !!config.fechaEvento, (
    <Section key="contador" className={cn('text-center', styles.sectionAltBg)} typography={config.typography}>
      <h2 className={cn(getSectionTitleClass(config.typography), 'mb-8', styles.fontHeading)} style={{ color: 'var(--inv-primary)' }}>
        Faltan...
      </h2>
      <Countdown fechaEvento={config.fechaEvento} />
    </Section>
  ));

  addSectionEntry('cronograma', !!hasCronograma, (
    <Section key="cronograma" className="max-w-lg mx-auto" typography={config.typography}>
      <h2 className={cn(getSectionTitleClass(config.typography), 'text-center mb-10', styles.fontHeading)} style={{ color: 'var(--inv-primary)' }}>
        Cronograma
      </h2>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5" style={{ backgroundColor: 'var(--inv-secondary)' }} />
        {(config.cronograma as InvitacionDigitalCronograma[] | undefined ?? []).map((item, i) => (
          <div key={i} className="relative pl-12 pb-8 last:pb-0">
            <div className="absolute left-1.5 top-1 w-5 h-5 rounded-full border-2 bg-white" style={{ borderColor: 'var(--inv-primary)' }} />
            <div className="flex items-baseline gap-3">
              <span className="text-sm font-bold whitespace-nowrap" style={{ color: 'var(--inv-primary)' }}>{item.hora}</span>
              <span className={cn(getBodyTextClass(config.typography), 'text-gray-700')}>
                {item.icono ? `${item.icono} ` : ''}
                {item.actividad}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Section>
  ), true);

  addSectionEntry('ubicacion', hasLocation, (
    <Section key="ubicacion" className={cn('text-center', styles.sectionAltBg)} typography={config.typography}>
      <TiltCard className="max-w-md mx-auto bg-white/75 backdrop-blur-lg p-8 rounded-[2rem] border border-white/40 shadow-xl">
        <MapPin className="w-8 h-8 mx-auto mb-4 animate-bounce" style={{ color: 'var(--inv-primary)' }} />
        <h2 className={cn(getSectionTitleClass(config.typography), 'mb-2 font-bold', styles.fontHeading)} style={{ color: 'var(--inv-primary)' }}>
          {config.nombreSalon || 'Ubicación'}
        </h2>
        {config.direccionSalon && (
          <p className={cn(getBodyTextClass(config.typography), 'text-gray-600 mb-6')}>{config.direccionSalon}</p>
        )}
        {config.linkMaps && (
          <a
            href={config.linkMaps}
            target="_blank"
            rel="noopener noreferrer"
            className={cn('inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold shadow-lg transition-transform hover:scale-105', getButtonTextClass(config.typography))}
            style={{ backgroundColor: 'var(--inv-primary)' }}
          >
            <MapPin className="w-4 h-4" />
            Cómo llegar
          </a>
        )}
      </TiltCard>
    </Section>
  ), true);

  addSectionEntry('dressCode', hasDressCode, (
    <Section key="dressCode" className="text-center max-w-lg mx-auto" typography={config.typography}>
      <TiltCard className="bg-white/75 backdrop-blur-lg p-8 rounded-[2rem] border border-white/40 shadow-xl">
        <Shirt className="w-8 h-8 mx-auto mb-4" style={{ color: 'var(--inv-primary)' }} />
        <h2 className={cn(getSectionTitleClass(config.typography), 'mb-4 font-bold', styles.fontHeading)} style={{ color: 'var(--inv-primary)' }}>
          Dress Code
        </h2>
        <span className={cn('inline-block px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm', styles.badgeClass)}>
          {config.dressCode.tipo === 'personalizado'
            ? (config.dressCode.textoPersonalizado || 'Personalizado')
            : config.dressCode.tipo.charAt(0).toUpperCase() + config.dressCode.tipo.slice(1)}
        </span>
        {config.dressCode.colorSugerido && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-gray-200 shadow-inner" style={{ backgroundColor: config.dressCode.colorSugerido }} />
            <span className={cn(getBodyTextClass(config.typography), 'text-gray-600 font-medium')}>Color sugerido</span>
          </div>
        )}
        {config.dressCode.restricciones && (
          <p className={cn(getBodyTextClass(config.typography), 'mt-4 text-gray-500 italic')}>âš  {config.dressCode.restricciones}</p>
        )}
      </TiltCard>
    </Section>
  ), true);

  addSectionEntry('galeria', hasGallery, (
    <Section key="galeria" className={styles.sectionAltBg} typography={config.typography}>
      <h2 className={cn(getSectionTitleClass(config.typography), 'text-center mb-8', styles.fontHeading)} style={{ color: 'var(--inv-primary)' }}>
        Galería
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto">
        {(config.galeriaFotos ?? []).map((url, i) => (
          <motion.div
            key={i}
            onClick={() => setActivePhotoIndex(i)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="aspect-square rounded-xl overflow-hidden shadow-md cursor-pointer relative group"
          >
            {canUseNextImage(url) ? (
              <Image src={url} alt={`Foto ${i + 1}`} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- Invitation media may use an external host outside Next's allowlist.
              <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" decoding="async" />
            )}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Sparkles className="text-white w-6 h-6 animate-pulse" />
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  ), true);

  addSectionEntry('regalos', hasGifts, (
    <Section key="regalos" id="regalos" className="max-w-lg mx-auto" typography={config.typography}>
      <TiltCard className="bg-white p-8 rounded-3xl border border-gray-200 shadow-xl text-center">
        <div className="mb-6">
          {(config.regalos.tipo === 'dinero' || config.regalos.tipo === 'ambos')
            ? <CreditCard className="w-8 h-8 mx-auto mb-4" style={{ color: 'var(--inv-primary)' }} />
            : <Gift className="w-8 h-8 mx-auto mb-4" style={{ color: 'var(--inv-primary)' }} />
          }
          <h2 className={cn(getSectionTitleClass(config.typography), 'font-bold', styles.fontHeading)} style={{ color: 'var(--inv-primary)' }}>
            {config.regalos.tipo === 'dinero' ? 'Datos para Transferencia' : config.regalos.tipo === 'regalos' ? 'Lista de Regalos' : 'Regalos'}
          </h2>
        </div>
        {config.regalos.textoPersonalizado && (
          <p className="text-gray-600 mb-6 text-sm sm:text-base leading-relaxed">{config.regalos.textoPersonalizado}</p>
        )}
        {(config.regalos.tipo === 'dinero' || config.regalos.tipo === 'ambos') && (config.regalos.aliasCBU || config.regalos.cuentaNumero) && (
          <div className="rounded-2xl p-5 shadow-inner border text-left" style={{ borderColor: 'var(--inv-secondary)', backgroundColor: 'var(--inv-secondary)' }}>
            <div className="space-y-3 text-sm">
              {config.regalos.banco && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Banco</span>
                  <span className="font-semibold">{config.regalos.banco}</span>
                </div>
              )}
              {config.regalos.titular && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Titular</span>
                  <span className="font-semibold">{config.regalos.titular}</span>
                </div>
              )}
              {config.regalos.aliasCBU && (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-gray-500 block">Alias / CBU</span>
                    <span className="font-mono font-bold text-base" style={{ color: 'var(--inv-primary)' }}>{config.regalos.aliasCBU}</span>
                  </div>
                  <CopyButton text={config.regalos.aliasCBU} />
                </div>
              )}
              {config.regalos.cuentaNumero && (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-gray-500 block">N° de Cuenta</span>
                    <span className="font-mono font-bold">{config.regalos.cuentaNumero}</span>
                  </div>
                  <CopyButton text={config.regalos.cuentaNumero} />
                </div>
              )}
            </div>
          </div>
        )}
        {(config.regalos.tipo === 'regalos' || config.regalos.tipo === 'ambos') && (
          <div className={cn('mt-6 text-center', config.regalos.tipo === 'ambos' && 'border-t border-gray-100 pt-6')}>
            {config.regalos.instruccionesRegalos && (
              <p className="text-gray-600 text-sm leading-relaxed">{config.regalos.instruccionesRegalos}</p>
            )}
            {config.regalos.linkListaRegalos && (
              <a
                href={config.regalos.linkListaRegalos}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-xl text-white font-semibold shadow-lg transition-transform hover:scale-105"
                style={{ backgroundColor: 'var(--inv-primary)' }}
              >
                <Gift className="w-4 h-4" />
                Ver Lista de Regalos
              </a>
            )}
          </div>
        )}
      </TiltCard>
    </Section>
  ), true);

  addSectionEntry('rsvp', config.rsvpActivo, (
    <Section key="rsvp" className={cn('max-w-lg mx-auto', styles.sectionAltBg)} id="rsvp" typography={config.typography}>
      <Users className="w-8 h-8 mx-auto mb-4" style={{ color: 'var(--inv-primary)' }} />
      <h2 className={cn(getSectionTitleClass(config.typography), 'text-center mb-8', styles.fontHeading)} style={{ color: 'var(--inv-primary)' }}>
        Confirmar Asistencia
      </h2>
      <RsvpSection
        fiestaId={fiestaId}
        texto={config.rsvpTexto}
        typography={config.typography}
        onSuccess={() => {
          setRsvpConfirmed(true);
          setTimeout(() => setRsvpConfirmed(false), 8000);
        }}
      />
    </Section>
  ));

  addSectionEntry('muroSocial', hasSocialPortal, (
    <Section key="muroSocial" className="text-center" typography={config.typography}>
      <Camera className="w-8 h-8 mx-auto mb-4" style={{ color: 'var(--inv-primary)' }} />
      <h2 className={cn(getSectionTitleClass(config.typography), 'mb-4', styles.fontHeading)} style={{ color: 'var(--inv-primary)' }}>
        ¡Compartí tus fotos!
      </h2>
      {config.hashtagEvento && (
        <p className={cn(getBodyTextClass(config.typography), 'font-semibold mb-6')} style={{ color: 'var(--inv-accent)' }}>
          {config.hashtagEvento}
        </p>
      )}
      <a
        href={`/evento/social/${fiestaId}`}
        target="_blank"
        rel="noopener noreferrer"
        className={cn('inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold shadow-lg transition-transform hover:scale-105', getButtonTextClass(config.typography))}
        style={{ backgroundColor: 'var(--inv-primary)' }}
      >
        <Camera className="w-4 h-4" />
        Subir foto al Muro Social
      </a>
    </Section>
  ));

  // ---------- DEFAULT VALUES FOR NEW ULTRA-PREMIUM MODULES ----------
  const defaultFAQItems = [
    { pregunta: '¿Cuál es el código de vestimenta?', respuesta: `El dress code es ${config.dressCode.tipo === 'personalizado' ? (config.dressCode.textoPersonalizado || 'Personalizado') : (config.dressCode.tipo.charAt(0).toUpperCase() + config.dressCode.tipo.slice(1))}. ¡Queremos verte brillar!` },
    { pregunta: '¿A qué hora debemos llegar?', respuesta: `La recepción comienza puntualmente a las ${config.horaEvento || '21:00'} hs. Te sugerimos llegar unos minutos antes.` },
    { pregunta: '¿Cómo confirmo restricciones alimentarias?', respuesta: 'Podés confirmarlas directamente al completar el formulario de RSVP de esta tarjeta digital.' },
    { pregunta: '¿Hay estacionamiento en el salón?', respuesta: 'Sí, el salón cuenta con estacionamiento privado y personal de seguridad.' }
  ];

  const defaultHitos = config.tipoEvento === 'boda' ? [
    { fecha: '2021', titulo: 'El Primer Encuentro', descripcion: 'Una mirada, una sonrisa y el comienzo de una linda amistad.' },
    { fecha: '2023', titulo: 'El Noviazgo', descripcion: 'Comenzamos a escribir juntos nuestra propia historia de aventuras.' },
    { fecha: '2025', titulo: 'La Propuesta', descripcion: 'Bajo las estrellas y con una gran emoción, dijimos que sí para siempre.' }
  ] : [
    { fecha: '2011', titulo: 'El Nacimiento', descripcion: 'Llegué para llenar de luz y alegría el hogar de mi hermosa familia.' },
    { fecha: '2018', titulo: 'Mi Infancia', descripcion: 'Años llenos de risas, juegos de escuela y los primeros grandes amigos.' },
    { fecha: '2026', titulo: 'Mis 15 Años', descripcion: 'El momento tan esperado, celebrando la vida con la gente que más quiero.' }
  ];

  const defaultHospedajes = [
    { nombre: 'Hotel Premium Plaza', direccion: 'Av. Libertador 1234, Centro', linkBooking: 'https://booking.com', telefono: '+54 11 4567 8900' },
    { nombre: 'Grand Palace Hotel', direccion: 'Calle de las Rosas 567, Palermo', linkBooking: 'https://booking.com', telefono: '+54 11 9876 5432' }
  ];

  // SECTION INJECTIONS
  addSectionEntry('historia', true, (
    <Section key="historia" className="text-center" id="historia" typography={config.typography}>
      <Heart className="w-8 h-8 mx-auto mb-4 animate-pulse" style={{ color: 'var(--inv-primary)' }} />
      <h2 className={cn(getSectionTitleClass(config.typography), 'mb-8', styles.fontHeading)} style={{ color: 'var(--inv-primary)' }}>
        Nuestra Historia
      </h2>
      <StoryTimeline hitos={defaultHitos} colorPrincipal="var(--inv-primary)" colorSecundario="var(--inv-secondary)" />
    </Section>
  ));

  addSectionEntry('faq', true, (
    <Section key="faq" className={cn('text-center', styles.sectionAltBg)} id="faq" typography={config.typography}>
      <HelpCircle className="w-8 h-8 mx-auto mb-4" style={{ color: 'var(--inv-primary)' }} />
      <h2 className={cn(getSectionTitleClass(config.typography), 'mb-8', styles.fontHeading)} style={{ color: 'var(--inv-primary)' }}>
        Preguntas Frecuentes
      </h2>
      <FAQAccordion items={defaultFAQItems} colorPrincipal="var(--inv-primary)" />
    </Section>
  ));

  addSectionEntry('logistica', true, (
    <Section key="logistica" className="text-center" id="logistica" typography={config.typography}>
      <Hotel className="w-8 h-8 mx-auto mb-4" style={{ color: 'var(--inv-primary)' }} />
      <h2 className={cn(getSectionTitleClass(config.typography), 'mb-8', styles.fontHeading)} style={{ color: 'var(--inv-primary)' }}>
        Hospedaje Recomendado
      </h2>
      <LogisticaCards hospedajes={defaultHospedajes} colorPrincipal="var(--inv-primary)" colorSecundario="var(--inv-secondary)" />
    </Section>
  ));

  sectionEntries.sort((a, b) => a.order - b.order);
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <>
      <AnimatePresence>
        {!splashDone && !isEditorMode && (
          <SplashScreen
            fiestaId={fiestaId}
            nombreEvento={config.nombreHomenajeada || 'Tu Evento'}
            primaryColor={config.colorPrincipal || '#8b5cf6'}
            tipoCelebracion={config.tipoEvento}
            onComplete={() => setSplashDone(true)}
          />
        )}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: splashDone ? 1 : 0 }}
        transition={{ duration: 0.8 }}
        aria-hidden={!splashDone}
      >
    <div className={cn('min-h-screen', styles.fontBody)} style={cssVars}>
      {/* ============= HERO / PORTADA ============= */}
      <section className="relative flex min-h-[92svh] items-end justify-center overflow-hidden">
        {config.fotoPortada && !heroImageError ? (
          <motion.img
            src={config.fotoPortada}
            alt="Portada de la invitación"
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setHeroImageError(true)}
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 24, ease: 'easeInOut', repeat: Infinity }}
            decoding="async"
          />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${config.colorPrincipal}, ${config.colorSecundario})` }} />
        )}
        <div className={cn('absolute inset-0 bg-gradient-to-t', styles.heroOverlay)} />

        <div className="relative z-10 text-center text-white pb-16 sm:pb-24 px-4 sm:px-6 w-full max-w-full">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <p className="text-sm sm:text-base tracking-[0.3em] uppercase mb-4 opacity-80">{tipoLabel}</p>
            <h1
              className={cn(getHeroTitleClass(config.typography), config.typography?.lineHeight || 'leading-tight', 'mb-6 break-words max-w-full px-4', styles.fontHeading)}
              style={{ overflowWrap: 'anywhere' }}
            >
              {isEditorMode && onConfigChange ? (
                <>
                  <EditableText
                    value={config.nombreHomenajeada || ''}
                    onChange={(value) => onConfigChange({ ...config, nombreHomenajeada: value })}
                  />
                  {isBoda && secondName && (
                    <>
                      <span className="block text-2xl sm:text-4xl lg:text-5xl my-2 sm:my-3 italic opacity-80">&</span>
                      <span className="block">{secondName}</span>
                    </>
                  )}
                </>
              ) : (
                <>
                  {config.nombreHomenajeada || 'Tu Nombre'}
                  {isBoda && secondName && (
                    <>
                      <span className="block text-2xl sm:text-4xl lg:text-5xl my-2 sm:my-3 italic opacity-80">&</span>
                      <span className="block">{secondName}</span>
                    </>
                  )}
                </>
              )}
            </h1>
            {config.fechaEvento && (
              <p className="text-base sm:text-xl opacity-90 capitalize">
                {formatDate(config.fechaEvento)}
                {config.horaEvento && ` · ${config.horaEvento} hs`}
              </p>
            )}
            {calendarUrl && (
              <a
                href={calendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/95 px-5 py-2.5 text-sm font-bold text-slate-900 shadow-xl transition-transform hover:scale-105"
              >
                <Calendar className="h-4 w-4" />
                Agendar fecha
              </a>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-10"
          >
            <button onClick={() => document.getElementById('bienvenida')?.scrollIntoView({ behavior: 'smooth' })} className="animate-bounce">
              <ChevronDown className="w-8 h-8 text-white/70" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ============= ORDERED MIDDLE SECTIONS ============= */}
      {sectionEntries.map(({ id, el }) => (
        <React.Fragment key={id}>{el}</React.Fragment>
      ))}

      {/* ============= AK PRODUCCIONES CTA ============= */}
      {config.ctaAkActivo && (
        <Section className="text-center bg-gradient-to-br from-purple-900 to-indigo-900 text-white" id="ctaAk">
          <div className="space-y-4 max-w-md mx-auto">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-purple-300">âœ¨ AK Producciones Eventos</p>
            <h2 className={cn('text-2xl sm:text-3xl font-bold', styles.fontHeading)}>
              {config.ctaAkTitulo || '¿Te gustó esta experiencia?'}
            </h2>
            <p className="text-sm sm:text-base text-white/80">
              {config.ctaAkTexto || 'Esto es parte del servicio integral de AK Producciones Eventos. Organizamos tu próximo evento con la misma dedicación y elegancia.'}
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              {config.ctaAkLandingUrl && (
                <a
                  href={config.ctaAkLandingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-purple-900 font-bold text-sm hover:bg-white/90 transition-colors shadow-lg"
                >
                  Ver servicios
                </a>
              )}
              {config.ctaAkWhatsapp && (
                <a
                  href={`https://wa.me/${config.ctaAkWhatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-500 text-white font-bold text-sm hover:bg-green-400 transition-colors shadow-lg"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              )}
            </div>
          </div>
        </Section>
      )}

      {/* ============= FOOTER ============= */}
      <footer className="py-12 text-center" style={{ backgroundColor: 'var(--inv-primary)', color: 'white' }}>
        <Heart className="w-6 h-6 mx-auto mb-3 opacity-80" />
        <p className={cn('text-xl sm:text-2xl mb-2', styles.fontHeading)}>
          ¡Te esperamos!
        </p>
        <p className="text-sm opacity-70">
          {config.nombreHomenajeada}
          {isBoda && secondName && ` & ${secondName}`}
          {config.fechaEvento && ` · ${formatDate(config.fechaEvento)}`}
        </p>
        {(() => {
          const displayedSocials = (socialConnections ?? []).filter(c => c.isConnected && c.platform !== 'WhatsApp');
          if (displayedSocials.length === 0) return null;
          return (
            <div className="flex justify-center gap-4 mt-6">
              {displayedSocials.map(c => (
                <a
                  key={c.platform}
                  href={c.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors"
                  aria-label={c.platform}
                >
                  {c.platform === 'Instagram' && <Instagram className="w-5 h-5" />}
                  {c.platform === 'Facebook' && <Facebook className="w-5 h-5" />}
                  {c.platform === 'TikTok' && <span className="text-xs font-bold">TK</span>}
                </a>
              ))}
            </div>
          );
        })()}
      </footer>

      {/* ============= WHATSAPP FLOATING BUTTON ============= */}
      {hasWhatsApp && (
        <a
          href={`https://wa.me/${config.whatsappNumero?.replace(/\D/g, '')}${config.whatsappMensaje ? `?text=${encodeURIComponent(config.whatsappMensaje)}` : ''}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-green-500 text-white flex items-center justify-center shadow-2xl transition-transform hover:scale-110"
          aria-label="Contactar por WhatsApp"
        >
          <MessageCircle className="w-7 h-7" />
        </a>
      )}

      {/* ============= BACKGROUND MUSIC PLAYER ============= */}
      <BackgroundMusicPlayer src={config.musicaFondoUrl} splashDone={splashDone} />

      {/* ============= XV ULTRA-LUXURY THEME EFFECTS ============= */}
      <XVThemeEffects plantillaId={config.plantillaId} />

      {/* ============= RSVP SUCCESS CONFETTI ============= */}
      {rsvpConfirmed && <Confetti />}

      {/* ============= IMAGE LIGHTBOX GALLERY ============= */}
      <AnimatePresence>
        {activePhotoIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[99999] flex flex-col items-center justify-center p-4 select-none"
            onClick={() => setActivePhotoIndex(null)}
          >
            {/* Close Button */}
            <button
              onClick={() => setActivePhotoIndex(null)}
              className="absolute top-6 right-6 text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all hover:scale-105 active:scale-95"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation Left */}
            {activePhotoIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePhotoIndex(activePhotoIndex - 1);
                }}
                className="absolute left-4 sm:left-8 text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all hover:scale-105 active:scale-95"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Navigation Right */}
            {activePhotoIndex < config.galeriaFotos.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePhotoIndex(activePhotoIndex + 1);
                }}
                className="absolute right-4 sm:right-8 text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all hover:scale-105 active:scale-95"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Image Wrapper */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="relative max-w-full max-h-[85vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- The lightbox preserves the guest image's original dimensions. */}
              <img
                src={config.galeriaFotos[activePhotoIndex]}
                alt={`Imagen ${activePhotoIndex + 1}`}
                className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl border border-white/10"
              />
              <div className="absolute -bottom-9 left-0 right-0 text-center text-white/60 text-xs sm:text-sm font-bold tracking-widest uppercase">
                {activePhotoIndex + 1} de {config.galeriaFotos.length}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
      </motion.div>
    </>
  );
}
