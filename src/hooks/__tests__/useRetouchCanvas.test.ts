import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { downloadBlob } from "@/utils/download";

import { useRetouchCanvas } from "../useRetouchCanvas";

vi.mock("@/utils/download", () => ({
  downloadBlob: vi.fn(),
}));

const createMockCanvas = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 600;

  vi.spyOn(canvas, "getContext").mockReturnValue({
    clearRect: vi.fn(),
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D);

  vi.spyOn(canvas, "toDataURL").mockReturnValue("data:image/png;base64,mockBase64Data");

  vi.spyOn(canvas, "toBlob").mockImplementation((callback) => {
    callback(new Blob(["mock"], { type: "image/png" }));
  });

  return canvas;
};

describe("useRetouchCanvas", () => {
  describe("캔버스 ref 미할당 시", () => {
    it("getCanvasAsBase64는 null을 반환한다", () => {
      const { result } = renderHook(() => useRetouchCanvas({ imageUrl: null }));

      expect(result.current.getCanvasAsBase64()).toBeNull();
    });

    it("drawImageFromBase64는 에러 없이 실행된다", () => {
      const { result } = renderHook(() => useRetouchCanvas({ imageUrl: null }));

      expect(() => result.current.drawImageFromBase64("someBase64")).not.toThrow();
    });

    it("downloadCanvas는 에러 없이 실행된다", () => {
      const { result } = renderHook(() => useRetouchCanvas({ imageUrl: null }));

      expect(() => result.current.downloadCanvas("test.png")).not.toThrow();
    });
  });

  describe("이미지 로딩", () => {
    let mockImageInstances: Array<{
      crossOrigin: string;
      onload: (() => void) | null;
      onerror: (() => void) | null;
      width: number;
      height: number;
      _src: string;
    }>;
    let originalImage: typeof globalThis.Image;

    beforeEach(() => {
      mockImageInstances = [];
      originalImage = globalThis.Image;

      globalThis.Image = function MockImage(this: {
        crossOrigin: string;
        onload: (() => void) | null;
        onerror: (() => void) | null;
        width: number;
        height: number;
        _src: string;
      }) {
        this.crossOrigin = "";
        this.onload = null;
        this.onerror = null;
        this.width = 0;
        this.height = 0;
        this._src = "";
        Object.defineProperty(this, "src", {
          get: () => this._src,
          set: (value: string) => {
            this._src = value;
          },
        });
        mockImageInstances.push(this);
      } as unknown as typeof globalThis.Image;
    });

    afterEach(() => {
      globalThis.Image = originalImage;
    });

    const renderWithCanvas = (
      imageUrl: string | null,
      onImageLoaded?: (base64: string) => void,
    ) => {
      const canvas = createMockCanvas();
      const hookReturn = renderHook((props) => useRetouchCanvas(props), {
        initialProps: { imageUrl, onImageLoaded },
      });
      Object.defineProperty(hookReturn.result.current.canvasRef, "current", {
        value: canvas,
        writable: true,
      });
      return { ...hookReturn, canvas };
    };

    it("imageUrl이 설정되고 Image 로드 성공 시 canvasSize가 업데이트된다", async () => {
      const { result, rerender } = renderWithCanvas(null);

      rerender({ imageUrl: "https://example.com/image.png", onImageLoaded: undefined });

      const img = mockImageInstances[0];
      img.width = 1024;
      img.height = 768;
      img.onload!();

      await waitFor(() => {
        expect(result.current.canvasSize).toEqual({ width: 1024, height: 768 });
      });
    });

    it("Image 로드 성공 시 onImageLoaded 콜백이 base64 문자열로 호출된다", async () => {
      const onImageLoaded = vi.fn();
      const { rerender } = renderWithCanvas(null, onImageLoaded);

      rerender({ imageUrl: "https://example.com/image.png", onImageLoaded });

      const img = mockImageInstances[0];
      img.width = 800;
      img.height = 600;
      img.onload!();

      await waitFor(() => {
        expect(onImageLoaded).toHaveBeenCalledWith("mockBase64Data");
      });
    });

    it("Image 로드 실패 시 imageError가 true가 된다", async () => {
      const { result, rerender } = renderWithCanvas(null);

      rerender({ imageUrl: "https://example.com/broken.png", onImageLoaded: undefined });

      const img = mockImageInstances[0];
      img.onerror!();

      await waitFor(() => {
        expect(result.current.imageError).toBe(true);
      });
    });
  });

  describe("캔버스 ref 할당 후", () => {
    it("getCanvasAsBase64는 base64 문자열을 반환한다", () => {
      const canvas = createMockCanvas();

      const { result } = renderHook(() => useRetouchCanvas({ imageUrl: null }));

      Object.defineProperty(result.current.canvasRef, "current", {
        value: canvas,
        writable: true,
      });

      expect(result.current.getCanvasAsBase64()).toBe("mockBase64Data");
    });

    it("downloadCanvas는 downloadBlob을 호출한다", () => {
      const canvas = createMockCanvas();

      const { result } = renderHook(() => useRetouchCanvas({ imageUrl: null }));

      Object.defineProperty(result.current.canvasRef, "current", {
        value: canvas,
        writable: true,
      });

      result.current.downloadCanvas("result.png");

      expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), "result.png");
    });

    it("downloadCanvas에서 toBlob이 null을 반환하면 downloadBlob을 호출하지 않는다", () => {
      const canvas = createMockCanvas();
      vi.spyOn(canvas, "toBlob").mockImplementation((callback) => {
        callback(null);
      });

      const { result } = renderHook(() => useRetouchCanvas({ imageUrl: null }));

      Object.defineProperty(result.current.canvasRef, "current", {
        value: canvas,
        writable: true,
      });

      vi.mocked(downloadBlob).mockClear();
      result.current.downloadCanvas("result.png");

      expect(downloadBlob).not.toHaveBeenCalled();
    });
  });
});
