import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Edit2, X, Check, Eye, EyeOff, RefreshCw, Loader2 } from 'lucide-react';
import { useAuthStore } from '../hooks/useStore';
import apiClient from '../services/api';
import { cn } from '@/lib/utils';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'engineer';
  created_at: string;
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
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState<UserFormData>({ email: '', name: '', password: '', role: 'engineer' });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { if (user && user.role !== 'admin') navigate('/'); }, [user, navigate]);

  const fetchUsers = async () => {
    setIsLoading(true); setError('');
    try {
      const { data } = await apiClient.get('/auth/users');
      if (data.success) setUsers(data.data);
      else setError(data.error || 'Failed to load users');
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load users'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleNew = () => { setEditingUser(null); setFormData({ email: '', name: '', password: '', role: 'engineer' }); setFormError(''); setShowModal(true); };

  const handleEdit = (u: UserData) => {
    setEditingUser(u); setFormData({ email: u.email, name: u.name, password: '', role: u.role }); setFormError(''); setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setFormError(''); setIsSaving(true);
    try {
      if (editingUser) {
        const body: Partial<UserFormData> = { email: formData.email, name: formData.name, role: formData.role };
        if (formData.password) body.password = formData.password;
        const { data } = await apiClient.put(`/auth/users/${editingUser.id}`, body);
        if (data.success) { setShowModal(false); fetchUsers(); } else setFormError(data.error || 'Error');
      } else {
        if (!formData.password) { setFormError('Password is required'); setIsSaving(false); return; }
        const { data } = await apiClient.post('/auth/users', formData);
        if (data.success) { setShowModal(false); fetchUsers(); } else setFormError(data.error || 'Error');
      }
    } catch (err) { setFormError(err instanceof Error ? err.message : 'Error'); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const { data } = await apiClient.delete(`/auth/users/${id}`);
      if (data.success) { setDeletingId(null); fetchUsers(); } else setError(data.error || 'Error');
    } catch (err) { setError(err instanceof Error ? err.message : 'Error'); }
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  if (user?.role !== 'admin') return null;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight">{t('users.title')}</h1>
          <p className="text-[12px] sm:text-[13px] text-gray-400 mt-0.5">{t('users.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button onClick={fetchUsers} disabled={isLoading} className="p-2 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors">
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </button>
          <button onClick={handleNew} className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 text-white text-[13px] font-medium rounded-xl hover:bg-gray-800 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            {t('users.newUser')}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <p className="text-[13px] text-red-500">{error}</p>
          <button onClick={() => setError('')} className="text-red-300 hover:text-red-500 p-1"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Users list */}
      <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden">
        {/* Desktop table header */}
        <div className="hidden sm:grid sm:grid-cols-[1fr_1fr_100px_100px_80px] px-6 py-3 border-b border-gray-100 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
          <span>User</span>
          <span>Email</span>
          <span>Role</span>
          <span>Created</span>
          <span className="text-right">Actions</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-[14px] text-gray-400">No users found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {users.map((u) => (
              <div key={u.id} className="px-5 sm:px-6 py-4 flex flex-col sm:grid sm:grid-cols-[1fr_1fr_100px_100px_80px] sm:items-center gap-2 sm:gap-4">
                {/* Name + avatar */}
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-semibold shrink-0',
                    u.role === 'admin' ? 'bg-gray-900' : 'bg-gray-400'
                  )}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[14px] font-medium text-gray-900 truncate">{u.name}</span>
                </div>

                {/* Email */}
                <span className="text-[13px] text-gray-500 truncate pl-11 sm:pl-0">{u.email}</span>

                {/* Role */}
                <span className={cn(
                  'text-[11px] font-medium px-2 py-0.5 rounded w-fit',
                  u.role === 'admin' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
                )}>
                  {u.role}
                </span>

                {/* Date */}
                <span className="text-[12px] text-gray-400 tabular-nums">{fmtDate(u.created_at)}</span>

                {/* Actions */}
                <div className="flex items-center justify-end gap-0.5">
                  {deletingId === u.id ? (
                    <>
                      <span className="text-[11px] text-red-400 mr-1">Delete?</span>
                      <button onClick={() => handleDelete(u.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeletingId(null)} className="p-2 rounded-lg text-gray-300 hover:bg-gray-50"><X className="w-3.5 h-3.5" /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEdit(u)} className="p-2 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors" title="Edit">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(u.id)}
                        disabled={u.id === user?.id}
                        className="p-2 rounded-lg text-red-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-20"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl border border-gray-200/60 shadow-xl w-full max-w-md">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-gray-900">
                {editingUser ? t('users.editUser') : t('users.newUser')}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-300 hover:text-gray-500 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {formError && (
                <div className="text-[13px] text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{formError}</div>
              )}

              <FormField label={t('common.name')}>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full name" required className="w-full px-3.5 py-2.5 text-[14px] text-gray-900 bg-white border border-gray-200 rounded-xl outline-none placeholder:text-gray-300 focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all" />
              </FormField>

              <FormField label={t('common.email')}>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com" required className="w-full px-3.5 py-2.5 text-[14px] text-gray-900 bg-white border border-gray-200 rounded-xl outline-none placeholder:text-gray-300 focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all" />
              </FormField>

              <FormField label={`${t('common.password')}${editingUser ? ' (leave blank to keep)' : ''}`}>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'} value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? 'New password' : 'Password'} required={!editingUser}
                    className="w-full px-3.5 py-2.5 pr-11 text-[14px] text-gray-900 bg-white border border-gray-200 rounded-xl outline-none placeholder:text-gray-300 focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-400" tabIndex={-1}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </FormField>

              <FormField label={t('common.role')}>
                <div className="flex gap-2">
                  {(['engineer', 'admin'] as const).map((role) => (
                    <button
                      key={role} type="button"
                      onClick={() => setFormData({ ...formData, role })}
                      className={cn(
                        'flex-1 py-2.5 rounded-xl text-[13px] font-medium border transition-colors capitalize',
                        formData.role === role
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                      )}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </FormField>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} disabled={isSaving}
                  className="px-4 py-2 text-[13px] font-medium text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-[13px] font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-40">
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] font-medium text-gray-500">{label}</label>
      {children}
    </div>
  );
}
