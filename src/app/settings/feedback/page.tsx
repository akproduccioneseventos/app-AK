
'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Loader2, AlertTriangle, Star, Wand2, Trash2, ClipboardCopy, CheckCircle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FeedbackSubmission, Testimonial } from '@/types/feedback';
import { getFeedback, getTestimonials, saveTestimonial, updateTestimonialApproval, deleteTestimonial } from '@/app/actions/feedback';
import { generateTestimonial } from '@/ai/flows/generate-testimonial-flow';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

const formatDate = (dateString: string) => new Date(dateString).toLocaleString('es-ES');

export default function FeedbackPage() {
  const { toast } = useToast();
  const [feedbackList, setFeedbackList] = useState<FeedbackSubmission[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for AI generation modal
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<FeedbackSubmission | null>(null);
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingTestimonial, setIsSavingTestimonial] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [feedbackData, testimonialsData] = await Promise.all([getFeedback(), getTestimonials()]);
      setFeedbackList(feedbackData);
      setTestimonials(testimonialsData);
    } catch (e: any) {
      toast({ title: "Error", description: "No se pudieron cargar los datos de feedback.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openAIGenerator = async (feedback: FeedbackSubmission) => {
    setCurrentFeedback(feedback);
    setIsGenerating(true);
    setIsGeneratorOpen(true);
    try {
      const result = await generateTestimonial({
        clientName: feedback.clientName,
        enjoyedMost: feedback.enjoyedMost,
        toImprove: feedback.toImprove,
        generalComments: feedback.generalComments || '',
      });
      setGeneratedText(result.testimonialText);
    } catch (e: any) {
      toast({ title: "Error de IA", description: e.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleSaveTestimonial = async () => {
    if (!currentFeedback || !generatedText.trim()) return;
    setIsSavingTestimonial(true);
    try {
      const result = await saveTestimonial({
        feedbackId: currentFeedback.id,
        fiestaId: currentFeedback.fiestaId,
        fiestaNombre: currentFeedback.fiestaNombre,
        clientName: currentFeedback.clientName,
        testimonialText: generatedText,
      });
      if (result.success) {
        toast({ title: "Testimonio Guardado" });
        setIsGeneratorOpen(false);
        await loadData();
      } else {
        throw new Error(result.error || "No se pudo guardar el testimonio.");
      }
    } catch (e: any) {
      toast({ title: "Error al Guardar", description: e.message, variant: "destructive" });
    } finally {
      setIsSavingTestimonial(false);
    }
  };

  const handleToggleApproval = async (id: string, currentStatus: boolean) => {
    await updateTestimonialApproval(id, !currentStatus);
    toast({ title: `Testimonio ${!currentStatus ? 'aprobado' : 'desaprobado'}.` });
    await loadData();
  };
  
  const handleDeleteTestimonial = async (id: string) => {
     await deleteTestimonial(id);
     toast({title: "Testimonio eliminado", variant: "destructive"});
     await loadData();
  }
  
  const feedbackSinTestimonio = feedbackList.filter(fb => !testimonials.some(t => t.feedbackId === fb.id));

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Dialog open={isGeneratorOpen} onOpenChange={setIsGeneratorOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">Generar Testimonio con IA</DialogTitle>
            <DialogDescription>Revisa el texto generado y edítalo si es necesario antes de guardarlo.</DialogDescription>
          </DialogHeader>
          {isGenerating ? <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div> :
            <div className="space-y-3 py-2">
              <div className="text-sm p-3 border rounded-md bg-muted/50">
                <p><strong>Cliente:</strong> {currentFeedback?.clientName}</p>
                <p><strong>Evento:</strong> {currentFeedback?.fiestaNombre}</p>
              </div>
              <Label htmlFor="testimonial-text">Texto del Testimonio</Label>
              <Textarea id="testimonial-text" value={generatedText} onChange={e => setGeneratedText(e.target.value)} rows={8}/>
            </div>
          }
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGeneratorOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveTestimonial} disabled={isGenerating || isSavingTestimonial}>
              {isSavingTestimonial ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null} Guardar Testimonio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Star className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Feedback y Testimonios</h1>
        </div>
        <Link href="/settings" passHref>
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Feedback Recibido (Pendiente de Testimonio)</CardTitle>
          <CardDescription>Aquí aparecen las encuestas completadas por los clientes que aún no has procesado.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? <div className="text-center p-4"><Loader2 className="w-6 h-6 animate-spin"/></div> :
           feedbackSinTestimonio.length > 0 ? feedbackSinTestimonio.map(fb => (
            <Card key={fb.id} className="bg-muted/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{fb.fiestaNombre}</CardTitle>
                <CardDescription>Recibido de {fb.clientName} el {formatDate(fb.timestamp)}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div><p className="font-semibold">Lo que más disfrutó:</p><p className="text-muted-foreground">{fb.enjoyedMost}</p></div>
                <div><p className="font-semibold">Sugerencias de mejora:</p><p className="text-muted-foreground">{fb.toImprove}</p></div>
                {fb.generalComments && <div><p className="font-semibold">Comentarios generales:</p><p className="text-muted-foreground">{fb.generalComments}</p></div>}
              </CardContent>
              <CardFooter>
                <Button size="sm" onClick={() => openAIGenerator(fb)}><Wand2 className="w-4 h-4 mr-2"/>Generar Testimonio</Button>
              </CardFooter>
            </Card>
           )) : <p className="text-center text-muted-foreground p-4">No hay feedback nuevo para procesar.</p>
          }
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Testimonios Guardados</CardTitle>
          <CardDescription>Gestiona los testimonios generados. Los aprobados se podrán usar en el módulo de redes sociales.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? <div className="text-center p-4"><Loader2 className="w-6 h-6 animate-spin"/></div> :
           testimonials.length > 0 ? testimonials.map(t => (
            <Card key={t.id} className="bg-muted/40">
              <CardContent className="p-4 space-y-3">
                <blockquote className="border-l-4 pl-4 italic">"{t.testimonialText}"</blockquote>
                <p className="text-sm font-medium text-right">- {t.clientName}, {t.fiestaNombre}</p>
                <Separator/>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Switch id={`approve-${t.id}`} checked={t.isApproved} onCheckedChange={() => handleToggleApproval(t.id, t.isApproved)}/>
                        <Label htmlFor={`approve-${t.id}`}>{t.isApproved ? "Aprobado" : "Aprobar"}</Label>
                        {t.isApproved && <CheckCircle className="w-4 h-4 text-green-500"/>}
                    </div>
                    <div className="flex gap-2">
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => {navigator.clipboard.writeText(t.testimonialText); toast({title:"Copiado!"})}}><ClipboardCopy className="w-4 h-4"/></Button>
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteTestimonial(t.id)}><Trash2 className="w-4 h-4"/></Button>
                    </div>
                </div>
              </CardContent>
            </Card>
           )) : <p className="text-center text-muted-foreground p-4">No has guardado ningún testimonio.</p>
          }
        </CardContent>
      </Card>
       <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
            <CardTitle className="text-blue-800 text-lg flex items-center gap-2"><Info className="w-5 h-5"/>¿Cómo funciona?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700 space-y-2">
            <p>1. Cuando una fiesta termina, ve a la sección "Configuración de la Empresa" y obtén el enlace único de la encuesta.</p>
            <p>2. Envía ese enlace a tu cliente.</p>
            <p>3. El feedback aparecerá aquí, listo para que la IA cree un testimonio para tu marketing.</p>
            <p>4. Los testimonios aprobados estarán disponibles al crear contenido en el módulo de <Link href="/empresa/redes-sociales" className="underline font-semibold">Redes Sociales</Link>.</p>
        </CardContent>
       </Card>
    </div>
  );
}
