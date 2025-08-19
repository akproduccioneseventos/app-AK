
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Wand2, PlusCircle, Save, Loader2, AlertTriangle, Package, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getArmadoRapidoConfig, saveArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import type { ArmadoRapidoConfig, PaqueteArmadoRapido, ServicioIncluido } from '@/types/armado-rapido';
import type { ServicioEmpresa } from '@/types/empresa';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};


interface EditPackageModalProps {
    pkg: PaqueteArmadoRapido;
    allServices: ServicioEmpresa[];
    onSave: (updatedPackage: PaqueteArmadoRapido) => void;
    children: React.ReactNode;
}

function EditPackageModal({ pkg, allServices, onSave, children }: EditPackageModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [editedPackage, setEditedPackage] = useState<PaqueteArmadoRapido>(pkg);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            setEditedPackage(JSON.parse(JSON.stringify(pkg))); // Deep copy to avoid state issues
        }
    }, [isOpen, pkg]);

    const handleAddService = (service: ServicioEmpresa) => {
        setEditedPackage(prev => {
            const servicio: ServicioIncluido = {
                id: service.id,
                nombre: service.nombre,
                precioBase: service.precioVenta,
                precioPorPersona: 0,
            };
            return {
                ...prev,
                serviciosIncluidos: [...prev.serviciosIncluidos, servicio]
            };
        });
    };

    const handleRemoveService = (serviceId: string) => {
        setEditedPackage(prev => ({
            ...prev,
            serviciosIncluidos: prev.serviciosIncluidos.filter(s => s.id !== serviceId)
        }));
    };
    
    const includedServiceIds = useMemo(() => new Set(editedPackage.serviciosIncluidos.map(s => s.id)), [editedPackage.serviciosIncluidos]);
    const availableServices = useMemo(() => {
        return allServices.filter(s => 
            !includedServiceIds.has(s.id) &&
            s.nombre.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allServices, includedServiceIds, searchTerm]);
    

    const handleSaveChanges = () => {
        onSave(editedPackage);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="font-headline text-xl">Administrar Paquete: {editedPackage.nombre}</DialogTitle>
                    <DialogDescription>Añade o quita servicios del paquete.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] py-4">
                    {/* Included Services */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-foreground">Servicios Incluidos ({editedPackage.serviciosIncluidos.length})</h3>
                        <ScrollArea className="h-full border rounded-lg p-3">
                            {editedPackage.serviciosIncluidos.length > 0 ? (
                                <ul className="space-y-2">
                                    {editedPackage.serviciosIncluidos.map(s => (
                                        <li key={s.id} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded">
                                            <span>{s.nombre}</span>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveService(s.id)}><Trash2 className="w-4 h-4" /></Button>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="text-center text-muted-foreground p-4">No hay servicios en este paquete.</p>}
                        </ScrollArea>
                    </div>
                    {/* Available Services */}
                    <div className="space-y-3 flex flex-col">
                        <h3 className="font-semibold text-foreground">Catálogo de Servicios Disponibles</h3>
                         <Input placeholder="Buscar servicio para añadir..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        <ScrollArea className="flex-grow border rounded-lg p-3">
                            {availableServices.length > 0 ? (
                                <ul className="space-y-2">
                                    {availableServices.map(s => (
                                        <li key={s.id} className="flex justify-between items-center text-sm p-2 rounded hover:bg-muted/30">
                                            <div>
                                                <p>{s.nombre}</p>
                                                <p className="text-xs text-muted-foreground">{formatCurrency(s.precioVenta)}</p>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => handleAddService(s)}>Añadir</Button>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="text-center text-muted-foreground p-4">No hay más servicios disponibles o que coincidan.</p>}
                        </ScrollArea>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                    <Button onClick={handleSaveChanges}>Guardar Cambios del Paquete</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function ArmadoRapidoSettingsPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ArmadoRapidoConfig | null>(null);
  const [vendibleServices, setVendibleServices] = useState<ServicioEmpresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedConfig, fetchedServices] = await Promise.all([
        getArmadoRapidoConfig(),
        getServiciosEmpresa()
      ]);
      setConfig(fetchedConfig);
      setVendibleServices(fetchedServices.filter(s => s.tipoItem === 'Servicio' && s.precioVenta !== undefined));
    } catch (err: any) {
      setError("No se pudo cargar la configuración.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handlePackageNameChange = (packageId: string, newName: string) => {
    setConfig(prev => {
        if (!prev) return null;
        return {
            ...prev,
            paquetes: prev.paquetes.map(pkg => pkg.id === packageId ? {...pkg, nombre: newName} : pkg)
        };
    });
  }
  
  const handleUpdatePackageServices = (updatedPackage: PaqueteArmadoRapido) => {
    setConfig(prev => {
        if (!prev) return null;
        return {
            ...prev,
            paquetes: prev.paquetes.map(pkg => pkg.id === updatedPackage.id ? updatedPackage : pkg)
        };
    });
  };

  const handleSaveChanges = async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      const result = await saveArmadoRapidoConfig(config);
      if (result.success) {
        toast({ title: "¡Configuración Guardada!", description: "Tus paquetes de armado rápido han sido actualizados." });
        loadData();
      } else {
        throw new Error(result.error || "No se pudo guardar la configuración.");
      }
    } catch (err: any) {
      toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
   if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (error) {
    return <div className="text-center text-destructive p-4"><AlertTriangle className="mx-auto w-10 h-10 mb-2"/>{error}</div>;
  }
  if (!config) {
    return <div className="text-center text-muted-foreground p-4">No se encontró la configuración.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wand2 className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Configuración de Armado Rápido</h1>
        </div>
        <Link href="/settings" passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
      </div>

       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Paquetes de Presupuesto Rápido</CardTitle>
          <CardDescription>Crea y edita los paquetes que tus clientes podrán seleccionar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {config.paquetes.map(pkg => (
                <Card key={pkg.id} className="bg-muted/30">
                    <CardHeader className="pb-3">
                        <Label htmlFor={`pkg-name-${pkg.id}`} className="font-semibold text-lg">Nombre del Paquete:</Label>
                        <Input 
                            id={`pkg-name-${pkg.id}`}
                            value={pkg.nombre}
                            onChange={(e) => handlePackageNameChange(pkg.id, e.target.value)}
                            className="text-lg h-11"
                        />
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm font-medium mb-2">Servicios Incluidos:</p>
                        {pkg.serviciosIncluidos.length > 0 ? (
                           <ul className="list-disc list-inside text-sm text-muted-foreground">
                               {pkg.serviciosIncluidos.map(s => <li key={s.id}>{s.nombre}</li>)}
                           </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">Este paquete no tiene servicios.</p>
                        )}
                    </CardContent>
                    <CardFooter>
                       <EditPackageModal
                          pkg={pkg}
                          allServices={vendibleServices}
                          onSave={handleUpdatePackageServices}
                       >
                            <Button variant="outline"><Edit className="w-4 h-4 mr-2"/>Administrar Paquete</Button>
                       </EditPackageModal>
                    </CardFooter>
                </Card>
            ))}
        </CardContent>
      </Card>
      <CardFooter className="border-t pt-6">
        <Button size="lg" onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2"/> : <Save className="w-5 h-5 mr-2"/>}
            {isSaving ? 'Guardando...' : 'Guardar Toda la Configuración'}
        </Button>
      </CardFooter>
    </div>
  );
}
