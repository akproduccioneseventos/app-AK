
'use client';

import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; 
import { Label } from '@/components/ui/label';
import { ArrowLeft, Archive, FileText, Printer, Share2, DollarSign, CreditCard, FileSignature, PlusCircle, Info, Users, Loader2, AlertTriangle, BarChart3, UploadCloud, Eye, Trash2, Building } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { PresupuestoStatusBadge } from '@/components/presupuestos/presupuesto-status-badge';
import { StatusBadge as InvoiceStatusBadge } from '@/components/status-badge';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import type { FiestaEnPlanificacion, OtroDocumento, DocumentoTipo, PagoProveedor, CostoItem } from '@/types/fiesta';
import type { Customer } from '@/types/customer';
import type { Presupuesto } from '@/types/presupuesto';
import type { Invoice } from '@/types/invoice';

import { getFiestaActual, updatePagosProveedores, uploadDocumentoFiesta, deleteDocumentoFiesta } from '@/app/actions/fiesta-actual';
import { getCustomerById } from '@/app/actions/customers';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { getInvoiceById } from '@/app/actions/invoices';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { Textarea } from '@/components/ui/textarea';

const formatCurrency = (amount?: number, currency: string = 'UYU') => {
  if (amount === undefined || amount === null || isNaN(amount)) return "N/A";
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: currency }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) { return "Fecha inválida"; }
};

const ALL_DOC_TYPES: {value: DocumentoTipo, label: string}[] = [
    { value: 'contrato_servicio', label: 'Contrato de Servicio (con cliente)'},
    { value: 'contrato_salon', label: 'Contrato del Salón'},
    { value: 'presupuesto_firmado', label: 'Presupuesto Firmado'},
    { value: 'recibo_pago', label: 'Recibo de Pago (de proveedor)'},
    { value: 'otro', label: 'Otro Documento'},
];

