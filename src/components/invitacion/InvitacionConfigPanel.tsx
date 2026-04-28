'use client';

import React, { useState } from 'react';
import type { InvitacionDigitalConfig, InvitacionPlantillaId, InvitacionSectionId, InvitacionSectionConfig } from '@/types/fiesta';
import { PLANTILLA_INFO, TIPO_EVENTO_LABELS, DEFAULT_TYPOGRAPHY_CONFIG, DEFAULT_SECTIONS_CONFIG } from '@/lib/invitacion-config-defaults';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Palette, MapPin, Shirt, Gift, Users, Clock, Camera, MessageCircle, CalendarDays, Sparkles, LayoutTemplate, Type, Check, Plus, Trash2, Upload, Loader2, Link2, Layers, AlertCircle, ArrowUp, ArrowDown, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { uploadPublicPageAsset } from '@/app/actions/fiesta/assets.actions';
import { getErrorMessage } from '@/lib/error-utils';

interface Props {
  config: InvitacionDigitalConfig;
  onChange: (config: InvitacionDigitalConfig) => void;
  fiestaId?: string;
}

export function InvitacionConfigPanel({ config, onChange, fiestaId }: Props) {
  const { toast } = useToast();
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [galeriaUrlDraft, setGaleriaUrlDraft] = useState('');
  const [publishingUrl, setPublishingUrl] = useState<string | null>(null);

  const update = <K extends keyof InvitacionDigitalConfig>(key: K, value: InvitacionDigitalConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  const updateDressCode = (key: string, value: string) => {
    onChange({ ...config, dressCode: { ...config.dressCode, [key]: value } });
  };

  const updateRegalos = (key: string, value: string) => {
    onChange({ ...config, regalos: { ...config.regalos, [key]: value } });
  };

  const uploadFile = async (file: File): Promise<string> => {
    if (!fiestaId) {
      throw new Error('Guardá primero el evento para habilitar la subida de archivos.');
    }
    const formData = new FormData();
    formData.append('folder', fiestaId);
    formData.append('file', file);
    const result = await uploadPublicPageAsset(formData);
    if (!result.success || !result.url) {
      throw new Error(result.error || 'No se pudo subir el archivo.');
    }
    return result.url;
  };

  const handleFotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      event.target.value = '';
      return;
    }
    setIsUploadingCover(true);
    try {
      const url = await uploadFile(file);
      update('fotoPortada', url);
      toast({ title: 'Foto subida', description: 'La portada se actualizó correctamente.' });
    } catch (error: unknown) {
      toast({ title: 'Error', description: getErrorMessage(error, 'No se pudo subir la foto.'), variant: 'destructive' });
    } finally {
      setIsUploadingCover(false);
      event.target.value = '';
    }
  };

  const handleGaleriaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) {
      event.target.value = '';
      return;
    }
    setIsUploadingGallery(true);
    try {
      const uploaded = await Promise.all(files.map(uploadFile));
      update('galeriaFotos', [...(config.galeriaFotos || []), ...uploaded]);
      toast({ title: 'Galería actualizada', description: `${uploaded.length} foto(s) agregadas.` });
    } catch (error: unknown) {
      toast({ title: 'Error', description: getErrorMessage(error, 'No se pudieron subir las fotos.'), variant: 'destructive' });
    } finally {
      setIsUploadingGallery(false);
      event.target.value = '';
    }
  };

  const handlePublishToSocial = async (imageUrl: string) => {
    if (!fiestaId) return;
    setPublishingUrl(imageUrl);
    try {
      const { uploadSocialPost } = await import('@/app/actions/social-gallery');
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'gallery-photo.jpg', { type: blob.type || 'image/jpeg' });
      const formData = new FormData();
      formData.append('fiestaId', fiestaId);
      formData.append('file', file);
      formData.append('authorName', 'Organizador');
      formData.append('momentTag', 'galería');
      const result = await uploadSocialPost(formData);
      if (result.success) {
        toast({ title: '¡Foto publicada!', description: 'La foto aparece ahora en el mural social.' });
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch (e: unknown) {
      toast({ title: 'Error', description: getErrorMessage(e, 'No se pudo publicar la foto.'), variant: 'destructive' });
    } finally {
      setPublishingUrl(null);
    }
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
              <Label className="text-xs">{config.tipoEvento === 'boda' ? 'Nombre Novio/a 1' : 'Nombre de la Homenajeada'}</Label>
              <Input value={config.nombreHomenajeada} onChange={e => update('nombreHomenajeada', e.target.value)} placeholder="Ej: Valentina" />
            </div>
            {config.tipoEvento === 'boda' && (
              <div className="space-y-1">
                <Label className="text-xs">Nombre Novio/a 2</Label>
                <Input value={config.nombreHomenajeado2 || ''} onChange={e => update('nombreHomenajeado2', e.target.value)} placeholder="Ej: Martín" />
              </div>
            )}
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
            <div className="space-y-2">
              <Label className="text-xs">Foto de Portada</Label>
              {config.fotoPortada && (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={config.fotoPortada} alt="portada" className="w-full h-full object-cover" />
                </div>
              )}
              <label htmlFor="foto-portada-upload" className="cursor-pointer block">
                <Button variant="outline" size="sm" className="w-full pointer-events-none" asChild disabled={isUploadingCover}>
                  <span>
                    {isUploadingCover ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    {isUploadingCover ? 'Subiendo...' : 'Subir foto desde dispositivo'}
                  </span>
                </Button>
              </label>
              <input
                id="foto-portada-upload"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFotoUpload}
              />
              <Input value={config.fotoPortada} onChange={e => update('fotoPortada', e.target.value)} placeholder="O pegá una URL..." className="text-xs" />
            </div>
            <div className="space-y-2 border rounded-xl p-3 bg-slate-50/40">
              <Label className="text-xs">Galería de fotos</Label>
              <label htmlFor="galeria-fotos-upload" className="cursor-pointer block">
                <Button variant="outline" size="sm" className="w-full pointer-events-none" asChild disabled={isUploadingGallery}>
                  <span>
                    {isUploadingGallery ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    {isUploadingGallery ? 'Subiendo fotos...' : 'Subir fotos (múltiple)'}
                  </span>
                </Button>
              </label>
              <input
                id="galeria-fotos-upload"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleGaleriaUpload}
              />
              <div className="flex gap-2">
                <Input
                  value={galeriaUrlDraft}
                  onChange={e => setGaleriaUrlDraft(e.target.value)}
                  placeholder="Agregar foto por URL..."
                  className="text-xs"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={() => {
                    const url = galeriaUrlDraft.trim();
                    if (!url) return;
                    update('galeriaFotos', [...(config.galeriaFotos || []), url]);
                    setGaleriaUrlDraft('');
                  }}
                >
                  <Link2 className="w-4 h-4" />
                </Button>
              </div>
              {(config.galeriaFotos || []).length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {(config.galeriaFotos || []).map((url, index) => (
                    <div key={`${url}-${index}`} className="relative group rounded-md overflow-hidden border aspect-square">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Galería ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-90"
                        onClick={() => update('galeriaFotos', (config.galeriaFotos || []).filter((_, i) => i !== index))}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      {fiestaId && (
                        <button
                          type="button"
                          className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground rounded-lg p-1.5 text-[10px] flex items-center gap-1 shadow-lg disabled:opacity-50"
                          onClick={() => handlePublishToSocial(url)}
                          disabled={publishingUrl === url}
                          title="Publicar en mural social"
                        >
                          {publishingUrl === url
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <Share2 className="w-3 h-3" />}
                          Publicar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
            <div className="flex items-center gap-2">
              <Input type="color" value={config.colorSugeridoInvitados || '#000000'} onChange={e => update('colorSugeridoInvitados', e.target.value)} className="w-10 h-10 p-0.5 rounded-lg cursor-pointer" />
              <div className="flex-1">
                <Label className="text-xs">Color sugerido para invitados</Label>
                <Input value={config.colorSugeridoInvitados || ''} onChange={e => update('colorSugeridoInvitados', e.target.value)} className="h-7 text-xs" placeholder="#RRGGBB (opcional)" />
              </div>
            </div>
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
            <div className="flex items-center justify-between rounded-lg border p-2">
              <Label className="text-xs font-semibold">Mostrar dress code</Label>
              <Switch checked={config.mostrarDressCode} onCheckedChange={v => update('mostrarDressCode', v)} />
            </div>
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

        {/* ===== CRONOGRAMA ===== */}
        <AccordionItem value="cronograma">
          <AccordionTrigger className="text-sm font-bold"><CalendarDays className="w-4 h-4 mr-2" />Cronograma</AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            <p className="text-[10px] text-muted-foreground">Agregá las actividades del evento con su horario.</p>
            {(config.cronograma || []).map((item, index) => (
              <div key={index} className="flex items-start gap-2 border rounded-lg p-2">
                <div className="space-y-1 flex-shrink-0">
                  <Input
                    type="time"
                    value={item.hora}
                    onChange={e => {
                      const updated = [...(config.cronograma || [])];
                      updated[index] = { ...updated[index], hora: e.target.value };
                      update('cronograma', updated);
                    }}
                    className="h-8 w-24 text-xs"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Input
                    value={item.actividad}
                    onChange={e => {
                      const updated = [...(config.cronograma || [])];
                      updated[index] = { ...updated[index], actividad: e.target.value };
                      update('cronograma', updated);
                    }}
                    placeholder="Actividad"
                    className="h-8 text-xs"
                  />
                  <Input
                    value={item.icono || ''}
                    onChange={e => {
                      const updated = [...(config.cronograma || [])];
                      updated[index] = { ...updated[index], icono: e.target.value };
                      update('cronograma', updated);
                    }}
                    placeholder="Icono/emoji (opcional)"
                    className="h-8 text-xs"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                  onClick={() => {
                    const updated = (config.cronograma || []).filter((_, i) => i !== index);
                    update('cronograma', updated);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                const updated = [...(config.cronograma || []), { hora: '', actividad: '', icono: '' }];
                update('cronograma', updated);
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Agregar actividad
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* ===== DISEÑO Y TIPOGRAFÍA ===== */}
        <AccordionItem value="typography">
          <AccordionTrigger className="text-sm font-bold"><Type className="w-4 h-4 mr-2" />Diseño y tipografía</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <p className="text-[10px] text-muted-foreground">Controlá el tamaño y estilo del texto en la invitación.</p>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Título principal (móvil)</Label>
              <Select
                value={config.typography?.heroTitleMobile || DEFAULT_TYPOGRAPHY_CONFIG.heroTitleMobile}
                onValueChange={(v) => onChange({ ...config, typography: { ...DEFAULT_TYPOGRAPHY_CONFIG, ...config.typography, heroTitleMobile: v } })}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text-3xl sm:text-5xl">Pequeño</SelectItem>
                  <SelectItem value="text-4xl sm:text-6xl">Normal</SelectItem>
                  <SelectItem value="text-5xl sm:text-7xl">Grande</SelectItem>
                  <SelectItem value="text-6xl sm:text-8xl">Muy grande</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Título principal (escritorio)</Label>
              <Select
                value={config.typography?.heroTitleDesktop || DEFAULT_TYPOGRAPHY_CONFIG.heroTitleDesktop}
                onValueChange={(v) => onChange({ ...config, typography: { ...DEFAULT_TYPOGRAPHY_CONFIG, ...config.typography, heroTitleDesktop: v } })}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lg:text-6xl">Pequeño</SelectItem>
                  <SelectItem value="lg:text-7xl">Normal</SelectItem>
                  <SelectItem value="lg:text-8xl">Grande</SelectItem>
                  <SelectItem value="lg:text-9xl">Muy grande</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Títulos de sección</Label>
              <Select
                value={config.typography?.sectionTitle || DEFAULT_TYPOGRAPHY_CONFIG.sectionTitle}
                onValueChange={(v) => onChange({ ...config, typography: { ...DEFAULT_TYPOGRAPHY_CONFIG, ...config.typography, sectionTitle: v } })}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text-xl sm:text-2xl">Pequeño</SelectItem>
                  <SelectItem value="text-2xl sm:text-3xl">Normal</SelectItem>
                  <SelectItem value="text-3xl sm:text-4xl">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Texto del cuerpo</Label>
              <Select
                value={config.typography?.body || DEFAULT_TYPOGRAPHY_CONFIG.body}
                onValueChange={(v) => onChange({ ...config, typography: { ...DEFAULT_TYPOGRAPHY_CONFIG, ...config.typography, body: v } })}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text-sm">Pequeño</SelectItem>
                  <SelectItem value="text-base">Normal</SelectItem>
                  <SelectItem value="text-lg">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Texto de botones</Label>
              <Select
                value={config.typography?.button || DEFAULT_TYPOGRAPHY_CONFIG.button}
                onValueChange={(v) => onChange({ ...config, typography: { ...DEFAULT_TYPOGRAPHY_CONFIG, ...config.typography, button: v } })}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text-xs">Pequeño</SelectItem>
                  <SelectItem value="text-sm">Normal</SelectItem>
                  <SelectItem value="text-base">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Interlineado</Label>
              <Select
                value={config.typography?.lineHeight || DEFAULT_TYPOGRAPHY_CONFIG.lineHeight}
                onValueChange={(v) => onChange({ ...config, typography: { ...DEFAULT_TYPOGRAPHY_CONFIG, ...config.typography, lineHeight: v } })}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="leading-tight">Compacto</SelectItem>
                  <SelectItem value="leading-normal">Normal</SelectItem>
                  <SelectItem value="leading-relaxed">Relajado</SelectItem>
                  <SelectItem value="leading-loose">Amplio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Espaciado entre secciones</Label>
              <Select
                value={config.typography?.spacing || DEFAULT_TYPOGRAPHY_CONFIG.spacing}
                onValueChange={(v) => onChange({ ...config, typography: { ...DEFAULT_TYPOGRAPHY_CONFIG, ...config.typography, spacing: v } })}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compacto</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="spacious">Espacioso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground"
              onClick={() => onChange({ ...config, typography: DEFAULT_TYPOGRAPHY_CONFIG })}
            >
              Restaurar tipografía por defecto
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* ===== ESTADO DE SECCIONES ===== */}
        <AccordionItem value="sections">
          <AccordionTrigger className="text-sm font-bold"><Layers className="w-4 h-4 mr-2" />Estado de secciones</AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            <p className="text-[10px] text-muted-foreground">Activá, desactivá y reordenás las secciones de la invitación.</p>
            {(() => {
              const activeSections: InvitacionSectionConfig[] = config.sectionsConfig?.length
                ? [...config.sectionsConfig].sort((a, b) => a.order - b.order)
                : [...DEFAULT_SECTIONS_CONFIG];

              const sectionLabels: Record<InvitacionSectionId, string> = {
                hero: 'Portada',
                bienvenida: 'Mensaje de bienvenida',
                contador: 'Contador regresivo',
                cronograma: 'Cronograma',
                ubicacion: 'Ubicación',
                dressCode: 'Dress Code',
                galeria: 'Galería de fotos',
                regalos: 'Regalos / Transferencia',
                rsvp: 'RSVP / Confirmación',
                muroSocial: 'Portal social (mural)',
                ctaAk: 'CTA AK Producciones',
                footer: 'Pie de página',
              };

              const contentCheck: Record<InvitacionSectionId, boolean> = {
                hero: true,
                bienvenida: !!config.textoBienvenida,
                contador: !!(config.contadorActivo && !!config.fechaEvento),
                cronograma: !!(config.cronograma && config.cronograma.length > 0),
                ubicacion: !!(config.nombreSalon || config.direccionSalon || config.linkMaps),
                dressCode: !!(config.mostrarDressCode && config.dressCode?.tipo),
                galeria: !!(config.galeriaFotos && config.galeriaFotos.length > 0),
                regalos: config.regalos?.tipo !== 'ninguno',
                rsvp: !!config.rsvpActivo,
                muroSocial: !!config.portalSocialActivo,
                ctaAk: true,
                footer: true,
              };

              return activeSections.map((sec, idx) => {
                const hasContent = contentCheck[sec.id];
                const reason = !sec.visible
                  ? 'Desactivada manualmente'
                  : !hasContent
                    ? 'Sin contenido configurado'
                    : null;

                return (
                  <div key={sec.id} className="flex items-center gap-2 py-1 border-b last:border-0">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={idx === 0}
                        onClick={() => {
                          const updated = [...activeSections];
                          [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
                          updated.forEach((s, i) => { s.order = i + 1; });
                          onChange({ ...config, sectionsConfig: updated });
                        }}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={idx === activeSections.length - 1}
                        onClick={() => {
                          const updated = [...activeSections];
                          [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
                          updated.forEach((s, i) => { s.order = i + 1; });
                          onChange({ ...config, sectionsConfig: updated });
                        }}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                    <Switch
                      checked={sec.visible}
                      disabled={sec.id === 'hero'}
                      onCheckedChange={(checked) => {
                        const updated = activeSections.map((s) =>
                          s.id === sec.id ? { ...s, visible: checked } : s
                        );
                        onChange({ ...config, sectionsConfig: updated });
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{sectionLabels[sec.id]}</p>
                      {reason && (
                        <p className="text-[10px] text-amber-600 flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5 flex-shrink-0" />
                          {reason}
                        </p>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </div>
  );
}
