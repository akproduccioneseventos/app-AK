
'use client';

import type { InvitacionDigitalData, TextWithStyle, TextStyle } from '@/types/fiesta';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { TextStyleEditor } from './TextStyleEditor';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CameraIcon, Download } from 'lucide-react';
import QRCodeStylized from 'qrcode.react';

interface Props {
  data: InvitacionDigitalData['redesSociales'];
  update: (newData: Partial<InvitacionDigitalData['redesSociales']>) => void;
  fiestaId?: string;
}

export const SeccionRedesSocialesEditor: React.FC<Props> = ({ data, update, fiestaId }) => {
  const handleFieldChange = (field: keyof typeof data, value: unknown) => {
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

  const downloadQR = () => {
    const canvas = document.getElementById('qr-code-social-editor') as HTMLCanvasElement;
    if (canvas) {
        const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        let downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `qr-muro-social-${fiestaId}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }
  };

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
                         <QRCodeStylized id="qr-code-social-editor" value={socialWallUrl} size={80} />
                      </div>
                      <Button size="sm" variant="link" className="text-xs" onClick={downloadQR}>
                        <Download className="w-3 h-3 mr-1" /> Descargar QR
                      </Button>
                    </div>
                </div>
            )}
        </>
        )}
    </div>
  );
};
