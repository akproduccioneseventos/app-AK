'use client';

import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Scale,
  Save,
  Loader2,
  Plus,
  Trash2,
  Building2,
  FileText,
  AlertTriangle,
  RefreshCw,
  Receipt,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getCompanyInfo,
  saveCompanyInfo,
  getInvoiceTemplateSettings,
  saveInvoiceTemplateSettings,
} from '@/app/actions/settings';
import {
  defaultInvoiceTemplateSettings,
  type CompanyInfo,
  type InvoiceTemplateSettings,
} from '@/types/settings';
import type { CuentaBancaria } from '@/types/fiesta';

const LOAD_TIMEOUT_MS = 15_000;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer !== undefined) clearTimeout(timer);
  });
}

export default function DatosLegalesPage() {
  const { toast } = useToast();
  const [companyInfo, setCompanyInfo] = useState<Partial<CompanyInfo>>({});
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceTemplateSettings>(defaultInvoiceTemplateSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [companyData, invoiceData] = await withTimeout(
        Promise.all([getCompanyInfo(), getInvoiceTemplateSettings()]),
        LOAD_TIMEOUT_MS,
        'La carga de los datos legales y de cobro tardó demasiado. Reintentá en unos segundos.',
      );
      setCompanyInfo(companyData || {});
      setInvoiceSettings({ ...defaultInvoiceTemplateSettings, ...(invoiceData || {}) });
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : 'No se pudieron cargar los datos legales y de cobro.';
      setLoadError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInfoChange = <K extends keyof CompanyInfo>(field: K, value: CompanyInfo[K]) => {
    setCompanyInfo((prev) => ({ ...prev, [field]: value }));
  };

  const updateCuenta = (id: string, field: keyof CuentaBancaria, value: string) => {
    setCompanyInfo((prev) => ({
      ...prev,
      cuentasBancariasPortal: (prev.cuentasBancariasPortal ?? []).map((c) =>
        c.id === id ? { ...c, [field]: value } : c,
      ),
    }));
  };

  const addCuenta = () => {
    const fallbackSuffix = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? `cuenta_${crypto.randomUUID()}`
        : `cuenta_${fallbackSuffix}`;
    setCompanyInfo((prev) => ({
      ...prev,
      cuentasBancariasPortal: [
        ...(prev.cuentasBancariasPortal ?? []),
        { id, banco: '', titular: '', numero: '', tipo: '' },
      ],
    }));
  };

  const removeCuenta = (id: string) => {
    setCompanyInfo((prev) => ({
      ...prev,
      cuentasBancariasPortal: (prev.cuentasBancariasPortal ?? []).filter((c) => c.id !== id),
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const [infoResult, invoiceResult] = await Promise.all([
        saveCompanyInfo(companyInfo),
        saveInvoiceTemplateSettings(invoiceSettings),
      ]);

      if (!infoResult.success) {
        throw new Error(infoResult.error || 'No se pudieron guardar los datos legales y cuentas.');
      }
      if (!invoiceResult.success) {
        throw new Error(invoiceResult.error || 'No se pudo guardar el formato de factura.');
      }

      if (infoResult.data) setCompanyInfo(infoResult.data);
      if (invoiceResult.settings) setInvoiceSettings(invoiceResult.settings);

      toast({
        title: 'Datos guardados',
        description: 'Los datos legales, de facturación y las cuentas de cobro se actualizaron correctamente.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error && err.message ? err.message : 'No se pudo guardar la configuración.';
      toast({ title: 'Error al guardar', description: msg, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Cargando datos legales y de cobro…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <div className="space-y-1">
          <h2 className="text-lg font-bold">No se pudieron cargar los datos legales y de cobro</h2>
          <p className="text-sm text-muted-foreground max-w-md">{loadError}</p>
        </div>
        <Button onClick={() => loadData()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Scale className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-headline">
              Datos legales y cobro
            </h1>
            <p className="text-sm text-muted-foreground">
              Razón social, RUT, facturación, mail del contador y cuentas bancarias para recibir pagos.
            </p>
          </div>
        </div>
        <Button asChild variant="outline" disabled={isSaving}>
          <Link href="/settings">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Datos fiscales y facturación
            </CardTitle>
            <CardDescription>
              Esta información aparece en contratos, facturas y resúmenes enviados a clientes y contaduría.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="legal-company-name">Nombre / Razón Social</Label>
                <Input
                  id="legal-company-name"
                  value={companyInfo.companyName || ''}
                  onChange={(e) => handleInfoChange('companyName', e.target.value)}
                  placeholder="Ej: AK Producciones S.R.L."
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legal-tax-id">RUT / NIF</Label>
                <Input
                  id="legal-tax-id"
                  value={companyInfo.companyTaxId || ''}
                  onChange={(e) => handleInfoChange('companyTaxId', e.target.value)}
                  placeholder="Número de identificación fiscal"
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="legal-address">Dirección Fiscal</Label>
              <Textarea
                id="legal-address"
                value={companyInfo.companyAddress || ''}
                onChange={(e) => handleInfoChange('companyAddress', e.target.value)}
                placeholder="Calle, número, ciudad, país"
                rows={2}
                disabled={isSaving}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="legal-billing-email">Email de facturación</Label>
                <Input
                  id="legal-billing-email"
                  type="email"
                  value={companyInfo.companyContact || ''}
                  onChange={(e) => handleInfoChange('companyContact', e.target.value)}
                  placeholder="facturacion@tuempresa.com"
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legal-accountant-email">Mail del Contador</Label>
                <Input
                  id="legal-accountant-email"
                  type="email"
                  value={companyInfo.emailContador || ''}
                  onChange={(e) => handleInfoChange('emailContador', e.target.value)}
                  placeholder="contador@estudio.com.uy"
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="legal-invoice-footer">Pie de Página para facturas</Label>
              <Textarea
                id="legal-invoice-footer"
                value={companyInfo.invoiceCustomFooter || ''}
                onChange={(e) => handleInfoChange('invoiceCustomFooter', e.target.value)}
                placeholder="Ej: Condiciones de pago, datos de transferencia o nota legal al pie."
                rows={3}
                disabled={isSaving}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              Plantilla de Factura
            </CardTitle>
            <CardDescription>
              Colores y posición del logotipo en los comprobantes generados por el sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice-primary-color">Color principal</Label>
              <Input
                id="invoice-primary-color"
                type="color"
                value={invoiceSettings.primaryColor || defaultInvoiceTemplateSettings.primaryColor}
                onChange={(e) =>
                  setInvoiceSettings((prev) => ({ ...prev, primaryColor: e.target.value }))
                }
                disabled={isSaving}
                className="h-10 p-1 cursor-pointer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice-accent-color">Color de acento</Label>
              <Input
                id="invoice-accent-color"
                type="color"
                value={invoiceSettings.accentColor || defaultInvoiceTemplateSettings.accentColor}
                onChange={(e) =>
                  setInvoiceSettings((prev) => ({ ...prev, accentColor: e.target.value }))
                }
                disabled={isSaving}
                className="h-10 p-1 cursor-pointer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice-logo-pos">Posición del logo</Label>
              <Select
                value={invoiceSettings.logoPosition || 'left'}
                onValueChange={(val) =>
                  setInvoiceSettings((prev) => ({
                    ...prev,
                    logoPosition: val as InvoiceTemplateSettings['logoPosition'],
                  }))
                }
                disabled={isSaving}
              >
                <SelectTrigger id="invoice-logo-pos">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Izquierda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Derecha</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Cuentas Bancarias para Portal del Cliente
            </CardTitle>
            <CardDescription>
              Se usan como punto de partida para las fiestas nuevas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900">
              <strong>Ojo:</strong> si cambiás una cuenta acá, las fiestas que ya tienen la suya cargada{' '}
              <strong>siguen con la anterior</strong>. Para esas, hay que cambiarla en Fiestas → Portal del Cliente.
            </p>

            {(companyInfo.cuentasBancariasPortal ?? []).length === 0 && (
              <p className="text-xs text-muted-foreground border border-dashed rounded-lg p-4 text-center">
                No hay cuentas bancarias configuradas.
              </p>
            )}

            {(companyInfo.cuentasBancariasPortal ?? []).map((cuenta) => (
              <div key={cuenta.id} className="border rounded-xl p-3 space-y-2 bg-slate-50/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    value={cuenta.banco}
                    onChange={(e) => updateCuenta(cuenta.id, 'banco', e.target.value)}
                    placeholder="Banco (ej: BROU, Itaú)"
                    disabled={isSaving}
                  />
                  <Input
                    value={cuenta.titular}
                    onChange={(e) => updateCuenta(cuenta.id, 'titular', e.target.value)}
                    placeholder="Titular de la cuenta"
                    disabled={isSaving}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    value={cuenta.numero}
                    onChange={(e) => updateCuenta(cuenta.id, 'numero', e.target.value)}
                    placeholder="Número de cuenta"
                    disabled={isSaving}
                  />
                  <Input
                    value={cuenta.tipo ?? ''}
                    onChange={(e) => updateCuenta(cuenta.id, 'tipo', e.target.value)}
                    placeholder="Tipo (Caja de ahorro, Cuenta corriente)"
                    disabled={isSaving}
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCuenta(cuenta.id)}
                    disabled={isSaving}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addCuenta} disabled={isSaving}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar cuenta bancaria
            </Button>
          </CardContent>
          <Separator />
          <CardFooter className="pt-6">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar datos legales y cobro'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
