'use client';

import React, { useState } from 'react';
import type { FiestaEnPlanificacion, CateringChangeRequest } from '@/types/fiesta';
import type { Presupuesto } from '@/types/presupuesto';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Utensils, Send, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { submitCateringChangeRequest } from '@/app/actions/fiesta/catering-change.actions';
import { useToast } from '@/hooks/use-toast';

interface CateringSimulatorProps {
  fiestaId: string;
  presupuesto: Presupuesto | null;
  fiesta: FiestaEnPlanificacion;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('es-UY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

const KIDS_PRICE_RATIO = 0.7; // Children menu typically costs 70% of adult price

export function CateringSimulator({ fiestaId, presupuesto, fiesta }: CateringSimulatorProps) {
  const { toast } = useToast();
  
  const [deltaAdultos, setDeltaAdultos] = useState(0);
  const [deltaNinos, setDeltaNinos] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentAdultos = fiesta.configuracion?.invitadosEstimados || 0;
  const currentNinos = 0; // No dedicated children count field available; starts at 0
  
  const totalCosto = presupuesto
    ? (presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado)
    : 0;
  
  const totalGuests = currentAdultos + currentNinos;
  const pricePerPerson = totalGuests > 0 ? totalCosto / totalGuests : 0;
  
  const pricePerAdult = pricePerPerson;
  const pricePerNino = pricePerPerson * KIDS_PRICE_RATIO;
  
  const estimatedDelta = (deltaAdultos * pricePerAdult) + (deltaNinos * pricePerNino);
  const newTotal = totalCosto + estimatedDelta;
  
  const newAdultos = currentAdultos + deltaAdultos;
  const newNinos = currentNinos + deltaNinos;
  
  const requests: CateringChangeRequest[] = fiesta.cateringChangeRequests ?? [];
  
  const handleSubmit = async () => {
    if (deltaAdultos === 0 && deltaNinos === 0) {
      toast({
        title: 'Sin cambios',
        description: 'No hay cambios en la cantidad de invitados.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const result = await submitCateringChangeRequest(fiestaId, {
        clientName: fiesta.configuracion?.nombreAgasajado || 'Cliente',
        adultosCount: newAdultos,
        ninosCount: newNinos,
        estimatedCostDelta: estimatedDelta,
        newTotal,
      });
      
      if (result.success) {
        toast({
          title: '✅ Solicitud enviada',
          description: 'Tu solicitud de cambio ha sido enviada. Te notificaremos cuando sea revisada.',
        });
        setDeltaAdultos(0);
        setDeltaNinos(0);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'No se pudo enviar la solicitud.',
          variant: 'destructive',
        });
      }
    } catch (e) {
      toast({
        title: 'Error',
        description: 'Ocurrió un error al enviar la solicitud.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-lg border-0 rounded-3xl overflow-hidden">
        <CardHeader className="pb-2 bg-gradient-to-r from-orange-50 to-amber-50">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Utensils className="w-5 h-5 text-orange-500" />
            Simulador de Catering
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Ajustá la cantidad de invitados y solicitá cambios en el catering
          </p>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {/* Current overview */}
          {presupuesto && (
            <div className="p-3 rounded-xl bg-muted/40 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total actual del evento</span>
                <span className="font-bold">{formatCurrency(totalCosto)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Invitados contratados</span>
                <span className="font-semibold">{currentAdultos} adultos</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Precio estimado por persona</span>
                <span className="font-semibold">{formatCurrency(pricePerPerson)}</span>
              </div>
            </div>
          )}

          {/* Adjustments */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="delta-adultos" className="text-sm font-semibold">
                Adultos
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setDeltaAdultos(Math.max(deltaAdultos - 1, -currentAdultos))}
                >
                  -
                </Button>
                <Input
                  id="delta-adultos"
                  type="number"
                  value={deltaAdultos}
                  onChange={(e) => setDeltaAdultos(parseInt(e.target.value) || 0)}
                  className="text-center rounded-xl"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setDeltaAdultos(deltaAdultos + 1)}
                >
                  +
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Nuevo total: <span className="font-semibold">{newAdultos} adultos</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delta-ninos" className="text-sm font-semibold">
                Niños/Adolescentes
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setDeltaNinos(Math.max(deltaNinos - 1, -currentNinos))}
                >
                  -
                </Button>
                <Input
                  id="delta-ninos"
                  type="number"
                  value={deltaNinos}
                  onChange={(e) => setDeltaNinos(parseInt(e.target.value) || 0)}
                  className="text-center rounded-xl"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setDeltaNinos(deltaNinos + 1)}
                >
                  +
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Nuevo total: <span className="font-semibold">{newNinos} niños</span>
              </p>
            </div>
          </div>

          {/* Estimated change */}
          {(deltaAdultos !== 0 || deltaNinos !== 0) && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-amber-800 font-semibold">Cambio estimado</span>
                <span className={`font-bold ${estimatedDelta >= 0 ? 'text-amber-700' : 'text-green-700'}`}>
                  {estimatedDelta >= 0 ? '+' : ''}{formatCurrency(estimatedDelta)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-amber-700">Nuevo total estimado</span>
                <span className="font-bold text-amber-800">{formatCurrency(newTotal)}</span>
              </div>
            </div>
          )}

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (deltaAdultos === 0 && deltaNinos === 0)}
            className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar solicitud de cambio
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Existing requests */}
      {requests.length > 0 && (
        <Card className="shadow-lg border-0 rounded-3xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">
              Solicitudes anteriores
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 space-y-2">
            {requests.map((req) => {
              const StatusIcon = req.status === 'pendiente' ? Clock : req.status === 'aprobada' ? CheckCircle2 : XCircle;
              const statusColor = req.status === 'pendiente' ? 'text-amber-600' : req.status === 'aprobada' ? 'text-green-600' : 'text-red-600';
              const statusBg = req.status === 'pendiente' ? 'bg-amber-50 border-amber-200' : req.status === 'aprobada' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
              
              return (
                <div key={req.id} className={`p-3 rounded-xl border ${statusBg}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`w-4 h-4 ${statusColor}`} />
                      <Badge className={`text-xs ${statusBg} ${statusColor} border-0`}>
                        {req.status === 'pendiente' ? 'Pendiente' : req.status === 'aprobada' ? 'Aprobada' : 'Rechazada'}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(req.timestamp)}</span>
                  </div>
                  <div className="text-sm space-y-1">
                    {req.adultosCount !== undefined && (
                      <p className="text-muted-foreground">
                        Adultos: <span className="font-semibold text-foreground">{req.adultosCount}</span>
                      </p>
                    )}
                    {req.ninosCount !== undefined && req.ninosCount > 0 && (
                      <p className="text-muted-foreground">
                        Niños: <span className="font-semibold text-foreground">{req.ninosCount}</span>
                      </p>
                    )}
                    <p className="text-muted-foreground">
                      Cambio estimado: <span className={`font-semibold ${req.estimatedCostDelta >= 0 ? 'text-amber-700' : 'text-green-700'}`}>
                        {req.estimatedCostDelta >= 0 ? '+' : ''}{formatCurrency(req.estimatedCostDelta)}
                      </span>
                    </p>
                    {req.adminNotes && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        Nota del admin: {req.adminNotes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
