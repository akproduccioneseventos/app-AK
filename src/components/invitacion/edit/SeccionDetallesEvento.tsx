
'use client';

import type { InvitacionDigitalData } from '@/types/fiesta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { UploadButton } from './UploadButton';

interface Props {
  data: InvitacionDigitalData['detallesEvento'];
  update: (newData: Partial<InvitacionDigitalData>) => void;
}

export const SeccionDetallesEventoEditor: React.FC<Props> = ({ data, update }) => {
  const handleFieldChange = (field: keyof typeof data, value: string | boolean) => {
    update({ detallesEvento: { ...data, [field]: value } });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sección: Detalles del Evento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="detalles-visible">Mostrar esta sección</Label>
          <Switch
            id="detalles-visible"
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
            <div className="flex items-center justify-between">
                <Label htmlFor="padres-visible">Mostrar Info de Padres</Label>
                <Switch
                    id="padres-visible"
                    checked={data.infoPadresVisible}
                    onCheckedChange={(checked) => handleFieldChange('infoPadresVisible', checked)}
                />
            </div>
            {data.infoPadresVisible && (
              <div className="grid grid-cols-2 gap-3 p-3 border rounded-md">
                <div className="space-y-1"><Label htmlFor="padre1-nombre">Padre (P1)</Label><Input id="padre1-nombre" value={data.nombrePadre1 || ''} onChange={e => handleFieldChange('nombrePadre1', e.target.value)} /></div>
                <div className="space-y-1"><Label htmlFor="madre1-nombre">Madre (P1)</Label><Input id="madre1-nombre" value={data.nombreMadre1 || ''} onChange={e => handleFieldChange('nombreMadre1', e.target.value)} /></div>
                <div className="space-y-1"><Label htmlFor="padre2-nombre">Padre (P2)</Label><Input id="padre2-nombre" value={data.nombrePadre2 || ''} onChange={e => handleFieldChange('nombrePadre2', e.target.value)} /></div>
                <div className="space-y-1"><Label htmlFor="madre2-nombre">Madre (P2)</Label><Input id="madre2-nombre" value={data.nombreMadre2 || ''} onChange={e => handleFieldChange('nombreMadre2', e.target.value)} /></div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
