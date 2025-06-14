
'use client';

import React, { useState, type FormEvent } from 'react'; // Added React import
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, BellRing, Save, Loader2, Construction } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

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

export default function NotificationsSettingsPage() {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>(initialPreferences);
  const [isSaving, setIsSaving] = useState(false);

  const handlePreferenceChange = (
    category: keyof NotificationPreferences,
    type: 'email' | 'app',
    value: boolean
  ) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [type]: value,
      },
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: "Preferencias Guardadas (Simulado)",
      description: "Tus configuraciones de notificación han sido actualizadas.",
    });
    setIsSaving(false);
  };

  const notificationSections: {
    id: keyof NotificationPreferences;
    title: string;
    description: string;
  }[] = [
    { id: "eventReminders", title: "Recordatorios de Eventos", description: "Alertas sobre próximos eventos, cambios de fecha, etc." },
    { id: "taskUpdates", title: "Actualizaciones de Tareas", description: "Notificaciones sobre tareas asignadas, vencimientos o completadas." },
    { id: "crmUpdates", title: "Actualizaciones del CRM", description: "Alertas sobre nuevos prospectos, cambios de etapa, etc." },
    { id: "clientMessages", title: "Mensajes de Clientes (Próximamente)", description: "Avisos cuando un cliente envía un mensaje o responde." },
    { id: "systemAlerts", title: "Alertas del Sistema (Próximamente)", description: "Notificaciones importantes sobre tu cuenta o el sistema." },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BellRing className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Configuración de Notificaciones
          </h1>
        </div>
        <Link href="/settings" passHref>
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
            Elige qué notificaciones deseas recibir y por qué canales. La funcionalidad real de envío de notificaciones está en desarrollo.
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
                        disabled={isSaving || section.title.includes("(Próximamente)")}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`${section.id}-app`} className="flex flex-col space-y-1">
                        <span>Notificación en App</span>
                        <span className="font-normal leading-snug text-muted-foreground text-xs">
                          Mostrar dentro de la aplicación (si está habilitado).
                        </span>
                      </Label>
                      <Switch
                        id={`${section.id}-app`}
                        checked={preferences[section.id].app}
                        onCheckedChange={(value) => handlePreferenceChange(section.id, 'app', value)}
                        disabled={isSaving || section.title.includes("(Próximamente)")}
                      />
                    </div>
                  </div>
                </div>
              </React.Fragment>
            ))}
             <div className="pt-4">
                <Image 
                    src="https://placehold.co/600x250.png" 
                    alt="Ilustración de notificaciones" 
                    width={600} 
                    height={250} 
                    className="rounded-md shadow-sm mx-auto opacity-80"
                    data-ai-hint="notifications interface settings"
                />
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {isSaving ? "Guardando..." : "Guardar Preferencias"}
            </Button>
          </CardFooter>
        </form>
      </Card>
       <p className="text-xs text-muted-foreground text-center">
        Ten en cuenta que las opciones marcadas como "(Próximamente)" y el envío real de notificaciones aún están en desarrollo.
      </p>
    </div>
  );
}
