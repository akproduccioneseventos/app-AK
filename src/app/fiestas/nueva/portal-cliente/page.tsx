
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Loader2, KeyRound, ClipboardCopy, Share2, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, ClientPortalSettings } from '@/types/fiesta';
import { getFiestaById, updatePortalSettingsFiestaActual } from '@/app/actions/fiesta-actual';
import { Separator } from '@/components/ui/separator';
import { useSearchParams } from 'next/navigation';
import { defaultClientPortalSettings } from '@/lib/fiesta-defaults';

const portalModules: { id: keyof Omit<ClientPortalSettings, 'enabled' | 'accessKey'>, label: string }[] = [
    { id: 'checklist', label: 'Checklist de Tareas del Cliente' },
    { id: 'itinerario', label: 'Cronograma del Evento' },
    { id: 'musica', label: 'Sugerencias Musicales' },
    { id: 'videoVida', label: 'Carga de Fotos para Video' },
    { id: 'listaRegalos', label: 'Ver Lista de Regalos' },
    { id: 'documentos', label: 'Documentos' },
    { id: 'notasCliente', label: 'Notas Compartidas' },
    { id: 'invitados', label: 'Lista de Invitados y Asignación de Mesas' },
    { id: 'paginaPublica', label: 'Acceso a Página Pública' },
    { id: 'fotografiaYFilmacion', label: 'Seguimiento de Fotografía/Video' },
    { id: 'pagos', label: 'Mostrar Pagos y Saldo' },
    { id: 'simuladorInvitados', label: 'Simulador de Invitados (+/-)' },
    { id: 'calculadoraBebidas', label: 'Calculadora de Bebidas' },
    { id: 'moodboard', label: 'Moodboard / Galería de Inspiración' },
    { id: 'contrato', label: 'Resumen del Contrato' },
];

function ClientPortalConfigContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  const [portalSettings, setPortalSettings] = useState<ClientPortalSettings>(defaultClientPortalSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!fiestaId) return;
    setIsLoading(true);
    try {
      const fiestaData = await getFiestaById(fiestaId);
      if (!fiestaData) throw new Error("Fiesta no encontrada");
      setPortalSettings(fiestaData.clientPortalSettings || defaultClientPortalSettings);
    } catch (e: any) {
      toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, fiestaId]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleSavePortalSettings = async () => {
    if (!portalSettings || !fiestaId) return;
    setIsSaving(true);
    try {
      const result = await updatePortalSettingsFiestaActual(fiestaId, portalSettings);
      if (result.success) {
        toast({ title: "Configuración Guardada", description: "Los ajustes del portal del cliente se han actualizado." });
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
       toast({ title: "Error al Guardar", description: e.message, variant: "destructive" });
    } finally {
       setIsSaving(false);
    }
  };
  
  const handlePortalSwitch = (moduleId: keyof Omit<ClientPortalSettings, 'enabled' | 'accessKey'>, field: 'visible' | 'editable', value: boolean) => {
    setPortalSettings(prev => {
      if (!prev) return defaultClientPortalSettings;
      const moduleSettings = prev[moduleId] || { visible: false };
      return {
        ...prev,
        [moduleId]: { ...moduleSettings, [field]: value }
      };
    });
  };

  const portalLink = typeof window !== 'undefined' ? `${window.location.origin}/portal?fiestaId=${fiestaId}` : '';
  const publicPortalLink =
    typeof window !== 'undefined' && portalSettings.accessKey
      ? `${window.location.origin}/portal/c/${portalSettings.accessKey}`
      : '';

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(portalSettings.accessKey || '');
    toast({ title: "Contraseña del portal copiada al portapapeles" });
  };

  const handleCopyPublicLink = () => {
    navigator.clipboard.writeText(publicPortalLink);
    toast({ title: "Enlace copiado al portapapeles" });
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      `¡Hola! Aquí podés ver el portal de tu evento: ${publicPortalLink}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank', 'noopener,noreferrer');
  };


  if (isLoading) {
    return <div className="p-8 max-w-2xl mx-auto"><Loader2 className="w-8 h-8 animate-spin"/></div>
  }
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <KeyRound className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Portal del Cliente</h1>
        </div>
        <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver al Planificador</Button></Link>
      </div>

       <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2">
              Configuración del Portal
            </CardTitle>
            <CardDescription>Controla qué información puede ver y editar tu cliente en su portal privado.</CardDescription>
          </CardHeader>
           <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div>
                  <Label htmlFor="portal-enabled" className="text-base font-medium">Habilitar Portal del Cliente</Label>
                  <p className="text-sm text-muted-foreground">Permite el acceso del cliente a su portal personalizado.</p>
                </div>
                <Switch id="portal-enabled" checked={portalSettings.enabled} onCheckedChange={(val) => setPortalSettings(p => {
                  const current = p || defaultClientPortalSettings;
                  const accessKey = val && !current.accessKey
                    ? crypto.randomUUID().replace(/-/g, '').substring(0, 12)
                    : current.accessKey;
                  return { ...current, enabled: val, accessKey };
                })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="portal-password">Contraseña de Acceso del Cliente</Label>
                <div className="flex items-center gap-2">
                  <Input id="portal-password" value={portalSettings.accessKey || ''} onChange={(e) => setPortalSettings(p => ({...(p || defaultClientPortalSettings), accessKey: e.target.value}))} placeholder="Crear una contraseña segura..." />
                  <Button type="button" size="icon" variant="outline" onClick={handleCopyPassword} disabled={!portalSettings.accessKey}><ClipboardCopy className="w-4 h-4"/></Button>
                </div>
                {portalSettings.enabled && (
                  <p className="text-xs text-muted-foreground">Comparte esta contraseña con tu cliente para que pueda acceder a su portal en: <a href={portalLink} target="_blank" rel="noopener noreferrer" className="underline">{portalLink}</a></p>
                )}
              </div>
              {portalSettings.enabled && (
                <div className="space-y-4 animate-in fade-in-20">
                  <div className="space-y-2">
                    <Label>Enlace para compartir con el cliente</Label>
                    <div className="flex items-center gap-2">
                      <Input value={portalLink} readOnly/>
                      <Button type="button" size="icon" variant="outline" onClick={() => { navigator.clipboard.writeText(portalLink); toast({title: "Enlace copiado"}); }}><ClipboardCopy className="w-4 h-4"/></Button>
                    </div>
                  </div>
                  {publicPortalLink && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Share2 className="w-4 h-4 text-primary" />
                          <h4 className="text-sm font-semibold">Compartir Portal Público</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Este enlace lleva directamente al portal de tu cliente sin necesidad de contraseña. Compártelo con seguridad.
                        </p>
                        <div className="flex items-center gap-2">
                          <Input value={publicPortalLink} readOnly className="text-xs" />
                          <Button type="button" size="icon" variant="outline" onClick={handleCopyPublicLink}>
                            <ClipboardCopy className="w-4 h-4" />
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white"
                          onClick={handleShareWhatsApp}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Enviar por WhatsApp
                        </Button>
                      </div>
                    </>
                  )}
                  <Separator/>
                   <h4 className="text-md font-medium pt-2">Módulos Visibles para el Cliente</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {portalModules.map(mod => (
                            <div key={mod.id} className="flex items-center space-x-2 p-3 border rounded-md">
                                <Switch 
                                    id={`switch-${mod.id}`}
                                    checked={!!(portalSettings[mod.id as keyof typeof portalSettings] as { visible?: boolean })?.visible}
                                    onCheckedChange={(v) => handlePortalSwitch(mod.id, 'visible', v)}
                                />
                                <Label htmlFor={`switch-${mod.id}`}>{mod.label}</Label>
                            </div>
                        ))}
                   </div>
                </div>
              )}
           </CardContent>
          <CardFooter>
            <Button onClick={handleSavePortalSettings} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>} Guardar Configuración del Portal
            </Button>
          </CardFooter>
        </Card>
    </div>
  );
}

export default function ClientPortalPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
            <ClientPortalConfigContent />
        </Suspense>
    )
}
