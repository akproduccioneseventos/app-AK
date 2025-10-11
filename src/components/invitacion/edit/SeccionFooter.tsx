
'use client';

import type { InvitacionDigitalData, TextWithStyle, TextStyle } from '@/types/fiesta';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { TextStyleEditor } from './TextStyleEditor';
import React from 'react';
import { Switch } from '@/components/ui/switch';

interface Props {
  data: InvitacionDigitalData['footer'];
  update: (newData: Partial<InvitacionDigitalData['footer']>) => void;
}

export const SeccionFooterEditor: React.FC<Props> = ({ data, update }) => {
  
  const handleFieldChange = <K extends keyof typeof data>(field: K, value: any) => {
    update({ ...data, [field]: value });
  };
  
  const handleTextStyleChange = (field: 'titulo' | 'nombreEmpresa', style: Partial<TextStyle>) => {
    const textData = data[field] || { text: '' };
    handleFieldChange(field, { ...textData, style: { ...(textData.style || {}), ...style } });
  }

  const handleTextChange = (field: 'titulo' | 'nombreEmpresa', text: string) => {
    const textData = data[field] || { style: {} };
    handleFieldChange(field, { ...textData, text });
  }

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="footer-visible">Mostrar esta sección</Label>
          <Switch
            id="footer-visible"
            checked={data.visible}
            onCheckedChange={(checked) => handleFieldChange('visible', checked)}
          />
        </div>
        {data.visible && (
        <>
            <div className="space-y-2 p-2 border rounded-md">
                <Label>Título (Llamada a la acción)</Label>
                <Input
                value={data.titulo.text || ''}
                onChange={(e) => handleTextChange('titulo', e.target.value)}
                />
                <TextStyleEditor 
                style={data.titulo.style || {}}
                onStyleChange={(newStyle) => handleTextStyleChange('titulo', newStyle)}
                />
            </div>
            <div className="space-y-2 p-2 border rounded-md">
                <Label>Nombre de la Empresa</Label>
                <Input
                value={data.nombreEmpresa.text || ''}
                onChange={(e) => handleTextChange('nombreEmpresa', e.target.value)}
                />
                <TextStyleEditor 
                style={data.nombreEmpresa.style || {}}
                onStyleChange={(newStyle) => handleTextStyleChange('nombreEmpresa', newStyle)}
                />
            </div>
        </>
        )}
    </div>
  );
};
