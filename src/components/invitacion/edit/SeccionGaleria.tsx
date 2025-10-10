
'use client';

import type { InvitacionDigitalData } from '@/types/fiesta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface Props {
  data: InvitacionDigitalData['galeria'];
  update: (newData: Partial<InvitacionDigitalData>) => void;
}

export const SeccionGaleria: React.FC<Props> = ({ data, update }) => {
  const handleFieldChange = (field: keyof typeof data, value: boolean) => {
    update({ galeria: { ...data, [field]: value } });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sección: Galería de Fotos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="galeria-visible">Mostrar esta sección</Label>
          <Switch
            id="galeria-visible"
            checked={data.visible}
            onCheckedChange={(checked) => handleFieldChange('visible', checked)}
          />
        </div>
        {data.visible && <p className="text-xs text-muted-foreground">Las fotos se gestionan desde el módulo principal de la Página del Evento.</p>}
      </CardContent>
    </Card>
  );
};
