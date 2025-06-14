
'use client';

import { useState, useEffect, type FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link'; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2, PlusCircle, Trash2, FilePlus2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCustomers } from '@/app/actions/customers';
import { saveInvoice } from '@/app/actions/invoices';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import type { Customer } from '@/types/customer';
import type { Presupuesto } from '@/types/presupuesto';
import type { Invoice, InvoiceItem, InvoiceStatus } from '@/types/invoice';

const VENDOR_NAME = "Presupuestador AK Producciones";
const VENDOR_ADDRESS = "Calle de Ejemplo 456, Oficina 7A, 28002 Madrid, España";
const VENDOR_TAX_ID = "A08123456";
const DEFAULT_CURRENCY = "UYU";
const DEFAULT_TAX_RATE = 21; // Ejemplo, puede ser 0 si no aplica IVA o es configurable

interface NewInvoiceItem extends Omit<InvoiceItem, 'id' | 'total'> {
  tempId: string;
}

function NewInvoicePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issueDate, setIssueDate] = useState<Date | undefined>(new Date());
  const [dueDate, setDueDate] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  });
  const [items, setItems] = useState<NewInvoiceItem[]>([
    { tempId: `item_${Date.now()}`, description: '', quantity: 1, unitPrice: 0 }
  ]);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<InvoiceStatus>('Draft');
  const [sourcePresupuestoId, setSourcePresupuestoId] = useState<string | null>(null);


  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingFromPresupuesto, setIsLoadingFromPresupuesto] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      setIsLoadingCustomers(true);
      const fromPresupuestoIdParam = searchParams.get('fromPresupuesto');
      if (fromPresupuestoIdParam) {
          setIsLoadingFromPresupuesto(true);
          setSourcePresupuestoId(fromPresupuestoIdParam);
      }

      try {
        const fetchedCustomers = await getCustomers();
        setCustomers(fetchedCustomers);

        if (fromPresupuestoIdParam) {
          const presupuesto = await getPresupuestoById(fromPresupuestoIdParam);
          if (presupuesto) {
            if (presupuesto.clienteNombre) {
              const matchingCustomer = fetchedCustomers.find(c => c.name === presupuesto.clienteNombre || c.companyName === presupuesto.clienteNombre);
              if (matchingCustomer) {
                setSelectedCustomerId(matchingCustomer.id);
              } else {
                 // Si el cliente del presupuesto no está en la lista, intentar buscarlo por ID si es que el nombre es solo un string.
                 // O mejor, asumir que si se crea factura desde presupuesto, el cliente YA DEBERÍA EXISTIR y tener ID.
                 // Para este caso, si el cliente no existe, se deja vacío y el usuario debe seleccionarlo o crearlo.
                 toast({ title: "Cliente no encontrado", description: `El cliente "${presupuesto.clienteNombre}" del presupuesto no fue encontrado. Selecciona uno o crea uno nuevo.`, variant: "default", duration: 7000 });
              }
            }
            // Intenta generar un número de factura basado en el ID del presupuesto.
            // Esto es solo una sugerencia, el usuario puede cambiarlo.
            setInvoiceNumber(`FACT-P${presupuesto.id.split('_').pop()?.substring(0,5)}`); 
            
            const presupuestoItems: NewInvoiceItem[] = [];
            presupuesto.platosSeleccionados.forEach(p => {
              presupuestoItems.push({
                tempId: `item_plato_${p.idPlato}_${Date.now()}`,
                description: `${p.nombrePlato} (x${p.cantidad})`,
                quantity: 1, // Asumimos que el presupuesto total es 1 item en la factura
                unitPrice: p.costoTotalPlato,
              });
            });
            // Concatenar servicios adicionales como un único ítem o varios
            if (presupuesto.serviciosAdicionales.length > 0) {
                if (presupuesto.costoSubtotalServicios > 0) {
                     presupuestoItems.push({
                        tempId: `item_servicios_adicionales_${Date.now()}`,
                        description: `Servicios Adicionales (Detalle en presupuesto #${presupuesto.id.split('_').pop()?.substring(0,5)})`,
                        quantity: 1,
                        unitPrice: presupuesto.costoSubtotalServicios,
                    });
                }
            }
            
            if (presupuestoItems.length > 0) {
                setItems(presupuestoItems);
            } else {
                // Default item if presupuesto had no items
                setItems([{ tempId: `item_${Date.now()}`, description: 'Servicio según presupuesto adjunto', quantity: 1, unitPrice: presupuesto.costoTotalEstimado }]);
            }
            setNotes(presupuesto.notas || '');
            if (presupuesto.eventoFecha) {
                setIssueDate(new Date(presupuesto.eventoFecha));
            }
             toast({ title: "Datos Cargados", description: `Datos del presupuesto #${presupuesto.id.split('_').pop()?.substring(0,5)} pre-cargados.`});
          } else {
            toast({ title: "Presupuesto no encontrado", description: `No se pudo cargar el presupuesto ID ${fromPresupuestoIdParam}.`, variant: "destructive" });
          }
        }
      } catch (error) {
        toast({ title: "Error", description: "No se pudieron cargar los clientes o datos del presupuesto.", variant: "destructive" });
      } finally {
        setIsLoadingCustomers(false);
        setIsLoadingFromPresupuesto(false);
      }
    }
    loadInitialData();
  }, [toast, searchParams]);

  const handleAddItem = () => {
    setItems([...items, { tempId: `item_${Date.now()}`, description: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (tempId: string) => {
    setItems(items.filter(item => item.tempId !== tempId));
  };

  const handleItemChange = (tempId: string, field: keyof Omit<NewInvoiceItem, 'tempId'>, value: string | number) => {
    setItems(items.map(item =>
      item.tempId === tempId ? { ...item, [field]: field === 'quantity' || field === 'unitPrice' ? Number(value) : value } : item
    ));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = (subtotal * DEFAULT_TAX_RATE) / 100;
    const totalAmount = subtotal + taxAmount;
    return { subtotal, taxAmount, totalAmount };
  };

  const { subtotal, taxAmount, totalAmount } = calculateTotals();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      toast({ title: "Cliente Requerido", description: "Por favor, selecciona un cliente.", variant: "destructive" });
      return;
    }
    if (!invoiceNumber.trim()) {
      toast({ title: "Número de Factura Requerido", description: "Por favor, ingresa un número de factura.", variant: "destructive" });
      return;
    }
    if (!issueDate) {
      toast({ title: "Fecha de Emisión Requerida", description: "Por favor, selecciona una fecha de emisión.", variant: "destructive" });
      return;
    }
     if (items.length === 0 || items.some(item => !item.description.trim() || item.quantity <= 0 || item.unitPrice < 0)) {
      toast({ title: "Ítems Inválidos", description: "Asegúrate de que todos los ítems tengan descripción, cantidad positiva y precio válido.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
    if (!selectedCustomer) {
        toast({ title: "Error", description: "Cliente seleccionado no válido.", variant: "destructive" });
        setIsSaving(false);
        return;
    }

    const invoiceData: Omit<Invoice, 'id' | 'items' | 'payments'> & { items: Omit<InvoiceItem, 'id'>[] } = {
      invoiceNumber: invoiceNumber.trim(),
      customer: selectedCustomer,
      issueDate: issueDate.toISOString(),
      dueDate: dueDate ? dueDate.toISOString() : issueDate.toISOString(),
      items: items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
      })),
      subtotal,
      taxRate: DEFAULT_TAX_RATE,
      taxAmount,
      totalAmount,
      status,
      notes: notes.trim() || undefined,
      currency: DEFAULT_CURRENCY,
      vendorName: VENDOR_NAME,
      vendorAddress: VENDOR_ADDRESS,
      vendorTaxId: VENDOR_TAX_ID,
    };

    try {
      const result = await saveInvoice(invoiceData, sourcePresupuestoId || undefined);
      if (result.success && result.id) {
        toast({ title: "¡Factura Creada!", description: `La factura ${result.invoice?.invoiceNumber} ha sido creada.` });
        router.push('/invoices');
      } else {
        throw new Error(result.error || "Error desconocido al crear la factura.");
      }
    } catch (error: any) {
      toast({ title: "Error al Crear Factura", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingCustomers || isLoadingFromPresupuesto) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FilePlus2 className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Crear Nueva Factura
            {sourcePresupuestoId && <span className="text-base font-normal text-muted-foreground"> (Desde Presupuesto #{sourcePresupuestoId.split('_').pop()?.substring(0,5)})</span>}
          </h1>
        </div>
        <Link href="/invoices" passHref>
          <Button variant="outline" disabled={isSaving}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Facturas
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Detalles de la Factura</CardTitle>
            <CardDescription>Completa la información para generar una nueva factura.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer-select">Cliente *</Label>
                <Select
                  value={selectedCustomerId}
                  onValueChange={setSelectedCustomerId}
                  disabled={isLoadingCustomers || customers.length === 0}
                  required
                >
                  <SelectTrigger id="customer-select" className="text-base p-3 h-auto">
                    <SelectValue placeholder={isLoadingCustomers ? "Cargando clientes..." : "Seleccionar cliente"} />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.length === 0 && !isLoadingCustomers && <SelectItem value="no-customers" disabled>No hay clientes</SelectItem>}
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id} className="text-base">
                        {customer.companyName || customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 {customers.length === 0 && !isLoadingCustomers && (
                    <p className="text-xs text-muted-foreground">No hay clientes. <Link href="/customers/new" className="underline text-primary">Crear nuevo cliente</Link>.</p>
                 )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice-number">Número de Factura *</Label>
                <Input id="invoice-number" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="Ej: FACT2024-001" className="text-base p-3" required/>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="issue-date">Fecha de Emisión *</Label>
                <DatePickerDemo selectedDate={issueDate} onDateChange={setIssueDate} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due-date">Fecha de Vencimiento</Label>
                <DatePickerDemo selectedDate={dueDate} onDateChange={setDueDate} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="status-select">Estado</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as InvoiceStatus)}>
                  <SelectTrigger id="status-select" className="text-base p-3 h-auto">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {(['Draft', 'Sent', 'Paid', 'Overdue'] as InvoiceStatus[]).map(s => (
                        <SelectItem key={s} value={s} className="text-base">{s === 'Draft' ? 'Borrador' : s === 'Sent' ? 'Enviada' : s === 'Paid' ? 'Pagada' : 'Vencida'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t mt-6">
              <h3 className="text-lg font-medium font-headline">Conceptos de la Factura</h3>
              {items.map((item, index) => (
                <Card key={item.tempId} className="p-4 bg-muted/30 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-6 space-y-1">
                      <Label htmlFor={`item-desc-${item.tempId}`} className="text-xs">Descripción *</Label>
                      <Input
                        id={`item-desc-${item.tempId}`}
                        value={item.description}
                        onChange={(e) => handleItemChange(item.tempId, 'description', e.target.value)}
                        placeholder="Descripción del servicio o producto"
                        className="h-9 text-sm"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <Label htmlFor={`item-qty-${item.tempId}`} className="text-xs">Cant. *</Label>
                      <Input
                        id={`item-qty-${item.tempId}`}
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.tempId, 'quantity', e.target.value)}
                        min="1"
                        className="h-9 text-sm"
                        required
                      />
                    </div>
                    <div className="sm:col-span-3 space-y-1">
                      <Label htmlFor={`item-price-${item.tempId}`} className="text-xs">Precio Unit. ({DEFAULT_CURRENCY}) *</Label>
                      <Input
                        id={`item-price-${item.tempId}`}
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(item.tempId, 'unitPrice', e.target.value)}
                        min="0"
                        step="any"
                        className="h-9 text-sm"
                        required
                      />
                    </div>
                    <div className="sm:col-span-1 flex justify-end">
                      {items.length > 0 && ( // Changed from items.length > 1 to allow deleting the last item if needed, though form validation will catch empty items
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(item.tempId)}
                          className="text-destructive hover:bg-destructive/10 h-9 w-9"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                   <p className="text-sm text-right font-medium">
                        Total Ítem: {(item.quantity * item.unitPrice).toLocaleString('es-UY', { style: 'currency', currency: DEFAULT_CURRENCY })}
                    </p>
                </Card>
              ))}
              <Button type="button" variant="outline" onClick={handleAddItem} className="mt-2">
                <PlusCircle className="w-4 h-4 mr-2" /> Añadir Concepto
              </Button>
            </div>

            <div className="space-y-2 pt-6 border-t mt-6 text-right">
              <div className="flex justify-end items-center gap-4">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium w-32">{subtotal.toLocaleString('es-UY', { style: 'currency', currency: DEFAULT_CURRENCY })}</span>
              </div>
              <div className="flex justify-end items-center gap-4">
                <span className="text-muted-foreground">IVA ({DEFAULT_TAX_RATE}%):</span>
                <span className="font-medium w-32">{taxAmount.toLocaleString('es-UY', { style: 'currency', currency: DEFAULT_CURRENCY })}</span>
              </div>
              <div className="flex justify-end items-center gap-4 pt-2 border-t mt-2">
                <span className="text-lg font-semibold">Total General:</span>
                <span className="text-lg font-semibold text-primary w-32">{totalAmount.toLocaleString('es-UY', { style: 'currency', currency: DEFAULT_CURRENCY })}</span>
              </div>
            </div>

            <div className="space-y-2 pt-6 border-t mt-6">
              <Label htmlFor="notes" className="text-base">Notas Adicionales</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Añade cualquier nota, término de pago o detalle adicional aquí."
                rows={3}
                className="text-base p-3"
              />
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving || isLoadingCustomers || isLoadingFromPresupuesto}>
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              {isSaving ? 'Creando Factura...' : 'Crear Factura'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="ml-3 text-lg">Cargando...</p></div>}>
      <NewInvoicePageContent />
    </Suspense>
  );
}
