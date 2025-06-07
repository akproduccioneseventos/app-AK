import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import type { Customer } from '@/types/customer';

// Mock customer data with more details
const mockCustomers: Customer[] = [
  { 
    id: 'cust_1', 
    name: 'Ana García Pérez', 
    email: 'ana.garcia@example.com', 
    phone: '+34 611223344',
    companyName: 'Soluciones Creativas S.L.',
    taxId: 'B12345678',
    address: { street: 'Calle de la Innovación 123', city: 'Madrid', zipCode: '28001', country: 'España'}
  },
  { 
    id: 'cust_2', 
    name: 'Luis Fernández', 
    email: 'luis.fernandez@email.com', 
    phone: '+34 699887766',
    companyName: 'TecnoAvanzada Ltda.',
    taxId: 'A87654321',
    address: { street: 'Avenida de la Tecnología 45', city: 'Barcelona', zipCode: '08001', country: 'España'}
  },
  { 
    id: 'cust_3', 
    name: 'Eventos AKM (Contacto: Marta Soler)', 
    email: 'info@eventosakm.com',
    phone: '+34 912345678',
    companyName: 'Eventos AKM',
    taxId: 'G12345670',
    address: { street: 'Plaza Mayor 1', city: 'Sevilla', zipCode: '41001', country: 'España'}
  },
];


export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Gestión de Clientes
        </h1>
        <Link href="/customers/new" passHref>
          <Button>
            <UserPlus className="w-5 h-5 mr-2" />
            Añadir Cliente
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Listado de Clientes</CardTitle>
          <CardDescription>Consulta y gestiona la información de tus clientes.</CardDescription>
        </CardHeader>
        <CardContent>
          {mockCustomers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre / Empresa</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>NIF/CIF</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.companyName || customer.name}</TableCell>
                    <TableCell>{customer.email || '-'}</TableCell>
                    <TableCell>{customer.phone || '-'}</TableCell>
                    <TableCell>{customer.taxId || '-'}</TableCell>
                    <TableCell>{customer.address?.city || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/customers/${customer.id}/edit`} passHref>
                          <Button variant="outline" size="icon" aria-label="Editar Cliente">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button variant="destructive" size="icon" aria-label="Eliminar Cliente">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
             <div className="py-10 text-center">
              <p className="text-muted-foreground">No tienes clientes guardados todavía.</p>
              <Link href="/customers/new" passHref>
                <Button className="mt-4">Añadir Primer Cliente</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
