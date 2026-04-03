'use client';

import { Suspense, useEffect, useState, useCallback, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, AlertTriangle, CheckCircle, Music, Utensils, Users, Download } from 'lucide-react';
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
  const [asistencia, setAsistencia] = useState<'Confirmado' | 'Rechazado'>('Confirmado');
  const [dietary, setDietary] = useState<DietaryRestriction>('Ninguna');
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
        asistencia,
        dietaryRestriction: dietary,
        cancionesDJ: songs.filter(s => s.trim()),
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
              <CardContent className="flex flex-col items-center gap-6 px-8 py-6">
                <p className="text-sm text-slate-500 text-center">
                  Guarda tu pase digital. Lo necesitarás en la entrada.
                </p>
                <div className="p-6 bg-white rounded-2xl shadow-inner border border-slate-100">
                  <QRCodeStylized id="qr-rsvp-guest" value={qrValue} size={180} level="H" />
                </div>
                {confirmedGuest.dietaryRestriction && confirmedGuest.dietaryRestriction !== 'Ninguna' && (
                  <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-1">Menú especial</p>
                    <p className="text-sm font-semibold text-amber-800">{confirmedGuest.dietaryRestriction}</p>
                  </div>
                )}
              </CardContent>
            )}
            <CardFooter className="flex-col gap-3 pb-10 px-8">
              {confirmedGuest.rsvp === 'Confirmado' && (
                <Button onClick={downloadQR} className="w-full rounded-xl" variant="outline">
                  <Download className="w-4 h-4 mr-2" /> Descargar QR
                </Button>
              )}
              <p className="text-xs text-center text-slate-400">{eventName}</p>
            </CardFooter>
          </Card>
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
