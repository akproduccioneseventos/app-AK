
'use client';

import type { InvitacionDigitalData } from '@/types/fiesta';
import { Label } from '@/components/ui/label';
import { UploadButton } from './UploadButton';

interface Props {
  data: InvitacionDigitalData['itinerario'];
  update: (newData: Partial<InvitacionDigitalData>) => void;
  fiestaId?: string;
}

export const SeccionItinerarioEditor: React.FC<Props> = ({ data, update, fiestaId }) => {
  const handleFieldChange = (field: keyof typeof data, value: string | boolean) => {
    update({ itinerario: { ...data, [field]: value } });
  };

  return (
    <div className="space-y-3 pt-2">
        <div className="space-y-1">
            <Label>Imagen de Fondo</Label>
            <UploadButton
            currentUrl={data.imagenFondoUrl}
            onUrlChange={(url) => handleFieldChange('imagenFondoUrl', url)}
            fiestaId={fiestaId}
            />
        </div>
        <p className="text-xs text-muted-foreground">
            El itinerario se toma automáticamente del módulo de "Cronograma" del planificador.
        </p>
    </div>
  );
};
