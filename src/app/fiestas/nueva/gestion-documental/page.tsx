
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, UploadCloud, FileText, Loader2, AlertTriangle, Archive, FileSignature, FileUp, ListChecks, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FiestaEnPlanificacion, OtroDocumento, DocumentoTipo } from '@/types/fiesta';
import { getFiestaActual, uploadDocumentoFiesta, deleteDocumentoFiesta } from '@/app/actions/fiesta-actual';

const ALL_DOC_TYPES: { value: DocumentoTipo; label: string }[] = [
  { value: 'contrato_servicio', label: 'Contrato de Servicio (con cliente)' },
  { value: 'contrato_salon', label: 'Contrato de Salón' },
  { value: 'presupuesto_firmado', label: 'Presupuesto Firmado' },
  { value: 'recibo_pago', label: 'Recibo de Pago (Seña, etc.)' },
  { value: 'otro', label: 'Otro Documento' },
];

export default function GestionDocumentalPage() {
  const { toast } = useToast();
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocumentoTipo>('otro');
  const [customName, setCustomName] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const fiestaData = await getFiestaActual();
      setFiesta(fiestaData);
    } catch (e) {
      toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileToUpload(file);
      if (!customName) {
        // Remove extension for cleaner default name
        setCustomName(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };
  
  const handleUpload = async () => {
    if (!fileToUpload) {
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
    try {
      const result = await deleteDocumentoFiesta(docId);
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
    return <div className="p-8 max-w-3xl mx-auto"><Loader2 className="w-8 h-8 animate-spin"/></div>
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Archive className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Gestión Documental</h1>
        </div>
        <Link href="/fiestas/nueva" passHref>
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
            <div className="flex flex-wrap gap-2 mt-2">
                <Link href={`/fiestas/nueva/gestion-documental/contrato-servicio`} passHref>
                  <Button variant="secondary" size="sm"><FileSignature className="w-4 h-4 mr-1.5"/>Borrador Contrato Servicio</Button>
                </Link>
                <Link href={`/fiestas/nueva/gestion-documental/contrato-salon`} passHref>
                   <Button variant="secondary" size="sm"><FileSignature className="w-4 h-4 mr-1.5"/>Borrador Contrato Salón</Button>
                </Link>
                <Button onClick={handleDownloadAll} variant="outline" size="sm" disabled={isDownloading}>
                    {isDownloading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin"/> : <Download className="w-4 h-4 mr-1.5"/>}
                    Descargar Todos (.zip)
                </Button>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(fiesta.otrosDocumentos && fiesta.otrosDocumentos.length > 0) ? (
            fiesta.otrosDocumentos.map(doc => (
              <div key={doc.id} className="p-3 border rounded-md flex justify-between items-center bg-muted/40">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary"/>
                  <div>
                    <p className="font-medium text-sm">{doc.nombre}</p>
                    <p className="text-xs text-muted-foreground">{ALL_DOC_TYPES.find(t => t.value === doc.tipo)?.label || 'Otro'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={`/api/documentos-fiesta/${fiesta.id}/${doc.fileName}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">Ver</Button>
                  </a>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(doc.id)}>Eliminar</Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">No hay documentos subidos para esta fiesta.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
