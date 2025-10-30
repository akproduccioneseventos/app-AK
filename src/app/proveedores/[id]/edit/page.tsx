
'use client';

import React, { useState, useEffect, useCallback, type FormEvent, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Edit3, Save, Loader2, AlertTriangle, Briefcase, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getProveedorById, saveProveedor } from '@/app/actions/proveedores';
import type { Proveedor } from '@/types/proveedor';

export default function EditProveedorPage({ params: paramsProp }: { params: { id: string } }) {
  const params = use(paramsProp);
  const router = useRouter();
  const { toast } = useToast();
  
  const [proveedor, setProveedor] = useState<Proveedor | null>(null);
  const [formData, setFormData] = useState<Partial<Proveedor>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  
  const proveedorIdFromParams = params.id;

  const loadProveedor = useCallback(async () => {
    setIsLoading(true);
    setNotFound(false);
    try {
      const loadedData = await getProveedorById(proveedorIdFromParams);
      if (loadedData) {
        setProveedor(loadedData);
        setFormData(loadedData);
      } else {
        setNotFound(true);
        toast({ title: 'Error', description: `No se encontró el proveedor.`, variant: 'destructive' });
      }
    } catch (error) {
      setNotFound(true);
      toast({ title: 'Error al Cargar', description: 'No se pudo obtener la información del proveedor.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [proveedorIdFromParams, toast]);
  
  useEffect(() => {
    if (proveedorIdFromParams) {
      loadProveedor();
    }
  }, [proveedorIdFromParams, loadProveedor]);

  const handleFormChange = (field: keyof Proveedor, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.nombreEmpresa?.trim()) {
      toast({ title: "Nombre Requerido", description: `El nombre de la ${formData.tipo === 'Proveedor' ? 'empresa' : 'servicio'} es obligatorio.`, variant: "destructive" });
      return;
    }
    if (!formData.servicioPrincipal?.trim()) {
      toast({ title: "Servicio Requerido", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const proveedorDataToSave: Proveedor = {
        ...(proveedor as Proveedor),
        ...formData,
    };

    try {
      const result = await saveProveedor(proveedorDataToSave);
      if (result.success && result.proveedor) {
        toast({ title: "¡Registro Actualizado!", description: `Los datos han sido actualizados.` });
        router.push('/proveedores');
      } else {
        throw new Error(result.error || "Error desconocido al actualizar el registro.");
      }
    } catch (error: any) {
      toast({ title: "Error al Guardar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (notFound) return <div className="text-center text-destructive p-4"><AlertTriangle className="mx-auto w-10 h-10 mb-2"/>Registro no encontrado. <Link href="/proveedores" className="underline">Volver a proveedores</Link>.</div>;

  const isServicio = formData.tipo === 'Servicio Subcontratado';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isServicio ? <Briefcase className="w-8 h-8 text-primary" /> : <Building className="w-8 h-8 text-primary" />}
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Editando: <span className="text-primary">{proveedor?.nombreEmpresa || proveedor?.nombre}</span>
          </h1>
        </div>
        <Link href="/proveedores" passHref>
          <Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
        </Link>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Actualizar Información</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label>Tipo de Registro</Label>
                <Input value={formData.tipo || ''} disabled readOnly />
            </div>
            <div className="space-y-2"><Label htmlFor="company-name">{isServicio ? 'Nombre del Servicio*' : 'Nombre de la Empresa*'}</Label><Input id="company-name" value={formData.nombreEmpresa || ''} onChange={(e) => handleFormChange('nombreEmpresa', e.target.value)} disabled={isSaving} required/></div>
            <div className="space-y-2"><Label htmlFor="proveedor-name">{isServicio ? 'Nombre del Responsable*' : 'Nombre del Contacto'}</Label><Input id="proveedor-name" value={formData.nombre || ''} onChange={(e) => handleFormChange('nombre', e.target.value)} disabled={isSaving} required={isServicio}/></div>
            <div className="space-y-2"><Label htmlFor="proveedor-servicio">{isServicio ? 'Tipo de Servicio*' : 'Categoría Principal*'}</Label><Input id="proveedor-servicio" value={formData.servicioPrincipal || ''} onChange={(e) => handleFormChange('servicioPrincipal', e.target.value)} required disabled={isSaving}/></div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="proveedor-telefono">Teléfono</Label><Input id="proveedor-telefono" type="tel" value={formData.telefono || ''} onChange={(e) => handleFormChange('telefono', e.target.value)} disabled={isSaving}/></div>
              <div className="space-y-2"><Label htmlFor="proveedor-email">Email</Label><Input id="proveedor-email" type="email" value={formData.email || ''} onChange={(e) => handleFormChange('email', e.target.value)} disabled={isSaving}/></div>
            </div>
            <div className="space-y-2"><Label htmlFor="proveedor-notas">Notas</Label><Textarea id="proveedor-notas" value={formData.notas || ''} onChange={(e) => handleFormChange('notas', e.target.value)} rows={3} disabled={isSaving}/></div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              Guardar Cambios
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
