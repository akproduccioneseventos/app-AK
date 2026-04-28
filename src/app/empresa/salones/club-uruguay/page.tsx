'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  CalendarDays,
  Download,
  ExternalLink,
  FileText,
  ImageIcon,
  Loader2,
  MessageCircle,
  Phone,
  PlusCircle,
  Printer,
  Save,
  Share2,
  Star,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Salon, SalonPago, SalonMetodoPago } from '@/types/salon';
import { SALON_METODOS_PAGO } from '@/types/salon';
import { getFiestas } from '@/app/actions/fiesta-actual';
import { getSalones, addSalonPago, deleteSalonPago, saveSalon } from '@/app/actions/salones';
import { isClubUruguay } from '@/lib/club-uruguay';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()).toLocaleDateString(
      'es-UY',
      { day: '2-digit', month: '2-digit', year: 'numeric' }
    );
  } catch {
    return dateStr;
  }
}

const formatCurrency = (n?: number) =>
  n !== undefined
    ? new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(n)
    : '—';

function estadoBadge(estado?: string) {
  const map: Record<string, string> = {
    'En Planificación': 'bg-blue-100 text-blue-700',
    Confirmado: 'bg-green-100 text-green-700',
    Realizado: 'bg-slate-100 text-slate-600',
    Cancelado: 'bg-red-100 text-red-600',
  };
  const cls = (estado && map[estado]) || 'bg-slate-100 text-slate-500';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${cls}`}
    >
      {estado || 'Sin estado'}
    </span>
  );
}

function exportCSV(fiestas: FiestaEnPlanificacion[]) {
  const header = ['Cliente', 'Evento', 'Tipo', 'Fecha', 'Estado', 'Invitados'];
  const rows = fiestas.map((f) => [
    f.configuracion.clienteNombre || f.configuracion.nombreEvento || '',
    f.configuracion.nombreEvento || '',
    f.configuracion.tipoCelebracion || '',
    formatDate(f.configuracion.fechaEvento),
    f.estado || '',
    String(f.configuracion.invitadosEstimados || 0),
  ]);
  const csv =
    '\uFEFF' +
    [header, ...rows]
      .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(','))
      .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'club-uruguay-fiestas.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function buildWhatsAppText(
  fiestas: FiestaEnPlanificacion[],
  pagos: SalonPago[],
  salonNombre: string
): string {
  const proximas = fiestas.filter(
    (f) => f.configuracion.fechaEvento && new Date(f.configuracion.fechaEvento) >= new Date()
  );
  const totalPagos = pagos.reduce((s, p) => s + p.monto, 0);

  const lines: string[] = [
    `📊 *Resumen ${salonNombre}*`,
    `Total de eventos: ${fiestas.length}`,
    `Próximos eventos: ${proximas.length}`,
  ];

  if (proximas.length > 0) {
    lines.push('', '📅 *Próximos eventos:*');
    proximas.slice(0, 5).forEach((f) => {
      lines.push(
        `• ${f.configuracion.clienteNombre || f.configuracion.nombreEvento} — ${formatDate(f.configuracion.fechaEvento)}`
      );
    });
  }

  if (pagos.length > 0) {
    lines.push('', `💳 *Pagos registrados:* ${pagos.length} pago(s) — Total: ${formatCurrency(totalPagos)}`);
  }

  lines.push('', `_AK Producciones Eventos_`);
  return lines.join('\n');
}

// ─── New Payment Dialog ───────────────────────────────────────────────────────

interface NewPagoDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (data: Omit<SalonPago, 'id'>) => Promise<void>;
  fiestas: FiestaEnPlanificacion[];
}

function NewPagoDialog({ open, onOpenChange, onSave, fiestas }: NewPagoDialogProps) {
  const [form, setForm] = useState<{
    fecha: string;
    monto: string;
    metodoPago: SalonMetodoPago;
    referencia: string;
    notas: string;
    fiestaId: string;
    comprobanteFile: File | null;
    comprobantePreview: string | null;
  }>({
    fecha: new Date().toISOString().split('T')[0],
    monto: '',
    metodoPago: 'Transferencia',
    referencia: '',
    notas: '',
    fiestaId: '',
    comprobanteFile: null,
    comprobantePreview: null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      setForm((p) => ({ ...p, comprobanteFile: file, comprobantePreview: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    const monto = parseFloat(form.monto);
    if (isNaN(monto) || monto <= 0) return;
    setIsSaving(true);
    try {
      const fiestaRef = fiestas.find((f) => f.id === form.fiestaId);
      await onSave({
        fecha: form.fecha,
        monto,
        metodoPago: form.metodoPago,
        referencia: form.referencia.trim() || undefined,
        notas: form.notas.trim() || undefined,
        fiestaId: form.fiestaId || undefined,
        fiestaDesc: fiestaRef
          ? fiestaRef.configuracion.clienteNombre || fiestaRef.configuracion.nombreEvento
          : undefined,
        comprobanteUrl: form.comprobantePreview || undefined,
      });
      onOpenChange(false);
      setForm({
        fecha: new Date().toISOString().split('T')[0],
        monto: '',
        metodoPago: 'Transferencia',
        referencia: '',
        notas: '',
        fiestaId: '',
        comprobanteFile: null,
        comprobantePreview: null,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>Registrar Pago al Salón</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Fecha *</Label>
              <Input type="date" value={form.fecha} onChange={(e) => setForm((p) => ({ ...p, fecha: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Monto (UYU) *</Label>
              <Input
                type="number"
                min="0"
                placeholder="Ej: 15000"
                value={form.monto}
                onChange={(e) => setForm((p) => ({ ...p, monto: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Método de Pago *</Label>
              <Select value={form.metodoPago} onValueChange={(v) => setForm((p) => ({ ...p, metodoPago: v as SalonMetodoPago }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SALON_METODOS_PAGO.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Referencia / Nro. Transferencia</Label>
              <Input
                placeholder="Nro. de transacción, nota..."
                value={form.referencia}
                onChange={(e) => setForm((p) => ({ ...p, referencia: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Evento vinculado (opcional)</Label>
            <Select value={form.fiestaId} onValueChange={(v) => setForm((p) => ({ ...p, fiestaId: v === '__none' ? '' : v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar evento..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Sin evento específico</SelectItem>
                {fiestas.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.configuracion.clienteNombre || f.configuracion.nombreEvento} — {formatDate(f.configuracion.fechaEvento)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Notas</Label>
            <Textarea
              placeholder="Observaciones del pago..."
              rows={2}
              value={form.notas}
              onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))}
            />
          </div>

          {/* Comprobante upload */}
          <div className="space-y-1.5">
            <Label>Comprobante / Captura de pago</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleFile}
            />
            {form.comprobantePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                {form.comprobanteFile?.type.startsWith('image/') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.comprobantePreview} alt="Comprobante" className="w-full max-h-40 object-contain" />
                ) : (
                  <div className="flex items-center gap-2 p-3 text-sm text-slate-600">
                    <FileText className="w-5 h-5" />
                    {form.comprobanteFile?.name}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, comprobanteFile: null, comprobantePreview: null }))}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center gap-2 py-5 border-2 border-dashed border-slate-200 rounded-xl hover:border-primary/40 hover:bg-slate-50 text-slate-400 hover:text-primary transition-colors"
              >
                <Upload className="w-6 h-6" />
                <span className="text-xs font-medium">Subir captura de pantalla o PDF del pago</span>
              </button>
            )}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isSaving || !form.monto || parseFloat(form.monto) <= 0}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Registrar Pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Gerente Config Dialog ─────────────────────────────────────────────────

interface GerenteDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  salon: Salon;
  onSaved: (s: Salon) => void;
}

function GerenteDialog({ open, onOpenChange, salon, onSaved }: GerenteDialogProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ nombre: salon.gerente?.nombre || '', whatsapp: salon.gerente?.whatsapp || '', email: salon.gerente?.email || '' });

  useEffect(() => {
    if (open) setForm({ nombre: salon.gerente?.nombre || '', whatsapp: salon.gerente?.whatsapp || '', email: salon.gerente?.email || '' });
  }, [open, salon]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await saveSalon({ ...salon, gerente: { nombre: form.nombre.trim() || undefined, whatsapp: form.whatsapp.trim() || undefined, email: form.email.trim() || undefined } });
      if (!result.success) throw new Error(result.error);
      toast({ title: 'Gerente actualizado', description: 'Los datos del gerente fueron guardados.' });
      if (result.salon) onSaved(result.salon);
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Configurar Gerente del Salón</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nombre del Gerente</Label>
            <Input value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} placeholder="Ej: Juan Pérez" />
          </div>
          <div className="space-y-1.5">
            <Label>WhatsApp (con código de país)</Label>
            <Input value={form.whatsapp} onChange={(e) => setForm((p) => ({ ...p, whatsapp: e.target.value }))} placeholder="+598 99 123 456" />
          </div>
          <div className="space-y-1.5">
            <Label>Email (opcional)</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="gerente@salon.com" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ClubUruguayPage() {
  const { toast } = useToast();
  const [fiestas, setFiestas] = useState<FiestaEnPlanificacion[]>([]);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewPagoOpen, setIsNewPagoOpen] = useState(false);
  const [isGerenteOpen, setIsGerenteOpen] = useState(false);
  const [deletingPagoId, setDeletingPagoId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allFiestas, allSalones] = await Promise.all([
        getFiestas(true),
        getSalones(),
      ]);
      const cu = allFiestas.filter((f) => isClubUruguay(f.configuracion.nombreLugar));
      setFiestas(cu);
      const cuSalon = allSalones.find((s) => s.esClubUruguay || isClubUruguay(s.nombre));
      setSalon(cuSalon || null);
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar los datos.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const proximas = useMemo(() => {
    const today = new Date();
    return fiestas
      .filter((f) => f.configuracion.fechaEvento && new Date(f.configuracion.fechaEvento) >= today)
      .sort((a, b) => new Date(a.configuracion.fechaEvento!).getTime() - new Date(b.configuracion.fechaEvento!).getTime());
  }, [fiestas]);

  const realizadas = useMemo(() => {
    const today = new Date();
    return fiestas.filter((f) => {
      if (!f.configuracion.fechaEvento) return true;
      return new Date(f.configuracion.fechaEvento) < today;
    });
  }, [fiestas]);

  const countByTipo = useMemo(() => {
    const map: Record<string, number> = {};
    fiestas.forEach((f) => {
      const tipo = f.configuracion.tipoCelebracion || 'Otro';
      map[tipo] = (map[tipo] || 0) + 1;
    });
    return map;
  }, [fiestas]);

  const pagos: SalonPago[] = useMemo(() => salon?.pagos || [], [salon]);
  const totalPagos = useMemo(() => pagos.reduce((s, p) => s + p.monto, 0), [pagos]);

  const handleAddPago = async (pago: Omit<SalonPago, 'id'>) => {
    if (!salon) return;
    const result = await addSalonPago(salon.id, pago);
    if (!result.success) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Pago registrado', description: 'El pago fue guardado correctamente.' });
    await fetchData();
  };

  const handleDeletePago = async (pagoId: string) => {
    if (!salon) return;
    setDeletingPagoId(pagoId);
    try {
      const result = await deleteSalonPago(salon.id, pagoId);
      if (!result.success) throw new Error(result.error);
      toast({ title: 'Pago eliminado' });
      await fetchData();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setDeletingPagoId(null);
    }
  };

  const whatsappManagerUrl = useMemo(() => {
    const num = salon?.gerente?.whatsapp;
    if (!num) return null;
    const digits = num.replace(/[^\d+]/g, '').replace(/^\+/, '');
    const text = buildWhatsAppText(fiestas, pagos, salon?.nombre || 'Club Uruguay');
    return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
  }, [salon, fiestas, pagos]);

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500 rounded-xl text-white shadow-lg shadow-amber-500/30">
            <Star className="w-6 h-6 fill-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Club Uruguay</h1>
            <p className="text-sm text-muted-foreground">
              Dashboard de eventos y documentación del Club Uruguay
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            className="border-amber-300 text-amber-700 hover:bg-amber-50"
            onClick={() => exportCSV(fiestas)}
            disabled={isLoading || fiestas.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" onClick={handlePrint} title="Imprimir dashboard">
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          {whatsappManagerUrl && (
            <a href={whatsappManagerUrl} target="_blank" rel="noopener noreferrer">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <MessageCircle className="w-4 h-4 mr-2" />
                Enviar Resumen al Gerente
              </Button>
            </a>
          )}
          <Link href="/empresa/salones">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
        </div>
      </div>

      {/* Print header (only visible when printing) */}
      <div className="hidden print:block mb-4">
        <h1 className="text-2xl font-black">Club Uruguay — Reporte de Eventos y Pagos</h1>
        <p className="text-sm text-slate-500">Generado el {new Date().toLocaleDateString('es-UY')}</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
        </div>
      ) : (
        <>
          {/* Gerente contact card */}
          <Card className={`border-emerald-100 bg-emerald-50/40 print:hidden`}>
            <CardHeader className="pb-2 pt-4 px-5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-headline text-base text-emerald-800">Gerente del Salón</CardTitle>
                <CardDescription className="text-xs">
                  {salon?.gerente?.nombre
                    ? `Contacto: ${salon.gerente.nombre}`
                    : 'Configure los datos del gerente para comunicarse directamente'}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                onClick={() => setIsGerenteOpen(true)}
                disabled={!salon}
              >
                {salon?.gerente?.nombre ? 'Editar' : 'Configurar'}
              </Button>
            </CardHeader>
            {salon?.gerente && (
              <CardContent className="px-5 pb-4">
                <div className="flex flex-wrap gap-3">
                  {salon.gerente.nombre && (
                    <span className="text-sm font-semibold text-emerald-800">{salon.gerente.nombre}</span>
                  )}
                  {salon.gerente.whatsapp && (
                    <a
                      href={`https://wa.me/${salon.gerente.whatsapp.replace(/[^\d+]/g, '').replace(/^\+/, '')}?text=${encodeURIComponent('Hola, te escribo de parte de AK Producciones.')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {salon.gerente.whatsapp}
                    </a>
                  )}
                  {salon.gerente.email && (
                    <a
                      href={`mailto:${salon.gerente.email}`}
                      className="flex items-center gap-1.5 text-sm text-slate-600 hover:underline"
                    >
                      {salon.gerente.email}
                    </a>
                  )}
                </div>
              </CardContent>
            )}
          </Card>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-amber-100 bg-amber-50/50">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardDescription className="text-xs font-bold uppercase tracking-widest text-amber-600">Total eventos</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-4xl font-black text-amber-700">{fiestas.length}</p>
              </CardContent>
            </Card>
            <Card className="border-blue-100 bg-blue-50/50">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardDescription className="text-xs font-bold uppercase tracking-widest text-blue-600">Próximos</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-4xl font-black text-blue-700">{proximas.length}</p>
              </CardContent>
            </Card>
            <Card className="border-slate-100">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-500">Realizados</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-4xl font-black text-slate-700">{realizadas.length}</p>
              </CardContent>
            </Card>
            <Card className="border-emerald-100 bg-emerald-50/40">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardDescription className="text-xs font-bold uppercase tracking-widest text-emerald-600">Total pagos</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-2xl font-black text-emerald-700">{formatCurrency(totalPagos)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Tipo breakdown */}
          {Object.keys(countByTipo).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-base">Conteo por Tipo de Evento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(countByTipo)
                    .sort((a, b) => b[1] - a[1])
                    .map(([tipo, count]) => (
                      <Badge key={tipo} variant="secondary" className="text-sm px-3 py-1">
                        {tipo}: <span className="ml-1 font-black">{count}</span>
                      </Badge>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Próximos eventos */}
          {proximas.length > 0 && (
            <Card className="border-blue-100">
              <CardHeader>
                <CardTitle className="font-headline text-base flex items-center gap-2 text-blue-700">
                  <CalendarDays className="w-4 h-4" />
                  Próximos Eventos en Club Uruguay
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente / Evento</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Invitados</TableHead>
                        <TableHead className="print:hidden" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {proximas.map((f) => (
                        <TableRow key={f.id}>
                          <TableCell className="font-semibold">
                            {f.configuracion.clienteNombre || f.configuracion.nombreEvento}
                          </TableCell>
                          <TableCell>{f.configuracion.tipoCelebracion || '—'}</TableCell>
                          <TableCell>{formatDate(f.configuracion.fechaEvento)}</TableCell>
                          <TableCell>{estadoBadge(f.estado)}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              {f.configuracion.invitadosEstimados || '—'}
                            </span>
                          </TableCell>
                          <TableCell className="print:hidden">
                            <Link href={`/fiestas/nueva/resumen-planificacion?fiestaId=${f.id}`}>
                              <Button variant="ghost" size="sm" className="h-7 text-xs">
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Ver
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pagos al salón */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-headline text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Registro de Pagos al Salón
                  </CardTitle>
                  <CardDescription>
                    Registrá cada pago realizado al Club Uruguay con su comprobante.
                  </CardDescription>
                </div>
                {salon && (
                  <Button
                    size="sm"
                    className="print:hidden"
                    onClick={() => setIsNewPagoOpen(true)}
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Registrar Pago
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {pagos.length === 0 ? (
                <div className="py-10 text-center">
                  <FileText className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground font-medium">Sin pagos registrados aún.</p>
                  {salon ? (
                    <Button variant="link" size="sm" className="mt-2 print:hidden" onClick={() => setIsNewPagoOpen(true)}>
                      <PlusCircle className="w-4 h-4 mr-1" /> Registrar primer pago
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      Primero creá el salón Club Uruguay en el catálogo de salones.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead>Referencia</TableHead>
                          <TableHead>Evento</TableHead>
                          <TableHead>Comprobante</TableHead>
                          <TableHead className="print:hidden" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagos
                          .slice()
                          .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                          .map((p) => (
                            <TableRow key={p.id}>
                              <TableCell className="whitespace-nowrap">{formatDate(p.fecha)}</TableCell>
                              <TableCell className="font-bold whitespace-nowrap">{formatCurrency(p.monto)}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="text-xs">{p.metodoPago}</Badge>
                              </TableCell>
                              <TableCell className="text-xs text-slate-500">{p.referencia || '—'}</TableCell>
                              <TableCell className="text-xs text-slate-500">{p.fiestaDesc || '—'}</TableCell>
                              <TableCell>
                                {p.comprobanteUrl ? (
                                  p.comprobanteUrl.startsWith('data:application/pdf') ? (
                                    <a
                                      href={p.comprobanteUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-primary hover:underline flex items-center gap-1"
                                    >
                                      <FileText className="w-3 h-3" /> PDF
                                    </a>
                                  ) : (
                                    <a href={p.comprobanteUrl} target="_blank" rel="noopener noreferrer">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={p.comprobanteUrl}
                                        alt="Comprobante"
                                        className="w-12 h-12 object-cover rounded border border-slate-200 cursor-pointer hover:opacity-80"
                                      />
                                    </a>
                                  )
                                ) : (
                                  <span className="text-xs text-slate-300">—</span>
                                )}
                              </TableCell>
                              <TableCell className="print:hidden">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-destructive hover:bg-red-50"
                                      disabled={deletingPagoId === p.id}
                                    >
                                      {deletingPagoId === p.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <Trash2 className="w-3 h-3" />
                                      )}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>¿Eliminar pago?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Se eliminará el pago de {formatCurrency(p.monto)} del {formatDate(p.fecha)}. Esta acción no se puede deshacer.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeletePago(p.id)}
                                        className="bg-destructive hover:bg-destructive/90"
                                      >
                                        Eliminar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex justify-end">
                    <p className="text-sm font-bold text-slate-700">
                      Total pagado: <span className="text-emerald-700">{formatCurrency(totalPagos)}</span>
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* All fiestas with documentation links */}
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Todas las Contrataciones — Documentación
              </CardTitle>
              <CardDescription>
                Accesos directos a contratos, recibos y documentos de cada evento del Club Uruguay.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {fiestas.length === 0 ? (
                <div className="py-12 text-center">
                  <Star className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">
                    No hay fiestas registradas en Club Uruguay todavía.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Las fiestas aparecerán aquí cuando se asigne &quot;Club Uruguay&quot; como lugar en la
                    configuración del evento.
                  </p>
                </div>
              ) : (
                <Accordion type="multiple" className="space-y-2">
                  {fiestas
                    .sort((a, b) => {
                      const dateA = a.configuracion.fechaEvento
                        ? new Date(a.configuracion.fechaEvento).getTime()
                        : 0;
                      const dateB = b.configuracion.fechaEvento
                        ? new Date(b.configuracion.fechaEvento).getTime()
                        : 0;
                      return dateB - dateA;
                    })
                    .map((f) => (
                      <AccordionItem
                        key={f.id}
                        value={f.id}
                        className="border rounded-xl px-4 data-[state=open]:border-amber-200 data-[state=open]:bg-amber-50/30"
                      >
                        <AccordionTrigger className="py-3 hover:no-underline">
                          <div className="flex items-center gap-3 text-left">
                            <div>
                              <p className="font-bold text-sm text-slate-800">
                                {f.configuracion.clienteNombre || f.configuracion.nombreEvento}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {f.configuracion.tipoCelebracion} ·{' '}
                                {formatDate(f.configuracion.fechaEvento)}
                              </p>
                            </div>
                            {estadoBadge(f.estado)}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pb-3 pt-1 grid grid-cols-2 md:grid-cols-3 gap-2">
                            <Link href={`/fiestas/nueva/resumen-planificacion?fiestaId=${f.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs h-8 justify-start"
                              >
                                <ExternalLink className="w-3 h-3 mr-1.5" />
                                Ver Evento
                              </Button>
                            </Link>
                            <Link
                              href={`/fiestas/nueva/gestion-documental/contrato-salon?fiestaId=${f.id}`}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs h-8 justify-start"
                              >
                                <FileText className="w-3 h-3 mr-1.5" />
                                Contrato del Salón
                              </Button>
                            </Link>
                            <Link
                              href={`/fiestas/nueva/gestion-documental/recibo-pago?fiestaId=${f.id}`}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs h-8 justify-start"
                              >
                                <FileText className="w-3 h-3 mr-1.5" />
                                Recibo de Pago
                              </Button>
                            </Link>
                            <Link href={`/fiestas/nueva/gestion-documental?fiestaId=${f.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs h-8 justify-start"
                              >
                                <FileText className="w-3 h-3 mr-1.5" />
                                Gestión Documental
                              </Button>
                            </Link>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Dialogs */}
      {salon && (
        <>
          <NewPagoDialog
            open={isNewPagoOpen}
            onOpenChange={setIsNewPagoOpen}
            onSave={handleAddPago}
            fiestas={fiestas}
          />
          <GerenteDialog
            open={isGerenteOpen}
            onOpenChange={setIsGerenteOpen}
            salon={salon}
            onSaved={(s) => setSalon(s)}
          />
        </>
      )}
    </div>
  );
}
