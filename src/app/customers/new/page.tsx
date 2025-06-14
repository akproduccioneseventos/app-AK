
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, UserPlus2, CalendarDays, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveCustomer } from '@/app/actions/customers';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { Separator } from '@/components/ui/separator';

export default function NewCustomerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [taxId, setTaxId] = useState('');
  const [email, setEmail] = useState('');
  const [street, setStreet] = useState('');

  // New party-related fields
  const [partyDate, setPartyDate] = useState<Date | undefined>(undefined);
  const [partyTime, setPartyTime] = useState('');
  const [partyType, setPartyType] = useState('');
  const [guestCount, setGuestCount] = useState<string>(''); // Store as string for input, parse on submit
  const [venueName, setVenueName] = useState('');
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [budgetFile, setBudgetFile] = useState<File | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() && !companyName.trim()) {
      toast({ title: "Nombre Requerido", description: "Por favor, ingresa el nombre del cliente o de la empresa.", variant: "destructive" });
      return;
    }
    if (!partyDate || !partyTime.trim() || !partyType.trim() || !guestCount.trim() || parseInt(guestCount) <= 0 || !venueName.trim() || !contractFile || !budgetFile) {
       toast({ title: "Campos de Fiesta Obligatorios", description: "Fecha, horario, tipo, invitados, salón, presupuesto y contrato son obligatorios.", variant: "destructive"});
       return;
    }

    setIsSaving(true);
    
    const formData = new FormData();
    formData.append('name', name.trim() || companyName.trim());
    if (companyName.trim()) formData.append('companyName', companyName.trim());
    if (phone.trim()) formData.append('phone', phone.trim());
    if (taxId.trim()) formData.append('taxId', taxId.trim());
    if (email.trim()) formData.append('email', email.trim());
    if (street.trim()) formData.append('street', street.trim());

    if (partyDate) formData.append('partyDate', partyDate.toISOString());
    formData.append('partyTime', partyTime.trim());
    formData.append('partyType', partyType.trim());
    formData.append('guestCount', guestCount.trim());
    formData.append('venueName', venueName.trim());
    
    if (contractFile) formData.append('contract', contractFile);
    if (budgetFile) formData.append('budget', budgetFile);

    try {
      const result = await saveCustomer(formData); 
      if (result.success && result.id) {
        toast({ title: "¡Cliente Guardado!", description: `El cliente "${name.trim() || companyName.trim()}" ha sido guardado.` });
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
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="font-headline">Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div><Label htmlFor="customer-name">Nombre Completo *</Label><Input id="customer-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Ana García Pérez" required/></div>
              <div><Label htmlFor="company-name">Empresa (Opcional)</Label><Input id="company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div><Label htmlFor="customer-email">Email</Label><Input id="customer-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cliente@ejemplo.com" /></div>
              <div><Label htmlFor="customer-phone">Teléfono</Label><Input id="customer-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div><Label htmlFor="customer-taxid">Cédula / RUT</Label><Input id="customer-taxid" value={taxId} onChange={(e) => setTaxId(e.target.value)} /></div>
              <div><Label htmlFor="street">Calle y Número</Label><Input id="street" value={street} onChange={(e) => setStreet(e.target.value)} /></div>
            </div>
          </CardContent>

          <Separator className="my-6" />

          <CardHeader>
            <CardTitle className="font-headline">Información de la Fiesta Contratada</CardTitle>
            <CardDescription>Estos campos son obligatorios para el cliente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="party-date">Fecha de la Fiesta *</Label>
                  <DatePickerDemo selectedDate={partyDate} onDateChange={setPartyDate} />
                </div>
                <div>
                  <Label htmlFor="party-time">Horario del Evento *</Label>
                  <Input id="party-time" value={partyTime} onChange={(e) => setPartyTime(e.target.value)} placeholder="Ej: 19:00 - 02:00" required />
                </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="party-type">Tipo de Fiesta *</Label>
                  <Input id="party-type" value={partyType} onChange={(e) => setPartyType(e.target.value)} placeholder="Ej: Boda, Cumpleaños de 15" required />
                </div>
                <div>
                  <Label htmlFor="guest-count">Cantidad de Invitados *</Label>
                  <Input id="guest-count" type="number" value={guestCount} onChange={(e) => setGuestCount(e.target.value)} placeholder="Ej: 100" min="1" required/>
                </div>
            </div>
             <div>
                <Label htmlFor="venue-name">Salón de Fiestas / Lugar *</Label>
                <Input id="venue-name" value={venueName} onChange={(e) => setVenueName(e.target.value)} placeholder="Ej: Salón El Paraíso" required/>
             </div>
             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <Label htmlFor="budget-file" className="flex items-center gap-1"><FileText className="w-4 h-4 text-muted-foreground"/>Presupuesto (PDF) *</Label>
                    <Input id="budget-file" type="file" accept="application/pdf" onChange={(e) => setBudgetFile(e.target.files?.[0] || null)} required 
                           className="file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
                </div>
                <div>
                    <Label htmlFor="contract-file" className="flex items-center gap-1"><FileText className="w-4 h-4 text-muted-foreground"/>Contrato (PDF) *</Label>
                    <Input id="contract-file" type="file" accept="application/pdf" onChange={(e) => setContractFile(e.target.files?.[0] || null)} required 
                           className="file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
                </div>
             </div>
          </CardContent>

          <CardFooter className="border-t pt-6 mt-6">
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
