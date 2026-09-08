import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { ArrowLeft, Menu, X, Rocket, LayoutGrid, Code2, Network, Server } from 'lucide-react';

const NAV = [
  { group: 'Introdução', items: [
    { to: '/docs', label: 'Começar', icon: Rocket, end: true },
  ] },
  { group: 'Guia da plataforma', items: [
    { to: '/docs/plataforma', label: 'Pages & fluxo do EDU', icon: LayoutGrid },
  ] },
  { group: 'Integração', items: [
    { to: '/docs/http', label: 'Via HTTP (REST)', icon: Code2 },
    { to: '/docs/i3x', label: 'Via i3X (CESMII)', icon: Network },
  ] },
  { group: 'EDU Edge', items: [
    { to: '/docs/edu-edge', label: 'Instalar (Docker)', icon: Server },
  ] },
];

export function DocsLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/85 backdrop-blur dark:border-gray-800 dark:bg-gray-950/85">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <button onClick={() => setOpen((o) => !o)} className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden dark:hover:bg-gray-800" aria-label="Menu">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/" className="flex items-center gap-2">
              <img src="/edu-logo.png" alt="EDU" className="h-7 w-auto select-none dark:brightness-0 dark:invert" draggable={false} />
              <span className="hidden text-sm font-medium text-gray-400 sm:inline">/ Documentação</span>
            </Link>
          </div>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Voltar ao site
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        <aside className={`${open ? 'block' : 'hidden'} fixed inset-x-0 top-[57px] z-20 max-h-[calc(100vh-57px)] overflow-y-auto border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-950 lg:sticky lg:top-[57px] lg:block lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r`}>
          <nav className="space-y-5">
            {NAV.map((g) => (
              <div key={g.group}>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{g.group}</p>
                <ul className="space-y-0.5">
                  {g.items.map((it) => {
                    const I = it.icon;
                    return (
                      <li key={it.to}>
                        <NavLink to={it.to} end={Boolean((it as { end?: boolean }).end)} onClick={() => setOpen(false)}
                          className={({ isActive }) => `flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition ${
                            isActive
                              ? 'bg-emerald-50 font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                          }`}>
                          <I className="h-4 w-4 shrink-0" /> {it.label}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-3xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
