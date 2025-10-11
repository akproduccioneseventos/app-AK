
'use client';

import type { InvitacionDigitalData, ColorPalette } from '@/types/fiesta';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { UploadButton } from './UploadButton';
import { Separator } from '@/components/ui/separator';

interface Props {
  data: InvitacionDigitalData['cabecera'];
  update: (newData: Partial<InvitacionDigitalData>) => void;
  fiestaId?: string;
}

export const SeccionCabeceraEditor: React.FC<Props> = ({ data, update, fiestaId }) => {
  
  const handleFieldChange = (field: keyof typeof data, value: string | boolean) => {
    update({ cabecera: { ...data, [field]: value } });
  };
  
  const handleColorChange = (colorType: keyof ColorPalette, value: string) => {
    update({
      cabecera: {
        ...data,
        paletaColores: {
          ...(data.paletaColores || { primary: '', secondary: '', accent: '' }),
          [colorType]: value,
        },
      },
    });
  };

  return (
    <div className="space-y-4">
        <div className="space-y-1">
            <Label>Imagen/Video de Fondo</Label>
            <UploadButton
            currentUrl={data.videoFondoUrl}
            onUrlChange={(url) => handleFieldChange('videoFondoUrl', url)}
            accept="image/*,video/*"
            fiestaId={fiestaId}
            />
        </div>
        <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
            <Label htmlFor="cabecera-p1">Protagonista 1</Label>
            <Input
                id="cabecera-p1"
                value={data.protagonista1 || ''}
                onChange={(e) => handleFieldChange('protagonista1', e.target.value)}
            />
            </div>
            <div className="space-y-1">
            <Label htmlFor="cabecera-p2">Protagonista 2 (opcional)</Label>
            <Input
                id="cabecera-p2"
                value={data.protagonista2 || ''}
                onChange={(e) => handleFieldChange('protagonista2', e.target.value)}
            />
            </div>
        </div>
        <Separator />
        <div className="space-y-2">
            <Label className="font-medium">Paleta de Colores</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(['primary', 'secondary', 'accent'] as Array<keyof ColorPalette>).map(key => (
                <div key={key} className="space-y-1">
                <Label htmlFor={`color-${key}`} className="text-xs capitalize">{key}</Label>
                <div className="flex items-center gap-1">
                    <Input type="color" id={`color-${key}`} value={data.paletaColores?.[key] || '#000000'} onChange={e => handleColorChange(key, e.target.value)} className="w-8 h-8 p-0.5 aspect-square"/>
                    <Input type="text" value={data.paletaColores?.[key] || '#000000'} onChange={e => handleColorChange(key, e.target.value)} className="h-8 text-xs" placeholder="#RRGGBB"/>
                </div>
                </div>
            ))}
            </div>
        </div>
    </div>
  );
};
