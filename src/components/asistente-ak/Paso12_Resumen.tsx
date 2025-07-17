
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AsistenteData, formatCurrency } from '@/app/asistente-ak/page';
import { Button } from '@/components/ui/button';
import { Check, Send, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { crearPresupuestoDesdeAsistente } from '@/app/actions/asistente-ak';

interface Props {
  data: AsistenteData;
  presupuestoEstimado: number;
}

const ResumenItem: React.FC<{label: string, value?: string | number | null}> = ({ label, value }) => {
    if (!value) return null;
    return (
        <div className="flex justify-between items-center py-2 border-b">
            <p className="text-muted-foreground">{label}</p>
            <p className="font-semibold">{value}</p>
        </div>
    );
};

export const AsistentePaso12_Resumen: React.FC<Props> = ({ data, presupuestoEstimado }) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalInvitados = data.invitados.adultos + data.invitados.adolescentes + data.invitados.ninos;
  
  const handleEnviarSolicitud = async () => {
    setIsSubmitting(true);
    try {
      const result = await crearPresupuestoDesdeAsistente(data);
      if (result.success && result.presupuestoId) {
        toast({
          title: "¡Solicitud Recibida!",
          description: "Un organizador se pondrá en contacto contigo pronto."
        });
        router.push('/asistente-ak/solicitud-enviada');
      } else {
        throw new Error(result.error || "No se pudo enviar la solicitud.");
      }
    } catch (error: any) {
      toast({
        title: "Error al Enviar",
        description: error.message,
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold font-headline">¡Casi listo! Revisa tu selección.</h2>
        <p className="text-muted-foreground mt-2">Este es el resumen de tu evento soñado. Si todo está correcto, envía la solicitud al organizador.</p>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>Resumen de tu Evento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
            <ResumenItem label="Tipo de Evento" value={data.tipoFiesta?.nombre} />
            <ResumenItem label="Total Invitados" value={`${totalInvitados} (Adultos: ${data.invitados.adultos}, Adolescentes: ${data.invitados.adolescentes}, Niños: ${data.invitados.ninos})`} />
            <ResumenItem label="Estilo Decoración" value={data.estiloDecoracion?.nombre} />
            <ResumenItem label="Catering" value={data.catering?.nombre} />
            <ResumenItem label="Bebidas" value={data.bebidas?.nombre} />
            <ResumenItem label="Foto y Video" value={data.fotoVideo?.nombre} />
            <ResumenItem label="Música" value={data.musica?.nombre} />
            <ResumenItem label="Repostería" value={data.reposteria?.nombre} />
            <ResumenItem label="Entretenimiento Extra" value={data.entretenimiento?.nombre} />
            <ResumenItem label="Lista de Regalos" value={data.listaRegalos ? 'Sí' : 'No'} />
            <ResumenItem label="Tu Presupuesto Aprox." value={formatCurrency(data.presupuestoCliente)} />
            <Separator className="my-3"/>
            <div className="flex justify-between items-center text-xl font-bold pt-2">
                <p>Presupuesto Total Estimado:</p>
                <p className="text-primary">{formatCurrency(presupuestoEstimado)}</p>
            </div>
        </CardContent>
      </Card>
      
      <div className="text-center space-y-3">
        <Button size="lg" className="w-full max-w-sm" onClick={handleEnviarSolicitud} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 animate-spin"/> : <Send className="mr-2"/>}
            {isSubmitting ? 'Enviando...' : 'Enviar Solicitud al Organizador'}
        </Button>
        <p className="text-xs text-muted-foreground">Al enviar, un organizador se pondrá en contacto contigo para afinar los detalles y confirmar el presupuesto final.</p>
      </div>
    </div>
  );
};
