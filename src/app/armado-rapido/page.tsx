'use client';

import { useState, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

import { crearPresupuestoDesdeArmadoRapido } from '../actions/asistente-ak';
import { ALL_TIPOS_EVENTO, type TipoEvento } from '@/types/presupuesto';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export default function ArmadoRapidoPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [clienteNombre, setClienteNombre] = useState('');
  const [eventoTipo, setEventoTipo] = useState<TipoEvento | string>('');
  const [invitadosCantidad, setInvitadosCantidad] = useState<number>(50);
  const [eventoFecha, setEventoFecha] = useState<Date | undefined>(new Date());
  const [salonFiestas, setSalonFiestas] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNombre || !eventoTipo || !invitadosCantidad || !eventoFecha || !salonFiestas) {
        toast({title: "Datos requeridos", description: "Por favor, completa todos los campos.", variant: "destructive"});
        return;
    }
    setIsSubmitting(true);
    const result = await crearPresupuestoDesdeArmadoRapido({
        clienteNombre,
        eventoTipo,
        invitadosCantidad,
        eventoFecha: eventoFecha.toISOString(),
        salonFiestas,
    });

    if (result.success && result.presupuestoId) {
        router.push(`/presupuestos/${result.presupuestoId}/ver`);
    } else {
        toast({title: "Error al generar presupuesto", description: result.error, variant: "destructive"});
    }
    setIsSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline text-center">
            Armado Rápido de Presupuesto
          </CardTitle>
          <CardDescription className="text-center text-lg">
            Completa los datos de tu evento y generaremos un presupuesto base para ti.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clienteNombre">Tu Nombre Completo *</Label>
                <Input id="clienteNombre" value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} required/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventoTipo">Tipo de Evento *</Label>
                <Select value={eventoTipo} onValueChange={(value) => setEventoTipo(value as TipoEvento)}>
                    <SelectTrigger id="eventoTipo"><SelectValue placeholder="Selecciona un tipo..."/></SelectTrigger>
                    <SelectContent>{ALL_TIPOS_EVENTO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="invitados">Nº de Invitados *</Label>
                    <Input id="invitados" type="number" value={invitadosCantidad} onChange={(e) => setInvitadosCantidad(Number(e.target.value))} min="1" required/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="eventoFecha">Fecha del Evento *</Label>
                    <DatePickerDemo selectedDate={eventoFecha} onDateChange={setEventoFecha} />
                </div>
             </div>
             <div className="space-y-2">
                <Label htmlFor="salon">Salón de Fiestas / Lugar *</Label>
                <Input id="salon" value={salonFiestas} onChange={e => setSalonFiestas(e.target.value)} placeholder="Ej: Salón El Paraíso" required/>
              </div>

          </CardContent>
          <CardFooter className="flex justify-end">
               <Button type="submit" disabled={isSubmitting} size="lg">
                  {isSubmitting && <Loader2 className="w-5 h-5 mr-2 animate-spin"/>}
                  {isSubmitting ? 'Generando...' : 'Generar mi Presupuesto Base'}
              </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
