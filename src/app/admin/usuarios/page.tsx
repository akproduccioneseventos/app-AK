'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, Pencil, Trash2, ShieldCheck, User, Key } from 'lucide-react';
import { fetchSession, type SessionData } from '@/lib/auth';
import { APP_MODULES } from '@/lib/auth';
import type { PublicUserRecord } from '@/app/actions/auth';
import {
  listUsers,
  createUser,
  updateUserModules,
  deleteUser,
  adminResetUserPassword,
} from '@/app/actions/auth';

export default function AdminUsuariosPage() {
  const router = useRouter();
  const [users, setUsers] = useState<PublicUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);

  // Create user dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState<'admin' | 'user'>('user');
  const [createModules, setCreateModules] = useState<string[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Edit permissions dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<PublicUserRecord | null>(null);
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user');
  const [editModules, setEditModules] = useState<string[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Reset password dialog
  const [resetOpen, setResetOpen] = useState(false);
  const [resetUser, setResetUser] = useState<PublicUserRecord | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Delete confirmation
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteUser2, setDeleteUser2] = useState<PublicUserRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    async function init() {
      const session = await fetchSession();
      if (!session) {
        router.push('/login');
        return;
      }
      if (session.role !== 'admin') {
        router.push('/');
        return;
      }
      setCurrentUserId(session.userId);
      loadUsers();
    }
    init();
  }, [router]);

  async function loadUsers() {
    setLoading(true);
    const result = await listUsers();
    setLoading(false);
    if (result.success && result.users) {
      setUsers(result.users);
    } else {
      setError(result.error ?? 'Error al cargar usuarios.');
    }
  }

  const handleCreateUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');

    const result = await createUser({
      email: createEmail,
      password: createPassword,
      role: createRole,
      modules: createRole === 'admin' ? ['all'] : createModules,
    });

    setCreateLoading(false);

    if (!result.success) {
      setCreateError(result.error ?? 'Error al crear el usuario.');
      return;
    }

    setCreateOpen(false);
    setCreateEmail('');
    setCreatePassword('');
    setCreateRole('user');
    setCreateModules([]);
    loadUsers();
  };

  const openEditDialog = (user: PublicUserRecord) => {
    setEditUser(user);
    setEditRole(user.role);
    setEditModules(user.modules);
    setEditError('');
    setEditOpen(true);
  };

  const handleEditUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editUser) return;
    setEditLoading(true);
    setEditError('');

    const result = await updateUserModules(
      editUser.id,
      editRole === 'admin' ? ['all'] : editModules,
      editRole
    );

    setEditLoading(false);

    if (!result.success) {
      setEditError(result.error ?? 'Error al actualizar permisos.');
      return;
    }

    setEditOpen(false);
    loadUsers();
  };

  const openResetDialog = (user: PublicUserRecord) => {
    setResetUser(user);
    setResetPassword('');
    setResetError('');
    setResetSuccess(false);
    setResetOpen(true);
  };

  const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!resetUser) return;
    setResetLoading(true);
    setResetError('');

    const result = await adminResetUserPassword(resetUser.id, resetPassword);
    setResetLoading(false);

    if (!result.success) {
      setResetError(result.error ?? 'Error al restablecer la contraseña.');
      return;
    }

    setResetSuccess(true);
  };

  const openDeleteDialog = (user: PublicUserRecord) => {
    setDeleteUser2(user);
    setDeleteOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!deleteUser2) return;
    setDeleteLoading(true);
    await deleteUser(deleteUser2.id);
    setDeleteLoading(false);
    setDeleteOpen(false);
    loadUsers();
  };

  const toggleModule = (
    moduleId: string,
    checked: boolean,
    current: string[],
    setter: (v: string[]) => void
  ) => {
    if (checked) {
      setter([...current.filter(m => m !== 'all'), moduleId]);
    } else {
      setter(current.filter(m => m !== moduleId));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
          <p className="text-muted-foreground text-sm">Administrá los accesos y permisos de cada usuario.</p>
        </div>
        <Button onClick={() => {
          setCreateEmail('');
          setCreatePassword('');
          setCreateRole('user');
          setCreateModules([]);
          setCreateError('');
          setCreateOpen(true);
        }}>
          <UserPlus className="w-4 h-4 mr-2" />
          Nuevo usuario
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Usuarios registrados</CardTitle>
          <CardDescription>{users.length} usuario(s) en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Correo</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Módulos</TableHead>
                  <TableHead>Preguntas seg.</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <span className="font-medium">{user.email}</span>
                        {user.mustChangePassword && (
                          <Badge variant="outline" className="ml-2 text-xs border-amber-400 text-amber-600">
                            Debe cambiar contraseña
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.role === 'admin' ? (
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <User className="w-3 h-3 mr-1" />
                          Usuario
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.modules.includes('all') ? (
                          <Badge variant="secondary" className="text-xs">Todos</Badge>
                        ) : user.modules.slice(0, 3).map(m => (
                          <Badge key={m} variant="outline" className="text-xs">{m}</Badge>
                        ))}
                        {!user.modules.includes('all') && user.modules.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{user.modules.length - 3}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.hasSecurityQuestions ? (
                        <span className="text-green-600 text-sm">✓ Configuradas</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Sin configurar</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Editar permisos"
                          onClick={() => openEditDialog(user)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Restablecer contraseña"
                          onClick={() => openResetDialog(user)}
                        >
                          <Key className="w-4 h-4" />
                        </Button>
                        {user.id !== currentUserId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Eliminar usuario"
                            className="text-destructive hover:text-destructive"
                            onClick={() => openDeleteDialog(user)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Crear nuevo usuario</DialogTitle>
            <DialogDescription>
              Ingresá los datos del nuevo usuario y seleccioná a qué módulos tiene acceso.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser}>
            <div className="space-y-4 py-2">
              {createError && (
                <Alert variant="destructive">
                  <AlertDescription>{createError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="create-email">Correo electrónico</Label>
                <Input
                  id="create-email"
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  required
                  disabled={createLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-password">Contraseña</Label>
                <Input
                  id="create-password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  required
                  disabled={createLoading}
                />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select
                  value={createRole}
                  onValueChange={(v) => setCreateRole(v as 'admin' | 'user')}
                  disabled={createLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin (acceso total)</SelectItem>
                    <SelectItem value="user">Usuario (acceso por módulos)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {createRole === 'user' && (
                <div className="space-y-2">
                  <Label>Módulos accesibles</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                    {APP_MODULES.map((mod) => (
                      <div key={mod.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`create-mod-${mod.id}`}
                          checked={createModules.includes(mod.id)}
                          onCheckedChange={(checked) =>
                            toggleModule(mod.id, !!checked, createModules, setCreateModules)
                          }
                          disabled={createLoading}
                        />
                        <Label htmlFor={`create-mod-${mod.id}`} className="text-sm font-normal cursor-pointer">
                          {mod.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={createLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createLoading}>
                {createLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                Crear usuario
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Permissions Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar permisos</DialogTitle>
            <DialogDescription>
              {editUser?.email} — modificá el rol y los módulos accesibles.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUser}>
            <div className="space-y-4 py-2">
              {editError && (
                <Alert variant="destructive">
                  <AlertDescription>{editError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select
                  value={editRole}
                  onValueChange={(v) => setEditRole(v as 'admin' | 'user')}
                  disabled={editLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin (acceso total)</SelectItem>
                    <SelectItem value="user">Usuario (acceso por módulos)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editRole === 'user' && (
                <div className="space-y-2">
                  <Label>Módulos accesibles</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                    {APP_MODULES.map((mod) => (
                      <div key={mod.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`edit-mod-${mod.id}`}
                          checked={editModules.includes(mod.id)}
                          onCheckedChange={(checked) =>
                            toggleModule(mod.id, !!checked, editModules, setEditModules)
                          }
                          disabled={editLoading}
                        />
                        <Label htmlFor={`edit-mod-${mod.id}`} className="text-sm font-normal cursor-pointer">
                          {mod.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={editLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={editLoading}>
                {editLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Guardar cambios
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Restablecer contraseña</DialogTitle>
            <DialogDescription>
              {resetUser?.email}
            </DialogDescription>
          </DialogHeader>
          {resetSuccess ? (
            <div className="py-4 text-center space-y-3">
              <p className="text-sm text-green-600 font-medium">
                ✓ Contraseña restablecida. El usuario deberá cambiarla al ingresar.
              </p>
              <Button className="w-full" onClick={() => setResetOpen(false)}>
                Cerrar
              </Button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword}>
              <div className="space-y-3 py-2">
                {resetError && (
                  <Alert variant="destructive">
                    <AlertDescription>{resetError}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="reset-password">Nueva contraseña temporal</Label>
                  <Input
                    id="reset-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    required
                    disabled={resetLoading}
                  />
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setResetOpen(false)} disabled={resetLoading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={resetLoading}>
                  {resetLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
                  Restablecer
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar usuario</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que querés eliminar a <strong>{deleteUser2?.email}</strong>?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleteLoading}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleteLoading}
            >
              {deleteLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
