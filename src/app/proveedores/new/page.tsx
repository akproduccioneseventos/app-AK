
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, UserPlus2, Briefcase, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveProveedor } from '@/app/actions/proveedores';
import type { NuevoProveedorFormData, TipoRegistroProveedor } from '@/types/proveedor';

export default function NewProveedorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [tipo, setTipo] = useState<TipoRegistroProveedor>('Proveedor');
  const [nombre, setNombre] = useState('');
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [servicioPrincipal, setServicioPrincipal] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [notas, setNotas] = useState('');
  
  const isServicio = tipo === 'Servicio Subcontratado';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nombreEmpresa.trim()) {
      toast({ title: "Campo Requerido", description: `Por favor, ingresa el ${isServicio ? 'nombre del servicio' : 'nombre de la empresa'}.`, variant: "destructive" });
      return;
    }
    if (!servicioPrincipal.trim()) {
      toast({ title: "Servicio Requerido", description: `Por favor, ingresa el ${isServicio ? 'tipo de servicio' : 'la categoría principal'}.`, variant: "destructive" });
      return;
    }
    if (isServicio && !nombre.trim()) {
      toast({ title: "Nombre del Responsable Requerido", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    
    const proveedorData: NuevoProveedorFormData = { 
      tipo,
      nombre: nombre.trim(), 
      nombreEmpresa: nombreEmpresa.trim(),
      servicioPrincipal: servicioPrincipal.trim(),
      telefono: telefono.trim() || undefined,
      email: email.trim() || undefined,
      notas: notas.trim() || undefined,
    };

    try {
      const result = await saveProveedor(proveedorData); 
      if (result.success && result.id) {
        toast({ title: "¡Registro Guardado!", description: `El registro "${proveedorData.nombreEmpresa}" ha sido guardado.` });
        router.push('/proveedores');
      } else {
        throw new Error(result.error || "Error desconocido al guardar.");
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
            Añadir Registro
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
          <CardTitle className="font-headline">Información del Registro</CardTitle>
          <CardDescription>Selecciona el tipo de registro y completa los datos.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-3 p-3 border rounded-md bg-muted/30">
                <Label className="text-base">Tipo de Registro*</Label>
                <RadioGroup defaultValue="Proveedor" onValueChange={(value) => setTipo(value as TipoRegistroProveedor)} className="flex gap-6">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Proveedor" id="r-proveedor" />
                        <Label htmlFor="r-proveedor" className="flex items-center gap-2"><Building className="w-4 h-4"/>Proveedor de Insumos</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Servicio Subcontratado" id="r-servicio" />
                        <Label htmlFor="r-servicio" className="flex items-center gap-2"><Briefcase className="w-4 h-4"/>Servicio Subcontratado</Label>
                    </div>
                </RadioGroup>
            </div>
            
             <div className="space-y-2">
                <Label htmlFor="company-name">{isServicio ? 'Nombre del Servicio*' : 'Nombre de la Empresa*'}</Label>
                <Input id="company-name" value={nombreEmpresa} onChange={(e) => setNombreEmpresa(e.target.value)} placeholder={isServicio ? 'Ej: DJ Master, Fotografía Premium' : 'Ej: Insumos Fiesta S.A.'} required />
            </div>

             <div className="space-y-2">
                <Label htmlFor="proveedor-name">{isServicio ? 'Nombre del Responsable*' : 'Nombre del Contacto (Opcional)'}</Label>
                <Input id="proveedor-name" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Juan Rodríguez" required={isServicio}/>
              </div>

            <div className="space-y-2">
              <Label htmlFor="proveedor-servicio">{isServicio ? 'Tipo de Servicio*' : 'Categoría Principal*'}</Label>
              <Input id="proveedor-servicio" value={servicioPrincipal} onChange={(e) => setServicioPrincipal(e.target.value)} placeholder={isServicio ? 'Ej: Fotografía, DJ, Animación' : 'Ej: Catering, Mantelería, Descartables'} required />
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
              {isSaving ? 'Guardando...' : 'Guardar Registro'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
