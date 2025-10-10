
'use client';

import type { InvitacionDigitalData } from '@/types/fiesta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface Props {
  data: InvitacionDigitalData['confirmacion'];
  update: (newData: Partial<InvitacionDigitalData>) => void;
}

export const SeccionConfirmacion: React.FC<Props> = ({ data, update }) => {
  const handleFieldChange = (field: keyof typeof data, value: boolean) => {
    update({ confirmacion: { ...data, [field]: value } });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sección: Confirmación de Asistencia (RSVP)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="confirmacion-visible">Mostrar esta sección</Label>
          <Switch
            id="confirmacion-visible"
            checked={data.visible}
            onCheckedChange={(checked) => handleFieldChange('visible', checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
};
