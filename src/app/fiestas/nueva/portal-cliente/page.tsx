
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, KeyRound, ClipboardCopy, Share2, MessageCircle, Plus, Trash2, GlassWater, HelpCircle, Edit2, Building2, CreditCard, Eye, EyeOff, RefreshCw, PackageCheck, CheckCircle2, Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, ClientPortalSettings, BebidaCalculable, FaqItem, CuentaBancaria, ClienteDebeLlevarItem, ClientePortalExperience } from '@/types/fiesta';
import { getFiestaById, updatePortalSettingsFiestaActual, updateClientePortalExperienceFiestaActual } from '@/app/actions/fiesta-actual';
import { updateFaqPortal } from '@/app/actions/fiesta/portal.actions';
import { updateClienteDebeLlevar } from '@/app/actions/fiesta/fiesta.actions';
import { getCompanyInfo } from '@/app/actions/settings';
import { Separator } from '@/components/ui/separator';
import { useSearchParams } from 'next/navigation';
import { defaultClientPortalSettings, defaultBebidaItems, defaultFaq, defaultClienteDebeLlevar } from '@/lib/fiesta-defaults';

/** Create URL-friendly slug segments for portal access keys. */
function createSlugFromText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
}

function generatePortalAccessKey(fiesta?: FiestaEnPlanificacion | null): string {
  const base = createSlugFromText(
    fiesta?.configuracion?.nombreEvento ||
    fiesta?.configuracion?.tipoCelebracion ||
    'evento'
  ) || 'evento';
  const suffix = (fiesta?.id || `${Date.now()}`).replace(/[^a-zA-Z0-9]/g, '').slice(-6).toLowerCase();
  return `cliente-vip-${base}-${suffix}`;
}

const portalModules: { id: keyof Omit<ClientPortalSettings, 'enabled' | 'accessKey'>, label: string }[] = [
    { id: 'checklist', label: 'Checklist de Tareas del Cliente' },
    { id: 'itinerario', label: 'Cronograma del Evento' },
    { id: 'musica', label: 'Sugerencias Musicales' },
    { id: 'videoVida', label: 'Carga de Fotos para Video' },
    { id: 'listaRegalos', label: 'Ver Lista de Regalos' },
    { id: 'documentos', label: 'Documentos' },
    { id: 'notasCliente', label: 'Mensajes y observaciones' },
    { id: 'invitados', label: 'Lista de Invitados y Asignación de Mesas' },
    { id: 'paginaPublica', label: 'Acceso a Página Pública' },
    { id: 'fotografiaYFilmacion', label: 'Seguimiento de Fotografía/Video' },
    { id: 'pagos', label: 'Mostrar Pagos y Saldo' },
    { id: 'simuladorInvitados', label: 'Agregar invitados o servicios' },
    { id: 'calculadoraBebidas', label: 'Bebidas y extras' },
    { id: 'moodboard', label: 'Moodboard / Galería de Inspiración' },
    { id: 'contrato', label: 'Contrato y Documentos' },
    { id: 'serviciosContratados', label: '¿Qué estoy contratando? (Servicios)' },
    { id: 'ubicacion', label: 'Ubicación y Mapa del Evento' },
    { id: 'menu', label: 'Menú del Evento' },
    { id: 'cartaTragos', label: 'Carta de Tragos' },
    { id: 'dressCode', label: 'Dress Code' },
    { id: 'faq', label: 'Preguntas frecuentes' },
    { id: 'informarPago', label: '💳 Informar Pago (Portal VIP)' },
];

function ClientPortalConfigContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  const [portalSettings, setPortalSettings] = useState<ClientPortalSettings>(defaultClientPortalSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Portal experience (cover photo, color, welcome message)
  const [portalExperience, setPortalExperience] = useState<ClientePortalExperience>({});
  const [isSavingExperience, setIsSavingExperience] = useState(false);

  // FAQ editor state
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
  const [isSavingFaq, setIsSavingFaq] = useState(false);

  // Bank accounts state
  const [cuentasBancarias, setCuentasBancarias] = useState<CuentaBancaria[]>([]);
  const [isSavingCuentas, setIsSavingCuentas] = useState(false);
  const [fiestaData, setFiestaData] = useState<FiestaEnPlanificacion | null>(null);

  // Drink calculator items state
  const [bebidasItems, setBebidasItems] = useState<BebidaCalculable[]>(defaultBebidaItems);

  // clienteDebeLlevar state
  const [debeLlevarItems, setDebeLlevarItems] = useState<ClienteDebeLlevarItem[]>(defaultClienteDebeLlevar);
  const [isSavingLlevar, setIsSavingLlevar] = useState(false);
  const [newLlevarTexto, setNewLlevarTexto] = useState('');

  const loadData = useCallback(async () => {
    if (!fiestaId) return;
    setIsLoading(true);
    try {
      const fiestaData = await getFiestaById(fiestaId);
      if (!fiestaData) throw new Error("Fiesta no encontrada");
      setFiestaData(fiestaData);
      const settings = fiestaData.clientPortalSettings || defaultClientPortalSettings;
      const companyInfo = await getCompanyInfo();
      const cuentasEmpresa = companyInfo.cuentasBancariasPortal ?? [];
      setPortalSettings(settings);
      setFaqItems(fiestaData.faqPortal ?? defaultFaq);
      setCuentasBancarias(settings.cuentasBancarias?.length ? settings.cuentasBancarias : cuentasEmpresa);
      setPortalExperience(fiestaData.clientePortalExperience ?? {});

      // Resolve drink items with backward compat
      const calc = settings.calculadoraBebidas;
      if (calc?.items && calc.items.length > 0) {
        setBebidasItems(calc.items);
      } else {
        setBebidasItems(defaultBebidaItems);
      }
      // Load clienteDebeLlevar
      setDebeLlevarItems(fiestaData.clienteDebeLlevar && fiestaData.clienteDebeLlevar.length > 0
        ? fiestaData.clienteDebeLlevar
        : defaultClienteDebeLlevar);
    } catch (e: any) {
      toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, fiestaId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSavePortalSettings = async () => {
    if (!portalSettings || !fiestaId) return;
    setIsSaving(true);
    try {
      // Always persist the current bebidasItems into settings before saving
      const settingsToSave: ClientPortalSettings = {
        ...portalSettings,
        calculadoraBebidas: {
          ...portalSettings.calculadoraBebidas,
          items: bebidasItems,
        },
      };
      const result = await updatePortalSettingsFiestaActual(fiestaId, settingsToSave);
      if (result.success) {
        setPortalSettings(settingsToSave);
        toast({ title: "Configuración Guardada", description: "Los ajustes del portal del cliente se han actualizado." });
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
       toast({ title: "Error al Guardar", description: e.message, variant: "destructive" });
    } finally {
       setIsSaving(false);
    }
  };

  const handleSaveFaq = async () => {
    if (!fiestaId) return;
    setIsSavingFaq(true);
    try {
      const result = await updateFaqPortal(fiestaId, faqItems);
      if (result.success) {
        toast({ title: "FAQ Guardado", description: "Las preguntas frecuentes fueron actualizadas." });
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: "Error al Guardar", description: e.message, variant: "destructive" });
    } finally {
      setIsSavingFaq(false);
    }
  };

  const handleSaveExperience = async () => {
    if (!fiestaId) return;
    setIsSavingExperience(true);
    try {
      const result = await updateClientePortalExperienceFiestaActual(fiestaId, portalExperience);
      if (result.success) {
        toast({ title: "Personalización guardada", description: "El diseño del portal fue actualizado." });
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: "Error al Guardar", description: e.message, variant: "destructive" });
    } finally {
      setIsSavingExperience(false);
    }
  };

  const handleSaveCuentas = async () => {
    if (!fiestaId) return;
    setIsSavingCuentas(true);
    try {
      const updatedSettings: ClientPortalSettings = { ...portalSettings, cuentasBancarias };
      const result = await updatePortalSettingsFiestaActual(fiestaId, updatedSettings);
      if (result.success) {
        setPortalSettings(updatedSettings);
        toast({ title: "Cuentas guardadas", description: "Los datos bancarios fueron actualizados en el portal." });
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: "Error al Guardar", description: e.message, variant: "destructive" });
    } finally {
      setIsSavingCuentas(false);
    }
  };

  const addCuenta = () => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? `cuenta_${crypto.randomUUID()}`
      : `cuenta_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setCuentasBancarias(prev => [
      ...prev,
      { id, banco: '', titular: '', numero: '', tipo: '' },
    ]);
  };

  const removeCuenta = (id: string) => {
    setCuentasBancarias(prev => prev.filter(c => c.id !== id));
  };

  const updateCuenta = (id: string, field: keyof CuentaBancaria, value: string) => {
    setCuentasBancarias(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const syncCuentasDesdeEmpresa = async () => {
    try {
      const companyInfo = await getCompanyInfo();
      const cuentasEmpresa = companyInfo.cuentasBancariasPortal ?? [];
      setCuentasBancarias(cuentasEmpresa);
      toast({
        title: "Sincronizado desde Empresa",
        description: cuentasEmpresa.length > 0
          ? "Se cargaron las cuentas bancarias generales."
          : "No hay cuentas bancarias configuradas en Empresa > Configuración de empresa.",
      });
    } catch {
      toast({ title: "Error", description: "No se pudieron sincronizar las cuentas desde Empresa.", variant: "destructive" });
    }
  };

  const handlePortalSwitch = (moduleId: keyof Omit<ClientPortalSettings, 'enabled' | 'accessKey'>, field: 'visible' | 'editable', value: boolean) => {
    setPortalSettings(prev => {
      if (!prev) return defaultClientPortalSettings;
      const moduleSettings = prev[moduleId] || { visible: false };
      return {
        ...prev,
        [moduleId]: { ...moduleSettings, [field]: value }
      };
    });
  };

  const getModuleVisibility = (moduleId: keyof Omit<ClientPortalSettings, 'enabled' | 'accessKey'>): boolean => {
    const mod = portalSettings[moduleId];
    if (mod && typeof mod === 'object' && 'visible' in mod) {
      return !!(mod as { visible: boolean }).visible;
    }
    return false;
  };

  // Bebidas item helpers
  const updateBebidaItem = (id: string, field: keyof BebidaCalculable, value: any) => {
    setBebidasItems(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const addBebidaItem = () => {
    const newItem: BebidaCalculable = {
      id: `bebida_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      nombre: 'Nuevo item',
      emoji: '🥃',
      cantidadPorPersona: 1,
      unidad: 'unidades',
      clienteLleva: false,
      visible: true,
      color: 'sky',
    };
    setBebidasItems(prev => [...prev, newItem]);
  };

  const removeBebidaItem = (id: string) => {
    setBebidasItems(prev => prev.filter(b => b.id !== id));
  };

  // FAQ helpers
  const addFaqItem = () => {
    const newFaq: FaqItem = {
      id: `faq_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      pregunta: '',
      respuesta: '',
    };
    setFaqItems(prev => [...prev, newFaq]);
  };

  const updateFaqItem = (id: string, field: keyof FaqItem, value: string) => {
    setFaqItems(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const removeFaqItem = (id: string) => {
    setFaqItems(prev => prev.filter(f => f.id !== id));
  };

  const publicPortalLink =
    typeof window !== 'undefined' && portalSettings.accessKey
      ? `${window.location.origin}/portal/c/${portalSettings.accessKey}`
      : '';

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(portalSettings.accessKey || '');
    toast({ title: "Contraseña del portal copiada al portapapeles" });
  };

  const handleCopyPublicLink = () => {
    navigator.clipboard.writeText(publicPortalLink);
    toast({ title: "Enlace copiado al portapapeles" });
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      `¡Hola! Aquí podés ver el portal de tu evento: ${publicPortalLink}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank', 'noopener,noreferrer');
  };


  if (isLoading) {
    return <div className="p-8 max-w-2xl mx-auto"><Loader2 className="w-8 h-8 animate-spin"/></div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <KeyRound className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Portal del Cliente</h1>
        </div>
        <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver al Planificador</Button></Link>
      </div>

       <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2">
              Configuración del Portal
            </CardTitle>
            <CardDescription>Controla qué información puede ver y editar tu cliente en su portal privado.</CardDescription>
          </CardHeader>
           <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div>
                  <Label htmlFor="portal-enabled" className="text-base font-medium">Habilitar Portal del Cliente</Label>
                  <p className="text-sm text-muted-foreground">Permite el acceso del cliente a su portal personalizado.</p>
                </div>
                <Switch id="portal-enabled" checked={portalSettings.enabled} onCheckedChange={(val) => setPortalSettings(p => {
                  const current = p || defaultClientPortalSettings;
                  const accessKey = val && !current.accessKey
                    ? generatePortalAccessKey(fiestaData)
                    : current.accessKey;
                  return { ...current, enabled: val, accessKey };
                })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="portal-password">Contraseña de Acceso del Cliente</Label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="portal-password"
                      type={showPassword ? 'text' : 'password'}
                      value={portalSettings.accessKey || ''}
                      onChange={(e) => setPortalSettings(p => ({...(p || defaultClientPortalSettings), accessKey: e.target.value}))}
                      placeholder="Ej: cliente-vip-cumpleanos-15-abc123"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                    </button>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    title="Generar enlace sugerido"
                    onClick={() => setPortalSettings(p => ({...(p || defaultClientPortalSettings), accessKey: generatePortalAccessKey(fiestaData)}))}
                  >
                    <RefreshCw className="w-4 h-4"/>
                  </Button>
                  <Button type="button" size="icon" variant="outline" onClick={handleCopyPassword} disabled={!portalSettings.accessKey}><ClipboardCopy className="w-4 h-4"/></Button>
                </div>
                <p className="text-xs text-muted-foreground">Usá un enlace legible (ej: cliente-vip-nombre-evento) o generá uno sugerido con el botón 🔄.</p>
                {portalSettings.enabled && (
                  <p className="text-xs text-muted-foreground">Este valor actúa como contraseña de acceso. El enlace oficial para compartir con el cliente está abajo.</p>
                )}
              </div>
              {portalSettings.enabled && (
                <div className="space-y-4 animate-in fade-in-20">
                  {publicPortalLink && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-primary" />
                        <Label>Enlace para compartir con el cliente</Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Este es el enlace oficial para compartir con el cliente. Lleva directamente al portal sin necesidad de contraseña.
                      </p>
                      <div className="flex items-center gap-2">
                        <Input value={publicPortalLink} readOnly className="text-xs" />
                        <Button type="button" size="icon" variant="outline" onClick={handleCopyPublicLink}>
                          <ClipboardCopy className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white"
                        onClick={handleShareWhatsApp}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Enviar por WhatsApp
                      </Button>
                    </div>
                  )}
                  <Separator/>
                   <h4 className="text-md font-medium pt-2">Módulos Visibles para el Cliente</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {portalModules.map(mod => (
                            <div key={mod.id} className="flex items-center space-x-2 p-3 border rounded-md">
                                <Switch
                                    id={`switch-${mod.id}`}
                                    checked={getModuleVisibility(mod.id)}
                                    onCheckedChange={(v) => handlePortalSwitch(mod.id, 'visible', v)}
                                />
                                <Label htmlFor={`switch-${mod.id}`}>{mod.label}</Label>
                            </div>
                        ))}
                   </div>

                   {/* Simulador de invitados config */}
                   {getModuleVisibility('simuladorInvitados') && (
                     <>
                       <Separator />
                       <h4 className="text-md font-medium pt-2">Configuración del Simulador de Invitados</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-1.5">
                           <Label htmlFor="limiteReduccion">Límite de reducción (%)</Label>
                           <Input
                             id="limiteReduccion"
                             type="number"
                             min={0}
                             max={100}
                             value={portalSettings.simuladorInvitadosConfig?.limiteReduccionPorcentaje ?? 10}
                             onChange={e => setPortalSettings(prev => ({
                               ...prev,
                               simuladorInvitadosConfig: {
                                 limiteReduccionPorcentaje: Number(e.target.value),
                                 limiteAumentoPorcentaje: prev.simuladorInvitadosConfig?.limiteAumentoPorcentaje ?? 30,
                                 penalizacionReduccion: prev.simuladorInvitadosConfig?.penalizacionReduccion ?? true,
                                 textoReduccion: prev.simuladorInvitadosConfig?.textoReduccion,
                                 textoAumento: prev.simuladorInvitadosConfig?.textoAumento,
                               }
                             }))}
                           />
                           <p className="text-xs text-muted-foreground">Cuánto puede bajar el cliente (ej: 10 = 10%)</p>
                         </div>
                         <div className="space-y-1.5">
                           <Label htmlFor="limiteAumento">Límite de aumento (%)</Label>
                           <Input
                             id="limiteAumento"
                             type="number"
                             min={0}
                             max={200}
                             value={portalSettings.simuladorInvitadosConfig?.limiteAumentoPorcentaje ?? 30}
                             onChange={e => setPortalSettings(prev => ({
                               ...prev,
                               simuladorInvitadosConfig: {
                                 limiteReduccionPorcentaje: prev.simuladorInvitadosConfig?.limiteReduccionPorcentaje ?? 10,
                                 limiteAumentoPorcentaje: Number(e.target.value),
                                 penalizacionReduccion: prev.simuladorInvitadosConfig?.penalizacionReduccion ?? true,
                                 textoReduccion: prev.simuladorInvitadosConfig?.textoReduccion,
                                 textoAumento: prev.simuladorInvitadosConfig?.textoAumento,
                               }
                             }))}
                           />
                           <p className="text-xs text-muted-foreground">Máximo que puede agregar (ej: 30 = 30%)</p>
                         </div>
                         <div className="flex items-center space-x-2">
                           <Switch
                             id="penalizacion"
                             checked={portalSettings.simuladorInvitadosConfig?.penalizacionReduccion ?? true}
                             onCheckedChange={v => setPortalSettings(prev => ({
                               ...prev,
                               simuladorInvitadosConfig: {
                                 limiteReduccionPorcentaje: prev.simuladorInvitadosConfig?.limiteReduccionPorcentaje ?? 10,
                                 limiteAumentoPorcentaje: prev.simuladorInvitadosConfig?.limiteAumentoPorcentaje ?? 30,
                                 penalizacionReduccion: v,
                                 textoReduccion: prev.simuladorInvitadosConfig?.textoReduccion,
                                 textoAumento: prev.simuladorInvitadosConfig?.textoAumento,
                               }
                             }))}
                           />
                           <Label htmlFor="penalizacion">Mostrar aviso de penalización al reducir</Label>
                         </div>
                         <div className="space-y-1.5 md:col-span-2">
                           <Label htmlFor="textoReduccion">Texto personalizado al reducir (opcional)</Label>
                           <Input
                             id="textoReduccion"
                             placeholder="Ej: Reducir invitados (penalización aplicable)"
                             value={portalSettings.simuladorInvitadosConfig?.textoReduccion ?? ''}
                             onChange={e => setPortalSettings(prev => ({
                               ...prev,
                               simuladorInvitadosConfig: {
                                 limiteReduccionPorcentaje: prev.simuladorInvitadosConfig?.limiteReduccionPorcentaje ?? 10,
                                 limiteAumentoPorcentaje: prev.simuladorInvitadosConfig?.limiteAumentoPorcentaje ?? 30,
                                 penalizacionReduccion: prev.simuladorInvitadosConfig?.penalizacionReduccion ?? true,
                                 textoReduccion: e.target.value || undefined,
                                 textoAumento: prev.simuladorInvitadosConfig?.textoAumento,
                               }
                             }))}
                           />
                         </div>
                         <div className="space-y-1.5 md:col-span-2">
                           <Label htmlFor="textoAumento">Texto personalizado al agregar (opcional)</Label>
                           <Input
                             id="textoAumento"
                             placeholder="Ej: Agregar invitados extra"
                             value={portalSettings.simuladorInvitadosConfig?.textoAumento ?? ''}
                             onChange={e => setPortalSettings(prev => ({
                               ...prev,
                               simuladorInvitadosConfig: {
                                 limiteReduccionPorcentaje: prev.simuladorInvitadosConfig?.limiteReduccionPorcentaje ?? 10,
                                 limiteAumentoPorcentaje: prev.simuladorInvitadosConfig?.limiteAumentoPorcentaje ?? 30,
                                 penalizacionReduccion: prev.simuladorInvitadosConfig?.penalizacionReduccion ?? true,
                                 textoReduccion: prev.simuladorInvitadosConfig?.textoReduccion,
                                 textoAumento: e.target.value || undefined,
                               }
                             }))}
                           />
                         </div>
                       </div>
                     </>
                   )}
                </div>
              )}
           </CardContent>
          <CardFooter>
            <Button onClick={handleSavePortalSettings} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>} Guardar Configuración del Portal
            </Button>
          </CardFooter>
        </Card>

      {/* Portal Experience / Personalization Card */}
      {portalSettings.enabled && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-500" />
              Personalización de la Portada
            </CardTitle>
            <CardDescription>Configurá la imagen de portada, color principal y mensajes que verá el cliente al ingresar a su portal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="hero-url">URL de imagen de portada</Label>
              <Input
                id="hero-url"
                placeholder="https://... (URL pública de la foto)"
                value={portalExperience.heroImageUrl ?? ''}
                onChange={e => setPortalExperience(p => ({ ...p, heroImageUrl: e.target.value || undefined }))}
              />
              <p className="text-xs text-muted-foreground">Dejá vacío para usar la foto del/de la protagonista del evento.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="primary-color">Color principal del portal</Label>
              <div className="flex items-center gap-3">
                <input
                  id="primary-color"
                  type="color"
                  value={portalExperience.primaryColor ?? '#7c3aed'}
                  onChange={e => setPortalExperience(p => ({ ...p, primaryColor: e.target.value }))}
                  className="h-9 w-16 rounded border cursor-pointer"
                />
                <Input
                  value={portalExperience.primaryColor ?? ''}
                  onChange={e => setPortalExperience(p => ({ ...p, primaryColor: e.target.value || undefined }))}
                  placeholder="#7c3aed"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="welcome-msg">Mensaje de bienvenida</Label>
              <Textarea
                id="welcome-msg"
                placeholder="Ej: ¡Hola! Estamos muy contentos de organizar tu fiesta. 🎉"
                value={portalExperience.welcomeMessage ?? ''}
                onChange={e => setPortalExperience(p => ({ ...p, welcomeMessage: e.target.value || undefined }))}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="organizer-msg">Mensaje del organizador (aparece como nota resaltada)</Label>
              <Textarea
                id="organizer-msg"
                placeholder="Ej: Recordá que el día del evento tenés que traer..."
                value={portalExperience.organizerMessage ?? ''}
                onChange={e => setPortalExperience(p => ({ ...p, organizerMessage: e.target.value || undefined }))}
                rows={2}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="simplicity-mode"
                checked={portalExperience.simplicityMode ?? false}
                onCheckedChange={v => setPortalExperience(p => ({ ...p, simplicityMode: v }))}
              />
              <Label htmlFor="simplicity-mode">Modo simplificado (solo info esencial: pagos, invitados, llevar)</Label>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveExperience} disabled={isSavingExperience}>
              {isSavingExperience && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>} Guardar Personalización
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Drink Calculator Editor */}
      {portalSettings.enabled && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2">
              <GlassWater className="w-5 h-5 text-blue-500" />
              Calculadora de Bebidas y Extras
            </CardTitle>
            <CardDescription>Configurá bebidas y otros items que lleva el cliente (postres, torta, servicios subcontratados, etc.).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {bebidasItems.map((item) => (
              <div key={item.id} className="border rounded-lg p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={item.emoji}
                    onChange={e => updateBebidaItem(item.id, 'emoji', e.target.value)}
                    className="w-14 text-center text-lg"
                    maxLength={4}
                    placeholder="🍺"
                  />
                  <Input
                    value={item.nombre}
                    onChange={e => updateBebidaItem(item.id, 'nombre', e.target.value)}
                    className="flex-1"
                    placeholder="Nombre del item"
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeBebidaItem(item.id)} className="text-destructive shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Cantidad por persona</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.1}
                      value={item.cantidadPorPersona}
                      onChange={e => updateBebidaItem(item.id, 'cantidadPorPersona', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Unidad</Label>
                    <Input
                      value={item.unidad}
                      onChange={e => updateBebidaItem(item.id, 'unidad', e.target.value)}
                      placeholder="unidades, litros, kg..."
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`bebida-visible-${item.id}`}
                      checked={item.visible}
                      onCheckedChange={v => updateBebidaItem(item.id, 'visible', v)}
                    />
                    <Label htmlFor={`bebida-visible-${item.id}`} className="text-xs">Visible</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`bebida-clienteLleva-${item.id}`}
                      checked={item.clienteLleva}
                      onCheckedChange={v => updateBebidaItem(item.id, 'clienteLleva', v)}
                    />
                    <Label htmlFor={`bebida-clienteLleva-${item.id}`} className="text-xs">Cliente lleva</Label>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <Label className="text-xs">Color</Label>
                    <Input
                      value={item.color}
                      onChange={e => updateBebidaItem(item.id, 'color', e.target.value)}
                      className="w-24 text-xs"
                      placeholder="amber, sky..."
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" className="w-full" onClick={addBebidaItem}>
              <Plus className="w-4 h-4 mr-2" /> Agregar item
            </Button>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSavePortalSettings} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Guardar Bebidas y Extras
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* FAQ Editor */}
      {portalSettings.enabled && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              Preguntas Frecuentes (FAQ)
            </CardTitle>
            <CardDescription>Agregá las preguntas más comunes de tus clientes para que las vean en su portal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {faqItems.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                No hay preguntas aún. Agregá la primera.
              </p>
            )}
            {faqItems.map((faq, idx) => (
              <div key={faq.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-bold text-muted-foreground pt-2.5 shrink-0">#{idx + 1}</span>
                  <div className="flex-1 space-y-2">
                    <Input
                      value={faq.pregunta}
                      onChange={e => updateFaqItem(faq.id, 'pregunta', e.target.value)}
                      placeholder="Pregunta..."
                      className="text-sm font-medium"
                    />
                    <Textarea
                      value={faq.respuesta}
                      onChange={e => updateFaqItem(faq.id, 'respuesta', e.target.value)}
                      placeholder="Respuesta..."
                      rows={2}
                      className="resize-none text-sm"
                    />
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeFaqItem(faq.id)} className="text-destructive shrink-0 mt-1">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" className="w-full" onClick={addFaqItem}>
              <Plus className="w-4 h-4 mr-2" /> Agregar pregunta
            </Button>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveFaq} disabled={isSavingFaq}>
              {isSavingFaq && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Guardar FAQ
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* clienteDebeLlevar Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PackageCheck className="w-5 h-5 text-teal-600" />
            Lo que el cliente debe llevar
          </CardTitle>
          <CardDescription>
            Configurá la lista de ítems que el cliente debe preparar y traer al evento. El cliente puede marcarlos como enviados desde su portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {debeLlevarItems.map((item) => (
            <div key={item.id} className="flex items-center gap-2 border rounded-xl p-3 bg-slate-50">
              <button
                type="button"
                onClick={() => setDebeLlevarItems(prev => prev.map(i => i.id === item.id ? { ...i, obligatorio: !i.obligatorio } : i))}
                className={`shrink-0 text-xs px-2 py-1 rounded-lg border font-semibold transition-all
                  ${item.obligatorio ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-100 border-slate-200 text-slate-400'}`}
                title="Marcar como obligatorio"
              >
                {item.obligatorio ? '* Oblig.' : 'Opcional'}
              </button>
              <Input
                value={item.texto}
                onChange={e => setDebeLlevarItems(prev => prev.map(i => i.id === item.id ? { ...i, texto: e.target.value } : i))}
                className="flex-1 h-8 text-sm"
              />
              <Input
                placeholder="Notas (opcional)"
                value={item.notas || ''}
                onChange={e => setDebeLlevarItems(prev => prev.map(i => i.id === item.id ? { ...i, notas: e.target.value } : i))}
                className="w-32 h-8 text-xs"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive h-8 w-8 shrink-0"
                onClick={() => setDebeLlevarItems(prev => prev.filter(i => i.id !== item.id))}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              placeholder="Nuevo ítem (ej: Torta de cumpleaños)"
              value={newLlevarTexto}
              onChange={e => setNewLlevarTexto(e.target.value)}
              className="flex-1 text-sm"
              onKeyDown={e => {
                if (e.key === 'Enter' && newLlevarTexto.trim()) {
                  setDebeLlevarItems(prev => [...prev, { id: `dl_${Date.now()}`, texto: newLlevarTexto.trim(), completado: false }]);
                  setNewLlevarTexto('');
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!newLlevarTexto.trim()}
              onClick={() => {
                if (!newLlevarTexto.trim()) return;
                setDebeLlevarItems(prev => [...prev, { id: `dl_${Date.now()}`, texto: newLlevarTexto.trim(), completado: false }]);
                setNewLlevarTexto('');
              }}
            >
              <Plus className="w-4 h-4 mr-1" /> Agregar
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={async () => {
              if (!fiestaId) return;
              setIsSavingLlevar(true);
              try {
                const res = await updateClienteDebeLlevar(fiestaId, debeLlevarItems);
                if (res.success) toast({ title: '✅ Lista guardada', description: 'El cliente verá la lista actualizada.' });
                else throw new Error((res as { success: false; error?: string }).error ?? 'Error al guardar');
              } catch (e) {
                const msg = e instanceof Error ? e.message : 'Error desconocido';
                toast({ title: 'No se pudo guardar la lista', description: `${msg}. Por favor, intentá nuevamente.`, variant: 'destructive' });
              } finally {
                setIsSavingLlevar(false);
              }
            }}
            disabled={isSavingLlevar}
          >
            {isSavingLlevar && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Guardar lista
          </Button>
        </CardFooter>
      </Card>

      {/* Bank Accounts Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="w-5 h-5 text-primary" />
            Datos Bancarios (Portal VIP)
          </CardTitle>
          <CardDescription>
            Configurá aquí las cuentas que verá el cliente al informar pagos. Podés sincronizarlas desde Empresa → Configuración de empresa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button type="button" variant="outline" size="sm" onClick={syncCuentasDesdeEmpresa} className="w-full rounded-xl">
            <RefreshCw className="w-4 h-4 mr-2" /> Sincronizar desde Empresa
          </Button>
          {cuentasBancarias.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-3 border border-dashed rounded-xl">
              Sin cuentas bancarias configuradas
            </p>
          )}
          {cuentasBancarias.map((cuenta) => (
            <div key={cuenta.id} className="border rounded-xl p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-bold text-muted-foreground">Banco</Label>
                  <Input value={cuenta.banco} onChange={e => updateCuenta(cuenta.id, 'banco', e.target.value)} placeholder="Ej: BROU" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs font-bold text-muted-foreground">Titular</Label>
                  <Input value={cuenta.titular} onChange={e => updateCuenta(cuenta.id, 'titular', e.target.value)} placeholder="Nombre del titular" className="h-9 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-bold text-muted-foreground">Número de Cuenta</Label>
                  <Input value={cuenta.numero} onChange={e => updateCuenta(cuenta.id, 'numero', e.target.value)} placeholder="Nº de cuenta" className="h-9 text-sm font-mono" />
                </div>
                <div>
                  <Label className="text-xs font-bold text-muted-foreground">Tipo</Label>
                  <Input value={cuenta.tipo ?? ''} onChange={e => updateCuenta(cuenta.id, 'tipo', e.target.value)} placeholder="Caja de ahorro, etc." className="h-9 text-sm" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="button" variant="ghost" size="sm" onClick={() => removeCuenta(cuenta.id)} className="text-destructive hover:text-destructive h-8">
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addCuenta} className="w-full rounded-xl">
            <Plus className="w-4 h-4 mr-2" /> Agregar Cuenta Bancaria
          </Button>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveCuentas} disabled={isSavingCuentas}>
            {isSavingCuentas && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Guardar Datos Bancarios
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function ClientPortalPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
            <ClientPortalConfigContent />
        </Suspense>
    )
}
