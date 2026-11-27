'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { BellRing, Trash2, CheckCheck, KanbanSquare, Bell, ListChecks, MessageSquareText } from "lucide-react";
import { getNotifications, markAllNotificationsAsRead, deleteNotification, generateAllSmartNotifications } from '@/app/actions/notifications';
import { getAlertasGlobalesConLeidas, marcarTodasLeidas } from '@/app/actions/alertas.actions';
import type { Notificacion } from '@/types/fiesta';
import type { AlertaAutomatica } from '@/types/automatizaciones';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const iconMap: { [key: string]: React.ComponentType<React.SVGProps<SVGSVGElement>> } = {
  KanbanSquare,
  ListChecks,
  MessageSquareText,
  Default: Bell,
};

export function NotificationsHub() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notificacion[]>([]);
  const [alertas, setAlertas] = useState<AlertaAutomatica[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const [fetched, fetchedAlertas] = await Promise.all([
        getNotifications().catch(() => []),
        getAlertasGlobalesConLeidas().catch(() => []),
      ]);
      // Aseguramos que siempre sea un array para evitar errores de .filter o .map
      setNotifications(Array.isArray(fetched) ? fetched : []);
      setAlertas(Array.isArray(fetchedAlertas) ? fetchedAlertas : []);
    } catch (e) {
      console.warn("Error al obtener notificaciones:", e);
      setNotifications([]);
      setAlertas([]);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const onUpdated = () => {
      void fetchNotifications();
    };
    window.addEventListener('ak-notifications-updated', onUpdated);
    return () => window.removeEventListener('ak-notifications-updated', onUpdated);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    const lastGenerated = Number(sessionStorage.getItem('ak-last-smart-notification-check') || '0');
    const shouldGenerate = Date.now() - lastGenerated > 20 * 60 * 1000;
    const generation = shouldGenerate
      ? generateAllSmartNotifications().then((result) => {
          if (result.success) sessionStorage.setItem('ak-last-smart-notification-check', String(Date.now()));
          return result;
        })
      : Promise.resolve({ success: true, totalCreated: 0 });

    generation
      .catch(e => console.warn("Error generating smart notifications:", e))
      .finally(() => {
        fetchNotifications().finally(() => setIsLoading(false));
      });

    // Solo actualizamos mientras el panel esta abierto para evitar trabajo de red en cada pantalla.
    const interval = setInterval(fetchNotifications, 120000);
    return () => clearInterval(interval);
  }, [fetchNotifications, isOpen]);

  // Memorizamos la lista segura para evitar re-renderizados innecesarios y errores de nulos
  const safeNotifications = useMemo(() => Array.isArray(notifications) ? notifications : [], [notifications]);
  const unreadAlertasExtra = useMemo(() => {
    const idsNotif = new Set(safeNotifications.map((n) => n.id));
    return (Array.isArray(alertas) ? alertas : []).filter((a) => !a.leida && !idsNotif.has(a.id));
  }, [alertas, safeNotifications]);

  const unreadUrgentCount = useMemo(
    () =>
      safeNotifications.filter((n) => !n.leida && (n.tipo === 'urgente' || (n.tipo as string) === 'alerta')).length +
      unreadAlertasExtra.filter((a) => a.tipo === 'urgente').length,
    [safeNotifications, unreadAlertasExtra],
  );
  const unreadCount = useMemo(
    () => safeNotifications.filter((n) => !n.leida).length + unreadAlertasExtra.length,
    [safeNotifications, unreadAlertasExtra],
  );

  const handleMarkAllAsRead = async () => {
    const originalNotifications = [...safeNotifications];
    const originalAlertas = [...alertas];
    setNotifications(prev => (prev || []).map(n => ({ ...n, leida: true })));
    setAlertas(prev => (prev || []).map(a => ({ ...a, leida: true })));
    const [result, resultAlertas] = await Promise.all([
      markAllNotificationsAsRead(),
      marcarTodasLeidas().catch(() => ({ success: false })),
    ]);
    if (!result.success && !resultAlertas.success) {
      toast({ title: "Error", description: "No se pudieron marcar como leídas.", variant: "destructive" });
      setNotifications(originalNotifications);
      setAlertas(originalAlertas);
    } else {
      window.dispatchEvent(new Event('ak-notifications-updated'));
    }
  };

  const handleDeleteNotification = async (id: string) => {
    const originalNotifications = [...safeNotifications];
    setNotifications(prev => (prev || []).filter(n => n.id !== id));
    const result = await deleteNotification(id);
    if (!result.success) {
      toast({ title: "Error", description: "No se pudo eliminar la notificación.", variant: "destructive" });
      setNotifications(originalNotifications);
    } else {
      window.dispatchEvent(new Event('ak-notifications-updated'));
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="relative" aria-label="Abrir notificaciones">
          <BellRing className="h-5 w-5" />
          {unreadUrgentCount > 0 ? (
            <Badge data-testid="campana-alertas-badge" variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center rounded-full p-0 text-xs">
              {unreadUrgentCount > 99 ? "99+" : unreadUrgentCount}
            </Badge>
          ) : unreadCount > 0 ? (
            <span data-testid="campana-alertas-punto" className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-slate-400" />
          ) : null}
          <span className="sr-only">Abrir notificaciones</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="z-[80] w-[calc(100vw-1rem)] max-w-80 p-0">
        <div className="flex justify-between items-center p-3 border-b">
          <h3 className="font-semibold text-sm">Notificaciones</h3>
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
            <CheckCheck className="w-3.5 h-3.5 mr-1.5"/>Marcar leído
          </Button>
        </div>
        <ScrollArea className="h-96">
          {(safeNotifications.length > 0 || unreadAlertasExtra.length > 0) ? (
            <div className="space-y-1 p-2">
              {unreadAlertasExtra.map((alerta) => (
                <Link
                  key={alerta.id}
                  href={alerta.accionUrl || '/mi-dia?tab=alertas'}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "group p-2 rounded-md hover:bg-muted/50 flex items-start gap-3",
                    alerta.tipo === 'urgente' ? "bg-destructive/5" : "bg-primary/5",
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <Bell className={cn("w-5 h-5 mt-0.5", alerta.tipo === 'urgente' ? "text-destructive" : "text-muted-foreground")} />
                    <span className={cn("absolute -top-0.5 -left-0.5 block h-2 w-2 rounded-full ring-2 ring-background", alerta.tipo === 'urgente' ? "bg-destructive" : "bg-primary")} />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-medium">{alerta.mensaje}</p>
                    <p className="text-xs text-muted-foreground">{alerta.fiestaName || 'Centro de Alertas'}</p>
                  </div>
                </Link>
              ))}
              {safeNotifications.map(notif => {
                const Icon = notif.icono && iconMap[notif.icono] ? iconMap[notif.icono] : iconMap.Default;
                return (
                <div key={notif.id} className={cn("group p-2 rounded-md hover:bg-muted/50 flex items-start gap-3", !notif.leida && "bg-primary/5")}>
                    <div className="relative flex-shrink-0">
                        <Icon className="w-5 h-5 text-muted-foreground mt-0.5" />
                        {!notif.leida && <span className="absolute -top-0.5 -left-0.5 block h-2 w-2 rounded-full bg-primary ring-2 ring-background" />}
                    </div>
                    <div className="flex-grow">
                        <p className="text-sm">{notif.mensaje}</p>
                        <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notif.fecha), { addSuffix: true, locale: es })}
                        </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Borrar notificación: ${notif.mensaje}`}
                      title="Borrar notificación"
                      className="h-6 w-6 md:opacity-0 md:group-hover:opacity-100 text-destructive"
                      onClick={() => handleDeleteNotification(notif.id)}
                    >
                        <Trash2 className="w-3.5 h-3.5"/>
                    </Button>
                </div>
              )})}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {isLoading ? "Cargando..." : "No tienes notificaciones nuevas."}
            </div>
          )}
        </ScrollArea>
        <div className="border-t p-2">
          <Button asChild variant="ghost" size="sm" className="w-full text-xs font-semibold" onClick={() => setIsOpen(false)}>
            <Link href="/mi-dia?tab=alertas">Ir al Centro de Alertas</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
