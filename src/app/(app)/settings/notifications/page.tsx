
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, BellRing, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useAutoSave } from '@/hooks/use-auto-save';
import { AutoSaveIndicator } from '@/components/ui/auto-save-indicator';

import {
  leerPreferenciasDeAvisos,
  guardarPreferenciasDeAvisos,
} from '@/app/actions/preferencias-avisos';
import {
  initialNotificationPreferences,
  type NotificationPreferences,
} from '@/types/preferencias-avisos';

export default function NotificationsSettingsPage() {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadPreferences = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await leerPreferenciasDeAvisos();
      let prefs = res.success && res.preferences ? res.preferences : initialNotificationPreferences;

      if (typeof window !== 'undefined') {
        const local = localStorage.getItem('notification_prefs');
        if (local) {
          try {
            const parsed = JSON.parse(local);
            prefs = { ...prefs, ...parsed };
            const guardado = await guardarPreferenciasDeAvisos(prefs);
            if (guardado.success) {
              localStorage.removeItem('notification_prefs');
            }
          } catch {
            localStorage.removeItem('notification_prefs');
          }
        }
      }

      setPreferences(prefs);
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar las preferencias.' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const { isSaving, lastSaved, saveError } = useAutoSave({
    data: preferences,
    onSave: async (prefs) => {
      if (!prefs) return { success: false, error: 'Sin datos' };
      const res = await guardarPreferenciasDeAvisos(prefs);
      if (!res.success) {
        return { success: false, error: res.error || 'No se pudieron guardar las preferencias.' };
      }
      return { success: true };
    },
    debounceMs: 1500,
    enabled: !isLoading && !!preferences,
  });

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <BellRing className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Configuración de Notificaciones
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AutoSaveIndicator isSaving={isSaving} lastSaved={lastSaved} saveError={saveError} />
          <Button asChild variant="outline"><Link href="/settings">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Configuración
            </Link></Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Gestionar Preferencias</CardTitle>
          <CardDescription>
            Elige qué notificaciones deseas recibir y por qué canales. Los cambios se guardan automáticamente.
          </CardDescription>
        </CardHeader>
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
                    <div className="flex flex-wrap items-center justify-between gap-3">
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
                    <div className="flex flex-wrap items-center justify-between gap-3">
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
      </Card>
    </div>
  );
}
