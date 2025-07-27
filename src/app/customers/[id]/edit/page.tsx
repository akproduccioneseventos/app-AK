
'use client';

import React, { useState, useEffect, type FormEvent, useCallback } from 'react'; 
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Edit3, AlertTriangle, Trash2, CalendarDays, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCustomerById, saveCustomer, deleteCustomer as deleteCustomerAction } from '@/app/actions/customers';
import type { Customer, CustomerStatus } from '@/types/customer';
import { ALL_CUSTOMER_STATES } from '@/types/customer';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger, // Added AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { ALL_TIPOS_EVENTO, type TipoEvento } from '@/types/presupuesto';

export default function EditCustomerPage({ params: paramsProp }: { params: Promise<{ id: string }> }) {
  const params = React.use(paramsProp); // Unwrap the params promise
  const router = useRouter();
  const { toast } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  
  // General fields
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [taxId, setTaxId] = useState(''); 
  const [estadoClienteForm, setEstadoClienteForm] = useState<CustomerStatus>('Actual');

  // Party-related fields
  const [partyDate, setPartyDate] = useState<Date | undefined>(undefined);
  const [partyTime, setPartyTime] = useState('');
  const [partyType, setPartyType] = useState<TipoEvento | string>('');
  const [customPartyType, setCustomPartyType] = useState('');
  const [guestCount, setGuestCount] = useState<string>('');
  const [partyForWhom, setPartyForWhom] = useState('');
  const [venueName, setVenueName] = useState('');
  const [currentContractFile, setCurrentContractFile] = useState<string | null>(null);
  const [currentBudgetFile, setCurrentBudgetFile] = useState<string | null>(null);
  const [newContractFile, setNewContractFile] = useState<File | null>(null);
  const [newBudgetFile, setNewBudgetFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Use the unwrapped params.id
  const customerIdFromParams = params.id;

  const loadCustomer = useCallback(async () => {
    setIsLoading(true);
    setNotFound(false);
    try {
      const loadedCustomer = await getCustomerById(customerIdFromParams); // Use unwrapped ID
      if (loadedCustomer) {
        setCustomer(loadedCustomer);
        setName(loadedCustomer.name || '');
        setCompanyName(loadedCustomer.companyName || '');
        setPhone(loadedCustomer.phone || '');
        setTaxId(loadedCustomer.taxId || ''); 
        setEstadoClienteForm(loadedCustomer.estadoCliente || 'Actual');

        setPartyDate(loadedCustomer.partyDate ? new Date(loadedCustomer.partyDate) : undefined);
        setPartyTime(loadedCustomer.partyTime || '');
        setPartyType(loadedCustomer.partyType || '');
        setGuestCount(loadedCustomer.guestCount?.toString() || '');
        setPartyForWhom(loadedCustomer.partyForWhom || '');
        setVenueName(loadedCustomer.venueName || '');
        setCurrentContractFile(loadedCustomer.contractFileName || null);
        setCurrentBudgetFile(loadedCustomer.budgetFileName || null);

      } else {
        setNotFound(true);
      }
    } catch (error) {
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  }, [customerIdFromParams]);

  useEffect(() => {
    if (customerIdFromParams) { // Use unwrapped ID
      loadCustomer();
    }
  }, [customerIdFromParams, loadCustomer]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!customer) return;

    setIsSaving(true);
    const formData = new FormData();
    formData.append('id', customer.id); 
    
    if (name.trim()) formData.append('name', name.trim());
    else if (companyName.trim()) formData.append('name', companyName.trim()); 

    if (companyName.trim()) formData.append('companyName', companyName.trim());
    if (phone.trim()) formData.append('phone', phone.trim());
    if (taxId.trim()) formData.append('taxId', taxId.trim());
    formData.append('estadoCliente', estadoClienteForm);
    
    if (partyDate) formData.append('partyDate', partyDate.toISOString());
    if (partyTime.trim()) formData.append('partyTime', partyTime.trim());
    
    const finalPartyType = partyType === "Otro" ? customPartyType.trim() : partyType.trim();
    if (finalPartyType) formData.append('partyType', finalPartyType);
    
    if (guestCount.trim()) formData.append('guestCount', guestCount.trim());
    if (partyForWhom.trim()) formData.append('partyForWhom', partyForWhom.trim());
    if (venueName.trim()) formData.append('venueName', venueName.trim());

    if (newContractFile) formData.append('contract', newContractFile);
    else if (currentContractFile) formData.append('contractFileName', currentContractFile); 

    if (newBudgetFile) formData.append('budget', newBudgetFile);
    else if (currentBudgetFile) formData.append('budgetFileName', currentBudgetFile); 


    try {
      const result = await saveCustomer(formData);
      if (result.success && result.customer) {
        toast({ title: "¡Cliente Actualizado!"});
        setCustomer(result.customer); 
        setCurrentContractFile(result.customer.contractFileName || null);
        setCurrentBudgetFile(result.customer.budgetFileName || null);
        setNewContractFile(null); 
        setNewBudgetFile(null);
        
        const contractInput = document.getElementById('contract-file') as HTMLInputElement;
        if (contractInput) contractInput.value = "";
        const budgetInput = document.getElementById('budget-file') as HTMLInputElement;
        if (budgetInput) budgetInput.value = "";

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
  
  const handlePartyTypeChange = (value: string) => {
    if (value === "Otro") {
      setPartyType("Otro"); 
      setCustomPartyType(''); 
    } else {
      setPartyType(value as TipoEvento);
      setCustomPartyType(''); 
    }
  };

  const eventoTipoEnSelect =
    partyType && ALL_TIPOS_EVENTO.includes(partyType as TipoEvento)
      ? partyType
      : (partyType && partyType.trim() !== "" ? "Otro" : "");
  const showCustomPartyTypeInput = eventoTipoEnSelect === "Otro" || (partyType && !ALL_TIPOS_EVENTO.includes(partyType as TipoEvento));

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (notFound) return <div className="text-center text-destructive p-4"><AlertTriangle className="mx-auto w-10 h-10 mb-2"/>Cliente no encontrado. <Link href="/customers" className="underline">Volver a clientes</Link>.</div>;


  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Edit3 className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Editando: <span className="text-primary">{customer?.companyName || customer?.name || customerIdFromParams}</span>
          </h1>
        </div>
        <Link href="/customers" passHref>
          <Button variant="outline" disabled={isSaving || isDeleting}><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
        </Link>
      </div>
      
      <Card className="shadow-lg">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="font-headline">Actualizar Información del Cliente</CardTitle>
            <CardDescription>Completa la información que tengas disponible. Puedes editarla más tarde.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div><Label htmlFor="customer-name">Nombre Completo</Label><Input id="customer-name" value={name} onChange={(e) => setName(e.target.value)} disabled={isSaving || isDeleting} /></div>
              <div><Label htmlFor="company-name">Empresa</Label><Input id="company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} disabled={isSaving || isDeleting}/></div>
            </div>
             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div><Label htmlFor="customer-phone">Teléfono</Label><Input id="customer-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isSaving || isDeleting}/></div>
                <div><Label htmlFor="customer-taxid">Cédula / RUT</Label><Input id="customer-taxid" value={taxId} onChange={(e) => setTaxId(e.target.value)} disabled={isSaving || isDeleting}/></div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
          </CardContent>

          <Separator className="my-6" />

          <CardHeader>
            <CardTitle className="font-headline">Información de la Fiesta Contratada (Opcional)</CardTitle>
             <CardDescription>Puedes completar esta información ahora o más tarde.</CardDescription>
          </CardHeader>
           <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="party-date">Fecha de la Fiesta</Label>
                  <DatePickerDemo selectedDate={partyDate} onDateChange={setPartyDate} />
                </div>
                <div>
                  <Label htmlFor="party-time">Horario del Evento</Label>
                  <Input id="party-time" type="text" value={partyTime} onChange={(e) => setPartyTime(e.target.value)} placeholder="Ej: 19:00 - 02:00" disabled={isSaving || isDeleting}/>
                </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="party-type-select">Tipo de Fiesta</Label>
                   <Select 
                    value={eventoTipoEnSelect}
                    onValueChange={handlePartyTypeChange}
                  >
                    <SelectTrigger id="party-type-select" className="text-base p-3 h-auto">
                      <SelectValue placeholder="Seleccioná un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_TIPOS_EVENTO.map(tipo => (
                        <SelectItem key={tipo} value={tipo} className="text-base">{tipo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {showCustomPartyTypeInput && (
                     <Input 
                        id="party-type-otro" 
                        placeholder="Especificá el tipo de fiesta" 
                        value={partyType !== "Otro" ? partyType : customPartyType}
                        onChange={(e) => setCustomPartyType(e.target.value)}
                        className="text-base p-3 mt-2"
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="guest-count">Cantidad de Invitados</Label>
                  <Input id="guest-count" type="number" value={guestCount} onChange={(e) => setGuestCount(e.target.value)} placeholder="Ej: 100" min="1" disabled={isSaving || isDeleting}/>
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="party-for-whom">Para quién es la Fiesta</Label>
              <Input 
                id="party-for-whom" 
                value={partyForWhom} 
                onChange={(e) => setPartyForWhom(e.target.value)} 
                placeholder="Ej: “Lucía – 15 años”, “Bautismo de Thiago”, “Aniversario de Juan y Laura”"
                disabled={isSaving || isDeleting}
              />
            </div>
             <div>
                <Label htmlFor="venue-name">Salón de Fiestas / Lugar</Label>
                <Input id="venue-name" value={venueName} onChange={(e) => setVenueName(e.target.value)} placeholder="Ej: Salón El Paraíso" disabled={isSaving || isDeleting}/>
             </div>
             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="budget-file" className="flex items-center gap-1"><FileText className="w-4 h-4 text-muted-foreground"/>Presupuesto (PDF)</Label>
                    <Input id="budget-file" type="file" accept="application/pdf" onChange={(e) => setNewBudgetFile(e.target.files?.[0] || null)} 
                           className="file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                           disabled={isSaving || isDeleting}/>
                    {currentBudgetFile && !newBudgetFile && <p className="text-xs text-muted-foreground mt-1">Actual: <a href={`/api/budgets/${currentBudgetFile}`} target="_blank" rel="noopener noreferrer" className="text-primary underline">{currentBudgetFile}</a></p>}
                    {newBudgetFile && <p className="text-xs text-muted-foreground mt-1">Nuevo: {newBudgetFile.name}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="contract-file" className="flex items-center gap-1"><FileText className="w-4 h-4 text-muted-foreground"/>Contrato (PDF)</Label>
                    <Input id="contract-file" type="file" accept="application/pdf" onChange={(e) => setNewContractFile(e.target.files?.[0] || null)} 
                           className="file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                           disabled={isSaving || isDeleting}/>
                    {currentContractFile && !newContractFile && <p className="text-xs text-muted-foreground mt-1">Actual: <a href={`/api/contracts/${currentContractFile}`} target="_blank" rel="noopener noreferrer" className="text-primary underline">{currentContractFile}</a></p>}
                    {newContractFile && <p className="text-xs text-muted-foreground mt-1">Nuevo: {newContractFile.name}</p>}
                </div>
             </div>
          </CardContent>

          <CardFooter className="border-t pt-6 mt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
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
