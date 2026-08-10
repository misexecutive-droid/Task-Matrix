import { useRef, useState, type PointerEvent } from 'react';
import { RotateCcw } from 'lucide-react';

interface SignaturePadCanvasProps {
  label:    string;
  disabled?: boolean;
  onChange: (dataUrl: string | null) => void;
}

// Shared drawing surface for SIGNATURE and DUAL_SIGNATURE — pointer events cover mouse, touch,
// and stylus in one handler set, so it works the same on a store tablet as a desktop browser.
// Emits a PNG data URL once a stroke is drawn, null again after Clear.
export const SignaturePadCanvas = ({ label, disabled, onChange }: SignaturePadCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const getContext = () => canvasRef.current?.getContext('2d') ?? null;

  const pointFromEvent = (e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const handlePointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const ctx = getContext();
    if (!ctx) return;
    drawingRef.current = true;
    const { x, y } = pointFromEvent(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handlePointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (disabled || !drawingRef.current) return;
    const ctx = getContext();
    if (!ctx) return;
    const { x, y } = pointFromEvent(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e293b';
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasDrawn) setHasDrawn(true);
  };

  const finishStroke = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) onChange(canvas.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onChange(null);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-medium text-text-secondary">{label}</span>
        {hasDrawn && !disabled && (
          <button
            type="button"
            onClick={clear}
            className="flex items-center gap-1 text-[11px] font-mono text-text-muted hover:text-amber-500 transition-colors cursor-pointer"
          >
            <RotateCcw size={11} /> Clear
          </button>
        )}
      </div>
      <canvas
        ref={canvasRef}
        width={480}
        height={140}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishStroke}
        onPointerLeave={finishStroke}
        className={`w-full h-[140px] rounded-md border border-border bg-white touch-none ${disabled ? 'opacity-60' : 'cursor-crosshair'}`}
      />
    </div>
  );
};
