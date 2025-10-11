
'use client';

import type { InvitacionDigitalData, TextWithStyle } from '@/types/fiesta';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UploadButton } from './UploadButton';
import { TextStyleEditor } from './TextStyleEditor';

interface Props {
  data: InvitacionDigitalData['footer'];
  update: (newData: Partial<InvitacionDigitalData['footer']>) => void;
}

export const SeccionFooterEditor: React.FC<Props> = ({ data, update }) => {
  
  const handleFieldChange = <K extends keyof typeof data>(field: K, value: (typeof data)[K]) => {
    update({ ...data, [field]: value });
  };
  
  const handleTextStyleChange = (field: 'titulo' | 'nombreEmpresa', style: Partial<TextWithStyle>) => {
    handleFieldChange(field, { ...data[field], ...style });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Título (Llamada a la acción)</Label>
        <Input
          value={data.titulo.text || ''}
          onChange={(e) => handleTextStyleChange('titulo', { text: e.target.value })}
        />
        <TextStyleEditor 
          style={data.titulo.style}
          onStyleChange={(newStyle) => handleTextStyleChange('titulo', { style: newStyle })}
        />
      </div>
       <div className="space-y-2">
        <Label>Nombre de la Empresa</Label>
        <Input
          value={data.nombreEmpresa.text || ''}
          onChange={(e) => handleTextStyleChange('nombreEmpresa', { text: e.target.value })}
        />
        <TextStyleEditor 
          style={data.nombreEmpresa.style}
          onStyleChange={(newStyle) => handleTextStyleChange('nombreEmpresa', { style: newStyle })}
        />
      </div>
    </div>
  );
};
