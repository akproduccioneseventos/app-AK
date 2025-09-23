
'use client';

import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Loader2, AlertTriangle, Globe, Lock, Share2, ClipboardCopy, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, ClientPortalSettings, ClientTarea } from '@/types/fiesta';
import { getFiestaActual, updatePortalSettingsFiestaActual } from '@/app/actions/fiesta-actual';
import { defaultClientPortalSettings } from '@/lib/fiesta-defaults';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';

type PortalModule = keyof Omit<ClientPortalSettings, 'enabled' | 'accessKey'>;

const moduleLabels: Record<PortalModule, { title: string, desc: string, edit?: boolean }> = {
    paginaPublica: { title: 'Página Pública del Evento', desc: 'Permite a los invitados ver la página principal del evento.', },
    documentos: { title: 'Documentos', desc: 'Permite al cliente ver su contrato, presupuesto y facturas.' },
    checklist: { title: 'Checklist del Cliente', desc: 'Permite al cliente ver y/o completar su lista de tareas.', edit: true },
    itinerario: { title: 'Itinerario del Evento', desc: 'Permite al cliente ver el cronograma del evento.' },
    musica: { title: 'Preferencias Musicales', desc: 'Permite al cliente ver y/o editar las canciones.', edit: true },
    videoVida: { title: 'Carga para Video de Vida', desc: 'Activa la página para que el cliente suba fotos.', edit: true },
    listaRegalos: { title: 'Lista de Regalos', desc: 'Permite al cliente ver y gestionar su lista de regalos.' },
    notasCliente: { title: 'Notas y Preferencias', desc: 'Permite al cliente ver y/o añadir notas generales.', edit: true },
    invitados: { title: 'Gestión de Invitados', desc: 'Permite al cliente ver su lista de invitados.' },
    fotografiaYFilmacion: { title: 'Fotografía y Filmación', desc: 'Permite al cliente ver el estado de la entrega del material.' },
};

export default function PortalClienteSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<ClientPortalSettings>(defaultClientPortalSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [publicPageUrl, setPublicPageUrl] = useState('');

  useEffect(() => {
    // This effect ensures window.location.origin is only accessed on the client-side
    setPublicPageUrl(`${window.location.origin}/evento/actual`);
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaActual();
      setSettings(fiestaData.clientPortalSettings || defaultClientPortalSettings);
    } catch (err: any) {
      setError("No se pudo cargar la configuración del portal.");
      toast({ title: "Error al Cargar", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleToggleModule = (module: PortalModule, field: 'visible' | 'editable', value: boolean) => {
    setSettings(prev => {
      const newSettings = {...prev};
      // @ts-ignore
      if (!newSettings[module]) newSettings[module] = { visible: false, editable: false };
       // @ts-ignore
      newSettings[module][field] = value;
      // If visibility is turned off, editable should also be turned off
      if (field === 'visible' && !value) {
        // @ts-ignore
        newSettings[module].editable = false;
      }
      return newSettings;
    });
  };
  
  const handleInputChange = (field: keyof ClientPortalSettings, value: string | boolean) => {
    setSettings(prev => ({...prev, [field]: value}));
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const result = await updatePortalSettingsFiestaActual(settings);
      if (result.success) {
        toast({ title: "¡Configuración Guardada!", description: "La configuración del portal y página pública ha sido actualizada." });
      } else {
        throw new Error(result.error || "Error al guardar");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(publicPageUrl);
    toast({ title: "Enlace Copiado", description: "El enlace se ha copiado al portapapeles." });
  };

  const handleShareWhatsApp = () => {
    const message = `¡Hola! Te comparto la página de nuestro evento: ${publicPageUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }
  if (error) {
    return <div className="py-10 text-center text-destructive"><AlertTriangle className="w-12 h-12 mx-auto mb-3" /><p className="font-semibold">{error}</p></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Página Pública y Portal del Cliente</h1>
        </div>
        <Link href="/fiestas/nueva" passHref><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
      </div>
      
       {settings.paginaPublica.visible && (
        <Card className="shadow-md bg-green-50 border-green-200">
            <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center gap-2"><LinkIcon className="text-green-600"/>Enlace a la Página Pública</CardTitle>
                <CardDescription>Usa este enlace para compartir la página con tus invitados.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex gap-2">
                    <Input value={publicPageUrl} readOnly />
                    <Button type="button" size="icon" onClick={handleCopyToClipboard}><ClipboardCopy className="w-4 h-4"/></Button>
                </div>
            </CardContent>
            <CardFooter>
                 <Button type="button" onClick={handleShareWhatsApp} className="w-full sm:w-auto bg-green-500 hover:bg-green-600">
                    <Share2 className="w-4 h-4 mr-2"/>Compartir por WhatsApp
                 </Button>
            </CardFooter>
        </Card>
      )}


      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl">Configuración General del Portal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/40">
                <Label htmlFor="portal-enabled" className="text-base font-medium">Activar Portal del Cliente</Label>
                <Switch id="portal-enabled" checked={settings.enabled} onCheckedChange={(val) => handleInputChange('enabled', val)} disabled={isSaving}/>
             </div>
             {settings.enabled && (
                <div className="space-y-2">
                    <Label htmlFor="portal-key">Contraseña de Acceso (Opcional)</Label>
                    <Input id="portal-key" type="text" value={settings.accessKey || ''} onChange={(e) => handleInputChange('accessKey', e.target.value)} placeholder="Dejar vacío para acceso libre" disabled={isSaving}/>
                    <p className="text-xs text-muted-foreground">Si estableces una contraseña, el cliente deberá ingresarla para ver su portal.</p>
                </div>
             )}
          </CardContent>
        </Card>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl">Visibilidad de Módulos</CardTitle>
            <CardDescription>Controla qué secciones pueden ver o editar tus clientes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             {(Object.keys(moduleLabels) as PortalModule[]).map(key => {
                const module = moduleLabels[key];
                const moduleState = settings[key] as { visible: boolean; editable?: boolean };
                return (
                    <div key={key} className="p-3 border rounded-md">
                        <div className="flex items-center justify-between">
                            <Label htmlFor={`visible-${key}`} className="flex flex-col space-y-1">
                                <span className="font-medium">{module.title}</span>
                                <span className="text-xs font-normal leading-snug text-muted-foreground">{module.desc}</span>
                            </Label>
                            <Switch id={`visible-${key}`} checked={moduleState?.visible || false} onCheckedChange={(val) => handleToggleModule(key, 'visible', val)} disabled={isSaving}/>
                        </div>
                        {module.edit && moduleState?.visible && (
                            <div className="flex items-center gap-2 pl-4 mt-3 pt-3 border-t">
                                <Checkbox id={`editable-${key}`} checked={moduleState?.editable || false} onCheckedChange={(val) => handleToggleModule(key, 'editable', !!val)} disabled={isSaving}/>
                                <Label htmlFor={`editable-${key}`} className="text-xs font-normal">Permitir que el cliente edite</Label>
                            </div>
                        )}
                    </div>
                )
             })}
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" disabled={isSaving} size="lg">
                {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Save className="w-5 h-5 mr-2"/>}
                {isSaving ? 'Guardando...' : 'Guardar Configuración del Portal'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
