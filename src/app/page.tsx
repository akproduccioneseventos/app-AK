import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const proximosEventosData = [
  { evento: 'Boda de Ana y Luis', fecha: '15/05/2025', lugar: 'Salón Fiesta' },
  { evento: 'Cumpleaños de Pedro', fecha: '22/05/2025', lugar: 'Restaurante El Lago' },
  { evento: 'Graduación de Carla', fecha: '05/05/2025', lugar: 'Club Social' },
];

const eventosPendientesData = [
  { evento: 'Bautizo de Laura', cliente: 'Marla Gómez' },
  { evento: 'Fiesta de Navidad', cliente: 'Empresa XYZ' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Title is now handled by AppShell */}
      {/* <h1 className="text-3xl font-bold tracking-tight font-headline text-foreground">
        Dashboard
      </h1> */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column / Main Content */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-xl">Próximos Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {proximosEventosData.map((item, index) => (
                  <div key={index} className="grid grid-cols-3 gap-4 items-center pb-2 border-b last:border-b-0">
                    <p className="font-medium col-span-1 truncate">{item.evento}</p>
                    <p className="text-sm text-muted-foreground col-span-1">{item.fecha}</p>
                    <p className="text-sm text-muted-foreground col-span-1 truncate">{item.lugar}</p>
                  </div>
                ))}
                {proximosEventosData.length === 0 && <p className="text-muted-foreground">No hay próximos eventos.</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-xl">Eventos Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {eventosPendientesData.map((item, index) => (
                  <div key={index} className="grid grid-cols-2 gap-4 items-center pb-2 border-b last:border-b-0">
                    <p className="font-medium truncate">{item.evento}</p>
                    <p className="text-sm text-muted-foreground truncate">{item.cliente}</p>
                  </div>
                ))}
                {eventosPendientesData.length === 0 && <p className="text-muted-foreground">No hay eventos pendientes.</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-xl">Resumen Financiero</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground">Costo Estimado</h3>
                <p className="text-2xl font-semibold">$13.500</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground">Pagos Pendientes</h3>
                <p className="text-2xl font-semibold">$4.200</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column / Calendar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-xl">Abril 2024</CardTitle> {/* TODO: Make dynamic */}
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                // selected={new Date(2024, 3, 25)} // April 25th, 2024 - Month is 0-indexed
                defaultMonth={new Date(2024, 3, 1)} // Default to April 2024
                className="p-0"
                classNames={{
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground",
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
