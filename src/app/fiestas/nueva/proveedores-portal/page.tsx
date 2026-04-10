'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Users, Plus, Copy, Check, Clock, ArrowLeft, Loader2, ChevronDown, ChevronUp, ExternalLink,
} from 'lucide-react';
import { getProveedoresPortal, createProveedorAcceso } from '@/app/actions/provider-portal';
import type { ProveedorPortalAccess, TipoProveedor, EstadoProveedorPortal } from '@/types/provider-portal';

const TIPO_PROVEEDOR_OPTIONS: TipoProveedor[] = [
  'Fotografía', 'DJ', 'Catering', 'Decoración', 'Repostería', 'Animación', 'Video', 'Sonido', 'Otro',
];

function estadoBadgeClass(estado: EstadoProveedorPortal) {
  switch (estado) {
    case 'Llegó': return 'bg-green-100 text-green-700 border-green-200';
    case 'En Camino': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Confirmado': return 'bg-teal-100 text-teal-700 border-teal-200';
    case 'Completó': return 'bg-gray-100 text-gray-600 border-gray-200';
    case 'No Llegó': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-gray-100 text-gray-500 border-gray-200';
  }
}

interface AddForm {
  nombreProveedor: string;
  tipoProveedor: TipoProveedor;
  horaLlegadaEstimada: string;
  horaPartidaEstimada: string;
  email: string;
  telefono: string;
  tareasIniciales: string;
}

const defaultForm: AddForm = {
  nombreProveedor: '',
  tipoProveedor: 'Fotografía',
  horaLlegadaEstimada: '',
  horaPartidaEstimada: '',
  email: '',
  telefono: '',
  tareasIniciales: '',
};

function ProveedoresPortalContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId') ?? '';

  const [proveedores, setProveedores] = useState<ProveedorPortalAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [form, setForm] = useState<AddForm>(defaultForm);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!fiestaId) return;
    setIsLoading(true);
    const res = await getProveedoresPortal(fiestaId);
    if (res.success && res.data) {
      setProveedores(res.data);
    } else {
      toast({ title: 'Error al cargar proveedores', description: res.error, variant: 'destructive' });
    }
    setIsLoading(false);
  }, [fiestaId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/portal-proveedor/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedToken(token);
      toast({ title: 'Link copiado' });
      setTimeout(() => setCopiedToken(null), 2000);
    });
  };

  const handleAddProveedor = async () => {
    if (!form.nombreProveedor || !form.horaLlegadaEstimada) {
      toast({ title: 'Faltan campos', description: 'Nombre y hora de llegada son obligatorios', variant: 'destructive' });
      return;
    }
    setIsSaving(true);

    const tareas = form.tareasIniciales
      .split('\n')
      .map(t => t.trim())
      .filter(Boolean)
      .map((texto, i) => ({ id: `tarea-${Date.now()}-${i}`, texto, completada: false }));

    const res = await createProveedorAcceso({
      fiestaId,
      nombreProveedor: form.nombreProveedor,
      tipoProveedor: form.tipoProveedor,
      horaLlegadaEstimada: form.horaLlegadaEstimada,
      horaPartidaEstimada: form.horaPartidaEstimada || undefined,
      email: form.email || undefined,
      telefono: form.telefono || undefined,
      estadoActual: 'Pendiente',
      tareas,
      activo: true,
    });

    if (res.success) {
      toast({ title: 'Proveedor agregado', description: `Token generado para ${form.nombreProveedor}` });
      setShowAddDialog(false);
      setForm(defaultForm);
      await loadData();
    } else {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
    }
    setIsSaving(false);
  };

  if (!fiestaId) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No se especificó un evento. Vuelve al dashboard.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}>
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" /> Volver
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <h1 className="font-bold text-lg leading-tight">Portal de Proveedores</h1>
                <p className="text-xs text-muted-foreground">Gestión de accesos externos</p>
              </div>
            </div>
          </div>
          <Button onClick={() => setShowAddDialog(true)} size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> Agregar
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : proveedores.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No hay proveedores aún</p>
              <p className="text-sm text-muted-foreground mt-1">Agrega proveedores para compartirles su portal de acceso</p>
              <Button onClick={() => setShowAddDialog(true)} className="mt-4 gap-2">
                <Plus className="h-4 w-4" /> Agregar Proveedor
              </Button>
            </CardContent>
          </Card>
        ) : (
          proveedores.map(prov => {
            const completedTareas = prov.tareas.filter(t => t.completada).length;
            const isExpanded = expandedId === prov.id;
            return (
              <Card key={prov.id} className="overflow-hidden">
                <CardHeader className="pb-3 pt-4 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-base">{prov.nombreProveedor}</CardTitle>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">{prov.tipoProveedor}</Badge>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${estadoBadgeClass(prov.estadoActual)}`}>
                          {prov.estadoActual}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs"
                        onClick={() => handleCopyLink(prov.token)}
                      >
                        {copiedToken === prov.token ? (
                          <><Check className="h-3 w-3" /> Copiado</>
                        ) : (
                          <><Copy className="h-3 w-3" /> Link</>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="px-4 pb-4 space-y-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Llegada: {prov.horaLlegadaEstimada}
                      {prov.horaPartidaEstimada && ` - Partida: ${prov.horaPartidaEstimada}`}
                    </span>
                    {prov.tareas.length > 0 && (
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                        Tareas: {completedTareas}/{prov.tareas.length}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <a
                      href={`/portal-proveedor/${prov.token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary flex items-center gap-1 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> Abrir portal
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-xs h-7"
                      onClick={() => setExpandedId(isExpanded ? null : prov.id)}
                    >
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      {isExpanded ? 'Ocultar' : 'Ver Detalles'}
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="border-t pt-3 space-y-3">
                      {prov.tareas.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">Tareas asignadas</p>
                          <div className="space-y-1">
                            {prov.tareas.map(t => (
                              <div key={t.id} className="flex items-center gap-2">
                                <span className={`text-xs ${t.completada ? 'line-through text-muted-foreground' : ''}`}>
                                  {t.completada ? '✅' : '⬜'} {t.texto}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {prov.notas && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Notas</p>
                          <p className="text-xs bg-yellow-50 border border-yellow-200 rounded p-2">{prov.notas}</p>
                        </div>
                      )}
                      {prov.archivosSubidos && prov.archivosSubidos.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Archivos ({prov.archivosSubidos.length})</p>
                          <div className="space-y-1">
                            {prov.archivosSubidos.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                                <ExternalLink className="h-3 w-3" /> Archivo {i + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      {prov.email && <p className="text-xs text-muted-foreground">📧 {prov.email}</p>}
                      {prov.telefono && <p className="text-xs text-muted-foreground">📞 {prov.telefono}</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add provider dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agregar Proveedor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">Nombre del proveedor *</label>
              <Input
                value={form.nombreProveedor}
                onChange={e => setForm(f => ({ ...f, nombreProveedor: e.target.value }))}
                placeholder="Ej: Fotografías Rodríguez"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tipo</label>
              <Select
                value={form.tipoProveedor}
                onValueChange={v => setForm(f => ({ ...f, tipoProveedor: v as TipoProveedor }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_PROVEEDOR_OPTIONS.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Hora llegada *</label>
                <Input
                  type="time"
                  value={form.horaLlegadaEstimada}
                  onChange={e => setForm(f => ({ ...f, horaLlegadaEstimada: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Hora partida</label>
                <Input
                  type="time"
                  value={form.horaPartidaEstimada}
                  onChange={e => setForm(f => ({ ...f, horaPartidaEstimada: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="opcional"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Teléfono</label>
                <Input
                  value={form.telefono}
                  onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                  placeholder="opcional"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Tareas iniciales</label>
              <p className="text-xs text-muted-foreground mt-0.5">Una tarea por línea</p>
              <Textarea
                value={form.tareasIniciales}
                onChange={e => setForm(f => ({ ...f, tareasIniciales: e.target.value }))}
                placeholder={`Montar equipamiento de sonido\nPrueba de micrófono\nCoordinar playlist`}
                className="mt-1"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
            <Button onClick={handleAddProveedor} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ProveedoresPortalPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ProveedoresPortalContent />
    </Suspense>
  );
}
