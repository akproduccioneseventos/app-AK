
'use client';

import type { InvitacionDigitalData } from '@/types/fiesta';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UploadButton } from './UploadButton';

interface Props {
  data: InvitacionDigitalData['historia'];
  update: (newData: Partial<InvitacionDigitalData>) => void;
  fiestaId?: string;
}

export const SeccionHistoriaEditor: React.FC<Props> = ({ data, update, fiestaId }) => {
    const handleFieldChange = (field: keyof typeof data, value: string | boolean) => {
        const historiaData = data || { visible: false, titulo: '', texto: '' };
        update({ historia: { ...historiaData, [field]: value } });
    };

  return (
    <div className="space-y-3 pt-2">
        <div className="space-y-1">
            <Label>Imagen de Fondo</Label>
            <UploadButton
            currentUrl={data?.imagenFondoUrl}
            onUrlChange={(url) => handleFieldChange('imagenFondoUrl', url)}
            fiestaId={fiestaId}
            />
        </div>
        <div className="space-y-1">
            <Label htmlFor="historia-titulo">Título</Label>
            <Input
            id="historia-titulo"
            value={data?.titulo || ''}
            onChange={(e) => handleFieldChange('titulo', e.target.value)}
            />
        </div>
        <div className="space-y-1">
            <Label htmlFor="historia-texto">Texto</Label>
            <Textarea
            id="historia-texto"
            value={data?.texto || ''}
            onChange={(e) => handleFieldChange('texto', e.target.value)}
            rows={5}
            />
        </div>
    </div>
  );
};
