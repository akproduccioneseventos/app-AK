'use client';

import React, { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, UploadCloud, Loader2, FileUp, FileArchive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { processHistoricRecord } from '@/app/actions/historicos';

export default function CargaHistoricosPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [clienteNombre, setClienteNombre] = useState('');
    const [eventoFecha, setEventoFecha] = useState<Date | undefined>(new Date());
    const [montoTotal, setMontoTotal] = useState('');
    const [contractFile, setContractFile] = useState<File | null>(null);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!clienteNombre || !eventoFecha || !montoTotal || !contractFile) {
            toast({ title: "Datos Incompletos", description: "Todos los campos son obligatorios.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('clienteNombre', clienteNombre);
        formData.append('eventoFecha', eventoFecha.toISOString());
        formData.append('montoTotal', montoTotal);
        formData.append('contractFile', contractFile);

        try {
            const result = await processHistoricRecord(formData);
            if (result.success) {
                toast({ title: "Registro Histórico Guardado", description: `Se ha archivado el evento para ${clienteNombre}.` });
                // Reset form
                setClienteNombre('');
                setEventoFecha(new Date());
                setMontoTotal('');
                setContractFile(null);
                const fileInput = document.getElementById('contractFile') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ title: "Error al Guardar", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <FileArchive className="w-8 h-8 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Carga Rápida de Históricos</h1>
                </div>
                <Link href="/" passHref>
                    <Button variant="outline" disabled={isSubmitting}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver al Menú
                    </Button>
                </Link>
            </div>
            
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Cargar Contrato Antiguo</CardTitle>
                    <CardDescription>
                        Usa esta herramienta para cargar rápidamente presupuestos o contratos de años anteriores. El sistema creará un cliente, un presupuesto simplificado y un evento, y lo archivará automáticamente.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="clienteNombre">Nombre del Cliente*</Label>
                            <Input id="clienteNombre" value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} placeholder="Ej: Familia Pérez" required disabled={isSubmitting}/>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="eventoFecha">Fecha del Evento*</Label>
                                <DatePickerDemo selectedDate={eventoFecha} onDateChange={setEventoFecha} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="montoTotal">Monto Total Final (UYU)*</Label>
                                <Input id="montoTotal" type="number" value={montoTotal} onChange={(e) => setMontoTotal(e.target.value)} placeholder="Ej: 150000" min="0" step="any" required disabled={isSubmitting}/>
                            </div>
                         </div>
                         <div className="space-y-2">
                            <Label htmlFor="contractFile">Archivo del Contrato/Presupuesto (PDF)*</Label>
                            <Input id="contractFile" type="file" accept="application/pdf" onChange={(e) => setContractFile(e.target.files?.[0] || null)} required disabled={isSubmitting}/>
                         </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting || !contractFile}>
                            {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <UploadCloud className="w-5 h-5 mr-2" />}
                            {isSubmitting ? 'Guardando Registro...' : 'Guardar y Archivar'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
