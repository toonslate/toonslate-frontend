import axios from "axios";

import { Button } from "@/components/ui/button";

interface TranslateResultProps {
  resultUrl: string;
}

// TODO: 다운로드 실패 시 Toast로 에러 메시지 표시 + 중복 클릭 방지 (isDownloading 상태)
export const TranslateResult = ({ resultUrl }: TranslateResultProps) => {
  const handleDownload = async () => {
    const { data } = await axios.get<Blob>(resultUrl, { responseType: "blob" });
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `toonslate-result-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">번역 결과</h2>
        <Button onClick={() => void handleDownload()} size="sm">
          다운로드
        </Button>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <img src={resultUrl} alt="번역된 이미지" className="h-auto w-full" />
      </div>
    </div>
  );
};
