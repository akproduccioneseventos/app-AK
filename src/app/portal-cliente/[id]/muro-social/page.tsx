'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { saveSocialSettingsByClient } from '@/app/actions/social-gallery';
import type { FiestaEnPlanificacion, SocialGallerySettings } from '@/types/fiesta';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  ArrowLeft,
  Save,
  ExternalLink,
  Sparkles,
  Settings2,
  Palette,
  Camera,
  Music,
  Heart,
  MessageSquare,
  Users,
  Eye,
  Info
} from 'lucide-react';

const SESSION_KEY_PREFIX = 'portal_auth_';

const BRAND_PRESET_COLORS = [
  { name: 'Rojo AK', value: '#e11d48' },
  { name: 'Dorado Premium', value: '#d4af37' },
  { name: 'Azul Real', value: '#1d4ed8' },
  { name: 'Verde Esmeralda', value: '#047857' },
  { name: 'Violeta Festivo', value: '#7c3aed' },
  { name: 'Rosa Romántico', value: '#db2777' },
];

export default function ClientMuroSocialPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const fiestaId = params.id;
  const { toast } = useToast();

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [accessKey, setAccessKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [enabled, setEnabled] = useState(true);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [allowLikes, setAllowLikes] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [uploadsActive, setUploadsActive] = useState(true);
  const [privateDedicationsMode, setPrivateDedicationsMode] = useState(false);
  const [requireApproval, setRequireApproval] = useState(false);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [showSongRequests, setShowSongRequests] = useState(true);
  const [showDedications, setShowDedications] = useState(true);

  const [accentColor, setAccentColor] = useState('#e11d48');
  const [coverUrl, setCoverUrl] = useState('');

  useEffect(() => {
    const key = sessionStorage.getItem(SESSION_KEY_PREFIX + fiestaId);
    if (!key) {
      sessionStorage.removeItem(SESSION_KEY_PREFIX + fiestaId);
      router.replace(`/portal-cliente/${fiestaId}`);
      return;
    }
    setAccessKey(key);

    getFiestaById(fiestaId)
      .then((data) => {
        if (!data) {
          setError('Evento no encontrado.');
          return;
        }
        setFiesta(data);

        // Initialize form states from DB settings
        const settings: Partial<SocialGallerySettings> = data.socialGallerySettings || {};
        setEnabled(settings.enabled ?? true);
        setTitle(settings.title || data.configuracion?.nombreEvento || '');
        setSubtitle(settings.subtitle || '¡Compartí tus fotos y saludos en vivo!');
        setAllowLikes(settings.allowLikes ?? true);
        setAllowComments(settings.allowComments ?? true);
        setUploadsActive(settings.uploadsActive ?? true);
        setPrivateDedicationsMode(settings.privateDedicationsMode ?? false);
        setRequireApproval(settings.requireApproval ?? false);
        setChatEnabled(settings.chatEnabled ?? true);
        setShowSongRequests(settings.showSongRequests ?? true);
        setShowDedications(settings.showDedications ?? true);
        setAccentColor(settings.accentColor || '#e11d48');
        setCoverUrl(settings.mobileControlCoverUrl || '');
      })
      .catch(() => setError('Error al cargar la información del evento.'))
      .finally(() => setIsLoading(false));
  }, [fiestaId, router]);

  const handleSave = async () => {
    if (!fiesta) return;
    setIsSaving(true);

    const settings: Partial<SocialGallerySettings> = {
      enabled,
      title,
      subtitle,
      allowLikes,
      allowComments,
      uploadsActive,
      privateDedicationsMode,
      requireApproval,
      chatEnabled,
      showSongRequests,
      showDedications,
      accentColor
    };

    try {
      const result = await saveSocialSettingsByClient(fiestaId, accessKey, settings, coverUrl);
      if (result.success) {
        toast({
          title: 'Ajustes guardados 🎉',
          description: 'Los cambios ya están activos en la red social de tu fiesta.',
        });
      } else {
        throw new Error(result.error || 'No se pudo guardar.');
      }
    } catch (err: any) {
      toast({
        title: 'Error al guardar',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-10 h-10 animate-spin text-primary" style={{ color: accentColor }} />
    </div>
  );

  if (error || !fiesta) return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-md text-center border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <Info className="w-10 h-10 mx-auto text-red-500 mb-2" />
          <p className="text-red-700 font-semibold">{error ?? 'Error al cargar.'}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.back()}><ArrowLeft className="w-4 h-4 mr-1.5" />Volver</Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-xl">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Portal del Cliente</span>
              <h1 className="text-2xl font-black text-slate-900 leading-tight">Configurar Muro Social</h1>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <a href={`/evento/social/${fiestaId}`} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-initial">
              <Button variant="outline" className="w-full rounded-xl gap-2 text-xs font-bold">
                <Eye className="w-4 h-4" /> Vista Invitados <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </a>
            <a href={`/evento/muro-en-vivo/${fiestaId}`} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-initial">
              <Button variant="outline" className="w-full rounded-xl gap-2 text-xs font-bold">
                <Eye className="w-4 h-4" /> Pantalla Gigante <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </a>
          </div>
        </div>

        {/* Form Grid */}
        <div className="grid gap-6">

          {/* General Enable Switch */}
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardContent className="p-6 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-base">Red Social de la Fiesta</h3>
                <p className="text-xs text-slate-400 font-semibold leading-normal">
                  Permitir a los invitados acceder al feed, subir fotos, interactuar y jugar.
                </p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </CardContent>
          </Card>

          {enabled && (
            <>
              {/* Personalización visual */}
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                <CardHeader className="p-6 pb-2">
                  <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <Palette className="w-5 h-5" style={{ color: accentColor }} /> Personalización Visual
                  </CardTitle>
                  <CardDescription className="text-xs font-semibold text-slate-400">
                    Cambia la apariencia del muro de fotos de tus invitados.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-5">

                  {/* Título y Subtítulo */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="muro-title" className="text-sm font-semibold text-slate-700">Título del Muro</Label>
                      <Input
                        id="muro-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={fiesta.configuracion?.nombreEvento || 'Nuestra Fiesta'}
                        className="rounded-xl border-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="muro-subtitle" className="text-sm font-semibold text-slate-700">Subtítulo / Bajada</Label>
                      <Input
                        id="muro-subtitle"
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        placeholder="¡Compartí tus fotos en vivo!"
                        className="rounded-xl border-slate-200"
                      />
                    </div>
                  </div>

                  {/* Foto de portada url */}
                  <div className="space-y-2">
                    <Label htmlFor="muro-cover" className="text-sm font-semibold text-slate-700">URL de Foto de Portada</Label>
                    <Input
                      id="muro-cover"
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      placeholder="https://ejemplo.com/portada.jpg"
                      className="rounded-xl border-slate-200"
                    />
                    <p className="text-[10px] text-slate-400 font-semibold">Foto que se muestra arriba del feed del invitado.</p>
                  </div>

                  {/* Color de Acento */}
                  <div className="space-y-3 pt-2">
                    <Label className="text-sm font-semibold text-slate-700">Color de Acento</Label>
                    <div className="flex flex-wrap gap-2">
                      {BRAND_PRESET_COLORS.map(c => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setAccentColor(c.value)}
                          className="h-8 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all"
                          style={{
                            backgroundColor: accentColor === c.value ? c.value : '#fff',
                            color: accentColor === c.value ? '#fff' : '#475569',
                            borderColor: accentColor === c.value ? c.value : '#e2e8f0'
                          }}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <Input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="h-10 w-20 p-1 rounded-xl cursor-pointer border-slate-200"
                      />
                      <span className="text-xs font-semibold text-slate-500">Color seleccionado: <strong style={{ color: accentColor }}>{accentColor}</strong></span>
                    </div>
                  </div>

                </CardContent>
              </Card>

              {/* Toggles Operativos y de Privacidad */}
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                <CardHeader className="p-6 pb-2">
                  <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <Settings2 className="w-5 h-5" style={{ color: accentColor }} /> Funcionalidades de Invitados
                  </CardTitle>
                  <CardDescription className="text-xs font-semibold text-slate-400">
                    Habilita o deshabilita los módulos interactivos según tu gusto.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 divide-y divide-slate-100 space-y-4">

                  {/* Permitir Subidas */}
                  <div className="flex items-center justify-between gap-4 pt-1">
                    <div className="space-y-0.5 flex-1 text-left">
                      <Label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-slate-500" /> Permitir Subir Fotos y Videos
                      </Label>
                      <p className="text-[10.5px] text-slate-400 font-semibold leading-normal">
                        Los invitados pueden subir contenido directamente de sus celulares a la pantalla.
                      </p>
                    </div>
                    <Switch checked={uploadsActive} onCheckedChange={setUploadsActive} />
                  </div>

                  {/* Chat en vivo */}
                  <div className="flex items-center justify-between gap-4 pt-4">
                    <div className="space-y-0.5 flex-1 text-left">
                      <Label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-slate-500" /> Chat en Vivo / Mensajes
                      </Label>
                      <p className="text-[10.5px] text-slate-400 font-semibold leading-normal">
                        Habilita la solapa de Chat para que los invitados conversen públicamente.
                      </p>
                    </div>
                    <Switch checked={chatEnabled} onCheckedChange={setChatEnabled} />
                  </div>

                  {/* Pedido de Música */}
                  <div className="flex items-center justify-between gap-4 pt-4">
                    <div className="space-y-0.5 flex-1 text-left">
                      <Label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <Music className="w-4 h-4 text-slate-500" /> Sugerencias de Música
                      </Label>
                      <p className="text-[10.5px] text-slate-400 font-semibold leading-normal">
                        Permite a los invitados pedir sus canciones favoritas para el DJ.
                      </p>
                    </div>
                    <Switch checked={showSongRequests} onCheckedChange={setShowSongRequests} />
                  </div>

                  {/* Dedicatorias */}
                  <div className="flex items-center justify-between gap-4 pt-4">
                    <div className="space-y-0.5 flex-1 text-left">
                      <Label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <Heart className="w-4 h-4 text-slate-500" /> Mensajes de Felicitación / Dedicatorias
                      </Label>
                      <p className="text-[10.5px] text-slate-400 font-semibold leading-normal">
                        Muestra el botón para mandar dedicatorias y mensajes de voz a los anfitriones.
                      </p>
                    </div>
                    <Switch checked={showDedications} onCheckedChange={setShowDedications} />
                  </div>

                  {/* Buzón Privado */}
                  <div className="flex items-center justify-between gap-4 pt-4">
                    <div className="space-y-0.5 flex-1 text-left">
                      <Label className="text-sm font-bold text-slate-800">🔐 Modo Buzón 100% Privado</Label>
                      <p className="text-[10.5px] text-slate-400 font-semibold leading-normal">
                        Las dedicatorias y mensajes de voz NO se proyectarán en la pantalla gigante; irán directo y de forma confidencial a los anfitriones.
                      </p>
                    </div>
                    <Switch checked={privateDedicationsMode} onCheckedChange={setPrivateDedicationsMode} />
                  </div>

                  {/* Moderación activa */}
                  <div className="flex items-center justify-between gap-4 pt-4">
                    <div className="space-y-0.5 flex-1 text-left">
                      <Label className="text-sm font-bold text-slate-800">🛡️ Moderación Previa Exigida</Label>
                      <p className="text-[10.5px] text-slate-400 font-semibold leading-normal">
                        Las fotos de invitados quedan en cola de revisión para que un operador o coordinador de AK las apruebe antes de salir a la pantalla gigante.
                      </p>
                    </div>
                    <Switch checked={requireApproval} onCheckedChange={setRequireApproval} />
                  </div>

                </CardContent>
              </Card>
            </>
          )}

          {/* Action Footer */}
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardFooter className="p-6 bg-slate-50 flex justify-end">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full sm:w-auto px-10 h-12 rounded-xl font-bold flex items-center justify-center gap-2"
                style={{ backgroundColor: accentColor }}
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Guardar Cambios
              </Button>
            </CardFooter>
          </Card>

        </div>
      </div>
    </div>
  );
}
