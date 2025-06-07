
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays, ClipboardList, DollarSign, CreditCard, Info } from 'lucide-react'; // Added icons

const proximosEventosData = [
  { evento: 'Boda de Ana y Luis', fecha: '15/05/2025', lugar: 'Salón Fiesta' },
  { evento: 'Cumpleaños de Pedro', fecha: '22/05/2025', lugar: 'Restaurante El Lago' },
  { evento: 'Graduación de Carla', fecha: '05/06/2025', lugar: 'Club Social' },
];

const eventosPendientesData = [
  { evento: 'Bautizo de Laura', cliente: 'Marla Gómez' },
  { evento: 'Fiesta de Navidad Empresa', cliente: 'Empresa XYZ Global' },
  { evento: 'Confirmar Catering Boda', cliente: 'Juan Pérez' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column / Main Content */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-xl">Próximos Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {proximosEventosData.length > 0 ? proximosEventosData.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 py-3 px-2 border-b last:border-b-0 hover:bg-muted/50 rounded-md -mx-2 transition-colors">
                    <CalendarDays className="h-5 w-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{item.evento}</p>
                      <div className="flex items-center text-xs text-muted-foreground gap-2 flex-wrap">
                        <span>{item.fecha}</span>
                        {item.lugar && <span className="truncate">&bull; {item.lugar}</span>}
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="text-muted-foreground py-4 text-center">No hay próximos eventos programados.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-xl">Eventos Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {eventosPendientesData.length > 0 ? eventosPendientesData.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 py-3 px-2 border-b last:border-b-0 hover:bg-muted/50 rounded-md -mx-2 transition-colors">
                    <Info className="h-5 w-5 text-primary flex-shrink-0" /> {/* Changed icon for pending */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{item.evento}</p>
                      <p className="text-xs text-muted-foreground truncate">Cliente: {item.cliente}</p>
                    </div>
                  </div>
                )) : (
                   <p className="text-muted-foreground py-4 text-center">No hay eventos pendientes.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-xl">Resumen Financiero</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1 rounded-lg bg-muted/30 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-muted-foreground">Costo Estimado Total</h3>
                </div>
                <p className="text-2xl font-semibold text-foreground">$13.500</p>
              </div>
              <div className="flex flex-col gap-1 rounded-lg bg-muted/30 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-muted-foreground">Pagos Pendientes</h3>
                </div>
                <p className="text-2xl font-semibold text-foreground">$4.200</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column / Calendar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-xl">Calendario</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center p-2 sm:p-4"> {/* Adjusted padding */}
              <Calendar
                mode="single"
                defaultMonth={new Date(2024, 3, 1)} // Default to April 2024 for consistency with static title
                className="p-0 rounded-md border shadow-sm" // Added border and shadow to calendar itself
                classNames={{
                  caption_label: "text-base font-medium", // Slightly larger caption
                  head_cell: "w-8 h-8 sm:w-9 sm:h-9 text-xs sm:text-sm", // Responsive head cells
                  cell: "w-8 h-8 sm:w-9 sm:h-9 text-xs sm:text-sm", // Responsive cells
                  day: "w-8 h-8 sm:w-9 sm:h-9", // Responsive day
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
