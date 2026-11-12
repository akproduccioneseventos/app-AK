'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  listUsers,
  createUser,
  deleteUser,
  updateUserModules,
  adminResetUserPassword,
  abrirAccesoAuditor,
  cerrarAccesoAuditor,
  obtenerEstadoAuditor,
  type PublicUserRecord,
  type HistorialAuditorItem,
} from '@/app/actions/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  NOMBRE_DEL_PERFIL,
  PERFILES_DEL_EQUIPO,
  QUE_HACE_CADA_PERFIL,
  PERMISOS_POR_PERFIL,
  PERMISOS,
  type Perfil,
  type Permiso,
} from '@/lib/auth/perfiles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  KeyRound,
  Trash2,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Mail,
  Lock,
  Copy,
  Check,
} from 'lucide-react';

const SYSTEM_MODULES = [
  { id: 'all', label: 'Todo el Sistema (Superusuario)' },
  { id: 'crm', label: 'Gestión de Prospectos (CRM)' },
  { id: 'presupuestos', label: 'Presupuestos' },
  { id: 'clientes', label: 'Base de Clientes' },
  { id: 'eventos', label: 'Eventos y Calendario' },
  { id: 'contabilidad', label: 'Contabilidad y Finanzas' },
  { id: 'empresa', label: 'Empresa (Servicios, Empleados, Proveedores)' },
  { id: 'whatsapp', label: 'WhatsApp y Comunicación' },
] as const;


const DESCRIPCION_PERMISOS_LEGIBLE: Record<Permiso, string> = {
  [PERMISOS.CONTABILIDAD]: 'Contabilidad (presupuestos, facturas, cobros)',
  [PERMISOS.SUELDOS]: 'Sueldos del personal y liquidaciones',
  [PERMISOS.GANANCIAS]: 'Ganancias, costos y márgenes del negocio',
  [PERMISOS.CRM]: 'CRM (prospectos, seguimiento comercial, agenda)',
  [PERMISOS.ORGANIZACION]: 'Organización de fiestas (menús, cronograma, invitados)',
  [PERMISOS.NOCHE]: 'La noche del evento (puerta, muro, pantalla, estaciones)',
  [PERMISOS.INSUMOS]: 'Insumos, stock y proveedores',
  [PERMISOS.ADMINISTRACION]: 'Administración total del sistema y usuarios',
};

