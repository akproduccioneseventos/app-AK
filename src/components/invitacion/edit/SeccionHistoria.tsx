
'use client';

import type { InvitacionDigitalData } from '@/types/fiesta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { UploadButton } from './UploadButton';

interface Props {
  data: InvitacionDigitalData['historia'];
  update: (newData: Partial<InvitacionDigitalData>) => void;
}

export const SeccionHistoriaEditor: React.FC<Props> = ({ data, update }) => {
  const handleFieldChange = (field: keyof typeof data, value: string | boolean) => {
    update({ historia: { ...data, [field]: value } });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sección: Nuestra Historia</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="historia-visible">Mostrar esta sección</Label>
          <Switch
            id="historia-visible"
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
              <Label htmlFor="historia-titulo">Título</Label>
              <Input
                id="historia-titulo"
                value={data.titulo || ''}
                onChange={(e) => handleFieldChange('titulo', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="historia-texto">Texto</Label>
              <Textarea
                id="historia-texto"
                value={data.texto || ''}
                onChange={(e) => handleFieldChange('texto', e.target.value)}
                rows={5}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
