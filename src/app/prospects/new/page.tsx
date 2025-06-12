
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [phone, setPhone] = useState('');
  const [tipoFiesta, setTipoFiesta] = useState('');
  const [salonDeseado, setSalonDeseado] = useState('');
  const [cantidadInvitados, setCantidadInvitados] = useState<number | ''>('');


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Nombre Requerido", description: "Por favor, ingresa el nombre del prospecto.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const prospectData: Pick<NewProspectoData, 'name' | 'phone'> & Partial<Omit<NewProspectoData, 'name' | 'phone'>> = {
      name: name.trim(),
      phone: phone.trim() || undefined,
      tipoFiesta: tipoFiesta.trim() || undefined,
      salonDeseado: salonDeseado.trim() || undefined,
      cantidadInvitados: cantidadInvitados === '' ? undefined : Number(cantidadInvitados),
      // salesFunnelStage se establecerá por defecto a 'Lead' en la acción saveProspect si no se provee
    };

    try {
      const result = await saveProspect(prospectData as NewProspectoData); // Cast a NewProspectoData
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
          <CardDescription>Completa los datos del nuevo prospecto.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre Completo *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipoFiesta">Tipo de Fiesta (Opcional)</Label>
                <Input id="tipoFiesta" value={tipoFiesta} onChange={(e) => setTipoFiesta(e.target.value)} placeholder="Ej: Boda, Cumpleaños de 15"/>
              </div>
              <div>
                <Label htmlFor="salonDeseado">Salón Deseado (Opcional)</Label>
                <Input id="salonDeseado" value={salonDeseado} onChange={(e) => setSalonDeseado(e.target.value)} placeholder="Ej: Salón Paraíso, Finca Los Robles"/>
              </div>
            </div>
            <div>
              <Label htmlFor="cantidadInvitados">Cantidad de Invitados (Opcional)</Label>
              <Input 
                id="cantidadInvitados" 
                type="number" 
                value={cantidadInvitados} 
                onChange={(e) => setCantidadInvitados(e.target.value === '' ? '' : Number(e.target.value))} 
                min="1"
                placeholder="Ej: 100"
              />
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
