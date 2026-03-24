
'use client';

import type { InvitacionDigitalData, TextWithStyle, TextStyle } from '@/types/fiesta';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UploadButton } from './UploadButton';
import { TextStyleEditor } from './TextStyleEditor';
import { Switch } from '@/components/ui/switch';

interface Props {
  data: InvitacionDigitalData['historia'];
  update: (newData: Partial<InvitacionDigitalData['historia']>) => void;
  fiestaId?: string;
}

export const SeccionHistoriaEditor: React.FC<Props> = ({ data, update, fiestaId }) => {
    const handleFieldChange = (field: keyof typeof data, value: string | boolean) => {
        const historiaData = data || { visible: false, titulo: { text: '' }, texto: { text: '' } };
        update({ ...historiaData, [field]: value });
    };

    const handleTextStyleChange = (field: 'titulo' | 'texto', style: Partial<TextStyle>) => {
      const fieldData = data?.[field] || { text: '' };
      const newTextData = { ...fieldData, style: { ...(fieldData.style || {}), ...style }};
      update({ ...data, [field]: newTextData });
    }

    const handleTextChange = (field: 'titulo' | 'texto', text: string) => {
        const fieldData = data?.[field] || { text: '', style: {} };
        const newTextData = { ...fieldData, text };
        update({ ...data, [field]: newTextData });
    }

  return (
    <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="historia-visible">Mostrar esta sección</Label>
          <Switch
            id="historia-visible"
            checked={data?.visible}
            onCheckedChange={(checked) => handleFieldChange('visible', checked)}
          />
        </div>
        {data?.visible && (
        <>
            <div className="space-y-1">
                <Label>Imagen de Fondo</Label>
                <UploadButton
                currentUrl={data.imagenFondoUrl}
                onUrlChange={(url) => handleFieldChange('imagenFondoUrl', url)}
                fiestaId={fiestaId}
                />
            </div>
            <div className="space-y-2 p-2 border rounded-md">
                <Label>Título de la Historia</Label>
                <Input
                value={data.titulo?.text || ''}
                onChange={(e) => handleTextChange('titulo', e.target.value)}
                />
                <TextStyleEditor 
                    style={data.titulo?.style || {}}
                    onStyleChange={(newStyle) => handleTextStyleChange('titulo', newStyle)}
                />
            </div>
            <div className="space-y-2 p-2 border rounded-md">
                <Label>Texto de la Historia</Label>
                <Textarea
                value={data.texto?.text || ''}
                onChange={(e) => handleTextChange('texto', e.target.value)}
                rows={5}
                />
                <TextStyleEditor 
                    style={data.texto?.style || {}}
                    onStyleChange={(newStyle) => handleTextStyleChange('texto', newStyle)}
                />
            </div>
        </>
        )}
    </div>
  );
};
