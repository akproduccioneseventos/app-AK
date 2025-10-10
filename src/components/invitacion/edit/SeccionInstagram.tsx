
'use client';

import type { InvitacionDigitalData } from '@/types/fiesta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

interface Props {
  data: InvitacionDigitalData['instagram'];
  update: (newData: Partial<InvitacionDigitalData>) => void;
}

export const SeccionInstagram: React.FC<Props> = ({ data, update }) => {
  const handleFieldChange = (field: keyof typeof data, value: string | boolean) => {
    update({ instagram: { ...data, [field]: value } });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sección: Instagram Hashtag</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="instagram-visible">Mostrar esta sección</Label>
          <Switch
            id="instagram-visible"
            checked={data.visible}
            onCheckedChange={(checked) => handleFieldChange('visible', checked)}
          />
        </div>
        {data.visible && (
          <div className="space-y-3 pt-2 border-t">
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
        )}
      </CardContent>
    </Card>
  );
};
