
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Building, Save, Loader2, Link as LinkIcon, Unlink, LogIn, MessageSquare, BadgeHelp, ClipboardCopy } from 'lucide-react';
import React, { useState, type FormEvent, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Facebook, Instagram, Music } from 'lucide-react';
import type { SocialConnection, SocialPlatformName } from '@/types/settings';
import { getSocialConnections, connectSocialPlatform, disconnectSocialPlatform, saveWhatsAppNumber } from '@/app/actions/social-connections';
import { getFiestaActual } from '@/app/actions/fiesta-actual';


// Placeholder function for future save logic
async function saveCompanyInfo(info: any) {
  console.log("Simulating save for company info:", info);
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
  // In a real app, this would return success/failure based on the API call
  return { success: true, data: info };
}


const platformDetails: Record<SocialPlatformName, { icon: React.ElementType, colorClass: string }> = {
  'Facebook': { icon: Facebook, colorClass: 'text-blue-600' },
  'Instagram': { icon: Instagram, colorClass: 'text-pink-500' },
  'TikTok': { icon: Music, colorClass: 'text-black dark:text-white' },
  'WhatsApp': { icon: MessageSquare, colorClass: 'text-green-500' },
};


export default function CompanySettingsPage() {
  const { toast } = useToast();
  // Company Info State
  const [companyName, setCompanyName] = useState("AK Producciones");
  const [companyAddress, setCompanyAddress] = useState("Salto, Uruguay");
  const [companyTaxId, setCompanyTaxId] = useState("RUT Ejemplo 123456789012");
  const [companyContact, setCompanyContact] = useState("akproduccionessalto@gmail.com");
  const [defaultDocumentNotes, setDefaultDocumentNotes] = useState("El presupuesto es válido por 30 días. Para asegurar el presupuesto debe abonar el 20% del total como seña.");
  const [invoiceCustomFooter, setInvoiceCustomFooter] = useState("Información de pago: Banco X, Cuenta Y, Titular Z.\nConsulte por otros métodos de pago.");
  
  // Social Connections State
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);
  const [processingPlatform, setProcessingPlatform] = useState<SocialPlatformName | null>(null);
  const [whatsAppNumber, setWhatsAppNumber] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  
  // Feedback Link state
  const [feedbackLink, setFeedbackLink] = useState('');

  const loadInitialData = useCallback(async () => {
    setIsLoadingConnections(true);
    try {
      const [socialConnections, fiestaActual] = await Promise.all([
        getSocialConnections(),
        getFiestaActual()
      ]);
      setConnections(socialConnections);
      const waConnection = socialConnections.find(c => c.platform === 'WhatsApp');
      setWhatsAppNumber(waConnection?.phoneNumber || '');
      if (typeof window !== 'undefined' && fiestaActual) {
        setFeedbackLink(`${window.location.origin}/feedback/${fiestaActual.id}`);
      }
    } catch (err: any) {
      toast({ title: "Error", description: "No se pudieron cargar los datos iniciales.", variant: "destructive" });
    } finally {
      setIsLoadingConnections(false);
    }
  }, [toast]);

  useEffect(() => {
    // TODO: Fetch company settings from backend when available
    loadInitialData();
  }, [loadInitialData]);
  
  const handleConnect = async (platform: SocialPlatformName) => {
    setProcessingPlatform(platform);
    toast({title: `Simulando conexión con ${platform}...`, description: "En una app real, se abriría una ventana de inicio de sesión."});
    await new Promise(resolve => setTimeout(resolve, 2000));
    const result = await connectSocialPlatform(platform);
    if(result.success) {
        toast({title: "¡Conexión Exitosa!", description: `Se ha vinculado la cuenta de ${platform}.`});
        await loadInitialData();
    } else {
        toast({title: "Error de Conexión", description: result.error, variant: "destructive"});
    }
    setProcessingPlatform(null);
  };
  
  const handleDisconnect = async (platform: SocialPlatformName) => {
    setProcessingPlatform(platform);
    const result = await disconnectSocialPlatform(platform);
    if(result.success) {
        toast({title: "Cuenta Desconectada", description: `Se ha desvinculado la cuenta de ${platform}.`, variant: "destructive"});
        await loadInitialData();
    } else {
        toast({title: "Error", description: result.error, variant: "destructive"});
    }
    setProcessingPlatform(null);
  };

  const handleSaveWhatsApp = async () => {
    setProcessingPlatform('WhatsApp');
    const result = await saveWhatsAppNumber(whatsAppNumber);
    if(result.success) {
        toast({title: "Número de WhatsApp Guardado"});
        await loadInitialData();
    } else {
        toast({title: "Error", description: result.error, variant: "destructive"});
    }
    setProcessingPlatform(null);
  };
  
  const getConnectionForPlatform = (platform: SocialPlatformName) => connections.find(c => c.platform === platform);


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const companyInfo = { companyName, companyAddress, companyTaxId, companyContact, defaultDocumentNotes, invoiceCustomFooter };
    const result = await saveCompanyInfo(companyInfo);
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
            Información de la Empresa y Redes
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
                <div className="space-y-2"><Label htmlFor="company-name">Nombre de la Empresa</Label><Input id="company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Tu Nombre Comercial" disabled={isSaving}/></div>
                <div className="space-y-2"><Label htmlFor="company-taxid">RUT / NIF / Identificación Fiscal</Label><Input id="company-taxid" value={companyTaxId} onChange={(e) => setCompanyTaxId(e.target.value)} placeholder="Número de Identificación Fiscal" disabled={isSaving}/></div>
                <div className="space-y-2"><Label htmlFor="company-address">Dirección Fiscal</Label><Textarea id="company-address" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} placeholder="Calle, Número, Ciudad, País" rows={2} disabled={isSaving}/></div>
                <div className="space-y-2"><Label htmlFor="company-contact">Email de Contacto (para documentos)</Label><Input id="company-contact" type="email" value={companyContact} onChange={(e) => setCompanyContact(e.target.value)} placeholder="facturacion@tuempresa.com" disabled={isSaving}/></div>
                 <div className="space-y-2"><Label htmlFor="default-document-notes">Notas por Defecto (Presupuestos/General)</Label><Textarea id="default-document-notes" value={defaultDocumentNotes} onChange={(e) => setDefaultDocumentNotes(e.target.value)} placeholder="Ej: Términos y condiciones, información de pago general." rows={3} disabled={isSaving}/></div>
                <Separator />
                <div className="space-y-2"><Label htmlFor="invoice-custom-footer" className="text-base font-medium">Pie de Página Personalizado para Facturas</Label><Textarea id="invoice-custom-footer" value={invoiceCustomFooter} onChange={(e) => setInvoiceCustomFooter(e.target.value)} placeholder="Ej: Datos bancarios para transferencias, agradecimiento especial, condiciones de pago específicas para facturas." rows={3} disabled={isSaving} className="text-sm"/></div>
            </CardContent>
            <CardFooter className="border-t pt-6">
                 <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
                    {isSaving ? "Guardando..." : "Guardar Información"}
                </Button>
            </CardFooter>
        </form>
      </Card>
      
      <Separator />

      <Card className="shadow-lg">
          <CardHeader>
              <CardTitle className="font-headline text-xl">Vínculos de Comunicación</CardTitle>
              <CardDescription>Conecta tus redes sociales y obtén el enlace para la encuesta de satisfacción del cliente.</CardDescription>
          </CardHeader>
           <CardContent className="space-y-6">
             <div className="p-3 border rounded-md bg-muted/30">
                <Label htmlFor="feedback-link" className="text-base font-medium flex items-center gap-2 mb-2"><BadgeHelp className="w-5 h-5 text-primary"/>Enlace de Encuesta Post-Evento</Label>
                <p className="text-xs text-muted-foreground mb-2">Envía este enlace a tu cliente después del evento para recolectar su feedback. El enlace corresponde a la fiesta actualmente en planificación.</p>
                <div className="flex gap-2">
                    <Input id="feedback-link" value={feedbackLink} readOnly/>
                    <Button variant="secondary" size="icon" onClick={() => {navigator.clipboard.writeText(feedbackLink); toast({title:"Enlace copiado!"});}} disabled={!feedbackLink}><ClipboardCopy className="w-4 h-4"/></Button>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(['Facebook', 'Instagram', 'TikTok'] as SocialPlatformName[]).map(platform => {
                    const { icon: Icon, colorClass } = platformDetails[platform];
                    const connection = getConnectionForPlatform(platform);
                    const isConnected = connection?.isConnected;
                    return (
                       <Card key={platform} className="p-4 flex flex-col justify-between">
                         <div className="flex items-center gap-3">
                           <Icon className={`w-8 h-8 ${colorClass}`}/>
                           <div><p className="font-semibold">{platform}</p><p className="text-xs text-muted-foreground">{isConnected ? `Conectado como ${connection.username}` : 'No conectado'}</p></div>
                         </div>
                          <Button variant={isConnected ? 'destructive' : 'default'} className="w-full mt-3" onClick={() => isConnected ? handleDisconnect(platform) : handleConnect(platform)} disabled={processingPlatform === platform}>
                            {processingPlatform === platform ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : isConnected ? <Unlink className="w-4 h-4 mr-2"/> : <LogIn className="w-4 h-4 mr-2"/>}
                            {isConnected ? 'Desconectar' : 'Conectar'}
                          </Button>
                       </Card>
                    );
                  })}
                  <Card className="p-4 flex flex-col justify-between md:col-span-2">
                      <div className="flex items-center gap-3 mb-2">
                        <MessageSquare className="w-8 h-8 text-green-500"/>
                        <div><p className="font-semibold">WhatsApp</p><p className="text-xs text-muted-foreground">{getConnectionForPlatform('WhatsApp')?.isConnected ? `Número: ${whatsAppNumber}` : 'Vincula tu número para compartir.'}</p></div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp-number" className="sr-only">Número de WhatsApp</Label>
                        <Input id="whatsapp-number" placeholder="Ej: 59899123456" value={whatsAppNumber} onChange={(e) => setWhatsAppNumber(e.target.value)} disabled={processingPlatform === 'WhatsApp'}/>
                         <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleSaveWhatsApp} disabled={processingPlatform === 'WhatsApp' || !whatsAppNumber.trim()}>
                           {processingPlatform === 'WhatsApp' ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <LinkIcon className="w-4 h-4 mr-2"/>}
                           {getConnectionForPlatform('WhatsApp')?.isConnected ? 'Actualizar Número' : 'Guardar Número'}
                         </Button>
                      </div>
                  </Card>
                </div>
           </CardContent>
       </Card>
    </div>
  );
}
