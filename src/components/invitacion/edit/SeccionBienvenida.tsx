
'use client';

import type { InvitacionDigitalData } from '@/types/fiesta';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UploadButton } from './UploadButton';

interface Props {
  data: InvitacionDigitalData['bienvenida'];
  update: (newData: Partial<InvitacionDigitalData>) => void;
  fiestaId?: string;
}

export const SeccionBienvenidaEditor: React.FC<Props> = ({ data, update, fiestaId }) => {
  const handleFieldChange = (field: keyof typeof data, value: string | boolean) => {
    update({ bienvenida: { ...data, [field]: value } });
  };

  return (
    <div className="space-y-3 pt-2">
        <div className="space-y-1">
            <Label htmlFor="bienvenida-titulo">Título</Label>
            <Input
            id="bienvenida-titulo"
            value={data.titulo || ''}
            onChange={(e) => handleFieldChange('titulo', e.target.value)}
            />
        </div>
        <div className="space-y-1">
            <Label htmlFor="bienvenida-texto">Texto de Bienvenida</Label>
            <Textarea
            id="bienvenida-texto"
            value={data.texto || ''}
            onChange={(e) => handleFieldChange('texto', e.target.value)}
            rows={4}
            />
        </div>
        <div className="space-y-1">
            <Label>Imagen de Fondo</Label>
            <UploadButton
            currentUrl={data.imagenFondoUrl}
            onUrlChange={(url) => handleFieldChange('imagenFondoUrl', url)}
            fiestaId={fiestaId}
            />
        </div>
    </div>
  );
};
