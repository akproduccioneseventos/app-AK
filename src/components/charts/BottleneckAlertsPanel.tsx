'use client';

import { AlertTriangle, AlertCircle, Info, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { BottleneckAlert } from '@/app/actions/analytics';
import { cn } from '@/lib/utils';

interface Props {
  alerts: BottleneckAlert[];
}

const NIVEL_CONFIG = {
  critico: {
    icon: AlertTriangle,
    badgeClass: 'bg-red-100 text-red-700 border-red-200',
    rowClass: 'border-l-4 border-red-400 bg-red-50',
    label: 'Crítico',
  },
  advertencia: {
    icon: AlertCircle,
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
    rowClass: 'border-l-4 border-amber-400 bg-amber-50',
    label: 'Advertencia',
  },
  info: {
    icon: Info,
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
    rowClass: 'border-l-4 border-blue-400 bg-blue-50',
    label: 'Info',
  },
};

const TIPO_LABELS: Record<BottleneckAlert['tipo'], string> = {
  presupuesto_tardio: 'Presupuesto tardío',
  tarea_vencida: 'Tarea vencida',
  proveedor_sin_confirmar: 'Proveedor sin confirmar',
  evento_sin_presupuesto: 'Evento sin presupuesto',
};

export function BottleneckAlertsPanel({ alerts }: Props) {
  return (
    <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden bg-white">
      <CardHeader className="bg-slate-50 border-b border-slate-100 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-50">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <CardTitle className="text-xl sm:text-2xl font-black tracking-tight text-slate-800">
              Detección de Cuellos de Botella
            </CardTitle>
            <CardDescription className="text-slate-400 font-medium">
              Alertas automáticas sobre retrasos y bloqueos operativos.
            </CardDescription>
          </div>
          {alerts.length > 0 && (
            <Badge className="ml-auto bg-red-500 text-white border-0 font-black text-xs px-2.5 py-1">
              {alerts.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="p-4 rounded-full bg-emerald-50">
              <Info className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-sm font-semibold text-slate-500">¡Todo en orden! No hay cuellos de botella detectados.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => {
              const cfg = NIVEL_CONFIG[alert.nivel];
              const Icon = cfg.icon;
              return (
                <div
                  key={alert.id}
                  className={cn('rounded-2xl p-4 flex items-start gap-3', cfg.rowClass)}
                >
                  <Icon className="w-5 h-5 shrink-0 mt-0.5 opacity-70" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-black text-sm text-slate-800 truncate">{alert.mensaje}</span>
                      <Badge variant="outline" className={cn('text-[10px] font-bold uppercase tracking-wide px-2 py-0.5', cfg.badgeClass)}>
                        {TIPO_LABELS[alert.tipo]}
                      </Badge>
                    </div>
                    {alert.detalle && (
                      <p className="text-xs text-slate-500 font-medium">{alert.detalle}</p>
                    )}
                  </div>
                  {alert.dias !== undefined && (
                    <div className="flex items-center gap-1 shrink-0 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">{alert.dias}d</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
