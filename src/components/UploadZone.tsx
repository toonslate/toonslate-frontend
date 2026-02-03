import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  filename: string | null;
  previewUrl: string | null;
  isUploading: boolean;
  hasUpload: boolean;
  onFileSelect: (file: File) => void;
  onClear: () => void;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const isValidFile = (file: File): boolean => {
  return ACCEPTED_TYPES.includes(file.type) && file.size <= MAX_FILE_SIZE;
};

// TODO: 파일 검증 실패 시 Toast로 에러 메시지 표시

export const UploadZone = ({
  filename,
  previewUrl,
  isUploading,
  hasUpload,
  onFileSelect,
  onClear,
}: UploadZoneProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (isValidFile(file)) {
      onFileSelect(file);
    }

    e.target.value = "";
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // TODO: 다중 파일 업로드 지원 시 files 전체 처리 필요
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (isValidFile(file)) {
      onFileSelect(file);
    }
  };

  return (
    <div className="mb-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleChange}
        className="hidden"
      />
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-6 py-12 transition-colors",
          isDragging
            ? "border-primary bg-accent/50"
            : "border-muted-foreground/25 hover:border-primary hover:bg-accent/50",
        )}
      >
        {previewUrl ? (
          <div className="relative mb-4">
            <img src={previewUrl} alt="미리보기" className="h-16 w-16 rounded-lg object-cover" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs hover:bg-destructive/90"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="h-6 w-6 text-muted-foreground"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
          </div>
        )}
        <h3 className="mb-2 text-sm font-semibold">{filename ?? "이미지를 드래그하거나 클릭"}</h3>
        <p className="mb-4 text-xs text-muted-foreground">JPG, PNG (최대 10MB)</p>
        <Button variant={hasUpload ? "outline" : "default"} disabled={isUploading} size="sm">
          {isUploading ? "업로드 중..." : hasUpload ? "다른 이미지 선택" : "파일 선택"}
        </Button>
      </div>
    </div>
  );
};
