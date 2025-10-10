
'use client';

import type { InvitacionDigitalData, GiftItem } from '@/types/fiesta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { UploadButton } from './UploadButton';

interface Props {
  data: InvitacionDigitalData['regalos'];
  update: (newData: Partial<InvitacionDigitalData>) => void;
}

export const SeccionRegalos: React.FC<Props> = ({ data, update }) => {
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


  return (
    <Card>
      <CardHeader>
        <CardTitle>Sección: Lista de Regalos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="regalos-visible">Mostrar esta sección</Label>
          <Switch
            id="regalos-visible"
            checked={data.visible}
            onCheckedChange={(checked) => handleFieldChange('visible', checked)}
          />
        </div>
        {data.visible && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-1">
              <Label>Imagen de Fondo</Label>
              <UploadButton
                currentUrl={data.imagenFondoUrl}
                onUrlChange={(url) => handleFieldChange('imagenFondoUrl', url)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="regalos-titulo">Título</Label>
              <Input id="regalos-titulo" value={data.titulo || ''} onChange={(e) => handleFieldChange('titulo', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="regalos-texto">Texto introductorio</Label>
              <Textarea id="regalos-texto" value={data.texto || ''} onChange={(e) => handleFieldChange('texto', e.target.value)} rows={3}/>
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
        )}
      </CardContent>
    </Card>
  );
};
