
'use client';

import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Loader2, AlertTriangle, Star, Wand2, Trash2, ClipboardCopy, CheckCircle, Info, Link as LinkIcon, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FeedbackSubmission, Testimonial } from '@/types/feedback';
import { getFeedback, getTestimonials, saveTestimonial, updateTestimonialApproval, deleteTestimonial } from '@/app/actions/feedback';
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
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { Input } from '@/components/ui/input';
import { NewPostDialog } from '@/components/social-media/NewPostDialog';
import type { SocialPost } from '@/types/social-media';

const formatDate = (dateString: string) => new Date(dateString).toLocaleString('es-ES');

export default function FeedbackPage() {
  const { toast } = useToast();
  const [feedbackList, setFeedbackList] = useState<FeedbackSubmission[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fiestaIdActual, setFiestaIdActual] = useState<string>('');
  
  // State for post creation dialog
  const [postToCreate, setPostToCreate] = useState<Partial<SocialPost> | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);


  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [feedbackData, testimonialsData, fiestaActual] = await Promise.all([getFeedback(), getTestimonials(), getFiestaActual()]);
      setFeedbackList(feedbackData);
      setTestimonials(testimonialsData);
      if(fiestaActual) setFiestaIdActual(fiestaActual.id);
    } catch (e: any) {
      toast({ title: "Error", description: "No se pudieron cargar los datos de feedback.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleCopyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Enlace Copiado" });
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
  
  const handlePublishTestimonial = (testimonial: Testimonial) => {
    setPostToCreate({
      text: `"${testimonial.testimonialText}" - ${testimonial.clientName}`,
      isGeneralCampaign: true, // Testimonials are usually general marketing
    });
    setIsPostModalOpen(true);
  };

  const feedbackSinTestimonio = feedbackList.filter(fb => !testimonials.some(t => t.feedbackId === fb.id));
  
  const feedbackLink = typeof window !== 'undefined' && fiestaIdActual ? `${window.location.origin}/feedback/${fiestaIdActual}` : '';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <NewPostDialog
          isOpen={isPostModalOpen}
          onOpenChange={setIsPostModalOpen}
          onPostCreated={() => {
              setIsPostModalOpen(false);
              toast({ title: "Publicación Programada/Creada" });
          }}
          postToDuplicate={postToCreate} // Using duplicate to pre-fill text
      />
     
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Star className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Feedback y Testimonios</h1>
        </div>
        <Link href="/settings" passHref>
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver a Configuración</Button>
        </Link>
      </div>
      
      <Card className="shadow-md bg-blue-50 border-blue-200">
        <CardHeader>
            <CardTitle className="text-blue-800 text-lg flex items-center gap-2"><Info className="w-5 h-5"/>¿Cómo funciona?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700 space-y-2">
            <p>1. Después de un evento, comparte el siguiente enlace de encuesta único con tu cliente.</p>
             <div className="flex items-center space-x-2 pt-2">
                <Input id="feedback-link" value={feedbackLink} readOnly disabled={!feedbackLink}/>
                <Button type="button" size="sm" onClick={() => handleCopyToClipboard(feedbackLink)} disabled={!feedbackLink}>
                    <ClipboardCopy className="h-4 w-4" />
                </Button>
            </div>
            <p>2. El feedback del cliente aparecerá automáticamente en la sección "Feedback Recibido".</p>
            <p>3. El botón "Generar Testimonio" está desactivado temporalmente.</p>
        </CardContent>
      </Card>

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
                <Button size="sm" disabled><Wand2 className="w-4 h-4 mr-2"/>Generar Testimonio (Desactivado)</Button>
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
                         <Button variant="secondary" size="sm" onClick={() => handlePublishTestimonial(t)} disabled={!t.isApproved}>
                            <Send className="w-4 h-4 mr-2"/> Publicar
                         </Button>
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
    </div>
  );
}
