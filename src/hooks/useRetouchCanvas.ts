import { useCallback, useEffect, useRef, useState } from "react";

import { downloadBlob } from "@/utils/download";

interface UseRetouchCanvasOptions {
  imageUrl: string | null | undefined;
  onImageLoaded?: (base64: string) => void;
}

interface CanvasSize {
  width: number;
  height: number;
}

export const useRetouchCanvas = ({ imageUrl, onImageLoaded }: UseRetouchCanvasOptions) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 0, height: 0 });
  const [imageError, setImageError] = useState(false);
  const onImageLoadedRef = useRef(onImageLoaded);
  useEffect(() => {
    onImageLoadedRef.current = onImageLoaded;
  });

  useEffect(() => {
    if (!imageUrl || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      canvas.width = img.width;
      canvas.height = img.height;
      setCanvasSize({ width: img.width, height: img.height });
      ctx.drawImage(img, 0, 0);
      setImageError(false);

      const dataUrl = canvas.toDataURL("image/png");
      const prefix = "data:image/png;base64,";
      const base64 = dataUrl.startsWith(prefix) ? dataUrl.slice(prefix.length) : dataUrl;
      onImageLoadedRef.current?.(base64);
    };
    img.onerror = () => {
      if (cancelled) return;
      setImageError(true);
    };
    img.src = imageUrl;

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  const drawImageFromBase64 = useCallback((base64: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = `data:image/png;base64,${base64}`;
  }, []);

  const getCanvasAsBase64 = useCallback((): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const dataUrl = canvas.toDataURL("image/png");
    const prefix = "data:image/png;base64,";
    return dataUrl.startsWith(prefix) ? dataUrl.slice(prefix.length) : dataUrl;
  }, []);

  const downloadCanvas = (filename: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      downloadBlob(blob, filename);
    }, "image/png");
  };

  return {
    canvasRef,
    canvasSize,
    imageError,
    drawImageFromBase64,
    getCanvasAsBase64,
    downloadCanvas,
  };
};
