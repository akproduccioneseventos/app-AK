
'use client';

import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, UserCheck, Users, Link as LinkIcon, ArrowLeft, CameraOff, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { checkInGuestFiestaActual, getFiestaActual } from '@/app/actions/fiesta-actual';
import type { Invitado } from '@/types/invitado';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

// QR SCANNER IS TEMPORARILY DISABLED DUE TO PACKAGE CONFLICTS
// This component will be replaced with a functional scanner once a compatible library is ensured.

function CheckinScannerContent() {
  const { toast } = useToast();
  const [allGuests, setAllGuests] = useState<Invitado[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingCheckin, setIsProcessingCheckin] = useState<string | null>(null);

  const loadInitialData = useCallback(async (showLoading = true) => {
    if(showLoading) setIsLoading(true);
    try {
      const fiesta = await getFiestaActual();
      setAllGuests((fiesta.invitados || []).sort((a, b) => a.nombre.localeCompare(b.nombre)));
    } catch (e: any) {
      toast({title: "Error", description: "No se pudo cargar la lista de invitados.", variant: "destructive"});
    } finally {
      if(showLoading) setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const processCheckIn = useCallback(async (guestId: string) => {
    if (isProcessingCheckin) return;
    
    setIsProcessingCheckin(guestId);

    const guestToCheck = allGuests.find(g => g.id === guestId);
    if (!guestToCheck) {
        toast({ title: "Error", description: "Invitado no encontrado en la lista.", variant: "destructive" });
        setIsProcessingCheckin(null);
        return;
    }
    
    if (guestToCheck.checkedIn) {
         toast({
            title: "Ya Registrado",
            description: `${guestToCheck.nombre} ya había hecho check-in.`,
            variant: "default",
            duration: 5000,
        });
        setIsProcessingCheckin(null);
        return;
    }

    try {
      const result = await checkInGuestFiestaActual(guestId);
      if (result.success && result.invitado) {
        setAllGuests(prevGuests => prevGuests.map(g => g.id === guestId ? result.invitado! : g));
        toast({
            title: "¡Check-in Exitoso!",
            description: `${result.invitado.nombre} (Mesa: ${result.invitado.tableNumber || 'N/A'})`,
            variant: "default",
            duration: 5000,
            className: "bg-green-100 border-green-300 text-green-800"
        });
      } else {
        throw new Error(result.error || "No se pudo registrar la entrada.");
      }
    } catch (e: any) {
      toast({ title: "Error en Check-in", description: e.message, variant: "destructive" });
    } finally {
      setIsProcessingCheckin(null);
    }
  }, [isProcessingCheckin, allGuests, toast]);

  const handleTabChange = (value: string) => {
    // Placeholder for future scanner logic
  };
  
  const checkedInGuests = useMemo(() => allGuests.filter(g => g.checkedIn), [allGuests]);
  const pendingGuests = useMemo(() => {
    const confirmed = allGuests.filter(g => g.rsvp === 'Confirmado' && !g.checkedIn);
    if (!searchTerm.trim()) {
        return confirmed;
    }
    return confirmed.filter(g => g.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allGuests, searchTerm]);

  const totalConfirmados = useMemo(() => allGuests.filter(i => i.rsvp === 'Confirmado').length, [allGuests]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCheck className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Check-in de Invitados</h1>
        </div>
        <Link href="/fiestas/nueva/invitados"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver a Invitados</Button></Link>
      </div>

      <Card className="shadow-md">
        <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Resumen de Asistencia</CardTitle>
            <Badge variant="secondary" className="text-lg">{checkedInGuests.length} / {totalConfirmados} Presentes</Badge>
        </CardHeader>
      </Card>
      
      <Tabs defaultValue="list" className="w-full" onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Lista de Invitados</TabsTrigger>
            <TabsTrigger value="scanner" disabled>Escanear QR (Deshabilitado)</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Check-in Manual</CardTitle>
                    <CardDescription>Busca al invitado por su nombre y registra su entrada.</CardDescription>
                     <div className="relative pt-2">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Buscar invitado por nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-96">
                        <div className="space-y-2">
                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto"/> :
                         pendingGuests.length > 0 ? pendingGuests.map(guest => (
                            <div key={guest.id} className="flex items-center justify-between p-3 border rounded-md bg-background">
                                <div>
                                    <p className="font-medium">{guest.nombre}</p>
                                    <p className="text-sm text-muted-foreground">{guest.partySize || 1} persona(s)</p>
                                </div>
                                <Button onClick={() => processCheckIn(guest.id)} disabled={!!isProcessingCheckin} size="sm">
                                    {isProcessingCheckin === guest.id ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Check-in'}
                                </Button>
                            </div>
                         )) : <p className="text-sm text-muted-foreground text-center py-4">No hay invitados pendientes o que coincidan con la búsqueda.</p>
                        }
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="scanner">
             <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Escáner QR (Temporalmente Deshabilitado)</CardTitle>
                 <CardDescription>Esta función está en mantenimiento para asegurar su estabilidad.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative w-full max-w-sm mx-auto bg-black rounded-lg overflow-hidden aspect-square">
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white p-4">
                      <CameraOff className="w-10 h-10 mb-2"/>
                      <p className="text-center text-sm">El escáner QR no está disponible. Utiliza la pestaña "Lista de Invitados" para el check-in manual.</p>
                    </div>
                </div>
              </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function CheckinScannerPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
            <CheckinScannerContent/>
        </Suspense>
    )
}
