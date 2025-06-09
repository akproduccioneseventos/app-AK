
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Save, Loader2, UserPlus2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveCustomer } from '@/app/actions/customers';
import type { Customer, SalesFunnelStage } from '@/types/customer';
import { ALL_SALES_FUNNEL_STAGES } from '@/types/customer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function NewCustomerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [taxId, setTaxId] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState(''); // For state/province
  const [salesFunnelStage, setSalesFunnelStage] = useState<SalesFunnelStage>('Lead');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() && !companyName.trim()) {
      toast({ title: "Nombre Requerido", description: "Por favor, ingresa el nombre del cliente o de la empresa.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const customerData: Omit<Customer, 'id'> = {
      name: name.trim() || companyName.trim(), 
      companyName: companyName.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      taxId: taxId.trim() || undefined,
      address: {
        street: street.trim() || undefined,
        city: city.trim() || undefined,
        zipCode: zipCode.trim() || undefined,
        country: country.trim() || undefined,
        state: state.trim() || undefined,
      },
      salesFunnelStage: salesFunnelStage,
    };

    try {
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
            Añadir Nuevo Cliente
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
          <CardDescription>Completa los datos para registrar un nuevo cliente.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer-name">Nombre Completo (Persona)</Label>
                <Input id="customer-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Ana García Pérez" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-name">Nombre de la Empresa (Opcional)</Label>
                <Input id="company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Ej: Soluciones Creativas S.L." />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer-email">Email</Label>
                <Input id="customer-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contacto@empresa.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-phone">Teléfono</Label>
                <Input id="customer-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+34 600 000 000" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer-taxid">NIF/CIF</Label>
                <Input id="customer-taxid" value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="Ej: B12345678" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sales-funnel-stage">Etapa del Embudo</Label>
                <Select value={salesFunnelStage} onValueChange={(value) => setSalesFunnelStage(value as SalesFunnelStage)}>
                  <SelectTrigger id="sales-funnel-stage">
                    <SelectValue placeholder="Seleccionar etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_SALES_FUNNEL_STAGES.map(stage => (
                      <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <h3 className="text-lg font-medium pt-4 border-t font-headline">Dirección</h3>
            <div className="space-y-2">
              <Label htmlFor="street">Calle y Número</Label>
              <Input id="street" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Ej: Calle de la Innovación 123" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ej: Madrid" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip-code">Código Postal</Label>
                <Input id="zip-code" value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="Ej: 28001" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="state">Provincia / Estado</Label>
                <Input id="state" value={state} onChange={(e) => setState(e.target.value)} placeholder="Ej: Madrid" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Ej: España" />
              </div>
            </div>
            <div className="pt-4">
              <Image 
                src="https://placehold.co/600x300.png" 
                alt="Customer relationship management" 
                width={600}
                height={300}
                className="rounded-md shadow-sm mx-auto"
                data-ai-hint="customer relationship management"
              />
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
