
'use client';

import type { InvitacionDigitalData, TextWithStyle, TextStyle } from '@/types/fiesta';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { TextStyleEditor } from './TextStyleEditor';
import { Switch } from '@/components/ui/switch';

interface Props {
  data: InvitacionDigitalData['despedida'];
  update: (newData: Partial<InvitacionDigitalData['despedida']>) => void;
}

export const SeccionDespedidaEditor: React.FC<Props> = ({ data, update }) => {
  const handleFieldChange = <K extends keyof typeof data>(field: K, value: any) => {
    update({ ...data, [field]: value });
  };
  
  const handleTextStyleChange = (style: Partial<TextWithStyle['style']>) => {
    handleFieldChange('texto', { ...data.texto, style: { ...(data.texto.style || {}), ...style } });
  };
  
  const handleTextChange = (text: string) => {
    handleFieldChange('texto', { ...data.texto, text });
  };

  return (
    <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="despedida-visible">Mostrar esta sección</Label>
          <Switch
            id="despedida-visible"
            checked={data.visible}
            onCheckedChange={(checked) => handleFieldChange('visible', checked)}
          />
        </div>
        {data.visible && (
            <div className="space-y-2 p-2 border rounded-md">
                <Label>Texto de Despedida</Label>
                <Input
                  value={data.texto.text || ''}
                  onChange={(e) => handleTextChange(e.target.value)}
                />
                <TextStyleEditor 
                  style={data.texto.style || {}}
                  onStyleChange={handleTextStyleChange}
                />
            </div>
        )}
    </div>
  );
};
