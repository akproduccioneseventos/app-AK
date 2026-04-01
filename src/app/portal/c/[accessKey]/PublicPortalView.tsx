
'use client';

import { useEffect, useState } from 'react';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckSquare,
  Music,
  Camera,
  Gift,
  FileText,
  MessageSquare,
  Star,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface PublicPortalViewProps {
  fiesta: FiestaEnPlanificacion;
  companyContact: string;
  companyName: string;
}

function useCountdown(targetDate: string | undefined) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
  } | null>(null);

  useEffect(() => {
    if (!targetDate) return;

    const calculate = () => {
      const now = new Date().getTime();
      const dateStr = targetDate.includes('T') ? targetDate : `${targetDate}T00:00:00`;
      const target = new Date(dateStr).getTime();
      if (isNaN(target)) return;
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        isPast: false,
      });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-3xl sm:text-4xl font-black tabular-nums leading-none">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[10px] uppercase tracking-widest font-semibold opacity-70 mt-1">
        {label}
      </span>
    </div>
  );
}

export default function PublicPortalView({
  fiesta,
  companyContact,
  companyName,
}: PublicPortalViewProps) {
  const { configuracion: config, clientPortalSettings: settings } = fiesta;
  const countdown = useCountdown(config.fechaEvento);

  const eventDate = config.fechaEvento
    ? (() => {
        const d = new Date(
          config.fechaEvento.includes('T') ? config.fechaEvento : `${config.fechaEvento}T00:00:00`
        );
        return isNaN(d.getTime())
          ? config.fechaEvento
          : d.toLocaleDateString('es-UY', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
      })()
    : null;

  const whatsappNumber = companyContact.replace(/\D/g, '');
  const hasValidPhone = whatsappNumber.length >= 7;
  const whatsappMessage = encodeURIComponent(
    `Hola! Te escribo por el evento "${config.nombreEvento}"${config.fechaEvento ? ` (${eventDate})` : ''}.`
  );
  const whatsappHref = hasValidPhone
    ? `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`
    : `https://wa.me/?text=${whatsappMessage}`;

  const visibleSections = [
    {
      id: 'checklist',
      label: 'Checklist de Tareas',
      icon: CheckSquare,
      visible: settings?.checklist?.visible,
      description: 'Tus tareas pendientes para el evento.',
    },
    {
      id: 'musica',
      label: 'Sugerencias Musicales',
      icon: Music,
      visible: settings?.musica?.visible,
      description: 'Comparte tus canciones favoritas.',
    },
    {
      id: 'fotografiaYFilmacion',
      label: 'Fotografía y Filmación',
      icon: Camera,
      visible: settings?.fotografiaYFilmacion?.visible,
      description: 'Detalles del registro del evento.',
    },
    {
      id: 'listaRegalos',
      label: 'Lista de Regalos',
      icon: Gift,
      visible: settings?.listaRegalos?.visible,
      description: 'Gestiona tu lista de deseos.',
    },
    {
      id: 'documentos',
      label: 'Documentos',
      icon: FileText,
      visible: settings?.documentos?.visible,
      description: 'Contratos y documentación del evento.',
    },
  ].filter(s => s.visible);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary/5">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground px-4 pb-10 pt-12 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <Star className="absolute top-6 right-8 w-20 h-20 text-white rotate-12" />
          <Star className="absolute bottom-4 left-6 w-12 h-12 text-white -rotate-12" />
        </div>
        <div className="relative max-w-lg mx-auto text-center space-y-3">
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/20">
            {companyName}
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black leading-tight tracking-tight">
            {config.nombreEvento || 'Tu Evento Especial'}
          </h1>
          {config.protagonista1Nombre && (
            <p className="text-lg font-medium opacity-90">
              ✨ {config.protagonista1Nombre}
              {config.protagonista2Nombre && ` & ${config.protagonista2Nombre}`}
            </p>
          )}
          {eventDate && (
            <div className="flex items-center justify-center gap-2 opacity-90">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium capitalize">{eventDate}</span>
            </div>
          )}
          {config.horaInicio && (
            <div className="flex items-center justify-center gap-2 opacity-80">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                {config.horaInicio}
                {config.horaFin ? ` — ${config.horaFin}` : ''}
              </span>
            </div>
          )}
          {config.nombreLugar && (
            <div className="flex items-center justify-center gap-2 opacity-80">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{config.nombreLugar}</span>
            </div>
          )}
          {config.invitadosEstimados > 0 && (
            <div className="flex items-center justify-center gap-2 opacity-80">
              <Users className="w-4 h-4" />
              <span className="text-sm">{config.invitadosEstimados} invitados</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 space-y-5 pb-28">
        {/* Countdown */}
        {config.fechaEvento && countdown && !countdown.isPast && (
          <Card className="shadow-xl border-0 rounded-3xl overflow-hidden">
            <CardContent className="pt-6 pb-6">
              <p className="text-center text-xs uppercase tracking-widest font-bold text-muted-foreground mb-4">
                ¡Faltan para tu evento!
              </p>
              <div className="grid grid-cols-4 gap-2 text-center">
                <CountdownUnit value={countdown.days} label="Días" />
                <CountdownUnit value={countdown.hours} label="Horas" />
                <CountdownUnit value={countdown.minutes} label="Min" />
                <CountdownUnit value={countdown.seconds} label="Seg" />
              </div>
            </CardContent>
          </Card>
        )}

        {countdown?.isPast && (
          <Card className="shadow-xl border-0 rounded-3xl bg-primary text-primary-foreground">
            <CardContent className="py-6 text-center">
              <p className="text-2xl font-black">🎉 ¡Tu evento ya fue!</p>
              <p className="text-sm opacity-80 mt-1">¡Esperamos que haya sido increíble!</p>
            </CardContent>
          </Card>
        )}

        {/* Sections */}
        {visibleSections.length > 0 && (
          <Card className="shadow-lg border-0 rounded-3xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">Secciones de tu Evento</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-1">
              {visibleSections.map((section, idx) => {
                const Icon = section.icon;
                return (
                  <div key={section.id}>
                    {idx > 0 && <Separator className="my-1" />}
                    <div className="flex items-center gap-3 py-3 px-1">
                      <div className="p-2 rounded-xl bg-primary/10">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{section.label}</p>
                        <p className="text-xs text-muted-foreground">{section.description}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Contact card */}
        <Card className="shadow-lg border-0 rounded-3xl">
          <CardContent className="py-6 space-y-3">
            <p className="text-center text-sm font-medium text-muted-foreground">
              ¿Tenés alguna consulta?
            </p>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="block">
              <Button
                className="w-full h-14 rounded-2xl bg-[#25D366] hover:bg-[#1eb356] text-white font-bold text-base shadow-lg"
                size="lg"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Contactar por WhatsApp
              </Button>
            </a>
            <p className="text-center text-xs text-muted-foreground">{companyName}</p>
          </CardContent>
        </Card>
      </div>

      {/* Floating WhatsApp button */}
      <div className="fixed bottom-6 right-4 z-50">
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
          <Button
            className="h-14 w-14 rounded-full bg-[#25D366] hover:bg-[#1eb356] text-white shadow-2xl p-0"
            aria-label="Contactar por WhatsApp"
          >
            <MessageSquare className="w-6 h-6" />
          </Button>
        </a>
      </div>
    </div>
  );
}
