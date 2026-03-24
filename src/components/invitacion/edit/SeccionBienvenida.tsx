
'use client';

import type { InvitacionDigitalData, TextWithStyle } from '@/types/fiesta';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UploadButton } from './UploadButton';
import { TextStyleEditor } from './TextStyleEditor';

interface Props {
  data: InvitacionDigitalData['bienvenida'];
  update: (newData: Partial<InvitacionDigitalData['bienvenida']>) => void;
  fiestaId?: string;
}

export const SeccionBienvenidaEditor: React.FC<Props> = ({ data, update, fiestaId }) => {
  const handleFieldChange = <K extends keyof typeof data>(field: K, value: (typeof data)[K]) => {
    update({ ...data, [field]: value });
  };

  const handleTextStyleChange = (field: 'titulo' | 'texto', style: Partial<TextWithStyle>) => {
    handleFieldChange(field, { ...(data[field] as TextWithStyle), ...style });
  };

  return (
    <div className="space-y-4 pt-2">
        <div className="space-y-1">
            <Label>Imagen de Fondo</Label>
            <UploadButton
                currentUrl={data.imagenFondoUrl}
                onUrlChange={(url) => handleFieldChange('imagenFondoUrl', url)}
                fiestaId={fiestaId}
            />
        </div>
      <div className="space-y-2 p-2 border rounded-md">
        <Label>Título</Label>
        <Input
          value={data.titulo.text || ''}
          onChange={(e) => handleTextStyleChange('titulo', { text: e.target.value })}
        />
        <TextStyleEditor 
          style={data.titulo.style || {}}
          onStyleChange={(newStyle) => handleTextStyleChange('titulo', { style: newStyle })}
        />
      </div>
       <div className="space-y-2 p-2 border rounded-md">
        <Label>Texto de Bienvenida</Label>
        <Textarea
          value={data.texto.text || ''}
          onChange={(e) => handleTextStyleChange('texto', { text: e.target.value })}
          rows={4}
        />
         <TextStyleEditor 
          style={data.texto.style || {}}
          onStyleChange={(newStyle) => handleTextStyleChange('texto', { style: newStyle })}
        />
      </div>
    </div>
  );
};
