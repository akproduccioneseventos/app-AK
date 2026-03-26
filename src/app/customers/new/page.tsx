
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, UserPlus2, CalendarDays, FileText, Info, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveCustomer } from '@/app/actions/customers';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { Separator } from '@/components/ui/separator';
import type { TipoEvento } from '@/types/presupuesto';
import { ALL_TIPOS_EVENTO } from '@/types/presupuesto';


export default function NewCustomerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [customerCompanyName, setCustomerCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [taxId, setTaxId] = useState('');
  
  // Party-related fields
  const [partyDate, setPartyDate] = useState<Date | undefined>(undefined);
  const [partyTime, setPartyTime] = useState(''); // Campo de texto simple para horario
  const [selectedPartyType, setSelectedPartyType] = useState<TipoEvento | string>('');
  const [customPartyType, setCustomPartyType] = useState('');
  const [corporateEventCompanyName, setCorporateEventCompanyName] = useState('');

  const [guestCount, setGuestCount] = useState<string>('');
  const [partyForWhom, setPartyForWhom] = useState(''); // Nuevo campo
  const [venueName, setVenueName] = useState('');
  
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [budgetFile, setBudgetFile] = useState<File | null>(null);
  const [salonContractFile, setSalonContractFile] = useState<File | null>(null);

  const handlePartyTypeChange = (value: string) => {
    if (value === "Otro") {
      setSelectedPartyType("Otro"); 
      setCustomPartyType(''); 
    } else {
      setSelectedPartyType(value as TipoEvento);
      setCustomPartyType(''); 
    }
    if (value !== 'Evento corporativo') {
      setCorporateEventCompanyName(''); 
    }
  };
  

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    
    const formData = new FormData();
    if (name.trim()) formData.append('name', name.trim());
    else if (customerCompanyName.trim()) formData.append('name', customerCompanyName.trim());

    if (selectedPartyType === 'Evento corporativo' && corporateEventCompanyName.trim()) {
        formData.append('companyName', corporateEventCompanyName.trim());
    } else if (customerCompanyName.trim()) {
        formData.append('companyName', customerCompanyName.trim());
    }

    if (address.trim()) formData.append('address', address.trim());
    if (phone.trim()) formData.append('phone', phone.trim());
    if (taxId.trim()) formData.append('taxId', taxId.trim());

    if (partyDate) formData.append('partyDate', partyDate.toISOString());
    if (partyTime.trim()) formData.append('partyTime', partyTime.trim());
    
    const finalPartyType = selectedPartyType === "Otro" ? customPartyType.trim() : selectedPartyType.trim();
    if (finalPartyType) formData.append('partyType', finalPartyType);

    if (guestCount.trim()) formData.append('guestCount', guestCount.trim());
    if (partyForWhom.trim()) formData.append('partyForWhom', partyForWhom.trim());
    if (venueName.trim()) formData.append('venueName', venueName.trim());

    if (contractFile) formData.append('contract', contractFile);
    if (budgetFile) formData.append('budget', budgetFile);
    if (salonContractFile) formData.append('salonContract', salonContractFile);


    try {
      const result = await saveCustomer(formData); 
      if (result.success && result.id) {
        toast({ title: "¡Cliente Guardado!", description: `El cliente "${name.trim() || customerCompanyName.trim() || 'Cliente sin nombre'}" ha sido guardado.` });
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
        <Link href="/customers">
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
            <CardDescription>Completa la información que tengas disponible. Puedes editarla más tarde.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div><Label htmlFor="customer-name">Nombre Completo</Label><Input id="customer-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Ana García Pérez" /></div>
              <div><Label htmlFor="customer-company-name">Empresa</Label><Input id="customer-company-name" value={customerCompanyName} onChange={(e) => setCustomerCompanyName(e.target.value)} /></div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="customer-address" className="flex items-center gap-1"><MapPin className="w-4 h-4"/> Domicilio</Label>
                <Input id="customer-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Calle y número de casa" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div><Label htmlFor="customer-phone">Teléfono</Label><Input id="customer-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              <div><Label htmlFor="customer-taxid">Cédula / RUT</Label><Input id="customer-taxid" value={taxId} onChange={(e) => setTaxId(e.target.value)} /></div>
            </div>
          </CardContent>

          <Separator className="my-6" />

          <CardHeader>
            <CardTitle className="font-headline">Información de la Fiesta Contratada (Opcional)</CardTitle>
            <CardDescription>Estos campos se pueden completar ahora o más tarde.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="party-date">Fecha de la Fiesta</Label>
                  <DatePickerDemo selectedDate={partyDate} onDateChange={setPartyDate} />
                </div>
                <div>
                  <Label htmlFor="party-time">Horario del Evento</Label>
                  <Input id="party-time" type="text" value={partyTime} onChange={(e) => setPartyTime(e.target.value)} placeholder="Ej: 19:00 - 02:00" />
                </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="party-type-select">Tipo de Fiesta</Label>
                   <Select 
                    value={selectedPartyType}
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
                  {selectedPartyType === 'Otro' && (
                     <Input 
                        id="party-type-otro" 
                        placeholder="Especificá el tipo de fiesta" 
                        value={customPartyType}
                        onChange={(e) => setCustomPartyType(e.target.value)}
                        className="text-base p-3 mt-2"
                    />
                  )}
                </div>
                {selectedPartyType === 'Evento corporativo' && (
                    <div className="space-y-2">
                        <Label htmlFor="corporate-event-company-name">Nombre de la Empresa (Evento Corp.)</Label>
                        <Input 
                        id="corporate-event-company-name" 
                        value={corporateEventCompanyName} 
                        onChange={(e) => setCorporateEventCompanyName(e.target.value)} 
                        placeholder="Nombre de la empresa organizadora" 
                        />
                    </div>
                )}
                <div>
                  <Label htmlFor="guest-count">Cantidad de Invitados</Label>
                  <Input id="guest-count" type="number" value={guestCount} onChange={(e) => setGuestCount(e.target.value)} placeholder="Ej: 100" min="1"/>
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="party-for-whom">Para quién es la Fiesta</Label>
              <Input 
                id="party-for-whom" 
                value={partyForWhom} 
                onChange={(e) => setPartyForWhom(e.target.value)} 
                placeholder="Ej: “Lucía – 15 años”, “Bautismo de Thiago”, “Aniversario de Juan y Laura”"
              />
            </div>
             <div>
                <Label htmlFor="venue-name">Salón de Fiestas / Lugar</Label>
                <Input id="venue-name" value={venueName} onChange={(e) => setVenueName(e.target.value)} placeholder="Ej: Salón Adeom"/>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contract-file" className="flex items-center gap-1"><FileText className="w-4 h-4"/>Contrato de Servicio (PDF)</Label>
                  <Input id="contract-file" type="file" onChange={(e) => setContractFile(e.target.files?.[0] || null)} accept="application/pdf" />
                </div>
                <div>
                  <Label htmlFor="budget-file" className="flex items-center gap-1"><FileText className="w-4 h-4"/>Presupuesto Firmado (PDF)</Label>
                  <Input id="budget-file" type="file" onChange={(e) => setBudgetFile(e.target.files?.[0] || null)} accept="application/pdf" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <Label htmlFor="salon-contract-file" className="flex items-center gap-1"><FileText className="w-4 h-4"/>Contrato del Salón (PDF)</Label>
                    <Input id="salon-contract-file" type="file" onChange={(e) => setSalonContractFile(e.target.files?.[0] || null)} accept="application/pdf" />
                </div>
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
