'use client';

import { Suspense, useEffect, useState, useCallback, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, AlertTriangle, CheckCircle, Music, Utensils, Users, Download, MapPin, CalendarDays, Instagram, MessageCircle, ExternalLink } from 'lucide-react';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { submitPublicRsvp } from '@/app/actions/fiesta/invitados.actions';
import type { FiestaEnPlanificacion, DietaryRestriction, Invitado } from '@/types/fiesta';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { motion } from 'framer-motion';
import QRCodeStylized from 'qrcode.react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const DIETARY_OPTIONS: { value: DietaryRestriction; label: string; emoji: string }[] = [
  { value: 'Ninguna', label: 'Sin restricciones', emoji: '🍽️' },
  { value: 'Celiaco', label: 'Celíaco / Sin gluten', emoji: '🌾' },
  { value: 'Vegetariano', label: 'Vegetariano', emoji: '🥗' },
  { value: 'Vegano', label: 'Vegano', emoji: '🌱' },
  { value: 'Otro', label: 'Otra restricción', emoji: '⚠️' },
];

function RsvpFormContent() {
  const params = useParams();
  const fiestaId = params.fiestaId as string;
  const { toast } = useToast();

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedGuest, setConfirmedGuest] = useState<Invitado | null>(null);

  // Form state
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [asistencia, setAsistencia] = useState<'Confirmado' | 'Rechazado'>('Confirmado');
  const [partySize, setPartySize] = useState(1);
  const [companionNames, setCompanionNames] = useState<string[]>([]);
  const [dietary, setDietary] = useState<DietaryRestriction>('Ninguna');
  const [alergiasEspecificas, setAlergiasEspecificas] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [requiereAccesibilidad, setRequiereAccesibilidad] = useState(false);
  const [songs, setSongs] = useState(['', '', '']);

  const loadFiesta = useCallback(async () => {
    if (!fiestaId) {
      setError('No se especificó un ID de evento.');
      setIsLoading(false);
      return;
    }
    try {
      const data = await getFiestaById(fiestaId);
      if (!data) throw new Error('Evento no encontrado.');
      setFiesta(data);
    } catch (e: any) {
      setError(e.message || 'No se pudo cargar el evento.');
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId]);

  useEffect(() => {
    loadFiesta();
  }, [loadFiesta]);

  const handleSongChange = (index: number, value: string) => {
    setSongs(prev => prev.map((s, i) => (i === index ? value : s)));
  };

  const handleCompanionChange = (index: number, value: string) => {
    setCompanionNames(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast({ title: 'Falta tu nombre', description: 'Por favor ingresa tu nombre completo.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await submitPublicRsvp(fiestaId, {
        nombre: nombre.trim(),
        contacto: contacto.trim() || undefined,
        asistencia,
        partySize: partySize > 1 ? partySize : undefined,
        companionNames: companionNames.filter(n => n.trim()).length > 0 ? companionNames.filter(n => n.trim()) : undefined,
        dietaryRestriction: dietary,
        alergiasEspecificas: alergiasEspecificas.trim() || undefined,
        cancionesDJ: songs.filter(s => s.trim()),
        mensaje: mensaje.trim() || undefined,
        requiereAccesibilidad: requiereAccesibilidad || undefined,
      });
      if (result.success && result.invitado) {
        setConfirmedGuest(result.invitado);
      } else {
        throw new Error(result.error || 'No se pudo enviar la confirmación.');
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadQR = () => {
    const canvas = document.getElementById('qr-rsvp-guest') as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `QR-Entrada-${confirmedGuest?.nombre}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="mt-4 text-slate-500 font-medium">Cargando tu invitación…</p>
      </div>
    );
  }

  if (error || !fiesta) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <p className="text-xl font-semibold">{error || 'Evento no encontrado.'}</p>
      </div>
    );
  }

  const eventName = fiesta.configuracion?.nombreEvento || 'El Evento';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');

  if (confirmedGuest) {
    const qrValue = `${baseUrl}/evento/accesos/${fiestaId}?fiestaId=${fiestaId}&guestId=${confirmedGuest.id}`;
    const guestExp = fiesta.guestExperienceSettings;
    const showAkCta = guestExp?.enabled && guestExp?.showAkBranding;
    const eventName = fiesta.configuracion?.nombreEvento || 'El Evento';
    const venue = fiesta.configuracion?.nombreLugar;
    const address = fiesta.configuracion?.direccionLugar;
    const fecha = fiesta.configuracion?.fechaEvento
      ? new Date(fiesta.configuracion.fechaEvento).toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      : null;
    const hora = fiesta.configuracion?.horaInicio;
    const dressCode = fiesta.invitacionConfig?.dressCode;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring', damping: 15 }}
          className="w-full max-w-sm"
        >
          <Card className="rounded-[2rem] border-none shadow-2xl overflow-hidden">
            <CardHeader className="text-center pt-10 pb-4">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 10, delay: 0.2 }}>
                <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-4" />
              </motion.div>
              {confirmedGuest.rsvp === 'Confirmado' ? (
                <>
                  <CardTitle className="text-3xl font-bold">¡Confirmado!</CardTitle>
                  <CardDescription className="text-base mt-2">
                    ¡Te esperamos, <strong>{confirmedGuest.nombre}</strong>!
                  </CardDescription>
                </>
              ) : (
                <>
                  <CardTitle className="text-3xl font-bold">Gracias por avisar</CardTitle>
                  <CardDescription className="text-base mt-2">
                    Hemos registrado que no podrás asistir, <strong>{confirmedGuest.nombre}</strong>. ¡Te extrañaremos!
                  </CardDescription>
                </>
              )}
            </CardHeader>
            {confirmedGuest.rsvp === 'Confirmado' && (
              <CardContent className="flex flex-col items-center gap-4 px-8 py-4">
                <p className="text-sm text-slate-500 text-center">
                  Guarda tu pase digital. Lo necesitarás en la entrada.
                </p>
                <div className="p-6 bg-white rounded-2xl shadow-inner border border-slate-100" data-testid="guest-qr-container">
                  <QRCodeStylized id="qr-rsvp-guest" value={qrValue} size={180} level="H" />
                </div>

                {/* Event details for guest */}
                <div className="w-full space-y-2 text-sm">
                  {confirmedGuest.tableNumber && (
                    <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-xl p-3" data-testid="guest-table-info">
                      <span className="text-lg">🪑</span>
                      <div>
                        <p className="font-black text-purple-800">Mesa asignada</p>
                        <p className="text-purple-600 font-semibold">Mesa {confirmedGuest.tableNumber}</p>
                      </div>
                    </div>
                  )}
                  {(venue || address) && (
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <MapPin className="w-5 h-5 text-slate-500 shrink-0" />
                      <div>
                        {venue && <p className="font-semibold text-slate-800">{venue}</p>}
                        {address && <p className="text-xs text-slate-500">{address}</p>}
                      </div>
                    </div>
                  )}
                  {(fecha || hora) && (
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <CalendarDays className="w-5 h-5 text-slate-500 shrink-0" />
                      <div>
                        {fecha && <p className="font-semibold text-slate-800 capitalize">{fecha}</p>}
                        {hora && <p className="text-xs text-slate-500">{hora} hs</p>}
                      </div>
                    </div>
                  )}
                  {dressCode && dressCode.tipo && dressCode.tipo !== 'casual' && (
                    <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-xl p-3">
                      <span className="text-lg shrink-0">👗</span>
                      <div>
                        <p className="font-semibold text-rose-800 capitalize">
                          Dress code: {dressCode.tipo === 'personalizado' ? dressCode.textoPersonalizado : dressCode.tipo}
                        </p>
                        {dressCode.colorSugerido && (
                          <p className="text-xs text-rose-600">Color sugerido: {dressCode.colorSugerido}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {confirmedGuest.dietaryRestriction && confirmedGuest.dietaryRestriction !== 'Ninguna' && (
                    <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                      <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-1">Menú especial</p>
                      <p className="text-sm font-semibold text-amber-800">{confirmedGuest.dietaryRestriction}</p>
                    </div>
                  )}
                  {guestExp?.showSocialCta && (
                    <a
                      href={`/evento/social/${fiestaId}`}
                      className="flex items-center justify-between w-full bg-indigo-50 border border-indigo-100 rounded-xl p-3 hover:bg-indigo-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📸</span>
                        <p className="text-sm font-semibold text-indigo-800">Muro social del evento</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-indigo-500 shrink-0" />
                    </a>
                  )}
                </div>
              </CardContent>
            )}
            <CardFooter className="flex-col gap-3 pb-8 px-8">
              {confirmedGuest.rsvp === 'Confirmado' && (
                <>
                  <Button onClick={downloadQR} className="w-full rounded-xl" variant="outline">
                    <Download className="w-4 h-4 mr-2" /> Descargar QR
                  </Button>
                  <a
                    href={`/invitacion/${fiestaId}/invitado/${confirmedGuest.id}`}
                    className="block w-full text-center py-3 px-4 rounded-xl bg-purple-50 border border-purple-100 text-purple-700 text-sm font-semibold hover:bg-purple-100 transition-colors"
                    data-testid="guest-portal-link"
                  >
                    🔖 Ver mi pase completo →
                  </a>
                </>
              )}
              <p className="text-xs text-center text-slate-400">{eventName}</p>
            </CardFooter>
          </Card>

          {/* AK Producciones Marketing CTA */}
          {showAkCta && (
            <motion.div
              data-testid="ak-producciones-cta"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-4 rounded-[1.5rem] border border-purple-100 bg-white shadow-lg overflow-hidden"
            >
              <div className="px-6 py-5 text-center space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-purple-500">
                  ✨ AK Producciones Eventos
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  {guestExp?.ctaTitle || '¿Te gustó esta experiencia?'}
                </p>
                <p className="text-xs text-slate-500">
                  {guestExp?.ctaText || 'Esto es parte del servicio integral de AK Producciones Eventos. Organizamos tu próximo evento con la misma dedicación.'}
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap pt-1">
                  {guestExp?.instagramUrl && (
                    <a
                      href={guestExp.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold hover:opacity-90 transition-opacity"
                    >
                      <Instagram className="w-3.5 h-3.5" /> Instagram
                    </a>
                  )}
                  {(guestExp?.whatsappUrl || guestExp?.whatsappNumber) && (
                    <a
                      href={guestExp.whatsappUrl ?? `https://wa.me/${(guestExp.whatsappNumber ?? '').replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500 text-white text-xs font-bold hover:opacity-90 transition-opacity"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                  )}
                  {guestExp?.landingUrl && guestExp?.showLandingCta && (
                    <a
                      href={guestExp.landingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:opacity-90 transition-opacity"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Ver servicios
                    </a>
                  )}
                  {guestExp?.simulatorUrl && guestExp?.showBudgetSimulatorCta && (
                    <a
                      href={guestExp.simulatorUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:opacity-90 transition-opacity"
                    >
                      💰 Simular presupuesto
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-2">Confirmación de asistencia</p>
          <h1 className="text-3xl font-bold text-slate-900">{eventName}</h1>
        </div>

        <Card className="rounded-[2rem] border-none shadow-2xl overflow-hidden">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-8 pt-8 px-6 pb-4">

              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="nombre" className="flex items-center gap-2 font-semibold text-slate-700">
                  <Users className="w-4 h-4 text-primary" /> Tu nombre completo
                </Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej: María García"
                  className="h-12 rounded-xl text-base"
                  required
                />
              </div>

              {/* Contacto / Teléfono */}
              <div className="space-y-2">
                <Label htmlFor="contacto" className="flex items-center gap-2 font-semibold text-slate-700">
                  📞 Teléfono de contacto <span className="text-xs font-normal text-slate-400">(opcional)</span>
                </Label>
                <Input
                  id="contacto"
                  value={contacto}
                  onChange={e => setContacto(e.target.value)}
                  placeholder="Ej: 099 123 456"
                  className="h-12 rounded-xl text-base"
                  type="tel"
                />
              </div>

              {/* Asistencia */}
              <div className="space-y-3">
                <Label className="font-semibold text-slate-700">¿Vas a asistir?</Label>
                <div className="grid grid-cols-2 gap-3">
                  {(['Confirmado', 'Rechazado'] as const).map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAsistencia(opt)}
                      className={cn(
                        'h-14 rounded-xl border-2 font-bold text-sm transition-all',
                        asistencia === opt
                          ? opt === 'Confirmado'
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-red-400 bg-red-50 text-red-700'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                      )}
                    >
                      {opt === 'Confirmado' ? '✅ Sí, voy!' : '❌ No puedo ir'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dieta */}
              {asistencia === 'Confirmado' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3"
                >
                  <Label className="flex items-center gap-2 font-semibold text-slate-700">
                    <Utensils className="w-4 h-4 text-primary" /> Restricción alimentaria
                  </Label>
                  <RadioGroup value={dietary} onValueChange={v => setDietary(v as DietaryRestriction)} className="grid grid-cols-1 gap-2">
                    {DIETARY_OPTIONS.map(opt => (
                      <label
                        key={opt.value}
                        htmlFor={`diet-${opt.value}`}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
                          dietary === opt.value
                            ? 'border-primary bg-primary/5'
                            : 'border-slate-200 hover:border-slate-300'
                        )}
                      >
                        <RadioGroupItem id={`diet-${opt.value}`} value={opt.value} className="sr-only" />
                        <span className="text-xl">{opt.emoji}</span>
                        <span className={cn('text-sm font-medium', dietary === opt.value ? 'text-primary' : 'text-slate-600')}>
                          {opt.label}
                        </span>
                      </label>
                    ))}
                  </RadioGroup>
                  {dietary === 'Otro' && (
                    <Input
                      value={alergiasEspecificas}
                      onChange={e => setAlergiasEspecificas(e.target.value)}
                      placeholder="Describí tu restricción o alergia específica"
                      className="h-11 rounded-xl text-sm mt-2"
                    />
                  )}
                  {dietary !== 'Ninguna' && dietary !== 'Otro' && (
                    <Input
                      value={alergiasEspecificas}
                      onChange={e => setAlergiasEspecificas(e.target.value)}
                      placeholder="¿Alguna alergia específica? (opcional)"
                      className="h-11 rounded-xl text-sm mt-2"
                    />
                  )}
                </motion.div>
              )}

              {/* Cantidad de personas y acompañantes */}
              {asistencia === 'Confirmado' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3"
                >
                  <Label className="flex items-center gap-2 font-semibold text-slate-700">
                    <Users className="w-4 h-4 text-primary" /> ¿Cuántos van? (incluyéndote)
                  </Label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPartySize(p => Math.max(1, p - 1))}
                      className="w-12 h-12 rounded-xl border-2 border-slate-200 font-bold text-lg hover:border-primary transition-colors"
                    >−</button>
                    <span className="flex-1 text-center text-2xl font-black text-slate-800">{partySize}</span>
                    <button
                      type="button"
                      onClick={() => setPartySize(p => p + 1)}
                      className="w-12 h-12 rounded-xl border-2 border-slate-200 font-bold text-lg hover:border-primary transition-colors"
                    >+</button>
                  </div>
                  {partySize > 1 && (
                    <div className="space-y-2 pt-1">
                      <p className="text-xs text-slate-400">Nombres de acompañantes (opcional)</p>
                      {Array.from({ length: partySize - 1 }).map((_, i) => (
                        <Input
                          key={i}
                          value={companionNames[i] ?? ''}
                          onChange={e => handleCompanionChange(i, e.target.value)}
                          placeholder={`Acompañante ${i + 1}`}
                          className="h-11 rounded-xl text-sm"
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Canciones DJ */}
              {asistencia === 'Confirmado' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3"
                >
                  <Label className="flex items-center gap-2 font-semibold text-slate-700">
                    <Music className="w-4 h-4 text-primary" /> Sugiere 3 canciones para el DJ
                  </Label>
                  <p className="text-xs text-slate-400">Opcional. ¡Asegúrate de que suenen tus favoritas!</p>
                  {songs.map((song, i) => (
                    <Input
                      key={i}
                      value={song}
                      onChange={e => handleSongChange(i, e.target.value)}
                      placeholder={`Canción ${i + 1} – Artista`}
                      className="h-11 rounded-xl text-sm"
                    />
                  ))}
                </motion.div>
              )}

              {/* Mensaje / dedicatoria */}
              {asistencia === 'Confirmado' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2"
                >
                  <Label htmlFor="mensaje" className="flex items-center gap-2 font-semibold text-slate-700">
                    💌 Dedicatoria o mensaje <span className="text-xs font-normal text-slate-400">(opcional)</span>
                  </Label>
                  <textarea
                    id="mensaje"
                    value={mensaje}
                    onChange={e => setMensaje(e.target.value)}
                    placeholder="Dejá un mensaje para el festejado/a…"
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </motion.div>
              )}

              {/* Accesibilidad */}
              {asistencia === 'Confirmado' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={requiereAccesibilidad}
                      onChange={e => setRequiereAccesibilidad(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-primary"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      ♿ Necesito asistencia especial / accesibilidad
                    </span>
                  </label>
                </motion.div>
              )}
            </CardContent>

            <CardFooter className="px-6 pb-8 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 rounded-xl text-base font-bold shadow-lg"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Enviando…</>
                ) : (
                  'Confirmar asistencia'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}

export default function RsvpPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    }>
      <RsvpFormContent />
    </Suspense>
  );
}
