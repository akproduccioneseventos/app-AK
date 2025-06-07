import type { Presupuesto } from '@/types/presupuesto';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface PresupuestoCardProps {
  presupuesto: Presupuesto;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
};

export default function PresupuestoCard({ presupuesto }: PresupuestoCardProps) {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow flex flex-col justify-between">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-primary">{presupuesto.clienteNombre}</CardTitle>
        <CardDescription>
          {presupuesto.eventoTipo} - {formatDate(presupuesto.eventoFecha)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-sm text-muted-foreground">Invitados: {presupuesto.invitadosCantidad}</p>
        <p className="text-lg font-semibold">{formatCurrency(presupuesto.costoTotalEstimado)}</p>
        {presupuesto.estado && <p className="text-xs"><span className={`px-2 py-0.5 rounded-full ${presupuesto.estado === 'Aceptado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{presupuesto.estado}</span></p>}
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-4">
        <Link href={`/presupuestos/${presupuesto.id}/ver`} passHref>
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-1" /> Ver
          </Button>
        </Link>
        <Link href={`/presupuestos/${presupuesto.id}/editar`} passHref>
          <Button variant="secondary" size="sm">
            <Edit className="w-4 h-4 mr-1" /> Editar
          </Button>
        </Link>
        {/* <Button variant="destructive" size="sm">
          <Trash2 className="w-4 h-4 mr-1" /> Eliminar
        </Button> */}
      </CardFooter>
    </Card>
  );
}
