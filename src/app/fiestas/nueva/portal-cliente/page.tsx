
'use client';

import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Loader2, AlertTriangle, Globe, Lock, Eye, Edit3, ClipboardCheck, StickyNote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, ClientPortalSettings, ClientTarea, TareaAsignadaA } from '@/types/fiesta';
import { getFiestaActual, updateClientPortalSettings, updateClientChecklist, updateClientNotes } from '@/app/actions/fiesta-actual';
import { Separator } from '@/components/ui/separator';
import { defaultClientChecklist } from '@/lib/fiesta-defaults';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

type EditablePortalSettings = Omit<ClientPortalSettings, 'enabled' | 'accessKey'>;

interface ModuleToggleProps {
  id: keyof EditablePortalSettings;
  label: string;
  settings: ClientPortalSettings;
  onSettingChange: (key: keyof ClientPortalSettings, field: 'visible' | 'editable', value: boolean) => void;
  isEditable?: boolean;
}

const ModuleToggle: React.FC<ModuleToggleProps> = ({ id, label, settings, onSettingChange, isEditable = true }) => {
  const moduleSetting = settings[id as keyof EditablePortalSettings];
  
  return (
    <div className="flex items-center justify-between p-3 border rounded-md">
      <Label htmlFor={`visible-${id}`} className="text-base font-normal">{label}</Label>
      <div className="flex items-center gap-4">
        {isEditable && 'editable' in moduleSetting && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Label htmlFor={`editable-${id}`}>Editable</Label>
            <Switch id={`editable-${id}`} checked={moduleSetting.editable} onCheckedChange={(val) => onSettingChange(id as keyof EditablePortalSettings, 'editable', val)} />
          </div>
        )}
        <div className="flex items-center gap-1.5 text-sm">
          <Label htmlFor={`visible-${id}`}>Visible</Label>
          <Switch id={`visible-${id}`} checked={moduleSetting.visible} onCheckedChange={(val) => onSettingChange(id as keyof EditablePortalSettings, 'visible', val)} />
        </div>
      </div>
    </div>
  );
};


