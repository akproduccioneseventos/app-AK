
'use client';

import type { InvitacionDigitalData } from '@/types/fiesta';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { EditableText } from './EditableText';
import { TextStyleEditor } from './TextStyleEditor';

interface Props {
  data: InvitacionDigitalData['dressCode'];
  update: (newData: Partial<InvitacionDigitalData['dressCode']>) => void;
}

export const SeccionDressCodeEditor: React.FC<Props> = ({ data, update }) => {

  const handleTextChange = (text: string) => {
    update({ texto: { ...(data.texto || {style:{}}), text } });
  };
  
  const handleStyleChange = (style: Partial<InvitacionDigitalData['dressCode']['texto']['style']>) => {
    update({ texto: { ...(data.texto || {style:{}}), style: { ...(data.texto?.style || {}), ...style} } });
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
  
  return (
    <div className="space-y-4 pt-2">
      <div className="p-3 border rounded-md">
        <Label>Texto del Código de Vestimenta</Label>
        <Input 
            value={data.texto.text || ''}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Ej: Elegante Sport"
        />
         <TextStyleEditor 
            style={data.texto.style || {}}
            onStyleChange={handleStyleChange}
        />
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
