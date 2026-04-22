'use client';

import React, { useState, useEffect } from 'react';
import type { ScreenPlaylist, PlaylistItem, PlaylistItemType } from '@/types/fiesta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Play, Pause, Save, Plus, Trash2, ChevronUp, ChevronDown, Loader2, Image, Video, Share2, Dice5, Vote } from 'lucide-react';
import { getScreenPlaylist, saveScreenPlaylist } from '@/app/actions/fiesta/screen-playlist.actions';
import { useToast } from '@/hooks/use-toast';

interface ScreenPlaylistAdminProps {
  fiestaId: string;
}

const typeIcons: Record<PlaylistItemType, React.ElementType> = {
  'muro-fotos': Image,
  'video-publicitario': Video,
  'redes-sociales': Share2,
  'ruleta': Dice5,
  'votacion': Vote,
};

const typeLabels: Record<PlaylistItemType, string> = {
  'muro-fotos': 'Muro de Fotos',
  'video-publicitario': 'Video Publicitario',
  'redes-sociales': 'Redes Sociales',
  'ruleta': 'Ruleta',
  'votacion': 'Votación',
};

const defaultItems: PlaylistItem[] = [
  { id: '1', type: 'muro-fotos', label: 'Muro de Fotos', durationSeconds: 30, enabled: true },
  { id: '2', type: 'video-publicitario', label: 'Video Publicitario', durationSeconds: 15, enabled: false },
  { id: '3', type: 'redes-sociales', label: 'Redes Sociales', durationSeconds: 20, enabled: true },
];

export function ScreenPlaylistAdmin({ fiestaId }: ScreenPlaylistAdminProps) {
  const { toast } = useToast();
  const [playlist, setPlaylist] = useState<ScreenPlaylist>({
    items: defaultItems,
    loop: true,
    orientation: 'landscape',
    isPlaying: false,
    currentIndex: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemType, setNewItemType] = useState<PlaylistItemType>('muro-fotos');
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemDuration, setNewItemDuration] = useState('30');

  useEffect(() => {
    loadPlaylist();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fiestaId]);

  const loadPlaylist = async () => {
    setLoading(true);
    const data = await getScreenPlaylist(fiestaId);
    if (data) {
      setPlaylist(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await saveScreenPlaylist(fiestaId, playlist);
    if (result.success) {
      toast({ title: '✅ Guardado', description: 'Playlist actualizada correctamente.' });
    } else {
      toast({ title: 'Error', description: result.error || 'No se pudo guardar.', variant: 'destructive' });
    }
    setSaving(false);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...playlist.items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    setPlaylist({ ...playlist, items: newItems });
  };

  const deleteItem = (index: number) => {
    const newItems = playlist.items.filter((_, i) => i !== index);
    setPlaylist({ ...playlist, items: newItems });
  };

  const toggleItem = (index: number) => {
    const newItems = [...playlist.items];
    newItems[index] = { ...newItems[index], enabled: !newItems[index].enabled };
    setPlaylist({ ...playlist, items: newItems });
  };

  const updateItemDuration = (index: number, duration: number) => {
    const newItems = [...playlist.items];
    newItems[index] = { ...newItems[index], durationSeconds: duration };
    setPlaylist({ ...playlist, items: newItems });
  };

  const addItem = () => {
    if (!newItemLabel.trim()) {
      toast({ title: 'Error', description: 'El nombre del item es requerido.', variant: 'destructive' });
      return;
    }
    const newItem: PlaylistItem = {
      id: Date.now().toString(),
      type: newItemType,
      label: newItemLabel.trim(),
      durationSeconds: parseInt(newItemDuration) || 30,
      enabled: true,
    };
    setPlaylist({ ...playlist, items: [...playlist.items, newItem] });
    setShowAddForm(false);
    setNewItemLabel('');
    setNewItemDuration('30');
    setNewItemType('muro-fotos');
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
          <CardTitle>Playlist de Pantalla</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-muted/40">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="loop"
                  checked={playlist.loop}
                  onCheckedChange={(checked) => setPlaylist({ ...playlist, loop: checked })}
                />
                <Label htmlFor="loop" className="text-sm">Loop</Label>
              </div>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                <Label className="text-sm">Orientación:</Label>
                <Select
                  value={playlist.orientation}
                  onValueChange={(value: 'landscape' | 'portrait') => setPlaylist({ ...playlist, orientation: value })}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="landscape">Horizontal (16:9)</SelectItem>
                    <SelectItem value="portrait">Vertical (9:16)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              variant={playlist.isPlaying ? 'destructive' : 'default'}
              onClick={() => setPlaylist({ ...playlist, isPlaying: !playlist.isPlaying })}
            >
              {playlist.isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {playlist.isPlaying ? 'Pausar' : 'Reproducir'}
            </Button>
          </div>

          {/* Items list */}
          <div className="space-y-2">
            {playlist.items.map((item, index) => {
              const Icon = typeIcons[item.type];
              return (
                <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl border ${item.enabled ? 'bg-white border-border' : 'bg-muted/40 border-muted opacity-60'}`}>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => moveItem(index, 'up')}
                      disabled={index === 0}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => moveItem(index, 'down')}
                      disabled={index === playlist.items.length - 1}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{item.label}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{typeLabels[item.type]}</Badge>
                      <Input
                        type="number"
                        value={item.durationSeconds}
                        onChange={(e) => updateItemDuration(index, parseInt(e.target.value) || 0)}
                        className="w-20 h-7 text-xs"
                        min="1"
                      />
                      <span className="text-xs text-muted-foreground">segundos</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.enabled}
                      onCheckedChange={() => toggleItem(index)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteItem(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add item form */}
          {showAddForm ? (
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Agregar Item</h4>
                <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>Cancelar</Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Tipo</Label>
                  <Select value={newItemType} onValueChange={(v: PlaylistItemType) => setNewItemType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Duración (seg)</Label>
                  <Input
                    type="number"
                    value={newItemDuration}
                    onChange={(e) => setNewItemDuration(e.target.value)}
                    min="1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Nombre</Label>
                <Input
                  value={newItemLabel}
                  onChange={(e) => setNewItemLabel(e.target.value)}
                  placeholder="Ej: Muro de Fotos"
                />
              </div>
              <Button onClick={addItem} className="w-full">Agregar</Button>
            </div>
          ) : (
            <Button onClick={() => setShowAddForm(true)} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Item
            </Button>
          )}

          {/* Save */}
          <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? 'Guardando...' : 'Guardar Playlist'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
