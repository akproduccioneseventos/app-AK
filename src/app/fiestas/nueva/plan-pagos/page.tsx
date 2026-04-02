'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Save, Loader2, CreditCard, CheckCircle2, AlertTriangle, Clock, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getPlanDePagos, savePlanDePagos, updateCuotaEstado } from '@/app/actions/payment-plans';
import type { PlanDePagos, CuotaPlanPago, PlanPagoEstadoCuota } from '@/types/fiesta';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function PlanPagosContent() {
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId') ?? '';
  const { toast } = useToast();

  const [plan, setPlan] = useState<PlanDePagos | null>(null);
  const [cuotas, setCuotas] = useState<CuotaPlanPago[]>([]);
  const [notas, setNotas] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPlan = useCallback(async () => {
    if (!fiestaId) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const data = await getPlanDePagos(fiestaId);
      if (data) {
        setPlan(data);
        setCuotas(data.cuotas);
        setNotas(data.notas ?? '');
      }
    } catch {
      toast({ title: 'Error', description: 'No se pudo cargar el plan de pagos.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId, toast]);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  const totalMonto = cuotas.reduce((sum, c) => sum + c.monto, 0);
  const totalPagado = cuotas.reduce((sum, c) => {
    if (c.estado === 'pagado') return sum + c.monto;
    if (c.estado === 'parcial') return sum + (c.montoPagado ?? 0);
    return sum;
  }, 0);
  const saldo = totalMonto - totalPagado;

  const addCuota = () => {
    const newCuota: CuotaPlanPago = {
      id: `cuota_${Date.now()}`,
      descripcion: `Cuota ${cuotas.length + 1}`,
      monto: 0,
      fechaVencimiento: new Date().toISOString().split('T')[0],
      estado: 'pendiente',
    };
    setCuotas(prev => [...prev, newCuota]);
  };

  const updateCuota = (id: string, field: keyof CuotaPlanPago, value: string | number) => {
    setCuotas(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeCuota = (id: string) => {
    setCuotas(prev => prev.filter(c => c.id !== id));
  };

  const handleSave = async () => {
    if (!fiestaId) {
      toast({ title: 'Error', description: 'No se encontró el ID de la fiesta.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const result = await savePlanDePagos(fiestaId, { cuotas, notas });
      if (result.success && result.plan) {
        setPlan(result.plan);
        toast({ title: 'Plan guardado', description: 'El plan de pagos fue guardado exitosamente.' });
      } else {
        toast({ title: 'Error', description: result.error ?? 'No se pudo guardar.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Error inesperado al guardar.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkPaid = async (cuotaId: string) => {
    if (!fiestaId) return;
    const result = await updateCuotaEstado(fiestaId, cuotaId, {
      estado: 'pagado',
      fechaPago: new Date().toISOString().split('T')[0],
    });
    if (result.success) {
      toast({ title: 'Cuota marcada como pagada' });
      fetchPlan();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const estadoBadge = (estado: PlanPagoEstadoCuota) => {
    switch (estado) {
      case 'pagado': return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />Pagado</Badge>;
      case 'vencido': return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Vencido</Badge>;
      case 'parcial': return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Parcial</Badge>;
      default: return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
    }
  };

  if (!fiestaId) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center text-muted-foreground">
        <AlertTriangle className="w-10 h-10 mx-auto mb-3" />
        <p>No se especificó una fiesta. Accedé desde la página de la fiesta.</p>
        <Link href="/fiestas"><Button variant="outline" className="mt-4">Ir a Fiestas</Button></Link>
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Plan de Pagos</h1>
            <p className="text-muted-foreground text-sm">Gestioná las cuotas y pagos del evento</p>
          </div>
        </div>
        <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Fiesta
          </Button>
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total</p>
            <p className="text-2xl font-bold">${totalMonto.toLocaleString('es-UY')}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-green-200">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Pagado</p>
            <p className="text-2xl font-bold text-green-600">${totalPagado.toLocaleString('es-UY')}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-orange-200">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Saldo</p>
            <p className="text-2xl font-bold text-orange-600">${saldo.toLocaleString('es-UY')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Cuotas */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center justify-between">
            Cuotas
            <Button size="sm" onClick={addCuota} variant="outline">
              <Plus className="w-4 h-4 mr-1.5" />
              Agregar Cuota
            </Button>
          </CardTitle>
          <CardDescription>Definí las cuotas y registrá los pagos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {cuotas.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No hay cuotas definidas. Agregá la primera.</p>
          ) : (
            cuotas.map((cuota, idx) => (
              <div key={cuota.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Cuota #{idx + 1}</span>
                  <div className="flex items-center gap-2">
                    {estadoBadge(cuota.estado)}
                    <Button size="sm" variant="ghost" className="text-destructive h-7 w-7 p-0" onClick={() => removeCuota(cuota.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Descripción</Label>
                    <Input
                      value={cuota.descripcion}
                      onChange={e => updateCuota(cuota.id, 'descripcion', e.target.value)}
                      placeholder="Seña, Cuota 1, Saldo Final..."
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Monto ($)</Label>
                    <Input
                      type="number"
                      value={cuota.monto}
                      onChange={e => updateCuota(cuota.id, 'monto', parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Fecha de Vencimiento</Label>
                    <Input
                      type="date"
                      value={cuota.fechaVencimiento}
                      onChange={e => updateCuota(cuota.id, 'fechaVencimiento', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Estado</Label>
                    <Select value={cuota.estado} onValueChange={val => updateCuota(cuota.id, 'estado', val)}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="pagado">Pagado</SelectItem>
                        <SelectItem value="vencido">Vencido</SelectItem>
                        <SelectItem value="parcial">Parcial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {cuota.estado !== 'pagado' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-green-500 text-green-600 hover:bg-green-50"
                    onClick={() => handleMarkPaid(cuota.id)}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    Registrar Pago
                  </Button>
                )}
                {cuota.fechaPago && (
                  <p className="text-xs text-muted-foreground">
                    Pagado el {format(new Date(cuota.fechaPago), "d MMM yyyy", { locale: es })}
                    {cuota.metodoPago && ` · ${cuota.metodoPago}`}
                  </p>
                )}
              </div>
            ))
          )}
        </CardContent>
        <CardFooter className="border-t pt-4 space-y-3 flex-col items-start">
          <div className="w-full space-y-1">
            <Label className="text-sm font-medium">Notas del plan</Label>
            <Textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              placeholder="Condiciones especiales, acuerdos, etc."
              rows={2}
              className="resize-none"
            />
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {isSaving ? 'Guardando...' : 'Guardar Plan de Pagos'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function PlanPagosPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <PlanPagosContent />
    </Suspense>
  );
}
