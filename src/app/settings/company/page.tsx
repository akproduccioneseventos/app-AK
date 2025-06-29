
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Building, Save, Loader2 } from 'lucide-react';
import React, { useState, type FormEvent } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

// Placeholder function for future save logic
async function saveCompanyInfo(info: any) {
  console.log("Simulating save for company info:", info);
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
  // In a real app, this would return success/failure based on the API call
  return { success: true, data: info };
}

export default function CompanySettingsPage() {
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState("AK Producciones"); // Default or fetched
  const [companyAddress, setCompanyAddress] = useState("Salto, Uruguay"); // Default or fetched
  const [companyTaxId, setCompanyTaxId] = useState("RUT Ejemplo 123456789012"); // Default or fetched
  const [companyContact, setCompanyContact] = useState("akproduccionessalto@gmail.com"); // Default or fetched
  const [defaultDocumentNotes, setDefaultDocumentNotes] = useState("El presupuesto es válido por 30 días. Para asegurar el presupuesto debe abonar el 20% del total como seña.");
  const [invoiceCustomFooter, setInvoiceCustomFooter] = useState("Información de pago: Banco X, Cuenta Y, Titular Z.\nConsulte por otros métodos de pago.");
  const [isSaving, setIsSaving] = useState(false);

  // TODO: useEffect to fetch company settings from backend/storage when available

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const companyInfo = {
      companyName,
      companyAddress,
      companyTaxId,
      companyContact,
      defaultDocumentNotes,
      invoiceCustomFooter, // Added new field
    };
    const result = await saveCompanyInfo(companyInfo); // Placeholder save
    if (result.success) {
      toast({ title: "Información Guardada", description: "Los datos de la empresa han sido actualizados (simulado)." });
    } else {
      toast({ title: "Error", description: "No se pudo guardar la información (simulado).", variant: "destructive" });
    }
    setIsSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <Building className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-headline">
            Información de la Empresa
            </h1>
        </div>
        <Link href="/settings" passHref>
          <Button variant="outline" disabled={isSaving}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="font-headline text-xl">Datos Fiscales y de Contacto</CardTitle>
            <CardDescription>Esta información se usará en tus facturas, presupuestos y otros documentos.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="company-name">Nombre de la Empresa</Label>
                    <Input id="company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Tu Nombre Comercial" disabled={isSaving}/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="company-taxid">RUT / NIF / Identificación Fiscal</Label>
                    <Input id="company-taxid" value={companyTaxId} onChange={(e) => setCompanyTaxId(e.target.value)} placeholder="Número de Identificación Fiscal" disabled={isSaving}/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="company-address">Dirección Fiscal</Label>
                    <Textarea id="company-address" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} placeholder="Calle, Número, Ciudad, País" rows={2} disabled={isSaving}/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="company-contact">Email de Contacto (para documentos)</Label>
                    <Input id="company-contact" type="email" value={companyContact} onChange={(e) => setCompanyContact(e.target.value)} placeholder="facturacion@tuempresa.com" disabled={isSaving}/>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="default-document-notes">Notas por Defecto (Presupuestos/General)</Label>
                    <Textarea id="default-document-notes" value={defaultDocumentNotes} onChange={(e) => setDefaultDocumentNotes(e.target.value)} placeholder="Ej: Términos y condiciones, información de pago general." rows={3} disabled={isSaving}/>
                </div>
                <Separator />
                <div className="space-y-2">
                    <Label htmlFor="invoice-custom-footer" className="text-base font-medium">Pie de Página Personalizado para Facturas</Label>
                    <Textarea 
                        id="invoice-custom-footer" 
                        value={invoiceCustomFooter} 
                        onChange={(e) => setInvoiceCustomFooter(e.target.value)} 
                        placeholder="Ej: Datos bancarios para transferencias, agradecimiento especial, condiciones de pago específicas para facturas." 
                        rows={3} 
                        disabled={isSaving}
                        className="text-sm"
                    />
                     <p className="text-xs text-muted-foreground">Este texto aparecerá al final de tus facturas generadas.</p>
                </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
                 <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
                    {isSaving ? "Guardando..." : "Guardar Información"}
                </Button>
            </CardFooter>
        </form>
      </Card>
      <p className="text-xs text-center text-muted-foreground">
        La persistencia de estos datos es simulada. En una aplicación real, se guardarían en una base de datos.
      </p>
    </div>
  );
}
