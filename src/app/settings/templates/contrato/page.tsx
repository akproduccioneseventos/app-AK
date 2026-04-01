
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2, FileSignature, Info, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getContractTemplate, saveContractTemplate } from '@/app/actions/settings';
import { Badge } from '@/components/ui/badge';

const PLACEHOLDERS = [
    { tag: '{{CLIENTE_NOMBRE}}', desc: 'Nombre del cliente' },
    { tag: '{{CLIENTE_CI}}', desc: 'Cédula o RUT' },
    { tag: '{{CLIENTE_DIRECCION}}', desc: 'Domicilio cliente' },
    { tag: '{{CLIENTE_TELEFONO}}', desc: 'Celular cliente' },
    { tag: '{{EVENTO_FECHA}}', desc: 'Fecha de la fiesta' },
    { tag: '{{EVENTO_SALON}}', desc: 'Nombre del salón' },
    { tag: '{{PRESUPUESTO_TOTAL}}', desc: 'Monto total (con ajuste)' },
    { tag: '{{SENIA}}', desc: 'Monto de la seña / anticipo' },
    { tag: '{{FECHA_HOY}}', desc: 'Fecha actual' },
    { tag: '{{EMPRESA_NOMBRE}}', desc: 'Tu empresa' },
    { tag: '{{EMPRESA_RUT}}', desc: 'Tu RUT' },
    { tag: '{{EMPRESA_DIRECCION}}', desc: 'Tu domicilio' },
];

export default function ContractTemplateEditorPage() {
  const { toast } = useToast();
  const [template, setTemplate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadTemplate = useCallback(async () => {
    setIsLoading(true);
    try {
      const text = await getContractTemplate();
      setTemplate(text);
    } catch (e) {
      toast({ title: "Error", description: "No se pudo cargar la plantilla.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await saveContractTemplate(template);
      if (result.success) {
        toast({ title: "Plantilla Actualizada", description: "Todos los nuevos contratos usarán este texto base." });
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: "Error al Guardar", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const addPlaceholder = (tag: string) => {
      setTemplate(prev => prev + tag);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileSignature className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Plantilla Maestra de Contrato</h1>
        </div>
        <Link href="/settings/templates">
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Editor de Texto Base</CardTitle>
                    <CardDescription>Este texto se usará como punto de partida para cada nuevo contrato generado.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Textarea 
                        value={template} 
                        onChange={e => setTemplate(e.target.value)} 
                        className="min-h-[600px] font-serif text-base leading-relaxed"
                        placeholder="Escribe aquí el cuerpo del contrato..."
                    />
                </CardContent>
                <CardFooter className="border-t pt-4">
                    <Button onClick={handleSave} disabled={isSaving} className="w-full">
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
                        Guardar Plantilla Maestra
                    </Button>
                </CardFooter>
            </Card>
        </div>

        <div className="space-y-4">
            <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-2">
                    <CardTitle className="text-blue-800 text-sm flex items-center gap-2"><Info className="w-4 h-4"/> Etiquetas Dinámicas</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-blue-700 space-y-3">
                    <p>Haz clic en una etiqueta para añadirla al final del texto. El sistema las reemplazará automáticamente por los datos reales del cliente y el evento.</p>
                    <div className="flex flex-wrap gap-2">
                        {PLACEHOLDERS.map(p => (
                            <Badge 
                                key={p.tag} 
                                variant="secondary" 
                                className="cursor-pointer hover:bg-blue-200"
                                onClick={() => addPlaceholder(p.tag)}
                                title={p.desc}
                            >
                                {p.tag}
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Instrucciones</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-2">
                    <p>1. Mantén los espacios para firmas al final.</p>
                    <p>2. No borres los corchetes de las etiquetas dinámicas.</p>
                    <p>3. Los cambios que hagas aquí **no afectarán** a los contratos que ya hayas personalizado y guardado en fiestas específicas.</p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
