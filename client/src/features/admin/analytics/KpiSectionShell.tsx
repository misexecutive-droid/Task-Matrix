import type { LucideIcon } from 'lucide-react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { StatCard, type Trend } from '../../dashboard';

interface KpiCardConfig {
  icon: LucideIcon;
  iconTint: string;
  label: string;
  value: string;
  trend: Trend;
}

interface KpiSectionShellProps {
  icon: LucideIcon;
  title: string;
  description: string;
  isPending: boolean;
  isError: boolean;
  errorMessage: string;
  cards: KpiCardConfig[];
  chart: React.ReactNode;
}

// Shared layout for every KPI group on the analytics page (header, stat cards, chart card, plus
// loading/error states) — each report just supplies its own data + chart. Adding another chart to
// the dashboard means writing one thin section component, not repeating this scaffolding.
export const KpiSectionShell = ({ icon: Icon, title, description, isPending, isError, errorMessage, cards, chart }: KpiSectionShellProps) => (
  <section className="flex flex-col gap-6">
    <header className="flex items-center gap-4">
      <div className="flex items-center justify-center size-12 rounded-2xl bg-primary-500/10 text-primary-600 dark:text-primary-400 ring-1 ring-primary-500/20 shrink-0">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h2 className="text-xl font-display font-bold text-text">{title}</h2>
        <p className="text-sm font-display text-text-muted leading-relaxed">{description}</p>
      </div>
    </header>

    {isError ? (
      <div className="flex items-start gap-3 p-4 bg-danger/10 border border-danger/30 rounded-xl">
        <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
        <p className="text-sm font-display font-medium text-danger">{errorMessage}</p>
      </div>
    ) : (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {cards.map((c) => (
            <StatCard key={c.label} {...c} />
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          {isPending ? (
            <div className="h-[260px] flex flex-col items-center justify-center gap-3 text-text-muted">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              <span className="text-sm font-display">Loading…</span>
            </div>
          ) : (
            chart
          )}
        </div>
      </div>
    )}
  </section>
);
