
'use client';

import type { InvitacionDigitalData, TextStyle, TextWithStyle } from '@/types/fiesta';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Image as ImageIcon } from 'lucide-react';
import { TextStyleEditor } from './TextStyleEditor';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { UploadButton } from './UploadButton';
import { Separator } from '@/components/ui/separator';

interface Props {
  data: InvitacionDigitalData['dressCode'];
  update: (newData: Partial<InvitacionDigitalData['dressCode']>) => void;
  fiestaId?: string;
}

export const SeccionDressCodeEditor: React.FC<Props> = ({ data, update, fiestaId }) => {
  const handleFieldChange = (field: keyof typeof data, value: any) => {
    update({ ...data, [field]: value });
  };
  
  const handleTextChange = (text: string) => {
    const textData: TextWithStyle = {
      ...(data.texto || { style: {} }),
      text: text,
    };
    update({ texto: textData });
  };

  const handleStyleChange = (style: Partial<TextStyle>) => {
    const textData: TextWithStyle = {
      ...(data.texto || { text: 'Formal' }),
      style: { ...(data.texto?.style || {}), ...style },
    };
    update({ texto: textData });
  };

  const handleColorChange = (type: 'sugeridos' | 'evitar', index: number, color: string) => {
    const currentColors = data[type] || [];
    const newColors = [...currentColors];
    newColors[index] = color;
    update({ [type]: newColors });
  };

  const addColor = (type: 'sugeridos' | 'evitar') => {
    const currentColors = data[type] || [];
    update({ [type]: [...currentColors, '#000000'] });
  };

  const removeColor = (type: 'sugeridos' | 'evitar', index: number) => {
    const currentColors = data[type] || [];
    update({ [type]: currentColors.filter((_, i) => i !== index) });
  };
  
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleTextChange(event.target.value);
  };
  
  const isPredefined = data.texto?.text === 'Formal' || data.texto?.text === 'Informal';

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
      <Separator />

      <div className="p-3 border rounded-md">
        <Label>Tipo de Vestimenta</Label>
        <RadioGroup
          value={isPredefined ? data.texto.text : 'Otro'}
          onValueChange={(value) => handleTextChange(value === 'Otro' ? '' : value)}
          className="mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Formal" id="dress-formal" />
            <Label htmlFor="dress-formal">Formal</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Informal" id="dress-informal" />
            <Label htmlFor="dress-informal">Informal</Label>
          </div>
           <div className="flex items-center space-x-2">
            <RadioGroupItem value="Otro" id="dress-otro" />
            <Label htmlFor="dress-otro">Otro (especificar)</Label>
          </div>
        </RadioGroup>
        {!isPredefined && (
             <Input
                type="text"
                value={data.texto?.text || ''}
                onChange={handleInputChange}
                className="mt-2"
                placeholder="Ej: Elegante Sport"
             />
        )}
      </div>

      <div className="p-3 border rounded-md space-y-2">
        <Label>Colores Sugeridos (Opcional)</Label>
        <div className="grid grid-cols-4 gap-2">
          {(data.sugeridos || []).map((color, index) => (
            <div key={index} className="flex items-center gap-1">
              <Input type="color" value={color} onChange={(e) => handleColorChange('sugeridos', index, e.target.value)} className="w-8 h-8 p-0.5"/>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeColor('sugeridos', index)}><Trash2 className="w-4 h-4"/></Button>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={() => addColor('sugeridos')}>Añadir Color Sugerido</Button>
      </div>
      
       <div className="p-3 border rounded-md space-y-2">
        <Label>Colores a Evitar (Opcional)</Label>
        <div className="grid grid-cols-4 gap-2">
          {(data.evitar || []).map((color, index) => (
            <div key={index} className="flex items-center gap-1">
              <Input type="color" value={color} onChange={(e) => handleColorChange('evitar', index, e.target.value)} className="w-8 h-8 p-0.5"/>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeColor('evitar', index)}><Trash2 className="w-4 h-4"/></Button>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={() => addColor('evitar')}>Añadir Color a Evitar</Button>
      </div>
    </div>
  );
};
