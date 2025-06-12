
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerDemo } from '@/components/date-picker-demo';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, UserPlus2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveProspect } from '@/app/actions/prospects';
import type { NewProspectoData, ProspectSalesFunnelStage } from '@/types/prospect';
import { ALL_PROSPECT_STAGES } from '@/types/prospect';

export default function NewProspectoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('');
  const [salesFunnelStage, setSalesFunnelStage] = useState<ProspectSalesFunnelStage>('Lead');
  const [nextMeetingDate, setNextMeetingDate] = useState<Date | undefined>(undefined);
  const [estimatedValue, setEstimatedValue] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [taxId, setTaxId] = useState('');
  const [addressStreet, setAddressStreet] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() && !companyName.trim()) {
      toast({ title: "Nombre Requerido", description: "Por favor, ingresa el nombre del prospecto o de la empresa.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const prospectData: NewProspectoData = {
      name: name.trim() || companyName.trim(),
      companyName: companyName.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      source: source.trim() || undefined,
      salesFunnelStage,
      nextMeetingDate: nextMeetingDate?.toISOString(),
      estimatedValue: estimatedValue ? parseFloat(estimatedValue) : undefined,
      notes: notes.trim() || undefined,
      taxId: taxId.trim() || undefined,
      address: {
        street: addressStreet.trim() || undefined,
      }
    };

    try {
      const result = await saveProspect(prospectData);
      if (result.success && result.id) {
        toast({ title: "¡Prospecto Guardado!", description: `El prospecto "${prospectData.name}" ha sido guardado.` });
        router.push('/sales-funnel');
      } else {
        throw new Error(result.error || "Error desconocido al guardar el prospecto.");
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
            Agregar Nuevo Prospecto
          </h1>
        </div>
        <Link href="/sales-funnel" passHref>
          <Button variant="outline" disabled={isSaving}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Embudo
          </Button>
        </Link>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Información del Prospecto</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label htmlFor="name">Nombre Completo</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><Label htmlFor="company-name">Empresa (Opcional)</Label><Input id="company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label htmlFor="phone">Teléfono</Label><Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label htmlFor="taxId">Cédula / RUT</Label><Input id="taxId" value={taxId} onChange={(e) => setTaxId(e.target.value)} /></div>
                <div><Label htmlFor="addressStreet">Dirección (Calle y Nro)</Label><Input id="addressStreet" value={addressStreet} onChange={(e) => setAddressStreet(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="salesFunnelStage">Etapa del Embudo</Label>
                <Select value={salesFunnelStage} onValueChange={(value) => setSalesFunnelStage(value as ProspectSalesFunnelStage)}>
                  <SelectTrigger id="salesFunnelStage"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ALL_PROSPECT_STAGES.filter(s => s !== 'Contrato Firmado' && s !== 'Descartado').map(stage => ( // No permitir seleccionar Convertido/Descartado al crear
                      <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label htmlFor="source">Origen (Opcional)</Label><Input id="source" value={source} onChange={(e) => setSource(e.target.value)} placeholder="Ej: Web, Referido" /></div>
            </div>
             {salesFunnelStage === 'Reunión Programada' && (
                <div>
                    <Label htmlFor="nextMeetingDate">Fecha Próxima Reunión</Label>
                    <DatePickerDemo selectedDate={nextMeetingDate} onDateChange={setNextMeetingDate} />
                </div>
            )}
            <div>
                <Label htmlFor="estimatedValue">Valor Estimado (Opcional)</Label>
                <Input id="estimatedValue" type="number" value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} placeholder="0.00" />
            </div>
            <div>
                <Label htmlFor="notes">Notas</Label>
                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar Prospecto'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
