import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Calendar, Gift, Mail, Phone, ArrowUpRight, Search, Users, PartyPopper } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function CRMPredictivoPage() {
  // Mock data for the CRM Leads
  const mockLeads = [
    { id: '1', nombre: 'Martín Soler', contacto: 'martin@ejemplo.com', fechaNacimiento: '1990-08-15', fiestaOrigen: 'Boda Ana & Juan', fechaCaptura: '2025-10-10' },
    { id: '2', nombre: 'Lucía Gómez', contacto: '099123456', fechaNacimiento: '1995-11-02', fiestaOrigen: '15 de Sofía', fechaCaptura: '2025-11-20' },
    { id: '3', nombre: 'Carlos Ruiz', contacto: 'carlos.r@ejemplo.com', fechaNacimiento: '1985-06-30', fiestaOrigen: 'Empresarial Globant', fechaCaptura: '2025-12-05' },
    { id: '4', nombre: 'Camila Torres', contacto: '098765432', fechaNacimiento: '2008-01-12', fiestaOrigen: '15 de Sofía', fechaCaptura: '2025-11-20' },
  ];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-headline font-black tracking-tight text-slate-800">
            CRM Predictivo
          </h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <Gift className="w-4 h-4 text-pink-500" />
            Captación de leads automáticos a través del portal de invitados
          </p>
        </div>
        <Button className="h-12 px-6 rounded-xl bg-pink-600 hover:bg-pink-700 shadow-lg shadow-pink-600/20 font-bold">
          <Mail className="w-4 h-4 mr-2" />
          Campaña de Emailing
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-xl rounded-3xl bg-gradient-to-br from-pink-500 to-rose-600 text-white overflow-hidden relative">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
            <Users className="w-48 h-48 -mt-8 -mr-8" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-pink-100">Leads Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-black">{mockLeads.length}</div>
            <p className="text-sm text-pink-100 mt-2 font-medium flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4" /> +4 capturados este mes
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-3xl bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Próximos Cumpleaños</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-black text-slate-800">2</div>
            <p className="text-sm text-amber-500 mt-2 font-bold flex items-center gap-1">
              <PartyPopper className="w-4 h-4" /> Festejan en los próximos 30 días
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-3xl bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Fiesta más rentable (Leads)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800 truncate">15 de Sofía</div>
            <p className="text-sm text-indigo-500 mt-2 font-bold flex items-center gap-1">
              <Users className="w-4 h-4" /> 2 contactos nuevos
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl rounded-[2rem] bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 p-6 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="text-xl font-bold text-slate-800">Base de Datos de Cumpleaños</CardTitle>
            <p className="text-sm text-slate-500">Contactos recolectados mediante sorteos en vivo.</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Buscar por nombre..." className="pl-9 h-10 rounded-xl bg-white border-slate-200" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-slate-500 uppercase text-xs tracking-wider">Nombre</TableHead>
                <TableHead className="font-bold text-slate-500 uppercase text-xs tracking-wider">Contacto</TableHead>
                <TableHead className="font-bold text-slate-500 uppercase text-xs tracking-wider">Cumpleaños</TableHead>
                <TableHead className="font-bold text-slate-500 uppercase text-xs tracking-wider">Origen</TableHead>
                <TableHead className="font-bold text-slate-500 uppercase text-xs tracking-wider text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockLeads.map((lead) => (
                <TableRow key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-semibold text-slate-800">{lead.nombre}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-slate-600 text-sm">
                      {lead.contacto.includes('@') ? <Mail className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
                      {lead.contacto}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Calendar className="w-4 h-4 text-pink-500" />
                      {new Date(lead.fechaNacimiento).toLocaleDateString('es-UY', { day: '2-digit', month: 'long' })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-medium">
                      {lead.fiestaOrigen}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-pink-600 hover:text-pink-700 hover:bg-pink-50 rounded-lg">
                      Contactar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