export default function PortalClienteConfigPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<ClientPortalSettings | null>(null);
  const [clientChecklist, setClientChecklist] = useState<ClientTarea[]>([]);
  const [clientNotes, setClientNotes] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaActual();
      setSettings(fiestaData.clientPortalSettings || { enabled: false, checklist: { visible: false, editable: false }, itinerario: { visible: false }, musica: { visible: false, editable: false}, videoVida: {visible: false, editable: true}, listaRegalos: {visible: false}, documentos: {visible: true}, notasCliente: {visible: false, editable: false}, invitados: { visible: true }, paginaPublica: {visible: true}, fotografiaYFilmacion: {visible: true}});
      setClientChecklist(fiestaData.clientChecklist || defaultClientChecklist.map(t => ({...t, id: `client_task_${Date.now()}_${Math.random()}`})));
      setClientNotes(fiestaData.clientNotes || '');
    } catch (err: any) {
      setError("No se pudo cargar la configuración del portal.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSettingChange = (key: keyof ClientPortalSettings, field: 'visible' | 'editable' | 'enabled' | 'accessKey', value: boolean | string) => {
    setSettings(prev => {
      if (!prev) return null;
      if (key === 'enabled' || key === 'accessKey') {
        return { ...prev, [key]: value };
      }
      const moduleKey = key as keyof EditablePortalSettings;
      return {
        ...prev,
        [moduleKey]: {
          ...(prev[moduleKey] as any),
          [field]: value
        }
      };
    });
  };

  const handleChecklistChange = (id: string, field: 'texto' | 'completada', value: string | boolean) => {
    setClientChecklist(prev => prev.map(task => task.id === id ? {...task, [field]: value} : task));
  };
  
  const handleAddChecklistItem = () => {
    const newItem: ClientTarea = {
      id: `client_task_${Date.now()}_${Math.random()}`,
      texto: 'Nueva tarea para el cliente',
      completada: false,
      asignadaA: 'Cliente'
    };
    setClientChecklist(prev => [...prev, newItem]);
  };
  
  const handleDeleteChecklistItem = (id: string) => {
    setClientChecklist(prev => prev.filter(task => task.id !== id));
  }
  
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsSaving(true);
    try {
      // Save all three parts in parallel
      const [settingsResult, checklistResult, notesResult] = await Promise.all([
        updateClientPortalSettings(settings),
        updateClientChecklist(clientChecklist),
        updateClientNotes(clientNotes)
      ]);
      
      let allSuccess = true;
      if (!settingsResult.success) { allSuccess = false; throw new Error(settingsResult.error || "No se pudo guardar la configuración."); }
      if (!checklistResult.success) { allSuccess = false; throw new Error(checklistResult.error || "No se pudo guardar el checklist."); }
      if (!notesResult.success) { allSuccess = false; throw new Error(notesResult.error || "No se pudieron guardar las notas."); }

      if (allSuccess) {
        toast({ title: "¡Guardado!", description: "La configuración del portal y del cliente ha sido actualizada." });
        await loadData();
      }

    } catch(err: any) {
       toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }


  if (isLoading || !settings) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (error) {
    return <div className="text-center text-destructive p-4"><AlertTriangle className="mx-auto w-10 h-10 mb-2"/>{error}</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Página Pública y Portal del Cliente</h1>
        </div>
        <Link href="/fiestas/nueva" passHref><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button></Link>
      </div>

      <form onSubmit={handleSave}>
          <Card className="shadow-lg mb-6">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Configuración de Acceso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                  <Label htmlFor="portal-enabled" className="text-base font-medium">Habilitar Portal del Cliente</Label>
                  <Switch id="portal-enabled" checked={settings.enabled} onCheckedChange={(val) => handleSettingChange('enabled', 'enabled', val)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="portal-password">Contraseña de Acceso (Opcional)</Label>
                <Input id="portal-password" type="text" value={settings.accessKey || ''} onChange={(e) => handleSettingChange('accessKey', 'accessKey', e.target.value)} placeholder="Dejar en blanco para acceso libre"/>
                <p className="text-xs text-muted-foreground">Si estableces una contraseña, tu cliente deberá ingresarla para ver su portal.</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg mb-6">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Módulos Visibles para el Cliente</CardTitle>
              <CardDescription>Controla qué secciones puede ver (y editar) tu cliente en su portal.</CardDescription>
            </CardHeader>
             <CardContent className="space-y-3">
                <ModuleToggle id="paginaPublica" label="Página Pública del Evento" settings={settings} onSettingChange={handleSettingChange} isEditable={false}/>
                <ModuleToggle id="documentos" label="Documentos (Presupuesto, Facturas)" settings={settings} onSettingChange={handleSettingChange} isEditable={false}/>
                <ModuleToggle id="invitados" label="Lista de Invitados y RSVP" settings={settings} onSettingChange={handleSettingChange} isEditable={false}/>
                <ModuleToggle id="videoVida" label="Carga para Video de Vida" settings={settings} onSettingChange={handleSettingChange}/>
                <ModuleToggle id="fotografiaYFilmacion" label="Entrega de Foto y Filmación" settings={settings} onSettingChange={handleSettingChange}/>
                <ModuleToggle id="checklist" label="Checklist Compartido" settings={settings} onSettingChange={handleSettingChange}/>
                <ModuleToggle id="notasCliente" label="Notas y Preferencias" settings={settings} onSettingChange={handleSettingChange}/>
             </CardContent>
          </Card>
          
          {settings.checklist.visible && (
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-xl flex items-center gap-2"><ClipboardCheck className="text-primary"/>Checklist Compartido con el Cliente</CardTitle>
                    <CardDescription>Gestiona las tareas que tu cliente debe completar. El cliente podrá marcarlas como hechas si la edición está habilitada.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <Button type="button" size="sm" variant="outline" onClick={handleAddChecklistItem}><PlusCircle className="w-4 h-4 mr-2"/>Añadir Tarea para el Cliente</Button>
                         <ScrollArea className="h-auto max-h-52 pr-3">
                            <ul className="space-y-2">
                                {clientChecklist.map((task) => (
                                    <li key={task.id} className="flex items-center gap-2 p-2 border rounded-md">
                                        <Checkbox id={`client-task-${task.id}`} checked={task.completada} disabled className="mt-1"/>
                                        <Input value={task.texto} onChange={(e) => handleChecklistChange(task.id, 'texto', e.target.value)} className="h-8 text-sm flex-grow"/>
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteChecklistItem(task.id)}><Trash2 className="w-4 h-4"/></Button>
                                    </li>
                                ))}
                            </ul>
                         </ScrollArea>
                    </div>
                </CardContent>
            </Card>
          )}

          {settings.notasCliente.visible && (
             <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-xl flex items-center gap-2"><StickyNote className="text-primary"/>Notas y Preferencias del Cliente</CardTitle>
                    <CardDescription>Este es un espacio compartido. Si habilitas la edición, el cliente también podrá añadir o modificar notas aquí.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Textarea 
                        placeholder="Alergias, canciones favoritas, ideas, sorpresas..." 
                        rows={6}
                        value={clientNotes}
                        onChange={(e) => setClientNotes(e.target.value)}
                    />
                </CardContent>
             </Card>
          )}

          <div className="mt-8 flex justify-end">
             <Button type="submit" size="lg" disabled={isSaving}>
                {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Save className="w-5 h-5 mr-2"/>}
                Guardar Toda la Configuración
             </Button>
          </div>
      </form>
    </div>
  );
}

