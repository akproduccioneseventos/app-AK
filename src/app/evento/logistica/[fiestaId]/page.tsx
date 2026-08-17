'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getPublicGuestEvent } from '@/app/actions/public-guest-portal';
import type { PublicGuestEvent } from '@/lib/guest-portal-public-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Loader2, AlertTriangle, ParkingCircle, Accessibility, Phone,
  CloudRain, MapPin, Navigation, Clock, ExternalLink, Info
} from 'lucide-react';
import { parseEventDate } from '@/lib/public-experience/event-date';

export default function LogisticaPage() {
  const params = useParams<{ fiestaId: string }>();
  const { fiestaId } = params;

  const [fiesta, setFiesta] = useState<PublicGuestEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fiestaId) return;
    getPublicGuestEvent(fiestaId)
      .then(data => {
        if (!data) { setError('Evento no encontrado.'); return; }
        setFiesta(data);
      })
      .catch(() => setError('No se pudo cargar la información del evento.'))
      .finally(() => setIsLoading(false));
  }, [fiestaId]);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
    </div>
  );

  if (error || !fiesta) return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-slate-950">
      <Card className="max-w-md text-center border-red-900 bg-red-950/30">
        <CardContent className="pt-6">
          <AlertTriangle className="w-10 h-10 mx-auto text-red-500 mb-2" />
          <p className="text-red-400 font-semibold">{error ?? 'No se encontró la información del evento.'}</p>
        </CardContent>
      </Card>
    </div>
  );

  const config = fiesta.configuracion;
  const fechaEvento = parseEventDate(config?.fechaEvento);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Navigation className="w-5 h-5 text-indigo-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-white truncate">{config?.nombreEvento ?? 'Evento'}</p>
            <p className="text-xs text-slate-400">Información de Logística y Accesos</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-5">
        {/* Event Summary */}
        <Card className="overflow-hidden border-slate-800 bg-slate-900">
          <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap gap-3 text-sm text-slate-300">
              {fechaEvento && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span>
                    {fechaEvento.toLocaleDateString('es-UY', { weekday: 'long', day: '2-digit', month: 'long' })}
                    {config?.horaInicio && ` · ${config.horaInicio}hs`}
                  </span>
                </div>
              )}
              {config?.nombreLugar && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-indigo-500" />
                  <span>{config.nombreLugar}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* How to get there */}
        {(config?.direccionLugar || config?.googleMapsUrl || config?.instruccionesLlegada) && (
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-black flex items-center gap-2 text-white">
                <Navigation className="w-5 h-5 text-indigo-400" />
                Cómo llegar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {config?.direccionLugar && (
                <p className="text-sm text-slate-300">{config.direccionLugar}</p>
              )}
              {config?.instruccionesLlegada && (
                <p className="text-sm text-slate-300 leading-relaxed">{config.instruccionesLlegada}</p>
              )}
              {config?.googleMapsUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20"
                  asChild
                >
                  <a href={config.googleMapsUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir en Google Maps
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Parking */}
        {config?.infoEstacionamiento && (
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-black flex items-center gap-2 text-white">
                <ParkingCircle className="w-5 h-5 text-blue-400" />
                Estacionamiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-300 leading-relaxed">{config.infoEstacionamiento}</p>
            </CardContent>
          </Card>
        )}

        {/* Accessibility */}
        {config?.rutaAccesibilidad && (
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-black flex items-center gap-2 text-white">
                <Accessibility className="w-5 h-5 text-emerald-400" />
                Accesibilidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-300 leading-relaxed">{config.rutaAccesibilidad}</p>
            </CardContent>
          </Card>
        )}

        {/* Rain Protocol */}
        {config?.protocoloLluvia && (
          <Card className="border-blue-900 bg-blue-950/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-black flex items-center gap-2 text-blue-300">
                <CloudRain className="w-5 h-5 text-blue-400" />
                Protocolo de Lluvia
                <Badge className="bg-blue-900 text-blue-200 text-xs">Contingencia</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-200/80 leading-relaxed">{config.protocoloLluvia}</p>
            </CardContent>
          </Card>
        )}

        {/* Hall Map */}
        {config?.mapaDelSalonUrl && (
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-black flex items-center gap-2 text-white">
                <MapPin className="w-5 h-5 text-purple-400" />
                Mapa del Salón
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
                asChild
              >
                <a href={config.mapaDelSalonUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver mapa del salón
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Emergency Contact */}
        {config?.telefonoAsistencia && (
          <Card className="border-rose-900 bg-rose-950/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-black flex items-center gap-2 text-rose-300">
                <Phone className="w-5 h-5 text-rose-500" />
                Contacto de Asistencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                size="sm"
                className="w-full bg-rose-600 hover:bg-rose-700 text-white"
                asChild
              >
                <a href={`tel:${config.telefonoAsistencia}`}>
                  <Phone className="w-4 h-4 mr-2" />
                  Llamar: {config.telefonoAsistencia}
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Fallback if no logistics info configured */}
        {!config?.direccionLugar && !config?.infoEstacionamiento && !config?.rutaAccesibilidad &&
         !config?.protocoloLluvia && !config?.mapaDelSalonUrl && !config?.telefonoAsistencia && (
          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="pt-6 text-center space-y-2">
              <Info className="w-8 h-8 mx-auto text-slate-500" />
              <p className="text-sm text-slate-400">
                AK todavia no cargo instrucciones especiales para este evento. Usa el nombre del salon, la fecha y el contacto principal de la invitacion.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="py-6 text-center text-xs text-slate-400">
        <p>AK Producciones Eventos · Salto, Uruguay</p>
      </footer>
    </div>
  );
}
