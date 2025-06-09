
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Save, Loader2, Edit3, AlertTriangle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCustomerById, saveCustomer, deleteCustomer as deleteCustomerAction } from '@/app/actions/customers';
import type { Customer } from '@/types/customer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function EditCustomerPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  
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
  const [customerState, setCustomerState] = useState(''); // Renamed to avoid conflict with React's 'state'

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadCustomer() {
      setIsLoading(true);
      setNotFound(false);
      try {
        const loadedCustomer = await getCustomerById(params.id);
        if (loadedCustomer) {
          setCustomer(loadedCustomer);
          setName(loadedCustomer.name || '');
          setCompanyName(loadedCustomer.companyName || '');
          setEmail(loadedCustomer.email || '');
          setPhone(loadedCustomer.phone || '');
          setTaxId(loadedCustomer.taxId || '');
          setStreet(loadedCustomer.address?.street || '');
          setCity(loadedCustomer.address?.city || '');
          setZipCode(loadedCustomer.address?.zipCode || '');
          setCountry(loadedCustomer.address?.country || '');
          setCustomerState(loadedCustomer.address?.state || '');
        } else {
          setNotFound(true);
          toast({ title: 'Error', description: `No se encontró el cliente con ID ${params.id}.`, variant: 'destructive' });
        }
      } catch (error) {
        console.error("Error al cargar el cliente:", error);
        setNotFound(true);
        toast({ title: 'Error al Cargar Cliente', description: 'No se pudo obtener el cliente.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    }
    if (params.id) {
      loadCustomer();
    }
  }, [params.id, toast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!customer) return;
    if (!name.trim() && !companyName.trim()) {
      toast({ title: "Nombre Requerido", description: "Por favor, ingresa el nombre del cliente o de la empresa.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const customerData: Customer = {
      ...customer,
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
        state: customerState.trim() || undefined,
      },
    };

    try {
      const result = await saveCustomer(customerData);
      if (result.success && result.customer) {
        toast({ title: "¡Cliente Actualizado!", description: `El cliente "${result.customer.name}" ha sido actualizado.` });
        setCustomer(result.customer); 
      } else {
        throw new Error(result.error || "Error desconocido al actualizar el cliente.");
      }
    } catch (error: any) {
      toast({ title: "Error al Actualizar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!customer) return;
    setIsDeleting(true);
    try {
      const result = await deleteCustomerAction(customer.id);
      if (result.success) {
        toast({ title: '¡Cliente Eliminado!', description: `El cliente "${customer.name}" ha sido eliminado.` });
        router.push('/customers');
      } else {
        throw new Error(result.error || 'Error desconocido al eliminar el cliente.');
      }
    } catch (error: any) {
      toast({ title: 'Error al Eliminar', description: error.message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-16 h-16 animate-spin text-primary" />
        <p className="ml-4 text-xl">Cargando datos del cliente...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Cliente no Encontrado</h1>
        <p className="text-muted-foreground mb-6">
          El cliente con ID <span className="font-mono bg-muted px-1 rounded">{params.id}</span> no pudo ser encontrado.
        </p>
        <Link href="/customers" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Clientes
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Edit3 className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Editando: <span className="text-primary">{customer?.companyName || customer?.name || params.id}</span>
          </h1>
        </div>
        <Link href="/customers" passHref>
          <Button variant="outline" disabled={isSaving || isDeleting}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Actualizar Información del Cliente</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer-name">Nombre Completo (Persona)</Label>
                <Input id="customer-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Ana García Pérez" disabled={isSaving || isDeleting}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-name">Nombre de la Empresa (Opcional)</Label>
                <Input id="company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Ej: Soluciones Creativas S.L." disabled={isSaving || isDeleting}/>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer-email">Email</Label>
                <Input id="customer-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contacto@empresa.com" disabled={isSaving || isDeleting}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-phone">Teléfono</Label>
                <Input id="customer-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+34 600 000 000" disabled={isSaving || isDeleting}/>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-taxid">NIF/CIF</Label>
              <Input id="customer-taxid" value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="Ej: B12345678" disabled={isSaving || isDeleting}/>
            </div>
            
            <h3 className="text-lg font-medium pt-4 border-t font-headline">Dirección</h3>
            <div className="space-y-2">
              <Label htmlFor="street">Calle y Número</Label>
              <Input id="street" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Ej: Calle de la Innovación 123" disabled={isSaving || isDeleting}/>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ej: Madrid" disabled={isSaving || isDeleting}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip-code">Código Postal</Label>
                <Input id="zip-code" value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="Ej: 28001" disabled={isSaving || isDeleting}/>
              </div>
            </div>
             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="state">Provincia / Estado</Label>
                <Input id="state" value={customerState} onChange={(e) => setCustomerState(e.target.value)} placeholder="Ej: Madrid" disabled={isSaving || isDeleting}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Ej: España" disabled={isSaving || isDeleting}/>
              </div>
            </div>
            <div className="pt-4">
              <Image 
                src="https://placehold.co/600x300.png" 
                alt="Customer relationship management" 
                width={600}
                height={300}
                className="rounded-md shadow-sm mx-auto"
                data-ai-hint="customer data update"
              />
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving || isDeleting}>
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" type="button" className="w-full sm:w-auto" disabled={isSaving || isDeleting}>
                  {isDeleting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Trash2 className="w-5 h-5 mr-2" />}
                  {isDeleting ? 'Eliminando...' : 'Eliminar Cliente'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. El cliente "{customer?.companyName || customer?.name}" será eliminado permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                    {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Sí, eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
