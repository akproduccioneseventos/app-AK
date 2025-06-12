
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
import { saveCustomer } from '@/app/actions/customers';
import type { Customer } from '@/types/customer'; // CustomerStatus no es necesario aquí

export default function NewCustomerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [cedula, setCedula] = useState(''); // taxId
  const [street, setStreet] = useState('');
  const [email, setEmail] = useState(''); // Añadido campo email

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() && !companyName.trim()) {
      toast({ title: "Nombre Requerido", description: "Por favor, ingresa el nombre del cliente o de la empresa.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const customerData: Omit<Customer, 'id' | 'estadoCliente'> = { 
      name: name.trim() || companyName.trim(), 
      companyName: companyName.trim() || undefined,
      phone: phone.trim() || undefined,
      taxId: cedula.trim() || undefined, 
      email: email.trim() || undefined,
      address: {
        street: street.trim() || undefined,
      },
      // estadoCliente se asignará por defecto en la acción si es nuevo
    };

    try {
      // La etapa del embudo ya no se gestiona aquí
      const result = await saveCustomer(customerData); 
      if (result.success && result.id) {
        toast({ title: "¡Cliente Guardado!", description: `El cliente "${customerData.name}" ha sido guardado.` });
        router.push('/customers');
      } else {
        throw new Error(result.error || "Error desconocido al guardar el cliente.");
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
            Añadir Nuevo Cliente (Confirmado)
          </h1>
        </div>
        <Link href="/customers" passHref>
          <Button variant="outline" disabled={isSaving}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Clientes
          </Button>
        </Link>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Información del Cliente</CardTitle>
          <CardDescription>Completa los datos para registrar un nuevo cliente (usualmente después de un contrato).</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div><Label htmlFor="customer-name">Nombre Completo</Label><Input id="customer-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Ana García Pérez" /></div>
              <div><Label htmlFor="company-name">Empresa (Opcional)</Label><Input id="company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></div>
            </div>
             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div><Label htmlFor="customer-email">Email</Label><Input id="customer-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cliente@ejemplo.com" /></div>
              <div><Label htmlFor="customer-phone">Teléfono</Label><Input id="customer-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div><Label htmlFor="customer-cedula">Cédula / RUT</Label><Input id="customer-cedula" value={cedula} onChange={(e) => setCedula(e.target.value)} /></div>
              <div><Label htmlFor="street">Calle y Número</Label><Input id="street" value={street} onChange={(e) => setStreet(e.target.value)} /></div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar Cliente'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
