
'use client';

import React, { useState, useEffect, type FormEvent, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertTriangle, CheckCircle, Send, PartyPopper, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getPublicGuestEvent } from '@/app/actions/public-guest-portal';
import { saveFeedback, getEnlaceDeResenaPublico } from '@/app/actions/feedback';
import { CompanyLogo } from '@/components/company-logo';
import { PublicFooter } from '@/components/public-footer';
import { cn } from '@/lib/utils';

// NPS Score Button
function NpsButton({ score, selected, onClick }: { score: number; selected: boolean; onClick: () => void }) {
  const color = score <= 6 ? 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
    : score <= 8 ? 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200'
    : 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200';
  const selectedColor = score <= 6 ? 'bg-red-500 text-white border-red-500'
    : score <= 8 ? 'bg-amber-500 text-white border-amber-500'
    : 'bg-green-500 text-white border-green-500';
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-9 h-9 rounded-lg border text-sm font-bold transition-all',
        selected ? selectedColor : color
      )}
    >
      {score}
    </button>
  );
}

// Star Rating component
function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="p-0.5"
          >
            <Star
              className={cn(
                'w-7 h-7 transition-colors',
                (hovered || value) >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-200'
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function FeedbackContent({ fiestaId }: { fiestaId: string | null }) {
  const { toast } = useToast();
  const [clientName, setClientName] = useState('');
  const [enjoyedMost, setEnjoyedMost] = useState('');
  const [toImprove, setToImprove] = useState('');
  const [generalComments, setGeneralComments] = useState('');
  const [npsScore, setNpsScore] = useState<number | undefined>(undefined);
  const [ratingComida, setRatingComida] = useState(0);
  const [ratingMusica, setRatingMusica] = useState(0);
  const [ratingOrganizacion, setRatingOrganizacion] = useState(0);
  const [ratingLugar, setRatingLugar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // El enlace de resenas sale de Ajustes, nunca escrito a mano acá.
  const [googleReviewsUrl, setGoogleReviewsUrl] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fiestaNombre, setFiestaNombre] = useState('');

  useEffect(() => {
    async function loadFiestaInfo() {
      if (!fiestaId) {
        setError("Falta el ID del evento.");
        setIsLoading(false);
        return;
      }
      try {
        // Antes se comparaba contra "la fiesta actual": el enlace de la encuesta
        // servia unicamente mientras esa fiesta seguia siendo la mas reciente.
        // Como la encuesta se manda DESPUES del evento, para cuando el invitado
        // la abria ya habia otra fiesta adelante y el enlace quedaba muerto. Con
        // varias fiestas activas a la vez, funcionaba solo una.
        const fiestaData = await getPublicGuestEvent(fiestaId);
        if (!fiestaData) {
            setError("No encontramos este evento. Pedile el enlace al equipo de AK.");
        } else {
            setFiestaNombre(fiestaData.configuracion?.nombreEvento || 'tu evento');
        }
        // Se pide junto con lo demas para que la pantalla de gracias ya lo tenga.
        setGoogleReviewsUrl(await getEnlaceDeResenaPublico());
      } catch {
        setError("No se pudo cargar la información del evento.");
      } finally {
        setIsLoading(false);
      }
    }
    loadFiestaInfo();
  }, [fiestaId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!fiestaId) return;
    if (!clientName.trim() || !enjoyedMost.trim() || !toImprove.trim()) {
      toast({ title: "Campos Requeridos", description: "Por favor, completa todos los campos obligatorios.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const result = await saveFeedback({
      fiestaId: fiestaId,
      fiestaNombre,
      clientName,
      enjoyedMost,
      toImprove,
      generalComments,
      npsScore,
      ratingComida: ratingComida || undefined,
      ratingMusica: ratingMusica || undefined,
      ratingOrganizacion: ratingOrganizacion || undefined,
      ratingLugar: ratingLugar || undefined,
    });
    if (result.success) {
      setIsSubmitted(true);
    } else {
      toast({ title: "Error al Enviar", description: result.error, variant: "destructive" });
    }
    setIsSubmitting(false);
  };
  
  if (isLoading) {
      return <div className="flex justify-center items-center min-h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen p-4 text-center text-destructive"><AlertTriangle className="w-8 h-8 mr-2"/>{error}</div>
  }
  
  if (isSubmitted) {
    const isDetractor = npsScore !== undefined && npsScore < 7;

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-50 to-amber-50/40 p-4">
        <Card className="w-full max-w-lg text-center shadow-2xl p-6 sm:p-8 border-slate-200">
          <CheckCircle className="w-16 h-16 mx-auto text-emerald-500 mb-3" />
          <CardTitle className="text-2xl sm:text-3xl font-bold font-headline text-slate-900">
            ¡Gracias por tus comentarios!
          </CardTitle>
          <CardDescription className="text-base mt-2 text-slate-600">
            Tu opinión es muy valiosa para nosotros y nos ayuda a cuidar cada detalle en Salto.
          </CardDescription>

          {isDetractor && (
            <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 text-left">
              <p className="font-bold">Lamentamos no haber alcanzado tus expectativas al 100%.</p>
              <p className="mt-1 text-slate-600">
                Nuestro equipo se va a contactar con vos para revisar lo ocurrido y resolver cualquier punto pendiente.
              </p>
            </div>
          )}

          {/* Bloque de reseña de Google: visible para TODOS, sin mirar la nota.
              Sólo aparece si el dueño cargó su enlace en Ajustes. */}
          {googleReviewsUrl && (
          <div className="mt-6 pt-6 border-t border-slate-200 text-center space-y-3">
            <div className="flex items-center justify-center gap-1.5 text-amber-500 mb-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg">
              ¿Nos ayudás con una reseña en Google?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
              Es un minuto y es lo que más nos ayuda a que otras familias de Salto nos encuentren.
            </p>
            <div className="pt-2">
              <a
                href={googleReviewsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition"
              >
                <Star className="w-4 h-4 fill-slate-950" />
                Dejar mi reseña en Google
              </a>
            </div>
          </div>
          )}
        </Card>
      </div>
    );
  }

  const npsLabel = npsScore !== undefined
    ? npsScore >= 9 ? 'Promotor — ¡Te encantó!' : npsScore >= 7 ? 'Neutro — Estuvo bien' : 'Detractor — Podemos mejorar'
    : '';

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <div className="flex-grow flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
            <div className="mx-auto mb-4 opacity-50">
              <CompanyLogo size="sm" className="mx-auto" />
            </div>
            <PartyPopper className="w-12 h-12 mx-auto text-primary mb-3"/>
            <CardTitle className="text-3xl font-bold font-headline">¡Valora tu experiencia!</CardTitle>
            <CardDescription className="text-lg">Tu opinión sobre &ldquo;{fiestaNombre}&rdquo; es muy importante para nosotros.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-8">

            {/* NPS Question */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <Label className="text-base font-bold">
                ¿Qué tan probable es que recomiendes AK Producciones a un amigo o familiar?
              </Label>
              <p className="text-xs text-slate-500">Donde 0 = Nada probable y 10 = Muy probable</p>
              <div className="flex gap-1 flex-wrap">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                  <NpsButton
                    key={score}
                    score={score}
                    selected={npsScore === score}
                    onClick={() => setNpsScore(score)}
                  />
                ))}
              </div>
              {npsLabel && (
                <p className={cn(
                  'text-sm font-semibold',
                  npsScore !== undefined && npsScore >= 9 ? 'text-green-600' :
                  npsScore !== undefined && npsScore >= 7 ? 'text-amber-600' : 'text-red-600'
                )}>
                  {npsLabel}
                </p>
              )}
            </div>

            {/* Star Ratings */}
            <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <Label className="text-base font-bold">Calificá los siguientes aspectos del evento</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StarRating value={ratingComida} onChange={setRatingComida} label="🍽️ Gastronomía" />
                <StarRating value={ratingMusica} onChange={setRatingMusica} label="🎵 Música y entretenimiento" />
                <StarRating value={ratingOrganizacion} onChange={setRatingOrganizacion} label="📋 Organización general" />
                <StarRating value={ratingLugar} onChange={setRatingLugar} label="🏛️ Lugar y decoración" />
              </div>
            </div>

            {/* Text fields */}
            <div className="space-y-2">
                <Label htmlFor="client-name">Tu Nombre *</Label>
                <Input id="client-name" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Escribe tu nombre completo" required disabled={isSubmitting}/>
            </div>
            <div className="space-y-2">
                <Label htmlFor="enjoyed-most">¿Qué fue lo que más disfrutaste del evento/servicio? *</Label>
                <Textarea id="enjoyed-most" value={enjoyedMost} onChange={e => setEnjoyedMost(e.target.value)} rows={4} placeholder="La comida estaba deliciosa, la música increíble..." required disabled={isSubmitting}/>
            </div>
             <div className="space-y-2">
                <Label htmlFor="to-improve">¿Qué crees que podríamos mejorar para futuros eventos? *</Label>
                <Textarea id="to-improve" value={toImprove} onChange={e => setToImprove(e.target.value)} rows={4} placeholder="Quizás más opciones de postres, o un poco más de..." required disabled={isSubmitting}/>
            </div>
             <div className="space-y-2">
                <Label htmlFor="general-comments">Comentarios Generales (Opcional)</Label>
                <Textarea id="general-comments" value={generalComments} onChange={e => setGeneralComments(e.target.value)} rows={3} placeholder="Cualquier otra cosa que quieras compartir." disabled={isSubmitting}/>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full text-lg py-6">
                {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Send className="w-5 h-5 mr-2"/>}
                {isSubmitting ? 'Enviando...' : 'Enviar Mis Comentarios'}
            </Button>
          </CardFooter>
        </form>
      </Card>
      </div>
      <PublicFooter />
    </div>
  );
}

export default function FeedbackPage() {
  const params = useParams<{ fiestaId: string }>();
  const fiestaId = params.fiestaId;

  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>}>
      <FeedbackContent fiestaId={fiestaId} />
    </Suspense>
  )
}
