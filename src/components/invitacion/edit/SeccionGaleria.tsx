'use client';

import type { InvitacionDigitalData } from '@/types/fiesta';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { UploadButton } from './UploadButton';
import { Trash2 } from 'lucide-react';
import NextImage from 'next/image';

interface Props {
  data: InvitacionDigitalData['galeria'];
  update: (newData: Partial<InvitacionDigitalData['galeria']>) => void;
  fiestaId?: string;
}

export const SeccionGaleriaEditor: React.FC<Props> = ({ data, update, fiestaId }) => {
  const handleFieldChange = (field: keyof typeof data, value: boolean) => {
    update({ ...data, [field]: value });
  };
  
  const handleAddPhoto = (url: string) => {
    const newPhotos = [...(data.fotos || []), url];
    update({ ...data, fotos: newPhotos });
  };

  const handleRemovePhoto = (urlToRemove: string) => {
    const newPhotos = (data.fotos || []).filter(url => url !== urlToRemove);
    update({ ...data, fotos: newPhotos });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 border rounded-md">
        <Label htmlFor="galeria-visible">Mostrar esta sección</Label>
        <Switch
          id="galeria-visible"
          checked={data.visible}
          onCheckedChange={(checked) => handleFieldChange('visible', checked)}
        />
      </div>
      {data.visible && (
        <Card className="bg-muted/40">
          <CardHeader>
            <CardTitle className="text-md">Fotos de la Galería</CardTitle>
            <CardDescription>Sube las fotos que aparecerán en el carrusel de la invitación.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-2">
                <Label>Añadir Nueva Foto</Label>
                <UploadButton
                    onUrlChange={handleAddPhoto}
                    fiestaId={fiestaId}
                    accept="image/*"
                />
            </div>
            {data.fotos && data.fotos.length > 0 && (
              <div className="mt-4 space-y-3">
                <h4 className="text-sm font-medium">Fotos Actuales:</h4>
                <div className="grid grid-cols-3 gap-2">
                  {data.fotos.map((url, index) => (
                    <div key={`${url}-${index}`} className="relative group aspect-square">
                      <NextImage src={url} alt={`Foto de galería ${index + 1}`} layout="fill" objectFit="cover" className="rounded-md" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleRemovePhoto(url)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
