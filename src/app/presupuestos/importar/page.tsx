'use client';

import React, { useState, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Loader2, ClipboardPaste, PartyPopper, AlertTriangle, CheckCircle2,
  FileText, Calendar, Users, DollarSign, List, Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { importarPresupuestoDesdeTexto } from '@/app/actions/importar-presupuesto';
import { parseBudgetText } from '@/lib/parse-budget-text';
import type { ParsedBudget } from '@/lib/parse-budget-text';

const VANA_FIXTURE = `PRESUPUESTO PARA FIESTAS O EVENTOS - AK PRODUCCIONES

Cliente: Vana Rodríguez
Fecha del evento: Mayo 2026
Fecha del presupuesto: 19/10/2025
Validez: 30 días
Condición: Para asegurar el presupuesto debe abonar el 20% del total como seña.
Invitados: 150
Adultos: 100
Niños: 50

DETALLE DE ARTÍCULOS

Mozos
Cantidad: 6
Precio unitario: $2.900
Descuento: 15%
Importe: $17.400

Mozo de cocina
Cantidad: 6
Precio unitario: $2.900
Descuento: 15%
Importe: $17.400

Discoteca intermedia
Cantidad: 1
Precio unitario: $15.000
Descuento: 15%
Importe: $15.000

TOTAL $50.000`;

function ImportarPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [crearFiesta, setCrearFiesta] = useState(false);
  const [senaManual, setSenaManual] = useState('');
  const [eventoFechaOverride, setEventoFechaOverride] = useState('');
  const [preview, setPreview] = useState<ParsedBudget | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handlePreview = useCallback(() => {
    const parsed = parseBudgetText(text);
    setPreview(parsed);
    setWarnings(parsed.warnings || []);
  }, [text]);

  const handleFixture = useCallback(() => {
    setText(VANA_FIXTURE);
    const parsed = parseBudgetText(VANA_FIXTURE);
    setPreview(parsed);
    setWarnings(parsed.warnings || []);
  }, []);

  const handleImport = useCallback(async () => {
    if (!text.trim()) {
      toast({ title: 'Pegá el presupuesto', description: 'No hay texto para importar.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const result = await importarPresupuestoDesdeTexto(text, {
        crearFiesta,
        senaManual: senaManual ? Number(senaManual) : undefined,
        eventoFechaOverride: eventoFechaOverride || undefined,
      });
      if (!result.success || !result.presupuestoId) {
        toast({ title: 'No se pudo importar', description: result.error || 'Error inesperado.', variant: 'destructive' });
        setWarnings(result.warnings || []);
        return;
      }
      toast({ title: 'Presupuesto importado', description: `Se creó el presupuesto ${result.presupuestoId}.` });
      router.push(`/presupuestos/${result.presupuestoId}/ver`);
    } finally {
      setLoading(false);
    }
  }, [text, crearFiesta, senaManual, eventoFechaOverride, toast, router]);

  const totalItems = preview?.items?.length || 0;
  const totalDeclarado = preview?.totalDeclarado || 0;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild><Link href="/presupuestos"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div>
            <h1 className="text-2xl font-bold">Importar presupuesto desde texto</h1>
            <p className="text-muted-foreground">Pegá el texto del presupuesto y la app lo convierte en presupuesto editable.</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ClipboardPaste className="h-5 w-5" /> Texto del presupuesto</CardTitle>
              <CardDescription>Incluye cliente, fecha, invitados, adultos/niños si están, artículos y total.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-[420px] font-mono text-sm" placeholder="Pegá acá el presupuesto..." />
              <div className="flex flex-wrap gap-2">
                <Button onClick={handlePreview} variant="secondary"><FileText className="mr-2 h-4 w-4" /> Revisar</Button>
                <Button onClick={handleFixture} variant="outline"><Sparkles className="mr-2 h-4 w-4" /> Ejemplo</Button>
                <Button onClick={handleImport} disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} Importar</Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Opciones</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div><Label>Crear fiesta también</Label><p className="text-xs text-muted-foreground">Además del presupuesto, crea evento en planificación.</p></div>
                  <Switch checked={crearFiesta} onCheckedChange={setCrearFiesta} />
                </div>
                <div className="space-y-2"><Label>Seña manual</Label><Input value={senaManual} onChange={(e) => setSenaManual(e.target.value)} type="number" placeholder="Opcional" /></div>
                <div className="space-y-2"><Label>Fecha del evento</Label><Input value={eventoFechaOverride} onChange={(e) => setEventoFechaOverride(e.target.value)} type="date" /></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Vista previa</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {preview ? (
                  <>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-lg border p-3"><Calendar className="mb-1 h-4 w-4" />{preview.eventoFechaRaw || 'Sin fecha'}</div>
                      <div className="rounded-lg border p-3"><Users className="mb-1 h-4 w-4" />{preview.invitadosCantidad} invitados</div>
                      <div className="rounded-lg border p-3"><List className="mb-1 h-4 w-4" />{totalItems} ítems</div>
                      <div className="rounded-lg border p-3"><DollarSign className="mb-1 h-4 w-4" />${totalDeclarado.toLocaleString('es-UY')}</div>
                    </div>
                    <Badge variant="secondary">{preview.clienteNombre}</Badge>
                  </>
                ) : <p className="text-sm text-muted-foreground">Sin revisar todavía.</p>}
                {warnings.length > 0 && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><AlertTriangle className="mb-2 h-4 w-4" />{warnings.map((w, i) => <p key={i}>• {w}</p>)}</div>}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ImportarPage() {
  return <Suspense fallback={<div className="p-8">Cargando...</div>}><ImportarPageContent /></Suspense>;
}
