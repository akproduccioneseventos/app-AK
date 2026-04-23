'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Camera, GripVertical, Loader2, Pause, Play, Plus, QrCode, RotateCcw, Save, Send, SkipBack, SkipForward, Sparkles, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById, updateSocialGallerySettingsFiestaActual } from '@/app/actions/fiesta-actual';
import type { FiestaEnPlanificacion, ScreenMediaAsset, ScreenPlaylistItem, SocialGallerySettings } from '@/types/fiesta';
import { QRCodeSVG } from 'qrcode.react';
import { DEFAULT_MARKETING_TICKER_TEXT } from '@/lib/social-wall-defaults';
import { getGlobalScreenMediaLibrary, uploadScreenMediaAsset } from '@/app/actions/fiesta/screen-mode.actions';

const QUICK_MOMENTS = [
  { id: 'llegada-agasajados', nombre: 'Llegada de los agasajados', emoji: '🎉' },
  { id: 'corte-torta', nombre: 'Corte de Torta', emoji: '🎂' },
  { id: 'inicio-baile', nombre: 'Inicio del Baile', emoji: '🕺' },
];

const DEFAULT_SCREEN_PLAYLIST: ScreenPlaylistItem[] = [
  { id: 'item_video', type: 'video', title: 'Video publicitario', durationSeconds: 20, enabled: true, layout: 'auto' },
  { id: 'item_mural', type: 'mural', title: 'Mural de fotos', durationSeconds: 30, enabled: true, layout: 'auto' },
  {
    id: 'item_redes',
    type: 'redes',
    title: 'Pantalla de redes',
    durationSeconds: 15,
    enabled: true,
    layout: 'auto',
    socialTemplate: {
      templateId: 'vip',
      showInstagram: true,
      showTikTok: true,
      showWhatsApp: true,
      showFacebook: false,
      ctaText: 'Seguinos y escaneá el QR',
    },
  },
];

function withScreenDefaults(settings: SocialGallerySettings): SocialGallerySettings {
  return {
    ...settings,
    screenMode: {
      enabled: settings.screenMode?.enabled ?? true,
      loop: settings.screenMode?.loop ?? true,
      isPlaying: settings.screenMode?.isPlaying ?? true,
      currentItemIndex: settings.screenMode?.currentItemIndex ?? 0,
      startedAt: settings.screenMode?.startedAt,
      playlist: settings.screenMode?.playlist?.length ? settings.screenMode.playlist : DEFAULT_SCREEN_PLAYLIST,
    },
    screenMediaLibrary: settings.screenMediaLibrary ?? [],
  };
}

