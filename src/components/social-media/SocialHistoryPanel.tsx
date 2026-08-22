'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Instagram,
  Youtube,
  Facebook,
  Share2,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  getSocialHistorySummary,
  sincronizarHistorialRedesAction,
  type SocialHistorySummary,
  type PlatformHistoryDetail,
} from '@/app/actions/social-history';
import { useToast } from '@/hooks/use-toast';

function formatFecha(iso?: string) {
  if (!iso) return 'Sin fecha';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Sin fecha';
  return d.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatHora(iso?: string) {
  if (!iso) return 'Pendiente';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Pendiente';
  return d.toLocaleString('es-UY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getPlatformIcon(platform: string) {
  switch (platform.toLowerCase()) {
    case 'instagram':
      return <Instagram className="h-5 w-5 text-pink-600" />;
    case 'youtube':
      return <Youtube className="h-5 w-5 text-red-600" />;
    case 'facebook':
      return <Facebook className="h-5 w-5 text-blue-600" />;
    default:
      return <Share2 className="h-5 w-5 text-slate-600" />;
  }
}

export function SocialHistoryPanel({ onSyncCompleted }: { onSyncCompleted?: () => void }) {
  const [summary, setSummary] = useState<SocialHistorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{
    success: boolean;
    mensaje: string;
  } | null>(null);
  const { toast } = useToast();

  const loadSummary = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSocialHistorySummary();
      setSummary(data);
    } catch {
      // Manejo silencioso de error de carga
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const handleSyncAll = async () => {
    try {
      setSyncing(true);
      setLastSyncResult(null);
      const res = await sincronizarHistorialRedesAction({ forceFull: true });
      setLastSyncResult({
        success: res.success,
        mensaje: res.mensaje,
      });

      if (res.success) {
        toast({
          title: 'Historial actualizado',
          description: res.mensaje,
        });
        await loadSummary();
        onSyncCompleted?.();
      } else {
        toast({
          title: 'Aviso de sincronización',
          description: res.mensaje,
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      const msg = err?.message || 'Error al conectar con las redes.';
      setLastSyncResult({
        success: false,
        mensaje: msg,
      });
      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const platforms: PlatformHistoryDetail[] = summary?.platforms || [
    { platform: 'Instagram', total: 0, isComplete: false },
    { platform: 'YouTube', total: 0, isComplete: false },
    { platform: 'Facebook', total: 0, isComplete: false },
  ];

  return (
    <Card className="shadow-sm border-slate-200 bg-white">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
              <Layers className="h-5 w-5 text-indigo-600" />
              Historial de Publicaciones en Redes
            </CardTitle>
            <CardDescription className="text-xs text-slate-600 mt-1">
              Controlá el historial completo de publicaciones guardadas en la app y sincronizá con las redes en un clic.
            </CardDescription>
          </div>
          <Button
            onClick={handleSyncAll}
            disabled={syncing || loading}
            size="sm"
            className="gap-2 font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Actualizar ahora'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {lastSyncResult && (
          <div
            className={`p-3 rounded-lg text-xs border flex items-start gap-2 ${
              lastSyncResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            {lastSyncResult.success ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{lastSyncResult.mensaje}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {platforms.map((plat) => {
            const hasPosts = plat.total > 0;
            return (
              <div
                key={plat.platform}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getPlatformIcon(plat.platform)}
                    <span className="font-bold text-slate-900 text-sm">{plat.platform}</span>
                  </div>
                  {plat.isComplete ? (
                    <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700 text-[11px] font-semibold">
                      Historial completo
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700 text-[11px] font-semibold">
                      {hasPosts ? 'Sincronización parcial' : 'Sin sincronizar'}
                    </Badge>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Guardadas:</span>
                    <strong className="text-slate-900 font-bold">{plat.total} publicaciones</strong>
                  </div>
                  {hasPosts && (
                    <>
                      <div className="flex justify-between">
                        <span>Más antigua:</span>
                        <span className="text-slate-800">{formatFecha(plat.oldestDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Más reciente:</span>
                        <span className="text-slate-800">{formatFecha(plat.newestDate)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between pt-1 border-t border-slate-200/80 text-[11px]">
                    <span className="text-slate-500">Última búsqueda:</span>
                    <span className="text-slate-700 font-medium">{formatHora(plat.lastSyncAt)}</span>
                  </div>
                </div>

                {plat.error && (
                  <p className="text-[11px] text-amber-800 bg-amber-100/60 p-2 rounded border border-amber-200">
                    {plat.error}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
