'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Loader2, AlertTriangle, ParkingCircle, Accessibility, Phone,
  CloudRain, MapPin, Navigation, Clock, ExternalLink, Info
} from 'lucide-react';

export default function LogisticaPage() {
  const params = useParams<{ fiestaId: string }>();
  const { fiestaId } = params;

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fiestaId) return;
    getFiestaById(fiestaId)
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
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-md text-center border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <AlertTriangle className="w-10 h-10 mx-auto text-red-500 mb-2" />
          <p className="text-red-700 font-semibold">{error ?? 'No se encontró la información del evento.'}</p>
        </CardContent>
      </Card>
    </div>
  );

  const config = fiesta.configuracion;
  const fechaEvento = config?.fechaEvento ? new Date(config.fechaEvento) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Navigation className="w-5 h-5 text-indigo-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-slate-900 truncate">{config?.nombreEvento ?? 'Evento'}</p>
            <p className="text-xs text-slate-500">Información de Logística y Accesos</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-5">
        {/* Event Summary */}
        <Card className="overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap gap-3 text-sm text-slate-600">
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
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Navigation className="w-5 h-5 text-indigo-500" />
                Cómo llegar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {config?.direccionLugar && (
                <p className="text-sm text-slate-700">📍 {config.direccionLugar}</p>
              )}
              {config?.instruccionesLlegada && (
                <p className="text-sm text-slate-600 leading-relaxed">{config.instruccionesLlegada}</p>
              )}
              {config?.googleMapsUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50"
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
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <ParkingCircle className="w-5 h-5 text-blue-500" />
                Estacionamiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700 leading-relaxed">{config.infoEstacionamiento}</p>
            </CardContent>
          </Card>
        )}

        {/* Accessibility */}
        {config?.rutaAccesibilidad && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Accessibility className="w-5 h-5 text-green-500" />
                Accesibilidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700 leading-relaxed">{config.rutaAccesibilidad}</p>
            </CardContent>
          </Card>
        )}

        {/* Rain Protocol */}
        {config?.protocoloLluvia && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-black flex items-center gap-2 text-blue-800">
                <CloudRain className="w-5 h-5 text-blue-600" />
                Protocolo de Lluvia
                <Badge className="bg-blue-200 text-blue-800 text-xs">Contingencia</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-900 leading-relaxed">{config.protocoloLluvia}</p>
            </CardContent>
          </Card>
        )}

        {/* Hall Map */}
        {config?.mapaDelSalonUrl && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-500" />
                Mapa del Salón
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
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
          <Card className="border-rose-200 bg-rose-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-black flex items-center gap-2 text-rose-800">
                <Phone className="w-5 h-5 text-rose-600" />
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
          <Card className="border-slate-200">
            <CardContent className="pt-6 text-center space-y-2">
              <Info className="w-8 h-8 mx-auto text-slate-400" />
              <p className="text-sm text-slate-500">
                La información de logística del evento estará disponible próximamente.
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
