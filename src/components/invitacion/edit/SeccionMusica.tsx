
'use client';

import type { InvitacionDigitalData } from '@/types/fiesta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

interface Props {
  data: InvitacionDigitalData['musica'];
  update: (newData: Partial<InvitacionDigitalData['musica']>) => void;
}

export const SeccionMusicaEditor: React.FC<Props> = ({ data, update }) => {
  const handleFieldChange = (field: keyof typeof data, value: any) => {
    update({ ...data, [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sección: Sugerencias Musicales</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="musica-visible">Mostrar en el formulario RSVP</Label>
          <Switch
            id="musica-visible"
            checked={data.visible}
            onCheckedChange={(checked) => handleFieldChange('visible', checked)}
          />
        </div>
        {data.visible && (
            <div className="space-y-1 pt-2">
                <Label htmlFor="musica-placeholder">Texto de ejemplo en el campo</Label>
                <Input 
                    id="musica-placeholder"
                    value={data.placeholder || 'Ej: Bohemian Rhapsody - Queen'}
                    onChange={(e) => handleFieldChange('placeholder', e.target.value)}
                />
            </div>
        )}
      </CardContent>
    </Card>
  );
};
