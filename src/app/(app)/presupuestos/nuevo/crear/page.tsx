'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Loader2, PlusCircle, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Presupuesto, PresupuestoFormData, ItemPresupuestado } from '@/types/presupuesto';
import type { ServicioEmpresa } from '@/types/empresa';
import type { PaqueteArmadoRapido, MenuArmadoRapido, ArmadoRapidoConfig } from '@/types/armado-rapido';
import { savePresupuesto, getPresupuestoById, updatePresupuesto } from '@/app/actions/presupuestos';
import { getFiestaById, updateFiestaPresupuestoId } from '@/app/actions/fiesta-actual';
import { precargaDesdeFiesta, nombreDeLaFiesta } from '@/lib/presupuestos/precarga-desde-fiesta';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import { getArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import { Paso1DatosEvento } from '@/components/presupuestos/paso-1-datos-evento';
import Paso2Servicios from '@/components/presupuestos/paso-2-servicios';
import Paso3Resumen from '@/components/presupuestos/paso-3-resumen';
import { Progress } from '@/components/ui/progress';
import { getMenus } from '@/app/actions/menus-catering';
import type { FullMenu, MenuItem } from '@/types/catering';
import { getOcupiedDates } from '@/app/actions/agenda';
import { getGuestCountForItem, recalcularCostoItem, calculateSuggestedQuantity } from '@/lib/calculations';
import { getBudgetDisplaySettings } from '@/app/actions/settings';
import { defaultBudgetDisplaySettings } from '@/types/settings';
import { conTopeDeEspera } from '@/lib/ui/tope-de-espera';
import { obtenerIntentoPresupuestoManual, terminarIntentoPresupuestoManual } from '@/lib/budget/intento-configurador';
import { parseUruguayDate } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const SESSION_STORAGE_KEY = 'presupuestoEnProgreso_v3';

const initialFormData: PresupuestoFormData = {
  clienteNombre: '',
  clienteContacto: '',
  eventoTipo: '',
  eventoFecha: undefined,
  eventoHoraInicio: '',
  duracionHoras: undefined,
  invitadosCantidad: 50,
  invitadosAdultos: 50,
  invitadosNinos: 0,
  invitadosAdolescentes: 0,
  salonFiestas: '',
  protagonista1Nombre: '',
  protagonista2Nombre: '',
  nombreEmpresa: '',
  serviciosSeleccionados: new Map(),
  selectedMenuId: '',
  notas: '',
  estado: 'Borrador',
  nombrePromocion: 'Descuento Promocional',
  descuentoTipo: 'porcentaje',
  descuentoValor: '10', 
  vigenciaPromocion: 'Válido por 30 días',
};

function readStoredDraftFromSession(): PresupuestoFormData | null {
    if (typeof window === 'undefined') return null;
    try {
        const storedState = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (storedState) {
            const parsed = JSON.parse(storedState);
            return {
                ...initialFormData,
                ...parsed,
                serviciosSeleccionados: new Map(Array.isArray(parsed.serviciosSeleccionados) ? parsed.serviciosSeleccionados : []),
                eventoFecha: parsed.eventoFecha ? new Date(parsed.eventoFecha) : undefined,
            } as PresupuestoFormData;
        }
    } catch (error) { console.error("Failed to parse form state", error); }
    return null;
}

function hasDraftWithContent(draft: PresupuestoFormData | null | undefined): boolean {
    if (!draft) return false;
    return Boolean(
        draft.clienteNombre?.trim()
        || draft.clienteContacto?.trim()
        || draft.eventoTipo?.trim()
        || draft.eventoFecha
        || draft.salonFiestas?.trim()
        || draft.protagonista1Nombre?.trim()
        || draft.protagonista2Nombre?.trim()
        || draft.nombreEmpresa?.trim()
        || draft.selectedMenuId?.trim()
        || draft.notas?.trim()
        || (draft.serviciosSeleccionados && draft.serviciosSeleccionados.size > 0)
    );
}

function formStateInitializer(initialState: PresupuestoFormData): PresupuestoFormData {
    return readStoredDraftFromSession() ?? initialState;
}

/**
 * Decodifica parámetros URI sin romper el flujo:
 * si decodeURIComponent falla, retorna el valor original.
 */
function safeDecodeParam(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

function safePositiveNumberParam(value: string | null): number | undefined {
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function parseIncomingParamsFromSearch(searchParams: { get(k: string): string | null; getAll(k: string): string[] }) {
    const leadName = searchParams.get('leadName') || searchParams.get('cliente');
    const leadPhone = searchParams.get('leadPhone');
    const serviciosParams = searchParams.getAll('servicios');
    const serviciosParam = searchParams.get('servicios');
    let entradasParams = searchParams.getAll('entradas');
    if (entradasParams.length === 0 && typeof window !== 'undefined') {
        try {
            const raw = sessionStorage.getItem('presentacion_entradas_seleccionadas');
            const parsed = raw ? JSON.parse(raw) : [];
            if (Array.isArray(parsed)) entradasParams = parsed.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
        } catch {
            // ignore
        }
    }
    const validEntradas = entradasParams.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
    const menuIdParam = searchParams.get('menuId');
    const teenMenuIdParam = searchParams.get('teenMenuId');
    const adultosParam = safePositiveNumberParam(searchParams.get('adultos'));
    const ninosParam = safePositiveNumberParam(searchParams.get('ninos'));
    const fechaParam = searchParams.get('fecha');
    const tipoParam = searchParams.get('tipoFiesta');
    const duracionParam = safePositiveNumberParam(searchParams.get('duracionHoras'));
    const salonParam = searchParams.get('salon');
    const hasIncomingProposalParams = Boolean(
        leadName
        || leadPhone
        || fechaParam
        || tipoParam
        || duracionParam !== undefined
        || salonParam
        || adultosParam !== undefined
        || ninosParam !== undefined
        || serviciosParams.length > 0
        || serviciosParam
        || menuIdParam
        || teenMenuIdParam
        || validEntradas.length > 0
    );

    const baseForm: PresupuestoFormData = {
        ...initialFormData,
        serviciosSeleccionados: new Map(),
    };
    if (leadName) baseForm.clienteNombre = safeDecodeParam(leadName);
    if (leadPhone) baseForm.clienteContacto = safeDecodeParam(leadPhone);
    if (tipoParam) baseForm.eventoTipo = safeDecodeParam(tipoParam);
    if (fechaParam && fechaParam.trim()) {
        const trimmedFecha = fechaParam.trim();
        const parsedDate = parseUruguayDate(trimmedFecha);
        const isValidDateInput = /^\d{4}-\d{2}-\d{2}$/.test(trimmedFecha) || !Number.isNaN(Date.parse(trimmedFecha));
        if (isValidDateInput && !Number.isNaN(parsedDate.getTime())) {
            baseForm.eventoFecha = parsedDate;
        }
    }
    if (duracionParam !== undefined && duracionParam > 0) {
        baseForm.duracionHoras = duracionParam;
    }
    if (salonParam) baseForm.salonFiestas = safeDecodeParam(salonParam);
    if (adultosParam !== undefined) baseForm.invitadosAdultos = adultosParam;
    if (ninosParam !== undefined) {
        baseForm.invitadosAdolescentes = ninosParam;
        baseForm.invitadosNinos = 0;
    }
    baseForm.invitadosCantidad =
        (baseForm.invitadosAdultos || 0) +
        (baseForm.invitadosNinos || 0) +
        (baseForm.invitadosAdolescentes || 0);
    if (menuIdParam) baseForm.selectedMenuId = menuIdParam;

    return {
        hasIncomingProposalParams,
        baseForm,
        validEntradas,
        serviciosParams,
        serviciosParam,
        menuIdParam,
        teenMenuIdParam,
    };
}

function CrearPresupuestoContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const savingRef = useRef(false);
    const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
    const [serviciosCatalogo, setServiciosCatalogo] = useState<ServicioEmpresa[]>([]);
    const [paquetesBase, setPaquetesBase] = useState<PaqueteArmadoRapido[]>([]);
    const [allMenus, setAllMenus] = useState<FullMenu[]>([]);
    const [entradasDePresentacion, setEntradasDePresentacion] = useState<string[]>([]);
    const [paso, setPaso] = useState(1);
    
    const conflictResolvedRef = useRef(false);
    const pendingConflictActiveRef = useRef(false);
    const [hasHydratedDraft, setHasHydratedDraft] = useState(false);
    const [pendingIncomingProposal, setPendingIncomingProposal] = useState<{
        draftClientName: string;
        formData: PresupuestoFormData;
        entradas: string[];
    } | null>(null);
    const [formData, setFormData] = useState<PresupuestoFormData>(() => formStateInitializer(initialFormData));
    const [editingPresupuestoId, setEditingPresupuestoId] = useState<string | null>(null);
    const [occupiedDates, setOccupiedDates] = useState<Date[]>([]);
    const [occupiedDatesFailed, setOccupiedDatesFailed] = useState(false);
    const [armadoConfig, setArmadoConfig] = useState<ArmadoRapidoConfig | null>(null);
    const [annualAdjustmentPercentage, setAnnualAdjustmentPercentage] = useState<number>(
        defaultBudgetDisplaySettings.annualAdjustmentPercentage ?? 15,
    );
    
    const leadIdFromParams = searchParams.get('leadId');
    // La fiesta para la que se arma el presupuesto (viene de la ficha de la fiesta).
    const [fiestaDelPresupuesto, setFiestaDelPresupuesto] = useState<{ id: string; nombre: string; presupuestoId?: string } | null>(null);

    const mapServicioToSeleccion = useCallback((servicio: ServicioEmpresa, adultos: number, ninos: number) => ({
        cantidad: calculateSuggestedQuantity({
            calculationMethod: servicio.calculationMethod,
            invitadosPorUnidad: servicio.invitadosPorUnidad,
            nombreServicio: servicio.nombre,
            categoriaServicio: servicio.categoria,
            subcategoria: servicio.subcategoria,
        }, adultos, ninos),
        precioUnitarioOriginal: servicio.precioVenta || servicio.precioPorPersona || servicio.precioBase || 0,
        precioUnitarioPresupuesto: servicio.precioVenta || servicio.precioPorPersona || servicio.precioBase || 0,
        nombreServicio: servicio.nombre,
        unidad: servicio.unidad,
        categoriaServicio: servicio.categoria,
        subcategoria: servicio.subcategoria,
        esRegalo: false,
        calculationMethod: servicio.calculationMethod,
        precioBase: servicio.precioBase,
        precioPorPersona: servicio.precioPorPersona,
        invitadosPorUnidad: servicio.invitadosPorUnidad,
        tramosDePrecio: servicio.tramosDePrecio,
    }), []);

    const mapMenuItemToSeleccion = useCallback((item: MenuItem, adultos: number, ninos: number) => {
        const precio = Number(item.suggestedSellingPrice) || Number(item.totalDishCost) || 0;
        const subcategoria = item.type || 'Catering';
        const nombreServicio = item.name;
        const cantidad = calculateSuggestedQuantity({
            calculationMethod: 'porPersona',
            nombreServicio,
            categoriaServicio: 'Servicio de catering',
            subcategoria,
        }, adultos, ninos);
        return {
            cantidad,
            precioUnitarioOriginal: precio,
            precioUnitarioPresupuesto: precio,
            nombreServicio,
            unidad: 'personas',
            categoriaServicio: 'Servicio de catering',
            subcategoria,
            esRegalo: false,
            calculationMethod: 'porPersona' as const,
            precioPorPersona: precio,
        };
    }, []);

    const fetchServicios = useCallback(async () => {
        try {
            const services = await getServiciosEmpresa();
            setServiciosCatalogo(services.filter(s => s.tipoItem === 'Servicio'));
        } catch (error) {
            toast({ title: "Error", description: "No se pudo recargar el catálogo de servicios.", variant: "destructive" });
        }
    }, [toast]);

    useEffect(() => {
        if (!hasHydratedDraft || pendingIncomingProposal || !hasDraftWithContent(formData)) return;
        try {
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
                ...formData,
                serviciosSeleccionados: Array.from(formData.serviciosSeleccionados.entries())
            }));
        } catch (error) { console.warn("Could not save form state", error); }
    }, [formData, hasHydratedDraft, pendingIncomingProposal]);

    useEffect(() => {
        if (searchParams.get('editId')) {
            pendingConflictActiveRef.current = false;
            setHasHydratedDraft(true);
            return;
        }
        const storedDraft = readStoredDraftFromSession();
        const incoming = parseIncomingParamsFromSearch(searchParams);
        if (incoming.hasIncomingProposalParams) {
            if (!conflictResolvedRef.current && storedDraft && hasDraftWithContent(storedDraft)) {
                pendingConflictActiveRef.current = true;
                setFormData(storedDraft);
                setPendingIncomingProposal({
                    draftClientName: (storedDraft.clienteNombre || '').trim() || 'otro cliente',
                    formData: incoming.baseForm,
                    entradas: incoming.validEntradas,
                });
            } else {
                pendingConflictActiveRef.current = false;
                setEntradasDePresentacion(incoming.validEntradas);
                setFormData(incoming.baseForm);
            }
        } else if (storedDraft && hasDraftWithContent(storedDraft)) {
            pendingConflictActiveRef.current = false;
            setFormData(storedDraft);
        } else {
            pendingConflictActiveRef.current = false;
        }
        setHasHydratedDraft(true);
    }, [searchParams]);

    // SYNC LOGIC: Auto-update quantities of selected items when guest count changes
    useEffect(() => {
        setFormData(prev => {
            if (prev.serviciosSeleccionados.size === 0) return prev;

            const adultos = prev.invitadosAdultos || 0;
            const ninos = (prev.invitadosNinos || 0) + (prev.invitadosAdolescentes || 0);

            let changed = false;
            const newSelected = new Map(prev.serviciosSeleccionados);

            newSelected.forEach((item, id) => {
                if (item.calculationMethod === 'porPersona' || item.calculationMethod === 'ratio') {
                    const newQty = calculateSuggestedQuantity(item, adultos, ninos);
                    if (item.cantidad !== newQty) {
                        newSelected.set(id, { ...item, cantidad: newQty });
                        changed = true;
                    }
                }
            });

            if (!changed) return prev;
            return { ...prev, serviciosSeleccionados: newSelected };
        });
    }, [formData.invitadosAdultos, formData.invitadosNinos, formData.invitadosAdolescentes]);

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoadingInitialData(true);
            try {
                const editId = searchParams.get('editId');
                setEditingPresupuestoId(editId);

                const [config, menuData, services, occupiedDatesStrings, budgetSettings] = await Promise.all([
                    getArmadoRapidoConfig(), 
                    getMenus(), 
                    getServiciosEmpresa(),
                    // Si falla la lectura NO se toma como "ninguna fecha ocupada": se avisa en pantalla.
                    getOcupiedDates().catch((occupiedError) => {
                        console.error('[crear presupuesto] no se pudieron leer las fechas ocupadas:', occupiedError);
                        return null;
                    }),
                    getBudgetDisplaySettings(),
                ]);
                setArmadoConfig(config);
                setOccupiedDatesFailed(occupiedDatesStrings === null);
                setOccupiedDates((occupiedDatesStrings ?? []).map(d => new Date(d)));
                setServiciosCatalogo(services.filter(s => s.tipoItem === 'Servicio'));
                setPaquetesBase(config.paquetes || []);
                setAllMenus(menuData || []);
                setAnnualAdjustmentPercentage(
                    budgetSettings.annualAdjustmentPercentage
                    ?? defaultBudgetDisplaySettings.annualAdjustmentPercentage
                    ?? 15,
                );

                if (editId) {
                    const presupuestoToEdit = await getPresupuestoById(editId);
                    if (presupuestoToEdit) {
                        const serviciosMap = new Map();
                        presupuestoToEdit.itemsPresupuestados.forEach(item => {
                            serviciosMap.set(item.idServicioCatalogo, {
                                cantidad: item.cantidad,
                                precioUnitarioOriginal: item.precioUnitario,
                                precioUnitarioPresupuesto: item.precioUnitarioPresupuesto,
                                nombreServicio: item.nombreServicio,
                                unidad: item.unidad,
                                categoriaServicio: item.categoriaServicio,
                                subcategoria: item.subcategoria,
                                esRegalo: item.esRegalo,
                                calculationMethod: item.calculationMethod,
                                precioBase: item.precioBase,
                                precioPorPersona: item.precioPorPersona,
                                invitadosPorUnidad: item.invitadosPorUnidad,
                                tramosDePrecio: item.tramosDePrecio,
                            });
                        });
                        setFormData({
                            ...presupuestoToEdit,
                            eventoFecha: new Date(presupuestoToEdit.eventoFecha),
                            eventoHoraInicio: presupuestoToEdit.eventoHoraInicio || '',
                            serviciosSeleccionados: serviciosMap,
                            descuentoValor: presupuestoToEdit.descuentoValor?.toString() || '10'
                        } as PresupuestoFormData);
                    }
                } else {
                    const incoming = parseIncomingParamsFromSearch(searchParams);
                    const hasConflict = Boolean(incoming.hasIncomingProposalParams && !conflictResolvedRef.current && pendingConflictActiveRef.current);
                    let waitForDraftChoice = hasConflict;

                    if (incoming.hasIncomingProposalParams) {
                        const baseForm = incoming.baseForm;
                        const resolvedMap = new Map(baseForm.serviciosSeleccionados);
                        const adultos = baseForm.invitadosAdultos || 0;
                        const ninos = (baseForm.invitadosNinos || 0) + (baseForm.invitadosAdolescentes || 0);
                        const menuItems = menuData.flatMap(menu => menu.items || []);
                        const addSelection = (id: string) => {
                            const servicio = services.find(s => s.id === id);
                            if (servicio) {
                                resolvedMap.set(id, mapServicioToSeleccion(servicio, adultos, ninos));
                                return;
                            }
                            const menuItem = menuItems.find(item => item.id === id);
                            if (menuItem) {
                                resolvedMap.set(id, mapMenuItemToSeleccion(menuItem, adultos, ninos));
                            }
                        };

                        if (incoming.serviciosParams.length > 0) {
                            incoming.serviciosParams
                                .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
                                .forEach(addSelection);
                        } else if (incoming.serviciosParam) {
                            try {
                                const parsed = JSON.parse(incoming.serviciosParam);
                                const selectedIds = Array.isArray(parsed) ? parsed : [];
                                selectedIds
                                    .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
                                    .forEach(addSelection);
                            } catch {
                                // ignore malformed query param
                            }
                        }

                        if (incoming.validEntradas.length > 0) {
                            incoming.validEntradas.forEach(addSelection);
                        }
                        if (incoming.menuIdParam) {
                            baseForm.selectedMenuId = incoming.menuIdParam;
                            addSelection(incoming.menuIdParam);
                        }
                        if (incoming.teenMenuIdParam) {
                            addSelection(incoming.teenMenuIdParam);
                        }

                        if (hasConflict) {
                            baseForm.serviciosSeleccionados = resolvedMap;
                            setPendingIncomingProposal(prev => (
                                prev
                                    ? {
                                        ...prev,
                                        formData: baseForm,
                                        entradas: incoming.validEntradas,
                                      }
                                    : prev
                            ));
                        } else {
                            setEntradasDePresentacion(incoming.validEntradas);
                            setFormData(prev => {
                                const merged = new Map(prev.serviciosSeleccionados);
                                resolvedMap.forEach((v, k) => merged.set(k, v));
                                return {
                                    ...prev,
                                    selectedMenuId: incoming.menuIdParam || prev.selectedMenuId,
                                    serviciosSeleccionados: merged,
                                };
                            });
                        }
                    }

                    // Viene de la ficha de una fiesta: se adelantan cliente, fecha e invitados que ya
                    // estan cargados. Lo que mande el planificador (leadName, fecha, adultos...) manda.
                    const fiestaIdParam = searchParams.get('fiestaId');
                    if (fiestaIdParam) {
                        try {
                            const fiesta = await getFiestaById(fiestaIdParam);
                            if (fiesta) {
                                if (!waitForDraftChoice) {
                                    const precarga = precargaDesdeFiesta(fiesta);
                                    setFormData(prev => {
                                        const siguiente: Record<string, unknown> = { ...prev };
                                        for (const [clave, valor] of Object.entries(precarga)) {
                                            const actual = (prev as unknown as Record<string, unknown>)[clave];
                                            const inicial = (initialFormData as unknown as Record<string, unknown>)[clave];
                                            if (actual === undefined || actual === '' || actual === inicial) siguiente[clave] = valor;
                                        }
                                        return siguiente as unknown as PresupuestoFormData;
                                    });
                                }
                                setFiestaDelPresupuesto({ id: fiesta.id, nombre: nombreDeLaFiesta(fiesta), presupuestoId: fiesta.presupuestoId });
                            } else {
                                toast({ title: 'No encontramos la fiesta', description: 'El presupuesto se arma en blanco.', variant: 'destructive' });
                            }
                        } catch (fiestaError) {
                            console.error('[crear presupuesto] no se pudo leer la fiesta:', fiestaError);
                            toast({ title: 'No se pudo leer la fiesta', description: 'El presupuesto se arma en blanco.', variant: 'destructive' });
                        }
                    }
                }
            } catch (error) {
                toast({ title: "Error", description: "No se pudieron cargar datos iniciales.", variant: "destructive" });
            } finally {
                setIsLoadingInitialData(false);
            }
        };
        fetchInitialData();
    }, [searchParams, toast, fetchServicios, mapServicioToSeleccion, mapMenuItemToSeleccion]);

    const handleNext = () => {
        if (paso === 1) {
             if (!formData.clienteNombre.trim()) {
                 toast({ title: "Requerido", description: "Por favor, completa el nombre del cliente para continuar.", variant: "destructive" });
                 return;
             }
             const invalido = [formData.invitadosAdultos, formData.invitadosAdolescentes, formData.invitadosNinos].some(
                 (v) => v !== null && v !== undefined && (!Number.isInteger(v) || v < 0),
             );
             if (invalido) {
                 toast({ title: "Cantidad inválida", description: "Las cantidades de invitados deben ser números enteros mayores o iguales a 0.", variant: "destructive" });
                 return;
             }
        }
        if (paso < 3) setPaso(p => p + 1);
    };
    
    const handlePrev = () => { if (paso > 1) setPaso(p => p - 1); };
    
    const totalInvitados = (formData.invitadosAdultos || 0) + (formData.invitadosNinos || 0) + (formData.invitadosAdolescentes || 0);

    const totalCalculado = useMemo(() => {
      let total = 0;
      formData.serviciosSeleccionados.forEach((item, id) => {
        const itemDataForCalc: ItemPresupuestado = {
          idServicioCatalogo: id,
          ...item,
          precioUnitario: item.precioUnitarioPresupuesto,
          costoTotalItem: 0,
        };
        total += recalcularCostoItem(itemDataForCalc, formData.invitadosAdultos || 0, formData.invitadosAdolescentes || 0, formData.invitadosNinos || 0);
      });
      return total;
    }, [formData]);

    const handleSave = async () => {
        if (savingRef.current) return;
        const descuentoValorNum = parseFloat(formData.descuentoValor || '0') || 0;
        const eventoYear = formData.eventoFecha?.getFullYear();
        const createdYear = new Date(formData.timestamp || Date.now()).getFullYear();
        const shouldApplyAnnualAdjustment = Boolean(eventoYear && eventoYear > createdYear);
        const presupuestoData: Omit<Presupuesto, 'id'> = {
            clienteNombre: formData.clienteNombre,
            clienteContacto: formData.clienteContacto,
            eventoTipo: formData.eventoTipo,
            eventoFecha: formData.eventoFecha?.toISOString() || '',
            eventoHoraInicio: formData.eventoHoraInicio?.trim() || undefined,
            duracionHoras: formData.duracionHoras,
            invitadosCantidad: totalInvitados,
            invitadosAdultos: formData.invitadosAdultos || 0,
            invitadosNinos: formData.invitadosNinos || 0,
            invitadosAdolescentes: formData.invitadosAdolescentes || 0,
            salonFiestas: formData.salonFiestas,
            protagonista1Nombre: formData.protagonista1Nombre,
            protagonista2Nombre: formData.protagonista2Nombre,
            nombreEmpresa: formData.nombreEmpresa,
            itemsPresupuestados: Array.from(formData.serviciosSeleccionados.entries()).map(([id, serv]) => {
              return {
                idServicioCatalogo: id,
                nombreServicio: serv.nombreServicio,
                cantidad: serv.cantidad,
                unidad: serv.unidad,
                precioUnitario: serv.precioUnitarioOriginal,
                precioUnitarioPresupuesto: serv.precioUnitarioPresupuesto,
                costoTotalItem: 0, 
                esRegalo: serv.esRegalo,
                categoriaServicio: serv.categoriaServicio,
                subcategoria: serv.subcategoria,
                calculationMethod: serv.calculationMethod,
                precioBase: serv.precioBase,
                precioPorPersona: serv.precioPorPersona,
                invitadosPorUnidad: serv.invitadosPorUnidad,
                tramosDePrecio: serv.tramosDePrecio,
              };
            }),
            selectedMenuId: formData.selectedMenuId || undefined,
            costoTotalEstimado: 0, 
            nombrePromocion: formData.nombrePromocion,
            descuentoTipo: formData.descuentoTipo,
            descuentoValor: descuentoValorNum > 0 ? descuentoValorNum : undefined,
            vigenciaPromocion: formData.vigenciaPromocion,
            cuponCodigo: formData.cuponCodigo,
            cuponId: formData.cuponId,
            notas: formData.notas,
            estado: formData.estado,
            invoiceId: formData.invoiceId,
            marketingMarkupPercent: formData.marketingMarkupPercent,
            ajusteAnualActivo: shouldApplyAnnualAdjustment,
            ajusteAnualPorcentaje: shouldApplyAnnualAdjustment ? annualAdjustmentPercentage : undefined,
            timestamp: formData.timestamp || new Date().toISOString(),
        };
        
        savingRef.current = true;
        setIsSaving(true);
        try {
          let result;
          // Un corte puede ocurrir despues de guardar: conservar la clave hasta
          // recibir confirmacion para que reintentar recupere el mismo presupuesto.
          if (editingPresupuestoId) {
            result = await conTopeDeEspera(updatePresupuesto({ ...presupuestoData, id: editingPresupuestoId }));
          } else {
            const operationId = await obtenerIntentoPresupuestoManual({ ...presupuestoData, leadId: leadIdFromParams || undefined });
            result = await conTopeDeEspera(savePresupuesto(presupuestoData, { source: 'manual', leadId: leadIdFromParams || undefined, operationId }));
          }

          if (result.success && result.id) {
            // Registrar uso de cupón si se aplicó uno
            // Tambien al editar: antes se excluia la edicion y el uso del cupon
            // nunca quedaba anotado. El servidor no lo cuenta dos veces por el
            // mismo presupuesto.
            if (formData.cuponId && formData.cuponDescuento) {
              try {
                const { registrarUsoCupon } = await import('@/app/actions/cupones');
                const usoRes = await registrarUsoCupon(formData.cuponId, result.id, formData.clienteNombre, formData.cuponDescuento, totalCalculado);
                if (!usoRes?.success) {
                  toast({
                    title: 'El cupón no quedó registrado',
                    description: `El presupuesto se guardó con el descuento, pero el cupón NO quedó anotado como usado y puede seguir figurando disponible.${usoRes?.error ? ` Motivo: ${usoRes.error}` : ''} Revisalo en Promociones.`,
                    variant: 'destructive',
                  });
                }
              } catch (e) {
                console.warn('Error registrando uso de cupón:', e);
                toast({
                  title: 'El cupón no quedó registrado',
                  description: 'El presupuesto se guardó con el descuento, pero el cupón NO quedó anotado como usado y puede seguir figurando disponible. Revisalo en Promociones.',
                  variant: 'destructive',
                });
              }
            }
            // Armado para una fiesta que todavia no tiene presupuesto: se enlaza al guardar.
            if (!editingPresupuestoId && fiestaDelPresupuesto && !fiestaDelPresupuesto.presupuestoId) {
              try {
                const enlace = await updateFiestaPresupuestoId(fiestaDelPresupuesto.id, result.id);
                if (!enlace?.success) {
                  toast({ title: 'El presupuesto no quedó enlazado a la fiesta', description: enlace?.error || 'Enlazalo desde la ficha de la fiesta.', variant: 'destructive' });
                }
              } catch (enlaceError) {
                console.warn('[crear presupuesto] no se pudo enlazar a la fiesta:', enlaceError);
                toast({ title: 'El presupuesto no quedó enlazado a la fiesta', description: 'Enlazalo desde la ficha de la fiesta.', variant: 'destructive' });
              }
            }
            toast({ title: `Presupuesto ${editingPresupuestoId ? 'Actualizado' : 'Guardado'}` });
            if (result.avisoCrm) {
              toast({ title: 'Ojo con el seguimiento', description: result.avisoCrm, variant: 'destructive' });
            }
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
            if (!editingPresupuestoId) terminarIntentoPresupuestoManual();
            router.push(`/presupuestos/${result.id}/ver`);
          } else { throw new Error(result.error || "Error al guardar"); }
        } catch (error: any) {
          toast({ title: "Error al Guardar", description: error.message, variant: "destructive" });
        } finally {
          savingRef.current = false;
          setIsSaving(false);
        }
    };
    
    const isPromo10Activa =
        formData.descuentoTipo === 'porcentaje'
        && Number(formData.descuentoValor) === 10
        && !formData.cuponCodigo;
    const descuentoPromo10Monto = isPromo10Activa ? Math.round(totalCalculado * 0.1) : 0;

    return (
        <div data-testid="presupuesto-wizard" className="space-y-6">
            <Dialog
                open={Boolean(pendingIncomingProposal)}
                onOpenChange={(open) => {
                    if (!open) {
                        conflictResolvedRef.current = true;
                        pendingConflictActiveRef.current = false;
                        setPendingIncomingProposal(null);
                    }
                }}
            >
                <DialogContent data-testid="borrador-vs-propuesta-dialog">
                    <DialogHeader>
                        <DialogTitle>Tenés un presupuesto guardado</DialogTitle>
                        <DialogDescription>
                            Tenés un presupuesto a medio hacer de {pendingIncomingProposal?.draftClientName}. ¿Seguís con ése o empezás con esta propuesta?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            data-testid="btn-continuar-borrador"
                            onClick={() => {
                                conflictResolvedRef.current = true;
                                pendingConflictActiveRef.current = false;
                                setPendingIncomingProposal(null);
                            }}
                        >
                            Seguir con el borrador
                        </Button>
                        <Button
                            type="button"
                            data-testid="btn-aplicar-propuesta"
                            onClick={() => {
                                if (!pendingIncomingProposal) return;
                                conflictResolvedRef.current = true;
                                pendingConflictActiveRef.current = false;
                                setEntradasDePresentacion(pendingIncomingProposal.entradas);
                                setFormData(pendingIncomingProposal.formData);
                                setPendingIncomingProposal(null);
                            }}
                        >
                            Empezar con esta propuesta
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
             <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">{editingPresupuestoId ? 'Modificar Presupuesto' : 'Crear Presupuesto'}</h1>
                    {(formData.clienteNombre || '').trim() && (
                        <p className="text-sm text-muted-foreground">Cliente: {formData.clienteNombre}</p>
                    )}
                </div>
                <Button asChild variant="outline" disabled={isSaving}><Link href="/presupuestos/nuevo"><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Link></Button>
            </div>
            {fiestaDelPresupuesto && !editingPresupuestoId && (
                <p data-testid="presupuesto-para-fiesta" className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-semibold">
                    Presupuesto para la fiesta {fiestaDelPresupuesto.nombre}
                </p>
            )}
            {entradasDePresentacion.length > 0 && (
                <div data-testid="entradas-cargadas-banner" className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900">
                    Entradas seleccionadas desde la presentación LED ({entradasDePresentacion.length}):
                    <div className="flex flex-wrap gap-2 mt-1">
                        {entradasDePresentacion.map(id => (
                            <span key={id} data-testid={`entrada-cargada-${id}`} className="inline-block bg-emerald-200 text-emerald-800 rounded px-2 py-0.5 text-xs font-mono">
                                {id}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Paso {paso} de 3: {['Datos del Evento', 'Selección de Servicios', 'Resumen y Descuentos'][paso-1]}</CardTitle>
                    <Progress value={(paso / 3) * 100} className="w-full h-2 mt-2" />
                </CardHeader>
                <CardContent>
                    {isLoadingInitialData && (Boolean(editingPresupuestoId) || (paso === 2 && !armadoConfig)) ? <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div> : (
                        <>
                            {paso === 1 && occupiedDatesFailed && (
                                <p role="alert" className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
                                    No pudimos leer las fechas ocupadas: revisá el calendario antes de confirmar la fecha.
                                </p>
                            )}
                            {paso === 1 && <Paso1DatosEvento formData={formData} setFormData={setFormData} occupiedDates={occupiedDates} />}
                            {paso === 2 && <Paso2Servicios formData={formData} setFormData={setFormData} serviciosCatalogo={serviciosCatalogo} paquetesBase={paquetesBase} allMenus={allMenus} onCatalogUpdate={fetchServicios} totalInvitados={totalInvitados} config={armadoConfig} />}
                            {paso === 3 && (
                                <>
                                    <Paso3Resumen formData={formData} setFormData={setFormData} totalCalculado={totalCalculado} totalInvitados={totalInvitados} annualAdjustmentPercentage={annualAdjustmentPercentage} />
                                    {isPromo10Activa && (
                                        <div
                                            data-testid="resumen-descuento-promocional-10"
                                            className="mt-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900"
                                        >
                                            <span>Descuento promocional 10%</span>
                                            <span className="font-mono font-bold">
                                                −{new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(descuentoPromo10Monto)}
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                    <Button variant="outline" onClick={handlePrev} disabled={paso === 1 || isSaving}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Anterior
                    </Button>
                    {paso < 3 ? (
                         <Button data-testid="btn-siguiente-paso" onClick={handleNext} disabled={isSaving}>
                            Siguiente <ArrowRight className="w-4 h-4 mr-2" />
                        </Button>
                    ) : (
                        <Button data-testid="btn-guardar-presupuesto" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            {isSaving ? 'Guardando...' : 'Finalizar y Generar'}
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}

export default function CrearPresupuestoPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
            <CrearPresupuestoContent />
        </Suspense>
    )
}
