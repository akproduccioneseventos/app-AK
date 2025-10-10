
'use client';

import type { InvitacionDigitalData } from '@/types/fiesta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface Props {
  data: InvitacionDigitalData['cuentaRegresiva'];
  update: (newData: Partial<InvitacionDigitalData>) => void;
}

export const SeccionCuentaRegresiva: React.FC<Props> = ({ data, update }) => {
  const handleFieldChange = (field: keyof typeof data, value: boolean) => {
    update({ cuentaRegresiva: { ...data, [field]: value } });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sección: Cuenta Regresiva</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="countdown-visible">Mostrar esta sección</Label>
          <Switch
            id="countdown-visible"
            checked={data.visible}
            onCheckedChange={(checked) => handleFieldChange('visible', checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
};
