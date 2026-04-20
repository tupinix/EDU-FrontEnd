import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { DashboardList, DashboardCanvas } from '../components/ProcessDashboard';
import { useDashboard } from '../hooks/useDashboards';
import type { ProcessDashboard as ProcessDashboardType } from '../types';

type OpenState =
  | { kind: 'existing'; id: string }
  | { kind: 'draft'; draft: ProcessDashboardType }
  | null;

export function ProcessDashboard() {
  const [open, setOpen] = useState<OpenState>(null);
  const { data: dashboard, isLoading } = useDashboard(
    open?.kind === 'existing' ? open.id : null,
  );

  if (open?.kind === 'draft') {
    return (
      <DashboardCanvas
        key="draft"
        dashboard={open.draft}
        isDraft
        onBack={() => setOpen(null)}
        onCreated={(newId) => setOpen({ kind: 'existing', id: newId })}
      />
    );
  }

  if (open?.kind === 'existing') {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
          <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
        </div>
      );
    }
    if (dashboard) {
      return (
        <DashboardCanvas
          key={dashboard.id}
          dashboard={dashboard}
          onBack={() => setOpen(null)}
        />
      );
    }
    // Not found — fall back
    setOpen(null);
  }

  return (
    <DashboardList
      onOpen={(id) => setOpen({ kind: 'existing', id })}
      onOpenDraft={(draft) => setOpen({ kind: 'draft', draft })}
    />
  );
}
