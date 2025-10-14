
'use client';

import type { InvitacionDigitalData } from '@/types/fiesta';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface Props {
  data: InvitacionDigitalData['dressCode'];
  update: (newData: Partial<InvitacionDigitalData['dressCode']>) => void;
  fiestaId?: string;
}

export const SeccionDressCodeEditor: React.FC<Props> = ({ data, update, fiestaId }) => {
  const handleFieldChange = (field: keyof typeof data, value: string | boolean) => {
    update({ ...data, [field]: value });
  };

  return (
    <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="dresscode-visible">Mostrar esta sección</Label>
          <Switch
            id="dresscode-visible"
            checked={data.visible}
            onCheckedChange={(checked) => handleFieldChange('visible', checked)}
          />
        </div>
        {data.visible && (
          <div className="space-y-4 pt-2">
            <RadioGroup 
              value={data.tipo || 'Formal'} 
              onValueChange={(value: 'Formal' | 'Informal') => handleFieldChange('tipo', value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Formal" id="dress-formal" />
                <Label htmlFor="dress-formal">Formal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Informal" id="dress-informal" />
                <Label htmlFor="dress-informal">Informal</Label>
              </div>
            </RadioGroup>
          </div>
        )}
    </div>
  );
};
