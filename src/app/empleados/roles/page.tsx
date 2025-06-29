
'use client';

import { useState, useEffect, useCallback, type FormEvent, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, PlusCircle, Edit3, Trash2, Loader2, AlertTriangle, BadgeHelp, UsersRound, DollarSign, Percent } from 'lucide-react';
import { getRoles, saveRol, deleteRol as deleteRolAction } from '@/app/actions/roles';
import type { Rol, NuevoRolFormData } from '@/types/rol';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent as AlertDialogContentConfirm,
  AlertDialogDescription as AlertDialogDescriptionConfirm,
  AlertDialogFooter as AlertDialogFooterConfirm,
  AlertDialogHeader as AlertDialogHeaderConfirm,
  AlertDialogTitle as AlertDialogTitleConfirm,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ALL_CATEGORIAS_SERVICIO, type CategoriaServicio } from '@/types/empresa';

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

export default function GestionRolesPage() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Rol[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRol, setCurrentRol] = useState<Partial<Rol> | null>(null); 
  
  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getRoles();
      setRoles(data);
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los roles.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const openModal = (rol?: Rol) => {
    if (rol) {
      setCurrentRol({ ...rol });
    } else {
      setCurrentRol({ 
        nombre: '', 
        categoriaServicio: undefined,
        sueldoPorEvento: 2100, // Example default
        porcentajeSalarioVacacional: 8.33,
        porcentajeAguinaldo: 8.33,
        porcentajeAportesPatronales: 20,
      });
    }
    setIsModalOpen(true);
  };
  
  const handleModalFieldChange = (field: keyof Omit<Rol, 'id' | 'costoAportesCalculado'>, value: string) => {
    setCurrentRol(prev => {
      if (!prev) return null;
      // Allow empty string for number inputs but convert to number for state
      const numValue = value === '' ? '' : parseFloat(value);
      return { ...prev, [field]: numValue === '' ? '' : (isNaN(numValue as number) ? value : numValue) };
    });
  };

  const handleSaveRol = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentRol || !currentRol.nombre?.trim()) {
      toast({ title: "Nombre Requerido", variant: "destructive" });
      return;
    }
    if (!currentRol.categoriaServicio?.trim()) {
      toast({ title: "Categoría de Servicio Requerida", variant: "destructive" });
      return;
    }
    
    const rolToSave = {
      ...currentRol,
      sueldoPorEvento: Number(currentRol.sueldoPorEvento) || 0,
      porcentajeSalarioVacacional: Number(currentRol.porcentajeSalarioVacacional) || 0,
      porcentajeAguinaldo: Number(currentRol.porcentajeAguinaldo) || 0,
      porcentajeAportesPatronales: Number(currentRol.porcentajeAportesPatronales) || 0,
    } as Rol | NuevoRolFormData;
    
    setIsSaving(true);
    try {
      const result = await saveRol(rolToSave); 
      if (result.success && result.rol) {
        toast({ title: currentRol.id ? "Rol Actualizado" : "Rol Creado", description: `El rol "${result.rol.nombre}" ha sido guardado.` });
        setIsModalOpen(false);
        setCurrentRol(null);
        await fetchRoles();
      } else {
        throw new Error(result.error || "Error desconocido al guardar el rol.");
      }
    } catch (error: any) {
      toast({ title: "Error al Guardar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteRol = async (rolId: string) => {
    setDeletingId(rolId);
    try {
      const result = await deleteRolAction(rolId);
      if (result.success) {
        toast({ title: "Rol Eliminado", description: "El rol ha sido eliminado."});
        await fetchRoles();
      } else {
        throw new Error(result.error || "Error desconocido al eliminar el rol.");
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
          <UsersRound className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Configuración de Roles
          </h1>
        </div>
        <div className="flex gap-2">
            <Button onClick={() => openModal()}>
                <PlusCircle className="w-5 h-5 mr-2" />
                Crear Nuevo Rol
            </Button>
            <Link href="/empleados" passHref>
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Empleados
              </Button>
            </Link>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => { setIsModalOpen(isOpen); if (!isOpen) setCurrentRol(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-headline">{currentRol?.id ? 'Editar Rol' : 'Crear Nuevo Rol'}</DialogTitle>
            <DialogDescription>Define el nombre, sueldo y porcentajes para el cálculo de costos y recibos de pago.</DialogDescription>
          </DialogHeader>
          {currentRol && (
            <form onSubmit={handleSaveRol} className="space-y-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="rol-nombre">Nombre del Rol *</Label>
                <Input id="rol-nombre" value={currentRol.nombre || ''} onChange={(e) => handleModalFieldChange('nombre', e.target.value)} placeholder="Ej: Mozo, DJ, Coordinador" required />
              </div>

              <div className="space-y-1">
                <Label htmlFor="rol-categoria">Categoría de Servicio *</Label>
                <Select
                  value={currentRol.categoriaServicio || ''}
                  onValueChange={(value) => handleModalFieldChange('categoriaServicio', value as CategoriaServicio)}
                  required
                >
                  <SelectTrigger id="rol-categoria">
                    <SelectValue placeholder="Seleccionar categoría..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_CATEGORIAS_SERVICIO.filter(cat => cat.startsWith('Servicio')).map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                    <SelectItem value="Personal">Personal</SelectItem>
                    <SelectItem value="Otros servicios">Otros servicios</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="rol-sueldo">Sueldo por Evento (Pago Total al Empleado) *</Label>
                <Input id="rol-sueldo" type="number" value={currentRol.sueldoPorEvento ?? ''} onChange={(e) => handleModalFieldChange('sueldoPorEvento', e.target.value)} placeholder="Ej: 2100" min="0" step="any" required />
                <p className="text-xs text-muted-foreground">Este monto incluye sueldo base, vacacional y aguinaldo.</p>
              </div>

              <Separator/>
              <p className="text-sm font-medium text-muted-foreground">Porcentajes de Cálculo:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label htmlFor="rol-vacacional" className="flex items-center gap-1"><Percent className="w-3 h-3"/>Salario Vacacional</Label>
                    <Input id="rol-vacacional" type="number" value={currentRol.porcentajeSalarioVacacional ?? ''} onChange={(e) => handleModalFieldChange('porcentajeSalarioVacacional', e.target.value)} placeholder="Ej: 8.33" min="0" max="100" step="any" />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="rol-aguinaldo" className="flex items-center gap-1"><Percent className="w-3 h-3"/>Aguinaldo</Label>
                    <Input id="rol-aguinaldo" type="number" value={currentRol.porcentajeAguinaldo ?? ''} onChange={(e) => handleModalFieldChange('porcentajeAguinaldo', e.target.value)} placeholder="Ej: 8.33" min="0" max="100" step="any" />
                </div>
              </div>
              <div className="space-y-1">
                  <Label htmlFor="rol-aportes" className="flex items-center gap-1"><Percent className="w-3 h-3"/>Aportes Patronales (BPS, DGI, etc.)</Label>
                  <Input id="rol-aportes" type="number" value={currentRol.porcentajeAportesPatronales ?? ''} onChange={(e) => handleModalFieldChange('porcentajeAportesPatronales', e.target.value)} placeholder="Ej: 20" min="0" max="100" step="any" />
                  <p className="text-xs text-muted-foreground">Este % se calcula sobre el sueldo total del empleado.</p>
              </div>
              
              <DialogFooter className="pt-3">
                <DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancelar</Button></DialogClose>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {currentRol.id ? 'Guardar Cambios' : 'Crear Rol'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>


      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Listado de Roles Definidos</CardTitle>
          <CardDescription>Visualiza y gestiona los roles de tu personal.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="w-10 h-10 animate-spin text-primary" /><p className="ml-3 text-muted-foreground">Cargando roles...</p></div>
          ) : roles.length > 0 ? (
            <div className="space-y-3">
              {roles.map((rol) => (
                <Card key={rol.id} className="p-3 bg-muted/30 hover:shadow-sm transition-shadow">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex-grow">
                      <h4 className="font-semibold text-foreground">{rol.nombre}</h4>
                      <p className="text-xs font-medium text-primary">{rol.categoriaServicio || 'Sin categoría asignada'}</p>
                      <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 mt-1">
                        <span>Sueldo Evento: <strong>{formatCurrency(rol.sueldoPorEvento)}</strong></span>
                        <span>Vacacional: {rol.porcentajeSalarioVacacional}%</span>
                        <span>Aguinaldo: {rol.porcentajeAguinaldo}%</span>
                        <span>Aportes: {rol.porcentajeAportesPatronales}% ({formatCurrency(rol.costoAportesCalculado)})</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 self-start sm:self-center flex-shrink-0">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openModal(rol)}><Edit3 className="w-4 h-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon" className="h-8 w-8" disabled={deletingId === rol.id}>
                            {deletingId === rol.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4" />}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContentConfirm>
                          <AlertDialogHeaderConfirm>
                            <AlertDialogTitleConfirm>¿Confirmas la eliminación?</AlertDialogTitleConfirm>
                            <AlertDialogDescriptionConfirm>
                              El rol "{rol.nombre}" será eliminado. Esta acción no se puede deshacer. Los empleados con este rol asignado perderán la asignación.
                            </AlertDialogDescriptionConfirm>
                          </AlertDialogHeaderConfirm>
                          <AlertDialogFooterConfirm>
                            <AlertDialogCancel disabled={deletingId === rol.id}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteRol(rol.id)} disabled={deletingId === rol.id} className="bg-destructive hover:bg-destructive/90">
                                {deletingId === rol.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null}
                                Sí, eliminar
                            </AlertDialogAction>
                          </AlertDialogFooterConfirm>
                        </AlertDialogContentConfirm>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center"><BadgeHelp className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" /><p className="text-muted-foreground text-lg">No has definido roles todavía.</p><Button onClick={() => openModal()} className="mt-4">Crear Primer Rol</Button></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
