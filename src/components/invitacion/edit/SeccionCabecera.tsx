
'use client';

import type { InvitacionDigitalData, ColorPalette, TextWithStyle } from '@/types/fiesta';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { UploadButton } from './UploadButton';
import { Separator } from '@/components/ui/separator';
import { TextStyleEditor } from './TextStyleEditor';
import React from 'react';

interface Props {
  data: InvitacionDigitalData['cabecera'];
  update: (newData: Partial<InvitacionDigitalData['cabecera']>) => void;
  fiestaId?: string;
}

export const SeccionCabeceraEditor: React.FC<Props> = ({ data, update, fiestaId }) => {
  
  const handleFieldChange = (field: keyof typeof data, value: any) => {
    update({ [field]: value });
  };
  
  const handleColorChange = (colorType: keyof ColorPalette, value: string) => {
    update({
      paletaColores: {
        ...(data.paletaColores || { primary: '', secondary: '', accent: '' }),
        [colorType]: value,
      },
    });
  };

  const handleTextStyleChange = (field: 'subtitulo', style: Partial<TextWithStyle['style']>) => {
    const currentStyleData = data[field] || { text: '', style: {} };
    const newStyle = { ...currentStyleData.style, ...style };
    handleFieldChange(field, { ...currentStyleData, style: newStyle });
  };

  const handleSubtituloTextChange = (text: string) => {
     const currentStyleData = data.subtitulo || { text: '', style: {} };
     update({ subtitulo: { ...currentStyleData, text: text } });
  };

  return (
    <div className="space-y-4">
        <div className="space-y-1">
            <Label>Imagen/Video de Fondo</Label>
            <UploadButton
                currentUrl={data.videoFondoUrl || data.imagenFondoUrl}
                onUrlChange={(url) => {
                    const isVideo = url.endsWith('.mp4') || url.endsWith('.webm');
                    handleFieldChange(isVideo ? 'videoFondoUrl' : 'imagenFondoUrl', url);
                    if(isVideo) handleFieldChange('imagenFondoUrl', undefined);
                    else handleFieldChange('videoFondoUrl', undefined);
                }}
                accept="image/*,video/*"
                fiestaId={fiestaId}
            />
        </div>
        <Separator />
        <div className="space-y-2 p-2 border rounded-md">
            <Label>Subtítulo (Ej: "Nuestra Boda")</Label>
             <Input
                value={data.subtitulo?.text || ''}
                onChange={(e) => handleSubtituloTextChange(e.target.value)}
            />
            <TextStyleEditor 
                style={data.subtitulo?.style || {}}
                onStyleChange={(newStyle) => handleTextStyleChange('subtitulo', newStyle)}
            />
        </div>
        <Separator />
        <div className="space-y-2">
            <Label className="font-medium">Paleta de Colores</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(['primary', 'secondary', 'accent'] as Array<keyof ColorPalette>).map(key => (
                <div key={key} className="space-y-1">
                <Label htmlFor={`color-${key}`} className="text-xs capitalize">{key}</Label>
                <div className="flex items-center gap-1">
                    <Input type="color" id={`color-picker-${key}`} value={data.paletaColores?.[key] || '#000000'} onChange={e => handleColorChange(key, e.target.value)} className="w-8 h-8 p-0.5 aspect-square"/>
                    <Input type="text" id={`color-hex-${key}`} value={data.paletaColores?.[key] || '#000000'} onChange={e => handleColorChange(key, e.target.value)} className="h-8 text-xs" placeholder="#RRGGBB"/>
                </div>
                </div>
            ))}
            </div>
        </div>
    </div>
  );
};
