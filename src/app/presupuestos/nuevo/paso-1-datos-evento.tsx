
'use client';

import type { PresupuestoFormData, TipoEvento } from '@/types/presupuesto';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerDemo } from '@/components/date-picker-demo';
import type { Dispatch, SetStateAction } from 'react';
import { ALL_TIPOS_EVENTO } from '@/types/presupuesto';
import React from 'react';

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

  const currentSelectedEventTypeInSelect =
    formData.eventoTipo && ALL_TIPOS_EVENTO.includes(formData.eventoTipo as TipoEvento)
      ? formData.eventoTipo
      : (formData.eventoTipo ? "Otro" : "");

  const handleSelectTipoEventoChange = (value: string) => {
    if (value === "Otro") {
      setFormData(prev => ({
        ...prev,
        eventoTipo: "", // Clear eventoTipo to prompt for custom input
        nombreEmpresa: '', // Clear conditional fields
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        eventoTipo: value as TipoEvento,
        nombreEmpresa: '', // Clear conditional fields
      }));
    }
  };

  const handleCustomTipoEventoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, eventoTipo: e.target.value }));
  };

  const showCustomTipoInput = currentSelectedEventTypeInSelect === "Otro" || (formData.eventoTipo && !ALL_TIPOS_EVENTO.includes(formData.eventoTipo as TipoEvento));
  const finalEventType = formData.eventoTipo.trim();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="clienteNombre" className="text-base">Nombre del Cliente</Label>
          <Input
            id="clienteNombre"
            placeholder="Ej: Ana Pérez"
            value={formData.clienteNombre}
            onChange={(e) => handleChange('clienteNombre', e.target.value)}
            className="text-base p-3"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="salonFiestas" className="text-base">Salón de Fiestas</Label>
          <Input
            id="salonFiestas"
            placeholder="Ej: Salón El Paraíso"
            value={formData.salonFiestas}
            onChange={(e) => handleChange('salonFiestas', e.target.value)}
            className="text-base p-3"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="eventoTipoSelect" className="text-base">Tipo de Evento</Label>
        <Select
          value={currentSelectedEventTypeInSelect}
          onValueChange={handleSelectTipoEventoChange}
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
            value={formData.eventoTipo}
            onChange={handleCustomTipoEventoInputChange}
            className="text-base p-3 mt-2"
          />
        )}
      </div>

      {finalEventType === 'Evento corporativo' && (
        <div className="space-y-2">
          <Label htmlFor="nombreEmpresa" className="text-base">Nombre de la Empresa</Label>
          <Input
            id="nombreEmpresa"
            placeholder="Ej: Empresa S.A."
            value={formData.nombreEmpresa}
            onChange={(e) => handleChange('nombreEmpresa', e.target.value)}
            className="text-base p-3"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="eventoFecha" className="text-base">Fecha del Evento</Label>
          <DatePickerDemo
            selectedDate={formData.eventoFecha}
            onDateChange={handleDateChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invitadosCantidad" className="text-base">Cantidad Estimada de Invitados</Label>
          <Input
            id="invitadosCantidad"
            type="number"
            placeholder="Ej: 50"
            value={formData.invitadosCantidad ?? ''}
            onChange={(e) => handleChange('invitadosCantidad', e.target.value ? parseInt(e.target.value) : null)}
            min="1"
            className="text-base p-3"
          />
        </div>
      </div>
    </div>
  );
}
