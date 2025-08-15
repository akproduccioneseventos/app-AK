
'use client';

import type { PresupuestoFormData, TipoEvento } from '@/types/presupuesto';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerDemo } from '@/components/date-picker-demo';
import type { Dispatch, SetStateAction } from 'react';
import { ALL_TIPOS_EVENTO } from '@/types/presupuesto';
import React from 'react';
import { Separator } from '@/components/ui/separator';

interface Paso1Props {
  formData: PresupuestoFormData;
  setFormData: Dispatch<SetStateAction<PresupuestoFormData>>;
}

export default function Paso1DatosEvento({ formData, setFormData }: Paso1Props) {
  
  const handleChange = (field: keyof PresupuestoFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, eventoFecha: date }));
  };
  
  const eventoTipoEnSelect =
    formData.eventoTipo && ALL_TIPOS_EVENTO.includes(formData.eventoTipo as TipoEvento)
      ? formData.eventoTipo
      : (formData.eventoTipo && formData.eventoTipo.trim() !== "" ? "Otro" : "");


  const handleSelectTipoEventoChange = (value: string) => {
    const newTipoEvento = value === "Otro" ? "" : value as TipoEvento;
    setFormData(prev => ({
      ...prev,
      eventoTipo: newTipoEvento,
      nombreEmpresa: newTipoEvento === 'Evento corporativo' ? prev.nombreEmpresa : '', 
      protagonista1Nombre: (newTipoEvento !== 'Evento corporativo' && newTipoEvento !== 'Boda') ? prev.protagonista1Nombre : '',
      protagonista2Nombre: newTipoEvento === 'Boda' ? prev.protagonista2Nombre : '',
    }));
  };

  const handleCustomTipoEventoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, eventoTipo: e.target.value }));
  };
  
  const finalEventType = formData.eventoTipo.trim();
  const showCustomTipoInput = eventoTipoEnSelect === "Otro" || (finalEventType && !ALL_TIPOS_EVENTO.includes(finalEventType as TipoEvento));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="clienteNombre" className="text-base">Nombre del Cliente*</Label>
          <Input
            id="clienteNombre"
            placeholder="Ej: Ana Pérez"
            value={formData.clienteNombre}
            onChange={(e) => handleChange('clienteNombre', e.target.value)}
            className="text-base p-3"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="salonFiestas" className="text-base">Salón de Fiestas*</Label>
          <Input
            id="salonFiestas"
            placeholder="Ej: Salón El Paraíso"
            value={formData.salonFiestas}
            onChange={(e) => handleChange('salonFiestas', e.target.value)}
            className="text-base p-3"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="eventoTipoSelect" className="text-base">Tipo de Evento*</Label>
        <Select
          value={eventoTipoEnSelect}
          onValueChange={handleSelectTipoEventoChange}
          required
        >
          <SelectTrigger id="eventoTipoSelect" className="text-base p-3 h-auto">
            <SelectValue placeholder="Seleccioná un tipo" />
          </SelectTrigger>
          <SelectContent>
            {ALL_TIPOS_EVENTO.map(tipo => (
              <SelectItem key={tipo} value={tipo} className="text-base">{tipo}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {showCustomTipoInput && (
          <Input
            id="eventoTipoOtroInput"
            placeholder="Especificá el tipo de evento"
            value={finalEventType !== "Otro" ? finalEventType : ""}
            onChange={handleCustomTipoEventoInputChange}
            className="text-base p-3 mt-2"
            required={showCustomTipoInput}
          />
        )}
      </div>

      <Separator className="my-4" />
      <h3 className="text-md font-medium text-muted-foreground">Protagonista(s) del Evento (Opcional)</h3>

      {finalEventType === 'Boda' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="protagonista1NombreBoda" className="text-base">Nombre Novio/a 1</Label>
            <Input
              id="protagonista1NombreBoda"
              placeholder="Nombre"
              value={formData.protagonista1Nombre || ''}
              onChange={(e) => handleChange('protagonista1Nombre', e.target.value)}
              className="text-base p-3"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="protagonista2NombreBoda" className="text-base">Nombre Novio/a 2</Label>
            <Input
              id="protagonista2NombreBoda"
              placeholder="Nombre"
              value={formData.protagonista2Nombre || ''}
              onChange={(e) => handleChange('protagonista2Nombre', e.target.value)}
              className="text-base p-3"
            />
          </div>
        </div>
      ) : finalEventType === 'Evento corporativo' ? (
        <div className="space-y-2">
          <Label htmlFor="nombreEmpresaCorp" className="text-base">Nombre Empresa / Contacto</Label>
          <Input
            id="nombreEmpresaCorp"
            placeholder="Ej: Empresa S.A. / Juan Pérez (Gerente)"
            value={formData.nombreEmpresa || ''}
            onChange={(e) => handleChange('nombreEmpresa', e.target.value)}
            className="text-base p-3"
          />
        </div>
      ) : (finalEventType && finalEventType.trim() !== '') ? (
        <div className="space-y-2">
          <Label htmlFor="protagonistaNombreGeneral" className="text-base">Nombre del Agasajado/Protagonista</Label>
          <Input
            id="protagonistaNombreGeneral"
            placeholder="Nombre Completo"
            value={formData.protagonista1Nombre || ''}
            onChange={(e) => handleChange('protagonista1Nombre', e.target.value)}
            className="text-base p-3"
          />
        </div>
      ) : null}


      <Separator className="my-4" />


      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="eventoFecha" className="text-base">Fecha del Evento*</Label>
          <DatePickerDemo
            selectedDate={formData.eventoFecha}
            onDateChange={handleDateChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invitadosCantidad" className="text-base">Cantidad Estimada de Invitados*</Label>
          <Input
            id="invitadosCantidad"
            type="number"
            placeholder="Ej: 50"
            value={formData.invitadosCantidad ?? ''}
            onChange={(e) => handleChange('invitadosCantidad', e.target.value ? parseInt(e.target.value) : null)}
            min="1"
            className="text-base p-3"
            required
          />
        </div>
      </div>
    </div>
  );
}
