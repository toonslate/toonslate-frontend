import type { RefObject } from "react";

interface RetouchCanvasProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  maskCanvasRef: RefObject<HTMLCanvasElement | null>;
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: () => void;
}

export const RetouchCanvas = ({
  canvasRef,
  maskCanvasRef,
  onMouseDown,
  onMouseMove,
  onMouseUp,
}: RetouchCanvasProps) => {
  return (
    <div className="relative w-fit overflow-hidden rounded-lg border bg-white">
      <canvas ref={canvasRef} className="block max-w-full h-auto" />
      <canvas
        ref={maskCanvasRef}
        className="absolute inset-0 block cursor-crosshair"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      />
    </div>
  );
};
