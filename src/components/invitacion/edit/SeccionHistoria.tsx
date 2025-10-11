

'use client';

import type { InvitacionDigitalData, TextWithStyle } from '@/types/fiesta';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UploadButton } from './UploadButton';
import { TextStyleEditor } from './TextStyleEditor';

interface Props {
  data: InvitacionDigitalData['historia'];
  update: (newData: Partial<InvitacionDigitalData>) => void;
  fiestaId?: string;
}

export const SeccionHistoriaEditor: React.FC<Props> = ({ data, update, fiestaId }) => {
    const handleFieldChange = (field: keyof typeof data, value: string | boolean) => {
        const historiaData = data || { visible: false, titulo: { text: '' }, texto: { text: '' } };
        update({ historia: { ...historiaData, [field]: value } });
    };

    const handleTextStyleChange = (field: 'titulo' | 'texto', style: Partial<TextWithStyle>) => {
      const fieldData = data?.[field] || { text: '' };
      handleFieldChange(field, { ...fieldData, ...style });
    }

  return (
    <div className="space-y-3 pt-2">
        <div className="space-y-1">
            <Label>Imagen de Fondo</Label>
            <UploadButton
            currentUrl={data?.imagenFondoUrl}
            onUrlChange={(url) => handleFieldChange('imagenFondoUrl', url)}
            fiestaId={fiestaId}
            />
        </div>
        <div className="space-y-2 p-2 border rounded-md">
            <Label>Título de la Historia</Label>
            <Input
              value={data?.titulo?.text || ''}
              onChange={(e) => handleTextStyleChange('titulo', { text: e.target.value })}
            />
            <TextStyleEditor 
                style={data?.titulo?.style || {}}
                onStyleChange={(newStyle) => handleTextStyleChange('titulo', { style: newStyle })}
            />
        </div>
        <div className="space-y-2 p-2 border rounded-md">
            <Label>Texto de la Historia</Label>
            <Textarea
              value={data?.texto?.text || ''}
              onChange={(e) => handleTextStyleChange('texto', { text: e.target.value })}
              rows={5}
            />
            <TextStyleEditor 
                style={data?.texto?.style || {}}
                onStyleChange={(newStyle) => handleTextStyleChange('texto', { style: newStyle })}
            />
        </div>
    </div>
  );
};