export default function GestionDocumentalPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [cliente, setCliente] = useState<Customer | null>(null);
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [facturas, setFacturas] = useState<Invoice[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocumentoTipo>('otro');
  const [customName, setCustomName] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  
  // State for provider payments
  const [pagosProveedor, setPagosProveedor] = useState<PagoProveedor[]>([]);
  const [isPagosModalOpen, setIsPagosModalOpen] = useState(false);
  const [currentPago, setCurrentPago] = useState<Partial<PagoProveedor>>({});
  const [isSavingPago, setIsSavingPago] = useState(false);


  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaActual();
      setFiesta(fiestaData);
      setPagosProveedor(fiestaData.pagosProveedores || []);

      const dataPromises = [
          fiestaData.configuracion.clienteId ? getCustomerById(fiestaData.configuracion.clienteId) : Promise.resolve(null),
          fiestaData.presupuestoId ? getPresupuestoById(fiestaData.presupuestoId) : Promise.resolve(null),
          ...(fiestaData.invoiceIds || []).map(id => getInvoiceById(id))
      ];
      
      const [clienteData, presData, ...resolvedInvoices] = await Promise.all(dataPromises);

      setCliente(clienteData as Customer | null);
      setPresupuesto(presData as Presupuesto | null);
      setFacturas(resolvedInvoices.filter(inv => inv !== null) as Invoice[]);
      
    } catch (err: any) {
      console.error("Error loading data for financial management:", err);
      setError("No se pudo cargar la información administrativa del evento.");
      toast({ title: "Error de Carga", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleFileUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!fileToUpload) {
        toast({ title: "Archivo requerido", variant: "destructive"});
        return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('docType', docType);
    formData.append('customName', customName.trim());

    try {
        const result = await uploadDocumentoFiesta(formData);
        if (result.success) {
            toast({ title: "¡Documento Subido!", description: "El archivo se ha guardado correctamente."});
            setIsUploadModalOpen(false);
            setFileToUpload(null);
            setCustomName('');
            await loadData();
        } else {
            throw new Error(result.error || "No se pudo subir el archivo.");
        }
    } catch (error: any) {
        toast({ title: "Error al Subir", description: error.message, variant: "destructive"});
    } finally {
        setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    setIsDeleting(docId);
    try {
        const result = await deleteDocumentoFiesta(docId);
        if (result.success) {
            toast({ title: "Documento Eliminado"});
            await loadData();
        } else {
            throw new Error(result.error || "No se pudo eliminar el documento.");
        }
    } catch (error: any) {
        toast({ title: "Error al Eliminar", description: error.message, variant: "destructive"});
    } finally {
        setIsDeleting(null);
    }
  };
  
  const handleDownloadAll = async () => {
    if (!fiesta) return;
    setIsDownloading(true);
    toast({title: "Preparando descarga...", description: "Comprimiendo todos los documentos del evento."});
    try {
        const response = await fetch(`/api/documentos-fiesta/${fiesta.id}/download-all.zip`);
        if(!response.ok) throw new Error("No se pudo generar el archivo ZIP.");
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `documentos-${fiesta.id.substring(0,6)}.zip`;
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error: any) {
        toast({title: "Error de Descarga", description: error.message, variant: "destructive"});
    } finally {
        setIsDownloading(false);
    }
  };

  const handleOpenPagoModal = (pago?: PagoProveedor) => {
    setCurrentPago(pago || { fecha: new Date().toISOString() });
    setIsPagosModalOpen(true);
  };
  
  const handleSavePago = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentPago.costoAsociadoId || !currentPago.monto) {
        toast({ title: "Datos incompletos", description: "Por favor, selecciona un costo y especifica el monto.", variant: "destructive" });
        return;
    }
    setIsSavingPago(true);
    const newPagos = [...pagosProveedor];
    if (currentPago.id) { // Editing
      const index = newPagos.findIndex(p => p.id === currentPago.id);
      if (index > -1) newPagos[index] = currentPago as PagoProveedor;
    } else { // Adding
      newPagos.push({ ...currentPago, id: `pago_${Date.now()}` } as PagoProveedor);
    }

    try {
      const result = await updatePagosProveedores(newPagos);
      if (result.success) {
        toast({ title: "Pago Guardado"});
        await loadData();
        setIsPagosModalOpen(false);
      } else {
        throw new Error(result.error || "No se pudo guardar el pago.");
      }
    } catch(err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSavingPago(false);
    }
  };
  
  const handleDeletePago = async (pagoId: string) => {
      const newPagos = pagosProveedor.filter(p => p.id !== pagoId);
      try {
        const result = await updatePagosProveedores(newPagos);
        if (result.success) {
          toast({ title: "Pago Eliminado", variant: "destructive" });
          await loadData();
        } else {
          throw new Error(result.error || "No se pudo eliminar el pago.");
        }
      } catch (err: any) {
         toast({ title: "Error", description: err.message, variant: "destructive" });
      }
  }
  
  const costosParaPagos = fiesta?.gestionCostos?.costosItems?.filter(c => c.categoria === 'Servicio Proveedor' || c.categoria === 'Pago de Salón');
  
  const groupedDocuments = useMemo(() => {
    if (!fiesta?.otrosDocumentos) return {};
    return fiesta.otrosDocumentos.reduce((acc, doc) => {
        const typeLabel = ALL_DOC_TYPES.find(t => t.value === doc.tipo)?.label || 'Otros Documentos';
        if (!acc[typeLabel]) {
            acc[typeLabel] = [];
        }
        acc[typeLabel].push(doc);
        return acc;
    }, {} as Record<string, OtroDocumento[]>);
  }, [fiesta?.otrosDocumentos]);


  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="ml-3 text-lg">Cargando...</p></div>;
  }

  if (error || !fiesta) {
    return <div className="text-center py-10"><AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-3" /><p className="font-semibold text-lg text-destructive">{error || "No se encontró la fiesta"}</p><Button onClick={loadData} className="mt-4" variant="outline">Reintentar</Button></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 print:space-y-4">
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent><DialogHeader><DialogTitle>Subir Nuevo Documento</DialogTitle><DialogDescription>Añade un nuevo archivo a la documentación de este evento.</DialogDescription></DialogHeader>
          <form onSubmit={handleFileUpload} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="doc-type">Tipo de Documento</Label><Select value={docType} onValueChange={(v) => setDocType(v as DocumentoTipo)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{ALL_DOC_TYPES.map(t=><SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="doc-name">Nombre Personalizado (Opcional)</Label><Input id="doc-name" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Ej: Recibo seña Club Uruguay"/></div>
              <div className="space-y-2"><Label htmlFor="doc-file">Archivo</Label><Input id="doc-file" type="file" onChange={(e) => setFileToUpload(e.target.files?.[0] || null)} required/></div>
              <DialogFooter><Button type="button" variant="outline" onClick={() => setIsUploadModalOpen(false)} disabled={isUploading}>Cancelar</Button><Button type="submit" disabled={isUploading}>{isUploading && <Loader2 className="w-4 h-4 animate-spin mr-2"/>} Subir Archivo</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
       <Dialog open={isPagosModalOpen} onOpenChange={setIsPagosModalOpen}>
          <DialogContent><DialogHeader><DialogTitle>Registrar Pago a Proveedor</DialogTitle></DialogHeader>
            <form onSubmit={handleSavePago} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pago-costo">Costo Asociado</Label>
                  <Select value={currentPago.costoAsociadoId} onValueChange={(v) => setCurrentPago(p => ({...p, costoAsociadoId: v}))} required>
                    <SelectTrigger><SelectValue placeholder="Seleccionar costo..."/></SelectTrigger>
                    <SelectContent>
                        {(costosParaPagos || []).map(c => <SelectItem key={c.id} value={c.id}>{c.nombre} ({formatCurrency(c.montoEstimado)})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="pago-fecha">Fecha de Pago</Label><DatePickerDemo selectedDate={currentPago.fecha ? new Date(currentPago.fecha) : undefined} onDateChange={(d) => setCurrentPago(p => ({...p, fecha: d?.toISOString()}))}/></div>
                  <div className="space-y-2"><Label htmlFor="pago-monto">Monto Pagado</Label><Input id="pago-monto" type="number" value={currentPago.monto || ''} onChange={(e) => setCurrentPago(p=>({...p, monto: parseFloat(e.target.value)}))} required/></div>
                </div>
                 <div className="space-y-2"><Label htmlFor="pago-metodo">Método de Pago</Label><Input id="pago-metodo" value={currentPago.metodoPago || ''} onChange={(e) => setCurrentPago(p=>({...p, metodoPago: e.target.value}))} placeholder="Transferencia, Efectivo..."/></div>
                 <div className="space-y-2"><Label htmlFor="pago-notas">Notas</Label><Textarea id="pago-notas" value={currentPago.notas || ''} onChange={(e) => setCurrentPago(p=>({...p, notas: e.target.value}))} rows={2}/></div>
                 <DialogFooter><Button variant="outline" type="button" onClick={()=>setIsPagosModalOpen(false)}>Cancelar</Button><Button type="submit" disabled={isSavingPago}>{isSavingPago ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null} Guardar Pago</Button></DialogFooter>
            </form>
          </DialogContent>
       </Dialog>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3"><Archive className="w-8 h-8 text-primary" /><h1 className="text-3xl font-bold tracking-tight font-headline">Gestión Documental y Financiera</h1></div>
        <Link href="/fiestas/nueva" passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2"/>Volver al Planificador</Button></Link>
      </div>

      <Card><CardHeader className="bg-muted/30 p-4"><CardTitle className="font-headline text-xl print:text-lg">{fiesta.configuracion.nombreEvento}</CardTitle><CardDescription className="print:text-sm">Cliente: {cliente?.name || cliente?.companyName || "No asignado"}</CardDescription></CardHeader></Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md">
            <CardHeader><CardTitle className="font-headline text-lg flex items-center gap-2"><FileSignature className="w-5 h-5 text-primary"/>Documentos del Evento</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Link href="/fiestas/nueva/gestion-documental/contrato" passHref>
                        <Button variant="secondary" className="w-full">
                            <FileSignature className="w-4 h-4 mr-2"/> Generar Contrato de Servicio
                        </Button>
                    </Link>
                    <Link href="/fiestas/nueva/gestion-documental/contrato-salon" passHref>
                        <Button variant="secondary" className="w-full">
                            <Building className="w-4 h-4 mr-2"/> Generar Contrato de Salón
                        </Button>
                    </Link>
                </div>
                <Separator />
                {Object.entries(groupedDocuments).length === 0 ? <p className="text-muted-foreground text-center italic text-xs py-2">No hay documentos subidos.</p> :
                  Object.entries(groupedDocuments).map(([tipo, docs]) => (
                    <div key={tipo}>
                      <h4 className="font-semibold text-sm mb-1.5">{tipo}</h4>
                      <ul className="space-y-2 text-sm">
                        {docs.map(doc => (
                          <li key={doc.id} className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/30">
                            <a href={`/api/documentos-fiesta/${fiesta.id}/${doc.fileName}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 flex-grow truncate">
                                <FileText className="w-4 h-4 text-primary flex-shrink-0"/><span className="truncate" title={doc.nombre}>{doc.nombre}</span>
                            </a>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={()=>handleDeleteDocument(doc.id)} disabled={!!isDeleting}>{isDeleting === doc.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4" />}</Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                }
            </CardContent>
            <CardFooter className="flex-col items-start gap-3"><Button onClick={() => setIsUploadModalOpen(true)}><UploadCloud className="w-4 h-4 mr-2"/>Subir Documento Firmado</Button>
            <Button onClick={handleDownloadAll} variant="secondary" size="sm" disabled={isDownloading || (fiesta.otrosDocumentos?.length || 0) === 0}>{isDownloading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Archive className="w-4 h-4 mr-2" />}Descargar Todo (.zip)</Button></CardFooter>
        </Card>
        <Card className="shadow-md">
            <CardHeader><CardTitle className="font-headline text-lg flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary"/>Resumen Financiero</CardTitle></CardHeader>
            <CardContent className="space-y-3">
                 <div className="p-2 border rounded-md"><p className="text-xs font-semibold text-muted-foreground">PRESUPUESTO</p>{presupuesto ? (<div className="flex justify-between items-center"><p className="font-medium">Total: {formatCurrency(presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado)}</p><Link href={`/presupuestos/${presupuesto.id}/ver`} passHref><Button variant="outline" size="sm">Ver</Button></Link></div>) : <p className="text-xs italic">No asignado</p>}</div>
                 <div className="p-2 border rounded-md"><p className="text-xs font-semibold text-muted-foreground">FACTURAS</p>{facturas.length > 0 ? (<ul className="text-sm space-y-1 mt-1">{facturas.map(f => (<li key={f.id} className="flex justify-between items-center"><span className="flex items-center gap-1.5">{f.invoiceNumber} <InvoiceStatusBadge status={f.status}/></span> <Link href={`/invoices/${f.id}`} passHref><Button variant="ghost" size="sm" className="h-7">Ver</Button></Link></li>))}</ul>) : <p className="text-xs italic">No hay facturas.</p>}</div>
            </CardContent>
         </Card>
         <Card className="shadow-md lg:col-span-2">
            <CardHeader><CardTitle className="font-headline text-lg flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary"/>Control de Pagos a Proveedores/Salón</CardTitle></CardHeader>
            <CardContent className="space-y-3">
                <Button onClick={() => handleOpenPagoModal()} disabled={!costosParaPagos || costosParaPagos.length === 0}><PlusCircle className="w-4 h-4 mr-2"/>Registrar Nuevo Pago</Button>
                {(!costosParaPagos || costosParaPagos.length === 0) && <p className="text-xs text-muted-foreground mt-1">Añade un costo de 'Servicio Proveedor' o 'Pago de Salón' en el módulo de Costos para poder registrar pagos.</p>}
                {pagosProveedor.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      {pagosProveedor.map(pago => {
                          const costoAsociado = fiesta.gestionCostos?.costosItems?.find(c => c.id === pago.costoAsociadoId);
                          return(
                            <div key={pago.id} className="p-2 border rounded-md flex justify-between items-center">
                              <div>
                                <p className="text-sm font-medium">{formatCurrency(pago.monto)} <span className="text-muted-foreground">a</span> {costoAsociado?.nombre || 'Costo Eliminado'}</p>
                                <p className="text-xs text-muted-foreground">{formatDate(pago.fecha)} - {pago.metodoPago}</p>
                              </div>
                              <div>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={()=>handleOpenPagoModal(pago)}><Edit className="w-4 h-4"/></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={()=>handleDeletePago(pago.id)}><Trash2 className="w-4 h-4"/></Button>
                              </div>
                            </div>
                          )
                      })}
                    </div>
                ) : (
                    <p className="text-sm text-center text-muted-foreground p-3 bg-muted/20 rounded-md">No hay pagos a proveedores registrados para este evento.</p>
                )}
            </CardContent>
         </Card>
      </div>
    </div>
  );
}

    
