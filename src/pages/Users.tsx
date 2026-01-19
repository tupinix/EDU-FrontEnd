import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users as UsersIcon,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  Shield,
  Wrench,
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useAuthStore } from '../hooks/useStore';
import apiClient from '../services/api';
import { clsx } from 'clsx';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'engineer';
  created_at: string;
  updated_at?: string;
}

interface UserFormData {
  email: string;
  name: string;
  password: string;
  role: 'admin' | 'engineer';
}

export function Users() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    name: '',
    password: '',
    role: 'engineer'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch users
  const fetchUsers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get('/auth/users');
      if (data.success) {
        setUsers(data.data);
      } else {
        setError(data.error || t('users.errorLoadingUsers'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('users.errorLoadingUsers'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Open modal for new user
  const handleNewUser = () => {
    setEditingUser(null);
    setFormData({ email: '', name: '', password: '', role: 'engineer' });
    setFormError('');
    setShowModal(true);
  };

  // Open modal for editing
  const handleEditUser = (userData: UserData) => {
    setEditingUser(userData);
    setFormData({
      email: userData.email,
      name: userData.name,
      password: '',
      role: userData.role
    });
    setFormError('');
    setShowModal(true);
  };

  // Submit form
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSaving(true);

    try {
      if (editingUser) {
        // Update user
        const updateData: Partial<UserFormData> = {
          email: formData.email,
          name: formData.name,
          role: formData.role
        };
        if (formData.password) {
          updateData.password = formData.password;
        }

        const { data } = await apiClient.put(`/auth/users/${editingUser.id}`, updateData);
        if (data.success) {
          setShowModal(false);
          fetchUsers();
        } else {
          setFormError(data.error || t('users.errorUpdatingUser'));
        }
      } else {
        // Create new user
        if (!formData.password) {
          setFormError(t('users.passwordRequired'));
          setIsSaving(false);
          return;
        }

        const { data } = await apiClient.post('/auth/users', formData);
        if (data.success) {
          setShowModal(false);
          fetchUsers();
        } else {
          setFormError(data.error || t('users.errorCreatingUser'));
        }
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('users.errorSavingUser'));
    } finally {
      setIsSaving(false);
    }
  };

  // Delete user
  const handleDeleteUser = async (id: string) => {
    try {
      const { data } = await apiClient.delete(`/auth/users/${id}`);
      if (data.success) {
        setDeletingUserId(null);
        fetchUsers();
      } else {
        setError(data.error || t('users.errorDeletingUser'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('users.errorDeletingUser'));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <UsersIcon className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('users.title')}</h1>
            <p className="text-sm text-gray-500">{t('users.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            disabled={isLoading}
            className="btn btn-secondary btn-sm"
            title={t('common.refresh')}
          >
            <RefreshCw className={clsx('w-4 h-4', isLoading && 'animate-spin')} />
          </button>
          <button
            onClick={handleNewUser}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('users.newUser')}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>{t('common.user')}</th>
                <th>{t('common.email')}</th>
                <th>{t('common.role')}</th>
                <th>{t('common.createdAt')}</th>
                <th className="text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    {t('users.loadingUsers')}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    {t('users.noUsers')}
                  </td>
                </tr>
              ) : (
                users.map((userData) => (
                  <tr key={userData.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className={clsx(
                          'w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold',
                          userData.role === 'admin' ? 'bg-primary-600' : 'bg-gray-500'
                        )}>
                          {userData.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{userData.name}</span>
                      </div>
                    </td>
                    <td className="text-gray-600">{userData.email}</td>
                    <td>
                      <span className={clsx(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                        userData.role === 'admin'
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-100 text-gray-700'
                      )}>
                        {userData.role === 'admin' ? (
                          <Shield className="w-3.5 h-3.5" />
                        ) : (
                          <Wrench className="w-3.5 h-3.5" />
                        )}
                        {t(`roles.${userData.role}`)}
                      </span>
                    </td>
                    <td className="text-gray-500 text-sm">
                      {formatDate(userData.created_at)}
                    </td>
                    <td className="text-right">
                      {deletingUserId === userData.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm text-red-600 mr-2">{t('users.deleteConfirm')}</span>
                          <button
                            onClick={() => handleDeleteUser(userData.id)}
                            className="p-1.5 text-red-600 hover:bg-red-100 rounded"
                            title={t('users.confirmDelete')}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingUserId(null)}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                            title={t('common.cancel')}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEditUser(userData)}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                            title={t('common.edit')}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingUserId(userData.id)}
                            disabled={userData.id === user?.id}
                            className="p-1.5 text-red-600 hover:bg-red-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                            title={userData.id === user?.id ? t('common.cannotDeleteSelf') : t('common.delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingUser ? t('users.editUser') : t('users.newUser')}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Name */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">{t('common.name')}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder={t('common.fullName')}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">{t('common.email')}</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  placeholder="email@example.com"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  {t('common.password')} {editingUser && <span className="text-gray-400">({t('common.leaveBlankToKeep')})</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input pr-10"
                    placeholder={editingUser ? t('common.newPassword') : t('common.enterPassword')}
                    required={!editingUser}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">{t('common.role')}</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'engineer' })}
                    className={clsx(
                      'flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors',
                      formData.role === 'engineer'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <Wrench className="w-5 h-5" />
                    <span>{t('roles.engineer')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'admin' })}
                    className={clsx(
                      'flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors',
                      formData.role === 'admin'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <Shield className="w-5 h-5" />
                    <span>{t('roles.admin')}</span>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                  disabled={isSaving}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? t('common.saving') : editingUser ? t('users.updateUser') : t('users.createUser')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
