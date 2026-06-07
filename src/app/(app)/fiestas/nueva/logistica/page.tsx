'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Save, Loader2, ParkingCircle, Accessibility,
  Phone, CloudRain, MapPin, Navigation, Link as LinkIcon, Copy, ExternalLink, Info
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById, updateConfiguracionFiestaActual } from '@/app/actions/fiesta-actual';
import type { ConfigEventoDataStorage } from '@/types/fiesta';
import { useAutoSave } from '@/hooks/use-auto-save';
import { AutoSaveIndicator } from '@/components/ui/auto-save-indicator';

function LogisticaContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const fiestaId = searchParams.get('fiestaId');

  const [config, setConfig] = useState<Partial<ConfigEventoDataStorage>>({});
  const [nombreEvento, setNombreEvento] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const { isSaving, lastSaved, saveError, saveNow } = useAutoSave({
    data: config,
    onSave: (d) => updateConfiguracionFiestaActual(fiestaId!, d as ConfigEventoDataStorage),
    enabled: !isLoading && !!fiestaId,
  });

  useEffect(() => {
    if (!fiestaId) { router.replace('/eventos'); return; }
    setIsLoading(true);
    getFiestaById(fiestaId)
      .then(fiesta => {
        if (!fiesta) { router.replace('/eventos'); return; }
        setConfig(fiesta.configuracion ?? {});
        setNombreEvento(fiesta.configuracion?.nombreEvento ?? '');
      })
      .finally(() => setIsLoading(false));
  }, [fiestaId, router]);

  const publicUrl = fiestaId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/evento/logistica/${fiestaId}` : '';

  const copyLink = () => {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl);
      toast({ title: '✅ Link copiado', description: 'El link de logística fue copiado.' });
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-indigo-600" />
              Logística &amp; Accesibilidad
            </h1>
            <p className="text-sm text-slate-500">{nombreEvento} · Información para invitados</p>
          </div>
        </div>
        <AutoSaveIndicator isSaving={isSaving} lastSaved={lastSaved} saveError={saveError} />
      </div>

      {/* Public Link */}
      <Card className="border-indigo-200 bg-indigo-50">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-indigo-700 mb-1">Link público para invitados</p>
              <p className="text-xs text-indigo-600 font-mono truncate">{publicUrl || 'Cargando...'}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="outline" onClick={copyLink} className="border-indigo-300 text-indigo-700 hover:bg-indigo-100">
                <Copy className="w-4 h-4 mr-1" /> Copiar
              </Button>
              {publicUrl && (
                <Button size="sm" variant="outline" asChild className="border-indigo-300 text-indigo-700 hover:bg-indigo-100">
                  <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How to get there */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-black flex items-center gap-2">
            <Navigation className="w-5 h-5 text-indigo-500" />
            Cómo Llegar
          </CardTitle>
          <CardDescription>Dirección y Google Maps ya configurados en la sección de Configuración del evento.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instrucciones">Instrucciones adicionales de llegada</Label>
            <Textarea
              id="instrucciones"
              placeholder="Ej: Entrar por la puerta lateral sobre Calle Rivera. El salón está en el primer piso."
              rows={3}
              value={config.instruccionesLlegada ?? ''}
              onChange={e => setConfig(prev => ({ ...prev, instruccionesLlegada: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Parking */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-black flex items-center gap-2">
            <ParkingCircle className="w-5 h-5 text-blue-500" />
            Estacionamiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="estacionamiento">Información de estacionamiento</Label>
            <Textarea
              id="estacionamiento"
              placeholder="Ej: Estacionamiento gratuito en el playón frente al salón. También hay playa de estacionamiento en Calle Uruguay a 2 cuadras."
              rows={3}
              value={config.infoEstacionamiento ?? ''}
              onChange={e => setConfig(prev => ({ ...prev, infoEstacionamiento: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Accessibility */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-black flex items-center gap-2">
            <Accessibility className="w-5 h-5 text-green-500" />
            Accesibilidad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="accesibilidad">Ruta y recursos de accesibilidad</Label>
            <Textarea
              id="accesibilidad"
              placeholder="Ej: Acceso para sillas de ruedas por la rampa lateral derecha. El salón cuenta con baño adaptado. Avisar al personal de recepción al llegar."
              rows={3}
              value={config.rutaAccesibilidad ?? ''}
              onChange={e => setConfig(prev => ({ ...prev, rutaAccesibilidad: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Hall Map */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-black flex items-center gap-2">
            <MapPin className="w-5 h-5 text-purple-500" />
            Mapa del Salón
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="mapaUrl">URL del mapa del salón (imagen o PDF)</Label>
            <Input
              id="mapaUrl"
              placeholder="https://..."
              value={config.mapaDelSalonUrl ?? ''}
              onChange={e => setConfig(prev => ({ ...prev, mapaDelSalonUrl: e.target.value }))}
            />
            <p className="text-xs text-slate-400">Podés subir el mapa a Google Drive o Dropbox y pegar el link aquí.</p>
          </div>
        </CardContent>
      </Card>

      {/* Rain Protocol */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-base font-black flex items-center gap-2">
            <CloudRain className="w-5 h-5 text-blue-600" />
            Protocolo de Lluvia
            <Badge className="bg-blue-100 text-blue-700 text-xs">Contingencia</Badge>
          </CardTitle>
          <CardDescription>Instrucciones en caso de lluvia o mal clima</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="lluvia">Plan de contingencia para lluvia</Label>
            <Textarea
              id="lluvia"
              placeholder="Ej: En caso de lluvia, el evento se traslada al salón interior principal. Los invitados serán notificados por WhatsApp 2 horas antes."
              rows={3}
              value={config.protocoloLluvia ?? ''}
              onChange={e => setConfig(prev => ({ ...prev, protocoloLluvia: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card className="border-rose-200">
        <CardHeader>
          <CardTitle className="text-base font-black flex items-center gap-2">
            <Phone className="w-5 h-5 text-rose-500" />
            Teléfono de Asistencia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="telefono">Número de contacto rápido para invitados</Label>
            <Input
              id="telefono"
              placeholder="+598 99 000 000"
              value={config.telefonoAsistencia ?? ''}
              onChange={e => setConfig(prev => ({ ...prev, telefonoAsistencia: e.target.value }))}
            />
            <p className="text-xs text-slate-400">Este número se mostrará en la página de logística como botón de llamada rápida.</p>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <Card>
        <CardFooter className="pt-4">
          <Button
            onClick={saveNow}
            disabled={isSaving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {isSaving ? 'Guardando...' : 'Guardar ahora'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function LogisticaPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>}>
      <LogisticaContent />
    </Suspense>
  );
}
