import { Button } from "@/components/ui/button";

interface RetouchToolbarProps {
  isErasing: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onClearMask: () => void;
  onErase: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDownload: () => void;
}

export const RetouchToolbar = ({
  isErasing,
  canUndo,
  canRedo,
  onClearMask,
  onErase,
  onUndo,
  onRedo,
  onDownload,
}: RetouchToolbarProps) => {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">리터치</h1>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onUndo} disabled={isErasing || !canUndo}>
          실행 취소
        </Button>
        <Button variant="outline" onClick={onRedo} disabled={isErasing || !canRedo}>
          다시 실행
        </Button>
        <Button variant="outline" onClick={onClearMask} disabled={isErasing}>
          마킹 초기화
        </Button>
        <Button onClick={onErase} disabled={isErasing}>
          {isErasing ? "처리 중..." : "제거"}
        </Button>
        <Button variant="outline" onClick={onDownload} disabled={isErasing}>
          다운로드
        </Button>
      </div>
    </div>
  );
};
