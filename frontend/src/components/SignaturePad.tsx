'use client';
import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';

export interface SignatureHandle {
  toBlob: () => Promise<Blob | null>;
  clear: () => void;
  isEmpty: () => boolean;
}

// Zone de signature tactile/souris. Expose toBlob/clear/isEmpty via ref.
const SignaturePad = forwardRef<SignatureHandle>(function SignaturePad(_props, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const dirty = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111';

    function pos(e: PointerEvent) {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    function down(e: PointerEvent) {
      drawing.current = true; dirty.current = true;
      const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y);
    }
    function move(e: PointerEvent) {
      if (!drawing.current) return;
      const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke();
    }
    function up() { drawing.current = false; }

    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, []);

  useImperativeHandle(ref, () => ({
    toBlob: () => new Promise((resolve) => canvasRef.current!.toBlob(resolve, 'image/png')),
    clear: () => {
      const c = canvasRef.current!;
      c.getContext('2d')!.clearRect(0, 0, c.width, c.height);
      dirty.current = false;
    },
    isEmpty: () => !dirty.current,
  }));

  return (
    <canvas
      ref={canvasRef}
      width={440}
      height={140}
      className="border rounded bg-white touch-none w-full"
      style={{ touchAction: 'none' }}
    />
  );
});

export default SignaturePad;
