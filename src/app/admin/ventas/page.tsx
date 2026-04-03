'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { KanbanSquare, Loader2, AlertTriangle, ArrowLeft, Calendar, Users, RefreshCw, CheckCircle2, Clock, TrendingUp, PhoneCall, FileText, Banknote, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestas, updateCrmStatusFiesta } from '@/app/actions/fiesta-actual';
import type { FiestaEnPlanificacion, FiestaCrmStatus } from '@/types/fiesta';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const CRM_STATUSES: FiestaCrmStatus[] = [
  'Lead/Consulta',
  'Reunión Agendada',
  'Cotizado',
  'Reservado/Seña',
  'Completado',
];

const STATUS_CONFIG: Record<FiestaCrmStatus, { label: string; color: string; badgeClass: string; icon: React.ElementType; description: string }> = {
  'Lead/Consulta': {
    label: 'Lead / Consulta',
    color: 'border-slate-300 bg-slate-50',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    icon: PhoneCall,
    description: 'Nuevas consultas recibidas',
  },
  'Reunión Agendada': {
    label: 'Reunión Agendada',
    color: 'border-blue-300 bg-blue-50',
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-300',
    icon: Calendar,
    description: 'Reunión de presentación coordinada',
  },
  'Cotizado': {
    label: 'Cotizado',
    color: 'border-amber-300 bg-amber-50',
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-300',
    icon: FileText,
    description: 'Presupuesto enviado al cliente',
  },
  'Reservado/Seña': {
    label: 'Reservado / Seña',
    color: 'border-emerald-300 bg-emerald-50',
    badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    icon: Banknote,
    description: 'Seña recibida, evento confirmado',
  },
  'Completado': {
    label: 'Completado',
    color: 'border-purple-300 bg-purple-50',
    badgeClass: 'bg-purple-100 text-purple-700 border-purple-300',
    icon: CheckCircle2,
    description: 'Evento realizado con éxito',
  },
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Sin fecha';
  try {
    return new Date(dateString).toLocaleDateString('es-UY', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return 'Fecha inválida'; }
};

function FiestaCard({ fiesta, onStatusChange }: { fiesta: FiestaEnPlanificacion; onStatusChange: (id: string, status: FiestaCrmStatus) => void }) {
  const router = useRouter();
  const currentStatus: FiestaCrmStatus = fiesta.crmStatus || 'Lead/Consulta';
  const config = STATUS_CONFIG[currentStatus];

  return (
    <div className={cn('rounded-xl border-2 p-3 bg-white shadow-sm hover:shadow-md transition-shadow cursor-default', config.color)}>
      <div
        className="font-semibold text-sm text-slate-800 leading-tight mb-1 cursor-pointer hover:underline"
        onClick={() => router.push(`/fiestas/nueva?fiestaId=${fiesta.id}`)}
      >
        {fiesta.configuracion.nombreEvento || `Evento #${fiesta.id.slice(-4)}`}
      </div>
      <div className="text-xs text-slate-500 flex items-center gap-1 mb-1">
        <Calendar className="w-3 h-3" />
        {formatDate(fiesta.configuracion.fechaEvento)}
      </div>
      {fiesta.configuracion.invitadosEstimados ? (
        <div className="text-xs text-slate-500 flex items-center gap-1 mb-2">
          <Users className="w-3 h-3" />
          {fiesta.configuracion.invitadosEstimados} invitados
        </div>
      ) : null}
      {fiesta.configuracion.tipoCelebracion ? (
        <div className="mb-2">
          <Badge variant="outline" className="text-[10px] py-0">{fiesta.configuracion.tipoCelebracion}</Badge>
        </div>
      ) : null}
      <Select
        value={currentStatus}
        onValueChange={(val) => onStatusChange(fiesta.id, val as FiestaCrmStatus)}
      >
        <SelectTrigger className="h-7 text-xs w-full mt-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CRM_STATUSES.map((s) => (
            <SelectItem key={s} value={s} className="text-xs">
              {STATUS_CONFIG[s].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function AdminVentasPage() {
  const { toast } = useToast();
  const [fiestas, setFiestas] = useState<FiestaEnPlanificacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const all = await getFiestas(true);
      setFiestas(all);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleStatusChange = async (fiestaId: string, newStatus: FiestaCrmStatus) => {
    setUpdatingId(fiestaId);
    try {
      await updateCrmStatusFiesta(fiestaId, newStatus);
      setFiestas(prev => prev.map(f => f.id === fiestaId ? { ...f, crmStatus: newStatus } : f));
      toast({ title: 'Estado actualizado', description: `Movido a "${STATUS_CONFIG[newStatus].label}"` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setUpdatingId(null);
    }
  };

  const grouped = CRM_STATUSES.reduce<Record<FiestaCrmStatus, FiestaEnPlanificacion[]>>((acc, status) => {
    acc[status] = fiestas.filter(f => (f.crmStatus || 'Lead/Consulta') === status);
    return acc;
  }, {} as Record<FiestaCrmStatus, FiestaEnPlanificacion[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/eventos">
          <Button variant="outline" size="icon" className="h-9 w-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <KanbanSquare className="w-6 h-6 text-primary" />
            Tablero Comercial
          </h1>
          <p className="text-sm text-muted-foreground">Pipeline de ventas — {fiestas.length} evento(s) en total</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
          <RefreshCw className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')} />
          Actualizar
        </Button>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {CRM_STATUSES.map(status => {
          const config = STATUS_CONFIG[status];
          const count = grouped[status].length;
          const Icon = config.icon;
          return (
            <Card key={status} className={cn('border-2', config.color)}>
              <CardContent className="p-3 text-center">
                <Icon className="w-5 h-5 mx-auto mb-1 text-slate-600" />
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-[10px] text-muted-foreground leading-tight">{config.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto">
        {CRM_STATUSES.map(status => {
          const config = STATUS_CONFIG[status];
          const cards = grouped[status];
          const Icon = config.icon;
          return (
            <div key={status} className="min-w-[220px]">
              <div className={cn('rounded-xl border-2 p-3 mb-3', config.color)}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4" />
                  <span className="font-semibold text-sm">{config.label}</span>
                  <Badge variant="outline" className="ml-auto text-[10px] py-0 px-1">{cards.length}</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">{config.description}</p>
              </div>
              <div className="space-y-2">
                {cards.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                    Sin eventos
                  </div>
                ) : (
                  cards.map(fiesta => (
                    <FiestaCard
                      key={fiesta.id}
                      fiesta={fiesta}
                      onStatusChange={handleStatusChange}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
