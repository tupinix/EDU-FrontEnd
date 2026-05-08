import { useEffect, useState } from 'react';
import { Building2, Plus, Pencil, Trash2, Loader2, X, AlertCircle, ExternalLink } from 'lucide-react';
import { organizationsApi, OrganizationCreatePayload, OrganizationUpdatePayload } from '../services/api';
import type { Organization, OrgPlan } from '../types';

export function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ open: boolean; org?: Organization }>({ open: false });

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await organizationsApi.list();
      setOrgs(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Organizations</h1>
          <p className="text-[12px] sm:text-[13px] text-gray-400 mt-0.5">
            Manage tenants. Each org gets its own subdomain, isolated data, and users.
          </p>
        </div>
        <button
          onClick={() => setEditing({ open: true })}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> New Organization
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-red-50 border border-red-100 text-[13px] text-red-700 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
        </div>
      ) : orgs.length === 0 ? (
        <EmptyState onCreate={() => setEditing({ open: true })} />
      ) : (
        <OrgList orgs={orgs} onEdit={(o) => setEditing({ open: true, org: o })} onDeleted={refresh} />
      )}

      {editing.open && (
        <OrgFormModal
          org={editing.org}
          onClose={() => setEditing({ open: false })}
          onSaved={() => { setEditing({ open: false }); refresh(); }}
        />
      )}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 px-6 py-16 text-center">
      <Building2 className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" strokeWidth={1.5} />
      <p className="text-[14px] text-gray-500 dark:text-gray-400">No organizations yet</p>
      <p className="text-[12px] text-gray-300 dark:text-gray-500 mt-1">Create the first one to start onboarding tenants</p>
      <button
        onClick={onCreate}
        className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-medium rounded-xl"
      >
        <Plus className="w-3.5 h-3.5" /> New Organization
      </button>
    </div>
  );
}

function OrgList({ orgs, onEdit, onDeleted }: { orgs: Organization[]; onEdit: (o: Organization) => void; onDeleted: () => void }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden divide-y divide-gray-50 dark:divide-gray-800/50">
      {orgs.map((o) => <OrgRow key={o.id} org={o} onEdit={() => onEdit(o)} onDeleted={onDeleted} />)}
    </div>
  );
}

function OrgRow({ org, onEdit, onDeleted }: { org: Organization; onEdit: () => void; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const fullDomain = `${org.subdomain}.espacodedadosunificado.com.br`;

  const handleDelete = async () => {
    if (!confirm(`Delete organization "${org.name}"? Users will lose access.`)) return;
    setDeleting(true);
    try {
      await organizationsApi.delete(org.id);
      onDeleted();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const planColor: Record<string, string> = {
    trial:        'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
    starter:      'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
    professional: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300',
    enterprise:   'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300',
  };

  const isDeleted = org.status === 'deleted';

  return (
    <div className={`px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 ${isDeleted ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-medium text-gray-900 dark:text-gray-100 truncate">{org.name}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider ${planColor[org.plan] ?? planColor.trial}`}>
              {org.plan}
            </span>
            {isDeleted && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300">deleted</span>
            )}
          </div>
          <a
            href={`https://${fullDomain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-mono mt-0.5 inline-flex items-center gap-1 truncate"
          >
            {fullDomain}
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 text-[11px] text-gray-400 dark:text-gray-500">
        <span>{org.userCount ?? 0} {org.userCount === 1 ? 'user' : 'users'}</span>
        <span>·</span>
        <span>{org.maxUsers} max</span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onEdit}
          className="p-2 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting || isDeleted}
          className="p-2 rounded-lg text-red-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-30"
          title="Delete"
        >
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

function OrgFormModal({ org, onClose, onSaved }: { org?: Organization; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!org;
  const [name, setName] = useState(org?.name ?? '');
  const [subdomain, setSubdomain] = useState(org?.subdomain ?? '');
  const [plan, setPlan] = useState<OrgPlan>((org?.plan as OrgPlan) ?? 'trial');
  const [contactEmail, setContactEmail] = useState(org?.contactEmail ?? '');
  const [maxUsers, setMaxUsers] = useState(org?.maxUsers ?? 10);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      if (isEdit && org) {
        const payload: OrganizationUpdatePayload = {
          name,
          subdomain: subdomain.toLowerCase(),
          plan,
          contactEmail: contactEmail.trim() || null,
          maxUsers,
        };
        await organizationsApi.update(org.id, payload);
      } else {
        const payload: OrganizationCreatePayload = {
          name,
          subdomain: subdomain.toLowerCase(),
          plan,
          contactEmail: contactEmail.trim() || undefined,
          maxUsers,
        };
        await organizationsApi.create(payload);
      }
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200/60 dark:border-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">{isEdit ? 'Edit organization' : 'New organization'}</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Tenant data is fully isolated.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {err && (
            <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-red-50 border border-red-100 text-[13px] text-red-700 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{err}</span>
            </div>
          )}

          <Field label="Name" required>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus required maxLength={255}
              placeholder="HighByte Industries"
              className="w-full px-3 py-2 text-[13px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-gray-500"
            />
          </Field>

          <Field label="Subdomain" required hint="lowercase, hyphens; will become <subdomain>.espacodedadosunificado.com.br">
            <div className="flex items-center gap-2">
              <input
                type="text" value={subdomain} onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} required minLength={3} maxLength={63}
                placeholder="highbyte"
                className="flex-1 px-3 py-2 text-[13px] font-mono bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-gray-500"
              />
              <span className="text-[11px] text-gray-400 font-mono">.espacodedadosunificado.com.br</span>
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Plan">
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value as OrgPlan)}
                className="w-full px-3 py-2 text-[13px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-gray-500"
              >
                <option value="trial">Trial</option>
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </Field>
            <Field label="Max users">
              <input
                type="number" min={1} max={10000} value={maxUsers}
                onChange={(e) => setMaxUsers(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 text-[13px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-gray-500"
              />
            </Field>
          </div>

          <Field label="Contact email" hint="optional — used for invites and billing">
            <input
              type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} maxLength={255}
              placeholder="ops@highbyte.com"
              className="w-full px-3 py-2 text-[13px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-gray-400 dark:focus:border-gray-500"
            />
          </Field>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-[13px] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEdit ? 'Save changes' : 'Create organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-[0.14em] mb-1.5">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10.5px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}
