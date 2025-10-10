
'use client';

import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import QrScanner from 'react-qr-scanner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, CheckCircle, Ticket, User, UserCheck, Users, Link as LinkIcon, ArrowLeft, CameraOff, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { checkInGuestFiestaActual } from '@/app/actions/fiesta-actual';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import type { Invitado } from '@/types/invitado';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

function CheckinScannerContent() {
  const { toast } = useToast();
  const [allGuests, setAllGuests] = useState<Invitado[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingCheckin, setIsProcessingCheckin] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

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

  useEffect(() => {
    const getCameraPermission = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);
          // It's good practice to stop the stream immediately if not used right away
          stream.getTracks().forEach(track => track.stop());
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
        }
      } else {
        setHasCameraPermission(false);
      }
    };
    getCameraPermission();
  }, []);

  const processCheckIn = useCallback(async (guestId: string) => {
    if (isProcessingCheckin) return;
    
    setIsProcessingCheckin(true);

    const guestToCheck = allGuests.find(g => g.id === guestId);
    if (!guestToCheck) {
        toast({ title: "Error", description: "Invitado no encontrado en la lista.", variant: "destructive" });
        setIsProcessingCheckin(false);
        return;
    }
    
    const wasAlreadyCheckedIn = guestToCheck.checkedIn;
    if (wasAlreadyCheckedIn) {
         toast({
            title: "Ya Registrado",
            description: `${guestToCheck.nombre} ya había hecho check-in.`,
            variant: "default",
            duration: 5000,
        });
        setIsProcessingCheckin(false);
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
      setTimeout(() => setIsProcessingCheckin(false), 2000); // 2-second cooldown
    }
  }, [isProcessingCheckin, allGuests, toast]);


  const handleScan = async (data: { text: string } | null) => {
    if (data) {
      try {
        const url = new URL(data.text);
        const guestId = url.searchParams.get('guestId');
        if (guestId) {
          await processCheckIn(guestId);
        }
      } catch (e) {
        toast({ title: "Código QR Inválido", variant: "destructive" });
      }
    }
  };

  const handleError = (err: any) => {
    console.error(err);
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      setHasCameraPermission(false);
    }
    toast({ title: "Error de Cámara", description: "No se pudo acceder a la cámara.", variant: "destructive"});
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
      
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Lista de Invitados</TabsTrigger>
            <TabsTrigger value="scanner">Escanear QR</TabsTrigger>
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
                                <Button onClick={() => processCheckIn(guest.id)} disabled={isProcessingCheckin} size="sm">
                                    {isProcessingCheckin ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Check-in'}
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
                <CardTitle>Escáner QR</CardTitle>
                 <CardDescription>Apunta la cámara al código QR del invitado para registrar su entrada.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative w-full aspect-square max-w-sm mx-auto bg-black rounded-lg overflow-hidden">
                    {hasCameraPermission ? (
                         <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin" />}>
                           <QrScanner
                            onScan={handleScan}
                            onError={handleError}
                            constraints={{ video: { facingMode: "environment" } }}
                            className="w-full h-full object-cover"
                          />
                        </Suspense>
                    ) : (
                         <div className="flex flex-col items-center justify-center h-full text-white bg-gray-800 p-4">
                            <CameraOff className="w-10 h-10 mb-4" />
                            <p className="text-center">No se pudo acceder a la cámara. Por favor, revisa los permisos en tu navegador.</p>
                        </div>
                    )}
                   {isProcessingCheckin && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="w-10 h-10 text-white animate-spin"/></div>}
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

    