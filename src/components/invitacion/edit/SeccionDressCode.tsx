
'use client';

import type { InvitacionDigitalData } from '@/types/fiesta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { UploadButton } from './UploadButton';

interface Props {
  data: InvitacionDigitalData['dressCode'];
  update: (newData: Partial<InvitacionDigitalData>) => void;
}

export const SeccionDressCode: React.FC<Props> = ({ data, update }) => {
  const handleFieldChange = (field: keyof typeof data, value: string | boolean) => {
    update({ dressCode: { ...data, [field]: value } });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sección: Código de Vestimenta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="dresscode-visible">Mostrar esta sección</Label>
          <Switch
            id="dresscode-visible"
            checked={data.visible}
            onCheckedChange={(checked) => handleFieldChange('visible', checked)}
          />
        </div>
        {data.visible && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-1">
              <Label>Imagen de Fondo</Label>
              <UploadButton
                currentUrl={data.imagenFondoUrl}
                onUrlChange={(url) => handleFieldChange('imagenFondoUrl', url)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dresscode-texto">Texto</Label>
              <Input
                id="dresscode-texto"
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
