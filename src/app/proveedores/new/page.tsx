
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, UserPlus2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveProveedor } from '@/app/actions/proveedores';
import type { NuevoProveedorFormData } from '@/types/proveedor';

export default function NewProveedorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Form state aligned with Proveedor type
  const [nombre, setNombre] = useState('');
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [servicioPrincipal, setServicioPrincipal] = useState('');
  const [personaContacto, setPersonaContacto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [notas, setNotas] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() && !nombreEmpresa.trim()) {
      toast({ title: "Nombre Requerido", description: "Por favor, ingresa el nombre del proveedor o de la empresa.", variant: "destructive" });
      return;
    }
    if (!servicioPrincipal.trim()) {
      toast({ title: "Servicio Requerido", description: "Por favor, ingresa el servicio principal que ofrece el proveedor.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    
    const proveedorData: NuevoProveedorFormData = { 
      nombre: nombre.trim() || nombreEmpresa.trim(), 
      nombreEmpresa: nombreEmpresa.trim() || undefined,
      servicioPrincipal: servicioPrincipal.trim(),
      personaContacto: personaContacto.trim() || undefined,
      telefono: telefono.trim() || undefined,
      email: email.trim() || undefined,
      notas: notas.trim() || undefined,
    };

    try {
      const result = await saveProveedor(proveedorData); 
      if (result.success && result.id) {
        toast({ title: "¡Proveedor Guardado!", description: `El proveedor "${proveedorData.nombre}" ha sido guardado.` });
        router.push('/proveedores');
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
                <Label htmlFor="proveedor-name">Nombre Contacto</Label>
                <Input id="proveedor-name" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Juan Rodríguez" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-name">Nombre de la Empresa</Label>
                <Input id="company-name" value={nombreEmpresa} onChange={(e) => setNombreEmpresa(e.target.value)} placeholder="Ej: Insumos Fiesta S.A." />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proveedor-servicio">Servicio Principal*</Label>
              <Input id="proveedor-servicio" value={servicioPrincipal} onChange={(e) => setServicioPrincipal(e.target.value)} placeholder="Ej: Catering, Fotografía, DJ" required />
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="proveedor-telefono">Teléfono</Label>
                    <Input id="proveedor-telefono" type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="proveedor-email">Email</Label>
                    <Input id="proveedor-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proveedor-notas">Notas Adicionales</Label>
              <Textarea id="proveedor-notas" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Detalles de contacto, calidad del servicio, etc." rows={3} />
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
