
'use client';

import { useState, useEffect, useCallback, type FormEvent, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
} from "@/components/ui/alert-dialog";


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
        tipoSalario: 'Mensual', 
        montoSalario: undefined, 
        aportesCalculados: undefined, 
        notas: '' 
      });
    }
    setIsModalOpen(true);
  };
  
  const aportesCalculadosModal = useMemo(() => {
    if (currentRol?.tipoSalario === 'Mensual' && currentRol.montoSalario !== undefined && !isNaN(Number(currentRol.montoSalario)) && Number(currentRol.montoSalario) >= 0) {
      return (Number(currentRol.montoSalario) * 0.30); // Fixed 30%
    }
    return undefined;
  }, [currentRol?.tipoSalario, currentRol?.montoSalario]);


  const handleModalFieldChange = (field: keyof Omit<Rol, 'aportesCalculados'>, value: string | number | undefined) => {
    setCurrentRol(prev => {
      if (!prev) return null;
      let updatedRol = { ...prev, [field]: value };
      
      if (field === 'tipoSalario') {
        if (value !== 'Mensual') { // If not 'Mensual' (e.g., 'Por evento')
          delete updatedRol.montoSalario;
          // aportesCalculados will be handled by backend based on montoSalario
        }
      }
      
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
    
    if (currentRol.tipoSalario === 'Mensual' && (currentRol.montoSalario === undefined || isNaN(Number(currentRol.montoSalario)) || Number(currentRol.montoSalario) < 0)) {
        toast({ title: "Monto de Salario Inválido", description: "Para salario mensual, el monto debe ser un número positivo.", variant: "destructive"});
        return;
    }

    setIsSaving(true);
    const rolDataForSave: Partial<Rol> = { ...currentRol };
    
    // Backend will calculate aportesCalculados based on montoSalario if tipoSalario is 'Mensual'
    // If tipoSalario is 'Por evento', backend will ensure montoSalario and aportesCalculados are not set.

    const rolToSave = rolDataForSave as NuevoRolFormData | Rol;

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
            <DialogDescription>Define los detalles del rol, su tipo de salario y aportes (30% fijo sobre mensual).</DialogDescription>
          </DialogHeader>
          {currentRol && (
            <form onSubmit={handleSaveRol} className="space-y-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="rol-nombre">Nombre del Rol *</Label>
                <Input id="rol-nombre" value={currentRol.nombre || ''} onChange={(e) => handleModalFieldChange('nombre', e.target.value)} placeholder="Ej: Mozo, DJ, Coordinador" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="rol-tipo-salario">Tipo de Salario *</Label>
                <Select value={currentRol.tipoSalario || 'Mensual'} onValueChange={(value) => handleModalFieldChange('tipoSalario', value as Rol['tipoSalario'])}>
                  <SelectTrigger id="rol-tipo-salario"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mensual">Mensual</SelectItem>
                    <SelectItem value="Por evento">Por evento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {currentRol.tipoSalario === 'Mensual' && (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="rol-monto-salario">Monto Salario Mensual (UYU) *</Label>
                    <Input id="rol-monto-salario" type="number" value={currentRol.montoSalario ?? ''} onChange={(e) => handleModalFieldChange('montoSalario', e.target.value === '' ? undefined : parseFloat(e.target.value))} placeholder="Ej: 30000" min="0" step="any" required/>
                  </div>
                   <div className="space-y-1">
                      <Label>Aportes Estimados (30%)</Label>
                      <Input value={aportesCalculadosModal !== undefined ? formatCurrency(aportesCalculadosModal) : 'N/A'} readOnly disabled className="bg-muted/50"/>
                    </div>
                </>
              )}
              <div className="space-y-1">
                <Label htmlFor="rol-notas">Notas / Descripción (Opcional)</Label>
                <Textarea id="rol-notas" value={currentRol.notas || ''} onChange={(e) => handleModalFieldChange('notas', e.target.value)} placeholder="Responsabilidades, detalles importantes del rol..." rows={3}/>
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
                      <p className="text-xs text-muted-foreground">
                        Tipo Salario: {rol.tipoSalario}
                        {rol.tipoSalario === 'Mensual' && rol.montoSalario !== undefined && (
                          <>
                            {' - '}Sueldo: {formatCurrency(rol.montoSalario)}
                            {rol.aportesCalculados !== undefined && ` - Aportes (30%): ${formatCurrency(rol.aportesCalculados)}`}
                          </>
                        )}
                      </p>
                      {rol.notas && <p className="text-xs text-muted-foreground italic mt-1">Notas: {rol.notas.substring(0, 100)}{rol.notas.length > 100 ? '...' : ''}</p>}
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
