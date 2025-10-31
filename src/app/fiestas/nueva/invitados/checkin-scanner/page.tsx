
'use client';

import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, UserCheck, Users, Link as LinkIcon, ArrowLeft, CameraOff, Search, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { checkInGuestFiestaActual, getFiestaById } from '@/app/actions/fiesta-actual';
import type { Invitado } from '@/types/invitado';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSearchParams } from 'next/navigation';
import { Html5QrcodeScanner, type QrcodeSuccessCallback } from 'html5-qrcode';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';


function CheckinScannerContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  const [allGuests, setAllGuests] = useState<Invitado[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingCheckin, setIsProcessingCheckin] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);


  const loadInitialData = useCallback(async (showLoading = true) => {
    if(showLoading) setIsLoading(true);
    try {
      if (!fiestaId) throw new Error("Falta el ID del evento.");
      const fiesta = await getFiestaById(fiestaId);
      if (!fiesta) throw new Error("Evento no encontrado");
      setAllGuests((fiesta.invitados || []).sort((a, b) => a.nombre.localeCompare(b.nombre)));
    } catch (e: any) {
      toast({title: "Error", description: "No se pudo cargar la lista de invitados.", variant: "destructive"});
    } finally {
      if(showLoading) setIsLoading(false);
    }
  }, [toast, fiestaId]);
  
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const processCheckIn = useCallback(async (guestId: string) => {
    if (isProcessingCheckin || !fiestaId) return;
    
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
      const result = await checkInGuestFiestaActual(fiestaId, guestId);
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
  }, [isProcessingCheckin, allGuests, toast, fiestaId]);

  const onScanSuccess: QrcodeSuccessCallback = useCallback((decodedText, decodedResult) => {
    if (scannerRef.current?.getState() === 2) { // 2 is SCANNING state
        scannerRef.current.pause(true);
    }

    try {
        const url = new URL(decodedText);
        const scannedFiestaId = url.searchParams.get('fiestaId');
        const scannedGuestId = url.searchParams.get('guestId');

        if (scannedFiestaId !== fiestaId) {
            toast({ title: "QR Incorrecto", description: "Este QR no pertenece al evento actual.", variant: "destructive" });
            setTimeout(() => scannerRef.current?.resume(), 2000);
            return;
        }

        if (scannedGuestId) {
            processCheckIn(scannedGuestId);
        } else {
            toast({ title: "QR Inválido", description: "El código QR no contiene un ID de invitado válido.", variant: "destructive" });
        }
    } catch (e) {
        toast({ title: "Error de Escaneo", description: "El código QR no es una URL válida.", variant: "destructive" });
    } finally {
        setTimeout(() => {
            if (scannerRef.current?.getState() === 3) { // 3 is PAUSED state
                scannerRef.current.resume();
            }
        }, 3000);
    }
  }, [fiestaId, processCheckIn, toast]);
  
  const onScanFailure = (error: any) => {};

  const startScanner = useCallback(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        if (!scannerRef.current) {
          const scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
          scanner.render(onScanSuccess, onScanFailure);
          scannerRef.current = scanner;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Acceso a Cámara Denegado',
          description: 'Por favor, habilita el permiso de la cámara en tu navegador para usar el escáner.',
        });
      }
    };

    getCameraPermission();
  }, [onScanSuccess]);

  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.getState() !== 1) { // 1 = NOT_STARTED
      scannerRef.current.clear().catch(error => {
        console.error("Failed to clear html5QrcodeScanner.", error);
      });
      scannerRef.current = null;
    }
  };
  
  const handleTabChange = (value: string) => {
    if (value === 'scanner') {
        startScanner();
    } else {
        stopScanner();
    }
  };
  
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const checkedInGuests = React.useMemo(() => allGuests.filter(g => g.checkedIn), [allGuests]);
  const pendingGuests = React.useMemo(() => {
    const confirmed = allGuests.filter(g => g.rsvp === 'Confirmado' && !g.checkedIn);
    if (!searchTerm.trim()) {
        return confirmed;
    }
    return confirmed.filter(g => g.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allGuests, searchTerm]);

  const totalConfirmados = React.useMemo(() => allGuests.filter(i => i.rsvp === 'Confirmado').length, [allGuests]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCheck className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Check-in de Invitados</h1>
        </div>
        <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver al Planificador</Button></Link>
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
                <CardTitle>Escáner QR</CardTitle>
                 <CardDescription>Apunta la cámara al código QR del invitado para registrar su entrada.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                 {hasCameraPermission === null && <div className="p-4"><Loader2 className="w-6 h-6 animate-spin" /></div>}
                 {hasCameraPermission === false && (
                    <Alert variant="destructive">
                      <CameraOff className="h-4 w-4" />
                      <AlertTitle>Se requiere acceso a la cámara</AlertTitle>
                      <AlertDescription>
                        Habilita los permisos de la cámara en tu navegador para usar el escáner.
                      </AlertDescription>
                    </Alert>
                 )}
                 <div id="qr-reader" className="w-full max-w-sm mx-auto rounded-lg overflow-hidden aspect-square"></div>
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
