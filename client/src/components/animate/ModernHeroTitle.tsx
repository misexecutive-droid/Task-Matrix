import { useEffect, useState } from "react";

const PHRASES     = ['Every Task', 'Every Deadline', 'One View'];
const PAUSE_TICKS = 25;
const TICK_MS     = 70;

const cyclesPerPhrase = PHRASES.map(p => p.length * 2 + PAUSE_TICKS);
const cumulativeTicks = cyclesPerPhrase.reduce<number[]>(
  (acc, c) => [...acc, (acc.at(-1) ?? 0) + c], []
);
const totalTicks = cumulativeTicks.at(-1)!;

export const ModernHeroTitle = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setStep(s => (s + 1) % totalTicks), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const phraseIdx    = cumulativeTicks.findIndex(cum => step < cum);
  const remaining    = step - (cumulativeTicks[phraseIdx - 1] ?? 0);
  const phrase       = PHRASES[phraseIdx];
  const len          = phrase.length;

  // typing → remaining, pause → len, deleting → counts back down
  // Math.min(remaining, len, ...) collapses all three phases — no if/else
  const charsToShow  = Math.min(remaining, len, len - Math.max(0, remaining - len - PAUSE_TICKS));
  const displayedText = phrase.substring(0, Math.max(0, charsToShow));

  return (
    <h1 className="font-display font-semibold tracking-tight leading-none">
      <span className="block text-white/50 text-xl font-normal tracking-widest uppercase mb-3">      </span>

      <span className="text-white text-5xl md:text-6xl min-h-18 block">
        {displayedText}
        <span
          className="inline-block ml-0.5 w-0.5 h-10 md:h-12 bg-amber-400 animate-blink align-middle"
          aria-hidden="true"
        />
      </span>
    </h1>
  );
};
