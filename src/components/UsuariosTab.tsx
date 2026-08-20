import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  Users, 
  UserPlus, 
  Shield, 
  UserCheck, 
  Key, 
  Edit, 
  Trash2, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  User as UserIcon,
  RefreshCw
} from 'lucide-react';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'worker';
  profileImage?: string;
  createdAt?: string;
}

export default function UsuariosTab() {
  const { currentUser, setSyncLogs, isOffline } = useAppContext();

  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'worker'>('all');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<UserItem | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState<UserItem | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<UserItem | null>(null);

  // Form states - Create
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'worker'>('worker');
  const [showNewPasswordText, setShowNewPasswordText] = useState(false);
  const [createError, setCreateError] = useState('');
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Form states - Edit
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'worker'>('worker');
  const [editError, setEditError] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Form states - Reset Password
  const [resetPassword, setResetPassword] = useState('');
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('');
  const [showResetPasswordText, setShowResetPasswordText] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Delete state
  const [deleteError, setDeleteError] = useState('');
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // Success notification toast
  const [successToast, setSuccessToast] = useState('');

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast('');
    }, 3500);
  };

  // Fetch users from API
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      if (data.success && Array.isArray(data.users)) {
        setUsersList(data.users);
      } else {
        // Fallback default
        if (currentUser) {
          setUsersList([currentUser]);
        }
      }
    } catch (err) {
      console.error('Error cargando usuarios:', err);
      if (currentUser && usersList.length === 0) {
        setUsersList([currentUser]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle Create User
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      setCreateError('Todos los campos son obligatorios.');
      return;
    }

    if (newPassword.length < 4) {
      setCreateError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    setIsSubmittingCreate(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim().toLowerCase(),
          password: newPassword,
          role: newRole
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        triggerToast(`Usuario "${newName.trim()}" creado exitosamente.`);
        setSyncLogs((prev: string[]) => [`Nuevo usuario creado: ${newName.trim()} (${newRole})`, ...prev]);
        setShowCreateModal(false);
        setNewName('');
        setNewEmail('');
        setNewPassword('');
        setNewRole('worker');
        fetchUsers();
      } else {
        setCreateError(data.message || 'Error al crear usuario.');
      }
    } catch (err) {
      setCreateError('Error de conexión al guardar el usuario.');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Handle Edit User
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;
    setEditError('');

    if (!editName.trim()) {
      setEditError('El nombre no puede estar vacío.');
      return;
    }

    setIsSubmittingEdit(true);
    try {
      const response = await fetch('/api/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: showEditModal.id,
          name: editName.trim(),
          role: editRole
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        triggerToast(`Usuario "${editName.trim()}" actualizado.`);
        setSyncLogs((prev: string[]) => [`Usuario actualizado: ${editName.trim()}`, ...prev]);
        setShowEditModal(null);
        fetchUsers();
      } else {
        setEditError(data.message || 'Error al actualizar usuario.');
      }
    } catch (err) {
      setEditError('Error de conexión al actualizar usuario.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Handle Reset Password
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPasswordModal) return;
    setPasswordError('');

    if (!resetPassword.trim()) {
      setPasswordError('Ingrese la nueva contraseña.');
      return;
    }

    if (resetPassword.length < 4) {
      setPasswordError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (resetPassword !== resetPasswordConfirm) {
      setPasswordError('Las contraseñas no coinciden.');
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const response = await fetch('/api/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: showPasswordModal.id,
          name: showPasswordModal.name,
          role: showPasswordModal.role,
          password: resetPassword
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        triggerToast(`Contraseña actualizada para "${showPasswordModal.name}".`);
        setSyncLogs((prev: string[]) => [`Contraseña modificada para usuario: ${showPasswordModal.name}`, ...prev]);
        setShowPasswordModal(null);
        setResetPassword('');
        setResetPasswordConfirm('');
      } else {
        setPasswordError(data.message || 'Error al cambiar contraseña.');
      }
    } catch (err) {
      setPasswordError('Error de conexión al cambiar la contraseña.');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // Handle Delete User
  const handleDeleteSubmit = async () => {
    if (!showDeleteModal) return;
    setDeleteError('');
    setIsSubmittingDelete(true);

    try {
      const response = await fetch(`/api/users/${showDeleteModal.id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (response.ok && data.success) {
        triggerToast(`Usuario "${showDeleteModal.name}" eliminado.`);
        setSyncLogs((prev: string[]) => [`Usuario eliminado: ${showDeleteModal.name}`, ...prev]);
        setShowDeleteModal(null);
        fetchUsers();
      } else {
        setDeleteError(data.message || 'No se pudo eliminar el usuario.');
      }
    } catch (err) {
      setDeleteError('Error de conexión al eliminar usuario.');
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  // Filtered list
  const filteredUsers = usersList.filter(user => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      user.name.toLowerCase().includes(q) || 
      user.email.toLowerCase().includes(q);
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const adminCount = usersList.filter(u => u.role === 'admin').length;
  const workerCount = usersList.filter(u => u.role === 'worker').length;

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in">
      {/* SUCCESS NOTIFICATION TOAST */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-emerald-900 text-emerald-100 px-4 py-3 rounded-xl shadow-xl border border-emerald-700 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{successToast}</span>
        </div>
      )}

      {/* HEADER & TOP STATS */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 border border-teal-100 rounded-xl text-teal-700">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-slate-900">Gestión de Usuarios y Cajeros</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Crea cuentas de empleados, asigna roles de cajero/administrador y administra el acceso a VexaPOS.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              className="p-2 border border-slate-250 hover:bg-slate-50 rounded-lg text-slate-600 transition cursor-pointer"
              title="Recargar usuarios"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => {
                setCreateError('');
                setShowCreateModal(true);
              }}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Nuevo Usuario</span>
            </button>
          </div>
        </div>

        {/* METRICS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-5">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Total Usuarios</span>
              <span className="text-xl md:text-2xl font-black text-slate-900 mt-0.5 block">{usersList.length}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-200/70 flex items-center justify-center text-slate-700">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-700 block">Administradores</span>
              <span className="text-xl md:text-2xl font-black text-indigo-950 mt-0.5 block">{adminCount}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
              <Shield className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 block">Empleados / Cajeros</span>
              <span className="text-xl md:text-2xl font-black text-emerald-950 mt-0.5 block">{workerCount}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-1 focus:ring-teal-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              roleFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({usersList.length})
          </button>
          <button
            onClick={() => setRoleFilter('admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
              roleFilter === 'admin'
                ? 'bg-indigo-700 text-white'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100'
            }`}
          >
            <Shield className="w-3 h-3" />
            <span>Admins ({adminCount})</span>
          </button>
          <button
            onClick={() => setRoleFilter('worker')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
              roleFilter === 'worker'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100'
            }`}
          >
            <UserCheck className="w-3 h-3" />
            <span>Cajeros ({workerCount})</span>
          </button>
        </div>
      </div>

      {/* USERS LIST / TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No se encontraron usuarios</p>
            <p className="text-xs text-slate-400 mt-0.5">Prueba cambiando los filtros o agrega un nuevo usuario.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Usuario</th>
                  <th className="py-3 px-4">Correo Electrónico</th>
                  <th className="py-3 px-4">Rol en Sistema</th>
                  <th className="py-3 px-4 hidden md:table-cell">Permisos</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredUsers.map((user) => {
                  const isCurrent = currentUser && currentUser.id === user.id;
                  const initials = user.name
                    ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                    : 'U';

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {user.profileImage ? (
                            <img
                              src={user.profileImage}
                              alt={user.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              user.role === 'admin' 
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' 
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {initials}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{user.name}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-teal-100 text-teal-800 rounded border border-teal-200">
                                  Tú
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 block sm:hidden">{user.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {user.email}
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-4">
                        {user.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <Shield className="w-3 h-3" />
                            Administrador
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <UserCheck className="w-3 h-3" />
                            Empleado / Cajero
                          </span>
                        )}
                      </td>

                      {/* Permissions Description */}
                      <td className="py-3 px-4 hidden md:table-cell text-slate-500 text-[11px]">
                        {user.role === 'admin' 
                          ? 'Acceso total: Inventario, Costos, Cierres, Reportes y Usuarios' 
                          : 'Facturación POS y consulta de stock básico'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setShowEditModal(user);
                              setEditName(user.name);
                              setEditRole(user.role);
                              setEditError('');
                            }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            title="Editar usuario"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setShowPasswordModal(user);
                              setResetPassword('');
                              setResetPasswordConfirm('');
                              setPasswordError('');
                            }}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                            title="Cambiar contraseña"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>

                          {!isCurrent && (
                            <button
                              onClick={() => {
                                setShowDeleteModal(user);
                                setDeleteError('');
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL 1: CREAR USUARIO ================= */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-50 rounded-lg text-teal-700">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Crear Nuevo Usuario</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Nombre Completo *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Ej: Carlos Gómez"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-250 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Correo Electrónico (Para Iniciar Sesión) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="cajero@drogueria.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-250 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-teal-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Rol del Usuario *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRole('worker')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      newRole === 'worker'
                        ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span>Empleado / Cajero</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Facturación POS y ventas de mostrador.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRole('admin')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      newRole === 'admin'
                        ? 'border-indigo-500 bg-indigo-50/60 ring-1 ring-indigo-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                      <Shield className="w-4 h-4 text-indigo-600" />
                      <span>Administrador</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Acceso total a inventario, reportes y cierres.</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Contraseña Inicial *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showNewPasswordText ? 'text' : 'password'}
                    required
                    placeholder="Mínimo 4 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 border border-slate-250 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-teal-600 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPasswordText(!showNewPasswordText)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingCreate ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  <span>Guardar Usuario</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: EDITAR USUARIO ================= */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-700">
                  <Edit className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Editar Usuario</h3>
              </div>
              <button
                onClick={() => setShowEditModal(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Correo Electrónico (No modificable)
                </label>
                <input
                  type="email"
                  disabled
                  value={showEditModal.email}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-100 rounded-lg text-xs text-slate-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Rol del Usuario
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditRole('worker')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      editRole === 'worker'
                        ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span>Empleado / Cajero</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditRole('admin')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      editRole === 'admin'
                        ? 'border-indigo-500 bg-indigo-50/60 ring-1 ring-indigo-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                      <Shield className="w-4 h-4 text-indigo-600" />
                      <span>Administrador</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
                  className="px-4 py-2 border rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingEdit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Edit className="w-3.5 h-3.5" />}
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: CAMBIAR CONTRASEÑA ================= */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 rounded-lg text-amber-700">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Restablecer Contraseña</h3>
                  <p className="text-[11px] text-slate-500">Para el usuario: <span className="font-bold text-slate-800">{showPasswordModal.name}</span></p>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordModal(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Nueva Contraseña *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showResetPasswordText ? 'text' : 'password'}
                    required
                    placeholder="Mínimo 4 caracteres"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 border border-slate-250 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-amber-500 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPasswordText(!showResetPasswordText)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showResetPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Confirmar Nueva Contraseña *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showResetPasswordText ? 'text' : 'password'}
                    required
                    placeholder="Repita la contraseña"
                    value={resetPasswordConfirm}
                    onChange={(e) => setResetPasswordConfirm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-250 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(null)}
                  className="px-4 py-2 border rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPassword}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingPassword ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                  <span>Guardar Contraseña</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: CONFIRMAR ELIMINACIÓN ================= */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">¿Eliminar Usuario?</h3>
                <p className="text-xs text-slate-500">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
              <p>Estás a punto de eliminar a:</p>
              <p className="font-bold text-slate-900">{showDeleteModal.name} ({showDeleteModal.email})</p>
              <p className="text-[11px] text-slate-500">Rol: {showDeleteModal.role === 'admin' ? 'Administrador' : 'Empleado'}</p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 border rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmittingDelete}
                onClick={handleDeleteSubmit}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmittingDelete ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Sí, Eliminar Usuario</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
