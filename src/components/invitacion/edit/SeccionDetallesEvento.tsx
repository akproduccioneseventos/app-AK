
'use client';

import type { InvitacionDigitalData, DetalleEventoEspecifico } from '@/types/fiesta';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Church, Building, PartyPopper } from 'lucide-react';
import React from 'react';
import { UploadButton } from './UploadButton';


interface Props {
  data: InvitacionDigitalData['detallesEvento'];
  update: (newData: Partial<InvitacionDigitalData['detallesEvento']>) => void;
  fiestaId?: string;
}

type DetalleKey = 'ceremoniaReligiosa' | 'ceremoniaCivil' | 'celebracion';

const DetalleEditor: React.FC<{
  detalle: DetalleEventoEspecifico;
  title: string;
  icon: React.ElementType;
  fiestaId?: string;
  onUpdate: (newData: DetalleEventoEspecifico) => void;
}> = ({ detalle, title, icon: Icon, fiestaId, onUpdate }) => {

  const handleFieldChange = <K extends keyof DetalleEventoEspecifico>(field: K, value: DetalleEventoEspecifico[K]) => {
    onUpdate({ ...detalle, [field]: value });
  };
  
  const handleDateChange = (date?: Date) => {
    handleFieldChange('fecha', date?.toISOString());
  };

  return (
    <Card className="bg-muted/40">
        <Accordion type="single" collapsible defaultValue={detalle.visible ? "item-1" : ""}>
            <AccordionItem value="item-1" className="border-b-0">
                <div className="flex items-center p-3">
                    <AccordionTrigger className="hover:no-underline flex-1">
                       <div className="flex items-center gap-2 font-semibold">
                          <Icon className="w-5 h-5 text-primary"/> {title}
                       </div>
                    </AccordionTrigger>
                     <Switch
                        checked={detalle.visible}
                        onCheckedChange={(checked) => handleFieldChange('visible', checked)}
                        className="ml-4"
                    />
                </div>
                <AccordionContent className="px-4 pb-4 border-t">
                    <div className="space-y-4 pt-4">
                        <div className="space-y-1"><Label>Título</Label><Input value={detalle.titulo || ''} onChange={e => handleFieldChange('titulo', e.target.value)} /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1"><Label>Fecha</Label><DatePickerDemo selectedDate={detalle.fecha ? new Date(detalle.fecha) : undefined} onDateChange={handleDateChange} /></div>
                            <div className="space-y-1"><Label>Hora</Label><Input type="time" value={detalle.hora || ''} onChange={e => handleFieldChange('hora', e.target.value)} /></div>
                        </div>
                        <div className="space-y-1"><Label>Nombre del Lugar</Label><Input value={detalle.nombreLugar || ''} onChange={e => handleFieldChange('nombreLugar', e.target.value)} /></div>
                        <div className="space-y-1"><Label>Dirección</Label><Input value={detalle.direccionLugar || ''} onChange={e => handleFieldChange('direccionLugar', e.target.value)} /></div>
                        <div className="space-y-1"><Label>URL Google Maps</Label><Input type="url" value={detalle.mapaUrl || ''} onChange={e => handleFieldChange('mapaUrl', e.target.value)} /></div>
                        <div className="space-y-1"><Label>Imagen del Lugar</Label><UploadButton currentUrl={detalle.imagenUrl} onUrlChange={url => handleFieldChange('imagenUrl', url)} fiestaId={fiestaId}/></div>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    </Card>
  );
};


export const SeccionDetallesEventoEditor: React.FC<Props> = ({ data, update, fiestaId }) => {
  
  const handleDetalleUpdate = (key: DetalleKey, newData: DetalleEventoEspecifico) => {
    update({ [key]: newData });
  };

  return (
    <div className="space-y-4 pt-2">
      <DetalleEditor
        detalle={data.ceremoniaReligiosa}
        title="Ceremonia Religiosa"
        icon={Church}
        fiestaId={fiestaId}
        onUpdate={(newData) => handleDetalleUpdate('ceremoniaReligiosa', newData)}
      />
      <DetalleEditor
        detalle={data.ceremoniaCivil}
        title="Ceremonia Civil"
        icon={Building}
        fiestaId={fiestaId}
        onUpdate={(newData) => handleDetalleUpdate('ceremoniaCivil', newData)}
      />
      <DetalleEditor
        detalle={data.celebracion}
        title="Celebración / Fiesta"
        icon={PartyPopper}
        fiestaId={fiestaId}
        onUpdate={(newData) => handleDetalleUpdate('celebracion', newData)}
      />
    </div>
  );
};