function generatePlaylistItemId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `playlist_${crypto.randomUUID()}`;
  }
  return `playlist_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

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
    marketingTickerText: DEFAULT_MARKETING_TICKER_TEXT,
    ledMarqueeText: '',
    screenMode: {
      enabled: true,
      loop: true,
      isPlaying: true,
      currentItemIndex: 0,
      playlist: DEFAULT_SCREEN_PLAYLIST,
    },
    screenMediaLibrary: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingLed, setIsSavingLed] = useState(false);
  const [globalLibrary, setGlobalLibrary] = useState<ScreenMediaAsset[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);

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
      setSettings(withScreenDefaults({
        enabled: true,
        allowLikes: true,
        allowComments: true,
        uploadsActive: true,
        chatEnabled: true,
        showPolls: true,
        showSongRequests: true,
        showDedications: true,
        marketingTickerText: DEFAULT_MARKETING_TICKER_TEXT,
        ledMarqueeText: '',
        ...(fiestaData.socialGallerySettings || {}),
      }));
      const globalAssets = await getGlobalScreenMediaLibrary();
      setGlobalLibrary(globalAssets);
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

  const saveLedText = async () => {
    if (!fiestaId) return;
    setIsSavingLed(true);
    const result = await updateSocialGallerySettingsFiestaActual(fiestaId, settings);
    setIsSavingLed(false);
    if (result.success) {
      toast({ title: 'Cartel LED enviado ✓', description: 'El texto se actualizó en la pantalla en vivo.' });
    } else {
      toast({ title: 'Error al enviar cartel LED', description: result.error, variant: 'destructive' });
    }
  };

  const triggerMoment = async (momentToTrigger: (typeof QUICK_MOMENTS)[number]) => {
    if (!fiestaId) return;
    const updatedSettings: SocialGallerySettings = {
      ...settings,
      momentosActivos: [
        ...(settings.momentosActivos ?? []).filter((m) => m.id !== momentToTrigger.id),
        { ...momentToTrigger, timestamp: new Date().toISOString() },
      ],
    };
    setSettings(updatedSettings);
    const result = await updateSocialGallerySettingsFiestaActual(fiestaId, updatedSettings);
    if (result.success) {
      toast({ title: `Momento lanzado: ${momentToTrigger.nombre}` });
    } else {
      toast({ title: 'Error al disparar momento', description: result.error, variant: 'destructive' });
    }
  };

  const handlePlaylistItemChange = (itemId: string, update: Partial<ScreenPlaylistItem>) => {
    setSettings((prev) => withScreenDefaults({
      ...prev,
      screenMode: {
        ...(prev.screenMode ?? { enabled: true, loop: true, isPlaying: true, currentItemIndex: 0, playlist: DEFAULT_SCREEN_PLAYLIST }),
        playlist: (prev.screenMode?.playlist ?? DEFAULT_SCREEN_PLAYLIST).map((item) =>
          item.id === itemId ? { ...item, ...update } : item
        ),
      },
    }));
  };

  const reorderPlaylist = (startId: string, endId: string) => {
    setSettings((prev) => {
      const playlist = [...(prev.screenMode?.playlist ?? DEFAULT_SCREEN_PLAYLIST)];
      const from = playlist.findIndex((item) => item.id === startId);
      const to = playlist.findIndex((item) => item.id === endId);
      if (from === -1 || to === -1) return prev;
      const [moved] = playlist.splice(from, 1);
      playlist.splice(to, 0, moved);
      return withScreenDefaults({
        ...prev,
        screenMode: { ...(prev.screenMode ?? {}), playlist } as SocialGallerySettings['screenMode'],
      });
    });
  };

  const handleUploadMedia = async (file?: File | null) => {
    if (!fiestaId || !file) return;
    setUploadingMedia(true);
    try {
      const res = await uploadScreenMediaAsset(fiestaId, file);
      if (res.success && res.asset) {
        setSettings((prev) => withScreenDefaults({
          ...prev,
          screenMediaLibrary: [...(prev.screenMediaLibrary ?? []), res.asset!],
        }));
        setGlobalLibrary((prev) => [res.asset!, ...prev]);
        toast({ title: 'Medio subido', description: 'Disponible para la playlist de esta fiesta.' });
      } else {
        throw new Error(res.error || 'No se pudo subir el medio.');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingMedia(false);
    }
  };

  const addPlaylistItem = (type: ScreenPlaylistItem['type']) => {
    const id = generatePlaylistItemId();
    const defaults: Record<ScreenPlaylistItem['type'], Omit<ScreenPlaylistItem, 'id'>> = {
      video: { type: 'video', title: 'Video publicitario', durationSeconds: 20, enabled: true, layout: 'auto' },
      mural: { type: 'mural', title: 'Mural de fotos', durationSeconds: 30, enabled: true, layout: 'auto' },
      redes: {
        type: 'redes',
        title: 'Pantalla de redes',
        durationSeconds: 15,
        enabled: true,
        layout: 'auto',
        socialTemplate: {
          templateId: 'vip',
          showInstagram: true,
          showTikTok: true,
          showWhatsApp: true,
          showFacebook: false,
          ctaText: 'Seguinos',
        },
      },
      juego: { type: 'juego', title: 'Base de juego', durationSeconds: 15, enabled: true, layout: 'auto' },
    };
    setSettings((prev) => withScreenDefaults({
      ...prev,
      screenMode: {
        ...(prev.screenMode ?? { enabled: true, loop: true, isPlaying: true, currentItemIndex: 0, playlist: [] }),
        playlist: [...(prev.screenMode?.playlist ?? []), { id, ...defaults[type] }],
      },
    }));
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
                <p className="text-xs font-bold uppercase">QR Único (Subir + Participar)</p>
                <QRCodeSVG value={socialWallLink || 'https://akproducciones.uy'} size={96} />
              </div>
              <div className="space-y-2 text-left max-w-xs">
                <p className="text-xs font-bold uppercase">Pantalla gigante</p>
                <p className="text-xs text-muted-foreground">
                  La pantalla se abre desde el panel del organizador. El QR para invitados siempre debe apuntar al muro de participación.
                </p>
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
              <Link href={`/evento/social/${fiestaId}`} target="_blank"><Button variant="outline"><QrCode className="w-4 h-4 mr-2" />Abrir Muro/Control móvil</Button></Link>
              <Link href={`/evento/muro-en-vivo/${fiestaId}`} target="_blank"><Button variant="outline">Abrir Pantalla</Button></Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Marketing y Cartel LED</CardTitle>
            <CardDescription>Texto para zócalo inferior y mensaje pasante tipo marquesina.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Zócalo de marketing (redes)</Label>
              <Input
                value={settings.marketingTickerText ?? ''}
                onChange={(e) => setSettings((prev) => ({ ...prev, marketingTickerText: e.target.value }))}
                placeholder={DEFAULT_MARKETING_TICKER_TEXT}
              />
            </div>
            <div className="space-y-1">
              <Label>Cartel LED / Mensaje pasante</Label>
              <div className="flex gap-2">
                <Input
                  value={settings.ledMarqueeText ?? ''}
                  onChange={(e) => setSettings((prev) => ({ ...prev, ledMarqueeText: e.target.value }))}
                  placeholder="¡En 10 minutos cortamos la torta!"
                  className="flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={saveLedText}
                  disabled={isSavingLed}
                  title="Enviar cartel LED a pantalla ahora"
                >
                  {isSavingLed ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Presioná el botón de envío para actualizar el texto en la pantalla en vivo inmediatamente.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Modo Pantalla · Playlist por fiesta</CardTitle>
            <CardDescription>Secuencia configurable con video, mural, redes y bases de juegos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-4 gap-2">
              <Button type="button" variant="outline" onClick={() => addPlaylistItem('video')}><Plus className="w-4 h-4 mr-2" />Video</Button>
              <Button type="button" variant="outline" onClick={() => addPlaylistItem('mural')}><Plus className="w-4 h-4 mr-2" />Mural</Button>
              <Button type="button" variant="outline" onClick={() => addPlaylistItem('redes')}><Plus className="w-4 h-4 mr-2" />Redes</Button>
              <Button type="button" variant="outline" onClick={() => addPlaylistItem('juego')}><Plus className="w-4 h-4 mr-2" />Juego</Button>
            </div>

            <div className="grid sm:grid-cols-4 gap-2">
              <Button
                type="button"
                variant={settings.screenMode?.isPlaying ? 'default' : 'outline'}
                onClick={() => setSettings((prev) => withScreenDefaults({ ...prev, screenMode: { ...(prev.screenMode ?? {}), isPlaying: true } as SocialGallerySettings['screenMode'] }))}
              >
                <Play className="w-4 h-4 mr-2" />Play
              </Button>
              <Button
                type="button"
                variant={!settings.screenMode?.isPlaying ? 'default' : 'outline'}
                onClick={() => setSettings((prev) => withScreenDefaults({ ...prev, screenMode: { ...(prev.screenMode ?? {}), isPlaying: false } as SocialGallerySettings['screenMode'] }))}
              >
                <Pause className="w-4 h-4 mr-2" />Pause
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSettings((prev) => withScreenDefaults({
                  ...prev,
                  screenMode: { ...(prev.screenMode ?? {}), currentItemIndex: Math.max(0, (prev.screenMode?.currentItemIndex ?? 0) - 1) } as SocialGallerySettings['screenMode'],
                }))}
              >
                <SkipBack className="w-4 h-4 mr-2" />Prev
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSettings((prev) => withScreenDefaults({
                  ...prev,
                  screenMode: {
                    ...(prev.screenMode ?? {}),
                    currentItemIndex: Math.min((prev.screenMode?.playlist?.length ?? 1) - 1, (prev.screenMode?.currentItemIndex ?? 0) + 1),
                  } as SocialGallerySettings['screenMode'],
                }))}
              >
                <SkipForward className="w-4 h-4 mr-2" />Next
              </Button>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm font-medium flex items-center gap-2"><RotateCcw className="w-4 h-4" />Loop</span>
              <Switch
                checked={settings.screenMode?.loop ?? true}
                onCheckedChange={(checked) =>
                  setSettings((prev) => withScreenDefaults({ ...prev, screenMode: { ...(prev.screenMode ?? {}), loop: checked } as SocialGallerySettings['screenMode'] }))
                }
              />
            </div>

            <div className="space-y-2">
              {(settings.screenMode?.playlist ?? []).map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => setDraggingId(item.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (draggingId && draggingId !== item.id) reorderPlaylist(draggingId, item.id);
                    setDraggingId(null);
                  }}
                  className="grid md:grid-cols-[24px_1fr_80px_120px_1fr] gap-2 items-center rounded-lg border p-2 bg-white"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <Input
                    value={item.title}
                    onChange={(e) => handlePlaylistItemChange(item.id, { title: e.target.value })}
                  />
                  <Input
                    type="number"
                    min={5}
                    max={300}
                    value={item.durationSeconds}
                    onChange={(e) => handlePlaylistItemChange(item.id, { durationSeconds: Number(e.target.value) || 15 })}
                  />
                  <select
                    className="h-10 rounded-md border px-2 text-sm"
                    value={item.layout ?? 'auto'}
                    onChange={(e) => handlePlaylistItemChange(item.id, { layout: e.target.value as ScreenPlaylistItem['layout'] })}
                  >
                    <option value="auto">Auto</option>
                    <option value="landscape">16:9</option>
                    <option value="portrait">9:16</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <Switch checked={item.enabled} onCheckedChange={(checked) => handlePlaylistItemChange(item.id, { enabled: checked })} />
                    <select
                      className="h-10 rounded-md border px-2 text-sm w-full"
                      value={item.mediaAssetId ?? ''}
                      onChange={(e) => {
                        const asset = (settings.screenMediaLibrary ?? []).find((a) => a.id === e.target.value) ?? globalLibrary.find((a) => a.id === e.target.value);
                        handlePlaylistItemChange(item.id, {
                          mediaAssetId: asset?.id,
                          mediaUrl: asset?.url,
                        });
                      }}
                    >
                      <option value="">Sin medio</option>
                      {[...(settings.screenMediaLibrary ?? []), ...globalLibrary.filter((g) => !(settings.screenMediaLibrary ?? []).some((l) => l.id === g.id))].map((asset) => (
                        <option key={asset.id} value={asset.id}>{asset.title || asset.id}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 rounded-lg border p-3">
              <Label>Subir publicidad/media (PC) para esta fiesta</Label>
              <Input
                type="file"
                accept="video/*,image/*"
                disabled={uploadingMedia}
                onChange={(e) => handleUploadMedia(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">La biblioteca global incluye medios de otras fiestas para reutilizar.</p>
              <p className="text-xs text-muted-foreground">Templates redes incluidos: Neón, VIP elegante y Minimal (editable por handles/QR en playlist tipo redes).</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Disparador rápido de momentos</CardTitle>
            <CardDescription>Interrumpe temporalmente la proyección con anuncio a pantalla completa.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {QUICK_MOMENTS.map((moment) => (
              <Button key={moment.id} variant="secondary" onClick={() => triggerMoment(moment)}>
                <Sparkles className="w-4 h-4 mr-2" />
                {moment.emoji} {moment.nombre}
              </Button>
            ))}
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
