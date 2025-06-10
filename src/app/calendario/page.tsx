
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { DashboardCalendar } from '@/components/dashboard-calendar'; // Reutilizamos el calendario del dashboard

export default function CalendarioGeneralPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Calendario General de Eventos
        </h1>
        <Link href="/" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Dashboard
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-4 rounded-full inline-block mb-4">
            <CalendarDays className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl">Calendario (En Desarrollo)</CardTitle>
          <CardDescription className="text-lg">
            Visualiza todos tus eventos y fechas importantes en un solo lugar.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <p className="text-muted-foreground text-center">
            Próximamente, este calendario mostrará todos tus eventos planificados. 
            Por ahora, muestra una vista genérica.
          </p>
          <div className="w-full max-w-md">
            <DashboardCalendar /> 
          </div>
          <img 
            src="https://placehold.co/600x250.png" 
            alt="Calendario de eventos en construcción" 
            className="mt-6 rounded-md shadow-md mx-auto"
            data-ai-hint="event calendar construction"
          />
        </CardContent>
      </Card>
    </div>
  );
}
