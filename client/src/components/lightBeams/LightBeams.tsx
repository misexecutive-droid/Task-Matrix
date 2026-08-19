interface LightBeamsProps {
  count?: number;
  className?: string;
}

const TONE_COLOR = [
  'rgba(90, 150, 220, .55)', // primary
  'rgba(212, 175, 55, .55)', // coral
];

// Thin glowing streaks sweeping across the container at a shallow angle, staggered so they pass
// like scanning light / comet trails rather than in lockstep. Purely ornamental — aria-hidden.
export const LightBeams = ({ count = 3, className }: LightBeamsProps) => (
  <div aria-hidden="true" className={`absolute inset-0 -z-10 overflow-hidden pointer-events-none ${className ?? ''}`}>
    {Array.from({ length: count }).map((_, i) => {
      const color = TONE_COLOR[i % TONE_COLOR.length];
      return (
        <span
          key={i}
          className="absolute h-px w-48 animate-light-beam"
          style={{
            top: `${18 + i * (60 / Math.max(count - 1, 1))}%`,
            left: 0,
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            animationDuration: `${7 + i * 1.8}s`,
            animationDelay: `${i * 2.2}s`,
          }}
        />
      );
    })}
  </div>
);
