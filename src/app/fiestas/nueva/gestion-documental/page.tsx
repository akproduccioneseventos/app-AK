'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, UploadCloud, FileText, Loader2, Archive, FileSignature, FileArchive, FileX, Download, ListChecks, Receipt, Building2, Printer, CheckCircle2, CreditCard, UtensilsCrossed, FileCheck2, CalendarClock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FiestaEnPlanificacion, DocumentoTipo } from '@/types/fiesta';
import { getFiestaById, uploadDocumentoFiesta, deleteDocumentoFiesta } from '@/app/actions/fiesta-actual';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const ALL_DOC_TYPES: { value: DocumentoTipo; label: string }[] = [
  { value: 'contrato_fiesta', label: 'Contrato de Fiesta' },
  { value: 'contrato_servicio', label: 'Contrato de Servicio (con cliente)' },
  { value: 'contrato_salon', label: 'Contrato de Salón' },
  { value: 'presupuesto_firmado', label: 'Presupuesto Firmado' },
  { value: 'contrato_cambio_fecha', label: 'Contrato de Cambio de Fecha' },
  { value: 'seña_pago', label: 'Seña / Comprobante de Pago' },
  { value: 'recibo_pago', label: 'Recibo de Pago' },
  { value: 'contrato_catering', label: 'Contrato de Catering' },
  { value: 'recibo_salon', label: 'Recibo de Salón' },
  { value: 'recibo_agadu', label: 'Recibo de AGADU' },
  { value: 'recibo_personal', label: 'Recibo de Pago de Personal' },
  { value: 'cancelacion-parcial', label: 'Cancelación Parcial de Servicios' },
  { value: 'otro', label: 'Otro Documento' },
];

function GestionDocumentalContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocumentoTipo>('otro');
  const [customName, setCustomName] = useState('');

  const loadData = useCallback(async () => {
    if (!fiestaId) return;
    setIsLoading(true);
    try {
      const fiestaData = await getFiestaById(fiestaId);
      setFiesta(fiestaData);
    } catch (e) {
      toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, fiestaId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileToUpload(file);
      if (!customName) {
        setCustomName(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };
  
  const handleUpload = async () => {
    if (!fileToUpload || !fiestaId) {
      toast({ title: "No hay archivo", description: "Selecciona un archivo para subir.", variant: "destructive" });
      return;
    }
    if (!customName.trim()) {
        toast({ title: "Falta nombre", description: "Dale un nombre descriptivo al documento.", variant: "destructive" });
        return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('docType', docType);
    formData.append('customName', customName);
    formData.append('fiestaId', fiestaId);
    
    try {
      const result = await uploadDocumentoFiesta(formData);
      if (result.success) {
        toast({ title: "¡Archivo Subido!", description: "El documento ha sido guardado en la fiesta." });
        setFileToUpload(null);
        setCustomName('');
        setDocType('otro');
        await loadData();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast({ title: "Error al Subir", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!fiestaId) return;
    try {
      const result = await deleteDocumentoFiesta(fiestaId, docId);
      if (result.success) {
        toast({ title: "Documento Eliminado" });
        await loadData();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast({ title: "Error al Eliminar", description: err.message, variant: "destructive" });
    }
  };
  
  const handleDownloadAll = async () => {
    if (!fiesta) return;
    setIsDownloading(true);
    toast({ title: "Preparando descarga...", description: "Comprimiendo documentos..." });
    try {
      const response = await fetch(`/api/documentos-fiesta/${fiesta.id}/download-all.zip`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'No se pudo generar el archivo ZIP.');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `documentos-${fiesta.id.substring(0, 6)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: "Descarga Iniciada" });
    } catch (error: any) {
      toast({ title: "Error en la Descarga", description: error.message, variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading || !fiesta) {
    return <div className="p-8 max-w-3xl mx-auto flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Archive className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Gestión Documental</h1>
        </div>
        <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}>
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver al Planificador</Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Subir Nuevo Documento</CardTitle>
          <CardDescription>Sube contratos, recibos, presupuestos firmados y otros archivos importantes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="doc-file">Archivo</Label>
              <Input id="doc-file" type="file" onChange={handleFileChange} />
            </div>
             <div className="space-y-1">
              <Label htmlFor="doc-type">Tipo de Documento</Label>
              <Select value={docType} onValueChange={(v) => setDocType(v as DocumentoTipo)}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  {ALL_DOC_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
              <Label htmlFor="doc-name">Nombre Descriptivo</Label>
              <Input id="doc-name" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Ej: Contrato Firmado Cliente, Seña Salón"/>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleUpload} disabled={isUploading || !fileToUpload}>
            {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <UploadCloud className="w-4 h-4 mr-2"/>}
            Subir Documento
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Documentos de la Fiesta</CardTitle>
          <CardDescription>
            {fiesta.presupuestoId && (
              <div className="mt-2 mb-3 p-2 border border-primary/30 rounded-md bg-primary/5 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <FileCheck2 className="w-4 h-4" />
                  <span>Presupuesto vinculado #{fiesta.presupuestoId.substring(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex gap-2">
                  <Link href={`/presupuestos/${fiesta.presupuestoId}/ver`}>
                    <Button variant="secondary" size="sm"><FileText className="w-4 h-4 mr-1.5"/>Ver Presupuesto</Button>
                  </Link>
                  <Link href={`/presupuestos/${fiesta.presupuestoId}/ver?imprimir=1`}>
                    <Button variant="default" size="sm" className="bg-primary text-white"><Printer className="w-4 h-4 mr-1.5"/>Generar e imprimir presupuesto</Button>
                  </Link>
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
                {!fiesta.presupuestoId && (
                   <Link href={`/presupuestos/nuevo/crear?fiestaId=${fiestaId}`}>
                     <Button variant="secondary" size="sm"><ListChecks className="w-4 h-4 mr-1.5"/>Crear Presupuesto</Button>
                   </Link>
                )}
                <Link href={`/fiestas/nueva/gestion-documental/recibo-pago?fiestaId=${fiestaId}`}>
                  <Button variant="default" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"><Receipt className="w-4 h-4 mr-1.5"/>Recibo de Pago PDF</Button>
                </Link>
                <Link href={`/fiestas/nueva/gestion-documental/contrato-servicio?fiestaId=${fiestaId}`}>
                  <Button variant="secondary" size="sm"><FileSignature className="w-4 h-4 mr-1.5"/>Borrador Contrato Servicio</Button>
                </Link>
                <Link href={`/fiestas/nueva/gestion-documental/contrato-salon?fiestaId=${fiestaId}`}>
                  <Button variant="secondary" size="sm"><Building2 className="w-4 h-4 mr-1.5"/>Borrador Contrato Salón</Button>
                </Link>
                <Link href={`/fiestas/nueva/gestion-documental/cambio-fecha?fiestaId=${fiestaId}`}>
                  <Button variant="secondary" size="sm"><FileArchive className="w-4 h-4 mr-1.5"/>Generar Cambio de Fecha</Button>
                </Link>
                <Link href={`/fiestas/nueva/gestion-documental/cancelacion-contrato?fiestaId=${fiestaId}`}>
                  <Button variant="destructive" size="sm"><FileX className="w-4 h-4 mr-1.5"/>Generar Cancelación</Button>
                </Link>
                <Link href={`/fiestas/nueva/gestion-documental/cancelacion-parcial?fiestaId=${fiestaId}`}>
                  <Button variant="secondary" size="sm"><FileX className="w-4 h-4 mr-1.5"/>Cancelación Parcial</Button>
                </Link>
                <Button onClick={handleDownloadAll} variant="outline" size="sm" disabled={isDownloading}>
                    {isDownloading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin"/> : <Download className="w-4 h-4 mr-1.5"/>}
                    Descargar Todos (.zip)
                </Button>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(fiesta.othersDocumentos && fiesta.othersDocumentos.length > 0) ? (
            fiesta.othersDocumentos.map(doc => {
              const docType = ALL_DOC_TYPES.find(t => t.value === doc.tipo);
              const isKeyDoc = doc.tipo === 'contrato_fiesta' || doc.tipo === 'presupuesto_firmado';
              const icon = (() => {
                switch (doc.tipo) {
                  case 'contrato_fiesta': case 'contrato_servicio': case 'contrato-servicio': return <FileSignature className="w-5 h-5 text-blue-600"/>;
                  case 'contrato_salon': case 'contrato-salon': return <Building2 className="w-5 h-5 text-indigo-600"/>;
                  case 'presupuesto_firmado': return <FileCheck2 className="w-5 h-5 text-emerald-600"/>;
                  case 'contrato_cambio_fecha': case 'cambio-fecha': return <CalendarClock className="w-5 h-5 text-orange-500"/>;
                  case 'seña_pago': case 'recibo_pago': return <CreditCard className="w-5 h-5 text-green-600"/>;
                  case 'contrato_catering': return <UtensilsCrossed className="w-5 h-5 text-amber-600"/>;
                  default: return <FileText className="w-5 h-5 text-primary"/>;
                }
              })();
              return (
                <div key={doc.id} className={`p-3 border rounded-md flex justify-between items-center ${isKeyDoc ? 'bg-primary/5 border-primary/30' : 'bg-muted/40'}`}>
                  <div className="flex items-center gap-3">
                    {icon}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{doc.nombre}</p>
                        {isKeyDoc && <CheckCircle2 className="w-4 h-4 text-emerald-500"/>}
                      </div>
                      <p className="text-xs text-muted-foreground">{docType?.label || 'Otro'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a href={doc.fileName.startsWith('https://') ? doc.fileName : `/api/documentos-fiesta/${fiesta.id}/${doc.fileName}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">Ver / Descargar</Button>
                    </a>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(doc.id)}>Eliminar</Button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">No hay documentos subidos para esta fiesta.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function GestionDocumentalPageWrapper() {
    return (
        <Suspense fallback={<div className="p-8 max-w-3xl mx-auto flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
            <GestionDocumentalContent />
        </Suspense>
    )
}
