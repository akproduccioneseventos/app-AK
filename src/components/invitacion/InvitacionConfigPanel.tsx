'use client';

import React from 'react';
import type { InvitacionDigitalConfig, InvitacionPlantillaId } from '@/types/fiesta';
import { PLANTILLA_INFO, TIPO_EVENTO_LABELS } from '@/lib/invitacion-config-defaults';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Palette, MapPin, Shirt, Gift, Users, Clock, Camera, MessageCircle, CalendarDays, Sparkles, LayoutTemplate, Type, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  config: InvitacionDigitalConfig;
  onChange: (config: InvitacionDigitalConfig) => void;
}

export function InvitacionConfigPanel({ config, onChange }: Props) {
  const update = <K extends keyof InvitacionDigitalConfig>(key: K, value: InvitacionDigitalConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  const updateDressCode = (key: string, value: string) => {
    onChange({ ...config, dressCode: { ...config.dressCode, [key]: value } });
  };

  const updateRegalos = (key: string, value: string) => {
    onChange({ ...config, regalos: { ...config.regalos, [key]: value } });
  };

  return (
    <div className="space-y-2 p-4">
      <Accordion type="multiple" defaultValue={['plantilla', 'basico', 'colores']} className="w-full">

        {/* ===== PLANTILLA ===== */}
        <AccordionItem value="plantilla">
          <AccordionTrigger className="text-sm font-bold"><LayoutTemplate className="w-4 h-4 mr-2" />Plantilla Visual</AccordionTrigger>
          <AccordionContent className="pt-2">
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(PLANTILLA_INFO).map(([id, info]) => (
                <button
                  key={id}
                  onClick={() => update('plantillaId', id as InvitacionPlantillaId)}
                  className={cn(
                    'p-3 rounded-xl border-2 text-left transition-all space-y-1',
                    config.plantillaId === id
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-gray-200 hover:border-primary/40'
                  )}
                >
                  <div className="text-2xl">{info.preview}</div>
                  <div className="text-xs font-bold">{info.nombre}</div>
                  <div className="text-[10px] text-muted-foreground leading-tight">{info.descripcion.length > 60 ? info.descripcion.slice(0, 60) + '...' : info.descripcion}</div>
                  {config.plantillaId === id && (
                    <div className="flex items-center gap-1 text-[10px] text-primary font-semibold">
                      <Check className="w-3 h-3" /> Activa
                    </div>
                  )}
                </button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ===== DATOS BÁSICOS ===== */}
        <AccordionItem value="basico">
          <AccordionTrigger className="text-sm font-bold"><Type className="w-4 h-4 mr-2" />Datos del Evento</AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label className="text-xs">Nombre de la Homenajeada</Label>
              <Input value={config.nombreHomenajeada} onChange={e => update('nombreHomenajeada', e.target.value)} placeholder="Ej: Valentina" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Tipo de Evento</Label>
                <Select value={config.tipoEvento} onValueChange={v => update('tipoEvento', v as InvitacionDigitalConfig['tipoEvento'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_EVENTO_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Estilo</Label>
                <Select value={config.estiloEvento} onValueChange={v => update('estiloEvento', v as InvitacionDigitalConfig['estiloEvento'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="semi-formal">Semi-Formal</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Fecha del Evento</Label>
                <Input type="date" value={config.fechaEvento?.split('T')[0] || ''} onChange={e => update('fechaEvento', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Hora</Label>
                <Input type="time" value={config.horaEvento} onChange={e => update('horaEvento', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Mensaje de Bienvenida</Label>
              <Textarea value={config.textoBienvenida} onChange={e => update('textoBienvenida', e.target.value)} placeholder="Un mensaje para tus invitados..." rows={3} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Foto de Portada (URL)</Label>
              <Input value={config.fotoPortada} onChange={e => update('fotoPortada', e.target.value)} placeholder="https://..." />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ===== COLORES ===== */}
        <AccordionItem value="colores">
          <AccordionTrigger className="text-sm font-bold"><Palette className="w-4 h-4 mr-2" />Colores Globales</AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            <p className="text-[10px] text-muted-foreground">Cambiá el color principal y TODA la invitación se actualiza automáticamente.</p>
            {[
              { key: 'colorPrincipal' as const, label: 'Color Principal' },
              { key: 'colorSecundario' as const, label: 'Color Secundario' },
              { key: 'colorAcento' as const, label: 'Color Acento' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <Input type="color" value={config[key]} onChange={e => update(key, e.target.value)} className="w-10 h-10 p-0.5 rounded-lg cursor-pointer" />
                <div className="flex-1">
                  <Label className="text-xs">{label}</Label>
                  <Input value={config[key]} onChange={e => update(key, e.target.value)} className="h-7 text-xs" placeholder="#RRGGBB" />
                </div>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* ===== UBICACIÓN ===== */}
        <AccordionItem value="ubicacion">
          <AccordionTrigger className="text-sm font-bold"><MapPin className="w-4 h-4 mr-2" />Ubicación</AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label className="text-xs">Nombre del Salón</Label>
              <Input value={config.nombreSalon} onChange={e => update('nombreSalon', e.target.value)} placeholder="Ej: Salón El Paraíso" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Dirección</Label>
              <Input value={config.direccionSalon} onChange={e => update('direccionSalon', e.target.value)} placeholder="Ej: Ruta 1 Km 10" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Link de Google Maps</Label>
              <Input value={config.linkMaps} onChange={e => update('linkMaps', e.target.value)} placeholder="https://maps.google.com/..." />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ===== DRESS CODE ===== */}
        <AccordionItem value="dresscode">
          <AccordionTrigger className="text-sm font-bold"><Shirt className="w-4 h-4 mr-2" />Dress Code</AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label className="text-xs">Tipo</Label>
              <Select value={config.dressCode.tipo} onValueChange={v => updateDressCode('tipo', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="semi-formal">Semi-Formal</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {config.dressCode.tipo === 'personalizado' && (
              <div className="space-y-1">
                <Label className="text-xs">Texto Personalizado</Label>
                <Input value={config.dressCode.textoPersonalizado || ''} onChange={e => updateDressCode('textoPersonalizado', e.target.value)} placeholder="Ej: Elegante con toque juvenil" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input type="color" value={config.dressCode.colorSugerido || '#000000'} onChange={e => updateDressCode('colorSugerido', e.target.value)} className="w-10 h-10 p-0.5 rounded-lg" />
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Color Sugerido (opcional)</Label>
                <Input value={config.dressCode.colorSugerido || ''} onChange={e => updateDressCode('colorSugerido', e.target.value)} className="h-7 text-xs" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Restricciones (opcional)</Label>
              <Input value={config.dressCode.restricciones || ''} onChange={e => updateDressCode('restricciones', e.target.value)} placeholder="Ej: No usar blanco" />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ===== REGALOS / DINERO ===== */}
        <AccordionItem value="regalos">
          <AccordionTrigger className="text-sm font-bold"><Gift className="w-4 h-4 mr-2" />Regalos / Dinero</AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label className="text-xs">Tipo</Label>
              <Select value={config.regalos.tipo} onValueChange={v => updateRegalos('tipo', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ninguno">No mostrar</SelectItem>
                  <SelectItem value="regalos">Solo Regalos</SelectItem>
                  <SelectItem value="dinero">Solo Dinero / Transferencia</SelectItem>
                  <SelectItem value="ambos">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Texto personalizado (opcional)</Label>
              <Textarea value={config.regalos.textoPersonalizado || ''} onChange={e => updateRegalos('textoPersonalizado', e.target.value)} rows={2} placeholder="Tu presencia es nuestro mejor regalo..." />
            </div>
            {(config.regalos.tipo === 'dinero' || config.regalos.tipo === 'ambos') && (
              <>
                <div className="border-t pt-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Datos Bancarios</p>
                  <Input value={config.regalos.aliasCBU || ''} onChange={e => updateRegalos('aliasCBU', e.target.value)} placeholder="Alias / CBU" />
                  <Input value={config.regalos.banco || ''} onChange={e => updateRegalos('banco', e.target.value)} placeholder="Banco" />
                  <Input value={config.regalos.titular || ''} onChange={e => updateRegalos('titular', e.target.value)} placeholder="Titular" />
                  <Input value={config.regalos.cuentaNumero || ''} onChange={e => updateRegalos('cuentaNumero', e.target.value)} placeholder="N° de Cuenta" />
                </div>
              </>
            )}
            {(config.regalos.tipo === 'regalos' || config.regalos.tipo === 'ambos') && (
              <div className="border-t pt-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Lista de Regalos</p>
                <Textarea value={config.regalos.instruccionesRegalos || ''} onChange={e => updateRegalos('instruccionesRegalos', e.target.value)} rows={2} placeholder="Instrucciones para regalos..." />
                <Input value={config.regalos.linkListaRegalos || ''} onChange={e => updateRegalos('linkListaRegalos', e.target.value)} placeholder="Link a lista de regalos (URL)" />
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* ===== EXTRAS ===== */}
        <AccordionItem value="extras">
          <AccordionTrigger className="text-sm font-bold"><Sparkles className="w-4 h-4 mr-2" />Extras</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Contador Regresivo</Label>
                <p className="text-[10px] text-muted-foreground">Muestra días/horas/minutos hasta el evento</p>
              </div>
              <Switch checked={config.contadorActivo} onCheckedChange={v => update('contadorActivo', v)} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />RSVP</Label>
                <p className="text-[10px] text-muted-foreground">Formulario de confirmación de asistencia</p>
              </div>
              <Switch checked={config.rsvpActivo} onCheckedChange={v => update('rsvpActivo', v)} />
            </div>
            {config.rsvpActivo && (
              <div className="space-y-1 pl-6">
                <Label className="text-xs">Texto RSVP (opcional)</Label>
                <Input value={config.rsvpTexto || ''} onChange={e => update('rsvpTexto', e.target.value)} placeholder="Confirma tu asistencia antes del..." />
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5"><Camera className="w-3.5 h-3.5" />Portal Social</Label>
                <p className="text-[10px] text-muted-foreground">Invitados pueden subir fotos</p>
              </div>
              <Switch checked={config.portalSocialActivo} onCheckedChange={v => update('portalSocialActivo', v)} />
            </div>
            {config.portalSocialActivo && (
              <div className="space-y-1 pl-6">
                <Label className="text-xs">Hashtag del Evento</Label>
                <Input value={config.hashtagEvento || ''} onChange={e => update('hashtagEvento', e.target.value)} placeholder="#MisXV" />
              </div>
            )}
            <div className="border-t pt-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" />WhatsApp</p>
              <Input value={config.whatsappNumero || ''} onChange={e => update('whatsappNumero', e.target.value)} placeholder="N° con código de país: 5491112345678" />
              <Input value={config.whatsappMensaje || ''} onChange={e => update('whatsappMensaje', e.target.value)} placeholder="Mensaje pre-armado (opcional)" />
            </div>
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </div>
  );
}
