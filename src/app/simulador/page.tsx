'use client';

import { useState } from 'react';
import { PartyPopper, Users, CalendarDays, MessageSquare, ChevronRight, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { PublicFooter } from '@/components/public-footer';

const WHATSAPP_NUMBER = '59898355530';

const EVENT_TYPES = [
  { value: 'Boda',               label: '💍 Boda',                basePerPerson: 900,  extra: 15000 },
  { value: 'XV años',            label: '🎀 XV Años',             basePerPerson: 750,  extra: 12000 },
  { value: 'Cumpleaños',         label: '🎂 Cumpleaños Adultos',   basePerPerson: 600,  extra: 8000  },
  { value: 'Cumpleaños infantil',label: '🎈 Cumpleaños Infantil', basePerPerson: 500,  extra: 6000  },
  { value: 'Evento corporativo', label: '🏢 Evento Corporativo',  basePerPerson: 700,  extra: 10000 },
  { value: 'Otro',               label: '🎉 Otro Evento',         basePerPerson: 600,  extra: 8000  },
];

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(n);

function estimatePrice(eventType: string, guests: number): { min: number; max: number } {
  const type = EVENT_TYPES.find(e => e.value === eventType) ?? EVENT_TYPES[0];
  const base = type.basePerPerson * guests + type.extra;
  return { min: Math.round(base * 0.85), max: Math.round(base * 1.20) };
}

export default function SimuladorPage() {
  const [eventType, setEventType] = useState('');
  const [guests, setGuests] = useState(100);
  const [showResult, setShowResult] = useState(false);

  const handleCalc = () => {
    if (!eventType) return;
    setShowResult(true);
  };

  const estimate = eventType ? estimatePrice(eventType, guests) : null;

  const waMessage = encodeURIComponent(
    `Hola! Usé el simulador de AK Producciones y me interesa cotizar un evento para ${guests} personas (${eventType}). ¿Podemos hablar?`
  );
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`;

  const selectedLabel = EVENT_TYPES.find(e => e.value === eventType)?.label ?? '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Simulador Gratuito
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            ¿Cuánto cuesta tu fiesta?
          </h1>
          <p className="text-gray-500 text-lg max-w-md mx-auto">
            Seleccioná el tipo de evento y la cantidad de invitados para obtener un estimado al instante.
          </p>
        </div>

        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <PartyPopper className="w-5 h-5 text-violet-500" />
              Calculá tu evento
            </CardTitle>
            <CardDescription>Estimado orientativo · Precios en pesos uruguayos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Event type */}
            <div className="space-y-2">
              <Label htmlFor="event-type" className="flex items-center gap-1.5 font-medium">
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                Tipo de evento
              </Label>
              <Select value={eventType} onValueChange={v => { setEventType(v); setShowResult(false); }}>
                <SelectTrigger id="event-type">
                  <SelectValue placeholder="Seleccioná un tipo…" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map(e => (
                    <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Guest count */}
            <div className="space-y-3">
              <Label className="flex items-center justify-between font-medium">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  Cantidad de invitados
                </span>
                <span className="text-xl font-bold text-violet-600">{guests}</span>
              </Label>
              <Slider
                min={20}
                max={500}
                step={10}
                value={[guests]}
                onValueChange={([v]) => { setGuests(v); setShowResult(false); }}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>20</span>
                <span>500</span>
              </div>
            </div>

            <Button
              onClick={handleCalc}
              disabled={!eventType}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
              size="lg"
            >
              Calcular estimado
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>

            {/* Result */}
            {showResult && estimate && (
              <div className="rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 p-4 text-white text-center space-y-3 animate-in fade-in slide-in-from-bottom-2">
                <p className="text-sm opacity-90">{selectedLabel} · {guests} personas</p>
                <p className="text-xs opacity-75">Estimado aproximado</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(estimate.min)} – {formatCurrency(estimate.max)}
                </p>
                <p className="text-xs opacity-75">
                  * Precio final depende de los servicios contratados, salón y fecha.
                </p>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  <MessageSquare className="w-5 h-5" />
                  Congelá este precio · WhatsApp 098 355 530
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-sm text-gray-400 text-center max-w-xs">
          AK Producciones · Salto, Uruguay · Tu fiesta merece lo mejor
        </p>
      </div>
      <PublicFooter />
    </div>
  );
}
