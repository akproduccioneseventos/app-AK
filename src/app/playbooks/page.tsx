'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, CheckCircle2, FileText, ShoppingCart, Layers, Play, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { getPlaybooks, applyPlaybookToFiesta } from '@/app/actions/playbooks';
import type { Playbook } from '@/types/playbook';

function PlaybooksContent() {
  const searchParams = useSearchParams();
  const fiestaIdFromUrl = searchParams.get('fiestaId') ?? '';
  const { toast } = useToast();

  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [fiestaIdInput, setFiestaIdInput] = useState(fiestaIdFromUrl);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getPlaybooks();
        setPlaybooks(data);
      } catch {
        toast({ title: 'Error', description: 'No se pudieron cargar los playbooks.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [toast]);

  const handleOpenApplyDialog = (pb: Playbook) => {
    setSelectedPlaybook(pb);
    setFiestaIdInput(fiestaIdFromUrl);
    setApplyDialogOpen(true);
  };

  const handleApply = async () => {
    if (!selectedPlaybook || !fiestaIdInput.trim()) {
      toast({ title: 'Error', description: 'Por favor ingresá un ID de evento.', variant: 'destructive' });
      return;
    }
    setApplying(true);
    try {
      const result = await applyPlaybookToFiesta(selectedPlaybook.id, fiestaIdInput.trim(), 'admin');
      if (result.success) {
        toast({
          title: 'Playbook aplicado',
          description: `Se generaron ${result.tareasGeneradas} tarea(s) y ${result.documentosGenerados} documento(s).`,
        });
        setApplyDialogOpen(false);
      } else {
        toast({ title: 'Error', description: result.error ?? 'No se pudo aplicar el playbook.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Ocurrió un error inesperado.', variant: 'destructive' });
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Playbooks Inteligentes</h1>
        </div>
        <p className="text-muted-foreground">
          Plantillas prediseñadas para cada tipo de evento. Aplicalas a un evento para generar tareas, documentos y compras automáticamente.
        </p>
      </div>

      {playbooks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <BookOpen className="h-12 w-12 mb-4 opacity-40" />
            <p className="text-lg">No hay playbooks disponibles aún.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {playbooks.map((pb) => (
            <Card key={pb.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <CardTitle className="text-xl">{pb.nombre}</CardTitle>
                      <Badge variant="secondary">{pb.tipoEvento}</Badge>
                      {pb.esPlantillaDefault && <Badge variant="outline">Default</Badge>}
                    </div>
                    <CardDescription>{pb.descripcion}</CardDescription>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedId(expandedId === pb.id ? null : pb.id)}
                    >
                      {expandedId === pb.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      {expandedId === pb.id ? 'Ocultar' : 'Ver detalles'}
                    </Button>
                    <Button size="sm" onClick={() => handleOpenApplyDialog(pb)}>
                      <Play className="h-4 w-4 mr-1" />
                      Aplicar
                    </Button>
                  </div>
                </div>

                <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    {pb.tareas.length} tareas
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers className="h-4 w-4" />
                    {pb.etapas.length} etapas
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {pb.documentos.length} documentos
                  </span>
                  <span className="flex items-center gap-1">
                    <ShoppingCart className="h-4 w-4" />
                    {pb.compras.length} compras
                  </span>
                </div>
              </CardHeader>

              {expandedId === pb.id && (
                <CardContent className="pt-0">
                  <Separator className="mb-4" />

                  {pb.etapas.length > 0 && (
                    <div className="mb-4">
                      <h3 className="font-semibold flex items-center gap-2 mb-2">
                        <Layers className="h-4 w-4 text-primary" /> Etapas
                      </h3>
                      <div className="grid gap-2">
                        {pb.etapas.map((etapa) => (
                          <div key={etapa.orden} className="bg-muted/50 rounded-md p-3">
                            <p className="font-medium text-sm">{etapa.orden}. {etapa.nombre}</p>
                            <p className="text-xs text-muted-foreground">{etapa.descripcion}</p>
                            <p className="text-xs text-muted-foreground mt-1">{etapa.tareas.length} tarea(s) en esta etapa</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {pb.tareas.length > 0 && (
                    <div className="mb-4">
                      <h3 className="font-semibold flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" /> Tareas
                      </h3>
                      <div className="grid gap-1">
                        {pb.tareas.slice(0, 8).map((tarea, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm py-1">
                            <Badge variant="outline" className="text-xs shrink-0">{tarea.prioridad}</Badge>
                            <span>{tarea.titulo}</span>
                            {tarea.diasAntesEvento !== undefined && (
                              <span className="text-xs text-muted-foreground ml-auto shrink-0">
                                {tarea.diasAntesEvento === 0 ? 'Día del evento' : `${Math.abs(tarea.diasAntesEvento)}d antes`}
                              </span>
                            )}
                          </div>
                        ))}
                        {pb.tareas.length > 8 && (
                          <p className="text-xs text-muted-foreground mt-1">...y {pb.tareas.length - 8} más</p>
                        )}
                      </div>
                    </div>
                  )}

                  {pb.documentos.length > 0 && (
                    <div className="mb-4">
                      <h3 className="font-semibold flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-primary" /> Documentos
                      </h3>
                      <div className="grid gap-1">
                        {pb.documentos.map((doc, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm py-1">
                            <span>{doc.nombre}</span>
                            <Badge variant="outline" className="text-xs">{doc.tipo}</Badge>
                            {doc.obligatorio && <Badge className="text-xs">Obligatorio</Badge>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {pb.compras.length > 0 && (
                    <div>
                      <h3 className="font-semibold flex items-center gap-2 mb-2">
                        <ShoppingCart className="h-4 w-4 text-primary" /> Compras sugeridas
                      </h3>
                      <div className="grid gap-1">
                        {pb.compras.map((compra, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm py-1">
                            <Badge variant="outline" className="text-xs shrink-0">{compra.prioridad}</Badge>
                            <span>{compra.nombre}</span>
                            <span className="text-xs text-muted-foreground">{compra.categoria}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aplicar Playbook a Evento</DialogTitle>
            <DialogDescription>
              Ingresá el ID del evento donde querés aplicar <strong>{selectedPlaybook?.nombre}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium mb-1 block">ID del Evento</label>
            <Input
              placeholder="ej: fiesta_1234567890"
              value={fiestaIdInput}
              onChange={(e) => setFiestaIdInput(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyDialogOpen(false)} disabled={applying}>
              Cancelar
            </Button>
            <Button onClick={handleApply} disabled={applying || !fiestaIdInput.trim()}>
              {applying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              Aplicar Playbook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PlaybooksPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <PlaybooksContent />
    </Suspense>
  );
}
