
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CalendarDays, BarChart3, Settings, Building2, PlusCircle, FileText as FileTextIcon, CalendarClock, Briefcase, CheckCircle, TrendingUp, Banknote, Users, LogOut, Sparkles, Wand2, Bot, Share2, Eye } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { useToast } from '@/hooks/use-toast';
import { triggerAppLogout } from '@/components/auth-guard';
import { ShareLinkDialog } from '@/components/dashboard/ShareLinkDialog';
import { getDashboardKpiData } from '@/app/actions/dashboard'; 

interface ModuleCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
}

const modules: ModuleCardProps[] = [
  { title: "Gestor de Eventos", description: "Visualiza y organiza todos tus eventos, el actual y los pasados.", href: "/eventos", icon: CalendarDays },
  { title: "Contabilidad y Finanzas", description: "Accede al CRM, presupuestos, facturas y reportes.", href: "/empresa/contabilidad", icon: BarChart3 },
  { title: "Gestión de Empresa", description: "Administra personal, proveedores y tu catálogo de servicios.", href: "/empresa", icon: Building2 },
  { title: "Configuración General", description: "Ajusta las preferencias de la aplicación y plantillas de documentos.", href: "/settings", icon: Settings },
];

const ModuleCard: React.FC<ModuleCardProps> = ({ title, description, href, icon: Icon }) => (
    <Link href={href} className="group flex flex-col h-full no-underline">
    <Card className="flex flex-col h-full shadow-md hover:shadow-xl hover:border-primary/50 transition-all duration-300 ease-in-out transform hover:-translate-y-1 cursor-pointer w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-primary/10 rounded-lg">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="font-headline text-lg text-foreground group-hover:text-primary transition-colors">
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium text-primary group-hover:underline">
            Acceder al Módulo <ArrowRight className="w-4 h-4 ml-1" />
        </div>
      </CardFooter>
    </Card>
  </Link>
);

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return "N/A";
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function DashboardPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [kpiData, setKpiData] = useState({
    fiestasPasadas: 0,
    fiestasFuturas: 0,
    clientesActivos: 0,
    prospectosActivos: 0,
    totalPendiente: 0,
  });
  
  const [simuladorLink, setSimuladorLink] = useState('');


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      setSimuladorLink(`${origin}/armado-rapido`);
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getDashboardKpiData(); 
      if (result.success && result.data) {
        setKpiData(result.data);
      } else {
        throw new Error(result.error || "Failed to fetch dashboard data.");
      }
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      toast({ title: "Error de Carga", description: "No se pudieron cargar los datos del dashboard.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleLogoutClick = () => {
    triggerAppLogout();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight font-headline text-foreground mb-1">
            AK Producciones
          </h2>
          <p className="text-lg text-muted-foreground">Servicio integral de fiestas</p>
        </div>
        <Button onClick={handleLogoutClick} variant="outline" size="lg" className="rounded-full px-6 py-5 text-base shadow-sm w-full sm:w-auto">
            <LogOut className="w-5 h-5 mr-2" /> Cerrar Sesión
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <KpiCard title="Clientes Activos" value={kpiData.clientesActivos} icon={Users} isLoading={isLoading} description="Clientes con estado 'Actual'." />
        <KpiCard title="Prospectos Activos" value={kpiData.prospectosActivos} icon={Briefcase} isLoading={isLoading} description="Presupuestos enviados o en borrador." />
        <KpiCard title="Fiestas Futuras" value={kpiData.fiestasFuturas} icon={CheckCircle} isLoading={isLoading} description="Eventos en planificación activa." />
        <KpiCard title="Fiestas Pasadas" value={kpiData.fiestasPasadas} icon={CalendarClock} isLoading={isLoading} description="Eventos completados y archivados." />
        <KpiCard title="Saldo Pendiente General" value={formatCurrency(kpiData.totalPendiente)} icon={Banknote} isLoading={isLoading} description="De todas las facturas no saldadas." className="bg-primary/5 border-primary/20"/>
      </div>
      
      <Separator />

      <div className="pt-4">
        <h3 className="text-2xl font-semibold text-foreground mb-4 font-headline text-center">Módulos Principales</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <ModuleCard key={module.title} {...module} />
          ))}
           <Card className="flex flex-col shadow-md hover:shadow-xl transition-shadow duration-300 border-dashed border-primary/50">
                <CardHeader className="flex-row items-start gap-4 space-y-0 pb-3">
                    <div className="p-3 bg-primary/10 rounded-lg"><Wand2 className="w-7 h-7 text-primary"/></div>
                    <div><CardTitle className="font-headline text-lg mb-1">Simulador para Clientes</CardTitle></div>
                </CardHeader>
                <CardContent className="flex-grow space-y-2"><p className="text-sm text-muted-foreground">Una herramienta pública para que tus clientes armen un presupuesto estimado.</p></CardContent>
                <CardFooter className="pt-2 flex flex-col gap-2">
                   <Link href="/armado-rapido" passHref className="w-full" target="_blank">
                      <Button variant="default" className="w-full"><Eye className="w-4 h-4 mr-2"/>Ir al Simulador</Button>
                   </Link>
                   <div className="flex gap-2 w-full">
                    <Link href="/settings/budget-display" passHref className="flex-1"><Button variant="secondary" className="w-full">Configurar</Button></Link>
                    <ShareLinkDialog link={simuladorLink} title="Compartir Simulador" description="Comparte este enlace para que tus clientes puedan generar un presupuesto estimado.">
                        <Button variant="outline" className="w-full">Compartir</Button>
                    </ShareLinkDialog>
                   </div>
                </CardFooter>
            </Card>
        </div>
      </div>
    </div>
  );
}
