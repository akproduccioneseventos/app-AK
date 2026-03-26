'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TrendingUp, Undo2, AlertTriangle, CheckCircle2, History, ArrowLeft, Percent } from 'lucide-react';
import { applyPriceAdjustment, getPriceAdjustmentHistory, revertPriceAdjustment, type PriceAdjustmentRecord } from '@/app/actions/price-adjustments';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AjustePreciosPage() {
  const [percentage, setPercentage] = useState<string>('15');
  const [adjustmentType, setAdjustmentType] = useState<'precios' | 'costos' | 'ambos'>('ambos');
  const [isApplying, setIsApplying] = useState(false);
  const [isReverting, setIsReverting] = useState<string | null>(null);
  const [history, setHistory] = useState<PriceAdjustmentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getPriceAdjustmentHistory();
      setHistory(data);
    } catch {
      toast({ title: 'Error', description: 'No se pudo cargar el historial.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleApply = async () => {
    const pct = parseFloat(percentage);
    if (isNaN(pct) || pct === 0) {
      toast({ title: 'Error', description: 'Ingresa un porcentaje válido distinto de cero.', variant: 'destructive' });
      return;
    }
    setIsApplying(true);
    try {
      const result = await applyPriceAdjustment(pct, adjustmentType);
      if (result.success) {
        toast({ title: '¡Ajuste Aplicado!', description: `Se aplicó un ajuste de ${pct > 0 ? '+' : ''}${pct}% a ${result.record?.serviciosAfectados} servicios.` });
        fetchHistory();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsApplying(false);
    }
  };

  const handleRevert = async (id: string) => {
    setIsReverting(id);
    try {
      const result = await revertPriceAdjustment(id);
      if (result.success) {
        toast({ title: 'Ajuste Revertido', description: 'Los precios fueron restaurados exitosamente.' });
        fetchHistory();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsReverting(null);
    }
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const typeLabel = (t: string) => t === 'precios' ? 'Precios de Venta' : t === 'costos' ? 'Costos' : 'Precios y Costos';

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-headline">Ajuste Anual de Precios</h1>
            <p className="text-muted-foreground text-sm">Aplica ajustes porcentuales masivos a tu catálogo de servicios.</p>
          </div>
        </div>
        <Link href="/settings">
          <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
        </Link>
      </div>

      {/* Apply Adjustment Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Percent className="w-5 h-5" /> Aplicar Nuevo Ajuste</CardTitle>
          <CardDescription>Configura el porcentaje y tipo de ajuste a aplicar sobre todos los servicios del catálogo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="percentage">Porcentaje de Ajuste (%)</Label>
              <Input
                id="percentage"
                type="number"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                placeholder="15"
                min="-100"
                max="1000"
              />
              <p className="text-xs text-muted-foreground">Usa valores positivos para aumentar o negativos para reducir.</p>
            </div>
            <div className="space-y-2">
              <Label>Aplicar a</Label>
              <Select value={adjustmentType} onValueChange={(v: any) => setAdjustmentType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ambos">Precios y Costos</SelectItem>
                  <SelectItem value="precios">Solo Precios de Venta</SelectItem>
                  <SelectItem value="costos">Solo Costos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 flex gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">¡Atención!</p>
              <p>Este ajuste se aplicará a <strong>todos</strong> los servicios del catálogo. Los cambios se pueden revertir desde el historial de ajustes.</p>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="w-full h-12" disabled={isApplying}>
                {isApplying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TrendingUp className="w-4 h-4 mr-2" />}
                Aplicar Ajuste de {percentage || '0'}%
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Confirmar ajuste de precios?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se aplicará un ajuste de <strong>{percentage || '0'}%</strong> a {typeLabel(adjustmentType).toLowerCase()} de todos los servicios del catálogo. Esta acción se puede revertir desde el historial.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleApply}>Confirmar Ajuste</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><History className="w-5 h-5" /> Historial de Ajustes</CardTitle>
          <CardDescription>Registro de todos los ajustes aplicados. Puedes revertir los ajustes más recientes.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>
          ) : history.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No se han realizado ajustes de precios aún.</p>
          ) : (
            <div className="space-y-3">
              {history.map((record) => (
                <div key={record.id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border rounded-lg ${record.revertido ? 'bg-muted/50 opacity-60' : 'bg-card'}`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">
                        {record.percentage > 0 ? '+' : ''}{record.percentage}%
                      </span>
                      <Badge variant="outline" className="text-xs">{typeLabel(record.type)}</Badge>
                      <Badge variant="secondary" className="text-xs">{record.serviciosAfectados} servicios</Badge>
                      {record.revertido && <Badge variant="destructive" className="text-xs">Revertido</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDate(record.date)}</p>
                    {record.revertido && record.revertidoEn && (
                      <p className="text-xs text-muted-foreground">Revertido el: {formatDate(record.revertidoEn)}</p>
                    )}
                  </div>
                  {!record.revertido && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" disabled={isReverting === record.id}>
                          {isReverting === record.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Undo2 className="w-3 h-3 mr-1" />}
                          Revertir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Revertir este ajuste?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Se revertirá el ajuste de {record.percentage > 0 ? '+' : ''}{record.percentage}% aplicado el {formatDate(record.date)}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRevert(record.id)}>Confirmar Reversión</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
