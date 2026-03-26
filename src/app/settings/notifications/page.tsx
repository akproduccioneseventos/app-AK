
'use client';

import React, { useState, type FormEvent, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, BellRing, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface NotificationPreferences {
  eventReminders: { email: boolean; app: boolean };
  taskUpdates: { email: boolean; app: boolean };
  clientMessages: { email: boolean; app: boolean };
  systemAlerts: { email: boolean; app: boolean };
  crmUpdates: { email: boolean; app: boolean };
}

const initialPreferences: NotificationPreferences = {
  eventReminders: { email: true, app: true },
  taskUpdates: { email: true, app: false },
  clientMessages: { email: true, app: true },
  systemAlerts: { email: false, app: true },
  crmUpdates: { email: true, app: false },
};

// Simulate API calls for now
async function getNotificationPreferences(): Promise<NotificationPreferences> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const stored = typeof window !== 'undefined' ? localStorage.getItem('notification_prefs') : null;
  return stored ? JSON.parse(stored) : initialPreferences;
}

async function saveNotificationPreferences(prefs: NotificationPreferences): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  if (typeof window !== 'undefined') {
    localStorage.setItem('notification_prefs', JSON.stringify(prefs));
  }
}


export default function NotificationsSettingsPage() {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadPreferences = useCallback(async () => {
    setIsLoading(true);
    try {
        const data = await getNotificationPreferences();
        setPreferences(data);
    } catch (e) {
        toast({ title: "Error", description: "No se pudieron cargar las preferencias."});
    } finally {
        setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);


  const handlePreferenceChange = (
    category: keyof NotificationPreferences,
    type: 'email' | 'app',
    value: boolean
  ) => {
    setPreferences(prev => {
        if (!prev) return null;
        return {
            ...prev,
            [category]: {
                ...prev[category],
                [type]: value,
            },
        };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!preferences) return;
    setIsSaving(true);
    try {
      await saveNotificationPreferences(preferences);
      toast({
        title: "Preferencias Guardadas",
        description: "Tus configuraciones de notificación han sido actualizadas.",
      });
    } catch(e) {
      toast({ title: "Error", description: "No se pudieron guardar las preferencias.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const notificationSections: {
    id: keyof NotificationPreferences;
    title: string;
    description: string;
    isDisabled?: boolean;
  }[] = [
    { id: "eventReminders", title: "Recordatorios de Eventos", description: "Alertas sobre próximos eventos, cambios de fecha, etc." },
    { id: "taskUpdates", title: "Actualizaciones de Tareas", description: "Notificaciones sobre tareas asignadas, vencimientos o completadas." },
    { id: "crmUpdates", title: "Actualizaciones del CRM", description: "Alertas sobre nuevos prospectos, cambios de etapa, etc." },
    { id: "clientMessages", title: "Mensajes de Clientes", description: "Avisos cuando un cliente envía un mensaje o responde.", isDisabled: false },
    { id: "systemAlerts", title: "Alertas del Sistema", description: "Notificaciones importantes sobre tu cuenta o el sistema.", isDisabled: false },
  ];
  
  if (isLoading || !preferences) {
      return (
        <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary"/>
        </div>
      )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BellRing className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Configuración de Notificaciones
          </h1>
        </div>
        <Link href="/settings">
          <Button variant="outline" disabled={isSaving}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Configuración
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Gestionar Preferencias</CardTitle>
          <CardDescription>
            Elige qué notificaciones deseas recibir y por qué canales.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {notificationSections.map((section, index) => (
              <React.Fragment key={section.id}>
                {index > 0 && <Separator />}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-medium">{section.title}</h3>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 p-3 border rounded-md bg-muted/30">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`${section.id}-email`} className="flex flex-col space-y-1">
                        <span>Email</span>
                        <span className="font-normal leading-snug text-muted-foreground text-xs">
                          Recibir por correo electrónico.
                        </span>
                      </Label>
                      <Switch
                        id={`${section.id}-email`}
                        checked={preferences[section.id].email}
                        onCheckedChange={(value) => handlePreferenceChange(section.id, 'email', value)}
                        disabled={isSaving || section.isDisabled}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`${section.id}-app`} className="flex flex-col space-y-1">
                        <span>Notificación en App</span>
                        <span className="font-normal leading-snug text-muted-foreground text-xs">
                          Mostrar dentro de la aplicación.
                        </span>
                      </Label>
                      <Switch
                        id={`${section.id}-app`}
                        checked={preferences[section.id].app}
                        onCheckedChange={(value) => handlePreferenceChange(section.id, 'app', value)}
                        disabled={isSaving || section.isDisabled}
                      />
                    </div>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {isSaving ? "Guardando..." : "Guardar Preferencias"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
