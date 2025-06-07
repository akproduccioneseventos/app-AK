
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import type { Customer } from '@/types/customer';

// Mock customer data based on the provided image
const mockCustomers: Customer[] = [
  { 
    id: 'cust_1', 
    companyName: '2A SERVICIOS AUDIOVISUALES S.L.', 
    email: 'administracion@2aproducciones.com', 
    phone: '+34 918729072',
    taxId: 'B85333874',
    address: { 
      street: 'C/ CAÑADA REAL DE LA MERINERA 19 P.I. EL GUIJAR', 
      city: 'ARGANDA DEL REY', 
      state: 'MADRID', 
      zipCode: '28500', 
      country: 'ESPAÑA'
    }
  },
  { 
    id: 'cust_2', 
    companyName: 'ABBA TRANSLATION SL', 
    email: undefined, 
    phone: '+34 917021038',
    taxId: 'B83622025',
    address: { 
      street: 'PASEO DE LA CASTELLANA 40, 8 PLANTA', 
      city: 'MADRID', 
      zipCode: '28046', 
      country: 'ESPAÑA'
    }
  },
  { 
    id: 'cust_3', 
    companyName: 'ADOLFO DOMINGUEZ S.A.', 
    email: undefined, 
    phone: '+34 915097000',
    taxId: 'A32023539',
    address: { 
      street: 'CALLE CUATRO 5 POLIGONO INDUSTRIAL SAN CIPRIAN', 
      city: 'SAN CIPRIAN DE VIÑAS', 
      state: 'OURENSE', 
      zipCode: '32911', 
      country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_4',
    companyName: 'AG PRODUCCIONES S.L.',
    email: 'info@agproducciones.com',
    phone: '+34 934876660',
    taxId: 'B64726594',
    address: {
      street: 'RAMBLA DE CATALUÑA 115 BIS, 3 PLANTA',
      city: 'BARCELONA',
      zipCode: '08008',
      country: 'ESPAÑA',
    }
  },
  {
    id: 'cust_5',
    companyName: 'AI ASESORES Y CONSULTORES DE EMPRESAS S.L.',
    email: 'fiscal3@aiasesores.com',
    phone: '+34 914111030',
    taxId: 'B85499972',
    address: {
      street: 'C/ SANCHEZ PACHECO 83 BAJO',
      city: 'MADRID',
      zipCode: '28002',
      country: 'ESPAÑA',
    }
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
                          <Button variant="outline" size="icon" aria-label={`Editar Cliente ${customer.companyName || customer.name}`}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button variant="destructive" size="icon" aria-label={`Eliminar Cliente ${customer.companyName || customer.name}`}>
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
