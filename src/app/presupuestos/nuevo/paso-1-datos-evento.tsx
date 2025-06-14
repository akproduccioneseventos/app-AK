
'use client';

import type { PresupuestoFormData, TipoEvento } from '@/types/presupuesto';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerDemo } from '@/components/date-picker-demo'; 
import type { Dispatch, SetStateAction } from 'react';
import { ALL_TIPOS_EVENTO } from '@/types/presupuesto';
import React, { useState, useEffect } from 'react';

interface Paso1Props {
  formData: PresupuestoFormData;
  setFormData: Dispatch<SetStateAction<PresupuestoFormData>>;
}

export default function Paso1DatosEvento({ formData, setFormData }: Paso1Props) {
  // Local state to manage the Select component's value to differentiate "Otro" selection
  // from a custom type already entered in formData.eventoTipo.
  const [selectValueForTipoEvento, setSelectValueForTipoEvento] = useState<string>(() => {
    if (formData.eventoTipo && ALL_TIPOS_EVENTO.includes(formData.eventoTipo as TipoEvento)) {
      return formData.eventoTipo;
    }
    if (formData.eventoTipo && formData.eventoTipo !== '') { // It's a custom type
      return "Otro";
    }
    return formData.eventoTipo || ''; // Default to empty if no type yet
  });

  useEffect(() => {
    // Sync local select value if formData.eventoTipo changes externally (e.g. pre-fill)
    if (formData.eventoTipo && ALL_TIPOS_EVENTO.includes(formData.eventoTipo as TipoEvento)) {
      if (selectValueForTipoEvento !== formData.eventoTipo) {
        setSelectValueForTipoEvento(formData.eventoTipo);
      }
    } else if (formData.eventoTipo) { // Custom type
      if (selectValueForTipoEvento !== "Otro") {
        setSelectValueForTipoEvento("Otro");
      }
    } else { // No type, or explicitly cleared for "Otro" input
        if (selectValueForTipoEvento !== "" && selectValueForTipoEvento !== "Otro") {
           // This case might happen if "Otro" was selected, then form data eventoTipo cleared
           // If it's truly empty (not because "Otro" selected for input), then select should be empty
        }
    }
  }, [formData.eventoTipo, selectValueForTipoEvento]);


  const handleSelectTipoEventoChange = (value: string) => {
    setSelectValueForTipoEvento(value);
    if (value !== "Otro") {
      // If a predefined type is selected, update formData.eventoTipo and clear specific name fields
      setFormData(prev => ({
        ...prev,
        eventoTipo: value as TipoEvento,
        nombreHomenajeado1: '', // Clear related fields on type change
        nombreHomenajeado2: '',
        nombreEmpresa: '',
      }));
    } else {
      // If "Otro" is selected, clear formData.eventoTipo to allow custom input
      // and clear specific name fields
      setFormData(prev => ({
        ...prev,
        eventoTipo: '', // This will make the custom input appear
        nombreHomenajeado1: '',
        nombreHomenajeado2: '',
        nombreEmpresa: '',
      }));
    }
  };

  const handleCustomTipoEventoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Update formData.eventoTipo directly when the custom input changes
    setFormData(prev => ({ ...prev, eventoTipo: e.target.value }));
  };
  
  const handleChange = (field: keyof PresupuestoFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, eventoFecha: date }));
  };
  
  const showCustomTipoEventoInput = selectValueForTipoEvento === "Otro";
  
  // Determine the final event type to decide which name fields to show
  const finalEventType = showCustomTipoEventoInput ? formData.eventoTipo : selectValueForTipoEvento;

  const showBodaNameFields = finalEventType === 'Boda';
  const showEmpresaNameField = finalEventType === 'Evento corporativo';
  const showHomenajeadoNameField = finalEventType && !showBodaNameFields && !showEmpresaNameField && finalEventType.trim() !== '';

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
          value={selectValueForTipoEvento}
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
        {showCustomTipoEventoInput && (
           <Input 
              id="eventoTipoOtroInput" 
              placeholder="Especificá el tipo de evento *" 
              value={formData.eventoTipo} // This is now the custom entered value
              onChange={handleCustomTipoEventoChange}
              className="text-base p-3 mt-2"
              required={showCustomTipoEventoInput && !formData.eventoTipo.trim()} 
          />
        )}
      </div>

      {/* Campos condicionales para nombres */}
      {showBodaNameFields && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="nombreNovio" className="text-base">Nombre del Novio *</Label>
            <Input 
              id="nombreNovio" 
              placeholder="Ej: Juan Pérez" 
              value={formData.nombreHomenajeado1}
              onChange={(e) => handleChange('nombreHomenajeado1', e.target.value)}
              className="text-base p-3"
              required={showBodaNameFields}
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
              required={showBodaNameFields}
            />
          </div>
        </div>
      )}

      {showEmpresaNameField && (
         <div className="space-y-2">
          <Label htmlFor="nombreEmpresa" className="text-base">Nombre de la Empresa *</Label>
          <Input 
            id="nombreEmpresa" 
            placeholder="Ej: Empresa S.A." 
            value={formData.nombreEmpresa}
            onChange={(e) => handleChange('nombreEmpresa', e.target.value)}
            className="text-base p-3"
            required={showEmpresaNameField}
          />
        </div>
      )}
      
      {showHomenajeadoNameField && (
        <div className="space-y-2">
          <Label htmlFor="nombreHomenajeado" className="text-base">Nombre del Homenajeado/a *</Label>
          <Input 
            id="nombreHomenajeado" 
            placeholder="Ej: Sofía (para Cumpleaños, XV años, etc.)" 
            value={formData.nombreHomenajeado1}
            onChange={(e) => handleChange('nombreHomenajeado1', e.target.value)}
            className="text-base p-3"
            required={showHomenajeadoNameField}
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
