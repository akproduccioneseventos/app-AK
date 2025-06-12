
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Edit3, AlertTriangle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getProspectById, saveProspect, deleteProspect as deleteProspectAction } from '@/app/actions/prospects';
import type { Prospecto, ProspectSalesFunnelStage } from '@/types/prospect';
import { ALL_PROSPECT_STAGES } from '@/types/prospect';
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
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [salesFunnelStage, setSalesFunnelStage] = useState<ProspectSalesFunnelStage>('Lead');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadProspecto() {
      setIsLoading(true);
      setNotFound(false);
      try {
        const loadedProspecto = await getProspectById(params.id);
        if (loadedProspecto) {
          setProspect(loadedProspecto);
          setName(loadedProspecto.name || '');
          setPhone(loadedProspecto.phone || '');
          setSalesFunnelStage(loadedProspecto.salesFunnelStage);
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error("Error al cargar el prospecto:", error);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }
    if (params.id) {
      loadProspecto();
    }
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!prospect) return;
    if (!name.trim()) {
      toast({ title: "Nombre Requerido", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const prospectDataToSave: Partial<Prospecto> & { id: string; name: string; salesFunnelStage: ProspectSalesFunnelStage } = {
      id: prospect.id, // Ensure ID is included for update
      name: name.trim(),
      phone: phone.trim() || undefined,
      salesFunnelStage,
      // Other fields from 'prospect' state will be preserved by the backend if not explicitly changed here
    };

    try {
      // Pass only the fields that are part of the form, plus ID.
      // The backend `saveProspect` will merge these with existing data.
      const result = await saveProspect(prospectDataToSave as Prospecto);
      if (result.success && result.prospect) {
        toast({ title: "¡Prospecto Actualizado!", description: `El prospecto "${result.prospect.name}" ha sido actualizado.` });
        if (result.prospect.salesFunnelStage === 'Contrato Firmado' && result.customerId) {
           toast({ title: "¡Convertido a Cliente!", description: `Cliente ID ${result.customerId} creado/actualizado.`, variant: "default" });
           router.push(`/customers`); 
        } else if (result.prospect.salesFunnelStage === 'Contrato Firmado'){
           toast({ title: "Conversión Parcial", description: `Prospecto marcado como contrato firmado, pero hubo un problema al crear el cliente.`, variant: "default" });
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
        toast({ title: '¡Prospecto Eliminado!', description: `El prospecto "${prospect.name}" ha sido eliminado.` });
        router.push('/sales-funnel');
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
  if (notFound) return <div className="text-center text-destructive p-4"><AlertTriangle className="mx-auto w-10 h-10 mb-2"/>Prospecto no encontrado. <Link href="/sales-funnel" className="underline">Volver al embudo</Link>.</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Edit3 className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Editando Prospecto: <span className="text-primary">{prospect?.name || params.id}</span>
          </h1>
        </div>
        <Link href="/sales-funnel" passHref>
          <Button variant="outline" disabled={isSaving || isDeleting}><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
        </Link>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Actualizar Información del Prospecto</CardTitle>
           <CardDescription>Modifica el nombre, teléfono y la etapa del embudo.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label htmlFor="name">Nombre Completo</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} required disabled={isSaving || isDeleting}/></div>
              <div><Label htmlFor="phone">Teléfono</Label><Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isSaving || isDeleting}/></div>
            </div>
            
            <div>
              <Label htmlFor="salesFunnelStage">Etapa del Embudo</Label>
              <Select value={salesFunnelStage} onValueChange={(value) => setSalesFunnelStage(value as ProspectSalesFunnelStage)} disabled={isSaving || isDeleting}>
                <SelectTrigger id="salesFunnelStage"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_PROSPECT_STAGES.map(stage => (
                    <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving || isDeleting}>
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" type="button" className="w-full sm:w-auto" disabled={isSaving || isDeleting || prospect?.salesFunnelStage === 'Contrato Firmado'}>
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
