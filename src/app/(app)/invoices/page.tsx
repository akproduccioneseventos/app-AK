'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText as FileTextIcon, PlusCircle, Filter, Loader2, AlertTriangle, Search, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getInvoices, deleteInvoice as deleteInvoiceAction, pasarCobrosPendientesAlPresupuesto } from '@/app/actions/invoices';
import { getFiestaActual, addInvoiceIdToFiestaActual, removeInvoiceIdFromFiestaActual } from '@/app/actions/fiesta-actual';
import type { Invoice, InvoiceStatus } from '@/types/invoice';
import { InvoiceListItem } from '@/components/invoice-list-item';
import { FiestaEnPlanificacion } from '@/types/fiesta';

const ALL_STATUSES: InvoiceStatus[] = ['Draft', 'Sent', 'Viewed', 'Paid', 'Overdue'];

function InvoicesListPageContent() {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const conciliarParam = searchParams.get('conciliar');

    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [assigningId, setAssigningId] = useState<string | null>(null);
    const [isPassingCobros, setIsPassingCobros] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<Record<InvoiceStatus, boolean>>(
        ALL_STATUSES.reduce((acc, s) => ({ ...acc, [s]: true }), {} as Record<InvoiceStatus, boolean>)
    );

    const [fiestaActual, setFiestaActual] = useState<FiestaEnPlanificacion | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [invoicesData, fiestaData] = await Promise.all([getInvoices(), getFiestaActual()]);
            setInvoices(invoicesData);
            setFilteredInvoices(invoicesData);
            setFiestaActual(fiestaData);
        } catch (err: any) {
            setError('No se pudieron cargar las facturas.');
            toast({ title: "Error de Carga", variant: 'destructive', description: err.message });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        let tempInvoices = invoices;

        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            tempInvoices = tempInvoices.filter(inv =>
                inv.invoiceNumber.toLowerCase().includes(lowercasedTerm) ||
                inv.customer.name?.toLowerCase().includes(lowercasedTerm) ||
                inv.customer.companyName?.toLowerCase().includes(lowercasedTerm)
            );
        }

        const activeStatuses = Object.entries(statusFilter).filter(([, checked]) => checked).map(([status]) => status);
        if (activeStatuses.length > 0 && activeStatuses.length < ALL_STATUSES.length) {
            tempInvoices = tempInvoices.filter(inv => activeStatuses.includes(inv.status));
        }

        setFilteredInvoices(tempInvoices);
    }, [invoices, searchTerm, statusFilter]);

    const handleDelete = async (id: string, invoiceNumber?: string) => {
        setDeletingId(id);
        try {
            const linkedFiestaId = fiestaActual?.invoiceIds?.includes(id) ? fiestaActual.id : undefined;
            const result = await deleteInvoiceAction(id, linkedFiestaId);
            if (result.success) {
                toast({ title: "Factura Eliminada" });
                fetchData();
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ title: "Error al Eliminar", description: error.message, variant: "destructive" });
        } finally {
            setDeletingId(null);
        }
    };

    const handleToggleAssign = async (invoiceId: string) => {
        if (!fiestaActual) return;
        setAssigningId(invoiceId);

        const isCurrentlyAssigned = fiestaActual.invoiceIds?.includes(invoiceId);

        try {
            const result = isCurrentlyAssigned
                ? await removeInvoiceIdFromFiestaActual(fiestaActual.id, invoiceId)
                : await addInvoiceIdToFiestaActual(fiestaActual.id, invoiceId);

            if (result.success) {
                toast({ title: `Factura ${isCurrentlyAssigned ? 'desasignada' : 'asignada'} con éxito.` });
                fetchData();
            } else {
                 throw new Error(result.error || `No se pudo ${isCurrentlyAssigned ? 'desasignar' : 'asignar'} la factura.`);
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setAssigningId(null);
        }
    };

    const handlePasarCobros = async () => {
        setIsPassingCobros(true);
        try {
            const res = await pasarCobrosPendientesAlPresupuesto();
            if (res.success) {
                toast({
                    title: "Cobros pasados",
                    description: res.pasados === 1
                        ? "Se pasó 1 cobro al presupuesto correctamente."
                        : `Se pasaron ${res.pasados} cobros al presupuesto correctamente.`,
                });
                fetchData();
            } else {
                toast({
                    title: "No se pudieron pasar los cobros",
                    description: res.error || "Ocurrió un error al conciliar.",
                    variant: "destructive",
                });
            }
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setIsPassingCobros(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <FileTextIcon className="w-8 h-8 text-primary" />
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-headline">Gestión de Facturas</h1>
                </div>
                <Button asChild className="w-full sm:w-auto h-11">
                    <Link href="/invoices/new" className="w-full sm:w-auto">
                        <PlusCircle className="w-4 h-4 mr-2" />Nueva Factura
                    </Link>
                </Button>
            </div>

            {conciliarParam === '1' && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 shadow-sm">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                        <div>
                            <p className="font-semibold text-sm sm:text-base">
                                Hay cobros de factura que no llegaron al presupuesto
                            </p>
                            <p className="text-xs text-amber-700">
                                Quedaron cobrados en la factura pero no en el presupuesto. Pasalos para que no queden a medias.
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={handlePasarCobros}
                        disabled={isPassingCobros}
                        className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white shrink-0"
                        size="sm"
                    >
                        {isPassingCobros ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Pasar ahora
                    </Button>
                </div>
            )}

            <Card>
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 sm:p-6">
                    <div>
                        <CardTitle className="font-headline text-xl sm:text-2xl">Listado de Facturas ({filteredInvoices.length})</CardTitle>
                        <CardDescription>Consulta, gestiona y crea nuevas facturas.</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                        <div className="relative flex-grow md:min-w-[250px]">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Buscar por Nº, cliente..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 h-10 text-xs sm:text-sm"
                            />
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-10 text-xs sm:text-sm"><Filter className="w-4 h-4 mr-2" />Filtrar Estado</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56">
                                <DropdownMenuLabel>Filtrar por Estado</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {ALL_STATUSES.map(s => (
                                    <DropdownMenuCheckboxItem key={s} checked={statusFilter[s]} onCheckedChange={(checked) => setStatusFilter(prev => ({...prev, [s]: !!checked}))}>{s}</DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                    {isLoading ? <div className="text-center py-12"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary/30"/></div> :
                    error ? <div className="text-center py-12 text-destructive"><AlertTriangle className="w-10 h-10 mx-auto mb-2"/> <p className="font-bold">{error}</p></div> :
                    filteredInvoices.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="min-w-[120px]">Nº Factura</TableHead>
                                        <TableHead className="min-w-[150px]">Cliente</TableHead>
                                        <TableHead className="min-w-[100px] hidden sm:table-cell">Emisión</TableHead>
                                        <TableHead className="min-w-[100px]">Vencimiento</TableHead>
                                        <TableHead className="text-right min-w-[100px]">Monto</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-center hidden md:table-cell">Vincular Fiesta</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredInvoices.map(invoice => (
                                        <InvoiceListItem
                                            key={invoice.id}
                                            invoice={invoice}
                                            onDelete={handleDelete}
                                            isDeleting={deletingId === invoice.id}
                                            onToggleAssign={() => handleToggleAssign(invoice.id)}
                                            isAssignedToCurrentFiesta={fiestaActual?.invoiceIds?.includes(invoice.id)}
                                            isAssigning={assigningId === invoice.id}
                                            fiestaActual={fiestaActual}
                                        />
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : <div className="text-center py-12 px-4"><p className="text-muted-foreground font-medium italic">No se encontraron facturas.</p></div>}
                </CardContent>
                {invoices.length > 0 && <CardFooter className="p-4 border-t"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total: {invoices.length} facturas registradas</p></CardFooter>}
            </Card>
        </div>
    );
}

export default function InvoicesListPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <InvoicesListPageContent />
        </Suspense>
    );
}
