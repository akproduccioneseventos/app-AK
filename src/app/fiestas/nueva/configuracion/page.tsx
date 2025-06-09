
'use client';

import { useState, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { ArrowLeft, Save, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { TipoEvento } from '@/types/presupuesto';

const tiposEventoDisponibles: TipoEvento[] = ['Cumpleaños', 'Boda', 'Fiesta de 15', 'Baby Shower', 'Evento Corporativo', 'Conferencia', 'Lanzamiento de Producto'];

interface EventConfigData {
  nombreEvento: string;
  tipoCelebracion: TipoEvento | string;
  fechaEvento?: Date;
  horaInicio: string;
  horaFin: string;
  nombreLugar: string;
  direccionLugar: string;
  invitadosEstimados: number | string;
  presupuestoEstimado: number | string;
  notasAdicionales: string;
}

export default function ConfiguracionEventoPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<EventConfigData>({
    nombreEvento: 'Boda Noelia Damaceno', // Default from Excel
    tipoCelebracion: 'Boda', // Default from Excel
    fechaEvento: new Date(2025, 5, 6), // Default from Excel (06/06/25, month is 0-indexed)
    horaInicio: '',
    horaFin: '',
    nombreLugar: 'Bonsai', // Default from Excel
    direccionLugar: '',
    invitadosEstimados: 80, // Default from Excel
    presupuestoEstimado: 156000, // Default from Excel
    notasAdicionales: '',
  });

  const handleChange = (field: keyof EventConfigData, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (date?: Date) => {
    handleChange('fechaEvento', date);
  };
  
  const handleTipoEventoChange = (value: string) => {
     if (value === "Otro") {
        handleChange('tipoCelebracion', ''); 
      } else {
        handleChange('tipoCelebracion', value as TipoEvento);
      }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // En una aplicación real, aquí guardarías los datos.
    console.log({ config });
    toast({
      title: "Configuración Guardada (Simulación)",
      description: "Los detalles generales del evento se han guardado.",
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Configuración General del Evento
        </h1>
        <Link href="/fiestas/nueva" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Planificador
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Settings2 className="w-8 h-8 text-primary" />
              <div>
                <CardTitle className="font-headline text-xl">Detalles Clave de tu Evento</CardTitle>
                <CardDescription>Establece la información fundamental para la planificación.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nombre-evento" className="text-base">Nombre del Evento</Label>
                <Input
                  id="nombre-evento"
                  value={config.nombreEvento}
                  onChange={(e) => handleChange('nombreEvento', e.target.value)}
                  placeholder="Ej: Boda Ana y Juan, Mi Cumpleaños N°30"
                  className="text-base p-3"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo-celebracion" className="text-base">Tipo de Celebración</Label>
                 <Select 
                    value={tiposEventoDisponibles.includes(config.tipoCelebracion as TipoEvento) ? config.tipoCelebracion : "Otro"}
                    onValueChange={handleTipoEventoChange}
                  >
                    <SelectTrigger id="tipo-celebracion" className="text-base p-3 h-auto">
                      <SelectValue placeholder="Seleccioná un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposEventoDisponibles.map(tipo => (
                        <SelectItem key={tipo} value={tipo} className="text-base">{tipo}</SelectItem>
                      ))}
                      <SelectItem value="Otro" className="text-base">Otro (especificar)</SelectItem>
                    </SelectContent>
                  </Select>
                  {(config.tipoCelebracion === '' || (!tiposEventoDisponibles.includes(config.tipoCelebracion as TipoEvento) && config.tipoCelebracion !== 'Otro')) && (
                     <Input 
                        id="eventoTipoOtro" 
                        placeholder="Especificá el tipo de evento" 
                        value={config.tipoCelebracion !== "Otro" ? config.tipoCelebracion : ""}
                        onChange={(e) => handleChange('tipoCelebracion', e.target.value)}
                        className="text-base p-3 mt-2"
                    />
                  )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="fecha-evento" className="text-base">Fecha del Evento</Label>
                <DatePickerDemo selectedDate={config.fechaEvento} onDateChange={handleDateChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hora-inicio" className="text-base">Hora de Inicio</Label>
                <Input
                  id="hora-inicio"
                  type="time"
                  value={config.horaInicio}
                  onChange={(e) => handleChange('horaInicio', e.target.value)}
                  className="text-base p-3"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hora-fin" className="text-base">Hora de Fin (Opcional)</Label>
                <Input
                  id="hora-fin"
                  type="time"
                  value={config.horaFin}
                  onChange={(e) => handleChange('horaFin', e.target.value)}
                  className="text-base p-3"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombre-lugar" className="text-base">Lugar del Evento (Nombre)</Label>
              <Input
                id="nombre-lugar"
                value={config.nombreLugar}
                onChange={(e) => handleChange('nombreLugar', e.target.value)}
                placeholder="Ej: Salón Paraíso, Finca Los Robles"
                className="text-base p-3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="direccion-lugar" className="text-base">Dirección del Lugar</Label>
              <Textarea
                id="direccion-lugar"
                value={config.direccionLugar}
                onChange={(e) => handleChange('direccionLugar', e.target.value)}
                placeholder="Ej: Calle Falsa 123, Ciudad, Provincia"
                rows={2}
                className="text-base p-3"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="invitados-estimados" className="text-base">Nº Estimado de Invitados</Label>
                    <Input
                    id="invitados-estimados"
                    type="number"
                    value={config.invitadosEstimados}
                    onChange={(e) => handleChange('invitadosEstimados', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    placeholder="Ej: 100"
                    min="1"
                    className="text-base p-3"
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="presupuesto-estimado" className="text-base">Presupuesto Total Estimado (ARS)</Label>
                    <Input
                    id="presupuesto-estimado"
                    type="number"
                    value={config.presupuestoEstimado}
                    onChange={(e) => handleChange('presupuestoEstimado', e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="Ej: 500000"
                    min="0"
                    step="any"
                    className="text-base p-3"
                    />
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notas-adicionales-config" className="text-base">Notas Adicionales</Label>
              <Textarea
                id="notas-adicionales-config"
                value={config.notasAdicionales}
                onChange={(e) => handleChange('notasAdicionales', e.target.value)}
                placeholder="Cualquier otro detalle importante para la configuración general."
                rows={3}
                className="text-base p-3"
              />
            </div>
             <img 
                src="https://placehold.co/600x300.png" 
                alt="Configuración de evento" 
                className="mt-6 rounded-md shadow-md mx-auto"
                data-ai-hint="event details form"
             />
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full sm:w-auto">
              <Save className="w-4 h-4 mr-2" />
              Guardar Configuración
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
