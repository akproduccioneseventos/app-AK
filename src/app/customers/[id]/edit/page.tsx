
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Edit3, AlertTriangle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCustomerById, saveCustomer, deleteCustomer as deleteCustomerAction } from '@/app/actions/customers';
import type { Customer, CustomerStatus } from '@/types/customer'; // SalesFunnelStage removido
import { ALL_CUSTOMER_STATES } from '@/types/customer';
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
  
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [cedula, setCedula] = useState('');
  const [street, setStreet] = useState('');
  const [email, setEmail] = useState(''); // Añadido email
  // const [salesFunnelStage, setSalesFunnelStage] = useState<SalesFunnelStage>('Lead'); // Eliminado
  const [estadoClienteForm, setEstadoClienteForm] = useState<CustomerStatus>('Actual');

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
          setPhone(loadedCustomer.phone || '');
          setEmail(loadedCustomer.email || ''); // Cargar email
          setCedula(loadedCustomer.taxId || ''); 
          setStreet(loadedCustomer.address?.street || '');
          // setSalesFunnelStage(loadedCustomer.salesFunnelStage || 'Lead'); // Eliminado
          setEstadoClienteForm(loadedCustomer.estadoCliente || 'Actual');
        } else {
          setNotFound(true);
        }
      } catch (error) {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }
    if (params.id) {
      loadCustomer();
    }
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!customer) return;
    if (!name.trim() && !companyName.trim()) {
      toast({ title: "Nombre Requerido", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const customerData: Customer = {
      ...customer,
      name: name.trim() || companyName.trim(),
      companyName: companyName.trim() || undefined,
      phone: phone.trim() || undefined,
      taxId: cedula.trim() || undefined, 
      email: email.trim() || undefined,
      address: {
        ...(customer.address || {}),
        street: street.trim() || undefined,
      },
      // salesFunnelStage: salesFunnelStage, // Eliminado
      estadoCliente: estadoClienteForm,
    };

    try {
      const result = await saveCustomer(customerData);
      if (result.success && result.customer) {
        toast({ title: "¡Cliente Actualizado!"});
        setCustomer(result.customer); 
      } else {
        throw new Error(result.error || "Error desconocido al actualizar.");
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
        toast({ title: '¡Cliente Eliminado!' });
        router.push('/customers');
      } else {
        throw new Error(result.error || 'Error desconocido al eliminar.');
      }
    } catch (error: any) {
      toast({ title: 'Error al Eliminar', description: error.message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (notFound) return <div className="text-center text-destructive p-4"><AlertTriangle className="mx-auto w-10 h-10 mb-2"/>Cliente no encontrado. <Link href="/customers" className="underline">Volver a clientes</Link>.</div>;


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
          <Button variant="outline" disabled={isSaving || isDeleting}><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
        </Link>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Actualizar Información del Cliente</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div><Label htmlFor="customer-name">Nombre Completo</Label><Input id="customer-name" value={name} onChange={(e) => setName(e.target.value)} disabled={isSaving || isDeleting}/></div>
              <div><Label htmlFor="company-name">Empresa (Opcional)</Label><Input id="company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} disabled={isSaving || isDeleting}/></div>
            </div>
             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div><Label htmlFor="customer-email">Email</Label><Input id="customer-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSaving || isDeleting}/></div>
                <div><Label htmlFor="customer-phone">Teléfono</Label><Input id="customer-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isSaving || isDeleting}/></div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div><Label htmlFor="customer-cedula">Cédula / RUT</Label><Input id="customer-cedula" value={cedula} onChange={(e) => setCedula(e.target.value)} disabled={isSaving || isDeleting}/></div>
              <div>
                <Label htmlFor="customer-status">Estado del Cliente</Label>
                <Select value={estadoClienteForm} onValueChange={(value) => setEstadoClienteForm(value as CustomerStatus)} disabled={isSaving || isDeleting}>
                <SelectTrigger id="customer-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                    {ALL_CUSTOMER_STATES.map(estado => (
                    <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                    ))}
                </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label htmlFor="street">Calle y Número</Label><Input id="street" value={street} onChange={(e) => setStreet(e.target.value)} disabled={isSaving || isDeleting}/></div>
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
