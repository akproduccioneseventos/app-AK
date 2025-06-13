
// DEBUG-EMBUDO-V7 - Edit Prospect Page (ahora Ventas)
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Edit3, AlertTriangle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getProspectById, saveProspect, deleteProspect as deleteProspectAction } from '@/app/actions/prospects';
import type { Prospecto, ProspectSalesFunnelStage } from '@/types/prospect';
import { ALL_PROSPECT_STAGES } from '@/types/prospect';
import { DatePickerDemo } from '@/components/date-picker-demo';
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

export default function EditProspectoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [prospect, setProspect] = useState<Prospecto | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState<string | undefined>(undefined);
  const [email, setEmail] = useState<string | undefined>(undefined);
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState<string | undefined>(undefined);
  const [salesFunnelStage, setSalesFunnelStage] = useState<ProspectSalesFunnelStage>('Consulto');
  const [tipoFiesta, setTipoFiesta] = useState('');
  const [salonDeseado, setSalonDeseado] = useState('');
  const [cantidadInvitados, setCantidadInvitados] = useState<number | ''>('');
  const [nextMeetingDate, setNextMeetingDate] = useState<Date | undefined>(undefined);
  const [estimatedValue, setEstimatedValue] = useState<number | ''>('');
  const [notes, setNotes] = useState<string | undefined>(undefined);
  const [contractNotes, setContractNotes] = useState<string | undefined>(undefined);
  
  // Fields to preserve from original prospect
  const [taxId, setTaxId] = useState<string | undefined>(undefined);
  const [address, setAddress] = useState<Prospecto['address']>(undefined);
  const [createdAt, setCreatedAt] = useState<string>('');


  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const loadProspectData = useCallback(async () => {
    setIsLoading(true);
    setNotFound(false);
    try {
      const loadedProspecto = await getProspectById(params.id);
      if (loadedProspecto) {
        setProspect(loadedProspecto);
        setName(loadedProspecto.name || '');
        setCompanyName(loadedProspecto.companyName);
        setEmail(loadedProspecto.email);
        setPhone(loadedProspecto.phone || '');
        setSource(loadedProspecto.source);
        setSalesFunnelStage(loadedProspecto.salesFunnelStage || 'Consulto');
        setTipoFiesta(loadedProspecto.tipoFiesta || '');
        setSalonDeseado(loadedProspecto.salonDeseado || '');
        setCantidadInvitados(loadedProspecto.cantidadInvitados === undefined ? '' : loadedProspecto.cantidadInvitados);
        setNextMeetingDate(loadedProspecto.nextMeetingDate ? new Date(loadedProspecto.nextMeetingDate) : undefined);
        setEstimatedValue(loadedProspecto.estimatedValue === undefined ? '' : loadedProspecto.estimatedValue);
        setNotes(loadedProspecto.notes);
        setContractNotes(loadedProspecto.contractNotes);
        
        setTaxId(loadedProspecto.taxId);
        setAddress(loadedProspecto.address);
        setCreatedAt(loadedProspecto.createdAt);

      } else {
        setNotFound(true);
        toast({ title: "Error", description: \`Prospecto con ID \${params.id} no encontrado.\`, variant: "destructive" });
      }
    } catch (error) {
      console.error("Error al cargar el prospecto:", error);
      setNotFound(true);
      toast({ title: "Error de Carga", description: "No se pudo obtener la información del prospecto.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [params.id, toast]);

  useEffect(() => {
    loadProspectData();
  }, [loadProspectData]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!prospect) return;
    if (!name.trim()) {
      toast({ title: "Nombre Requerido", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const prospectDataToSave: Prospecto = {
      id: prospect.id,
      name: name.trim(),
      companyName: companyName?.trim() || undefined,
      email: email?.trim() || undefined,
      phone: phone.trim() || undefined,
      source: source?.trim() || undefined,
      salesFunnelStage,
      tipoFiesta: tipoFiesta.trim() || undefined,
      salonDeseado: salonDeseado.trim() || undefined,
      cantidadInvitados: cantidadInvitados === '' ? undefined : Number(cantidadInvitados),
      nextMeetingDate: salesFunnelStage === 'Agendo Entrevista' && nextMeetingDate ? nextMeetingDate.toISOString() : undefined,
      estimatedValue: estimatedValue === '' ? undefined : Number(estimatedValue),
      notes: notes?.trim() || undefined,
      contractNotes: contractNotes?.trim() || undefined,
      
      taxId, 
      address, 
      createdAt: prospect.createdAt,
      updatedAt: new Date().toISOString(),
    };

    try {
      const result = await saveProspect(prospectDataToSave);
      if (result.success && result.prospect) {
        toast({ title: "¡Prospecto Actualizado!", description: \`El prospecto "\${result.prospect.name}" ha sido actualizado.\` });
        
        if (result.prospect.salesFunnelStage === 'Firmo Contrato' && result.customerId) {
           toast({ title: "¡Convertido a Cliente!", description: \`Cliente ID \${result.customerId} creado/actualizado.\`});
           router.push(\`/customers\`); 
           return; 
        } else if (result.prospect.salesFunnelStage === 'Firmo Contrato'){
           toast({ title: "Conversión Parcial", description: \`Prospecto marcado como 'Firmo Contrato', pero hubo un problema al crear el cliente.\` });
        }
        
        if (result.prospect.salesFunnelStage === 'Firmo Contrato' || result.prospect.salesFunnelStage === 'No Contrato') {
            router.push('/ventas'); // Redirige a la nueva página de Ventas
        } else {
            setProspect(result.prospect); 
            // loadProspectData(); // Podría ser redundante si el estado se actualiza bien
        }
      } else {
        throw new Error(result.error || "Error desconocido al actualizar el prospecto.");
      }
    } catch (error: any) {
      toast({ title: "Error al Actualizar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!prospect) return;
    setIsDeleting(true);
    try {
      const result = await deleteProspectAction(prospect.id);
      if (result.success) {
        toast({ title: '¡Prospecto Eliminado!', description: \`El prospecto "\${prospect.name}" ha sido eliminado.\` });
        router.push('/ventas'); // Redirige a la nueva página de Ventas
      } else {
        throw new Error(result.error || 'Error desconocido al eliminar el prospecto.');
      }
    } catch (error: any) {
      toast({ title: 'Error al Eliminar', description: error.message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (notFound) return <div className="text-center text-destructive p-4"><AlertTriangle className="mx-auto w-10 h-10 mb-2"/>Prospecto no encontrado. <Link href="/ventas" className="underline">Volver a Ventas</Link>.</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Edit3 className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Editando Prospecto (Ventas): <span className="text-primary">{prospect?.name || params.id}</span>
          </h1>
        </div>
        <Link href="/ventas" passHref> {/* Actualizado a /ventas */}
          <Button variant="outline" disabled={isSaving || isDeleting}><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Actualizar Información del Prospecto</CardTitle>
           <CardDescription>Modifica los datos y la etapa de ventas.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><Label htmlFor="name">Nombre Completo *</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} required disabled={isSaving || isDeleting}/></div>
                <div><Label htmlFor="companyName">Empresa (Opcional)</Label><Input id="companyName" value={companyName || ''} onChange={(e) => setCompanyName(e.target.value)} disabled={isSaving || isDeleting}/></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><Label htmlFor="email">Email (Opcional)</Label><Input id="email" type="email" value={email || ''} onChange={(e) => setEmail(e.target.value)} disabled={isSaving || isDeleting}/></div>
                <div><Label htmlFor="phone">Teléfono (Opcional)</Label><Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isSaving || isDeleting}/></div>
            </div>
            <div>
              <Label htmlFor="source">Fuente del Prospecto (Opcional)</Label>
              <Input id="source" value={source || ''} onChange={(e) => setSource(e.target.value)} placeholder="Ej: Referido, Web" disabled={isSaving || isDeleting}/>
            </div>

            <h3 className="text-md font-semibold pt-4 border-t">Detalles del Evento de Interés</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><Label htmlFor="tipoFiesta">Tipo de Fiesta (Opcional)</Label><Input id="tipoFiesta" value={tipoFiesta} onChange={(e) => setTipoFiesta(e.target.value)} placeholder="Ej: Boda" disabled={isSaving || isDeleting}/></div>
                <div><Label htmlFor="salonDeseado">Salón Deseado (Opcional)</Label><Input id="salonDeseado" value={salonDeseado} onChange={(e) => setSalonDeseado(e.target.value)} placeholder="Ej: Salón Paraíso" disabled={isSaving || isDeleting}/></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><Label htmlFor="cantidadInvitados">Cantidad de Invitados (Opcional)</Label><Input id="cantidadInvitados" type="number" value={cantidadInvitados} onChange={(e) => setCantidadInvitados(e.target.value === '' ? '' : Number(e.target.value))} min="1" placeholder="Ej: 100" disabled={isSaving || isDeleting}/></div>
                <div><Label htmlFor="estimatedValue">Valor Estimado (ARS - Opcional)</Label><Input id="estimatedValue" type="number" value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value === '' ? '' : Number(e.target.value))} min="0" step="any" placeholder="Ej: 150000" disabled={isSaving || isDeleting}/></div>
            </div>
            
            <h3 className="text-md font-semibold pt-4 border-t">Etapa y Notas</h3>
            <div>
              <Label htmlFor="salesFunnelStage">Etapa de Ventas</Label>
              <Select value={salesFunnelStage} onValueChange={(value) => setSalesFunnelStage(value as ProspectSalesFunnelStage)} disabled={isSaving || isDeleting}>
                <SelectTrigger id="salesFunnelStage"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_PROSPECT_STAGES.map(stage => (
                    <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {salesFunnelStage === 'Agendo Entrevista' && (
              <div>
                <Label htmlFor="nextMeetingDate">Fecha Próxima Reunión</Label>
                <DatePickerDemo selectedDate={nextMeetingDate} onDateChange={setNextMeetingDate} />
              </div>
            )}
            <div>
              <Label htmlFor="notes">Notas Generales (Opcional)</Label>
              <Textarea id="notes" value={notes || ''} onChange={(e) => setNotes(e.target.value)} rows={3} disabled={isSaving || isDeleting}/>
            </div>
            <div>
              <Label htmlFor="contractNotes">Notas del Contrato (Visible si aplica)</Label>
              <Textarea id="contractNotes" value={contractNotes || ''} onChange={(e) => setContractNotes(e.target.value)} rows={3} disabled={isSaving || isDeleting} placeholder="Detalles del contrato, si firmó..."/>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving || isDeleting}>
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  type="button" 
                  className="w-full sm:w-auto" 
                  disabled={isSaving || isDeleting || prospect?.salesFunnelStage === 'Firmo Contrato'}
                  title={prospect?.salesFunnelStage === 'Firmo Contrato' ? "No se puede eliminar un prospecto que ya firmó contrato. Gestionar desde Clientes." : "Eliminar Prospecto"}
                >
                  {isDeleting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Trash2 className="w-5 h-5 mr-2" />}
                  {isDeleting ? 'Eliminando...' : 'Eliminar Prospecto'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. El prospecto "{prospect?.name}" será eliminado permanentemente.
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
