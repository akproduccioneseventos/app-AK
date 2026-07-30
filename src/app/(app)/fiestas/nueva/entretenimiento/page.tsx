'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles,
  Camera,
  Video,
  QrCode,
  ExternalLink,
  Tv,
  Smartphone,
  Copy,
  Check,
  ShieldCheck,
  RefreshCw,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { getEntretenimientoFiesta } from '@/app/actions/fiesta/entretenimiento.actions';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

export default function EntretenimientoPortalPage() {
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId') || '';
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [copiedStation, setCopiedStation] = useState<string | null>(null);

  useEffect(() => {
    if (!fiestaId) {
      setLoading(false);
      return;
    }
    async function loadData() {
      setLoading(true);
      try {
        const res = await getFiestaById(fiestaId);
        if (res) {
          setFiesta(res);
        }
      } catch (e) {
        console.error("Error loading fiesta:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [fiestaId]);

  const copyUrl = (path: string, stationId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const fullUrl = `${origin}${path}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedStation(stationId);
    toast({
      title: "Enlace Copiado",
      description: "La URL de la estación ha sido copiada al portapapeles.",
    });
    setTimeout(() => setCopiedStation(null), 2500);
  };

  const stations = [
    {
      id: 'fotocabina',
      title: 'Fotocabina HD',
      description: 'Estación de fotos con marcos personalizados, filtros y descarga rápida vía QR.',
      icon: Camera,
      badge: 'Popular',
      color: 'from-purple-500 to-indigo-600',
      path: `/evento/fotocabina/${fiestaId}`,
    },
    {
      id: 'plataforma360',
      title: 'Plataforma 360° Video',
      description: 'Captura de videos en cámara lenta con efectos en tiempo real y descarga instantánea.',
      icon: Video,
      badge: 'VIP',
      color: 'from-rose-500 to-pink-600',
      path: `/evento/plataforma-360/${fiestaId}`,
    },
    {
      id: 'espejoMagico',
      title: 'Espejo Mágico Interactivo',
      description: 'Espejo gigante táctil con firmas digitales, stickers y fotos grupales.',
      icon: Sparkles,
      badge: 'Premium',
      color: 'from-amber-500 to-orange-600',
      path: `/evento/espejo-magico/${fiestaId}`,
    },
    {
      id: 'bogue',
      title: 'Bogue Booth',
      description: 'Cabina estilo revista con iluminación profesional y plantillas personalizadas.',
      icon: Smartphone,
      badge: 'Exclusivo',
      color: 'from-emerald-500 to-teal-600',
      path: `/evento/bogue/${fiestaId}`,
    },
    {
      id: 'touchpix',
      title: 'TouchPix Pro',
      description: 'Integración táctil instantánea con la pantalla gigante y el Muro Social.',
      icon: Tv,
      badge: 'Pantalla Gigante',
      color: 'from-blue-500 to-cyan-600',
      path: `/evento/touchpix/${fiestaId}`,
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm font-medium text-slate-600">Cargando Portal de Entretenimiento...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}>
              <Button variant="ghost" size="sm" className="gap-1 pl-1 text-slate-500">
                <ArrowLeft className="w-4 h-4" /> Volver al Planificador
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-headline text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-amber-500" /> Portal de Entretenimiento AK
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Gestión centralizada de Fotocabina, Plataforma 360, Espejo Mágico y tótems interactivos.
          </p>
        </div>

        {fiesta && (
          <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl text-right shrink-0">
            <p className="text-xs text-slate-500">Evento vinculado:</p>
            <p className="font-bold text-slate-900 dark:text-white text-sm">{fiesta.configuracion?.nombreEvento}</p>
          </div>
        )}
      </div>

      {/* Overview Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-48 h-48" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/30 mb-3">
            Centro de Operaciones en Vivo
          </Badge>
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Estaciones Interactivas del Evento</h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">
            Todas las capturas realizadas en estas estaciones se sincronizan en tiempo real con la Galería HD, la Pantalla Gigante AK y el Portal del Cliente.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href={`/evento/en-vivo/${fiestaId}`} target="_blank">
              <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-2">
                <Tv className="w-4 h-4" /> Abrir Pantalla Gigante en Vivo
              </Button>
            </Link>
            <Link href={`/galeria-led`} target="_blank">
              <Button variant="outline" className="border-slate-700 text-slate-200 hover:bg-slate-800 gap-2">
                <ExternalLink className="w-4 h-4" /> Ver Galería HD
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
        {stations.map((station) => {
          const Icon = station.icon;
          const isCopied = copiedStation === station.id;

          return (
            <Card key={station.id} className="border border-slate-200 hover:border-indigo-300 transition-all duration-200 hover:shadow-lg flex flex-col justify-between overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2.5 rounded-xl text-white bg-gradient-to-r ${station.color} shadow-md`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <Badge variant="outline" className="text-xs font-bold border-slate-300">
                    {station.badge}
                  </Badge>
                </div>
                <CardTitle className="text-base font-bold text-slate-900">{station.title}</CardTitle>
                <CardDescription className="text-xs text-slate-500 leading-relaxed">
                  {station.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0 space-y-3">
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs gap-1.5 border-slate-200"
                    onClick={() => copyUrl(station.path, station.id)}
                    disabled={!fiestaId}
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {isCopied ? "¡Copiado!" : "Copiar Enlace"}
                  </Button>

                  <Link href={fiestaId ? station.path : '#'} target="_blank" className={!fiestaId ? 'pointer-events-none' : ''}>
                    <Button size="sm" className="text-xs gap-1.5 bg-slate-900 hover:bg-slate-800 text-white" disabled={!fiestaId}>
                      <ExternalLink className="w-3.5 h-3.5" /> Abrir Estación
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
