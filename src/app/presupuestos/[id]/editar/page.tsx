
'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { ArrowLeft, Save, Loader2, AlertTriangle, Edit3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Presupuesto, TipoEvento } from '@/types/presupuesto';
import { getPresupuestoById, updatePresupuesto } from '@/app/actions/presupuestos';

const tiposEventoDisponibles: TipoEvento[] = ['Cumpleaños', 'Boda', 'Fiesta de 15', 'Fiesta Infantil', 'Baby Shower', 'Evento Corporativo', 'Conferencia', 'Lanzamiento de Producto', 'Otro'];

export default function EditarPresupuestoPage() {
  const params = useParams();
  const router = useRouter();
  const presupuestoId = params.id as string;
  const { toast } = useToast();

  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [clienteNombre, setClienteNombre] = useState('');
  const [eventoTipo, setEventoTipo] = useState<TipoEvento | string>('');
  const [eventoFecha, setEventoFecha] = useState<Date | undefined>(undefined);
  const [invitadosCantidad, setInvitadosCantidad] = useState<number | null>(null);
  const [notas, setNotas] = useState('');
  const [estado, setEstado] = useState<Presupuesto['estado']>('Borrador');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const loadPresupuesto = useCallback(async () => {
    if (!presupuestoId) {
        setNotFound(true);
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setNotFound(false);
    try {
      const loadedPresupuesto = await getPresupuestoById(presupuestoId);
      if (loadedPresupuesto) {
        setPresupuesto(loadedPresupuesto);
        setClienteNombre(loadedPresupuesto.clienteNombre);
        setEventoTipo(loadedPresupuesto.eventoTipo);
        setEventoFecha(loadedPresupuesto.eventoFecha ? new Date(loadedPresupuesto.eventoFecha) : undefined);
        setInvitadosCantidad(loadedPresupuesto.invitadosCantidad);
        setNotas(loadedPresupuesto.notas || '');
        setEstado(loadedPresupuesto.estado);
      } else {
        setNotFound(true);
        toast({ title: 'Error', description: `No se encontró el presupuesto con ID ${presupuestoId}.`, variant: 'destructive' });
      }
    } catch (error) {
      console.error("Error al cargar el presupuesto:", error);
      setNotFound(true);
      toast({ title: 'Error al Cargar Presupuesto', description: 'No se pudo obtener el presupuesto.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [presupuestoId, toast]);

  useEffect(() => {
    loadPresupuesto();
  }, [loadPresupuesto]);

  const handleTipoEventoChange = (value: string) => {
    if (value === "Otro") {
      setEventoTipo(''); // Allow custom input
    } else {
      setEventoTipo(value as TipoEvento);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!presupuesto) return;

    if (!clienteNombre.trim() || !eventoTipo.trim() || !eventoFecha || !invitadosCantidad || invitadosCantidad <= 0) {
      toast({ title: "Campos incompletos", description: "Por favor, completa todos los campos principales del presupuesto.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const updatedData: Presupuesto = {
      ...presupuesto,
      clienteNombre: clienteNombre.trim(),
      eventoTipo: eventoTipo.trim(),
      eventoFecha: eventoFecha.toISOString(),
      invitadosCantidad: Number(invitadosCantidad),
      notas: notas.trim(),
      estado,
      timestamp: new Date().toISOString(), // Actualizar timestamp
    };

    try {
      const result = await updatePresupuesto(updatedData);
      if (result.success && result.presupuesto) {
        toast({ title: "¡Presupuesto Actualizado!", description: `El presupuesto para "${result.presupuesto.clienteNombre}" ha sido actualizado.` });
        setPresupuesto(result.presupuesto); // Actualizar estado local
      } else {
        throw new Error(result.error || "Error desconocido al actualizar el presupuesto.");
      }
    } catch (error: any) {
      toast({ title: "Error al Actualizar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-16 h-16 animate-spin text-primary" />
        <p className="ml-4 text-xl">Cargando datos del presupuesto...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Presupuesto no Encontrado</h1>
        <p className="text-muted-foreground mb-6">
          El presupuesto con ID <span className="font-mono bg-muted px-1 rounded">{presupuestoId}</span> no pudo ser encontrado.
        </p>
        <Link href="/presupuestos" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Presupuestos
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <Edit3 className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-headline">
                Editar Presupuesto #{presupuesto?.id.split('_').pop()}
            </h1>
        </div>
        <Link href="/presupuestos" passHref>
          <Button variant="outline" disabled={isSaving}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Actualizar Información del Presupuesto</CardTitle>
          <CardDescription>Modifica los detalles principales. La edición de platos y servicios se habilitará en el futuro.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="clienteNombre" className="text-base">Nombre del Cliente</Label>
                <Input 
                  id="clienteNombre" 
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  className="text-base p-3"
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventoTipo" className="text-base">Tipo de Evento</Label>
                <Select 
                  value={tiposEventoDisponibles.includes(eventoTipo as TipoEvento) ? eventoTipo : "Otro"}
                  onValueChange={handleTipoEventoChange}
                  disabled={isSaving}
                >
                  <SelectTrigger id="eventoTipo" className="text-base p-3 h-auto">
                    <SelectValue placeholder="Seleccioná un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposEventoDisponibles.map(tipo => (
                      <SelectItem key={tipo} value={tipo} className="text-base">{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {eventoTipo === '' || (!tiposEventoDisponibles.includes(eventoTipo as TipoEvento) && eventoTipo !== 'Otro') && (
                  <Input 
                      id="eventoTipoOtro" 
                      placeholder="Especificá el tipo de evento" 
                      value={eventoTipo !== "Otro" ? eventoTipo : ""}
                      onChange={(e) => setEventoTipo(e.target.value)}
                      className="text-base p-3 mt-2"
                      disabled={isSaving}
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="eventoFecha" className="text-base">Fecha del Evento</Label>
                <DatePickerDemo 
                  selectedDate={eventoFecha}
                  onDateChange={setEventoFecha}
                  className={isSaving ? "disabled:opacity-70" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invitadosCantidad" className="text-base">Cantidad de Invitados</Label>
                <Input 
                  id="invitadosCantidad" 
                  type="number" 
                  value={invitadosCantidad ?? ''}
                  onChange={(e) => setInvitadosCantidad(e.target.value ? parseInt(e.target.value) : null)}
                  min="1"
                  className="text-base p-3"
                  disabled={isSaving}
                />
              </div>
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="estado-presupuesto" className="text-base">Estado del Presupuesto</Label>
                <Select value={estado} onValueChange={(value) => setEstado(value as Presupuesto['estado'])} disabled={isSaving}>
                  <SelectTrigger id="estado-presupuesto" className="text-base p-3 h-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['Borrador', 'Enviado', 'Aceptado', 'Rechazado'] as Presupuesto['estado'][]).map(s => (
                      <SelectItem key={s} value={s} className="text-base">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notas" className="text-base">Notas Adicionales</Label>
              <Textarea 
                id="notas" 
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={4}
                className="text-base p-3"
                disabled={isSaving}
              />
            </div>
            <p className="text-sm text-muted-foreground">
                Nota: Los platos y servicios adicionales se conservarán como estaban. Su edición detallada estará disponible pronto.
            </p>
             <img 
                src="https://placehold.co/600x300.png" 
                alt="Formulario de presupuesto" 
                className="mt-6 rounded-md shadow-md mx-auto"
                data-ai-hint="budget form illustration"
            />
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
