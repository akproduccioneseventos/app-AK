
'use client';

import type { InvitacionDigitalData } from '@/types/fiesta';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface Props {
  data: InvitacionDigitalData['instagram'];
  update: (newData: Partial<InvitacionDigitalData>) => void;
}

export const SeccionInstagramEditor: React.FC<Props> = ({ data, update }) => {
  const handleFieldChange = (field: keyof typeof data, value: string | boolean) => {
    update({ instagram: { ...data, [field]: value } });
  };

  return (
    <div className="space-y-3 pt-2">
        <div className="space-y-1">
            <Label htmlFor="instagram-hashtag">Hashtag del Evento</Label>
            <Input
            id="instagram-hashtag"
            value={data.hashtag || ''}
            onChange={(e) => handleFieldChange('hashtag', e.target.value)}
            placeholder="#BodaAnaYJuan"
            />
        </div>
        <div className="space-y-1">
            <Label htmlFor="instagram-texto">Texto de Invitación a Publicar</Label>
            <Input
            id="instagram-texto"
            value={data.texto || ''}
            onChange={(e) => handleFieldChange('texto', e.target.value)}
            />
        </div>
    </div>
  );
};
