

'use client';

import type { InvitacionDigitalData, TextWithStyle } from '@/types/fiesta';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { UploadButton } from './UploadButton';
import { TextStyleEditor } from './TextStyleEditor';

interface Props {
  data: InvitacionDigitalData['dressCode'];
  update: (newData: Partial<InvitacionDigitalData>) => void;
  fiestaId?: string;
}

export const SeccionDressCodeEditor: React.FC<Props> = ({ data, update, fiestaId }) => {
  const handleFieldChange = (field: keyof typeof data, value: string | boolean) => {
    update({ dressCode: { ...data, [field]: value } });
  };

  const handleTextStyleChange = (field: 'texto', style: Partial<TextWithStyle>) => {
    handleFieldChange(field, { ...(data[field] as TextWithStyle), ...style });
  }

  return (
    <div className="space-y-3 pt-2">
        <div className="space-y-1">
            <Label>Imagen de Fondo</Label>
            <UploadButton
            currentUrl={data.imagenFondoUrl}
            onUrlChange={(url) => handleFieldChange('imagenFondoUrl', url)}
            fiestaId={fiestaId}
            />
        </div>
        <div className="space-y-2 p-2 border rounded-md">
            <Label>Texto del Código de Vestimenta</Label>
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
