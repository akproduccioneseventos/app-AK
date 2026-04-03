'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { Clock, Music, Utensils, Calendar, Users, MapPin, Loader2, AlertTriangle, Building2, ChefHat, GlassWater, CakeSlice } from 'lucide-react';
import { getFiestaById } from '@/app/actions/fiesta-actual';
import { getMenuById } from '@/app/actions/menus-catering';
import type { FiestaEnPlanificacion, ProgramaEventoItem, MusicaFiesta } from '@/types/fiesta';
import type { FullMenu } from '@/types/catering';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Fecha a confirmar';
  try {
    return new Date(dateString).toLocaleDateString('es-UY', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch { return 'Fecha a confirmar'; }
};

const iconMap: Record<string, React.ElementType> = {
  Utensils, GlassWater, Music, CakeSlice, Clock, Calendar, ChefHat,
};

function ItinerarioSection({ programa }: { programa: ProgramaEventoItem[] }) {
  if (!programa || programa.length === 0) {
    return <p className="text-sm text-muted-foreground italic">Sin cronograma definido aún.</p>;
  }
  return (
    <div className="space-y-2">
      {programa.map((item) => {
        const Icon = iconMap[item.icono || ''] || Clock;
        return (
          <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
            <div className="flex-shrink-0 w-16 text-center">
              <span className="text-sm font-bold text-primary font-mono">{item.hora}</span>
            </div>
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{item.titulo}</p>
              {item.descripcion && <p className="text-xs text-muted-foreground mt-0.5">{item.descripcion}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MenuSection({ fiesta, menu }: { fiesta: FiestaEnPlanificacion; menu: FullMenu | null }) {
  if (!menu) {
    return <p className="text-sm text-muted-foreground italic">Menú en proceso de definición.</p>;
  }
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-sm text-muted-foreground mb-1 uppercase tracking-wide">Nombre del Menú</h3>
        <p className="font-medium">{menu.name}</p>
        {menu.description && <p className="text-sm text-muted-foreground">{menu.description}</p>}
      </div>
      {menu.categories && menu.categories.length > 0 && (
        <div className="space-y-3">
          {menu.categories.map((cat: any) => (
            <div key={cat.id}>
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-primary" />
                {cat.name}
              </h4>
              <div className="grid grid-cols-1 gap-1 pl-6">
                {cat.items?.map((item: any) => (
                  <div key={item.id} className="text-sm flex items-start gap-2">
                    <span className="text-muted-foreground mt-0.5">•</span>
                    <span>
                      {item.name}
                      {item.description && <span className="text-muted-foreground"> — {item.description}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MusicSection({ musica, invitados }: { musica?: MusicaFiesta; invitados?: FiestaEnPlanificacion['invitados'] }) {
  const songSuggestions = invitados?.flatMap(i => i.cancionesDJ || []).filter(Boolean) || [];
  const hasMusic = musica && (musica.cancionEntrada || musica.cancionVals || musica.cancionesTortaBrindis?.length || musica.listaNoReproducir || musica.sugerenciasInvitados);

  if (!hasMusic && songSuggestions.length === 0) {
    return <p className="text-sm text-muted-foreground italic">Lista musical en proceso de armado.</p>;
  }

  return (
    <div className="space-y-4">
      {musica?.cancionEntrada && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">🎵 Canción de Entrada</h4>
          <p className="text-sm font-medium">{musica.cancionEntrada}</p>
        </div>
      )}
      {musica?.cancionVals && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">💃 Vals / Baile Especial</h4>
          <p className="text-sm font-medium">{musica.cancionVals}</p>
        </div>
      )}
      {musica?.cancionesTortaBrindis && musica.cancionesTortaBrindis.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">🥂 Torta & Brindis</h4>
          <ul className="space-y-1">
            {musica.cancionesTortaBrindis.map((c, i) => <li key={i} className="text-sm">• {c}</li>)}
          </ul>
        </div>
      )}
      {musica?.listaNoReproducir && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">🚫 No Reproducir</h4>
          <p className="text-sm text-muted-foreground">{musica.listaNoReproducir}</p>
        </div>
      )}
      {musica?.sugerenciasInvitados && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">🎶 Sugerencias Generales</h4>
          <p className="text-sm">{musica.sugerenciasInvitados}</p>
        </div>
      )}
      {songSuggestions.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">🎵 Pedidos de Invitados ({songSuggestions.length})</h4>
          <div className="flex flex-wrap gap-2">
            {songSuggestions.map((song, i) => (
              <Badge key={i} variant="outline" className="text-xs">{song}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProveedorContent() {
  const params = useParams();
  const fiestaId = params.id as string;

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [menu, setMenu] = useState<FullMenu | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const f = await getFiestaById(fiestaId);
        if (!f) throw new Error('Evento no encontrado');
        setFiesta(f);
        if (f.menuAsignadoId) {
          const m = await getMenuById(f.menuAsignadoId);
          setMenu(m || null);
        }
      } catch (err: any) {
        setError(err.message || 'Error al cargar el evento');
      } finally {
        setIsLoading(false);
      }
    }
    if (fiestaId) load();
  }, [fiestaId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !fiesta) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500" />
        <h2 className="text-xl font-bold">Evento no disponible</h2>
        <p className="text-muted-foreground text-sm max-w-xs">{error || 'Este link de proveedor no es válido o el evento no existe.'}</p>
      </div>
    );
  }

  const { configuracion, programa, musica, invitados } = fiesta;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">AK Producciones Eventos</p>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                {configuracion.nombreEvento || 'Evento'}
              </h1>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
            {configuracion.fechaEvento && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(configuracion.fechaEvento)}
              </span>
            )}
            {configuracion.nombreLugar && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {configuracion.nombreLugar}
              </span>
            )}
            {configuracion.invitadosEstimados && (
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                ~{configuracion.invitadosEstimados} invitados
              </span>
            )}
          </div>
          <div className="mt-2">
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
              🔒 Vista solo lectura para proveedores
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Cronograma */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="w-5 h-5 text-primary" />
              Cronograma del Evento
            </CardTitle>
            <CardDescription>Itinerario del día para coordinación de proveedores</CardDescription>
          </CardHeader>
          <CardContent>
            <ItinerarioSection programa={programa || []} />
          </CardContent>
        </Card>

        {/* Menú / Catering */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Utensils className="w-5 h-5 text-primary" />
              Menú / Gastronomía
            </CardTitle>
            <CardDescription>Detalle del catering para el evento</CardDescription>
          </CardHeader>
          <CardContent>
            <MenuSection fiesta={fiesta} menu={menu} />
          </CardContent>
        </Card>

        {/* Música */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Music className="w-5 h-5 text-primary" />
              Música & Pedidos
            </CardTitle>
            <CardDescription>Canciones especiales y pedidos de invitados para el DJ</CardDescription>
          </CardHeader>
          <CardContent>
            <MusicSection musica={musica} invitados={invitados} />
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="border-t bg-white mt-6 py-4">
        <div className="max-w-2xl mx-auto px-4 text-center text-xs text-muted-foreground space-y-1">
          <p className="font-medium">AK Producciones Eventos</p>
          <p>Gaboto 3390, Salto, Uruguay · 📲 098 355 530</p>
          <p className="text-[10px]">Este link es de uso exclusivo para proveedores. No contiene información financiera.</p>
        </div>
      </div>
    </div>
  );
}

export default function ProveedorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <ProveedorContent />
    </Suspense>
  );
}
