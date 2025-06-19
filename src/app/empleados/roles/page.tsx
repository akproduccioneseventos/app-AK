
'use client';

import { useState, useEffect, useCallback, type FormEvent, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Textarea ya no es necesario si eliminamos el campo de notas
// import { Textarea } from '@/components/ui/textarea'; 
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
  AlertDialogTrigger, // Added AlertDialogTrigger
} from "@/components/ui/alert-dialog";


const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

const DEFAULT_APORTES_PERCENTAGE = 30;

export default function GestionRolesPage() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Rol[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRol, setCurrentRol] = useState<Partial<Omit<Rol, 'notas'>>> | null>(null); 
  const [porcentajeAportesInput, setPorcentajeAportesInput] = useState<string>(String(DEFAULT_APORTES_PERCENTAGE));
  
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

  const openModal = (rol?: Omit<Rol, 'notas'>) => {
    if (rol) {
      setCurrentRol({ ...rol, tipoSalario: 'Por evento' }); 
      setPorcentajeAportesInput(String(rol.porcentajeAportes ?? DEFAULT_APORTES_PERCENTAGE));
    } else {
      setCurrentRol({ 
        nombre: '', 
        tipoSalario: 'Por evento', 
        montoSalario: undefined, 
        porcentajeAportes: DEFAULT_APORTES_PERCENTAGE,
        aportesCalculados: undefined, 
      });
      setPorcentajeAportesInput(String(DEFAULT_APORTES_PERCENTAGE));
    }
    setIsModalOpen(true);
  };
  
  const aportesCalculadosModal = useMemo(() => {
    if (!currentRol) return undefined;
    const monto = Number(currentRol.montoSalario || 0);
    const porcentaje = Number(porcentajeAportesInput || 0);
    if (monto >= 0 && porcentaje >= 0) {
      return (monto * porcentaje) / 100;
    }
    return undefined;
  }, [currentRol?.montoSalario, porcentajeAportesInput]);


  const handleModalFieldChange = (field: keyof Omit<Rol, 'notas'>, value: string | number | undefined) => {
    setCurrentRol(prev => {
      if (!prev) return null;
      let updatedRol = { ...prev, [field]: value, tipoSalario: 'Por evento' as 'Por evento' };
      
      if (field === 'montoSalario' && (value === '' || value === undefined || isNaN(Number(value)))) {
         updatedRol.montoSalario = undefined;
      } else if (field === 'montoSalario') {
         updatedRol.montoSalario = Number(value);
      }
      return updatedRol;
    });
  };


  const handleSaveRol = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentRol || !currentRol.nombre?.trim()) {
      toast({ title: "Nombre Requerido", description: "El nombre del rol es obligatorio.", variant: "destructive" });
      return;
    }
    
    const montoSalarioNum = Number(currentRol.montoSalario);
    if (currentRol.montoSalario !== undefined && (isNaN(montoSalarioNum) || montoSalarioNum < 0)) {
        toast({ title: "Sueldo Inválido", description: "El sueldo por evento debe ser un número positivo o estar vacío.", variant: "destructive"});
        return;
    }

    const porcentajeAportesNum = Number(porcentajeAportesInput);
    if (isNaN(porcentajeAportesNum) || porcentajeAportesNum < 0 || porcentajeAportesNum > 100) {
        toast({ title: "Porcentaje de Aportes Inválido", description: "El porcentaje debe estar entre 0 y 100.", variant: "destructive"});
        return;
    }

    setIsSaving(true);
    const rolDataForSave: Partial<Omit<Rol, 'notas'>> = { 
      ...currentRol, 
      tipoSalario: 'Por evento',
      porcentajeAportes: porcentajeAportesNum,
    };
    
    const rolToSave = rolDataForSave as Omit<NuevoRolFormData, 'notas'> | Omit<Rol, 'notas'>;

    try {
      // @ts-ignore saveRol espera Rol o NuevoRolFormData, que pueden incluir notas opcionales.
      // El backend ya no procesará 'notas'.
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
            <DialogDescription>Define los detalles del rol y su compensación por evento.</DialogDescription>
          </DialogHeader>
          {currentRol && (
            <form onSubmit={handleSaveRol} className="space-y-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="rol-nombre">Nombre del Rol *</Label>
                <Input id="rol-nombre" value={currentRol.nombre || ''} onChange={(e) => handleModalFieldChange('nombre', e.target.value)} placeholder="Ej: Mozo, DJ, Coordinador" required />
              </div>
              
              <div className="space-y-1">
                <Label>Tipo de Salario</Label>
                <Input value="Por evento" readOnly disabled className="bg-muted/50"/>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                    <Label htmlFor="rol-monto-salario">Sueldo por Evento (UYU)</Label>
                    <Input id="rol-monto-salario" type="number" value={currentRol.montoSalario ?? ''} onChange={(e) => handleModalFieldChange('montoSalario', e.target.value === '' ? undefined : parseFloat(e.target.value))} placeholder="Ej: 5000" min="0" step="any" />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="rol-porcentaje-aportes">Porcentaje Aportes (%)</Label>
                    <Input id="rol-porcentaje-aportes" type="number" value={porcentajeAportesInput} onChange={(e) => setPorcentajeAportesInput(e.target.value)} placeholder="Ej: 30" min="0" max="100" step="any" />
                </div>
              </div>
              <div className="space-y-1">
                  <Label>Monto Aportes Calculado</Label>
                  <Input value={aportesCalculadosModal !== undefined ? formatCurrency(aportesCalculadosModal) : 'N/A'} readOnly disabled className="bg-muted/50"/>
              </div>
              
              {/* El campo de Notas / Descripción se ha eliminado */}

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
                      <p className="text-xs text-muted-foreground">
                        Tipo: {rol.tipoSalario}
                        {rol.montoSalario !== undefined && (
                          <>
                            {' - '}Sueldo: {formatCurrency(rol.montoSalario)}
                            {rol.porcentajeAportes !== undefined && ` (${rol.porcentajeAportes}%)`}
                            {rol.aportesCalculados !== undefined && ` - Aportes: ${formatCurrency(rol.aportesCalculados)}`}
                          </>
                        )}
                      </p>
                      {/* La visualización de notas se elimina */}
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

