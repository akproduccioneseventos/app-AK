
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Building, Save, Loader2, Image as ImageIconLucide, FileSignature } from 'lucide-react';
import React, { useState, type FormEvent, useEffect, useCallback, type ChangeEvent } from 'react';
import NextImage from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { getInvoiceTemplateSettings, saveInvoiceTemplateSettings, getCompanyInfo, saveCompanyInfo } from '@/app/actions/settings';
import type { InvoiceTemplateSettings, CompanyInfo } from '@/types/settings';


export default function CompanySettingsPage() {
  const { toast } = useToast();
  // Company Info State
  const [companyInfo, setCompanyInfo] = useState<Partial<CompanyInfo>>({});
  
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const [invoiceSettings, companyData] = await Promise.all([
        getInvoiceTemplateSettings(),
        getCompanyInfo()
      ]);
      setLogoUrl(invoiceSettings.logoUrl || null);
      setLogoPreview(invoiceSettings.logoUrl || null);
      setCompanyInfo(companyData);
    } catch(e) {
       toast({ title: "Error", description: "No se pudo cargar la configuración de la empresa.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);
  
  const handleInfoChange = (field: keyof CompanyInfo, value: string) => {
    setCompanyInfo(prev => ({...prev, [field]: value}));
  };
  
  const handleLogoFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setLogoPreview(dataUrl);
        setLogoUrl(dataUrl);
      };
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(null);
      setLogoUrl(null);
    }
  };

  const handleSignatureFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setCompanyInfo(prev => ({...prev, signatureUrl: dataUrl}));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleLogoUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    setLogoPreview(url || null);
    setLogoUrl(url || null);
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const settingsToSave: Partial<InvoiceTemplateSettings> = { logoUrl: logoUrl };

    try {
      const [logoResult, infoResult] = await Promise.all([
        saveInvoiceTemplateSettings(settingsToSave as InvoiceTemplateSettings),
        saveCompanyInfo(companyInfo)
      ]);

      if (!logoResult.success) throw new Error(logoResult.error || "No se pudo guardar el logo.");
      if (!infoResult.success) throw new Error(infoResult.error || "No se pudo guardar la información.");

      toast({ title: "Información Guardada", description: "Los datos de la empresa, logo y firma han sido actualizados." });
    } catch (err: any) {
       toast({ title: "Error", description: err.message || "No se pudo guardar la información.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
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
        <form onSubmit={handleSubmit}>
          <CardHeader>
              <CardTitle className="font-headline text-xl">Datos Fiscales y de Contacto</CardTitle>
              <CardDescription>Esta información se usará en tus facturas, presupuestos y otros documentos.</CardDescription>
          </CardHeader>
            <CardContent className="space-y-6">
                {/* Logo Section */}
                <div className="space-y-4">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <ImageIconLucide className="w-5 h-5 text-primary/80"/> Logotipo de la Empresa
                  </Label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-36 h-20 border rounded-md flex items-center justify-center bg-muted overflow-hidden flex-shrink-0 p-1">
                      {logoPreview ? (
                        <NextImage src={logoPreview} alt="Logo Preview" width={140} height={70} className="object-contain" data-ai-hint="company logo" onError={() => setLogoPreview(null)}/>
                      ) : <span className="text-xs text-muted-foreground">Sin logo</span>}
                    </div>
                    <div className="space-y-2 flex-grow">
                      <Label htmlFor="logo-upload" className="text-sm">Subir nuevo logo</Label>
                      <Input id="logo-upload" type="file" accept="image/png, image/jpeg" onChange={handleLogoFileChange} className="text-xs file:mr-2 file:py-1.5 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" disabled={isSaving} />
                       <p className="text-xs text-muted-foreground pt-1">O pega una URL directa:</p>
                       <Input id="logo-url" type="url" value={logoUrl || ''} onChange={handleLogoUrlChange} placeholder="https://ejemplo.com/logo.png" className="text-sm h-9" disabled={isSaving}/>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Signature Section */}
                <div className="space-y-4">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <FileSignature className="w-5 h-5 text-primary/80"/> Tu Firma Digital (Imagen)
                  </Label>
                  <CardDescription className="text-xs">Sube una imagen de tu firma (preferiblemente con fondo transparente) para que se aplique automáticamente a los contratos.</CardDescription>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-36 h-20 border rounded-md flex items-center justify-center bg-muted overflow-hidden flex-shrink-0 p-1">
                      {companyInfo.signatureUrl ? (
                        <NextImage src={companyInfo.signatureUrl} alt="Firma Preview" width={140} height={70} className="object-contain" data-ai-hint="admin signature" />
                      ) : <span className="text-xs text-muted-foreground">Sin firma</span>}
                    </div>
                    <div className="space-y-2 flex-grow">
                      <Label htmlFor="signature-upload" className="text-sm">Subir imagen de firma</Label>
                      <Input id="signature-upload" type="file" accept="image/png, image/jpeg" onChange={handleSignatureFileChange} className="text-xs file:mr-2 file:py-1.5 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" disabled={isSaving} />
                    </div>
                  </div>
                </div>

                <Separator />
            
                <div className="space-y-2"><Label htmlFor="company-name">Nombre de la Empresa</Label><Input id="company-name" value={companyInfo.companyName || ''} onChange={(e) => handleInfoChange('companyName', e.target.value)} placeholder="Tu Nombre Comercial" disabled={isSaving}/></div>
                <div className="space-y-2"><Label htmlFor="company-taxid">RUT / NIF / Identificación Fiscal</Label><Input id="company-taxid" value={companyInfo.companyTaxId || ''} onChange={(e) => handleInfoChange('companyTaxId', e.target.value)} placeholder="Número de Identificación Fiscal" disabled={isSaving}/></div>
                <div className="space-y-2"><Label htmlFor="company-address">Dirección Fiscal</Label><Textarea id="company-address" value={companyInfo.companyAddress || ''} onChange={(e) => handleInfoChange('companyAddress', e.target.value)} placeholder="Calle, Número, Ciudad, País" rows={2} disabled={isSaving}/></div>
                <div className="space-y-2"><Label htmlFor="company-contact">Email de Contacto (para documentos)</Label><Input id="company-contact" type="email" value={companyInfo.companyContact || ''} onChange={(e) => handleInfoChange('companyContact', e.target.value)} placeholder="facturacion@tuempresa.com" disabled={isSaving}/></div>
                 <div className="space-y-2"><Label htmlFor="default-document-notes">Notas por Defecto (Presupuestos/General)</Label><Textarea id="default-document-notes" value={companyInfo.defaultDocumentNotes || ''} onChange={(e) => handleInfoChange('defaultDocumentNotes', e.target.value)} placeholder="Ej: Términos y condiciones, información de pago general." rows={3} disabled={isSaving}/></div>
                <Separator />
                <div className="space-y-2"><Label htmlFor="invoice-custom-footer" className="text-base font-medium">Pie de Página Personalizado para Facturas</Label><Textarea id="invoice-custom-footer" value={companyInfo.invoiceCustomFooter || ''} onChange={(e) => handleInfoChange('invoiceCustomFooter', e.target.value)} placeholder="Ej: Datos bancarios para transferencias, agradecimiento especial, condiciones de pago específicas para facturas." rows={3} disabled={isSaving} className="text-sm"/></div>
            </CardContent>
            <CardFooter className="border-t pt-6">
                 <Button type="submit" disabled={isSaving || isLoading}>
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
                    {isSaving ? "Guardando..." : "Guardar Información"}
                </Button>
            </CardFooter>
        </form>
      </Card>
    </div>
  );
}
