
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarDays, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { DashboardCalendar } from '@/components/dashboard-calendar';
import { getOcupiedDates } from '@/app/actions/agenda';
import { useToast } from '@/hooks/use-toast';

export default function CalendarioGeneralPage() {
  const [occupiedDates, setOccupiedDates] = useState<Date[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOccupiedDates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const dateStrings = await getOcupiedDates();
      const dates = dateStrings.map(ds => new Date(ds));
      setOccupiedDates(dates);
    } catch (err: any) {
      setError("No se pudieron cargar las fechas de los eventos.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOccupiedDates();
  }, [fetchOccupiedDates]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Calendario General de Eventos
        </h1>
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Menú Principal
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-4 rounded-full inline-block mb-4">
            <CalendarDays className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl">Calendario de Eventos</CardTitle>
          <CardDescription className="text-lg">
            Visualiza las fechas de tus eventos confirmados.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="mt-2 text-muted-foreground">Cargando calendario...</p>
            </div>
          ) : error ? (
            <div className="text-center text-destructive">
                <AlertTriangle className="mx-auto w-8 h-8 mb-2"/>
                <p>{error}</p>
            </div>
          ) : (
            <div className="w-full max-w-md">
              <DashboardCalendar occupiedDates={occupiedDates} />
            </div>
          )}
          <p className="text-sm text-muted-foreground pt-4">
            Los días marcados en rojo corresponden a eventos ya agendados.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
