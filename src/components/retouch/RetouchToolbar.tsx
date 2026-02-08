import { Button } from "@/components/ui/button";

interface RetouchToolbarProps {
  isErasing: boolean;
  onClearMask: () => void;
  onErase: () => void;
  onDownload: () => void;
}

export const RetouchToolbar = ({
  isErasing,
  onClearMask,
  onErase,
  onDownload,
}: RetouchToolbarProps) => {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">리터치</h1>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onClearMask} disabled={isErasing}>
          마스크 지우기
        </Button>
        <Button onClick={onErase} disabled={isErasing}>
          {isErasing ? "처리 중..." : "지우기"}
        </Button>
        <Button variant="outline" onClick={onDownload} disabled={isErasing}>
          다운로드
        </Button>
      </div>
    </div>
  );
};
