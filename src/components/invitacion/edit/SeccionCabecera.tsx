'use client';

import type { InvitacionDigitalData, ColorPalette, TextStyle } from '@/types/fiesta';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UploadButton } from './UploadButton';
import { Separator } from '@/components/ui/separator';
import { TextStyleEditor } from './TextStyleEditor';
import { Loader2 } from 'lucide-react';
import { uploadPublicPageAsset } from '@/app/actions/fiesta/assets.actions';
import React, { useState } from 'react';

interface Props {
  data: InvitacionDigitalData['cabecera'];
  update: (newData: Partial<InvitacionDigitalData['cabecera']>) => void;
  fiestaId?: string;
  realidadAumentada?: InvitacionDigitalData['realidadAumentada'];
  updateRealidadAumentada?: (newAR: InvitacionDigitalData['realidadAumentada']) => void;
}

export const SeccionCabeceraEditor: React.FC<Props> = ({
  data,
  update,
  fiestaId,
  realidadAumentada,
  updateRealidadAumentada,
}) => {
  const arData = realidadAumentada || (data as any).realidadAumentada || {};

  const [arImagenUrl, setArImagenUrl] = useState<string>(arData.imagenUrl || '');
  const [arVideoUrl, setArVideoUrl] = useState<string>(arData.videoUrl || '');
  const [compilandoAR, setCompilandoAR] = useState(false);
  const [errorAR, setErrorAR] = useState<string | null>(null);
  const [exitoAR, setExitoAR] = useState<string | null>(null);

  const handleFieldChange = (field: keyof typeof data, value: any) => {
    update({ [field]: value });
  };

  const handleColorChange = (colorType: keyof ColorPalette, value: string) => {
    update({
      paletaColores: {
        ...(data.paletaColores || { primary: '', secondary: '', accent: '' }),
        [colorType]: value,
      },
    });
  };

  const handleTextStyleChange = (style: Partial<TextStyle>) => {
    const currentStyleData = data.subtitulo || { text: '', style: {} };
    const newStyle = { ...currentStyleData.style, ...style };
    handleFieldChange('subtitulo', { ...currentStyleData, style: newStyle });
  };

  const handleSubtituloTextChange = (text: string) => {
    const currentStyleData = data.subtitulo || { text: '', style: {} };
    update({ subtitulo: { ...currentStyleData, text: text } });
  };

  const handleArImagenChange = (url: string) => {
    setArImagenUrl(url);
    if (updateRealidadAumentada) {
      updateRealidadAumentada({ ...arData, imagenUrl: url });
    }
  };

  const handleArVideoChange = (url: string) => {
    setArVideoUrl(url);
    if (updateRealidadAumentada) {
      updateRealidadAumentada({ ...arData, videoUrl: url });
    }
  };

  const handleCompilarAR = async () => {
    setErrorAR(null);
    setExitoAR(null);
    const imagenAUsar = arImagenUrl || data.imagenFondoUrl;
    if (!imagenAUsar) {
      setErrorAR('Se necesita una imagen impresa o de fondo para compilar la realidad aumentada.');
      return;
    }
    if (!fiestaId) {
      setErrorAR('No se encontró el ID de la fiesta para guardar el archivo.');
      return;
    }
    setCompilandoAR(true);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('No se pudo cargar la imagen para compilar.'));
        img.src = imagenAUsar;
      });

      // @ts-ignore
      const { Compiler } = await import('@/lib/vendor/mind-ar/mindar-image.prod.js');
      const compiler = new Compiler();
      await compiler.compileImageTargets([img], () => {});
      const exportedBuffer = await compiler.exportData();
      const blob = new Blob([exportedBuffer], { type: 'application/octet-stream' });
      const file = new File([blob], 'targets.mind', { type: 'application/octet-stream' });

      const formData = new FormData();
      formData.append('folder', fiestaId);
      formData.append('file', file);
      const result = await uploadPublicPageAsset(formData);

      if (result.success && result.url) {
        const nuevoAR = {
          imagenUrl: arImagenUrl || undefined,
          videoUrl: arVideoUrl || undefined,
          mindTargetUrl: result.url,
        };
        if (updateRealidadAumentada) {
          updateRealidadAumentada(nuevoAR);
        }
        setExitoAR('¡Realidad aumentada compilada y guardada con éxito!');
      } else {
        throw new Error(result.error || 'Error al subir el archivo .mind compilado.');
      }
    } catch (err: any) {
      setErrorAR(err?.message || 'Falló la compilación de la realidad aumentada.');
    } finally {
      setCompilandoAR(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>Logo / Imagen Principal</Label>
        <UploadButton
          currentUrl={data.logoUrl}
          onUrlChange={(url) => handleFieldChange('logoUrl', url)}
          accept="image/*"
          fiestaId={fiestaId}
        />
      </div>
      <div className="space-y-1">
        <Label>Imagen/Video de Fondo</Label>
        <UploadButton
          currentUrl={data.videoFondoUrl || data.imagenFondoUrl}
          onUrlChange={(url) => {
            const isVideo = url.endsWith('.mp4') || url.endsWith('.webm');
            update({
              videoFondoUrl: isVideo ? url : undefined,
              imagenFondoUrl: !isVideo ? url : undefined,
            });
          }}
          accept="image/*,video/*"
          fiestaId={fiestaId}
        />
      </div>

      <Separator />

      {/* Sección Realidad Aumentada */}
      <div className="space-y-3 p-3 border rounded-md bg-zinc-900/40">
        <div className="flex items-center justify-between">
          <Label className="font-semibold text-sm">Realidad aumentada</Label>
          {arData.mindTargetUrl && (
            <span className="text-[11px] text-emerald-400 font-medium">✓ Compilado</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Los invitados apuntan la cámara a la invitación impresa y ven el video en movimiento.
        </p>

        <div className="space-y-1">
          <Label className="text-xs">Imagen impresa (marcador)</Label>
          <UploadButton
            currentUrl={arImagenUrl || data.imagenFondoUrl}
            onUrlChange={handleArImagenChange}
            accept="image/*"
            fiestaId={fiestaId}
          />
          <p className="text-[10px] text-muted-foreground">Si no subís una específica, se usa la imagen de fondo.</p>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Video para la tarjeta</Label>
          <UploadButton
            currentUrl={arVideoUrl}
            onUrlChange={handleArVideoChange}
            accept="video/*"
            fiestaId={fiestaId}
          />
        </div>

        {errorAR && (
          <div className="p-2 text-xs bg-red-950/60 border border-red-800 text-red-300 rounded">
            {errorAR}
          </div>
        )}

        {exitoAR && (
          <div className="p-2 text-xs bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded">
            {exitoAR}
          </div>
        )}

        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full text-xs"
          onClick={handleCompilarAR}
          disabled={compilandoAR}
        >
          {compilandoAR ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Compilando objetivo (.mind)...
            </>
          ) : (
            'Compilar Realidad Aumentada'
          )}
        </Button>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="protagonista1">Protagonista 1</Label>
          <Input id="protagonista1" value={data.protagonista1 || ''} onChange={(e) => handleFieldChange('protagonista1', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="protagonista2">Protagonista 2 (opcional, para bodas)</Label>
          <Input id="protagonista2" value={data.protagonista2 || ''} onChange={(e) => handleFieldChange('protagonista2', e.target.value)} />
        </div>
      </div>

      <Separator />

      <div className="space-y-2 p-2 border rounded-md">
        <Label>Subtítulo (Ej: "Nuestra Boda")</Label>
        <Input
          value={data.subtitulo?.text || ''}
          onChange={(e) => handleSubtituloTextChange(e.target.value)}
        />
        <TextStyleEditor
          style={data.subtitulo?.style || {}}
          onStyleChange={handleTextStyleChange}
        />
      </div>
      <Separator />
      <div className="space-y-2">
        <Label className="font-medium">Paleta de Colores</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {(['primary', 'secondary', 'accent'] as Array<keyof ColorPalette>).map(key => (
            <div key={key} className="space-y-1">
              <Label htmlFor={`color-${key}`} className="text-xs capitalize">{key}</Label>
              <div className="flex items-center gap-1">
                <Input type="color" id={`color-picker-${key}`} value={data.paletaColores?.[key] || '#000000'} onChange={e => handleColorChange(key, e.target.value)} className="w-8 h-8 p-0.5 aspect-square"/>
                <Input type="text" id={`color-hex-${key}`} value={data.paletaColores?.[key] || '#000000'} onChange={e => handleColorChange(key, e.target.value)} className="h-8 text-xs" placeholder="#RRGGBB"/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
