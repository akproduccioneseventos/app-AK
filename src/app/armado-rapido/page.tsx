
'use client';

import { useState, type FormEvent, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Loader2, CheckCircle, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';

import { crearPresupuestoDesdeArmadoRapido } from '../actions/armado-rapido';
import { getOcupiedDates } from '../actions/agenda';
import { ALL_TIPOS_EVENTO, type TipoEvento } from '@/types/presupuesto';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { AnimatePresence, motion } from 'framer-motion';

// Mocked package data - this would eventually come from a config file or API
const paquetesMock = [
    { id: 'basico', nombre: 'Paquete Básico', descripcion: 'Lo esencial para una gran fiesta.', precioBase: 50000 },
    { id: 'intermedio', nombre: 'Paquete Intermedio', descripcion: 'El más popular, con catering y música.', precioBase: 85000 },
    { id: 'premium', nombre: 'Paquete Premium', descripcion: 'La experiencia completa y sin preocupaciones.', precioBase: 120000 },
];


export default function ArmadoRapidoPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [paso, setPaso] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 State
  const [clienteNombre, setClienteNombre] = useState('');
  const [eventoTipo, setEventoTipo] = useState<TipoEvento | string>('');
  const [invitadosCantidad, setInvitadosCantidad] = useState<number>(50);
  const [eventoFecha, setEventoFecha] = useState<Date | undefined>(new Date());
  const [salonFiestas, setSalonFiestas] = useState('');
  const [fechaIndefinida, setFechaIndefinida] = useState(false);
  const [occupiedDates, setOccupiedDates] = useState<Date[]>([]);

  useEffect(() => {
    async function fetchDates() {
        const dateStrings = await getOcupiedDates();
        const dates = dateStrings.map(d => new Date(d));
        setOccupiedDates(dates);
    }
    fetchDates();
  }, []);

  const handleNextStep = (e: FormEvent) => {
    e.preventDefault();
     if (!clienteNombre || !eventoTipo || !invitadosCantidad || !salonFiestas) {
        toast({title: "Datos requeridos", description: "Por favor, completa todos los campos obligatorios.", variant: "destructive"});
        return;
    }
    if (!fechaIndefinida && !eventoFecha) {
        toast({title: "Fecha Requerida", description: "Por favor, selecciona una fecha o marca que no la has decidido.", variant: "destructive"});
        return;
    }
    setPaso(2);
  }
  
  const handleSelectPackage = async (paqueteId: string) => {
    setIsSubmitting(true);
    const result = await crearPresupuestoDesdeArmadoRapido({
        clienteNombre,
        eventoTipo,
        invitadosCantidad,
        eventoFecha: fechaIndefinida ? undefined : eventoFecha?.toISOString(),
        salonFiestas,
        paqueteId: paqueteId,
    });

    if (result.success && result.presupuestoId) {
        setPaso(3); // Go to success step
        setTimeout(() => router.push(`/presupuestos/${result.presupuestoId}/ver`), 4000);
    } else {
        toast({title: "Error al generar presupuesto", description: result.error, variant: "destructive"});
    }
    setIsSubmitting(false);
  }

  const renderContent = () => {
    switch(paso) {
        case 1:
            return (
                <motion.div key="paso1" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
                 <CardHeader>
                    <CardTitle className="text-2xl font-bold font-headline text-center">Cuéntanos sobre tu Evento</CardTitle>
                    <CardDescription className="text-center">Paso 1 de 2: Información básica</CardDescription>
                </CardHeader>
                <form onSubmit={handleNextStep}>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label htmlFor="clienteNombre">Tu Nombre Completo *</Label><Input id="clienteNombre" value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} required/></div>
                        <div className="space-y-2"><Label htmlFor="eventoTipo">Tipo de Evento *</Label><Select value={eventoTipo} onValueChange={(value) => setEventoTipo(value as TipoEvento)}><SelectTrigger id="eventoTipo"><SelectValue placeholder="Selecciona un tipo..."/></SelectTrigger><SelectContent>{ALL_TIPOS_EVENTO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label htmlFor="invitados">Nº de Invitados *</Label><Input id="invitados" type="number" value={invitadosCantidad} onChange={(e) => setInvitadosCantidad(Number(e.target.value))} min="1" required/></div>
                        <div className="space-y-2"><Label htmlFor="eventoFecha">Fecha del Evento *</Label><DatePickerDemo selectedDate={eventoFecha} onDateChange={setEventoFecha} disabled={fechaIndefinida || occupiedDates} /></div>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Checkbox id="fecha-indefinida" checked={fechaIndefinida} onCheckedChange={(checked) => setFechaIndefinida(checked as boolean)} />
                        <label htmlFor="fecha-indefinida" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Aún no he decidido la fecha</label>
                    </div>
                    <div className="space-y-2"><Label htmlFor="salon">Salón de Fiestas / Lugar *</Label><Input id="salon" value={salonFiestas} onChange={e => setSalonFiestas(e.target.value)} placeholder="Ej: Salón El Paraíso" required/></div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button type="submit" size="lg">Continuar <ArrowRight className="w-4 h-4 ml-2"/></Button>
                </CardFooter>
                </form>
                </motion.div>
            );
        case 2:
            return (
                 <motion.div key="paso2" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold font-headline text-center">Elige tu Paquete de Servicios</CardTitle>
                        <CardDescription className="text-center">Paso 2 de 2: Selecciona una opción base.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {paquetesMock.map(paquete => (
                                <Card key={paquete.id} className="flex flex-col">
                                    <CardHeader><CardTitle>{paquete.nombre}</CardTitle><CardDescription>{paquete.descripcion}</CardDescription></CardHeader>
                                    <CardContent className="flex-grow"><p className="text-2xl font-bold text-primary">{/* Price can be shown here */}</p></CardContent>
                                    <CardFooter>
                                        <Button className="w-full" onClick={() => handleSelectPackage(paquete.id)} disabled={isSubmitting}>
                                            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Package className="w-4 h-4 mr-2"/>}
                                            Seleccionar
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                     <CardFooter className="flex justify-start">
                        <Button variant="outline" onClick={() => setPaso(1)}><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button>
                    </CardFooter>
                 </motion.div>
            );
        case 3:
             return (
                 <motion.div key="paso3" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-8">
                     <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-4"/>
                     <h2 className="text-2xl font-bold">¡Presupuesto Generado!</h2>
                     <p className="text-muted-foreground mt-2">Hemos creado un presupuesto inicial y un asesor se contactará contigo a la brevedad. Serás redirigido para ver los detalles.</p>
                 </motion.div>
            );
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-4xl shadow-2xl transition-all">
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
      </Card>
    </div>
  )
}
