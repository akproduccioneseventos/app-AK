
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, UserPlus2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveCustomer } from '@/app/actions/customers'; // Sigue usando la acción de cliente por ahora
import type { Customer } from '@/types/customer'; // Sigue usando el tipo de cliente por ahora

export default function NewProveedorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [cedula, setCedula] = useState(''); // Usaremos 'taxId' internamente
  const [servicio, setServicio] = useState(''); // Nuevo campo

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() && !companyName.trim()) {
      toast({ title: "Nombre Requerido", description: "Por favor, ingresa el nombre del proveedor o de la empresa.", variant: "destructive" });
      return;
    }
    if (!servicio.trim()) {
      toast({ title: "Servicio Requerido", description: "Por favor, ingresa el servicio que ofrece el proveedor.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    // Adaptar los datos al tipo Customer por ahora
    // El campo 'servicio' no se guarda porque el tipo Customer no lo tiene.
    const proveedorData: Omit<Customer, 'id' | 'email' | 'salesFunnelStage' | 'estadoCliente' | 'phone' | 'address'> & { address?: { street?: string } } = { 
      name: name.trim() || companyName.trim(), 
      companyName: companyName.trim() || undefined,
      taxId: cedula.trim() || undefined, // Cédula se guarda en taxId
      // No se incluye 'phone' ni 'address.street'
      // El campo 'servicio' no se incluye aquí ya que no existe en el tipo Customer
    };

    try {
      // Sigue llamando a saveCustomer, ya que no hay saveProveedor específico aún
      const result = await saveCustomer(proveedorData as Omit<Customer, 'id'>); 
      if (result.success && result.id) {
        toast({ title: "¡Proveedor Guardado!", description: `El proveedor "${proveedorData.name}" ha sido guardado.` });
        router.push('/proveedores'); // Redirigir a la lista de proveedores
      } else {
        throw new Error(result.error || "Error desconocido al guardar el proveedor.");
      }
    } catch (error: any) {
      toast({ title: "Error al Guardar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserPlus2 className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Añadir Nuevo Proveedor
          </h1>
        </div>
        <Link href="/proveedores" passHref>
          <Button variant="outline" disabled={isSaving}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Proveedores
          </Button>
        </Link>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Información del Proveedor</CardTitle>
          <CardDescription>Completa los datos para registrar un nuevo proveedor.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="proveedor-name">Nombre Completo</Label>
                <Input id="proveedor-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Juan Rodríguez" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-name">Nombre de la Empresa (Opcional)</Label>
                <Input id="company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Ej: Insumos Fiesta S.A." />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="proveedor-cedula">Cédula / RUT</Label>
                <Input id="proveedor-cedula" value={cedula} onChange={(e) => setCedula(e.target.value)} placeholder="Ej: 1.234.567-8 o RUT" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proveedor-servicio">Servicio que Ofrece</Label>
                <Input id="proveedor-servicio" value={servicio} onChange={(e) => setServicio(e.target.value)} placeholder="Ej: Catering, Fotografía, DJ" />
              </div>
            </div>
            
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar Proveedor'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
