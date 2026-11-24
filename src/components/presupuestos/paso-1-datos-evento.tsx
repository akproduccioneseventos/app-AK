'use client';

import type { PresupuestoFormData, TipoEvento } from '@/types/presupuesto';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerDemo } from '@/components/date-picker-demo';
import type { Dispatch, SetStateAction } from 'react';
import { ALL_TIPOS_EVENTO } from '@/types/presupuesto';
import React, { useEffect, useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle } from 'lucide-react';
import { isSameDay, startOfDay } from 'date-fns';

interface Paso1Props {
  formData: PresupuestoFormData;
  setFormData: Dispatch<SetStateAction<PresupuestoFormData>>;
  occupiedDates: Date[];
}

export function Paso1DatosEvento({ formData, setFormData, occupiedDates }: Paso1Props) {
  const [isDateOccupied, setIsDateOccupied] = useState(false);

  useEffect(() => {
    // El total cuenta adultos, niños y adolescentes. La Presentación LED manda los menores como adolescentes, y este
    // paso sólo miraba niños: el campo decía 0 con 10 menores en el presupuesto (auditoría del 18/11/2026, R18-03).
    const total = (formData.invitadosAdultos || 0) + (formData.invitadosNinos || 0) + (formData.invitadosAdolescentes || 0);
    if (formData.invitadosCantidad !== total) {
      setFormData(prev => ({...prev, invitadosCantidad: total}));
    }
  }, [formData.invitadosAdultos, formData.invitadosNinos, formData.invitadosAdolescentes, formData.invitadosCantidad, setFormData]);

  // El campo "Niños y Adolescentes" muestra los dos juntos; al cambiarlo queda una sola cifra, sin menores escondidos.
  const menores = (formData.invitadosNinos ?? null) === null && (formData.invitadosAdolescentes ?? null) === null
    ? null
    : (formData.invitadosNinos || 0) + (formData.invitadosAdolescentes || 0);
  const cambiarMenores = (valor: number | null) => {
    setFormData(prev => ({ ...prev, invitadosNinos: valor, invitadosAdolescentes: 0 }));
  };

  const handleChange = (field: keyof PresupuestoFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, eventoFecha: date }));
    if (date) {
      const selectedDay = startOfDay(date);
      const isOccupied = occupiedDates.some(occupiedDate => isSameDay(selectedDay, startOfDay(occupiedDate)));
      setIsDateOccupied(isOccupied);
    } else {
      setIsDateOccupied(false);
    }
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

  const finalEventType = (formData.eventoTipo || '').trim();
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
          <Label htmlFor="clienteContacto" className="text-base">Nº de Contacto</Label>
           <Input
            id="clienteContacto"
            placeholder="Teléfono o Email"
            value={formData.clienteContacto || ''}
            onChange={(e) => handleChange('clienteContacto', e.target.value)}
            className="text-base p-3"
          />
        </div>
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

      <div className="space-y-2">
        <Label htmlFor="eventoTipoSelect" className="text-base">Tipo de Evento</Label>
        <Select
          value={eventoTipoEnSelect}
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
            value={finalEventType !== "Otro" ? finalEventType : ""}
            onChange={handleCustomTipoEventoInputChange}
            className="text-base p-3 mt-2"
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


      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2 md:col-span-1">
          <Label htmlFor="eventoFecha" className="text-base">Fecha del Evento</Label>
          <DatePickerDemo
            selectedDate={formData.eventoFecha}
            onDateChange={handleDateChange}
            disabled={occupiedDates}
          />
          {isDateOccupied && (
            <div className="p-2 text-sm text-destructive-foreground bg-destructive/90 rounded-md flex items-center gap-2 mt-1">
              <AlertTriangle className="w-4 h-4" />
              ¡Fecha Ocupada!
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="eventoHoraInicio" className="text-base">Hora de Inicio</Label>
          <Input
            id="eventoHoraInicio"
            type="time"
            value={formData.eventoHoraInicio || ''}
            onChange={(e) => handleChange('eventoHoraInicio', e.target.value)}
            className="text-base p-3"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invitadosAdultos" className="text-base">Nº Adultos</Label>
          <Input
            id="invitadosAdultos"
            type="number"
            step="1"
            placeholder="Ej: 50"
            value={formData.invitadosAdultos ?? ''}
            onChange={(e) => handleChange('invitadosAdultos', e.target.value === '' ? null : Number(e.target.value))}
            min="0"
            className="text-base p-3"
          />
          {formData.invitadosAdultos !== null && formData.invitadosAdultos !== undefined && (!Number.isInteger(formData.invitadosAdultos) || formData.invitadosAdultos < 0) && (
            <p role="alert" className="text-xs font-medium text-destructive">Ingresá un número entero mayor o igual a 0.</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="invitadosNinos" className="text-base">Nº Niños y Adolescentes</Label>
          <Input
            id="invitadosNinos"
            type="number"
            step="1"
            placeholder="Ej: 10"
            value={menores ?? ''}
            onChange={(e) => cambiarMenores(e.target.value === '' ? null : Number(e.target.value))}
            min="0"
            className="text-base p-3"
          />
          {formData.invitadosNinos !== null && formData.invitadosNinos !== undefined && (!Number.isInteger(formData.invitadosNinos) || formData.invitadosNinos < 0) && (
            <p role="alert" className="text-xs font-medium text-destructive">Ingresá un número entero mayor o igual a 0.</p>
          )}
        </div>
      </div>
    </div>
  );
}
