
'use client';

import type { InvitacionDigitalData, TextWithStyle, TextStyle } from '@/types/fiesta';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { TextStyleEditor } from './TextStyleEditor';

interface Props {
  data: InvitacionDigitalData['redesSociales'];
  update: (newData: Partial<InvitacionDigitalData['redesSociales']>) => void;
}

export const SeccionRedesSocialesEditor: React.FC<Props> = ({ data, update }) => {
  const handleFieldChange = (field: keyof typeof data, value: string | boolean) => {
    update({ ...data, [field]: value });
  };
  
  const handleTextStyleChange = (style: Partial<TextStyle>) => {
    const newTextData = { ...(data.texto as any), style: { ...((data.texto as any)?.style || {}), ...style }};
    update({ ...data, texto: newTextData });
  }
  
  const handleTextChange = (text: string) => {
    const newTextData = { ...(data.texto as any), text };
    update({ ...data, texto: newTextData });
  }

  return (
    <div className="space-y-3 pt-2">
        {/* The visibility switch is now in the parent SectionEditorPanel */}
        <>
            <div className="space-y-1">
                <Label htmlFor="redessociales-hashtag">Hashtag del Evento</Label>
                <Input
                id="redessociales-hashtag"
                value={data.hashtag || ''}
                onChange={(e) => handleFieldChange('hashtag', e.target.value)}
                placeholder="#BodaAnaYJuan"
                />
            </div>
            <div className="space-y-2 p-2 border rounded-md">
                <Label>Texto de la Sección</Label>
                <Input
                value={(data.texto as any)?.text || ''}
                onChange={(e) => handleTextChange(e.target.value)}
                />
                <TextStyleEditor 
                style={(data.texto as any)?.style || {}}
                onStyleChange={handleTextStyleChange}
                />
            </div>
        </>
    </div>
  );
};
