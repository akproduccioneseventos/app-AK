
'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, Loader2, Sparkles, AlertTriangle, SearchX, Settings2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ServicioEmpresa } from '@/types/empresa';
import { getServiciosEmpresa, saveServicioEmpresa, deleteServicioEmpresa as deleteServicioAction } from '@/app/actions/servicios-empresa';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle as AlertTitleComponent, // Renamed to avoid conflict with CardTitle
  AlertDialogDescription as AlertDescriptionComponent,
} from "@/components/ui/alert-dialog";

const formatCurrency = (amount?: number) => {
  if (amount === undefined || amount === null) return '-';
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
};

export default function ServiciosEmpresaPage() {
  const { toast } = useToast();
  const [servicios, setServicios] = useState<ServicioEmpresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentServicio, setCurrentServicio] = useState<Partial<ServicioEmpresa> | null>(null);
  const [isSavingModal, setIsSavingModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchServicios = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getServiciosEmpresa();
      setServicios(data);
    } catch (err: any) {
      setError("No se pudieron cargar los servicios.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchServicios();
  }, [fetchServicios]);

  const openModal = (servicio?: ServicioEmpresa) => {
    setCurrentServicio(servicio ? { ...servicio } : { nombre: '', descripcion: '', categoria: '', precioEstimado: undefined, unidad: '', notas: '' });
    setIsModalOpen(true);
  };

  const handleModalInputChange = (field: keyof ServicioEmpresa, value: string | number | undefined) => {
    setCurrentServicio(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  const handleModalSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentServicio || !currentServicio.nombre?.trim()) {
      toast({ title: "Nombre Requerido", description: "El nombre del servicio no puede estar vacío.", variant: "destructive" });
      return;
    }
    setIsSavingModal(true);
    try {
      const result = await saveServicioEmpresa(currentServicio as ServicioEmpresa); // Cast as ServicioEmpresa for saving
      if (result.success && result.servicio) {
        toast({ title: currentServicio.id ? "Servicio Actualizado" : "Servicio Añadido" });
        setIsModalOpen(false);
        fetchServicios();
      } else {
        throw new Error(result.error || "Error desconocido al guardar el servicio.");
      }
    } catch (err: any) {
      toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    } finally {
      setIsSavingModal(false);
    }
  };

  const handleDelete = async (id: string, nombre?: string) => {
    setDeletingId(id);
    try {
      const result = await deleteServicioAction(id);
      if (result.success) {
        toast({ title: "Servicio Eliminado", description: `El servicio "${nombre || id}" ha sido eliminado.` });
        fetchServicios();
      } else {
        throw new Error(result.error || "Error desconocido al eliminar.");
      }
    } catch (error: any) {
      toast({ title: "Error al Eliminar", description: error.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Servicios de la Empresa
          </h1>
        </div>
        <Button onClick={() => openModal()}>
          <PlusCircle className="w-5 h-5 mr-2" />
          Añadir Nuevo Servicio
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Listado de Servicios Ofrecidos ({servicios.length})</CardTitle>
          <CardDescription>Gestiona los servicios que tu empresa provee para eventos.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Cargando servicios...</p>
            </div>
          ) : error ? (
            <div className="py-10 text-center text-destructive">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
              <p className="font-semibold">Error al cargar servicios</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : servicios.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre del Servicio</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Precio Estimado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {servicios.map((servicio) => (
                    <TableRow key={servicio.id}>
                      <TableCell className="font-medium min-w-[200px]">{servicio.nombre}</TableCell>
                      <TableCell className="min-w-[150px]">{servicio.categoria || '-'}</TableCell>
                      <TableCell className="min-w-[250px] max-w-xs truncate">{servicio.descripcion || '-'}</TableCell>
                      <TableCell className="text-right min-w-[150px]">{formatCurrency(servicio.precioEstimado)} {servicio.unidad ? `(${servicio.unidad})` : ''}</TableCell>
                      <TableCell className="text-right min-w-[120px]">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="icon" onClick={() => openModal(servicio)} aria-label={`Editar ${servicio.nombre}`}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon" aria-label={`Eliminar ${servicio.nombre}`} disabled={deletingId === servicio.id}>
                                {deletingId === servicio.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertTitleComponent>¿Confirmas la eliminación?</AlertTitleComponent>
                                <AlertDescriptionComponent>
                                  Esta acción no se puede deshacer. El servicio "{servicio.nombre}" será eliminado.
                                </AlertDescriptionComponent>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel disabled={!!deletingId}>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(servicio.id, servicio.nombre)} disabled={!!deletingId} className="bg-destructive hover:bg-destructive/90">
                                  {deletingId === servicio.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                  Sí, eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
             <div className="py-10 text-center">
              <SearchX className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-lg">
                No has añadido ningún servicio todavía.
              </p>
                <Button onClick={() => openModal()} className="mt-6">
                    <PlusCircle className="w-5 h-5 mr-2" />
                    Añadir Primer Servicio
                </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">{currentServicio?.id ? 'Editar Servicio' : 'Añadir Nuevo Servicio'}</DialogTitle>
            <DialogDescription>
              {currentServicio?.id ? 'Modifica los detalles del servicio.' : 'Completa la información para registrar un nuevo servicio.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleModalSubmit} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-1">
              <Label htmlFor="servicio-nombre">Nombre del Servicio</Label>
              <Input id="servicio-nombre" value={currentServicio?.nombre || ''} onChange={(e) => handleModalInputChange('nombre', e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="servicio-categoria">Categoría</Label>
              <Input id="servicio-categoria" placeholder="Ej: Audiovisual, Catering, Decoración" value={currentServicio?.categoria || ''} onChange={(e) => handleModalInputChange('categoria', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="servicio-descripcion">Descripción</Label>
              <Textarea id="servicio-descripcion" value={currentServicio?.descripcion || ''} onChange={(e) => handleModalInputChange('descripcion', e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                <Label htmlFor="servicio-precio">Precio Estimado (ARS)</Label>
                <Input id="servicio-precio" type="number" value={currentServicio?.precioEstimado ?? ''} onChange={(e) => handleModalInputChange('precioEstimado', e.target.value === '' ? undefined : Number(e.target.value))} placeholder="Ej: 150.00" step="any"/>
                </div>
                 <div className="space-y-1">
                <Label htmlFor="servicio-unidad">Unidad de Precio</Label>
                <Input id="servicio-unidad" value={currentServicio?.unidad || ''} onChange={(e) => handleModalInputChange('unidad', e.target.value)} placeholder="Ej: por evento, por hora"/>
                </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="servicio-notas">Notas Adicionales</Label>
              <Textarea id="servicio-notas" value={currentServicio?.notas || ''} onChange={(e) => handleModalInputChange('notas', e.target.value)} rows={2} />
            </div>
            <DialogFooter className="pt-4">
              <DialogClose asChild><Button type="button" variant="outline" disabled={isSavingModal}>Cancelar</Button></DialogClose>
              <Button type="submit" disabled={isSavingModal}>
                {isSavingModal ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {currentServicio?.id ? 'Guardar Cambios' : 'Añadir Servicio'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
