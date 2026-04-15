'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import type { ArmadoRapidoConfig } from '@/types/armado-rapido';
import type { ServicioEmpresa } from '@/types/empresa';
import type { ItemPresupuestado } from '@/types/presupuesto';
import { getGuestCountForItem, recalcularCostoItem } from '@/lib/calculations';
import { ArrowLeft, Layers, Loader2, Package, PackagePlus, Search, TrendingUp, X } from 'lucide-react';

const GUESTS_FOR_ESTIMATE = 100;

const formatCurrency = (amount?: number) => {
  if (amount === undefined || Number.isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getCalculationMethodLabel = (method?: string) => {
  switch (method) {
    case 'porPersona':
      return 'Por Persona';
    case 'ratio':
      return 'Por Ratio';
    case 'tramos':
      return 'Por Tramos';
    case 'fijo':
    default:
      return 'Precio Fijo';
  }
};

const getServicioCalculatedData = (servicio: ServicioEmpresa, adultos: number) => {
  const itemDataForCalc: ItemPresupuestado = {
    idServicioCatalogo: servicio.id,
    nombreServicio: servicio.nombre,
    cantidad: 1,
    precioUnitario: servicio.precioVenta || servicio.precioPorPersona || servicio.precioBase || 0,
    precioUnitarioPresupuesto: servicio.precioVenta || servicio.precioPorPersona || servicio.precioBase || 0,
    costoTotalItem: 0,
    categoriaServicio: servicio.categoria,
    subcategoria: servicio.subcategoria,
    calculationMethod: servicio.calculationMethod,
    precioBase: servicio.precioBase,
    precioPorPersona: servicio.precioPorPersona,
    invitadosPorUnidad: servicio.invitadosPorUnidad,
    tramosDePrecio: servicio.tramosDePrecio,
  };

  const total = recalcularCostoItem(itemDataForCalc, adultos, 0, 0);
  const qtyTarget = getGuestCountForItem(itemDataForCalc, adultos, 0, 0);

  switch (servicio.calculationMethod) {
    case 'porPersona':
      return { qty: qtyTarget, unitPrice: servicio.precioPorPersona || 0, total };
    case 'ratio': {
      const ratio = Number(servicio.invitadosPorUnidad) || 1;
      return { qty: Math.ceil(qtyTarget / ratio), unitPrice: servicio.precioBase || 0, total };
    }
    case 'tramos':
      return { qty: 1, unitPrice: total, total };
    case 'fijo':
    default:
      return { qty: 1, unitPrice: servicio.precioVenta || 0, total };
  }
};

export default function CatalogoServiciosSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [servicios, setServicios] = useState<ServicioEmpresa[]>([]);
  const [config, setConfig] = useState<ArmadoRapidoConfig | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [servicesData, configData] = await Promise.all([getServiciosEmpresa(), getArmadoRapidoConfig()]);
        if (!mounted) return;
        const onlyServices = (Array.isArray(servicesData) ? servicesData : []).filter((item) => item.tipoItem === 'Servicio');
        setServicios(onlyServices);
        setConfig(configData);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredServicios = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return servicios;

    return servicios.filter((servicio) => {
      return (
        servicio.nombre.toLowerCase().includes(term) ||
        (servicio.categoria || '').toLowerCase().includes(term) ||
        (servicio.subcategoria || '').toLowerCase().includes(term)
      );
    });
  }, [searchTerm, servicios]);

  const serviciosById = useMemo(() => {
    return servicios.reduce((acc, servicio) => {
      acc[servicio.id] = servicio;
      return acc;
    }, {} as Record<string, ServicioEmpresa>);
  }, [servicios]);

  const groupedServicios = useMemo(() => {
    return filteredServicios.reduce((acc, servicio) => {
      const category = servicio.categoria || 'Otros';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(servicio);
      return acc;
    }, {} as Record<string, ServicioEmpresa[]>);
  }, [filteredServicios]);

  const categories = useMemo(() => Object.keys(groupedServicios).sort(), [groupedServicios]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Catálogo de Servicios & Paquetes</h1>
          <p className="text-muted-foreground">Visualizá los paquetes configurados y todo el catálogo agrupado por categoría.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/empresa/servicios/nuevo">
            <Button>
              <PackagePlus className="w-4 h-4 mr-2" />
              Agregar Servicio
            </Button>
          </Link>
          <Link href="/settings/budget-display">
            <Button variant="outline">
              <Layers className="w-4 h-4 mr-2" />
              Configurar Paquetes
            </Button>
          </Link>
          <Link href="/settings/ajuste-precios">
            <Button variant="outline">
              <TrendingUp className="w-4 h-4 mr-2" />
              Ajuste de Precios
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Settings
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : servicios.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-muted-foreground font-medium">No hay servicios cargados.</p>
            <Link href="/empresa/servicios/nuevo">
              <Button>
                <PackagePlus className="w-4 h-4 mr-2" />
                Agregar Servicio
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Paquetes Configurados</CardTitle>
              <CardDescription>Total estimado por paquete considerando {GUESTS_FOR_ESTIMATE} personas.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(config?.paquetes || []).map((paquete) => {
                const detailedServices = paquete.serviciosIncluidos
                  .map((included) => {
                    const servicio = serviciosById[included.id];
                    if (!servicio) return null;
                    const calc = getServicioCalculatedData(servicio, GUESTS_FOR_ESTIMATE);
                    return {
                      id: servicio.id,
                      nombre: servicio.nombre,
                      esRegalo: !!included.esRegalo,
                      qty: calc.qty,
                      unitPrice: calc.unitPrice,
                      total: included.esRegalo ? 0 : calc.total,
                    };
                  })
                  .filter(Boolean) as Array<{
                  id: string;
                  nombre: string;
                  esRegalo: boolean;
                  qty: number;
                  unitPrice: number;
                  total: number;
                }>;

                const packageTotal = detailedServices.reduce((sum, service) => sum + service.total, 0);

                return (
                  <Card key={paquete.id} className="border border-indigo-100 bg-indigo-50/40">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{paquete.nombre}</CardTitle>
                      {paquete.descripcion && <CardDescription>{paquete.descripcion}</CardDescription>}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {detailedServices.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay servicios vinculados a este paquete.</p>
                      ) : (
                        <div className="space-y-2">
                          {detailedServices.map((service) => (
                            <div key={service.id} className="flex items-start justify-between gap-3 text-sm border-b border-dashed pb-2 last:border-b-0">
                              <div>
                                <p className="font-medium leading-tight">{service.nombre}</p>
                                <p className="text-xs text-muted-foreground">{service.qty} x {formatCurrency(service.unitPrice)}</p>
                              </div>
                              <div className="text-right">
                                {service.esRegalo && <Badge variant="secondary">Regalo</Badge>}
                                <p className="font-semibold">{formatCurrency(service.total)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="pt-2 border-t">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Total estimado ({GUESTS_FOR_ESTIMATE} personas)</p>
                        <p className="text-lg font-bold text-primary">{formatCurrency(packageTotal)}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Todos los Servicios</CardTitle>
              <CardDescription>Catálogo completo agrupado por categoría.</CardDescription>
              <div className="relative pt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="pl-10 pr-10"
                  placeholder="Buscar por nombre, categoría o subcategoría..."
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No se encontraron servicios para "{searchTerm}".</p>
              ) : (
                <Accordion type="multiple" defaultValue={categories} className="space-y-3">
                  {categories.map((category) => (
                    <AccordionItem key={category} value={category} className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2 text-left">
                          <span className="font-semibold">{category}</span>
                          <Badge variant="outline">{groupedServicios[category]?.length || 0}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid gap-3 md:grid-cols-2">
                          {groupedServicios[category]?.map((servicio) => {
                            const calc = getServicioCalculatedData(servicio, GUESTS_FOR_ESTIMATE);
                            return (
                              <Card key={servicio.id} className="border bg-slate-50/40">
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-base">{servicio.nombre}</CardTitle>
                                  <div className="flex gap-2 flex-wrap">
                                    <Badge variant="secondary">{getCalculationMethodLabel(servicio.calculationMethod)}</Badge>
                                    {servicio.subcategoria && <Badge variant="outline">{servicio.subcategoria}</Badge>}
                                  </div>
                                </CardHeader>
                                <CardContent className="text-sm space-y-1">
                                  <div className="flex justify-between gap-3">
                                    <span className="text-muted-foreground">Precio unitario</span>
                                    <span className="font-medium">{formatCurrency(calc.unitPrice)}</span>
                                  </div>
                                  <div className="flex justify-between gap-3">
                                    <span className="text-muted-foreground">Costo base</span>
                                    <span>{formatCurrency(servicio.valorUnitarioEstimado)}</span>
                                  </div>
                                  <div className="flex justify-between gap-3 pt-1 border-t mt-2">
                                    <span className="text-muted-foreground">Estimado ({GUESTS_FOR_ESTIMATE} personas)</span>
                                    <span className="font-semibold text-primary">{formatCurrency(calc.total)}</span>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
