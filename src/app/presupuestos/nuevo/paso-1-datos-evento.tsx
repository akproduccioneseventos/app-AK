
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
  
  // Determine if formData.eventoTipo is a predefined type or a custom one for the Select value
  const isPredefinedEventoTipo = formData.eventoTipo && ALL_TIPOS_EVENTO.includes(formData.eventoTipo as TipoEvento);
  const selectValueForTipoEvento = isPredefinedEventoTipo ? formData.eventoTipo : (formData.eventoTipo ? "Otro" : "");

  const handleSelectTipoEventoChange = (value: string) => {
    if (value === "Otro") {
      // User selected "Otro", clear eventoTipo to allow custom input and clear related name fields
      setFormData(prev => ({ 
        ...prev, 
        eventoTipo: "", 
        nombreHomenajeado1: '',
        nombreHomenajeado2: '',
        nombreEmpresa: '',
      }));
    } else {
      // User selected a predefined type, clear related name fields
      setFormData(prev => ({ 
        ...prev, 
        eventoTipo: value as TipoEvento,
        nombreHomenajeado1: '',
        nombreHomenajeado2: '',
        nombreEmpresa: '',
      }));
    }
  };
  
  const handleCustomTipoEventoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // This updates formData.eventoTipo directly with the custom text
    setFormData(prev => ({ ...prev, eventoTipo: e.target.value }));
  };
  
  // Determine visibility for conditional name fields based on the *final* eventoTipo
  const finalEventoTipoTrimmed = formData.eventoTipo.trim();
  const showBodaFields = finalEventoTipoTrimmed === 'Boda';
  const showEmpresaField = finalEventoTipoTrimmed === 'Evento corporativo';
  const showHomenajeadoField = finalEventoTipoTrimmed && !showBodaFields && !showEmpresaField;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="clienteNombre" className="text-base">Nombre del Cliente *</Label>
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
          <Label htmlFor="salonFiestas" className="text-base">Salón de Fiestas *</Label>
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
        <Label htmlFor="eventoTipoSelect" className="text-base">Tipo de Evento *</Label>
        <Select 
          value={selectValueForTipoEvento} // Controlled by derived state
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
        {(selectValueForTipoEvento === "Otro" || (formData.eventoTipo && !isPredefinedEventoTipo)) && (
           <Input 
              id="eventoTipoOtroInput" 
              placeholder="Especificá el tipo de evento *" 
              value={formData.eventoTipo} 
              onChange={handleCustomTipoEventoInputChange}
              className="text-base p-3 mt-2"
              required={!formData.eventoTipo.trim()} // Required if no type has been entered
          />
        )}
      </div>

      {showBodaFields && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="nombreNovio" className="text-base">Nombre del Novio *</Label>
            <Input 
              id="nombreNovio" 
              placeholder="Ej: Juan Pérez" 
              value={formData.nombreHomenajeado1}
              onChange={(e) => handleChange('nombreHomenajeado1', e.target.value)}
              className="text-base p-3"
              required={showBodaFields}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nombreNovia" className="text-base">Nombre de la Novia *</Label>
            <Input 
              id="nombreNovia" 
              placeholder="Ej: María González" 
              value={formData.nombreHomenajeado2}
              onChange={(e) => handleChange('nombreHomenajeado2', e.target.value)}
              className="text-base p-3"
              required={showBodaFields}
            />
          </div>
        </div>
      )}

      {showEmpresaField && (
         <div className="space-y-2">
          <Label htmlFor="nombreEmpresa" className="text-base">Nombre de la Empresa *</Label>
          <Input 
            id="nombreEmpresa" 
            placeholder="Ej: Empresa S.A." 
            value={formData.nombreEmpresa}
            onChange={(e) => handleChange('nombreEmpresa', e.target.value)}
            className="text-base p-3"
            required={showEmpresaField}
          />
        </div>
      )}
      
      {showHomenajeadoField && (
        <div className="space-y-2">
          <Label htmlFor="nombreHomenajeado" className="text-base">Nombre del Homenajeado/a *</Label>
          <Input 
            id="nombreHomenajeado" 
            placeholder="Ej: Sofía (para Cumpleaños, XV años, etc.)" 
            value={formData.nombreHomenajeado1}
            onChange={(e) => handleChange('nombreHomenajeado1', e.target.value)}
            className="text-base p-3"
            required={showHomenajeadoField}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="eventoFecha" className="text-base">Fecha del Evento *</Label>
          <DatePickerDemo 
            selectedDate={formData.eventoFecha}
            onDateChange={handleDateChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invitadosCantidad" className="text-base">Cantidad Estimada de Invitados *</Label>
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
