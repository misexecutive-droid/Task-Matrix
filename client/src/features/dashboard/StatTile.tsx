import type { LucideIcon } from 'lucide-react';

export interface StatDelta {
  text: string;
  tone: 'up' | 'down' | 'neutral';
}

const DELTA_TONE_CLASS: Record<StatDelta['tone'], string> = {
  up: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  down: 'bg-danger/10 text-danger',
  neutral: 'bg-surface-hover text-text-muted',
};

interface StatTileProps {
  icon: LucideIcon;
  label: string;
  value: number;
  tint: string;
  delta?: StatDelta;
}

export const StatTile = ({ icon: Icon, label, value, tint, delta }: StatTileProps) => (
  <div className="flex flex-col gap-4 p-5 rounded-2xl border border-border bg-surface/80 backdrop-blur-sm">
    <div className={`flex items-center justify-center size-11 rounded-xl shrink-0 ${tint}`}>
      <Icon size={20} />
    </div>
    <div>
      <p className="text-sm text-text-muted font-display">{label}</p>
      <div className="flex items-end justify-between gap-2 mt-1.5">
        <p className="text-2xl font-display font-bold text-text leading-none">{value}</p>
        {delta && (
          <span className={`text-xs font-display font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${DELTA_TONE_CLASS[delta.tone]}`}>
            {delta.text}
          </span>
        )}
      </div>
    </div>
  </div>
);
