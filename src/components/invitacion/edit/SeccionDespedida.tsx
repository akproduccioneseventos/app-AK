

'use client';

import type { InvitacionDigitalData, TextWithStyle } from '@/types/fiesta';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { TextStyleEditor } from './TextStyleEditor';

interface Props {
  data: InvitacionDigitalData['despedida'];
  update: (newData: Partial<InvitacionDigitalData>) => void;
}

export const SeccionDespedidaEditor: React.FC<Props> = ({ data, update }) => {
  const handleFieldChange = (field: keyof typeof data, value: string | boolean) => {
    update({ despedida: { ...data, [field]: value } });
  };
  
  const handleTextStyleChange = (field: 'texto', style: Partial<TextWithStyle>) => {
    handleFieldChange(field, { ...(data[field] as TextWithStyle), ...style });
  }

  return (
    <div className="space-y-3 pt-2">
        <div className="space-y-2 p-2 border rounded-md">
            <Label>Texto de Despedida</Label>
            <Input
              value={data.texto.text || ''}
              onChange={(e) => handleTextStyleChange('texto', { text: e.target.value })}
            />
            <TextStyleEditor 
              style={data.texto.style || {}}
              onStyleChange={(newStyle) => handleTextStyleChange('texto', { style: newStyle })}
            />
        </div>
    </div>
  );
};
