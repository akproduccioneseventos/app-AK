
'use client';

import React, { useState, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { importarPresupuestoDesdeTexto } from '@/app/actions/presupuestos';
import { parseBudgetText } from '@/lib/parse-budget-text';
import type { ParsedBudget } from '@/lib/parse-budget-text';

const VANA_FIXTURE = `PRESUPUESTO PARA FIESTAS O EVENTOS - AK PRODUCCIONES

Cliente: Vana Rodríguez
Fecha del evento: Mayo 2026
Fecha del presupuesto: 19/10/2025
Validez: 30 días
Condición: Para asegurar el presupuesto debe abonar el 20% del total como seña.

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

Metre
Cantidad: 1
Precio unitario: $3.500
Descuento: 0%
Importe: $3.500

Vajilla completa
Cantidad: 150
Precio unitario: $70
Descuento: 15%
Importe: $10.500

Mantelería completa
Cantidad: 150
Precio unitario: $70
Descuento: 15%
Importe: $10.500

Entrada 23: Sandwiches y Saladitos
Cantidad: 150
Precio unitario: $220
Descuento: 15%
Importe: $33.000

Entrada 8: Picada de fiambres
Cantidad: 150
Precio unitario: $180
Descuento: 15%
Importe: $27.000

Asador
Cantidad: 1
Precio unitario: $4.500
Descuento: 15%
Importe: $4.500

Mesa buffets
Cantidad: 100
Precio unitario: $180
Descuento: 0%
Importe: $18.000

Plato principal 1: Hamburguesa c/ fritas
Cantidad: 50
Precio unitario: $290
Descuento: 15%
Importe: $14.500

Discoteca intermedia
Cantidad: 1
Precio unitario: $15.000
Descuento: 15%
Importe: $15.000

Fotografía de fiestas
Cantidad: 1
Precio unitario: $9.000
Descuento: 15%
Importe: $9.000

Fotografía de exteriores
Cantidad: 1
Precio unitario: $3.800
Descuento: 15%
Importe: $3.800

Fotografía de la pintada
Cantidad: 1
Precio unitario: $3.800
Descuento: 15%
Importe: $3.800

Filmación de la fiesta
Cantidad: 1
Precio unitario: $9.000
Descuento: 15%
Importe: $9.000

Fotocabina
Cantidad: 1
Precio unitario: $2.900
Descuento: 15%
Importe: $2.900

Barra de tragos, canilla libre
Cantidad: 150
Precio unitario: $350
Descuento: 15%
Importe: $52.500

Refresco
Cantidad: 150
Precio unitario: $150
Descuento: 0%
Importe: $22.500

Cerveza corona
Cantidad: 150
Precio unitario: $250
Descuento: 0%
Importe: $37.500

Hielo
Cantidad: 8
Precio unitario: $450
Descuento: 0%
Importe: $3.600

Torta principal
Cantidad: 150
Precio unitario: $100
Descuento: 15%
Importe: $15.000

Mesa de postres - Chesecake
Cantidad: 1
Precio unitario: $1.200
Descuento: 15%
Importe: $1.200

Mesa de postres - Rogel.
Cantidad: 1
Precio unitario: $1.600
Descuento: 15%
Importe: $1.600

Mesa de postres - Lemon pae
Cantidad: 1
Precio unitario: $1.100
Descuento: 15%
Importe: $1.100

Postre Nro. 6: Selva Negra
Cantidad: 1
Precio unitario: $1.400
Descuento: 15%
Importe: $1.400

Mesa de postres - Flan de coco
Cantidad: 1
Precio unitario: $1.000
Descuento: 15%
Importe: $1.000

Mesa de postres - Tarta frutal
Cantidad: 1
Precio unitario: $1.100
Descuento: 15%
Importe: $1.100

Invitaciones digitales
Cantidad: 1
Precio unitario: $2.500
Descuento: 100%
Importe: $0

Video de vida
Cantidad: 1
Precio unitario: $2.500
Descuento: 100%
Importe: $0

Pantalla gigante y proyector
Cantidad: 1
Precio unitario: $2.500
Descuento: 100%
Importe: $0

Album digital personalizado
Cantidad: 1
Precio unitario: $3.500
Descuento: 100%
Importe: $0

Cofee break
Cantidad: 1
Precio unitario: $3.500
Descuento: 100%
Importe: $0

Fuegos fríos
Cantidad: 1
Precio unitario: $3.000
Descuento: 100%
Importe: $0

Lluvia de burbujas
Cantidad: 1
Precio unitario: $1.500
Descuento: 100%
Importe: $0

IMPORTE TOTAL: $338.300`;

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0 }).format(n);

