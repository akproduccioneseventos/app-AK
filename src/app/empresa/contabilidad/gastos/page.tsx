
'use client';

import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, PlusCircle, Trash2, Loader2, AlertTriangle, Calculator, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getGastosGenerales, saveGastoGeneral, deleteGastoGeneral } from '@/app/actions/gastos';
import type { GastoGeneral, CategoriaGasto } from '@/types/gastos';
import { ALL_CATEGORIAS_GASTO } from '@/types/gastos';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

const formatCurrency = (amount: number) => new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
const formatDate = (date: string) => new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

export default function GastosGeneralesPage() {
  const { toast } = useToast();
  const [gastos, setGastos] = useState<GastoGeneral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [fecha, setFecha] = useState<Date | undefined>(new Date());
  const [concepto, setConcepto] = useState('');
  const [categoria, setCategoria] = useState<CategoriaGasto>('Otro');
  const [monto, setMonto] = useState('');
  const [notas, setNotas] = useState('');

  const loadGastos = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getGastosGenerales();
      setGastos(data);
    } catch (e) {
      toast({ title: "Error", description: "No se pudieron cargar los gastos.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadGastos();
  }, [loadGastos]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!fecha || !concepto.trim() || !monto) {
      toast({ title: "Datos incompletos", description: "Fecha, concepto y monto son requeridos.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    const result = await saveGastoGeneral({
      fecha: fecha.toISOString(),
      concepto,
      categoria,
      monto: parseFloat(monto),
      notas,
    });
    if (result.success) {
      toast({ title: "Gasto Registrado" });
      setConcepto(''); setCategoria('Otro'); setMonto(''); setNotas('');
      await loadGastos();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setIsSaving(false);
  };
  
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const result = await deleteGastoGeneral(id);
    if(result.success) {
      toast({ title: "Gasto Eliminado" });
      await loadGastos();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setDeletingId(null);
  }

  const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calculator className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Gastos Generales</h1>
        </div>
        <Link href="/empresa/contabilidad">
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver al Panel Contable</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registrar Nuevo Gasto</CardTitle>
          <CardDescription>Añade aquí los gastos operativos de tu empresa que no están ligados a un evento específico.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1"><Label htmlFor="gasto-fecha">Fecha*</Label><DatePickerDemo selectedDate={fecha} onDateChange={setFecha}/></div>
                <div className="space-y-1"><Label htmlFor="gasto-monto">Monto (UYU)*</Label><Input id="gasto-monto" type="number" value={monto} onChange={e => setMonto(e.target.value)} placeholder="0.00" min="0.01" step="any" required/></div>
            </div>
            <div className="space-y-1"><Label htmlFor="gasto-concepto">Concepto*</Label><Input id="gasto-concepto" value={concepto} onChange={e => setConcepto(e.target.value)} placeholder="Ej: Compra de nueva pista LED, Reparación de parlante" required/></div>
            <div className="space-y-1"><Label htmlFor="gasto-categoria">Categoría*</Label><Select value={categoria} onValueChange={v => setCategoria(v as CategoriaGasto)}><SelectTrigger id="gasto-categoria"><SelectValue/></SelectTrigger><SelectContent>{ALL_CATEGORIAS_GASTO.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label htmlFor="gasto-notas">Notas</Label><Textarea id="gasto-notas" value={notas} onChange={e => setNotas(e.target.value)} placeholder="Detalles adicionales, proveedor, etc." rows={2}/></div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <PlusCircle className="w-4 h-4 mr-2"/>} Registrar Gasto</Button>
          </CardFooter>
        </form>
      </Card>
      
       <Card>
        <CardHeader>
          <CardTitle>Historial de Gastos</CardTitle>
          <CardDescription>Total de Gastos Generales: <span className="font-bold text-primary">{formatCurrency(totalGastos)}</span></CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
            {isLoading ? <div className="text-center p-4"><Loader2 className="w-6 h-6 animate-spin"/></div> : 
             gastos.length > 0 ? (
                gastos.map(gasto => (
                    <div key={gasto.id} className="p-3 border rounded-md flex justify-between items-center bg-muted/40">
                       <div>
                            <p className="font-semibold">{gasto.concepto} <span className="text-xs text-muted-foreground ml-2">({gasto.categoria})</span></p>
                            <p className="text-sm text-muted-foreground">{formatDate(gasto.fecha)} - <span className="font-medium text-destructive/80">{formatCurrency(gasto.monto)}</span></p>
                       </div>
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" disabled={deletingId === gasto.id}>
                                {deletingId === gasto.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>¿Eliminar este gasto?</AlertDialogTitle><AlertDialogDescription>"{gasto.concepto}" por {formatCurrency(gasto.monto)} será eliminado.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(gasto.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                       </AlertDialog>
                    </div>
                ))
             ) : <p className="text-center text-muted-foreground p-4">No hay gastos generales registrados.</p>
           }
        </CardContent>
      </Card>
    </div>
  );
}
