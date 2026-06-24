'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  listUsers,
  createUser,
  deleteUser,
  updateUserModules,
  adminResetUserPassword,
  type PublicUserRecord
} from '@/app/actions/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Lock
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
  const [createModules, setCreateModules] = useState<string[]>([]);

  // Form State - Edit Permissions
  const [selectedUser, setSelectedUser] = useState<PublicUserRecord | null>(null);
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user');
  const [editModules, setEditModules] = useState<string[]>([]);

  // Form State - Reset Password
  const [resetPassword, setResetPassword] = useState('');

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
  }, [loadUsers]);

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
    setEditModules(user.modules);
    setIsEditOpen(true);
  };

  const handleUpdatePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsProcessing(true);
    try {
      const res = await updateUserModules(selectedUser.id, editModules, editRole);
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
                <div className="space-y-2">
                  <Label>Áreas Permitidas</Label>
                  <div className="space-y-2.5 p-3 border rounded-xl bg-slate-50/50 max-h-60 overflow-y-auto scrollbar-thin">
                    {SYSTEM_MODULES.map((modulo) => (
                      <div key={modulo.id} className="flex items-start gap-2.5">
                        <Checkbox
                          id={`create-mod-${modulo.id}`}
                          checked={createModules.includes(modulo.id)}
                          onCheckedChange={(checked) =>
                            handleModuleCheckboxChange(modulo.id, !!checked, false)
                          }
                          className="mt-0.5"
                        />
                        <Label
                          htmlFor={`create-mod-${modulo.id}`}
                          className="font-normal text-sm cursor-pointer leading-tight"
                        >
                          {modulo.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
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
            <div className="space-y-2">
              <Label>Áreas Permitidas</Label>
              <div className="space-y-2.5 p-3 border rounded-xl bg-slate-50/50 max-h-60 overflow-y-auto scrollbar-thin">
                {SYSTEM_MODULES.map((modulo) => (
                  <div key={modulo.id} className="flex items-start gap-2.5">
                    <Checkbox
                      id={`edit-mod-${modulo.id}`}
                      checked={editModules.includes(modulo.id)}
                      onCheckedChange={(checked) =>
                        handleModuleCheckboxChange(modulo.id, !!checked, true)
                      }
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor={`edit-mod-${modulo.id}`}
                      className="font-normal text-sm cursor-pointer leading-tight"
                    >
                      {modulo.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
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
