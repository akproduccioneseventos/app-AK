'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFiestaByAccessKey, saveListaMusica } from '@/app/actions/fiesta/portal.actions';
import type { FiestaEnPlanificacion, ListaMusicaPortal } from '@/types/fiesta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, AlertTriangle, Save, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SESSION_KEY_PREFIX = 'portal_auth_';

type SongListKey = 'imprescindibles' | 'siEsPosible' | 'noQuiero';

const sections: { key: SongListKey; label: string; emoji: string; desc: string }[] = [
  { key: 'imprescindibles', label: 'Imprescindibles', emoji: '🎯', desc: 'Las canciones que SÍ o SÍ deben sonar' },
  { key: 'siEsPosible', label: 'Si es posible', emoji: '🎶', desc: 'Canciones que te gustaría escuchar' },
  { key: 'noQuiero', label: 'No quiero', emoji: '🚫', desc: 'Canciones que preferís que no suenen' },
];

export default function MusicaPortalPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const fiestaId = params.id;

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lista, setLista] = useState<ListaMusicaPortal>({});
  const [inputs, setInputs] = useState<Record<SongListKey, string>>({ imprescindibles: '', siEsPosible: '', noQuiero: '' });

  useEffect(() => {
    const accessKey = sessionStorage.getItem(SESSION_KEY_PREFIX + fiestaId);
    if (!accessKey) { router.replace(`/portal-cliente/${fiestaId}`); return; }
    getFiestaByAccessKey(fiestaId, accessKey)
      .then(data => {
        if (!data) { setError('Evento no encontrado.'); return; }
        setFiesta(data);
        setLista(data.listaMusicaPortal ?? {});
      })
      .catch(() => setError('No se pudo cargar el evento.'))
      .finally(() => setIsLoading(false));
  }, [fiestaId, router]);

  const addSong = (key: SongListKey) => {
    const val = inputs[key].trim();
    if (!val) return;
    setLista(prev => ({ ...prev, [key]: [...(prev[key] ?? []), val] }));
    setInputs(prev => ({ ...prev, [key]: '' }));
  };

  const removeSong = (key: SongListKey, idx: number) => {
    setLista(prev => ({ ...prev, [key]: (prev[key] ?? []).filter((_, i) => i !== idx) }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await saveListaMusica(fiestaId, lista);
    if (result.success) {
      toast({ title: '✅ Lista guardada', description: 'Tu lista de música fue enviada al DJ.' });
    } else {
      toast({ title: 'Error', description: result.error ?? 'No se pudo guardar.', variant: 'destructive' });
    }
    setIsSaving(false);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
    </div>
  );

  if (error || !fiesta) return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-md text-center border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <AlertTriangle className="w-10 h-10 mx-auto text-red-500 mb-2" />
          <p className="text-red-700 font-semibold">{error ?? 'Error al cargar.'}</p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-slate-900">🎵 Lista de Música</p>
            <p className="text-xs text-slate-500">{fiesta.configuracion?.nombreEvento}</p>
          </div>
          <Button onClick={handleSave} disabled={isSaving} size="sm" className="bg-purple-600 hover:bg-purple-700 shrink-0">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="ml-1.5">Guardar</span>
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">🎵 Tu Lista Musical</h1>
          <p className="text-slate-500 text-sm mt-1">Armá la banda de sonido perfecta para tu evento</p>
        </div>

        {sections.map(section => (
          <Card key={section.key}>
            <CardHeader>
              <CardTitle className="text-base font-black">{section.emoji} {section.label}</CardTitle>
              <p className="text-xs text-slate-500">{section.desc}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Artista - Canción"
                  value={inputs[section.key]}
                  onChange={e => setInputs(prev => ({ ...prev, [section.key]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addSong(section.key)}
                />
                <Button size="icon" variant="outline" onClick={() => addSong(section.key)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-1.5">
                {(lista[section.key] ?? []).map((song, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50">
                    <span className="text-sm text-slate-700">{song}</span>
                    <button onClick={() => removeSong(section.key, idx)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {(lista[section.key] ?? []).length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-2">Sin canciones aún</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {lista.fechaActualizacion && (
          <p className="text-xs text-slate-400 text-center">
            Última actualización: {new Date(lista.fechaActualizacion).toLocaleDateString('es-UY')}
          </p>
        )}
      </main>
    </div>
  );
}
