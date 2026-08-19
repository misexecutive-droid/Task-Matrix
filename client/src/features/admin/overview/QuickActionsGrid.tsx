import { Contact, ListChecks, TicketCheck, FileDown, Network, Zap } from 'lucide-react';
import { QuickActionButton } from './QuickActionButton';

const ACTIONS = [
  { to: '/admin/directory', icon: Contact, label: 'Directory', description: 'Users, departments & stores' },
  { to: '/admin/org-structure', icon: Network, label: 'Org Structure', description: 'See the reporting ladder' },
  { to: '/admin/scheduled-checklists/builder', icon: ListChecks, label: 'Checklist Builder', description: 'Create a template' },
  { to: '/admin/tickets', icon: TicketCheck, label: 'Tickets', description: 'View open issues' },
  { to: '/admin/reports', icon: FileDown, label: 'Reports', description: 'Export data' },
] as const;

export const QuickActionsGrid = () => (
  <section className="relative overflow-hidden rounded-xl border border-border/60 bg-surface">
    {/* Decorative glow, matching RecentActivity's panel language */}
    <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-primary-500/10 blur-3xl" />

    <div className="relative z-10 flex items-center gap-3 border-b border-border/40 bg-surface/50 px-6 py-5 backdrop-blur-sm">
      <div className="flex items-center justify-center rounded-lg border border-border/50 bg-surface-hover p-2">
        <Zap size={18} className="text-primary-500" />
      </div>
      <div>
        <h2 className="font-display text-lg font-semibold tracking-tight text-text">Quick actions</h2>
        <p className="mt-0.5 font-display text-xs text-text-muted">Jump straight to the tools you use most</p>
      </div>
    </div>

    <div className="relative z-10 grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-6 lg:grid-cols-3">
      {ACTIONS.map((action) => (
        <QuickActionButton key={action.to} {...action} />
      ))}
    </div>
  </section>
);
