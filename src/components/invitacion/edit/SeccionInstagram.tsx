
'use client';

import type { InvitacionDigitalData, TextWithStyle, TextStyle } from '@/types/fiesta';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { TextStyleEditor } from './TextStyleEditor';

interface Props {
  data: InvitacionDigitalData['instagram'];
  update: (newData: Partial<InvitacionDigitalData['instagram']>) => void;
}

export const SeccionInstagramEditor: React.FC<Props> = ({ data, update }) => {
  const handleFieldChange = (field: keyof typeof data, value: string | boolean) => {
    update({ ...data, [field]: value });
  };
  
  const handleTextStyleChange = (style: Partial<TextStyle>) => {
    const newTextData = { ...data.texto, style: { ...(data.texto?.style || {}), ...style }};
    update({ ...data, texto: newTextData });
  }
  
  const handleTextChange = (text: string) => {
    const newTextData = { ...data.texto, text };
    update({ ...data, texto: newTextData });
  }

  return (
    <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="instagram-visible">Mostrar esta sección</Label>
          <Switch
            id="instagram-visible"
            checked={data.visible}
            onCheckedChange={(checked) => handleFieldChange('visible', checked)}
          />
        </div>
        {data.visible && (
        <>
            <div className="space-y-1">
                <Label htmlFor="instagram-hashtag">Hashtag del Evento</Label>
                <Input
                id="instagram-hashtag"
                value={data.hashtag || ''}
                onChange={(e) => handleFieldChange('hashtag', e.target.value)}
                placeholder="#BodaAnaYJuan"
                />
            </div>
            <div className="space-y-2 p-2 border rounded-md">
                <Label>Texto de la Sección</Label>
                <Input
                value={data.texto?.text || ''}
                onChange={(e) => handleTextChange(e.target.value)}
                />
                <TextStyleEditor 
                style={data.texto?.style || {}}
                onStyleChange={handleTextStyleChange}
                />
            </div>
        </>
        )}
    </div>
  );
};