function ImportarPresupuestoContent() {
  const router = useRouter();
  const { toast } = useToast();

  const [texto, setTexto] = useState('');
  const [parsed, setParsed] = useState<ParsedBudget | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [crearFiesta, setCrearFiesta] = useState(true);
  const [eventoFechaOverride, setEventoFechaOverride] = useState('');
  const [senaManual, setSenaManual] = useState('');
  const [auditAceptado, setAuditAceptado] = useState(false);

  const handleParseText = useCallback(() => {
    if (!texto.trim()) {
      toast({ title: 'Texto vacío', description: 'Pegá el texto del presupuesto primero.', variant: 'destructive' });
      return;
    }
    setIsParsing(true);
    try {
      const result = parseBudgetText(texto);
      setParsed(result);
      setAuditAceptado(false);
      if (result.eventoFecha) {
        setEventoFechaOverride(new Date(result.eventoFecha).toISOString().split('T')[0]);
      }
    } catch (e: any) {
      toast({ title: 'Error al parsear', description: e.message, variant: 'destructive' });
    } finally {
      setIsParsing(false);
    }
  }, [texto, toast]);

  const handleLoadFixture = () => {
    setTexto(VANA_FIXTURE);
    setParsed(null);
  };

  const handleImport = async () => {
    if (!texto.trim()) return;
    setIsSaving(true);
    try {
      const sena = senaManual ? parseFloat(senaManual.replace(/\./g, '').replace(',', '.')) : undefined;
      const result = await importarPresupuestoDesdeTexto(texto, {
        crearFiesta,
        eventoFechaOverride: eventoFechaOverride
          ? new Date(eventoFechaOverride + 'T12:00:00').toISOString()
          : undefined,
        senaManual: sena,
      });

      if (!result.success) {
        toast({ title: 'Error al importar', description: result.error, variant: 'destructive' });
        return;
      }

      if (result.warnings && result.warnings.length > 0) {
        toast({
          title: 'Importado con advertencias',
          description: result.warnings.join(' | '),
          variant: 'default',
        });
      } else {
        toast({ title: '¡Importado con éxito!', description: 'Presupuesto guardado correctamente.' });
      }

      if (result.fiestaId) {
        router.push(`/fiestas/nueva?fiestaId=${result.fiestaId}`);
      } else if (result.presupuestoId) {
        router.push(`/presupuestos/${result.presupuestoId}/ver`);
      }
    } catch (e: any) {
      toast({ title: 'Error inesperado', description: e.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const total = parsed?.totalDeclarado ?? 0;
  const senaPct = parsed?.senaCondicion ?? 20;
  const senaCalculada = senaManual
    ? parseFloat(senaManual.replace(/\./g, '').replace(',', '.')) || 0
    : Math.round(total * senaPct / 100);
  const saldo = total - senaCalculada;

  // ── Audit calculations ────────────────────────────────────────────────────
  const sumaItemsCobrados = parsed
    ? parsed.items.filter(it => !it.esRegalo).reduce((s, it) => s + it.precioUnitario * it.cantidad, 0)
    : 0;
  const sumaRegalos = parsed
    ? parsed.items.filter(it => it.esRegalo).reduce((s, it) => s + it.precioUnitario * it.cantidad, 0)
    : 0;
  const cantidadRegalos = parsed ? parsed.items.filter(it => it.esRegalo).length : 0;
  const diferenciaAudit = total > 0 ? total - sumaItemsCobrados : 0;
  const auditConDiferencia = total > 0 && Math.abs(diferenciaAudit) > 1;
  const canSave = !auditConDiferencia || auditAceptado;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight font-headline flex items-center gap-2">
          <ClipboardPaste className="w-7 h-7 text-primary" />
          Importar Presupuesto desde Texto
        </h1>
        <Link href="/presupuestos/nuevo">
          <Button variant="outline" size="sm" className="rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver
          </Button>
        </Link>
      </div>

      {/* Step 1: Paste text */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold uppercase tracking-widest text-slate-500">
            Paso 1 — Pegá el texto del presupuesto
          </CardTitle>
          <CardDescription>
            Copiá el texto completo del presupuesto (en el formato de AK Producciones) y pegalo acá.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            data-testid="import-budget-textarea"
            placeholder="Pegá aquí el texto del presupuesto..."
            className="min-h-[200px] font-mono text-xs"
            value={texto}
            onChange={e => { setTexto(e.target.value); setParsed(null); }}
          />
          <div className="flex gap-2 flex-wrap">
            <Button
              data-testid="btn-parse-text"
              onClick={handleParseText}
              disabled={isParsing || !texto.trim()}
              className="rounded-xl"
            >
              {isParsing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Analizar Texto
            </Button>
            <Button
              variant="outline"
              data-testid="btn-load-fixture"
              onClick={handleLoadFixture}
              className="rounded-xl text-xs"
            >
              <FileText className="w-4 h-4 mr-2" />
              Cargar ejemplo (Vana Rodríguez)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Parsed preview */}
      {parsed && (
        <Card data-testid="parsed-preview">
          <CardHeader>
            <CardTitle className="text-base font-bold uppercase tracking-widest text-slate-500">
              Paso 2 — Revisá los datos detectados
            </CardTitle>
            <CardDescription>
              Verificá que los datos sean correctos. Podés ajustar la fecha y la seña antes de guardar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {parsed.warnings.length > 0 && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <ul className="space-y-1">
                  {parsed.warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}

            {/* Main info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <FileText className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cliente</p>
                  <p className="font-bold" data-testid="parsed-cliente">{parsed.clienteNombre || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <PartyPopper className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo de Evento</p>
                  <p className="font-bold" data-testid="parsed-tipo">{parsed.eventoTipo || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Users className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Invitados (estimado)</p>
                  <p className="font-bold" data-testid="parsed-invitados">{parsed.invitadosCantidad || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <List className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ítems detectados</p>
                  <p className="font-bold" data-testid="parsed-items-count">{parsed.items.length}</p>
                </div>
              </div>
            </div>

            {/* Financial summary */}
            <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resumen Financiero</p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Total</p>
                  <p className="text-lg font-black text-slate-900" data-testid="parsed-total">{formatCurrency(total)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Seña ({senaPct}%)</p>
                  <p className="text-lg font-black text-emerald-600" data-testid="parsed-sena">{formatCurrency(senaCalculada)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Saldo</p>
                  <p className="text-lg font-black text-slate-600" data-testid="parsed-saldo">{formatCurrency(saldo)}</p>
                </div>
              </div>
            </div>

            {/* Adjustable fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Fecha del Evento
                </Label>
                <Input
                  type="date"
                  data-testid="input-fecha-evento"
                  value={eventoFechaOverride}
                  onChange={e => setEventoFechaOverride(e.target.value)}
                  className="rounded-xl"
                />
                {parsed.eventoFechaRaw && (
                  <p className="text-[10px] text-slate-400">Detectado: «{parsed.eventoFechaRaw}»</p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" /> Seña Manual (opcional)
                </Label>
                <Input
                  type="number"
                  placeholder={`${Math.round(total * senaPct / 100)} (${senaPct}%)`}
                  data-testid="input-sena-manual"
                  value={senaManual}
                  onChange={e => setSenaManual(e.target.value)}
                  className="rounded-xl"
                />
                <p className="text-[10px] text-slate-400">Dejar vacío para usar el {senaPct}% automático</p>
              </div>
            </div>

            {/* Items list */}
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ítems ({parsed.items.length})</p>
              <div className="max-h-64 overflow-y-auto rounded-xl border divide-y" data-testid="parsed-items-list">
                {parsed.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-50">
                    <div className="flex items-center gap-2 min-w-0">
                      {item.esRegalo && <Badge variant="outline" className="text-[9px] shrink-0">Bonificado</Badge>}
                      <span className="truncate">{item.nombreServicio}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-right">
                      <span className="text-[11px] text-slate-400">{item.cantidad}x</span>
                      <span className="font-bold text-[12px]">
                        {item.esRegalo ? '$0' : formatCurrency(item.precioUnitario * item.cantidad)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Crear fiesta toggle */}
            <div className="flex items-center justify-between p-4 bg-violet-50 border border-violet-100 rounded-xl">
              <div>
                <p className="font-bold text-sm text-violet-900">Crear Fiesta/Evento automáticamente</p>
                <p className="text-xs text-violet-600 mt-0.5">Se crea el evento vinculado al presupuesto y podés planificarlo de inmediato.</p>
              </div>
              <Switch
                data-testid="switch-crear-fiesta"
                checked={crearFiesta}
                onCheckedChange={setCrearFiesta}
              />
            </div>

            {/* Auditoría de totales */}
            {total > 0 && (
              <div className={`rounded-xl border-2 p-4 space-y-3 ${auditConDiferencia ? 'border-amber-400 bg-amber-50' : 'border-emerald-300 bg-emerald-50'}`} data-testid="audit-panel">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                  {auditConDiferencia
                    ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  }
                  Auditoría de totales
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total declarado</span>
                    <span className="font-bold" data-testid="audit-total-declarado">{formatCurrency(total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Suma ítems cobrados</span>
                    <span className="font-bold" data-testid="audit-suma-cobrados">{formatCurrency(sumaItemsCobrados)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Regalos ({cantidadRegalos} ítem{cantidadRegalos !== 1 ? 's' : ''})</span>
                    <span className="font-bold text-emerald-700" data-testid="audit-suma-regalos">{formatCurrency(sumaRegalos)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Diferencia</span>
                    <span className={`font-black ${auditConDiferencia ? 'text-amber-600' : 'text-emerald-600'}`} data-testid="audit-diferencia">
                      {auditConDiferencia ? formatCurrency(diferenciaAudit) : '✓ $0'}
                    </span>
                  </div>
                </div>
                {auditConDiferencia ? (
                  <div className="flex items-start gap-2 pt-2 border-t border-amber-200">
                    <input
                      type="checkbox"
                      id="audit-aceptado"
                      data-testid="audit-aceptado-checkbox"
                      checked={auditAceptado}
                      onChange={e => setAuditAceptado(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-amber-600"
                    />
                    <label htmlFor="audit-aceptado" className="text-xs text-amber-800 cursor-pointer">
                      Guardar igual, acepto que existe una diferencia de {formatCurrency(Math.abs(diferenciaAudit))} entre el total declarado y la suma de ítems.
                    </label>
                  </div>
                ) : (
                  <p className="text-xs text-emerald-700 pt-2 border-t border-emerald-200">
                    ✓ Los totales coinciden. El presupuesto es consistente.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Save */}
      {parsed && (
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setParsed(null)}
            className="rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            data-testid="btn-importar-guardar"
            onClick={handleImport}
            disabled={isSaving || !parsed.clienteNombre || !canSave}
            className="rounded-xl bg-primary hover:bg-primary/90 text-white font-bold"
          >
            {isSaving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</>
            ) : (
              <><CheckCircle2 className="w-4 h-4 mr-2" /> {crearFiesta ? 'Crear Presupuesto + Fiesta' : 'Crear Presupuesto'}</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ImportarPresupuestoPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <ImportarPresupuestoContent />
    </Suspense>
  );
}
