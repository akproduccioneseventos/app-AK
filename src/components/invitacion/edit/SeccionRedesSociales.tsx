
'use client';

import type { InvitacionDigitalData, TextWithStyle, TextStyle } from '@/types/fiesta';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { TextStyleEditor } from './TextStyleEditor';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CameraIcon } from 'lucide-react';
import QRCodeStylized from 'qrcode.react';

interface Props {
  data: InvitacionDigitalData['redesSociales'];
  update: (newData: Partial<InvitacionDigitalData['redesSociales']>) => void;
  fiestaId?: string;
}

export const SeccionRedesSocialesEditor: React.FC<Props> = ({ data, update, fiestaId }) => {
  const handleFieldChange = (field: keyof typeof data, value: string | boolean) => {
    update({ ...data, [field]: value });
  };
  
  const handleTextStyleChange = (style: Partial<TextStyle>) => {
    const textData = data.texto || { text: '', style: {} };
    handleFieldChange('texto', { ...textData, style: { ...(textData.style || {}), ...style } });
  }
  
  const handleTextChange = (text: string) => {
    const textData = data.texto || { style: {} };
    handleFieldChange('texto', { ...textData, text });
  }
  
  const getFullLink = (path: string) => {
    if (typeof window === 'undefined' || !fiestaId) return '';
    return `${window.location.origin}${path.replace('[fiestaId]', fiestaId)}`;
  }
  
  const socialWallUrl = getFullLink('/evento/social/[fiestaId]');

  return (
    <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="redes-visible">Mostrar esta sección</Label>
          <Switch
            id="redes-visible"
            checked={data.visible}
            onCheckedChange={(checked) => handleFieldChange('visible', checked)}
          />
        </div>
        {data.visible && (
        <>
            <div className="space-y-1">
                <Label htmlFor="redessociales-hashtag">Hashtag del Evento</Label>
                <Input
                id="redessociales-hashtag"
                value={data.hashtag || ''}
                onChange={(e) => handleFieldChange('hashtag', e.target.value)}
                placeholder="#BodaAnaYJuan"
                />
            </div>
            <div className="space-y-2 p-2 border rounded-md">
                <Label>Texto de la Sección</Label>
                <Input
                value={data.texto?.text || ''}
                onChange={(e) => handleTextChange(e.target.value)}
                />
                <TextStyleEditor 
                style={data.texto?.style || {}}
                onStyleChange={handleTextStyleChange}
                />
            </div>
            {fiestaId && (
                <div className="text-center pt-2 space-y-4">
                    <Button variant="outline" asChild>
                        <Link href={`/evento/social/${fiestaId}`} target="_blank">
                            <CameraIcon className="w-4 h-4 mr-2" />
                            Ir al Muro Social en vivo
                        </Link>
                    </Button>
                    <div className="p-2 border rounded-md bg-muted/40">
                      <Label className="text-xs text-muted-foreground">Código QR para el Muro Social</Label>
                      <div className="flex justify-center mt-2">
                         <QRCodeStylized value={socialWallUrl} size={80} />
                      </div>
                    </div>
                </div>
            )}
        </>
        )}
    </div>
  );
};
