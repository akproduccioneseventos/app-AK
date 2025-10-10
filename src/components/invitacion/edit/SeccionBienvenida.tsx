
'use client';

import type { InvitacionDigitalData } from '@/types/fiesta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { UploadButton } from './UploadButton';

interface Props {
  data: InvitacionDigitalData['bienvenida'];
  update: (newData: Partial<InvitacionDigitalData>) => void;
}

export const SeccionBienvenida: React.FC<Props> = ({ data, update }) => {
  const handleFieldChange = (field: keyof typeof data, value: string | boolean) => {
    update({ bienvenida: { ...data, [field]: value } });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sección: Bienvenida</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="bienvenida-visible">Mostrar esta sección</Label>
          <Switch
            id="bienvenida-visible"
            checked={data.visible}
            onCheckedChange={(checked) => handleFieldChange('visible', checked)}
          />
        </div>
        {data.visible && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-1">
              <Label htmlFor="bienvenida-titulo">Título</Label>
              <Input
                id="bienvenida-titulo"
                value={data.titulo || ''}
                onChange={(e) => handleFieldChange('titulo', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bienvenida-texto">Texto de Bienvenida</Label>
              <Textarea
                id="bienvenida-texto"
                value={data.texto || ''}
                onChange={(e) => handleFieldChange('texto', e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-1">
              <Label>Imagen de Fondo</Label>
              <UploadButton
                currentUrl={data.imagenFondoUrl}
                onUrlChange={(url) => handleFieldChange('imagenFondoUrl', url)}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
