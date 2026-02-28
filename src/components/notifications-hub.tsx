
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
import { getNotifications, markAllNotificationsAsRead, deleteNotification } from '@/app/actions/notifications';
import type { Notificacion } from '@/types/fiesta';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const iconMap: { [key: string]: React.ElementType } = {
  KanbanSquare,
  ListChecks,
  MessageSquareText,
  Default: Bell,
};

export function NotificationsHub() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notificacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const fetched = await getNotifications();
      // Aseguramos que siempre sea un array para evitar errores de .filter o .map
      setNotifications(Array.isArray(fetched) ? fetched : []);
    } catch (e) {
      console.warn("Error al obtener notificaciones:", e);
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchNotifications().finally(() => setIsLoading(false));
    
    // Configurar sondeo (polling) cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Memorizamos la lista segura para evitar re-renderizados innecesarios y errores de nulos
  const safeNotifications = useMemo(() => Array.isArray(notifications) ? notifications : [], [notifications]);
  const unreadCount = useMemo(() => safeNotifications.filter(n => !n.leida).length, [safeNotifications]);

  const handleMarkAllAsRead = async () => {
    const originalNotifications = [...safeNotifications];
    setNotifications(prev => (prev || []).map(n => ({ ...n, leida: true })));
    const result = await markAllNotificationsAsRead();
    if (!result.success) {
      toast({ title: "Error", description: "No se pudieron marcar como leídas.", variant: "destructive" });
      setNotifications(originalNotifications); 
    }
  };
  
  const handleDeleteNotification = async (id: string) => {
    const originalNotifications = [...safeNotifications];
    setNotifications(prev => (prev || []).filter(n => n.id !== id));
    const result = await deleteNotification(id);
    if (!result.success) {
      toast({ title: "Error", description: "No se pudo eliminar la notificación.", variant: "destructive" });
      setNotifications(originalNotifications); 
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellRing className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center rounded-full p-0 text-xs">
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Abrir notificaciones</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="flex justify-between items-center p-3 border-b">
          <h3 className="font-semibold text-sm">Notificaciones</h3>
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
            <CheckCheck className="w-3.5 h-3.5 mr-1.5"/>Marcar leído
          </Button>
        </div>
        <ScrollArea className="h-96">
          {safeNotifications.length > 0 ? (
            <div className="space-y-1 p-2">
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
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => handleDeleteNotification(notif.id)}>
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
      </PopoverContent>
    </Popover>
  );
}
