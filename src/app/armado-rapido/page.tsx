
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

import config from '@/data/asistente-ak-config.json';
import { TipoFiestaSelector } from '@/components/asistente-ak/TipoFiestaSelector';
import { crearProspectoDesdeAsistente } from '../actions/asistente-ak';

const TOTAL_PASOS = 3;

function ArmadoRapidoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [paso, setPaso] = useState(1);
  const [tipoFiesta, setTipoFiesta] = useState<string | null>(null);
  const [invitados, setInvitados] = useState<number>(50);
  const [costoEstimado, setCostoEstimado] = useState<string>('');
  
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (tipoFiesta) {
      const opcion = config.pasos.tipoFiesta.opciones.find(o => o.id === tipoFiesta);
      if (opcion) {
        const costo = (opcion.costoBase || 0) + (opcion.costoPorPersona || 0) * invitados;
        const formattedCost = new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(costo);
        setCostoEstimado(formattedCost);
      }
    }
  }, [tipoFiesta, invitados]);
  
  const handleNext = () => {
    if (paso === 1 && !tipoFiesta) {
        toast({ title: "Selecciona un tipo de fiesta", variant: "destructive" });
        return;
    }
    if (paso < TOTAL_PASOS) setPaso(p => p + 1);
  };
  
  const handlePrev = () => {
    if (paso > 1) setPaso(p => p - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !telefono) {
        toast({title: "Datos requeridos", description: "Por favor, completa tu nombre y teléfono.", variant: "destructive"});
        return;
    }
    setIsSubmitting(true);
    const result = await crearProspectoDesdeAsistente({
        tipoFiesta: config.pasos.tipoFiesta.opciones.find(o => o.id === tipoFiesta)?.nombre || 'Evento',
        invitados,
        costoEstimado,
        nombre,
        telefono,
        email
    });

    if (result.success) {
        router.push('/asistente-ak/solicitud-enviada');
    } else {
        toast({title: "Error", description: result.error, variant: "destructive"});
    }
    setIsSubmitting(false);
  }

  const progreso = (paso / TOTAL_PASOS) * 100;
  const pasoConfig = config.pasos.tipoFiesta;

  return (
    <Card className="w-full max-w-2xl shadow-2xl">
      <CardHeader>
        <Progress value={progreso} className="w-full h-2 mb-4" />
        <CardTitle className="text-3xl font-bold font-headline text-center">
            {paso === 1 && pasoConfig.pregunta}
            {paso === 2 && '¿Cuántos invitados esperas?'}
            {paso === 3 && 'Tus Datos de Contacto'}
        </CardTitle>
        <CardDescription className="text-center text-lg">
            {paso === 1 && pasoConfig.descripcion}
            {paso === 2 && 'Ajusta el número para obtener un presupuesto inicial.'}
            {paso === 3 && 'Un asesor se contactará para refinar este presupuesto inicial.'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="min-h-[250px] flex items-center justify-center">
            {paso === 1 && (
                <TipoFiestaSelector 
                    opciones={pasoConfig.opciones} 
                    seleccion={tipoFiesta} 
                    onSelect={setTipoFiesta}
                />
            )}
            {paso === 2 && (
                <div className="w-full max-w-md space-y-4 text-center">
                    <Input 
                        type="number" 
                        value={invitados}
                        onChange={(e) => setInvitados(Number(e.target.value))}
                        className="text-4xl text-center font-bold h-20 p-4"
                        min="1"
                    />
                     <div className="text-2xl font-semibold p-4 border rounded-md bg-muted">
                        Presupuesto Estimado: <span className="text-primary">{costoEstimado}</span>
                    </div>
                </div>
            )}
            {paso === 3 && (
                <div className="w-full max-w-md space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="nombre">Tu Nombre *</Label>
                        <Input id="nombre" value={nombre} onChange={e => setNombre(e.target.value)} required/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="telefono">Tu Teléfono *</Label>
                        <Input id="telefono" type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} required/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email">Tu Email (Opcional)</Label>
                        <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                </div>
            )}
        </CardContent>
        <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handlePrev} disabled={paso === 1 || isSubmitting}>
                <ArrowLeft className="w-4 h-4 mr-2"/> Anterior
            </Button>
            {paso < TOTAL_PASOS ? (
                <Button onClick={handleNext} disabled={isSubmitting}>
                    Siguiente <ArrowRight className="w-4 h-4 ml-2"/>
                </Button>
            ) : (
                 <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}
                    Enviar Solicitud
                </Button>
            )}
        </CardFooter>
      </form>
    </Card>
  );
}


export default function ArmadoRapidoPage() {
    return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
            <ArmadoRapidoContent />
        </div>
    )
}
