'use client';

import type { InvitacionDigitalData, TextWithStyle, TextStyle } from '@/types/fiesta';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { UploadButton } from './UploadButton';
import { TextStyleEditor } from './TextStyleEditor';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

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
  
  const handleColorChange = (type: 'sugeridos' | 'evitar', index: number, value: string) => {
    const newColors = [...(data[type] || [])];
    newColors[index] = value;
    handleFieldChange(type, newColors as any);
  }

  const addColor = (type: 'sugeridos' | 'evitar') => {
    const newColors = [...(data[type] || []), '#000000'];
    handleFieldChange(type, newColors as any);
  }
  
  const removeColor = (type: 'sugeridos' | 'evitar', index: number) => {
    const newColors = (data[type] || []).filter((_, i) => i !== index);
    handleFieldChange(type, newColors as any);
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
                <Label>Título del Código de Vestimenta (Ej: Formal, Elegante)</Label>
                <Input
                  value={data.texto?.text || ''}
                  onChange={(e) => handleTextChange(e.target.value)}
                />
                <TextStyleEditor 
                  style={data.texto?.style || {}}
                  onStyleChange={handleTextStyleChange}
                />
            </div>

            <Separator/>
            
            <div className="space-y-2">
              <Label>Colores Sugeridos</Label>
              <div className="grid grid-cols-4 gap-2">
                {(data.sugeridos || []).map((color, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <Input type="color" value={color} onChange={e => handleColorChange('sugeridos', index, e.target.value)} className="w-8 h-8 p-0.5"/>
                    <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground" onClick={() => removeColor('sugeridos', index)}><Trash2 className="w-4 h-4"/></Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={() => addColor('sugeridos')}>Añadir Color Sugerido</Button>
            </div>
            
             <div className="space-y-2">
              <Label>Colores a Evitar</Label>
              <div className="grid grid-cols-4 gap-2">
                {(data.evitar || []).map((color, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <Input type="color" value={color} onChange={e => handleColorChange('evitar', index, e.target.value)} className="w-8 h-8 p-0.5"/>
                    <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground" onClick={() => removeColor('evitar', index)}><Trash2 className="w-4 h-4"/></Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={() => addColor('evitar')}>Añadir Color a Evitar</Button>
            </div>

        </>
        )}
    </div>
  );
};
