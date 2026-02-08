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
    <div className="relative overflow-hidden rounded-lg border bg-white">
      <canvas ref={canvasRef} className="block max-w-full" />
      <canvas
        ref={maskCanvasRef}
        className="absolute left-0 top-0 block max-w-full cursor-crosshair"
        style={{ width: "100%", height: "100%" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      />
    </div>
  );
};
