'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Camera, Loader2, QrCode, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById, updateSocialGallerySettingsFiestaActual } from '@/app/actions/fiesta-actual';
import type { FiestaEnPlanificacion, SocialGallerySettings } from '@/types/fiesta';
import { QRCodeSVG } from 'qrcode.react';

function MuroSocialContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');
  const router = useRouter();

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [settings, setSettings] = useState<SocialGallerySettings>({
    enabled: true,
    allowLikes: true,
    allowComments: true,
    uploadsActive: true,
    chatEnabled: true,
    showPolls: true,
    showSongRequests: true,
    showDedications: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!fiestaId) {
      router.push('/eventos');
      return;
    }
    setIsLoading(true);
    try {
      const fiestaData = await getFiestaById(fiestaId);
      if (!fiestaData) throw new Error('Fiesta no encontrada.');
      setFiesta(fiestaData);
      setSettings((prev) => ({ ...prev, ...(fiestaData.socialGallerySettings || {}) }));
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId, router, toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const socialWallLink = useMemo(() => {
    if (!fiestaId || typeof window === 'undefined') return '';
    return `${window.location.origin}/evento/social/${fiestaId}`;
  }, [fiestaId]);
  const projectionLink = useMemo(() => {
    if (!fiestaId || typeof window === 'undefined') return '';
    return `${window.location.origin}/evento/muro-en-vivo/${fiestaId}`;
  }, [fiestaId]);

  const saveSettings = async () => {
    if (!fiestaId) return;
    setIsSaving(true);
    const result = await updateSocialGallerySettingsFiestaActual(fiestaId, settings);
    setIsSaving(false);
    if (result.success) {
      toast({ title: 'Configuración guardada' });
    } else {
      toast({ title: 'Error al guardar', description: result.error, variant: 'destructive' });
    }
  };

  if (isLoading || !fiesta) {
    return <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Camera className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-black">Panel de Muro Social & Juegos</h1>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{fiesta.configuracion.nombreEvento}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
          <Button onClick={saveSettings} disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Guardar</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Link y QR del Muro</CardTitle>
            <CardDescription>Compartí estos enlaces con el cliente e invitados.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Link participación</Label>
              <Input readOnly value={socialWallLink} />
            </div>
            <div className="space-y-1">
              <Label>Link pantalla en vivo</Label>
              <Input readOnly value={projectionLink} />
            </div>
            <div className="flex gap-8 pt-2">
              <div className="space-y-2 text-center">
                <p className="text-xs font-bold uppercase">QR Muro</p>
                <QRCodeSVG value={socialWallLink || 'https://akproducciones.uy'} size={96} />
              </div>
              <div className="space-y-2 text-center">
                <p className="text-xs font-bold uppercase">QR Pantalla</p>
                <QRCodeSVG value={projectionLink || 'https://akproducciones.uy'} size={96} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Funcionalidades</CardTitle>
            <CardDescription>Gestión centralizada del muro social y dinámicas de juego.</CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3">
            {[
              { key: 'enabled', label: 'Muro activo' },
              { key: 'uploadsActive', label: 'Subida de fotos' },
              { key: 'allowLikes', label: 'Me gusta' },
              { key: 'allowComments', label: 'Comentarios' },
              { key: 'chatEnabled', label: 'Chat en vivo' },
              { key: 'showPolls', label: 'Encuestas (juegos)' },
              { key: 'showSongRequests', label: 'Pedidos de canciones' },
              { key: 'showDedications', label: 'Dedicatorias' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm font-medium">{item.label}</span>
                <Switch
                  checked={Boolean(settings[item.key as keyof SocialGallerySettings])}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, [item.key]: checked }))}
                />
              </div>
            ))}
            <div className="sm:col-span-2 flex gap-2 pt-1">
              <Link href={`/evento/social/${fiestaId}`} target="_blank"><Button variant="outline"><QrCode className="w-4 h-4 mr-2" />Abrir Muro</Button></Link>
              <Link href={`/evento/muro-en-vivo/${fiestaId}`} target="_blank"><Button variant="outline">Abrir Pantalla</Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function MuroSocialPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <MuroSocialContent />
    </Suspense>
  );
}

