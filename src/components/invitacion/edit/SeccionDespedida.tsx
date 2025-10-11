
'use client';

import type { InvitacionDigitalData } from '@/types/fiesta';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface Props {
  data: InvitacionDigitalData['despedida'];
  update: (newData: Partial<InvitacionDigitalData>) => void;
}

export const SeccionDespedidaEditor: React.FC<Props> = ({ data, update }) => {
  const handleFieldChange = (field: keyof typeof data, value: string | boolean) => {
    update({ despedida: { ...data, [field]: value } });
  };

  return (
    <div className="space-y-3 pt-2">
        <div className="space-y-1">
            <Label htmlFor="despedida-texto">Texto</Label>
            <Input
            id="despedida-texto"
            value={data.texto || ''}
            onChange={(e) => handleFieldChange('texto', e.target.value)}
            />
        </div>
    </div>
  );
};
