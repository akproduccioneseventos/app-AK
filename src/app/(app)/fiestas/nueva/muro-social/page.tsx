'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Gamepad2, Tv, ExternalLink, QrCode, Sparkles, Loader2 } from 'lucide-react';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

export default function MuroSocialPlannerPage() {
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId') || '';
  const [loading, setLoading] = useState(true);
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);

  useEffect(() => {
    if (!fiestaId) {
      setLoading(false);
      return;
    }
    async function loadData() {
      setLoading(true);
      try {
        const res = await getFiestaById(fiestaId);
        if (res) setFiesta(res);
      } catch (e) {
        console.error("Error loading fiesta:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [fiestaId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm font-medium text-slate-600">Cargando Muro Social...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}>
            <Button variant="ghost" size="sm" className="gap-1 pl-1 text-slate-500 mb-1">
              <ArrowLeft className="w-4 h-4" /> Volver al Planificador
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black font-headline text-slate-900 tracking-tight flex items-center gap-2">
            <Gamepad2 className="w-7 h-7 text-violet-600" /> Muro Social & Pantalla Gigante AK
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Mural interactivo, fotos en vivo, juegos, moderación y playlist para la Pantalla LED.
          </p>
        </div>

        {fiesta && (
          <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl text-right shrink-0">
            <p className="text-xs text-slate-500">Evento vinculado:</p>
            <p className="font-bold text-slate-900 dark:text-white text-sm">{fiesta.configuracion?.nombreEvento}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="border border-violet-200 bg-violet-50/50 p-6 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-violet-600 text-white rounded-xl">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-violet-950 text-base">Pantalla Gigante en Vivo</h3>
              <p className="text-xs text-violet-800 mt-1 leading-relaxed">
                Transmisión en tiempo real de fotos con marco de la fiesta, mensajes de invitados y dinámicas interactivas.
              </p>
              <div className="mt-4">
                <Link href={`/evento/en-vivo/${fiestaId}`} target="_blank">
                  <Button className="bg-violet-600 hover:bg-violet-700 text-white gap-2 font-bold text-xs">
                    <ExternalLink className="w-4 h-4" /> Abrir Muro en Vivo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border border-indigo-200 bg-indigo-50/50 p-6 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-600 text-white rounded-xl">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-indigo-950 text-base">Moderación de Fotos & Mensajes</h3>
              <p className="text-xs text-indigo-800 mt-1 leading-relaxed">
                Filtra los contenidos subidos por invitados antes o durante su proyección en la pantalla gigante.
              </p>
              <div className="mt-4">
                <Link href={`/evento/moderacion/${fiestaId}`} target="_blank">
                  <Button variant="outline" className="border-indigo-300 text-indigo-950 hover:bg-indigo-100 gap-2 font-bold text-xs">
                    <ExternalLink className="w-4 h-4" /> Abrir Panel de Moderación
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
