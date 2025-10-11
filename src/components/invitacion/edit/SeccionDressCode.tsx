
'use client';

import type { InvitacionDigitalData, TextWithStyle, TextStyle } from '@/types/fiesta';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { UploadButton } from './UploadButton';
import { TextStyleEditor } from './TextStyleEditor';
import { Switch } from '@/components/ui/switch';

interface Props {
  data: InvitacionDigitalData['dressCode'];
  update: (newData: Partial<InvitacionDigitalData['dressCode']>) => void;
  fiestaId?: string;
}

export const SeccionDressCodeEditor: React.FC<Props> = ({ data, update, fiestaId }) => {
  const handleFieldChange = (field: keyof typeof data, value: string | boolean) => {
    update({ ...data, [field]: value });
  };

  const handleTextStyleChange = (style: Partial<TextStyle>) => {
    const newTextData = { ...data.texto, style: { ...(data.texto?.style || {}), ...style }};
    update({ ...data, texto: newTextData });
  }
  
  const handleTextChange = (text: string) => {
    const newTextData = { ...data.texto, text };
    update({ ...data, texto: newTextData });
  }

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
                <Label>Texto del Código de Vestimenta</Label>
                <Input
                value={data.texto?.text || ''}
                onChange={(e) => handleTextChange(e.target.value)}
                />
                <TextStyleEditor 
                style={data.texto?.style || {}}
                onStyleChange={handleTextStyleChange}
                />
            </div>
        </>
        )}
    </div>
  );
};
