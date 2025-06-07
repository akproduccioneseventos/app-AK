
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
  {
    id: 'cust_6',
    companyName: 'ALBERTO ROSELLOT GARRIGA',
    email: undefined,
    phone: '+34 913118343',
    taxId: '00717994F',
    address: {
        street: 'CALLE ALCALA 286 ESCALERA 1 - PISO 2B',
        city: 'MADRID',
        zipCode: '28027',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_7',
    companyName: 'ALEJANDRA SILVA GARCIA-BAQUERO',
    email: undefined,
    phone: '+34 609005511',
    taxId: 'Y0108365R',
    address: {
        street: 'CALLE DEL MARQUES DE LA VALDAVIA, 13 3ºB',
        city: 'MADRID',
        zipCode: '28012',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_8',
    companyName: 'ALERTS SL',
    email: undefined,
    phone: '+34 914448888',
    taxId: 'B84444323',
    address: {
        street: 'AVDA DE BRASIL 29 1º',
        city: 'MADRID',
        zipCode: '28020',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_9',
    companyName: 'ALFASOM DOS, S.L.',
    email: undefined,
    phone: '+34 913690208',
    taxId: 'B82787161',
    address: {
        street: 'C/ MARQUES DE VALDEIGLESIAS 5 BAJO',
        city: 'MADRID',
        zipCode: '28004',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_10',
    companyName: 'ALL STAFF EVENTOS Y PROMOCIONES S.L.',
    email: undefined,
    phone: '+34 914112238',
    taxId: 'B82887235',
    address: {
        street: 'C/ DIEGO DE LEON 12 2 IZDA',
        city: 'MADRID',
        zipCode: '28006',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_11',
    companyName: 'AM SISTEMAS DE INFORMACION SL',
    email: 'info@amsistemas.es',
    phone: '+34 915558314',
    taxId: 'B82622574',
    address: {
        street: 'AVDA REINA VICTORIA 13 BAJO',
        city: 'MADRID',
        zipCode: '28003',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_12',
    companyName: 'AMADEUS IT GROUP SA',
    email: undefined,
    phone: '+34 915821900',
    taxId: 'A84077239',
    address: {
        street: 'C/SALVADOR DE MADARIAGA 1',
        city: 'MADRID',
        zipCode: '28027',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_13',
    companyName: 'AMBLAGAR S.L.',
    email: undefined,
    phone: '+34 913596112',
    taxId: 'B80610465',
    address: {
        street: 'PASEO DE LA CASTELLANA 163 14-E',
        city: 'MADRID',
        zipCode: '28046',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_14',
    companyName: 'AMP VISUAL TV SPAIN S.L.',
    email: 'contabilidad.spain@ampvisualtv.tv',
    phone: '+34 935897077',
    taxId: 'B64558336',
    address: {
        street: 'C/ GURB,19',
        city: 'BARCELONA',
        zipCode: '08029',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_15',
    companyName: 'ANA SANCHEZ BUENO',
    email: undefined,
    phone: '+34 669225577',
    taxId: '53172062X',
    address: {
        street: 'CALLE ORENSE 29, 8º D',
        city: 'MADRID',
        zipCode: '28020',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_16',
    companyName: 'AP INTERNATIONAL EVENTS S.L.',
    email: 'operaciones@apinternationalevents.com',
    phone: '+34 911294269',
    taxId: 'B86612413',
    address: {
        street: 'AVENIDA DE BRASIL, 17 - PLANTA 12',
        city: 'MADRID',
        zipCode: '28020',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_17',
    companyName: 'APLICACIONES EN INFORMATICA AVANZADA S.L',
    email: undefined,
    phone: '+34 913004488',
    taxId: 'B82198633',
    address: {
        street: 'AVDA. MANZANARES, 160 LOCAL',
        city: 'MADRID',
        zipCode: '28026',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_18',
    companyName: 'APR PRODUCCIONES, S.L.',
    email: 'admon@aprproducciones.com',
    phone: '+34 913800385',
    taxId: 'B82893472',
    address: {
        street: 'C/ LUIS BUÑUEL, 2',
        city: 'POZUELO DE ALARCON',
        state: 'MADRID',
        zipCode: '28223',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_19',
    companyName: 'AR SYSTEM INTEGRATION, S.L.U.',
    email: 'administracion@arsystem.es',
    phone: '+34 914050313',
    taxId: 'B82112295',
    address: {
        street: 'C/ ALCALA, 432',
        city: 'MADRID',
        zipCode: '28027',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_20',
    companyName: 'ARENA MEDIA COMMUNICATIONS ESPAÑA SA',
    email: undefined,
    phone: '+34 914367600',
    taxId: 'A82774870',
    address: {
        street: 'PASEO DE LA CASTELLANA 81 PTA 19',
        city: 'MADRID',
        zipCode: '28046',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_21',
    companyName: 'ARGENTINA MARKETING Y PROMOCION TURISTICA SL',
    email: undefined,
    phone: '+34 917703310',
    taxId: 'B84905985',
    address: {
        street: 'C/ GRAN VIA, 86 GRUPO 309',
        city: 'MADRID',
        zipCode: '28013',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_22',
    companyName: 'ARTE Y DISEÑO EN INTERNET S.L.',
    email: undefined,
    phone: '+34 917451287',
    taxId: 'B83585305',
    address: {
        street: 'C/ MANUEL MARIA IGLESIAS, 7 - BAJO',
        city: 'MADRID',
        zipCode: '28043',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_23',
    companyName: 'ARTENET COMUNICACION S.L.',
    email: undefined,
    phone: '+34 913079909',
    taxId: 'B82921166',
    address: {
        street: 'C/ JUAN IGNACIO LUCA DE TENA 7',
        city: 'MADRID',
        zipCode: '28027',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_24',
    companyName: 'ASOCIACION CULTURAL AMIGOS DE ELTON JOHN',
    email: undefined,
    phone: undefined,
    taxId: 'G86004210',
    address: {
        street: 'C/ FRANCISCO NAVACERRADA, 41, 6ºA',
        city: 'MADRID',
        zipCode: '28028',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_25',
    companyName: 'ASOCIACION DE BALONCESTO COLEGIAL',
    email: 'pablo@mensmedia.com',
    phone: '+34 913845810',
    taxId: 'G84129152',
    address: {
        street: 'PASEO DE LA CASTELLANA 95 EDIF.TORRE EUROPA PL.14',
        city: 'MADRID',
        zipCode: '28046',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_26',
    companyName: 'ASOCIACION DE CLINICAS PRIVADAS DE LA COMUNIDAD DE MADRID',
    email: undefined,
    phone: '+34 914009596',
    taxId: 'G78790731',
    address: {
        street: 'C/ ORENSE, 25 - 1º B',
        city: 'MADRID',
        zipCode: '28020',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_27',
    companyName: 'ASOCIACION DE EMPRESARIOS DE HOSTELERIA DE LA COMUNIDAD DE MADRID LA VIÑA',
    email: undefined,
    phone: '+34 914680161',
    taxId: 'G28643242',
    address: {
        street: 'RONDA DE TOLEDO, 10',
        city: 'MADRID',
        zipCode: '28005',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_28',
    companyName: 'ASOCIACION DE TENISTAS PROFESIONALES',
    email: 'admon@atptour.com',
    phone: '+37 797978384',
    taxId: 'N0014496E',
    address: {
        street: 'LE PANORAMA 57 RUE GRIMALDI',
        city: 'MONACO',
        zipCode: '98000',
        country: 'MONACO'
    }
  },
  {
    id: 'cust_29',
    companyName: 'ASOCIACION ESPAÑOLA CONTRA EL CANCER',
    email: undefined,
    phone: '+34 913108190',
    taxId: 'G28197564',
    address: {
        street: 'C/ AMADOR DE LOS RIOS 5',
        city: 'MADRID',
        zipCode: '28010',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_30',
    companyName: 'ASOCIACION ESPAÑOLA DE CAPITAL, CRECIMIENTO E INVERSION (ASCRI)',
    email: 'info@webcapitalriesgo.com',
    phone: '+34 912290000',
    taxId: 'G78773182',
    address: {
        street: 'Pº CASTELLANA, 141 - EDIFICIO CUZCO IV - PLANTA 20',
        city: 'MADRID',
        zipCode: '28046',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_31',
    companyName: 'ASOCIACION ESPAÑOLA DE EMPRESAS DE CONSULTORIA',
    email: undefined,
    phone: '+34 915630163',
    taxId: 'G28972393',
    address: {
        street: 'LAGASCA 88',
        city: 'MADRID',
        zipCode: '28001',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_32',
    companyName: 'ASOCIACION ESPAÑOLA DE FABRICANTES DE AUTOMOVILES Y CAMIONES - ANFAC',
    email: undefined,
    phone: '+34 915623022',
    taxId: 'G28592650',
    address: {
        street: 'JOSE ABASCAL, 57 - 3º',
        city: 'MADRID',
        zipCode: '28003',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_33',
    companyName: 'ASOCIACION ESPAÑOLA DE PERIODISTAS Y ESCRITORES DEL VINO',
    email: undefined,
    phone: '+34 915353267',
    taxId: 'G28998125',
    address: {
        street: 'C/ GUZMAN EL BUENO, 133 - 5º B',
        city: 'MADRID',
        zipCode: '28003',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_34',
    companyName: 'ASOCIACION ESPAÑOLA DE VIDEOJUEGOS (AEVI)',
    email: 'jose.maria@aevi.org.es',
    phone: '+34 913081832',
    taxId: 'G83545461',
    address: {
        street: 'C/ RAFAEL CALVO, 18 - 4º C',
        city: 'MADRID',
        zipCode: '28010',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_35',
    companyName: 'ASOCIACION ESPAÑOLA DEL LUJO',
    email: 'info@luxuryspain.es',
    phone: '+34 937987019',
    taxId: 'G65451067',
    address: {
        street: 'C/ TUSET, 8-10, 6º 3ª',
        city: 'BARCELONA',
        zipCode: '08006',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_36',
    companyName: 'ASOCIACION ESPAÑOLA PARA LA DIGITALIZACION - DIGITALES',
    email: 'info@digitales.es',
    phone: '+34 913456317',
    taxId: 'G28272904',
    address: {
        street: 'Pº DE LA CASTELLANA, 121 - ESC. IZDA. - 7ª PTA.',
        city: 'MADRID',
        zipCode: '28046',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_37',
    companyName: 'ASOCIACION NACIONAL DE PERFUMERIA Y COSMETICA (STANPA)',
    email: undefined,
    phone: '+34 915711640',
    taxId: 'G28584699',
    address: {
        street: 'C/ ROSARIO PINO, 14 - 5º',
        city: 'MADRID',
        zipCode: '28020',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_38',
    companyName: 'AUDIO MADRID, S.L.',
    email: 'audiomad@audiomadrid.com',
    phone: '+34 917255000',
    taxId: 'B78502720',
    address: {
        street: 'C/ EMILIO MUÑOZ, 49 NAVE 10',
        city: 'MADRID',
        zipCode: '28037',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_39',
    companyName: 'AUDIOVISUAL SPAIN PRODUCCIONES, S.L.',
    email: undefined,
    phone: '+34 915102011',
    taxId: 'B84598604',
    address: {
        street: 'C/ SANTIAGO DE COMPOSTELA, 100 BAJO',
        city: 'MADRID',
        zipCode: '28035',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_40',
    companyName: 'AUXI ART ESTILISTAS, S.L.',
    email: undefined,
    phone: '+34 915643158',
    taxId: 'B82906415',
    address: {
        street: 'C/ CORAZON DE MARIA, 60 POST.',
        city: 'MADRID',
        zipCode: '28002',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_41',
    companyName: 'AV MEDIAPRO, S.L.',
    email: 'dpto.proveedores@mediapro.es',
    phone: '+34 917285700',
    taxId: 'B60183398',
    address: {
        street: 'C/ VIRGILIO, 8 - CIUDAD DE LA IMAGEN',
        city: 'POZUELO DE ALARCON',
        state: 'MADRID',
        zipCode: '28223',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_42',
    companyName: 'AVANT COMUNICACION S.L.',
    email: 'avant@avantcomunicacion.com',
    phone: '+34 915310982',
    taxId: 'B84197704',
    address: {
        street: 'C/ MONTESA 35-37 ESC. DCHA. OF. 2-A',
        city: 'MADRID',
        zipCode: '28006',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_43',
    companyName: 'B&B AUDIOTECA S.L.',
    email: undefined,
    phone: '+34 913004511',
    taxId: 'B81938338',
    address: {
        street: 'AVDA MANZANARES 158',
        city: 'MADRID',
        zipCode: '28026',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_44',
    companyName: 'BABEL SISTEMAS DE INFORMACION S.L.',
    email: undefined,
    phone: '+34 915004770',
    taxId: 'B83618460',
    address: {
        street: 'C/ ORENSE, 69 - 11º',
        city: 'MADRID',
        zipCode: '28020',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_45',
    companyName: 'BAMBOLEO ESPECTACULOS S.L.',
    email: undefined,
    phone: '+34 915472211',
    taxId: 'B82798788',
    address: {
        street: 'C/ VENTURA RODRIGUEZ 16 5º IZDA',
        city: 'MADRID',
        zipCode: '28008',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_46',
    companyName: 'BANCO SANTANDER S.A.',
    email: undefined,
    phone: '+34 912573000',
    taxId: 'A28023453',
    address: {
        street: 'CIUDAD GRUPO SANTANDER AVDA.CANTABRIA S/N',
        city: 'BOADILLA DEL MONTE',
        state: 'MADRID',
        zipCode: '28660',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_47',
    companyName: 'BARCLAYS BANK, S.A.',
    email: undefined,
    phone: '+34 913361000',
    taxId: 'A78598999',
    address: {
        street: 'PLAZA DE COLON 1',
        city: 'MADRID',
        zipCode: '28046',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_48',
    companyName: 'BE CALM MEDIA SL',
    email: 'info@becalmmedia.com',
    phone: '+34 609005511',
    taxId: 'B87324611',
    address: {
        street: 'C/ OÑA, 171',
        city: 'MADRID',
        zipCode: '28050',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_49',
    companyName: 'BE THE ONE MANAGEMENT SL',
    email: undefined,
    phone: '+34 915211638',
    taxId: 'B85208364',
    address: {
        street: 'C/ DESENGAÑO 12 3º 2',
        city: 'MADRID',
        zipCode: '28004',
        country: 'ESPAÑA'
    }
  },
  {
    id: 'cust_50',
    companyName: 'BEAM HARMONY S.L.',
    email: undefined,
    phone: '+34 917217800',
    taxId: 'B81885091',
    address: {
        street: 'AVDA DE LA INDUSTRIA 51',
        city: 'TRES CANTOS',
        state: 'MADRID',
        zipCode: '28760',
        country: 'ESPAÑA'
    }
  }
  // Continuar añadiendo más clientes según sea necesario o si se proporciona el resto de la lista.
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre / Empresa</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>NIF/CIF</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead>Ciudad</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium min-w-[250px]">{customer.companyName || customer.name}</TableCell>
                      <TableCell className="min-w-[200px]">{customer.email || '-'}</TableCell>
                      <TableCell className="min-w-[150px]">{customer.phone || '-'}</TableCell>
                      <TableCell className="min-w-[120px]">{customer.taxId || '-'}</TableCell>
                      <TableCell className="min-w-[300px]">{customer.address?.street || '-'}</TableCell>
                      <TableCell className="min-w-[150px]">{customer.address?.city || '-'}</TableCell>
                      <TableCell className="text-right min-w-[120px]">
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
            </div>
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

    