function InfoPerfilPermisos({ perfil }: { perfil: Perfil }) {
  const permisos = PERMISOS_POR_PERFIL[perfil] || [];
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-slate-800">Lo que ve cada persona depende de su perfil</Label>
      <div className="p-3 border rounded-xl bg-slate-50/70 space-y-2 text-sm">
        <p className="text-slate-700 font-medium text-xs leading-relaxed">
          {QUE_HACE_CADA_PERFIL[perfil]}
        </p>
        {permisos.length > 0 ? (
          <div className="space-y-1 pt-1 border-t border-slate-200/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Incluye:</span>
            <ul className="list-disc list-inside space-y-0.5 text-xs text-slate-600">
              {permisos.map((p) => (
                <li key={p}>{DESCRIPCION_PERMISOS_LEGIBLE[p] || p}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic pt-1 border-t border-slate-200/60">
            Solo acceso a su propia información de trabajo.
          </p>
        )}
      </div>
    </div>
  );
}

export default function AdminUsuariosPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<PublicUserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Modals Open State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);

  // Form State - Create
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState<'admin' | 'user'>('user');
  const [createPerfil, setCreatePerfil] = useState<Perfil>('secretaria');
  const [createModules, setCreateModules] = useState<string[]>([]);

  // Form State - Edit Permissions
  const [selectedUser, setSelectedUser] = useState<PublicUserRecord | null>(null);
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user');
  const [editPerfil, setEditPerfil] = useState<Perfil>('secretaria');
  const [editModules, setEditModules] = useState<string[]>([]);

  // Form State - Reset Password
  const [resetPassword, setResetPassword] = useState('');

  // Estado de Auditoría Externa (Orden 276)
  const [auditorEmailInput, setAuditorEmailInput] = useState('');
  const [auditorActivo, setAuditorActivo] = useState(false);
  const [auditorAbiertoEl, setAuditorAbiertoEl] = useState<string | undefined>();
  const [auditorEmailActual, setAuditorEmailActual] = useState<string | undefined>();
  const [auditorHistorial, setAuditorHistorial] = useState<HistorialAuditorItem[]>([]);
  const [claveGenerada, setClaveGenerada] = useState<string | null>(null);
  const [claveCopiada, setClaveCopiada] = useState(false);
  const [esDueno, setEsDueno] = useState(false);
  const [auditorEstadoError, setAuditorEstadoError] = useState<string | null>(null);
  const [isProcessingAuditor, setIsProcessingAuditor] = useState(false);

  const loadAuditorStatus = useCallback(async () => {
    try {
      const res = await obtenerEstadoAuditor();
      // La tarjeta es del dueño: se muestra aunque el estado no se haya podido leer,
      // con el motivo a la vista, en vez de desaparecer sin decir nada.
      if (res.success || res.esDueno) setEsDueno(true);
      if (res.success) {
        setAuditorEstadoError(null);
        setAuditorActivo(res.activo);
        setAuditorAbiertoEl(res.abiertoEl);
        setAuditorEmailActual(res.email);
        setAuditorHistorial(res.historial || []);
      } else if (res.esDueno) {
        setAuditorEstadoError(res.error || 'No se pudo leer el estado del acceso.');
      }
    } catch {
      setAuditorEstadoError('No se pudo conectar con el servidor para leer el estado del acceso.');
    }
  }, []);

  const handleAbrirAuditor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditorEmailInput.trim()) {
      toast({ title: 'Correo requerido', description: 'Ingresá el correo del auditor.', variant: 'destructive' });
      return;
    }
    setIsProcessingAuditor(true);
    try {
      const res = await abrirAccesoAuditor({ email: auditorEmailInput });
      if (res.success && res.password) {
        setClaveGenerada(res.password);
        setClaveCopiada(false);
        setAuditorEmailInput('');
        toast({ title: 'Acceso abierto', description: 'El acceso de auditor fue habilitado.' });
        await loadAuditorStatus();
      } else {
        toast({ title: 'Error', description: res.error || 'No se pudo abrir el acceso.', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsProcessingAuditor(false);
    }
  };

  const handleCerrarAuditor = async () => {
    setIsProcessingAuditor(true);
    try {
      const res = await cerrarAccesoAuditor();
      if (res.success) {
        setClaveGenerada(null);
        toast({ title: 'Acceso cerrado', description: 'El acceso de auditor fue cortado de inmediato.' });
        await loadAuditorStatus();
      } else {
        toast({ title: 'Error', description: res.error || 'No se pudo cerrar el acceso.', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsProcessingAuditor(false);
    }
  };

  const handleCopiarClave = async () => {
    if (!claveGenerada) return;
    try {
      await navigator.clipboard.writeText(claveGenerada);
    } catch {
      toast({ title: 'No se pudo copiar', description: 'Copiá la clave a mano: está escrita en pantalla.', variant: 'destructive' });
      return;
    }
    setClaveCopiada(true);
    toast({ title: 'Clave copiada', description: 'La clave se copió al portapapeles.' });
    setTimeout(() => setClaveCopiada(false), 3000);
  };

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await listUsers();
      if (res.success && res.users) {
        setUsers(res.users);
      } else {
        toast({
          title: 'Error',
          description: res.error || 'No se pudieron cargar los usuarios.',
          variant: 'destructive'
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error de red',
        description: 'Hubo un problema al conectar con el servidor.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadUsers();
    loadAuditorStatus();
  }, [loadUsers, loadAuditorStatus]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createEmail.trim() || !createPassword.trim()) {
      toast({
        title: 'Datos incompletos',
        description: 'Por favor, completá el correo y la contraseña.',
        variant: 'destructive'
      });
      return;
    }

    if (createPassword.length < 8) {
      toast({
        title: 'Contraseña débil',
        description: 'La contraseña debe tener al menos 8 caracteres.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    try {
      const res = await createUser({
        email: createEmail,
        password: createPassword,
        role: createRole,
        perfil: createPerfil,
        modules: createModules,
      });

      if (res.success) {
        toast({
          title: 'Usuario creado',
          description: `El usuario ${createEmail} fue agregado con éxito.`,
        });
        setIsCreateOpen(false);
        setCreateEmail('');
        setCreatePassword('');
        setCreateRole('user');
        setCreateModules([]);
        await loadUsers();
      } else {
        toast({
          title: 'Error',
          description: res.error || 'No se pudo crear el usuario.',
          variant: 'destructive'
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Ocurrió un error al procesar la solicitud.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditClick = (user: PublicUserRecord) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setEditPerfil(user.perfil ?? (user.role === 'admin' ? 'dueno' : 'secretaria'));
    setEditModules(user.modules);
    setIsEditOpen(true);
  };

  const handleUpdatePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsProcessing(true);
    try {
      const modulesToSave = (selectedUser.modules && selectedUser.modules.length > 0) ? selectedUser.modules : editModules;
      const res = await updateUserModules(selectedUser.id, modulesToSave, editRole, editPerfil);
      if (res.success) {
        toast({
          title: 'Permisos actualizados',
          description: 'Los accesos del usuario fueron guardados.',
        });
        setIsEditOpen(false);
        await loadUsers();
      } else {
        toast({
          title: 'Error',
          description: res.error || 'No se pudieron actualizar los permisos.',
          variant: 'destructive'
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Ocurrió un error al guardar los permisos.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetClick = (user: PublicUserRecord) => {
    setSelectedUser(user);
    setResetPassword('');
    setIsResetOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !resetPassword.trim()) return;

    if (resetPassword.length < 8) {
      toast({
        title: 'Contraseña débil',
        description: 'La contraseña debe tener al menos 8 caracteres.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    try {
      const res = await adminResetUserPassword(selectedUser.id, resetPassword);
      if (res.success) {
        toast({
          title: 'Contraseña restablecida',
          description: `Se restableció la clave de ${selectedUser.email}. Deberá cambiarla al iniciar sesión.`,
        });
        setIsResetOpen(false);
        setResetPassword('');
      } else {
        toast({
          title: 'Error',
          description: res.error || 'No se pudo restablecer la contraseña.',
          variant: 'destructive'
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Ocurrió un error al restablecer la contraseña.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteUser = async (user: PublicUserRecord) => {
    if (!confirm(`¿Estás seguro de que querés eliminar permanentemente al usuario ${user.email}?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const res = await deleteUser(user.id);
      if (res.success) {
        toast({
          title: 'Usuario eliminado',
          description: `Se eliminó al usuario ${user.email} con éxito.`,
        });
        await loadUsers();
      } else {
        toast({
          title: 'Error',
          description: res.error || 'No se pudo eliminar el usuario.',
          variant: 'destructive'
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Ocurrió un error al eliminar el usuario.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleModuleCheckboxChange = (
    moduleId: string,
    checked: boolean,
    isEdit: boolean
  ) => {
    const currentList = isEdit ? editModules : createModules;
    const setter = isEdit ? setEditModules : setCreateModules;

    if (checked) {
      if (moduleId === 'all') {
        // If "all" is checked, deselect others
        setter(['all']);
      } else {
        // Remove "all" and add current
        setter([...currentList.filter((m) => m !== 'all'), moduleId]);
      }
    } else {
      setter(currentList.filter((m) => m !== moduleId));
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Gestión de Usuarios</h1>
            <p className="text-muted-foreground text-sm">
              Administrá los accesos de tu staff y colaboradores registrados por email.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={loadUsers} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-500/20">
                <UserPlus className="w-4 h-4 mr-2" />
                Registrar Colaborador
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Colaborador</DialogTitle>
                <DialogDescription>
                  Ingresá el correo electrónico, una contraseña inicial y definí a qué áreas del sistema tendrá acceso.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="create-email">Correo Electrónico *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="create-email"
                      type="email"
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                      placeholder="nombre@akproducciones.uy"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="create-password">Contraseña Inicial *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="create-password"
                      type="password"
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="create-perfil">Perfil</Label>
                  <Select value={createPerfil} onValueChange={(val) => setCreatePerfil(val as Perfil)}>
                    <SelectTrigger id="create-perfil">
                      <SelectValue placeholder="Seleccionar perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      {PERFILES_DEL_EQUIPO.map((p) => (
                        <SelectItem key={p} value={p}>{NOMBRE_DEL_PERFIL[p]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{QUE_HACE_CADA_PERFIL[createPerfil]}</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="create-role">Rol en el Sistema</Label>
                  <Select
                    value={createRole}
                    onValueChange={(val) => setCreateRole(val as 'admin' | 'user')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Colaborador / Staff (User)</SelectItem>
                      <SelectItem value="admin">Administrador Total (Admin)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <InfoPerfilPermisos perfil={createPerfil} />
                <DialogFooter className="pt-3">
                  <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={isProcessing}>
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={isProcessing}>
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Registrar
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tarjeta de Auditoría Externa (Solo Dueño - Orden 276) */}
      {esDueno && (
        <Card className="border-amber-200/60 bg-gradient-to-br from-amber-50/50 to-orange-50/30 backdrop-blur-xl shadow-lg shadow-amber-500/5">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                  Auditoría externa
                </CardTitle>
                <CardDescription>
                  Permite a un auditor externo recorrer toda la aplicación para revisar datos reales sin poder modificar ni enviar nada.
                </CardDescription>
              </div>
              <Badge variant={auditorActivo ? "default" : "secondary"} className={auditorActivo ? "bg-emerald-600 hover:bg-emerald-700" : ""}>
                {auditorActivo ? 'Acceso abierto' : 'Acceso cerrado'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {auditorEstadoError && (
              <p role="alert" className="text-sm rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-800">
                No se pudo leer si el acceso está abierto: {auditorEstadoError} Igual podés abrirlo o cerrarlo.
              </p>
            )}
            {claveGenerada && (
              <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Clave generada (se muestra solo esta vez)
                </p>
                <div className="flex items-center gap-3">
                  <code className="text-base font-black px-3 py-1.5 rounded-lg bg-white border border-emerald-200 text-emerald-950 font-mono">
                    {claveGenerada}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopiarClave}
                    className="gap-1.5 border-emerald-300 hover:bg-emerald-100"
                  >
                    {claveCopiada ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    {claveCopiada ? 'Copiada' : 'Copiar clave'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Copiá esta clave y compartila con el auditor. Por seguridad, no volverá a mostrarse.
                </p>
              </div>
            )}

            {auditorActivo ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-amber-200 bg-white/70">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800">
                    Auditor: <span className="font-mono text-slate-600">{auditorEmailActual || 'auditor@externo.com'}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Abierto el: {auditorAbiertoEl ? new Date(auditorAbiertoEl).toLocaleString('es-UY') : 'Recientemente'}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleCerrarAuditor}
                  disabled={isProcessingAuditor}
                  className="font-bold"
                >
                  {isProcessingAuditor ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Cerrar el acceso
                </Button>
              </div>
            ) : (
              <form onSubmit={handleAbrirAuditor} className="flex flex-col sm:flex-row items-end gap-3 p-4 rounded-xl border border-slate-200 bg-white/70">
                <div className="w-full sm:flex-1 space-y-1">
                  <Label htmlFor="auditor-email" className="text-xs font-semibold">Correo del auditor</Label>
                  <Input
                    id="auditor-email"
                    type="email"
                    placeholder="auditor@empresa.com"
                    value={auditorEmailInput}
                    onChange={(e) => setAuditorEmailInput(e.target.value)}
                    required
                    className="text-sm"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isProcessingAuditor || !auditorEmailInput.trim()}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold w-full sm:w-auto"
                >
                  {isProcessingAuditor ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Abrir acceso de auditor
                </Button>
              </form>
            )}

            {auditorHistorial.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-amber-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Historial de auditorías</h4>
                <div className="max-h-40 overflow-y-auto space-y-1 text-xs">
                  {auditorHistorial.map((item, idx) => (
                    <div key={item.id || idx} className="flex items-center justify-between p-2 rounded-lg bg-white/50 border border-slate-100">
                      <span className="font-mono font-medium text-slate-700">{item.email}</span>
                      <span className="text-slate-500">
                        {new Date(item.abiertoEl).toLocaleDateString('es-UY')}
                        {item.cerradoEl ? ` hasta ${new Date(item.cerradoEl).toLocaleDateString('es-UY')}` : ' (Abierto)'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabla de Usuarios */}
      <Card className="border-indigo-100/50 bg-white/95 backdrop-blur-xl shadow-lg shadow-indigo-500/5">
        <CardHeader className="pb-3">
          <CardTitle>Colaboradores Registrados</CardTitle>
          <CardDescription>
            Listado de cuentas activas de administración. Podés editar sus accesos o restablecer sus contraseñas en cualquier momento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground text-sm">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              Cargando cuentas...
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No hay colaboradores registrados todavía. ¡Creá el primero!
            </div>
          ) : (
            <div className="border rounded-xl overflow-hidden bg-white">
              <Table>
                <TableHeader className="bg-slate-50/75">
                  <TableRow>
                    <TableHead className="font-bold">Usuario / Email</TableHead>
                    <TableHead className="font-bold">Rol</TableHead>
                    <TableHead className="font-bold">Módulos Habilitados</TableHead>
                    <TableHead className="font-bold text-center">Seguridad</TableHead>
                    <TableHead className="font-bold text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-medium py-3.5">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-800">{user.email}</span>
                          <span className="text-[10px] text-muted-foreground">
                            Creado: {new Date(user.createdAt).toLocaleDateString('es-UY')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <Badge
                          variant={user.role === 'admin' ? 'default' : 'secondary'}
                          className={
                            user.role === 'admin'
                              ? 'bg-gradient-to-r from-red-600 to-amber-600 border-none text-white'
                              : 'bg-indigo-50 border-indigo-100 text-indigo-700 font-semibold'
                          }
                        >
                          {user.role === 'admin' ? 'Administrador' : 'Colaborador'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3.5 max-w-xs sm:max-w-md">
                        <div className="flex flex-wrap gap-1">
                          {user.modules.includes('all') ? (
                            <Badge className="bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold">
                              Acceso Total
                            </Badge>
                          ) : user.modules.length === 0 ? (
                            <Badge variant="outline" className="text-slate-400">
                              Ninguno
                            </Badge>
                          ) : (
                            user.modules.map((m) => {
                              const moduleLabel =
                                SYSTEM_MODULES.find((sm) => sm.id === m)?.label.split(' (')[0] || m;
                              return (
                                <Badge key={m} variant="outline" className="bg-slate-50 text-slate-700">
                                  {moduleLabel}
                                </Badge>
                              );
                            })
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 text-center">
                        <div className="flex justify-center gap-1.5">
                          {user.mustChangePassword && (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200" title="Requiere cambio de clave">
                              <ShieldAlert className="w-3 h-3 mr-1" /> Clave Temporal
                            </Badge>
                          )}
                          {user.hasSecurityQuestions ? (
                            <Badge className="bg-blue-50 text-blue-700 border-blue-200" title="Preguntas de seguridad configuradas">
                              <Shield className="w-3 h-3 mr-1" /> Seguro
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-400 border-slate-200" title="Preguntas de seguridad sin configurar">
                              Sin Preguntas
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(user)}
                            className="h-8 border-indigo-100 text-indigo-700 hover:bg-indigo-50/50"
                          >
                            <Pencil className="w-3.5 h-3.5 mr-1" /> Permisos
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetClick(user)}
                            className="h-8 border-amber-100 text-amber-700 hover:bg-amber-50/50"
                          >
                            <KeyRound className="w-3.5 h-3.5 mr-1" /> Clave
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteUser(user)}
                            disabled={user.email === 'akproduccionessalto@gmail.com'}
                            className="h-8 w-8 hover:bg-red-700"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Editar Permisos */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Accesos de Colaborador</DialogTitle>
            <DialogDescription>
              Ajustá el rol o seleccioná individualmente qué secciones del panel podrá administrar {selectedUser?.email}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePermissions} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-perfil">Perfil</Label>
              <Select value={editPerfil} onValueChange={(val) => setEditPerfil(val as Perfil)}>
                <SelectTrigger id="edit-perfil">
                  <SelectValue placeholder="Seleccionar perfil" />
                </SelectTrigger>
                <SelectContent>
                  {PERFILES_DEL_EQUIPO.map((p) => (
                    <SelectItem key={p} value={p}>{NOMBRE_DEL_PERFIL[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{QUE_HACE_CADA_PERFIL[editPerfil]}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-role">Rol en el Sistema</Label>
              <Select
                value={editRole}
                onValueChange={(val) => setEditRole(val as 'admin' | 'user')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Colaborador / Staff (User)</SelectItem>
                  <SelectItem value="admin">Administrador Total (Admin)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <InfoPerfilPermisos perfil={editPerfil} />
            <DialogFooter className="pt-3">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isProcessing}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isProcessing}>
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Restablecer Contraseña */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Restablecer Contraseña de Colaborador</DialogTitle>
            <DialogDescription>
              Definí una nueva clave temporal para {selectedUser?.email}. El usuario estará obligado a cambiarla al ingresar.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="reset-password">Nueva Contraseña Temporal *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="reset-password"
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <DialogFooter className="pt-3">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isProcessing}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isProcessing} className="bg-amber-600 hover:bg-amber-700 text-white">
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Restablecer Clave
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
