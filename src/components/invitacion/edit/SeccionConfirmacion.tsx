
'use client';

import type { InvitacionDigitalData } from '@/types/fiesta';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

interface Props {
  data: InvitacionDigitalData['confirmacion'];
  update: (newData: Partial<InvitacionDigitalData['confirmacion']>) => void;
}

export const SeccionConfirmacionEditor: React.FC<Props> = ({ data, update }) => {
  const handleFieldChange = (field: keyof typeof data, value: boolean) => {
    update({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 border rounded-md">
        <Label htmlFor="confirmacion-visible" className="font-medium">Mostrar esta sección</Label>
        <Switch
          id="confirmacion-visible"
          checked={data.visible}
          onCheckedChange={(checked) => handleFieldChange('visible', checked)}
        />
      </div>
      
      {data.visible && (
        <Card className="bg-muted/40">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Ajustes del Formulario</CardTitle>
            <CardDescription className="text-xs">Configura qué datos solicitar al invitado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-relationship" className="text-sm font-medium">Solicitar etiqueta de relación</Label>
                <p className="text-[10px] text-muted-foreground">Permite al invitado elegir si es Familia, Amigo, etc.</p>
              </div>
              <Switch
                id="show-relationship"
                checked={data.showRelationshipTags}
                onCheckedChange={(checked) => handleFieldChange('showRelationshipTags', checked)}
              />
            </div>
            <Separator />
            <p className="text-[10px] text-muted-foreground italic">
              Nota: El sistema detecta automáticamente si el evento es una Boda para adaptar las opciones de relación.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
