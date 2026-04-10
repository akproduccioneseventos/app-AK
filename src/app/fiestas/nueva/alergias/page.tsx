'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, Loader2, AlertTriangle, Utensils, Users, Search,
  Wheat, Leaf, Milk, Shell, TreePine, ChefHat, Printer, Copy
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById } from '@/app/actions/fiesta-actual';
import type { FiestaEnPlanificacion, Invitado, DietaryRestriction } from '@/types/fiesta';

const DIET_CONFIG: Record<DietaryRestriction, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  'Ninguna': { label: 'Sin restricciones', icon: Utensils, color: 'text-slate-500', bg: 'bg-slate-100' },
  'Celiaco': { label: 'Celíaco (Sin TACC)', icon: Wheat, color: 'text-amber-700', bg: 'bg-amber-100' },
  'Vegetariano': { label: 'Vegetariano', icon: Leaf, color: 'text-green-700', bg: 'bg-green-100' },
  'Vegano': { label: 'Vegano', icon: Leaf, color: 'text-emerald-700', bg: 'bg-emerald-100' },
  'Sin Gluten': { label: 'Sin Gluten', icon: Wheat, color: 'text-yellow-700', bg: 'bg-yellow-100' },
  'Sin Lactosa': { label: 'Sin Lactosa', icon: Milk, color: 'text-blue-700', bg: 'bg-blue-100' },
  'Alergia Mariscos': { label: 'Alergia a Mariscos', icon: Shell, color: 'text-red-700', bg: 'bg-red-100' },
  'Alergia Frutos Secos': { label: 'Alergia a Frutos Secos', icon: TreePine, color: 'text-orange-700', bg: 'bg-orange-100' },
  'Otro': { label: 'Otro (Ver notas)', icon: AlertTriangle, color: 'text-purple-700', bg: 'bg-purple-100' },
};

const PRIORITY_DIETS: DietaryRestriction[] = [
  'Alergia Mariscos', 'Alergia Frutos Secos', 'Celiaco', 'Sin Gluten',
  'Sin Lactosa', 'Vegano', 'Vegetariano', 'Otro'
];

function AlergiasContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const fiestaId = searchParams.get('fiestaId');

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!fiestaId) { router.replace('/eventos'); return; }
    setIsLoading(true);
    getFiestaById(fiestaId)
      .then(data => {
        if (!data) { router.replace('/eventos'); return; }
        setFiesta(data);
      })
      .finally(() => setIsLoading(false));
  }, [fiestaId, router]);

  const allGuests = fiesta?.invitados ?? [];
  const confirmedGuests = allGuests.filter(g => g.rsvp === 'Confirmado');
  const guestsWithRestrictions = confirmedGuests.filter(
    g => g.dietaryRestriction && g.dietaryRestriction !== 'Ninguna'
  );
  const guestsWithCeliac = confirmedGuests.filter(g => g.isCeliac);

  // Count by diet type
  const dietCounts = useMemo(() => {
    const counts: Partial<Record<DietaryRestriction, number>> = {};
    confirmedGuests.forEach(g => {
      if (g.dietaryRestriction && g.dietaryRestriction !== 'Ninguna') {
        counts[g.dietaryRestriction] = (counts[g.dietaryRestriction] ?? 0) + 1;
      }
    });
    return counts;
  }, [confirmedGuests]);

  const filteredGuests = useMemo(() => {
    if (!searchQuery.trim()) return guestsWithRestrictions;
    const q = searchQuery.toLowerCase();
    return guestsWithRestrictions.filter(g =>
      g.nombre.toLowerCase().includes(q) ||
      g.dietaryRestriction?.toLowerCase().includes(q) ||
      g.alergiasEspecificas?.toLowerCase().includes(q) ||
      g.notes?.toLowerCase().includes(q)
    );
  }, [guestsWithRestrictions, searchQuery]);

  const copyCateringReport = () => {
    if (!fiesta) return;
    const lines = [
      `REPORTE ALIMENTARIO - ${fiesta.configuracion.nombreEvento}`,
      `Fecha: ${fiesta.configuracion.fechaEvento ?? 'Sin fecha'}`,
      `Total confirmados: ${confirmedGuests.length} personas`,
      `Con restricciones alimentarias: ${guestsWithRestrictions.length} personas`,
      '',
      '=== RESUMEN POR RESTRICCIÓN ===',
      ...PRIORITY_DIETS
        .filter(d => dietCounts[d])
        .map(d => `${DIET_CONFIG[d].label}: ${dietCounts[d]} persona(s)`),
      '',
      '=== DETALLE POR INVITADO ===',
      ...guestsWithRestrictions.map(g => {
        const cfg = g.dietaryRestriction ? DIET_CONFIG[g.dietaryRestriction] : null;
        return `• ${g.nombre} (Mesa ${g.tableNumber ?? '-'}): ${cfg?.label ?? ''} ${g.alergiasEspecificas ? `| Detalle: ${g.alergiasEspecificas}` : ''} ${g.notes ? `| Notas: ${g.notes}` : ''}`.trim();
      }),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    toast({ title: '✅ Reporte copiado', description: 'El reporte fue copiado al portapapeles para enviar al catering.' });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-10 h-10 animate-spin text-orange-600" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-orange-600" />
            Gestión Alimentaria
          </h1>
          <p className="text-sm text-slate-500">{fiesta?.configuracion.nombreEvento} · Alergias y dietas para catering</p>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-black text-slate-800">{confirmedGuests.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Confirmados</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-black text-orange-700">{guestsWithRestrictions.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Con Restricción</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-black text-amber-700">{guestsWithCeliac.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Celíacos</p>
          </CardContent>
        </Card>
      </div>

      {/* Priority Alert */}
      {guestsWithRestrictions.length > 0 && (
        <Card className="border-orange-300 bg-orange-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-orange-800">
                  ⚠️ {guestsWithRestrictions.length} invitado(s) con restricciones alimentarias
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  Compartir este reporte con el equipo de catering antes del evento para evitar errores.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diet breakdown */}
      {Object.keys(dietCounts).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-black flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-orange-500" />
              Resumen para Cocina
            </CardTitle>
            <CardDescription>Preparar menús especiales para las siguientes restricciones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {PRIORITY_DIETS.filter(d => dietCounts[d]).map(diet => {
                const cfg = DIET_CONFIG[diet];
                const Icon = cfg.icon;
                return (
                  <div key={diet} className={`flex items-center justify-between p-3 rounded-lg ${cfg.bg}`}>
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                      <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <Badge className={`${cfg.bg} ${cfg.color} border-0 font-black text-base`}>
                      {dietCounts[diet]}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Share with catering */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={copyCateringReport}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
              disabled={guestsWithRestrictions.length === 0}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar Reporte para Catering
            </Button>
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="border-orange-200 text-orange-700 hover:bg-orange-50"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Guest list with restrictions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-black flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-600" />
            Detalle por Invitado
          </CardTitle>
          <CardDescription>
            {guestsWithRestrictions.length} invitado(s) con restricciones alimentarias confirmados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {guestsWithRestrictions.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar invitado..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          )}

          {guestsWithRestrictions.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              <Utensils className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No hay invitados confirmados con restricciones alimentarias.</p>
            </div>
          ) : filteredGuests.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No se encontraron resultados.</p>
          ) : (
            <div className="space-y-2">
              {filteredGuests.map(guest => {
                const diet = guest.dietaryRestriction;
                const cfg = diet ? DIET_CONFIG[diet] : null;
                const Icon = cfg?.icon ?? Utensils;
                return (
                  <div key={guest.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50">
                    <div className={`p-1.5 rounded-md ${cfg?.bg ?? 'bg-slate-100'} shrink-0 mt-0.5`}>
                      <Icon className={`w-4 h-4 ${cfg?.color ?? 'text-slate-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-900">{guest.nombre}</p>
                        {guest.tableNumber && (
                          <Badge variant="outline" className="text-xs">Mesa {guest.tableNumber}</Badge>
                        )}
                        {guest.perfil === 'VIP' && (
                          <Badge className="bg-amber-100 text-amber-800 text-xs border-0">VIP</Badge>
                        )}
                        {guest.requiereAccesibilidad && (
                          <Badge className="bg-green-100 text-green-800 text-xs border-0">Accesibilidad</Badge>
                        )}
                      </div>
                      {diet && diet !== 'Ninguna' && (
                        <Badge className={`${cfg?.bg} ${cfg?.color} border-0 text-xs mt-1`}>
                          {cfg?.label}
                        </Badge>
                      )}
                      {guest.alergiasEspecificas && (
                        <p className="text-xs text-slate-600 mt-1">
                          <span className="font-medium">Detalle:</span> {guest.alergiasEspecificas}
                        </p>
                      )}
                      {guest.isCeliac && !diet?.includes('Celiac') && (
                        <p className="text-xs text-amber-700 mt-1 font-medium">⚠️ También marcado como Celíaco</p>
                      )}
                      {guest.notes && (
                        <p className="text-xs text-slate-500 mt-1">
                          <span className="font-medium">Notas:</span> {guest.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AlergiasPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-10 h-10 animate-spin text-orange-600" /></div>}>
      <AlergiasContent />
    </Suspense>
  );
}
