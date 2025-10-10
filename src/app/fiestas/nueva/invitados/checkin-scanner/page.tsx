
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import QrScanner from 'react-qr-scanner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, CheckCircle, Ticket, User, UserCheck, Users, Link as LinkIcon, ArrowLeft, CameraOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { checkInGuestFiestaActual } from '@/app/actions/fiesta-actual';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import type { Invitado } from '@/types/invitado';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

function CheckinScannerContent() {
  const { toast } = useToast();
  const [lastResult, setLastResult] = useState<{ status: 'success' | 'error' | 'warning', message: string, invitado?: Invitado } | null>(null);
  const [checkedInGuests, setCheckedInGuests] = useState<Invitado[]>([]);
  const [totalConfirmados, setTotalConfirmados] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const loadInitialData = useCallback(async () => {
    try {
      const fiesta = await getFiestaActual();
      const confirmados = fiesta.invitados?.filter(i => i.rsvp === 'Confirmado');
      setCheckedInGuests((fiesta.invitados || []).filter(i => i.checkedIn).sort((a,b) => new Date(b.checkInTimestamp!).getTime() - new Date(a.checkInTimestamp!).getTime()));
      setTotalConfirmados(confirmados?.length || 0);
    } catch (e) {
      // handle error
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleScan = async (data: { text: string } | null) => {
    if (data && !isLoading) {
      setIsLoading(true);
      setLastResult(null);
      
      try {
        const url = new URL(data.text);
        const guestId = url.searchParams.get('guestId');
        
        if (!guestId) {
          throw new Error("Código QR no válido. No contiene un ID de invitado.");
        }

        const result = await checkInGuestFiestaActual(guestId);
        
        if (result.success && result.invitado) {
            const wasAlreadyCheckedIn = checkedInGuests.some(g => g.id === result.invitado!.id);

            setLastResult({ status: wasAlreadyCheckedIn ? 'warning' : 'success', message: wasAlreadyCheckedIn ? 'Este invitado ya había sido registrado.' : 'Check-in Exitoso', invitado: result.invitado });
            
            if (!wasAlreadyCheckedIn) {
                setCheckedInGuests(prev => [result.invitado!, ...prev]);
            }

        } else {
          throw new Error(result.error || "No se pudo registrar la entrada.");
        }
      } catch (e: any) {
        setLastResult({ status: 'error', message: e.message || "Error al procesar el código." });
      } finally {
        setTimeout(() => {
          setIsLoading(false);
        }, 2000); // Wait 2 seconds before allowing another scan
      }
    }
  };

  const handleError = (err: any) => {
    console.error(err);
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      setHasCameraPermission(false);
    }
    setLastResult({ status: 'error', message: 'Error de cámara. Asegúrate de haber dado permiso.' });
  };

  const previewStyle = {
    height: 'auto',
    width: '100%',
    maxWidth: '400px',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCheck className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Escáner de Check-in</h1>
        </div>
        <Link href="/fiestas/nueva/invitados"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver a Invitados</Button></Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Escanear Código QR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full aspect-square max-w-sm mx-auto bg-black rounded-lg overflow-hidden">
              {hasCameraPermission === false ? (
                <div className="flex flex-col items-center justify-center h-full text-white bg-destructive/80 p-4">
                  <CameraOff className="w-12 h-12 mb-4" />
                  <h3 className="font-semibold">Acceso a Cámara Denegado</h3>
                  <p className="text-sm text-center">Por favor, habilita el permiso de cámara en los ajustes de tu navegador para usar el escáner.</p>
                </div>
              ) : (
                <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin" />}>
                   <QrScanner
                    onScan={handleScan}
                    onError={handleError}
                    constraints={{ video: { facingMode: "environment" } }}
                    style={previewStyle}
                    className="w-full h-full object-cover"
                  />
                </Suspense>
              )}
               {isLoading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="w-10 h-10 text-white animate-spin"/></div>}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle>Último Escaneo</CardTitle>
                </CardHeader>
                <CardContent className="min-h-[150px] flex items-center justify-center">
                    {!lastResult ? <p className="text-muted-foreground">Esperando código QR...</p> :
                    lastResult.status === 'success' ? (
                        <div className="text-center text-green-600 space-y-1">
                            <CheckCircle className="w-10 h-10 mx-auto"/>
                            <p className="font-bold">{lastResult.message}</p>
                            <p className="text-lg">{lastResult.invitado?.nombre}</p>
                            {lastResult.invitado?.tableNumber && <p className="text-sm flex items-center justify-center gap-1"><Ticket className="w-4 h-4"/>Mesa: <strong>{lastResult.invitado.tableNumber}</strong></p>}
                        </div>
                    ) : lastResult.status === 'warning' ? (
                        <div className="text-center text-amber-600 space-y-1">
                            <AlertTriangle className="w-10 h-10 mx-auto"/>
                            <p className="font-bold">{lastResult.message}</p>
                            <p className="text-lg">{lastResult.invitado?.nombre}</p>
                        </div>
                    ) : (
                         <div className="text-center text-destructive space-y-1">
                            <AlertTriangle className="w-10 h-10 mx-auto"/>
                            <p className="font-bold">Error</p>
                            <p className="text-sm max-w-xs">{lastResult.message}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
            <Card className="shadow-md">
                <CardHeader className="flex-row items-center justify-between">
                    <CardTitle>Historial de Check-in</CardTitle>
                    <Badge variant="secondary">{checkedInGuests.length} / {totalConfirmados} Presentes</Badge>
                </CardHeader>
                <CardContent className="max-h-64 overflow-y-auto pr-2">
                    <ul className="space-y-2">
                        {checkedInGuests.map(guest => (
                            <li key={guest.id} className="flex justify-between items-center text-sm border-b pb-1">
                                <span>{guest.nombre}</span>
                                <span className="text-xs text-muted-foreground">{new Date(guest.checkInTimestamp!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </li>
                        ))}
                         {checkedInGuests.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">Nadie ha hecho check-in todavía.</p>}
                    </ul>
                </CardContent>
            </Card>
        </div>
      </div>
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
