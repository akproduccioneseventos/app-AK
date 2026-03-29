'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Sparkles, Loader2, CalendarClock, ListChecks, DollarSign, CreditCard, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDashboardKpiData, type GlobalAlert } from '@/app/actions/dashboard';
import { cn } from '@/lib/utils';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

function getAlertIcon(type: GlobalAlert['type']) {
  switch (type) {
    case 'meeting':
      return <CalendarClock className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />;
    case 'task':
      return <ListChecks className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />;
    case 'budget':
      return <DollarSign className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />;
    case 'payment':
      return <CreditCard className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />;
    default:
      return <Sparkles className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />;
  }
}

function getSeverityColor(severity: GlobalAlert['severity']) {
  return severity === 'high' ? 'border-l-rose-400' : 'border-l-amber-300';
}

export function AKAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<GlobalAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadData = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    try {
      const result = await getDashboardKpiData();
      if (result.success && result.data) {
        setAlerts(result.data.alerts ?? []);
      }
    } catch {
      // silent fail – widget is non-critical
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [loaded]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const greeting = getGreeting();
  const highCount = alerts.filter((a) => a.severity === 'high').length;
  const summaryText =
    alerts.length === 0
      ? '¡Todo en orden por ahora! 🎉'
      : highCount > 0
      ? `Tienes ${highCount} ${pluralize(highCount, 'asunto urgente', 'asuntos urgentes')} hoy.`
      : `Tienes ${alerts.length} ${pluralize(alerts.length, 'recordatorio pendiente', 'recordatorios pendientes')}.`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 print:hidden">
      {/* Panel */}
      {isOpen && (
        <Card className="w-80 sm:w-96 shadow-2xl border border-slate-200 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CardHeader className="bg-gradient-to-r from-slate-800 to-indigo-900 text-white px-4 py-3 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-400" />
              <CardTitle className="text-sm font-semibold">Asistente AK</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar asistente"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 bg-white max-h-[60vh] overflow-y-auto space-y-3">
            {/* Greeting */}
            <div>
              <p className="text-sm font-semibold text-slate-800">{greeting} ✨</p>
              <p className="text-xs text-slate-500 mt-0.5">{summaryText}</p>
            </div>

            {/* Loading skeleton */}
            {loading && (
              <div className="flex items-center justify-center py-6 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-xs">Cargando resumen…</span>
              </div>
            )}

            {/* Alert list */}
            {!loading && alerts.length === 0 && loaded && (
              <p className="text-xs text-slate-400 text-center py-4">No hay alertas pendientes.</p>
            )}

            {!loading && alerts.length > 0 && (
              <ul className="space-y-2">
                {alerts.map((alert) => (
                  <li key={alert.id}>
                    <Link
                      href={alert.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'flex items-start gap-2 p-2.5 rounded-xl border-l-4 bg-slate-50 hover:bg-slate-100 transition-colors group',
                        getSeverityColor(alert.severity)
                      )}
                    >
                      {getAlertIcon(alert.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700 leading-tight truncate">{alert.title}</p>
                        <p className="text-[11px] text-slate-500 truncate">{alert.description}</p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 shrink-0 mt-0.5 transition-colors" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* Floating trigger button */}
      <Button
        onClick={() => setIsOpen((prev) => !prev)}
        className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white border-0 relative"
        aria-label="Abrir Asistente AK"
        size="icon"
      >
        <Sparkles className="h-6 w-6" />
        {!isOpen && alerts.length > 0 && (
          <Badge
            className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-[10px] bg-rose-500 border-2 border-white text-white rounded-full pointer-events-none"
          >
            {alerts.length}
          </Badge>
        )}
      </Button>
    </div>
  );
}
