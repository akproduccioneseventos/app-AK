
'use client';

import { useState, type FormEvent, type ChangeEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Users, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

type RsvpStatus = 'Pendiente' | 'Confirmado' | 'Rechazado' | 'Quizás';

interface Invitado {
  id: string;
  nombre: string;
  contacto?: string; // Email o teléfono
  rsvp: RsvpStatus;
}

export default function InvitadosEventoPage() {
  const { toast } = useToast();
  const [invitados, setInvitados] = useState<Invitado[]>([
    { id: '1', nombre: 'Juan Pérez', contacto: 'juan@example.com', rsvp: 'Confirmado' },
    { id: '2', nombre: 'Ana García', rsvp: 'Pendiente' },
    { id: '3', nombre: 'Luis Fernández', contacto: '600111222', rsvp: 'Rechazado' },
  ]);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoContacto, setNuevoContacto] = useState('');

  const handleAddInvitado = (e: FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) {
      toast({
        title: "Nombre Requerido",
        description: "Por favor, ingresa el nombre del invitado.",
        variant: "destructive",
      });
      return;
    }
    const nuevoInvitado: Invitado = {
      id: Date.now().toString(),
      nombre: nuevoNombre.trim(),
      contacto: nuevoContacto.trim() || undefined,
      rsvp: 'Pendiente',
    };
    setInvitados(prev => [nuevoInvitado, ...prev]);
    setNuevoNombre('');
    setNuevoContacto('');
    toast({
      title: "Invitado Añadido",
      description: `${nuevoInvitado.nombre} ha sido añadido a la lista.`,
    });
  };

  const handleRsvpChange = (invitadoId: string, newRsvp: RsvpStatus) => {
    setInvitados(prev =>
      prev.map(inv => (inv.id === invitadoId ? { ...inv, rsvp: newRsvp } : inv))
    );
  };

  const handleDeleteInvitado = (invitadoId: string) => {
    const invitadoAEliminar = invitados.find(inv => inv.id === invitadoId);
    setInvitados(prev => prev.filter(inv => inv.id !== invitadoId));
    if (invitadoAEliminar) {
      toast({
        title: "Invitado Eliminado",
        description: `${invitadoAEliminar.nombre} ha sido eliminado de la lista.`,
        variant: "destructive",
      });
    }
  };

  const getRsvpCounts = () => {
    const counts = { Pendiente: 0, Confirmado: 0, Rechazado: 0, Quizás: 0, Total: invitados.length };
    invitados.forEach(inv => {
      counts[inv.rsvp]++;
    });
    return counts;
  };

  const rsvpCounts = getRsvpCounts();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Gestión de Invitados
        </h1>
        <Link href="/fiestas/nueva" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Planificador
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Añadir Nuevo Invitado</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddInvitado} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre-invitado">Nombre Completo del Invitado</Label>
              <Input
                id="nombre-invitado"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                placeholder="Ej: Laura Martínez"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contacto-invitado">Email o Teléfono (Opcional)</Label>
              <Input
                id="contacto-invitado"
                value={nuevoContacto}
                onChange={(e) => setNuevoContacto(e.target.value)}
                placeholder="Ej: laura@example.com o 600..."
              />
            </div>
            <Button type="submit" className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Añadir Invitado
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> Lista de Invitados ({rsvpCounts.Total})
          </CardTitle>
          <CardDescription>
            Confirmados: {rsvpCounts.Confirmado}, Pendientes: {rsvpCounts.Pendiente}, Rechazados: {rsvpCounts.Rechazado}, Quizás: {rsvpCounts.Quizás}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitados.length > 0 ? (
            <ScrollArea className="h-[350px] pr-3">
              <ul className="space-y-3">
                {invitados.map((invitado) => (
                  <li
                    key={invitado.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 border rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-grow space-y-1">
                      <p className="font-medium text-foreground">{invitado.nombre}</p>
                      {invitado.contacto && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          {invitado.contacto.includes('@') ? <Mail className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
                          {invitado.contacto}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                      <Select
                        value={invitado.rsvp}
                        onValueChange={(value: RsvpStatus) => handleRsvpChange(invitado.id, value)}
                      >
                        <SelectTrigger className="w-full sm:w-[130px] h-9 text-xs">
                          <SelectValue placeholder="Estado RSVP" />
                        </SelectTrigger>
                        <SelectContent>
                          {(['Pendiente', 'Confirmado', 'Rechazado', 'Quizás'] as RsvpStatus[]).map(status => (
                            <SelectItem key={status} value={status} className="text-xs">
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteInvitado(invitado.id)}
                        className="text-muted-foreground hover:text-destructive flex-shrink-0"
                        aria-label={`Eliminar invitado ${invitado.nombre}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Aún no has añadido ningún invitado.</p>
              <p className="text-sm text-muted-foreground mt-1">Comienza añadiendo el primer nombre a tu lista.</p>
            </div>
          )}
        </CardContent>
        {invitados.length > 0 && (
             <CardFooter className="text-sm text-muted-foreground">
                Total de invitados en la lista: {invitados.length}
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
