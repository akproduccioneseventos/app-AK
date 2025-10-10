
'use client';

import type { InvitacionDigitalData } from '@/types/fiesta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { UploadButton } from './UploadButton';

interface Props {
  data: InvitacionDigitalData['cabecera'];
  update: (newData: Partial<InvitacionDigitalData>) => void;
}

export const SeccionCabeceraEditor: React.FC<Props> = ({ data, update }) => {
  const handleFieldChange = (field: keyof typeof data, value: string | boolean) => {
    update({ cabecera: { ...data, [field]: value } });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sección: Cabecera Principal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="cabecera-visible">Mostrar esta sección</Label>
          <Switch
            id="cabecera-visible"
            checked={data.visible}
            onCheckedChange={(checked) => handleFieldChange('visible', checked)}
          />
        </div>
        {data.visible && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-1">
              <Label>Imagen/Video de Fondo</Label>
              <UploadButton
                currentUrl={data.videoFondoUrl}
                onUrlChange={(url) => handleFieldChange('videoFondoUrl', url)}
                accept="image/*,video/*"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                <Label htmlFor="cabecera-p1">Protagonista 1</Label>
                <Input
                    id="cabecera-p1"
                    value={data.protagonista1 || ''}
                    onChange={(e) => handleFieldChange('protagonista1', e.target.value)}
                />
                </div>
                <div className="space-y-1">
                <Label htmlFor="cabecera-p2">Protagonista 2 (opcional)</Label>
                <Input
                    id="cabecera-p2"
                    value={data.protagonista2 || ''}
                    onChange={(e) => handleFieldChange('protagonista2', e.target.value)}
                />
                </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
