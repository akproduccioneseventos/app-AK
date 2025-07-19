
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CalendarDays, CircleDollarSign, Settings, Building2, PlusCircle, FileText as FileTextIcon, CalendarClock, Briefcase, CheckCircle, TrendingUp, Banknote, Users, LogOut, Sparkles, Wand2, Bot } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { useToast } from '@/hooks/use-toast';
import { triggerAppLogout } from '@/components/auth-guard';
import { AkAssistant } from '@/components/asistente-ak/AkAssistant';
import { ShareLinkDialog } from '@/components/dashboard/ShareLinkDialog';
import { getDashboardKpiData } from '@/app/actions/dashboard'; // Import the new optimized action

interface ModuleCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
}

const modules: ModuleCardProps[] = [
  { title: "Planificador de fiestas", description: "Visualiza y organiza todos tus eventos, el actual y los pasados.", href: "/eventos", icon: CalendarDays },
  { title: "Contabilidad y CRM", description: "Gestiona presupuestos, facturas, pagos y tu embudo de ventas.", href: "/empresa/contabilidad", icon: CircleDollarSign },
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
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
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
  
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [armadoRapidoLink, setArmadoRapidoLink] = useState('');
  const [asistenteAkLink, setAsistenteAkLink] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setArmadoRapidoLink(`${window.location.origin}/armado-rapido`);
      setAsistenteAkLink(`${window.location.origin}/asistente-ak`);
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getDashboardKpiData(); // Use the new optimized action
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
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight font-headline text-foreground mb-1">¡Bienvenido a tu Centro de Gestión!</h2>
          <p className="text-lg text-muted-foreground">Un resumen de tu actividad y accesos directos.</p>
        </div>
        <Button onClick={handleLogoutClick} variant="outline" size="lg" className="rounded-full px-6 py-5 text-base shadow-sm w-full sm:w-auto">
            <LogOut className="w-5 h-5 mr-2" /> Cerrar Sesión
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl">Creación de Presupuestos</CardTitle>
          <CardDescription>Elige el método que mejor se adapte a tus necesidades y las de tu cliente.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/presupuestos/nuevo" passHref className="w-full">
                <Button size="lg" variant="default" className="w-full h-full text-base py-4 flex-col gap-1">
                    <PlusCircle className="w-6 h-6 mb-1"/>
                    <span>Presupuesto Manual</span>
                    <span className="text-xs font-normal">(Para el Organizador)</span>
                </Button>
            </Link>
            <ShareLinkDialog
                link={armadoRapidoLink}
                title="Compartir Armado Rápido"
                description="Copia este enlace y envíalo a tu cliente para que arme un presupuesto inicial de forma guiada."
            >
                <Button size="lg" variant="outline" className="w-full h-full text-base py-4 flex-col gap-1">
                    <Wand2 className="w-6 h-6 mb-1"/>
                    <span>Armado Rápido</span>
                    <span className="text-xs font-normal">(Para el Cliente)</span>
                </Button>
            </ShareLinkDialog>
             <ShareLinkDialog
                link={asistenteAkLink}
                title="Compartir Asistente Conversacional"
                description="Copia este enlace para que tu cliente cree un presupuesto conversando con la IA."
            >
             <Button size="lg" variant="outline" className="w-full h-full text-base py-4 flex-col gap-1">
                <Bot className="w-6 h-6 mb-1"/>
                <span>Asistente AK</span>
                 <span className="text-xs font-normal">(Para el Cliente)</span>
            </Button>
            </ShareLinkDialog>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <KpiCard title="Clientes Activos" value={kpiData.clientesActivos} icon={Users} isLoading={isLoading} description="Clientes con estado 'Actual'." />
        <KpiCard title="Prospectos Activos" value={kpiData.prospectosActivos} icon={Briefcase} isLoading={isLoading} description="Presupuestos enviados o en borrador." />
        <KpiCard title="Fiestas Futuras" value={kpiData.fiestasFuturas} icon={CheckCircle} isLoading={isLoading} description="Eventos en planificación actual." />
        <KpiCard title="Fiestas Pasadas" value={kpiData.fiestasPasadas} icon={CalendarClock} isLoading={isLoading} description="Eventos completados y archivados." />
        <KpiCard title="Saldo Pendiente General" value={formatCurrency(kpiData.totalPendiente)} icon={Banknote} isLoading={isLoading} description="De todas las facturas no saldadas." className="bg-primary/5 border-primary/20"/>
      </div>
      
      <Separator />

      <div className="pt-4">
        <h3 className="text-2xl font-semibold text-foreground mb-4 font-headline text-center">Módulos Principales</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((module) => (
            <ModuleCard key={module.title} {...module} />
          ))}
        </div>
      </div>
      <AkAssistant isOpen={isAssistantOpen} setIsOpen={setIsAssistantOpen} />
    </div>
  );
}
