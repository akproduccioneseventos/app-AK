
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  History, 
  PlusCircle, 
  Search, 
  Loader2, 
  AlertTriangle, 
  Copy, 
  Trash2, 
  CalendarDays, 
  Users,
  TrendingUp,
  RotateCw,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestasHistoricas, deleteFiestaHistorica, generarDesdeHistorico, calcularAjusteHistorico } from '@/app/actions/fiestas-historicas';
import type { FiestaHistorica } from '@/types/fiesta-historica';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(amount);

export default function FiestasHistoricasPage() {
  const { toast } = useToast();
  const [historicos, setHistoricos] = useState<FiestaHistorica[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Duplication Dialog State
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [selectedSource, setSelectedSource] = useState<FiestaHistorica | null>(null);
  const [newYear, setNewYear] = useState<number>(new Date().getFullYear() + 1);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getFiestasHistoricas();
      setHistoricos(data.sort((a, b) => b.anioOriginal - a.anioOriginal));
    } catch (e) {
      toast({ title: "Error", description: "No se pudo cargar el historial.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: string) => {
    setIsProcessing(id);
    const result = await deleteFiestaHistorica(id);
    if (result.success) {
      toast({ title: "Registro eliminado" });
      await fetchData();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setIsProcessing(null);
  };

  const handleDuplicate = async () => {
    if (!selectedSource) return;
    setIsProcessing(selectedSource.id);
    try {
      const result = await generarDesdeHistorico(selectedSource.id, newYear);
      if (result.success) {
        toast({ title: "¡Evento Generado!", description: "Se ha creado un nuevo presupuesto y planificación basada en el histórico." });
        setIsDuplicating(false);
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: "Error al duplicar", description: e.message, variant: "destructive" });
    } finally {
      setIsProcessing(null);
    }
  };

  const filtered = historicos.filter(h => 
    h.nombreEvento.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const proyeccion = selectedSource ? calcularAjusteHistorico(selectedSource.presupuestoTotalOriginal, selectedSource.anioOriginal, newYear) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <History className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Fiestas Historias (Base de Proyección)</h1>
        </div>
        <div className="flex gap-2">
           <Link href="/admin/carga-historicos">
            <Button variant="default">
              <PlusCircle className="w-4 h-4 mr-2" />
              Cargar Nueva Base Histórica
            </Button>
          </Link>
          <Link href="/empresa/contabilidad">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por evento o cliente..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(item => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="mb-2">{item.anioOriginal}</Badge>
                      <p className="text-xs text-muted-foreground font-mono">{formatCurrency(item.presupuestoTotalOriginal)}</p>
                    </div>
                    <CardTitle className="text-lg font-headline line-clamp-1">{item.nombreEvento}</CardTitle>
                    <CardDescription>{item.clienteNombre}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="w-4 h-4" />
                      <span>{item.tipoFiesta}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{item.cantidadInvitados} invitados</span>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4 flex justify-between gap-2">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="flex-grow"
                      onClick={() => {
                        setSelectedSource(item);
                        setNewYear(new Date().getFullYear() + 1);
                        setIsDuplicating(true);
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicar con Ajuste 15%
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive h-9 w-9"
                      onClick={() => handleDelete(item.id)}
                      disabled={isProcessing === item.id}
                    >
                      {isProcessing === item.id ? <Loader2 className="animate-spin w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <History className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-3" />
              <p className="text-muted-foreground">No se encontraron registros históricos.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Duplication Dialog */}
      <Dialog open={isDuplicating} onOpenChange={setIsDuplicating}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generar Nuevo Presupuesto</DialogTitle>
            <DialogDescription>
              Ajuste automático del 15% anual compuesto desde el año original.
            </DialogDescription>
          </DialogHeader>
          {selectedSource && proyeccion && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted/50 rounded-md border text-sm space-y-1">
                <p><strong>Evento Original:</strong> {selectedSource.nombreEvento} ({selectedSource.anioOriginal})</p>
                <p><strong>Monto Base:</strong> {formatCurrency(selectedSource.presupuestoTotalOriginal)}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-year">Año del Nuevo Evento</Label>
                <Input 
                  id="new-year" 
                  type="number" 
                  value={newYear} 
                  onChange={e => setNewYear(parseInt(e.target.value))}
                  min={selectedSource.anioOriginal}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Años transcurridos:</span>
                  <span className="font-semibold">{proyeccion.añosTranscurridos}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Factor de ajuste (15% compuesto):</span>
                  <span className="font-semibold text-primary">x {proyeccion.factorAjuste.toFixed(4)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <span className="font-medium text-primary flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Nuevo Monto Estimado:
                  </span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(proyeccion.montoAjustado)}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDuplicating(false)}>Cancelar</Button>
            <Button onClick={handleDuplicate} disabled={!!isProcessing}>
              {isProcessing ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <RotateCw className="w-4 h-4 mr-2" />}
              Generar Todo Automáticamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
