'use client';

import React, { useState, useEffect, useCallback, startTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getSocialGlobalSettings, saveSocialGlobalSettings, getSocialFeedsAdmin, toggleFeedOverrideAdmin, type GlobalAdItem, type AdminSocialFeedInfo, type SocialGlobalSettings } from '@/app/actions/social-admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Megaphone, Settings, ToggleLeft, ToggleRight, Share2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RedSocialEventosPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feeds, setFeeds] = useState<AdminSocialFeedInfo[]>([]);
  const [globalSettings, setGlobalSettings] = useState<SocialGlobalSettings>({
    adFrequency: 4,
    ads: []
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [settingsRes, feedsRes] = await Promise.all([
        getSocialGlobalSettings(),
        getSocialFeedsAdmin()
      ]);
      setGlobalSettings(settingsRes);
      setFeeds(feedsRes);
    } catch (e: any) {
      toast({
        title: 'Error al cargar los datos',
        description: e.message || 'Verificá tu conexión a internet.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const res = await saveSocialGlobalSettings(globalSettings);
      if (res.success) {
        toast({
          title: 'Configuración guardada',
          description: 'Las publicidades se actualizaron correctamente.'
        });
      } else {
        throw new Error(res.error);
      }
    } catch (e: any) {
      toast({
        title: 'Error al guardar',
        description: e.message || 'Intentá de nuevo.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleFeed = async (fiestaId: string, currentEnabled: boolean) => {
    const updatedFeeds = feeds.map(f => f.id === fiestaId ? { ...f, manualEnabled: !currentEnabled } : f);
    setFeeds(updatedFeeds); // Optimistic update

    try {
      const res = await toggleFeedOverrideAdmin(fiestaId, !currentEnabled);
      if (res.success) {
        toast({
          title: 'Estado del feed actualizado',
          description: `Se ${!currentEnabled ? 'activó' : 'desactivó'} el acceso manual al feed.`
        });
        // Refetch to sync state
        const refreshed = await getSocialFeedsAdmin();
        setFeeds(refreshed);
      } else {
        throw new Error(res.error);
      }
    } catch (e: any) {
      toast({
        title: 'Error al cambiar estado',
        description: e.message || 'No se pudo guardar la anulación.',
        variant: 'destructive'
      });
      // Revert optimistic update
      fetchData();
    }
  };

  const handleAddAd = () => {
    const newAd: GlobalAdItem = {
      id: `ad_${Date.now()}`,
      title: 'Nuevo Servicio AK',
      description: 'Descripción breve de la promoción...',
      imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
      ctaText: 'Más Información',
      ctaUrl: '/simulador-ak',
      enabled: true
    };
    setGlobalSettings(prev => ({
      ...prev,
      ads: [...prev.ads, newAd]
    }));
  };

  const handleRemoveAd = (id: string) => {
    setGlobalSettings(prev => ({
      ...prev,
      ads: prev.ads.filter(a => a.id !== id)
    }));
  };

  const handleUpdateAdField = (id: string, field: keyof GlobalAdItem, value: any) => {
    setGlobalSettings(prev => ({
      ...prev,
      ads: prev.ads.map(ad => ad.id === id ? { ...ad, [field]: value } : ad)
    }));
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-rose-600" />
      </div>
    );
  }

  // Stats counters
  const totalFeeds = feeds.length;
  const activeFeeds = feeds.filter(f => f.temporalStatus === 'Activa' && f.manualEnabled).length;
  const overriddenDisabled = feeds.filter(f => !f.manualEnabled).length;
  const overriddenEnabled = feeds.filter(f => f.temporalStatus !== 'Activa' && f.manualEnabled).length;

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto text-slate-900">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight font-headline text-slate-900">Muro Social General</h1>
          <p className="text-sm text-slate-500">Gestión de feeds de eventos y parametrización de publicidad de AK Producciones.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={fetchData} variant="outline" className="rounded-xl border-slate-200">
            Actualizar Lista
          </Button>
          <Button onClick={handleSaveSettings} disabled={isSaving} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md shadow-rose-600/10">
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Settings className="w-4 h-4 mr-2" />}
            Guardar Configuración Global
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-3xl border-none shadow-sm bg-gradient-to-br from-white to-slate-50/50">
          <CardContent className="p-5">
            <p className="text-3xl font-black text-rose-600">{totalFeeds}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Feeds Totales</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-none shadow-sm bg-gradient-to-br from-white to-slate-50/50">
          <CardContent className="p-5">
            <p className="text-3xl font-black text-emerald-600">{activeFeeds}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Feeds Activos Hoy</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-none shadow-sm bg-gradient-to-br from-white to-slate-50/50">
          <CardContent className="p-5">
            <p className="text-3xl font-black text-amber-500">{overriddenEnabled}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Habilitados Manual</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-none shadow-sm bg-gradient-to-br from-white to-slate-50/50">
          <CardContent className="p-5">
            <p className="text-3xl font-black text-slate-400">{overriddenDisabled}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Deshabilitados Manual</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-6">

        {/* Main section: Feeds list */}
        <Card className="rounded-[2rem] border-none shadow-sm bg-white p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl font-black tracking-tight">Feeds de Eventos</CardTitle>
            <CardDescription>Ciclo de vida automático (activación 30 días antes y desactivación 30 días después).</CardDescription>
          </CardHeader>
          {/* `min-w-0`: sin esto el bloque no se encoge y el ancho minimo de
              la tabla se propaga al documento en vez de desplazarse aca dentro. */}
          <div className="min-w-0 overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Evento</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Ciclo de Vida</th>
                  <th className="py-3 px-4">Anulación Manual</th>
                  <th className="py-3 px-4 text-right">Acceso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {feeds.map((feed) => {
                  const statusColors = {
                    'Próximamente': 'bg-amber-50 text-amber-700 border-amber-100',
                    'Activa': 'bg-emerald-50 text-emerald-700 border-emerald-100',
                    'Desactivada': 'bg-slate-100 text-slate-500 border-slate-200'
                  };
                  return (
                    <tr key={feed.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4 font-bold text-slate-800">
                        {feed.nombreEvento}
                      </td>
                      <td className="py-4 px-4 text-slate-500">
                        {feed.fechaEvento ? new Date(feed.fechaEvento).toLocaleDateString('es-ES') : 'Sin fecha'}
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={`rounded-xl px-2.5 py-0.5 font-bold border ${statusColors[feed.temporalStatus] || ''}`} variant="outline">
                          {feed.temporalStatus}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={feed.manualEnabled}
                            onCheckedChange={() => handleToggleFeed(feed.id, feed.manualEnabled)}
                          />
                          <span className={`text-xs font-bold ${feed.manualEnabled ? 'text-rose-600' : 'text-slate-400'}`}>
                            {feed.manualEnabled ? 'Habilitado' : 'Pausado'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <a href={`/evento/social/${feed.id}`} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="ghost" className="rounded-xl h-8 text-xs font-bold text-slate-500 hover:text-rose-600">
                            Ver Feed <Share2 className="w-3.5 h-3.5 ml-1.5" />
                          </Button>
                        </a>
                      </td>
                    </tr>
                  );
                })}
                {feeds.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                      No hay eventos registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Sidebar section: Ads and Monetization */}
        <div className="space-y-6">
          <Card className="rounded-[2.0rem] border-none shadow-sm bg-white p-6 space-y-4">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-rose-600" />
                Monetización e Inserción
              </CardTitle>
              <CardDescription>Configuración global de banners y frecuencia de inyección de anuncios.</CardDescription>
            </CardHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="frequency-input" className="text-xs uppercase tracking-widest font-black text-slate-400">
                  Frecuencia de Publicidad
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="frequency-input"
                    type="number"
                    min={2}
                    max={10}
                    value={globalSettings.adFrequency}
                    onChange={(e) => setGlobalSettings(prev => ({ ...prev, adFrequency: parseInt(e.target.value) || 4 }))}
                    className="rounded-xl h-11"
                  />
                  <span className="text-xs text-slate-500 font-bold shrink-0">
                    posts de invitados
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Configura cuántas publicaciones de los invitados deben mostrarse antes de inyectar una tarjeta publicitaria de la empresa. (Recomendado: 4).
                </p>
              </div>
            </div>

            <Separator className="bg-slate-100" />

            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-700">Anuncios de Catálogo ({globalSettings.ads.length})</h3>
              <Button onClick={handleAddAd} size="sm" variant="outline" className="rounded-xl h-8 border-slate-200 font-bold text-xs">
                <Plus className="w-3.5 h-3.5 mr-1" /> Nuevo Banner
              </Button>
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              <AnimatePresence>
                {globalSettings.ads.map((ad, index) => (
                  <motion.div
                    key={ad.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">Anuncio #{index + 1}</span>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={ad.enabled}
                          onCheckedChange={(val) => handleUpdateAdField(ad.id, 'enabled', val)}
                        />
                        <Button
                          onClick={() => handleRemoveAd(ad.id)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-rose-600 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Input
                        value={ad.title}
                        onChange={(e) => handleUpdateAdField(ad.id, 'title', e.target.value)}
                        placeholder="Título Comercial"
                        className="h-9 rounded-lg bg-white border-slate-100 text-xs font-bold"
                      />
                      <Input
                        value={ad.description}
                        onChange={(e) => handleUpdateAdField(ad.id, 'description', e.target.value)}
                        placeholder="Descripción corta del servicio"
                        className="h-9 rounded-lg bg-white border-slate-100 text-xs"
                      />
                      <Input
                        value={ad.imageUrl}
                        onChange={(e) => handleUpdateAdField(ad.id, 'imageUrl', e.target.value)}
                        placeholder="URL de la imagen representativa"
                        className="h-9 rounded-lg bg-white border-slate-100 text-xs"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={ad.ctaText}
                          onChange={(e) => handleUpdateAdField(ad.id, 'ctaText', e.target.value)}
                          placeholder="Texto del Botón"
                          className="h-9 rounded-lg bg-white border-slate-100 text-xs"
                        />
                        <Input
                          value={ad.ctaUrl}
                          onChange={(e) => handleUpdateAdField(ad.id, 'ctaUrl', e.target.value)}
                          placeholder="URL de Destino"
                          className="h-9 rounded-lg bg-white border-slate-100 text-xs"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </Card>
        </div>

      </div>

    </div>
  );
}
