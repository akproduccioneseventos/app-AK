'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { AlertaErrorHumano } from '@/lib/alertas/errores-humanos';
import { descartarAlertaErrorHumano } from '@/app/actions/alertas-errores-humanos';

interface AlertasErroresHumanosSectionProps {
  initialAlertas: AlertaErrorHumano[];
}

export default function AlertasErroresHumanosSection({ initialAlertas }: AlertasErroresHumanosSectionProps) {
  const { toast } = useToast();
  const [alertas, setAlertas] = useState<AlertaErrorHumano[]>(initialAlertas);
  const [selectedAlerta, setSelectedAlerta] = useState<AlertaErrorHumano | null>(null);
  const [motivoDescarte, setMotivoDescarte] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenDescarte = (alerta: AlertaErrorHumano) => {
    setSelectedAlerta(alerta);
    setMotivoDescarte('');
  };

  const handleConfirmDescarte = async () => {
    if (!selectedAlerta) return;
    if (!motivoDescarte.trim()) {
      toast({
        title: 'Motivo requerido',
        description: 'Tenés que escribir un motivo para descartar la alerta (por ejemplo: "El cliente paga en mano el día del evento").',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await descartarAlertaErrorHumano(selectedAlerta.id, motivoDescarte);
      if (res.success) {
        setAlertas((prev) => prev.filter((a) => a.id !== selectedAlerta.id));
        toast({
          title: 'Alerta silenciada',
          description: `Se guardó el motivo: "${motivoDescarte}". Esta alerta no volverá a molestar.`,
        });
        setSelectedAlerta(null);
      } else {
        throw new Error(res.error);
      }
    } catch (e: any) {
      toast({ title: 'Error al silenciar', description: e.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUrgenciaBadge = (urgencia: AlertaErrorHumano['urgencia'], dias: number) => {
    if (dias < 0) {
      return <Badge className="bg-rose-600 text-white hover:bg-rose-600">PASADO (HACE {Math.abs(dias)} DÍAS)</Badge>;
    }
    switch (urgencia) {
      case 'peligro_2_dias':
        return <Badge className="bg-red-600 text-white animate-pulse hover:bg-red-600">PELIGRO (FALTAN {dias} DÍAS)</Badge>;
      case 'urgente_7_dias':
        return <Badge className="bg-amber-600 text-white hover:bg-amber-600">URGENTE (FALTAN {dias} DÍAS)</Badge>;
      case 'atencion_15_dias':
        return <Badge className="bg-blue-600 text-white hover:bg-blue-600">ATENCIÓN (FALTAN {dias} DÍAS)</Badge>;
      default:
        return <Badge variant="outline" className="text-slate-600 border-slate-300">PLANIFICACIÓN ({dias} DÍAS)</Badge>;
    }
  };

  const getCategoriaLabel = (cat: AlertaErrorHumano['categoria']) => {
    switch (cat) {
      case 'plata_papeles': return 'Plata y Papeles';
      case 'vendido_vs_cargado': return 'Vendido vs Cargado';
      case 'comida': return 'Comida y Menú';
      case 'personal_salon': return 'Personal y Salón';
      case 'cliente': return 'Cliente y Portal';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-600" />
            Avisos de Errores Humanos Previos a las Fiestas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Detección automática en tiempo real: contratos, señas, servicios vendidos vs cargados, menús, personal y salón.
          </p>
        </div>
        <Badge variant="outline" className="font-mono text-xs">
          {alertas.length} aviso{alertas.length === 1 ? '' : 's'} activo{alertas.length === 1 ? '' : 's'}
        </Badge>
      </div>

      {alertas.length === 0 ? (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-8 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-base font-bold text-emerald-950">Cero errores humanos detectados</p>
              <p className="text-xs text-emerald-700 mt-0.5">Todas las fiestas activas tienen sus contratos, pagos, menú, personal y servicios en orden.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {alertas.map((alerta) => (
            <Card
              key={alerta.id}
              className={`border transition-shadow hover:shadow-md flex flex-col justify-between ${
                alerta.urgencia === 'peligro_2_dias'
                  ? 'border-red-300 bg-red-50/20'
                  : alerta.urgencia === 'urgente_7_dias'
                  ? 'border-amber-300 bg-amber-50/20'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <CardHeader className="p-4 pb-2 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {getCategoriaLabel(alerta.categoria)}
                  </span>
                  {getUrgenciaBadge(alerta.urgencia, alerta.diasRestantes)}
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 leading-tight">
                  {alerta.titulo}
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-slate-700">
                  {alerta.fiestaNombre} · {alerta.fechaEvento}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3 flex-grow flex flex-col justify-between">
                <p className="text-xs text-slate-600 leading-relaxed mt-1">
                  {alerta.descripcion}
                </p>

                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <Button asChild size="sm" className="h-8 text-xs rounded-lg font-bold gap-1 bg-slate-900 text-white hover:bg-slate-800">
                    <Link href={alerta.accionUrl}>
                      {alerta.accionLabel}
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-slate-500 hover:text-slate-900"
                    onClick={() => handleOpenDescarte(alerta)}
                  >
                    Está bien así
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para descartar con motivo obligatorio */}
      <Dialog open={!!selectedAlerta} onOpenChange={(open) => !open && setSelectedAlerta(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Silenciar aviso: &quot;{selectedAlerta?.titulo}&quot;
            </DialogTitle>
            <DialogDescription className="text-xs">
              Para no perder el control ni acostumbrar al equipo a ignorar avisos, es obligatorio dejar constancia del motivo por el cual esto queda así.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-700">
              <strong>Evento:</strong> {selectedAlerta?.fiestaNombre} ({selectedAlerta?.fechaEvento})
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="motivo-descarte" className="text-xs font-bold">
                Motivo / Justificación
              </Label>
              <Input
                id="motivo-descarte"
                value={motivoDescarte}
                onChange={(e) => setMotivoDescarte(e.target.value)}
                placeholder="Ej: Acordado verbalmente con el cliente; abona en efectivo el sábado."
                className="text-xs"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setSelectedAlerta(null)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleConfirmDescarte} disabled={isSubmitting || !motivoDescarte.trim()} className="bg-slate-900 text-white">
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Check className="w-3.5 h-3.5 mr-1.5" />}
              Confirmar y Silenciar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

