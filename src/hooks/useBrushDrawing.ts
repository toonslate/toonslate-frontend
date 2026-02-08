import { useEffect, useRef, useState } from "react";

const BRUSH_SIZE_DEFAULT = 30;
const BRUSH_SIZE_MIN = 5;
const BRUSH_SIZE_MAX = 100;
const BASE64_PNG_PREFIX = "data:image/png;base64,";

interface CanvasSize {
  width: number;
  height: number;
}

const hasVisiblePixel = (data: Uint8ClampedArray): boolean => {
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 0) return true;
  }
  return false;
};

export const useBrushDrawing = (canvasSize: CanvasSize) => {
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const isDrawingRef = useRef(false);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZE_DEFAULT);

  const getMaskContext = () => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d");
  };

  const isCanvasReady = canvasSize.width > 0 && canvasSize.height > 0;

  useEffect(() => {
    if (!maskCanvasRef.current || !isCanvasReady) return;
    maskCanvasRef.current.width = canvasSize.width;
    maskCanvasRef.current.height = canvasSize.height;
  }, [canvasSize.width, canvasSize.height, isCanvasReady]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const drawBrush = (x: number, y: number, isStart: boolean) => {
    const ctx = getMaskContext();
    if (!ctx) return;

    ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
    ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (isStart || !lastPosRef.current) {
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    lastPosRef.current = { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    const { x, y } = getCanvasCoords(e);
    drawBrush(x, y, true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const { x, y } = getCanvasCoords(e);
    drawBrush(x, y, false);
  };

  const handleMouseUp = () => {
    isDrawingRef.current = false;
    lastPosRef.current = null;
  };

  const clearMask = () => {
    const canvas = maskCanvasRef.current;
    const ctx = getMaskContext();
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const getMaskAsBase64 = (): string | null => {
    const canvas = maskCanvasRef.current;
    const ctx = getMaskContext();
    if (!canvas || !ctx) return null;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    if (!hasVisiblePixel(imageData.data)) return null;

    const dataUrl = canvas.toDataURL("image/png");
    return dataUrl.startsWith(BASE64_PNG_PREFIX)
      ? dataUrl.slice(BASE64_PNG_PREFIX.length)
      : dataUrl;
  };

  return {
    maskCanvasRef,
    brushSize,
    setBrushSize,
    brushSizeMin: BRUSH_SIZE_MIN,
    brushSizeMax: BRUSH_SIZE_MAX,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    clearMask,
    getMaskAsBase64,
  };
};
