'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { InvitacionDigitalConfig, InvitacionDigitalCronograma } from '@/types/fiesta';
import type { SocialConnection } from '@/types/settings';
import { TIPO_EVENTO_LABELS } from '@/lib/invitacion-config-defaults';
import { submitPublicRsvp } from '@/app/actions/fiesta/invitados.actions';
import { motion } from 'framer-motion';
import { MapPin, Clock, Gift, CreditCard, Copy, Check, Calendar, Heart, Users, ChevronDown, MessageCircle, Camera, Shirt, Loader2, Instagram, Facebook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Props {
  config: InvitacionDigitalConfig;
  fiestaId: string;
  socialConnections?: SocialConnection[];
  isEditorMode?: boolean;
  onConfigChange?: (nextConfig: InvitacionDigitalConfig) => void;
}

// ---------- COUNTDOWN ----------
function Countdown({ fechaEvento }: { fechaEvento: string }) {
  const [timeLeft, setTimeLeft] = useState({ dias: 0, horas: 0, minutos: 0, segundos: 0 });

  useEffect(() => {
    const target = new Date(fechaEvento).getTime();
    const update = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        dias: Math.floor(diff / (1000 * 60 * 60 * 24)),
        horas: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutos: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        segundos: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
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

// ---------- RSVP FORM ----------
function RsvpSection({ fiestaId, texto }: { fiestaId: string; texto?: string }) {
  const [nombre, setNombre] = useState('');
  const [personas, setPersonas] = useState('1');
  const [mensaje, setMensaje] = useState('');
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setIsSubmitting(true);
    setError('');
    try {
      const result = await submitPublicRsvp(fiestaId, {
        nombre: nombre.trim(),
        asistencia: 'Confirmado',
        dietaryRestriction: 'Ninguna',
        cancionesDJ: [],
      });
      if (result.success) {
        setSent(true);
      } else {
        setError(result.error || 'No se pudo confirmar. Intentá de nuevo.');
      }
    } catch {
      setError('Error de conexión. Intentá de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--inv-secondary)' }}>
          <Check className="w-8 h-8" style={{ color: 'var(--inv-primary)' }} />
        </div>
        <h3 className="text-xl font-semibold">¡Confirmado!</h3>
        <p className="text-gray-500">Gracias por confirmar tu asistencia, {nombre}.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      {texto && <p className="text-center text-gray-600 mb-6">{texto}</p>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tu nombre</label>
        <Input value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="Nombre completo" className="rounded-xl border-gray-200" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">¿Cuántas personas?</label>
        <Input type="number" min="1" max="10" value={personas} onChange={e => setPersonas(e.target.value)} className="rounded-xl border-gray-200" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje (opcional)</label>
        <textarea
          value={mensaje}
          onChange={e => setMensaje(e.target.value)}
          className="w-full rounded-xl border border-gray-200 p-3 text-sm resize-none focus:outline-none focus:ring-2"
          style={{ '--tw-ring-color': 'var(--inv-primary)' } as React.CSSProperties}
          rows={3}
          placeholder="Deja un mensaje para los anfitriones..."
        />
      </div>
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl h-12 text-base font-semibold text-white shadow-lg"
        style={{ backgroundColor: 'var(--inv-primary)' }}
      >
        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Asistencia'}
      </Button>
    </form>
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
const Section: React.FC<{ children: React.ReactNode; className?: string; id?: string }> = ({ children, className, id }) => (
  <motion.section
    id={id}
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-50px' }}
    transition={{ duration: 0.6, ease: 'easeOut' }}
    className={cn('px-4 sm:px-8 py-8 sm:py-16', className)}
  >
    {children}
  </motion.section>
);

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
    case 'EleganteDorado':
      return {
        fontHeading: 'font-serif',
        fontBody: 'font-sans',
        heroOverlay: 'from-black/60 via-black/30 to-transparent',
        sectionAltBg: 'bg-gradient-to-b from-amber-50/50 to-white',
        borderStyle: 'border-amber-200',
        badgeClass: 'bg-amber-100 text-amber-800',
      };
    case 'ModernoMinimalista':
      return {
        fontHeading: 'font-sans',
        fontBody: 'font-sans',
        heroOverlay: 'from-black/50 to-transparent',
        sectionAltBg: 'bg-gray-50',
        borderStyle: 'border-gray-200',
        badgeClass: 'bg-gray-100 text-gray-700',
      };
    case 'RomanticoFloral':
      return {
        fontHeading: 'font-serif italic',
        fontBody: 'font-sans',
        heroOverlay: 'from-pink-900/50 via-rose-800/30 to-transparent',
        sectionAltBg: 'bg-gradient-to-b from-rose-50/50 to-white',
        borderStyle: 'border-pink-200',
        badgeClass: 'bg-pink-100 text-pink-800',
      };
    case 'FiestaVibrante':
      return {
        fontHeading: 'font-sans font-black',
        fontBody: 'font-sans',
        heroOverlay: 'from-purple-900/60 via-indigo-800/30 to-transparent',
        sectionAltBg: 'bg-gradient-to-br from-indigo-50/50 to-purple-50/50',
        borderStyle: 'border-purple-200',
        badgeClass: 'bg-purple-100 text-purple-800',
      };
    default:
      return {
        fontHeading: 'font-serif',
        fontBody: 'font-sans',
        heroOverlay: 'from-black/60 via-black/30 to-transparent',
        sectionAltBg: 'bg-gray-50',
        borderStyle: 'border-gray-200',
        badgeClass: 'bg-gray-100 text-gray-700',
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
    setDraft(value);
  }, [value]);

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
        className={cn('bg-white/20 text-white text-center outline-none border-b-2 border-white rounded px-1', className)}
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

  useEffect(() => {
    setHeroImageError(false);
  }, [config.fotoPortada]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Fecha por confirmar';
      return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return 'Fecha por confirmar'; }
  };

  const hasLocation = !!(config.nombreSalon || config.direccionSalon || config.linkMaps);
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

  return (
    <div className={cn('min-h-screen', styles.fontBody)} style={cssVars}>
      {/* ============= HERO / PORTADA ============= */}
      <section className="relative min-h-screen flex items-end justify-center overflow-hidden">
        {config.fotoPortada && !heroImageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={config.fotoPortada}
            alt="Portada de la invitación"
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setHeroImageError(true)}
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
            <h1 className={cn('text-4xl sm:text-6xl lg:text-8xl mb-6 leading-tight break-words max-w-full px-4', styles.fontHeading)}>
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

      {/* ============= BIENVENIDA ============= */}
      {config.textoBienvenida && (
        <Section id="bienvenida" className="text-center max-w-2xl mx-auto">
          <div className="w-16 h-px mx-auto mb-8" style={{ backgroundColor: 'var(--inv-primary)' }} />
          {isEditorMode && onConfigChange ? (
            <EditableText
              value={config.textoBienvenida || ''}
              onChange={(value) => onConfigChange({ ...config, textoBienvenida: value })}
              className="text-lg sm:text-xl text-gray-600 leading-relaxed border-gray-400 text-gray-700"
            />
          ) : (
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">{config.textoBienvenida}</p>
          )}
          <div className="w-16 h-px mx-auto mt-8" style={{ backgroundColor: 'var(--inv-primary)' }} />
        </Section>
      )}

      {/* ============= COUNTDOWN ============= */}
      {config.contadorActivo && config.fechaEvento && (
        <Section className={cn('text-center', styles.sectionAltBg)}>
          <h2 className={cn('text-2xl sm:text-3xl mb-8', styles.fontHeading)} style={{ color: 'var(--inv-primary)' }}>
            Faltan...
          </h2>
          <Countdown fechaEvento={config.fechaEvento} />
        </Section>
      )}

      {/* ============= CRONOGRAMA ============= */}
      {hasCronograma && (
        <Section className="max-w-lg mx-auto">
          <h2 className={cn('text-2xl sm:text-3xl text-center mb-10', styles.fontHeading)} style={{ color: 'var(--inv-primary)' }}>
            Cronograma
          </h2>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5" style={{ backgroundColor: 'var(--inv-secondary)' }} />
            {(config.cronograma as InvitacionDigitalCronograma[]).map((item, i) => (
              <div key={i} className="relative pl-12 pb-8 last:pb-0">
                <div className="absolute left-1.5 top-1 w-5 h-5 rounded-full border-2 bg-white" style={{ borderColor: 'var(--inv-primary)' }} />
                <div className="flex items-baseline gap-3">
                  <span className="text-sm font-bold whitespace-nowrap" style={{ color: 'var(--inv-primary)' }}>{item.hora}</span>
                  <span className="text-gray-700">
                    {item.icono ? `${item.icono} ` : ''}
                    {item.actividad}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ============= UBICACIÓN ============= */}
      {hasLocation && (
        <Section className={cn('text-center', styles.sectionAltBg)}>
          <MapPin className="w-8 h-8 mx-auto mb-4" style={{ color: 'var(--inv-primary)' }} />
          <h2 className={cn('text-2xl sm:text-3xl mb-2', styles.fontHeading)} style={{ color: 'var(--inv-primary)' }}>
            {config.nombreSalon || 'Ubicación'}
          </h2>
          {config.direccionSalon && (
            <p className="text-gray-600 mb-6">{config.direccionSalon}</p>
          )}
          {config.linkMaps && (
            <a
              href={config.linkMaps}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold shadow-lg transition-transform hover:scale-105"
              style={{ backgroundColor: 'var(--inv-primary)' }}
            >
              <MapPin className="w-4 h-4" />
              Cómo llegar
            </a>
          )}
        </Section>
      )}

      {/* ============= DRESS CODE ============= */}
      {hasDressCode && (
        <Section className="text-center max-w-lg mx-auto">
          <Shirt className="w-8 h-8 mx-auto mb-4" style={{ color: 'var(--inv-primary)' }} />
          <h2 className={cn('text-2xl sm:text-3xl mb-4', styles.fontHeading)} style={{ color: 'var(--inv-primary)' }}>
            Dress Code
          </h2>
          <span className={cn('inline-block px-4 py-1.5 rounded-full text-sm font-semibold', styles.badgeClass)}>
            {config.dressCode.tipo === 'personalizado'
              ? (config.dressCode.textoPersonalizado || 'Personalizado')
              : config.dressCode.tipo.charAt(0).toUpperCase() + config.dressCode.tipo.slice(1)}
          </span>
          {config.dressCode.colorSugerido && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-gray-200 shadow-inner" style={{ backgroundColor: config.dressCode.colorSugerido }} />
              <span className="text-sm text-gray-600">Color sugerido</span>
            </div>
          )}
          {config.dressCode.restricciones && (
            <p className="mt-4 text-sm text-gray-500 italic">⚠ {config.dressCode.restricciones}</p>
          )}
        </Section>
      )}

      {/* ============= GALERÍA ============= */}
      {hasGallery && (
        <Section className={styles.sectionAltBg}>
          <h2 className={cn('text-2xl sm:text-3xl text-center mb-8', styles.fontHeading)} style={{ color: 'var(--inv-primary)' }}>
            Galería
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 max-w-3xl mx-auto">
            {config.galeriaFotos.map((url, i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ============= REGALOS / DINERO ============= */}
      {hasGifts && (
        <Section className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            {(config.regalos.tipo === 'dinero' || config.regalos.tipo === 'ambos')
              ? <CreditCard className="w-8 h-8 mx-auto mb-4" style={{ color: 'var(--inv-primary)' }} />
              : <Gift className="w-8 h-8 mx-auto mb-4" style={{ color: 'var(--inv-primary)' }} />
            }
            <h2 className={cn('text-2xl sm:text-3xl', styles.fontHeading)} style={{ color: 'var(--inv-primary)' }}>
              {config.regalos.tipo === 'dinero' ? 'Datos para Transferencia' : config.regalos.tipo === 'regalos' ? 'Lista de Regalos' : 'Regalos'}
            </h2>
          </div>

          {config.regalos.textoPersonalizado && (
            <p className="text-center text-gray-600 mb-6">{config.regalos.textoPersonalizado}</p>
          )}

          {/* Bank card for money/both */}
          {(config.regalos.tipo === 'dinero' || config.regalos.tipo === 'ambos') && (config.regalos.aliasCBU || config.regalos.cuentaNumero) && (
            <div className="rounded-2xl p-6 shadow-lg border" style={{ borderColor: 'var(--inv-secondary)', backgroundColor: 'var(--inv-secondary)' }}>
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

          {/* Gift instructions for regalos/both */}
          {(config.regalos.tipo === 'regalos' || config.regalos.tipo === 'ambos') && (
            <div className={cn('mt-6 text-center', config.regalos.tipo === 'ambos' && 'border-t pt-6')}>
              {config.regalos.instruccionesRegalos && (
                <p className="text-gray-600">{config.regalos.instruccionesRegalos}</p>
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
        </Section>
      )}

      {/* ============= RSVP ============= */}
      {config.rsvpActivo && (
        <Section className={cn('max-w-lg mx-auto', styles.sectionAltBg)} id="rsvp">
          <Users className="w-8 h-8 mx-auto mb-4" style={{ color: 'var(--inv-primary)' }} />
          <h2 className={cn('text-2xl sm:text-3xl text-center mb-8', styles.fontHeading)} style={{ color: 'var(--inv-primary)' }}>
            Confirmar Asistencia
          </h2>
          <RsvpSection fiestaId={fiestaId} texto={config.rsvpTexto} />
        </Section>
      )}

      {/* ============= PORTAL SOCIAL ============= */}
      {hasSocialPortal && (
        <Section className="text-center">
          <Camera className="w-8 h-8 mx-auto mb-4" style={{ color: 'var(--inv-primary)' }} />
          <h2 className={cn('text-2xl sm:text-3xl mb-4', styles.fontHeading)} style={{ color: 'var(--inv-primary)' }}>
            ¡Compartí tus fotos!
          </h2>
          {config.hashtagEvento && (
            <p className="text-lg font-semibold mb-6" style={{ color: 'var(--inv-accent)' }}>
              {config.hashtagEvento}
            </p>
          )}
          <a
            href={`/evento/muro-en-vivo/${fiestaId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold shadow-lg transition-transform hover:scale-105"
            style={{ backgroundColor: 'var(--inv-primary)' }}
          >
            <Camera className="w-4 h-4" />
            Ir al Mural Social
          </a>
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
          const displayedSocials = socialConnections.filter(c => c.isConnected && c.platform !== 'WhatsApp');
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
    </div>
  );
}
