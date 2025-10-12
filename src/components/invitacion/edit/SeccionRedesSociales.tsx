'use client';

import type { InvitacionDigitalData, TextWithStyle, TextStyle } from '@/types/fiesta';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { TextStyleEditor } from './TextStyleEditor';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Props {
  data: InvitacionDigitalData['redesSociales'];
  update: (newData: Partial<InvitacionDigitalData['redesSociales']>) => void;
  fiestaId?: string;
}

export const SeccionRedesSocialesEditor: React.FC<Props> = ({ data, update, fiestaId }) => {
  const handleFieldChange = (field: keyof typeof data, value: string | boolean) => {
    update({ ...data, [field]: value });
  };
  
  const handleTextStyleChange = (style: Partial<TextStyle>) => {
    const textData = data.texto || { text: '', style: {} };
    handleFieldChange('texto', { ...textData, style: { ...(textData.style || {}), ...style } });
  }
  
  const handleTextChange = (text: string) => {
    const textData = data.texto || { style: {} };
    handleFieldChange('texto', { ...textData, text });
  }

  return (
    <div className="space-y-3 pt-2">
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
            value={data.texto?.text || ''}
            onChange={(e) => handleTextChange(e.target.value)}
            />
            <TextStyleEditor 
            style={data.texto?.style || {}}
            onStyleChange={handleTextStyleChange}
            />
        </div>
        {fiestaId && (
            <div className="text-center pt-2">
                <Button variant="outline" asChild>
                    <Link href={`/evento/social/${fiestaId}`} target="_blank">
                        Ir al Muro Social en vivo
                    </Link>
                </Button>
            </div>
        )}
    </div>
  );
};
