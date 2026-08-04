import { ArrowRight } from 'lucide-react';

interface SignalCardProps {
  eyebrow: string;
  title: string;
  body: string;
  actionLabel: string;
  meta?: string;
  onAction?: () => void;
  className?: string;
}


export const SignalCard = ({ eyebrow, title, body, actionLabel, meta, onAction, className = '' }: SignalCardProps) => (
  <div
    className={`relative flex flex-col w-80 max-w-full p-6 rounded-2xl border border-primary-700/60 bg-primary-900 text-gray-50 shadow-[0_20px_48px_-24px_rgba(0,0,0,0.6)] overflow-hidden ${className}`}
  >
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_70%_at_0%_0%,rgba(52,101,171,0.22),transparent_55%)]"
    />

    <span className="relative inline-flex items-center gap-2 self-start px-2.5 py-1 mb-4 rounded-full border border-primary-700/60 bg-primary-500/15 font-mono text-[11px] uppercase tracking-wider text-primary-300">
      <span className="size-1.5 rounded-full bg-primary-400 shadow-[0_0_8px_rgba(52,101,171,0.7)]" />
      {eyebrow}
    </span>

    <h3 className="relative font-display text-xl font-semibold leading-snug tracking-tight text-gray-50 mb-2">
      {title}
    </h3>

    <p className="relative text-[13px] leading-relaxed text-gray-400">
      {body}
    </p>

    <div className="relative flex items-center justify-between gap-3 mt-6">
      <button
        type="button"
        onClick={onAction}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary-500 hover:bg-primary-400 text-white text-xs font-semibold shadow-[0_8px_24px_-12px_rgba(52,101,171,0.6)] transition-all duration-200 hover:-translate-y-0.5 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-900"
      >
        <span>{actionLabel}</span>
        <ArrowRight size={14} />
      </button>

      {meta && <span className="font-mono text-[11px] tracking-wide text-gray-500">{meta}</span>}
    </div>
  </div>
);
