'use client';

import React, { useState, useEffect } from 'react';
import type { SocialScreenConfig, SocialScreenTemplate } from '@/types/fiesta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Instagram, Facebook, MessageCircle } from 'lucide-react';
import { getSocialScreenConfig, saveSocialScreenConfig } from '@/app/actions/fiesta/social-screen.actions';
import { useToast } from '@/hooks/use-toast';

interface SocialScreenConfigPanelProps {
  fiestaId: string;
}

const templates: { id: SocialScreenTemplate; name: string; preview: string; gradient: string }[] = [
  { id: 'minimal', name: 'Minimal', preview: 'Blanco limpio', gradient: 'from-white to-gray-100' },
  { id: 'gradient', name: 'Gradient', preview: 'Púrpura/Rosa', gradient: 'from-purple-500 to-pink-500' },
  { id: 'dark-luxury', name: 'Dark Luxury', preview: 'Negro/Oro', gradient: 'from-black via-gray-900 to-yellow-700' },
];

export function SocialScreenConfigPanel({ fiestaId }: SocialScreenConfigPanelProps) {
  const { toast } = useToast();
  const [config, setConfig] = useState<SocialScreenConfig>({
    template: 'gradient',
    showQR: false,
    visibleNetworks: ['instagram', 'tiktok', 'facebook', 'whatsapp'],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fiestaId]);

  const loadConfig = async () => {
    setLoading(true);
    const data = await getSocialScreenConfig(fiestaId);
    if (data) {
      setConfig(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await saveSocialScreenConfig(fiestaId, config);
    if (result.success) {
      toast({ title: '✅ Guardado', description: 'Configuración de pantalla social actualizada.' });
    } else {
      toast({ title: 'Error', description: result.error || 'No se pudo guardar.', variant: 'destructive' });
    }
    setSaving(false);
  };

  const toggleNetwork = (network: 'instagram' | 'tiktok' | 'facebook' | 'whatsapp') => {
    const newVisibleNetworks = config.visibleNetworks.includes(network)
      ? config.visibleNetworks.filter(n => n !== network)
      : [...config.visibleNetworks, network];
    setConfig({ ...config, visibleNetworks: newVisibleNetworks });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Configuración Pantalla de Redes Sociales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template selector */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Plantilla Visual</Label>
            <div className="grid grid-cols-3 gap-3">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => setConfig({ ...config, template: tpl.id })}
                  className={`relative rounded-xl overflow-hidden aspect-video border-2 transition-all ${
                    config.template === tpl.id ? 'border-primary shadow-lg scale-105' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${tpl.gradient}`} />
                  <div className="relative h-full flex flex-col items-center justify-center p-2 text-center">
                    <p className={`text-xs font-bold ${tpl.id === 'dark-luxury' || tpl.id === 'gradient' ? 'text-white' : 'text-black'}`}>
                      {tpl.name}
                    </p>
                    <p className={`text-[10px] ${tpl.id === 'dark-luxury' || tpl.id === 'gradient' ? 'text-white/70' : 'text-black/70'}`}>
                      {tpl.preview}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Network handles */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Usuarios/Handles de Redes</Label>
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-32">
                  <Instagram className="w-4 h-4 text-pink-500" />
                  <Label className="text-sm">Instagram</Label>
                </div>
                <Input
                  value={config.instagramHandle || ''}
                  onChange={(e) => setConfig({ ...config, instagramHandle: e.target.value })}
                  placeholder="@usuario"
                />
                <Switch
                  checked={config.visibleNetworks.includes('instagram')}
                  onCheckedChange={() => toggleNetwork('instagram')}
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-32">
                  <span className="text-sm">🎵</span>
                  <Label className="text-sm">TikTok</Label>
                </div>
                <Input
                  value={config.tiktokHandle || ''}
                  onChange={(e) => setConfig({ ...config, tiktokHandle: e.target.value })}
                  placeholder="@usuario"
                />
                <Switch
                  checked={config.visibleNetworks.includes('tiktok')}
                  onCheckedChange={() => toggleNetwork('tiktok')}
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-32">
                  <Facebook className="w-4 h-4 text-blue-600" />
                  <Label className="text-sm">Facebook</Label>
                </div>
                <Input
                  value={config.facebookHandle || ''}
                  onChange={(e) => setConfig({ ...config, facebookHandle: e.target.value })}
                  placeholder="/usuario"
                />
                <Switch
                  checked={config.visibleNetworks.includes('facebook')}
                  onCheckedChange={() => toggleNetwork('facebook')}
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-32">
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  <Label className="text-sm">WhatsApp</Label>
                </div>
                <Input
                  value={config.whatsappNumber || ''}
                  onChange={(e) => setConfig({ ...config, whatsappNumber: e.target.value })}
                  placeholder="+598 99 123 456"
                />
                <Switch
                  checked={config.visibleNetworks.includes('whatsapp')}
                  onCheckedChange={() => toggleNetwork('whatsapp')}
                />
              </div>
            </div>
          </div>

          {/* Custom title */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Título Personalizado (opcional)</Label>
            <Input
              value={config.customTitle || ''}
              onChange={(e) => setConfig({ ...config, customTitle: e.target.value })}
              placeholder="Ej: ¡Seguinos en nuestras redes!"
            />
          </div>

          {/* QR Code */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Código QR</Label>
              <Switch
                checked={config.showQR}
                onCheckedChange={(checked) => setConfig({ ...config, showQR: checked })}
              />
            </div>
            {config.showQR && (
              <Input
                value={config.qrUrl || ''}
                onChange={(e) => setConfig({ ...config, qrUrl: e.target.value })}
                placeholder="URL para el código QR"
              />
            )}
          </div>

          {/* Save */}
          <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
