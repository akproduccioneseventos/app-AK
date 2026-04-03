'use client';

import React, { useState, useMemo } from 'react';
import { MessageSquare, Calculator, PartyPopper, Users, ChevronDown, CheckCircle2, Star, ArrowRight, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const WHATSAPP_NUMBER = '598098355530';
const WHATSAPP_BASE = `https://wa.me/${WHATSAPP_NUMBER}`;

type EventType = 'Boda' | 'XV Años' | 'Cumpleaños' | 'Cumpleaños infantil' | 'Evento corporativo';

interface EventConfig {
  label: string;
  emoji: string;
  basePriceUYU: number;
  pricePerGuestUYU: number;
  description: string;
  highlights: string[];
}

const EVENT_CONFIGS: Record<EventType, EventConfig> = {
  'Boda': {
    label: 'Boda',
    emoji: '💍',
    basePriceUYU: 80000,
    pricePerGuestUYU: 1800,
    description: 'El día más especial de sus vidas, organizado por completo.',
    highlights: ['Ceremonia y recepción', 'Decoración temática', 'Catering completo', 'DJ y música en vivo', 'Fotografía y filmación'],
  },
  'XV Años': {
    label: 'XV Años',
    emoji: '👑',
    basePriceUYU: 60000,
    pricePerGuestUYU: 1600,
    description: 'La fiesta de 15 que ella siempre soñó.',
    highlights: ['Vals de ingreso', 'Decoración personalizada', 'Mesa de dulces', 'Show sorpresa', 'Recuerdo para invitados'],
  },
  'Cumpleaños': {
    label: 'Cumpleaños',
    emoji: '🎂',
    basePriceUYU: 40000,
    pricePerGuestUYU: 1400,
    description: 'Celebrá tu cumple sin preocuparte por nada.',
    highlights: ['Ambientación temática', 'Catering a medida', 'Torta personalizada', 'Animación', 'Coordinación general'],
  },
  'Cumpleaños infantil': {
    label: 'Cumpleaños Infantil',
    emoji: '🎈',
    basePriceUYU: 30000,
    pricePerGuestUYU: 1200,
    description: 'La fiesta mágica que los chicos recordarán siempre.',
    highlights: ['Animación infantil', 'Decoración mágica', 'Merienda para niños', 'Juegos y actividades', 'Goodie bags'],
  },
  'Evento corporativo': {
    label: 'Evento Corporativo',
    emoji: '🏢',
    basePriceUYU: 70000,
    pricePerGuestUYU: 1600,
    description: 'Eventos de empresa con imagen profesional.',
    highlights: ['Coordinación logística', 'Catering ejecutivo', 'Equipamiento audiovisual', 'Fotografía corporativa', 'Ambientación de marca'],
  },
};

const formatUYU = (amount: number) =>
  new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

export default function SimuladorPage() {
  const [eventType, setEventType] = useState<EventType | ''>('');
  const [guests, setGuests] = useState(80);
  const [showResult, setShowResult] = useState(false);

  const config = eventType ? EVENT_CONFIGS[eventType] : null;

  const estimate = useMemo(() => {
    if (!config) return null;
    const base = config.basePriceUYU + guests * config.pricePerGuestUYU;
    const low = Math.round(base * 0.9 / 1000) * 1000;
    const high = Math.round(base * 1.1 / 1000) * 1000;
    return { low, high, mid: Math.round(base / 1000) * 1000 };
  }, [config, guests]);

  const whatsappMessage = encodeURIComponent(
    `Hola! Usé el simulador de AK Producciones y me salió un estimado de ${estimate ? formatUYU(estimate.mid) : ''} para una ${eventType} de ${guests} invitados. Me gustaría congelar ese precio y agendar una reunión sin costo. ¿Cuándo podemos hablar?`
  );

  const handleCalculate = () => {
    if (!eventType) return;
    setShowResult(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Hero */}
      <div className="pt-12 pb-8 px-4 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-primary/20 text-primary border border-primary/30 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
          <Star className="w-4 h-4" />
          Entrevista inicial 100% sin costo
        </div>
        <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
          ¿Cuánto cuesta tu
          <span className="text-primary"> evento soñado?</span>
        </h1>
        <p className="text-slate-300 text-lg">
          Calculá un estimado en segundos. Sin compromiso, sin datos personales.
        </p>
      </div>

      {/* Calculator Card */}
      <div className="max-w-lg mx-auto px-4 pb-12">
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm text-white shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="w-5 h-5 text-primary" />
              Simulador de Presupuesto
            </CardTitle>
            <CardDescription className="text-slate-400">
              Completá los datos para obtener tu estimado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Event Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200 flex items-center gap-2">
                <PartyPopper className="w-4 h-4 text-primary" />
                Tipo de Evento
              </label>
              <Select value={eventType} onValueChange={(v) => { setEventType(v as EventType); setShowResult(false); }}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white h-12">
                  <SelectValue placeholder="Seleccioná el tipo de evento..." />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(EVENT_CONFIGS) as EventType[]).map(type => (
                    <SelectItem key={type} value={type}>
                      {EVENT_CONFIGS[type].emoji} {EVENT_CONFIGS[type].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {config && (
                <p className="text-xs text-slate-400">{config.description}</p>
              )}
            </div>

            {/* Guest Count */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Cantidad de Invitados
                <span className="ml-auto text-primary font-bold text-lg">{guests}</span>
              </label>
              <Slider
                value={[guests]}
                onValueChange={([v]) => { setGuests(v); setShowResult(false); }}
                min={20}
                max={400}
                step={10}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>20</span>
                <span>200</span>
                <span>400</span>
              </div>
            </div>

            {/* Services included */}
            {config && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-300">Incluye:</p>
                <div className="grid grid-cols-1 gap-1">
                  {config.highlights.map(h => (
                    <div key={h} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                      {h}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Calculate Button */}
            <Button
              onClick={handleCalculate}
              disabled={!eventType}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              <Calculator className="w-5 h-5 mr-2" />
              Calcular Estimado
            </Button>

            {/* Result */}
            {showResult && estimate && config && (
              <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="text-center">
                  <p className="text-sm text-slate-300 mb-1">Estimado para tu {config.label} de {guests} invitados:</p>
                  <div className="text-4xl font-bold text-white mb-1">
                    {formatUYU(estimate.mid)}
                  </div>
                  <p className="text-xs text-slate-400">
                    Rango orientativo: {formatUYU(estimate.low)} — {formatUYU(estimate.high)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">* Estimado sin compromiso. El precio final depende del menú y servicios elegidos.</p>
                </div>

                <Separator className="bg-white/10" />

                {/* CTA */}
                <div className="text-center space-y-3">
                  <p className="text-sm font-semibold text-white">
                    🔒 ¡Congelá este precio ahora!
                  </p>
                  <p className="text-xs text-slate-300">
                    Agendá una reunión gratuita con Alexander y asegurá tu fecha antes de que la tome otro evento.
                  </p>
                  <a
                    href={`${WHATSAPP_BASE}?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-bold text-base shadow-lg shadow-green-500/30">
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Hablar por WhatsApp
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </a>
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                    <Phone className="w-3 h-3" />
                    <span>098 355 530 · Alexander Knuth · AK Producciones</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trust signals */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {[
            { icon: '🎉', text: 'Bodas, 15 años, cumpleaños y más' },
            { icon: '✅', text: 'Todo incluido, un solo proveedor' },
            { icon: '📍', text: 'Salto, Uruguay · Club Uruguay' },
          ].map(({ icon, text }) => (
            <div key={text} className="space-y-1">
              <div className="text-2xl">{icon}</div>
              <p className="text-xs text-slate-400 leading-tight">{text}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-10 text-center text-xs text-slate-500 space-y-1">
          <p>AK Producciones Eventos · RUT 220372680019</p>
          <p>Gaboto 3390, Salto, Uruguay</p>
          <a href={`${WHATSAPP_BASE}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            📲 098 355 530
          </a>
        </div>
      </div>
    </div>
  );
}
