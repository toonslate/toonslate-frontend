import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useBrushDrawing } from "../useBrushDrawing";

const createMockCanvasContext = () => {
  return {
    strokeStyle: "",
    fillStyle: "",
    lineWidth: 0,
    lineCap: "" as CanvasLineCap,
    lineJoin: "" as CanvasLineJoin,
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(16),
    })),
  };
};

const createMockCanvas = (ctx: ReturnType<typeof createMockCanvasContext>) => {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 600;

  vi.spyOn(canvas, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
  vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
    left: 0,
    top: 0,
    width: 800,
    height: 600,
    right: 800,
    bottom: 600,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
  vi.spyOn(canvas, "toDataURL").mockReturnValue("data:image/png;base64,mockBase64Data");

  return canvas;
};

const createMouseEvent = (
  clientX: number,
  clientY: number,
): React.MouseEvent<HTMLCanvasElement> => {
  return { clientX, clientY } as React.MouseEvent<HTMLCanvasElement>;
};

describe("useBrushDrawing", () => {
  describe("setBrushSize", () => {
    it("브러시 크기를 변경한다", () => {
      const { result } = renderHook(() => useBrushDrawing({ width: 800, height: 600 }));

      act(() => {
        result.current.setBrushSize(50);
      });

      expect(result.current.brushSize).toBe(50);
    });
  });

  describe("캔버스 ref 미할당 시", () => {
    it("getMaskAsBase64는 null을 반환한다", () => {
      const { result } = renderHook(() => useBrushDrawing({ width: 800, height: 600 }));

      expect(result.current.getMaskAsBase64()).toBeNull();
    });

    it("clearMask는 에러 없이 실행된다", () => {
      const { result } = renderHook(() => useBrushDrawing({ width: 800, height: 600 }));

      expect(() => result.current.clearMask()).not.toThrow();
    });

    it("handleMouseUp은 에러 없이 실행된다", () => {
      const { result } = renderHook(() => useBrushDrawing({ width: 800, height: 600 }));

      expect(() => result.current.handleMouseUp()).not.toThrow();
    });
  });

  describe("캔버스 ref 할당 후", () => {
    it("clearMask는 ctx.clearRect를 호출한다", () => {
      const ctx = createMockCanvasContext();
      const canvas = createMockCanvas(ctx);

      const { result } = renderHook(() => useBrushDrawing({ width: 800, height: 600 }));

      Object.defineProperty(result.current.maskCanvasRef, "current", {
        value: canvas,
        writable: true,
      });

      result.current.clearMask();

      expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
    });

    it("getMaskAsBase64는 보이는 픽셀이 없으면 null을 반환한다", () => {
      const ctx = createMockCanvasContext();
      ctx.getImageData.mockReturnValue({
        data: new Uint8ClampedArray(16),
      });
      const canvas = createMockCanvas(ctx);

      const { result } = renderHook(() => useBrushDrawing({ width: 800, height: 600 }));

      Object.defineProperty(result.current.maskCanvasRef, "current", {
        value: canvas,
        writable: true,
      });

      expect(result.current.getMaskAsBase64()).toBeNull();
    });

    it("getMaskAsBase64는 보이는 픽셀이 있으면 base64 문자열을 반환한다", () => {
      const ctx = createMockCanvasContext();
      const pixelData = new Uint8ClampedArray(8);
      pixelData[3] = 255;
      ctx.getImageData.mockReturnValue({ data: pixelData });
      const canvas = createMockCanvas(ctx);

      const { result } = renderHook(() => useBrushDrawing({ width: 800, height: 600 }));

      Object.defineProperty(result.current.maskCanvasRef, "current", {
        value: canvas,
        writable: true,
      });

      expect(result.current.getMaskAsBase64()).toBe("mockBase64Data");
    });

    it("handleMouseDown은 ctx의 드로잉 메서드를 호출한다", () => {
      const ctx = createMockCanvasContext();
      const canvas = createMockCanvas(ctx);

      const { result } = renderHook(() => useBrushDrawing({ width: 800, height: 600 }));

      Object.defineProperty(result.current.maskCanvasRef, "current", {
        value: canvas,
        writable: true,
      });

      result.current.handleMouseDown(createMouseEvent(100, 100));

      expect(ctx.beginPath).toHaveBeenCalled();
      expect(ctx.arc).toHaveBeenCalled();
      expect(ctx.fill).toHaveBeenCalled();
    });

    it("handleMouseDown 후 handleMouseMove는 stroke를 호출한다", () => {
      const ctx = createMockCanvasContext();
      const canvas = createMockCanvas(ctx);

      const { result } = renderHook(() => useBrushDrawing({ width: 800, height: 600 }));

      Object.defineProperty(result.current.maskCanvasRef, "current", {
        value: canvas,
        writable: true,
      });

      result.current.handleMouseDown(createMouseEvent(100, 100));
      result.current.handleMouseMove(createMouseEvent(150, 150));

      expect(ctx.moveTo).toHaveBeenCalled();
      expect(ctx.lineTo).toHaveBeenCalled();
      expect(ctx.stroke).toHaveBeenCalled();
    });

    it("handleMouseUp 후 handleMouseMove는 드로잉하지 않는다", () => {
      const ctx = createMockCanvasContext();
      const canvas = createMockCanvas(ctx);

      const { result } = renderHook(() => useBrushDrawing({ width: 800, height: 600 }));

      Object.defineProperty(result.current.maskCanvasRef, "current", {
        value: canvas,
        writable: true,
      });

      result.current.handleMouseDown(createMouseEvent(100, 100));
      result.current.handleMouseUp();

      ctx.beginPath.mockClear();
      ctx.stroke.mockClear();
      ctx.fill.mockClear();

      result.current.handleMouseMove(createMouseEvent(200, 200));

      expect(ctx.beginPath).not.toHaveBeenCalled();
      expect(ctx.stroke).not.toHaveBeenCalled();
      expect(ctx.fill).not.toHaveBeenCalled();
    });
  });
});
