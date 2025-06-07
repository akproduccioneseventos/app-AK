'use client';

import type { Presupuesto, PresupuestoFormData } from '@/types/presupuesto';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Dispatch, SetStateAction } from 'react';

interface Paso4Props {
  presupuesto?: Presupuesto;
  formData: PresupuestoFormData;
  setFormData: Dispatch<SetStateAction<PresupuestoFormData>>;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount); // Assuming ARS, adjust if needed
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
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
    let texto = `*Presupuesto Evento AK Producciones*\n\n`;
    texto += `*Cliente:* ${presupuesto.clienteNombre}\n`;
    texto += `*Tipo de Evento:* ${presupuesto.eventoTipo}\n`;
    texto += `*Fecha:* ${formatDate(presupuesto.eventoFecha)}\n`;
    texto += `*Invitados:* ${presupuesto.invitadosCantidad}\n\n`;

    if (presupuesto.platosSeleccionados.length > 0) {
      texto += `*Menú Seleccionado:*\n`;
      presupuesto.platosSeleccionados.forEach(p => {
        texto += `- ${p.nombrePlato} (${p.cantidad} x ${formatCurrency(p.costoUnitario)}): ${formatCurrency(p.costoTotalPlato)}\n`;
      });
      texto += `_Subtotal Platos:_ ${formatCurrency(presupuesto.costoSubtotalPlatos)}\n\n`;
    }

    if (presupuesto.serviciosAdicionales.length > 0) {
      texto += `*Servicios Adicionales:*\n`;
      presupuesto.serviciosAdicionales.forEach(s => {
        texto += `- ${s.nombreServicio}: ${formatCurrency(s.costoServicio)}\n`;
      });
      texto += `_Subtotal Servicios:_ ${formatCurrency(presupuesto.costoSubtotalServicios)}\n\n`;
    }
    
    if(presupuesto.notas){
      texto += `*Notas:*\n${presupuesto.notas}\n\n`;
    }

    texto += `*TOTAL ESTIMADO: ${formatCurrency(presupuesto.costoTotalEstimado)}*\n\n`;
    texto += `¡Gracias por confiar en AK Producciones!`;
    return texto;
  };

  const handleCopyToClipboard = () => {
    const texto = generarTextoWhatsApp();
    navigator.clipboard.writeText(texto)
      .then(() => {
        toast({ title: "¡Texto Copiado!", description: "El resumen del presupuesto ha sido copiado al portapapeles." });
      })
      .catch(err => {
        toast({ title: "Error", description: "No se pudo copiar el texto.", variant: "destructive" });
      });
  };
  
  const handleWhatsAppSend = () => {
    const texto = generarTextoWhatsApp();
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(whatsappUrl, '_blank');
  };


  return (
    <div className="space-y-6">
      <Card className="border-primary shadow-lg">
        <CardHeader className="bg-primary/10">
          <CardTitle className="font-headline text-2xl text-primary">Resumen del Presupuesto</CardTitle>
          <CardDescription>Revisá los detalles de tu presupuesto antes de guardarlo.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <h3 className="font-semibold">Cliente: <span className="font-normal">{presupuesto.clienteNombre}</span></h3>
            <p>Tipo de Evento: {presupuesto.eventoTipo}</p>
            <p>Fecha: {formatDate(presupuesto.eventoFecha)}</p>
            <p>Cantidad de Invitados: {presupuesto.invitadosCantidad}</p>
          </div>
          <Separator />
          {presupuesto.platosSeleccionados.length > 0 && (
            <div>
              <h4 className="font-semibold text-lg mb-2">Platos Seleccionados:</h4>
              <ul className="list-disc list-inside space-y-1 pl-2">
                {presupuesto.platosSeleccionados.map(plato => (
                  <li key={plato.idPlato}>{plato.nombrePlato} ({plato.cantidad} x {formatCurrency(plato.costoUnitario)}) - {formatCurrency(plato.costoTotalPlato)}</li>
                ))}
              </ul>
              <p className="text-right font-medium mt-1">Subtotal Platos: {formatCurrency(presupuesto.costoSubtotalPlatos)}</p>
            </div>
          )}
          {presupuesto.serviciosAdicionales.length > 0 && (
            <div>
              <Separator className="my-3"/>
              <h4 className="font-semibold text-lg mb-2">Servicios Adicionales:</h4>
              <ul className="list-disc list-inside space-y-1 pl-2">
                {presupuesto.serviciosAdicionales.map(servicio => (
                  <li key={servicio.idServicio}>{servicio.nombreServicio} - {formatCurrency(servicio.costoServicio)}</li>
                ))}
              </ul>
              <p className="text-right font-medium mt-1">Subtotal Servicios: {formatCurrency(presupuesto.costoSubtotalServicios)}</p>
            </div>
          )}
          <Separator />
           <div className="space-y-2">
              <Label htmlFor="notas-presupuesto" className="text-base font-semibold">Notas Adicionales</Label>
              <Textarea 
                id="notas-presupuesto" 
                placeholder="Añade cualquier nota o término adicional aquí." 
                value={formData.notas}
                onChange={(e) => setFormData(prev => ({...prev, notas: e.target.value}))}
                rows={3}
                className="text-base p-3"
              />
            </div>
          <Separator />
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">Total Estimado: {formatCurrency(presupuesto.costoTotalEstimado)}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Compartir Presupuesto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea 
            value={generarTextoWhatsApp()} 
            readOnly 
            rows={8} 
            className="text-sm bg-muted/50"
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCopyToClipboard} className="w-full">
              <Copy className="w-4 h-4 mr-2" /> Copiar Texto
            </Button>
            <Button onClick={handleWhatsAppSend} className="w-full bg-green-500 hover:bg-green-600 text-white">
              Enviar por WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
