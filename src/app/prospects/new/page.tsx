
// DEBUG-EMBUDO-V7 - New Prospect Page (ahora Ventas)
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Importar Textarea
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, UserPlus2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveProspect } from '@/app/actions/prospects';
import type { NewProspectoData } from '@/types/prospect';

export default function NewProspectoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('');
  const [tipoFiesta, setTipoFiesta] = useState('');
  const [salonDeseado, setSalonDeseado] = useState('');
  const [cantidadInvitados, setCantidadInvitados] = useState<number | ''>('');
  const [estimatedValue, setEstimatedValue] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [contractNotes, setContractNotes] = useState(''); // Nuevo campo para notas de contrato


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Nombre Requerido", description: "Por favor, ingresa el nombre del prospecto.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const prospectData: NewProspectoData = {
      name: name.trim(),
      companyName: companyName.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      source: source.trim() || undefined,
      tipoFiesta: tipoFiesta.trim() || undefined,
      salonDeseado: salonDeseado.trim() || undefined,
      cantidadInvitados: cantidadInvitados === '' ? undefined : Number(cantidadInvitados),
      estimatedValue: estimatedValue === '' ? undefined : Number(estimatedValue),
      notes: notes.trim() || undefined,
      contractNotes: contractNotes.trim() || undefined, // Incluir notas de contrato
    };

    try {
      const result = await saveProspect(prospectData);
      if (result.success && result.id) {
        toast({ title: "¡Prospecto Guardado!", description: `El prospecto "${prospectData.name}" ha sido guardado.` });
        router.push('/ventas'); // Redirigir a la nueva página de Ventas
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
            Agregar Nuevo Prospecto (Ventas)
          </h1>
        </div>
        <Link href="/ventas" passHref> {/* Actualizado a /ventas */}
          <Button variant="outline" disabled={isSaving}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Ventas
          </Button>
        </Link>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Información del Prospecto</CardTitle>
          <CardDescription>Completa los datos del nuevo prospecto. Se creará en la etapa "Consulto".</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><Label htmlFor="name">Nombre Completo *</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} required disabled={isSaving}/></div>
              <div><Label htmlFor="companyName">Empresa (Opcional)</Label><Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} disabled={isSaving}/></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><Label htmlFor="email">Email (Opcional)</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSaving}/></div>
              <div><Label htmlFor="phone">Teléfono (Opcional)</Label><Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isSaving}/></div>
            </div>
            <div>
              <Label htmlFor="source">Fuente del Prospecto (Opcional)</Label>
              <Input id="source" value={source} onChange={(e) => setSource(e.target.value)} placeholder="Ej: Referido, Web, Redes Sociales" disabled={isSaving}/>
            </div>
            <h3 className="text-md font-semibold pt-2 border-t">Detalles del Evento de Interés</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><Label htmlFor="tipoFiesta">Tipo de Fiesta (Opcional)</Label><Input id="tipoFiesta" value={tipoFiesta} onChange={(e) => setTipoFiesta(e.target.value)} placeholder="Ej: Boda, Cumpleaños de 15" disabled={isSaving}/></div>
                <div><Label htmlFor="salonDeseado">Salón Deseado (Opcional)</Label><Input id="salonDeseado" value={salonDeseado} onChange={(e) => setSalonDeseado(e.target.value)} placeholder="Ej: Salón Paraíso" disabled={isSaving}/></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><Label htmlFor="cantidadInvitados">Cantidad de Invitados (Opcional)</Label><Input id="cantidadInvitados" type="number" value={cantidadInvitados} onChange={(e) => setCantidadInvitados(e.target.value === '' ? '' : Number(e.target.value))} min="1" placeholder="Ej: 100" disabled={isSaving}/></div>
              <div><Label htmlFor="estimatedValue">Valor Estimado (ARS - Opcional)</Label><Input id="estimatedValue" type="number" value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value === '' ? '' : Number(e.target.value))} min="0" step="any" placeholder="Ej: 150000" disabled={isSaving}/></div>
            </div>
             <div>
              <Label htmlFor="notes">Notas Generales (Opcional)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Cualquier información adicional relevante sobre el prospecto o sus necesidades." rows={3} disabled={isSaving}/>
            </div>
            <div>
              <Label htmlFor="contractNotes">Notas del Contrato (Opcional)</Label>
              <Textarea id="contractNotes" value={contractNotes} onChange={(e) => setContractNotes(e.target.value)} placeholder="Detalles específicos del contrato, acuerdos, etc. (No sube archivos)" rows={3} disabled={isSaving}/>
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
