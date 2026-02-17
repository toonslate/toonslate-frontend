import { useParams } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";

import { Header } from "@/components/Header";
import { BrushSizeSlider, ErrorMessage, RetouchCanvas, RetouchToolbar } from "@/components/retouch";
import { useBrushDrawing } from "@/hooks/useBrushDrawing";
import { useEraseAction } from "@/hooks/useEraseAction";
import { useRetouchCanvas } from "@/hooks/useRetouchCanvas";
import { translateQueries } from "@/queries/translateQueries";

export const RetouchPage = () => {
  const { translateId } = useParams<{ translateId: string }>();

  const {
    data: translate,
    isLoading,
    error,
  } = useQuery(translateQueries.detail(translateId ?? null));

  const resultUrl = translate?.resultUrl;

  const {
    canvasRef,
    canvasSize,
    imageError,
    drawImageFromBase64,
    getCanvasAsBase64,
    downloadCanvas,
  } = useRetouchCanvas({ imageUrl: resultUrl });

  const {
    maskCanvasRef,
    brushSize,
    setBrushSize,
    brushSizeMin,
    brushSizeMax,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    clearMask,
    getMaskAsBase64,
  } = useBrushDrawing(canvasSize);

  const { erase, isErasing, eraseError } = useEraseAction({
    translateId: translateId ?? "",
    onSuccess: (resultBase64) => {
      drawImageFromBase64(resultBase64);
      clearMask();
    },
  });

  const handleErase = () => {
    const maskBase64 = getMaskAsBase64();
    if (!maskBase64) return;
    const sourceBase64 = getCanvasAsBase64();
    erase({ maskBase64, sourceBase64 });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <p>로딩 중...</p>
      </div>
    );
  }

  if (error || !translate) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <p>번역 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  if (translate.status !== "completed") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <p>번역이 완료되지 않았습니다.</p>
      </div>
    );
  }

  if (imageError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <p>이미지를 불러올 수 없습니다.</p>
      </div>
    );
  }

  const handleDownload = () => {
    downloadCanvas(`toonslate-${translateId ?? "result"}-${Date.now()}.png`);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />

      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6">
          <RetouchToolbar
            isErasing={isErasing}
            onClearMask={clearMask}
            onErase={() => void handleErase()}
            onDownload={handleDownload}
          />
        </div>

        <div className="mb-4">
          <BrushSizeSlider
            brushSize={brushSize}
            min={brushSizeMin}
            max={brushSizeMax}
            onChange={setBrushSize}
          />
        </div>

        {eraseError && (
          <div className="mb-4">
            <ErrorMessage message={eraseError} />
          </div>
        )}

        <RetouchCanvas
          canvasRef={canvasRef}
          maskCanvasRef={maskCanvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
      </main>
    </div>
  );
};
