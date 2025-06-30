
'use client';

import React, { useState, useEffect, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertTriangle, CheckCircle, Send, PartyPopper } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { saveFeedback } from '@/app/actions/feedback';

export default function FeedbackPage({ params }: { params: { fiestaId: string } }) {
  const { toast } = useToast();
  const [clientName, setClientName] = useState('');
  const [enjoyedMost, setEnjoyedMost] = useState('');
  const [toImprove, setToImprove] = useState('');
  const [generalComments, setGeneralComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fiestaNombre, setFiestaNombre] = useState('');

  useEffect(() => {
    async function loadFiestaInfo() {
      try {
        const fiestaData = await getFiestaActual();
        if (fiestaData.id !== params.fiestaId) {
            setError("Este enlace de encuesta no corresponde al evento actual.");
        } else {
            setFiestaNombre(fiestaData.configuracion.nombreEvento);
        }
      } catch (err) {
        setError("No se pudo cargar la información del evento.");
      } finally {
        setIsLoading(false);
      }
    }
    loadFiestaInfo();
  }, [params.fiestaId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !enjoyedMost.trim() || !toImprove.trim()) {
      toast({ title: "Campos Requeridos", description: "Por favor, completa todos los campos obligatorios.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const result = await saveFeedback({
      fiestaId: params.fiestaId,
      fiestaNombre,
      clientName,
      enjoyedMost,
      toImprove,
      generalComments,
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
    return (
      <div className="flex items-center justify-center min-h-screen bg-green-50">
        <Card className="w-full max-w-lg text-center shadow-2xl p-8">
          <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-4" />
          <CardTitle className="text-3xl font-bold font-headline text-green-700">¡Gracias por tus Comentarios!</CardTitle>
          <CardDescription className="text-lg mt-2 text-muted-foreground">Tu opinión es muy valiosa para nosotros y nos ayuda a mejorar.</CardDescription>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
            <PartyPopper className="w-12 h-12 mx-auto text-primary mb-3"/>
            <CardTitle className="text-3xl font-bold font-headline">¡Valora tu experiencia!</CardTitle>
            <CardDescription className="text-lg">Tu opinión sobre "{fiestaNombre}" es muy importante para nosotros.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
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
  );
}

