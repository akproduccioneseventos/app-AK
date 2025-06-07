'use client';

import type { Presupuesto, PresupuestoFormData } from '@/types/presupuesto';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, ClipboardCopy, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Dispatch, SetStateAction } from 'react';

interface Paso4Props {
  presupuesto?: Presupuesto;
  formData: PresupuestoFormData;
  setFormData: Dispatch<SetStateAction<PresupuestoFormData>>;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'Fecha no especificada';
  try {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  } catch (e) {
    return 'Fecha inválida';
  }
};

export default function Paso4Resumen({ presupuesto, formData, setFormData }: Paso4Props) {
  const { toast } = useToast();

  if (!presupuesto) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <p className="text-xl font-semibold">Generando resumen...</p>
        <p className="text-muted-foreground">Asegurate de haber completado los pasos anteriores.</p>
      </div>
    );
  }

  const generarTextoWhatsApp = () => {
    let texto = `🎉 *¡Presupuesto para tu Evento!* 🎉\n\n`;
    texto += `Estimado/a *${presupuesto.clienteNombre}*,\n\n`;
    texto += `Gracias por considerar a *AK Producciones* para tu *${presupuesto.eventoTipo}*.\n`;
    texto += `*Fecha del Evento:* ${formatDate(presupuesto.eventoFecha)}\n`;
    texto += `*Cantidad de Invitados:* ${presupuesto.invitadosCantidad}\n\n`;
    texto += `------------------------------------\n`;
    texto += `✨ *DETALLE DEL PRESUPUESTO* ✨\n`;
    texto += `------------------------------------\n\n`;


    if (presupuesto.platosSeleccionados.length > 0) {
      texto += `🍽️ *Menú Seleccionado:*\n`;
      presupuesto.platosSeleccionados.forEach(p => {
        texto += `  • ${p.nombrePlato} (${p.cantidad} x ${formatCurrency(p.costoUnitario)} c/u): *${formatCurrency(p.costoTotalPlato)}*\n`;
      });
      texto += `  SUBTOTAL MENÚ: *${formatCurrency(presupuesto.costoSubtotalPlatos)}*\n\n`;
    }

    if (presupuesto.serviciosAdicionales.length > 0) {
      texto += `🛠️ *Servicios Adicionales:*\n`;
      presupuesto.serviciosAdicionales.forEach(s => {
        texto += `  • ${s.nombreServicio}: *${formatCurrency(s.costoServicio)}*\n`;
      });
      texto += `  SUBTOTAL SERVICIOS: *${formatCurrency(presupuesto.costoSubtotalServicios)}*\n\n`;
    }
    
    texto += `------------------------------------\n`;
    if(presupuesto.notas && presupuesto.notas.trim() !== ''){
      texto += `📝 *Notas Adicionales:*\n${presupuesto.notas}\n\n`;
      texto += `------------------------------------\n`;
    }

    texto += `💰 *TOTAL ESTIMADO: ${formatCurrency(presupuesto.costoTotalEstimado)}*\n\n`;
    texto += `------------------------------------\n\n`;
    texto += `¡Esperamos que este presupuesto sea de tu agrado! No dudes en consultarnos cualquier duda.\n\n`;
    texto += `Saludos,\n*El equipo de AK Producciones*`;
    return texto;
  };

  const handleCopyToClipboard = () => {
    const texto = generarTextoWhatsApp();
    navigator.clipboard.writeText(texto)
      .then(() => {
        toast({ title: "¡Texto Copiado!", description: "El resumen del presupuesto ha sido copiado al portapapeles." });
      })
      .catch(err => {
        toast({ title: "Error al Copiar", description: "No se pudo copiar el texto.", variant: "destructive" });
        console.error("Error al copiar: ", err);
      });
  };
  
  const handleWhatsAppSend = () => {
    const texto = generarTextoWhatsApp();
    // Aquí podrías pedir el número de teléfono del cliente si no lo tienes
    // Por ahora, abre WhatsApp con el texto pre-cargado para que el usuario elija el contacto
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(whatsappUrl, '_blank');
  };


  return (
    <div className="space-y-6">
      <Card className="border-primary shadow-lg">
        <CardHeader className="bg-primary/5 p-6">
          <CardTitle className="font-headline text-2xl text-primary">Resumen Detallado del Presupuesto</CardTitle>
          <CardDescription>Revisá los detalles de tu presupuesto antes de guardarlo o compartirlo.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="font-semibold text-muted-foreground">Cliente:</h3>
              <p className="text-lg font-medium">{presupuesto.clienteNombre}</p>
            </div>
             <div>
              <h3 className="font-semibold text-muted-foreground">Tipo de Evento:</h3>
              <p className="text-lg font-medium">{presupuesto.eventoTipo}</p>
            </div>
            <div>
              <h3 className="font-semibold text-muted-foreground">Fecha:</h3>
              <p className="text-lg font-medium">{formatDate(presupuesto.eventoFecha)}</p>
            </div>
            <div>
              <h3 className="font-semibold text-muted-foreground">Nº Invitados:</h3>
              <p className="text-lg font-medium">{presupuesto.invitadosCantidad}</p>
            </div>
          </div>
          
          <Separator />

          {presupuesto.platosSeleccionados.length > 0 && (
            <div className="py-2">
              <h4 className="font-semibold text-lg mb-2 text-primary/90">Platos Seleccionados:</h4>
              <ul className="space-y-1 pl-1 text-sm">
                {presupuesto.platosSeleccionados.map(plato => (
                  <li key={plato.idPlato} className="flex justify-between items-center">
                    <span>{plato.nombrePlato} ({plato.cantidad} x {formatCurrency(plato.costoUnitario)})</span>
                    <span className="font-medium">{formatCurrency(plato.costoTotalPlato)}</span>
                  </li>
                ))}
              </ul>
              <p className="text-right font-semibold mt-2 text-md">Subtotal Platos: {formatCurrency(presupuesto.costoSubtotalPlatos)}</p>
            </div>
          )}

          {presupuesto.serviciosAdicionales.length > 0 && (
            <div className="py-2">
              <Separator className="my-3"/>
              <h4 className="font-semibold text-lg mb-2 text-primary/90">Servicios Adicionales:</h4>
              <ul className="space-y-1 pl-1 text-sm">
                {presupuesto.serviciosAdicionales.map(servicio => (
                  <li key={servicio.idServicio} className="flex justify-between items-center">
                    <span>{servicio.nombreServicio}</span>
                    <span className="font-medium">{formatCurrency(servicio.costoServicio)}</span>
                  </li>
                ))}
              </ul>
              <p className="text-right font-semibold mt-2 text-md">Subtotal Servicios: {formatCurrency(presupuesto.costoSubtotalServicios)}</p>
            </div>
          )}
          
          <Separator className="my-3"/>

           <div className="space-y-2">
              <Label htmlFor="notas-presupuesto" className="text-base font-semibold text-primary/90">Notas Adicionales del Presupuesto</Label>
              <Textarea 
                id="notas-presupuesto" 
                placeholder="Añade cualquier observación, condición o detalle importante aquí." 
                value={formData.notas}
                onChange={(e) => setFormData(prev => ({...prev, notas: e.target.value}))}
                rows={4}
                className="text-base p-3 bg-background focus:border-primary"
              />
            </div>
          
          <Separator className="my-3"/>

          <div className="text-right mt-6">
            <p className="text-sm text-muted-foreground">Total Estimado del Presupuesto</p>
            <p className="text-3xl font-bold text-primary">{formatCurrency(presupuesto.costoTotalEstimado)}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-md border-primary/20">
        <CardHeader  className="bg-primary/5 p-6">
          <CardTitle className="font-headline text-xl text-primary">Acciones y Compartir</CardTitle>
          <CardDescription>Copiá el resumen o envialo directamente por WhatsApp.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
           <Textarea 
            value={generarTextoWhatsApp()} 
            readOnly 
            rows={10} 
            className="text-xs bg-muted/30 border-dashed h-auto resize-none"
            aria-label="Texto del presupuesto para WhatsApp"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button variant="outline" onClick={handleCopyToClipboard} className="w-full">
              <ClipboardCopy className="w-4 h-4 mr-2" /> Copiar Texto
            </Button>
            <Button onClick={handleWhatsAppSend} className="w-full bg-green-500 hover:bg-green-600 text-white">
              <Send className="w-4 h-4 mr-2" /> Enviar por WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
