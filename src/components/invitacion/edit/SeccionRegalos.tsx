
'use client';

import type { InvitacionDigitalData, GiftItem, TextWithStyle } from '@/types/fiesta';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { UploadButton } from './UploadButton';
import { TextStyleEditor } from './TextStyleEditor';
import { Separator } from '@/components/ui/separator';
import React from 'react';


interface Props {
  data: InvitacionDigitalData['regalos'];
  update: (newData: Partial<InvitacionDigitalData>) => void;
  fiestaId?: string;
}

export const SeccionRegalos: React.FC<Props> = ({ data, update, fiestaId }) => {
  const handleFieldChange = (field: keyof typeof data, value: any) => {
    update({ regalos: { ...data, [field]: value } });
  };
  
  const handleItemChange = (itemId: string, field: keyof GiftItem, value: string) => {
    const updatedItems = (data.items || []).map(item =>
      item.id === itemId ? { ...item, [field]: value } : item
    );
    handleFieldChange('items', updatedItems);
  };

  const addItem = () => {
    const newItem: GiftItem = {
      id: `gift_${Date.now()}`,
      name: 'Nuevo Regalo',
      isClaimed: false
    };
    handleFieldChange('items', [...(data.items || []), newItem]);
  };

  const deleteItem = (itemId: string) => {
     handleFieldChange('items', (data.items || []).filter(i => i.id !== itemId));
  };
  
  const handleTextStyleChange = (field: 'titulo' | 'texto', style: Partial<TextWithStyle>) => {
    handleFieldChange(field, { ...(data[field] as TextWithStyle), ...style });
  }

  return (
    <div className="space-y-4">
        <div className="space-y-1">
            <Label>Imagen de Fondo</Label>
            <UploadButton
            currentUrl={data.imagenFondoUrl}
            onUrlChange={(url) => handleFieldChange('imagenFondoUrl', url)}
            fiestaId={fiestaId}
            />
        </div>
        <Separator />
        <div className="space-y-2 p-2 border rounded-md">
            <Label>Título</Label>
            <Input value={data.titulo.text || ''} onChange={(e) => handleTextStyleChange('titulo', { text: e.target.value })} />
             <TextStyleEditor 
                style={data.titulo.style || {}}
                onStyleChange={(newStyle) => handleTextStyleChange('titulo', { style: newStyle })}
            />
        </div>
        <div className="space-y-2 p-2 border rounded-md">
            <Label>Texto introductorio</Label>
            <Textarea value={data.texto.text || ''} onChange={(e) => handleTextStyleChange('texto', { text: e.target.value })} rows={3}/>
             <TextStyleEditor 
                style={data.texto.style || {}}
                onStyleChange={(newStyle) => handleTextStyleChange('texto', { style: newStyle })}
            />
        </div>
        <div className="space-y-1">
            <Label htmlFor="regalos-banco">Datos Bancarios (o link)</Label>
            <Textarea id="regalos-banco" value={data.datosBancarios || ''} onChange={(e) => handleFieldChange('datosBancarios', e.target.value)} rows={2} placeholder="Ej: Banco Itaú, C.A. $ 12345678"/>
        </div>
        <div className="space-y-2">
            <Label>Ítems de Regalo</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {(data.items || []).map(item => (
                    <div key={item.id} className="p-2 border rounded-md space-y-2 bg-background">
                        <Input value={item.name} onChange={e => handleItemChange(item.id, 'name', e.target.value)} placeholder="Nombre del regalo"/>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteItem(item.id)}><Trash2 className="w-4 h-4"/></Button>
                        </div>
                    </div>
                ))}
            </div>
            <Button variant="outline" size="sm" type="button" onClick={addItem}><PlusCircle className="w-4 h-4 mr-2"/>Añadir Ítem</Button>
        </div>
    </div>
  );
};
