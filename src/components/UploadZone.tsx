import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  disabled: boolean;
  onFilesSelect: (files: File[]) => void;
}

export const UploadZone = ({ disabled, onFilesSelect }: UploadZoneProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    onFilesSelect(Array.from(files));
    e.target.value = "";
  };

  const handleClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    onFilesSelect(Array.from(files));
  };

  return (
    <div className="mb-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        multiple
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
          "flex flex-col items-center rounded-xl border-2 border-dashed px-6 py-12 transition-colors",
          disabled
            ? "cursor-not-allowed border-muted-foreground/15 bg-muted/50 opacity-60"
            : "cursor-pointer",
          !disabled &&
            (isDragging
              ? "border-primary bg-accent/50"
              : "border-muted-foreground/25 hover:border-primary hover:bg-accent/50"),
        )}
      >
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
        <h3 className="mb-2 text-sm font-semibold">이미지를 드래그하거나 클릭</h3>
        <p className="mb-4 text-xs text-muted-foreground">JPG, PNG (최대 5MB, 최대 10장)</p>
        <Button variant="default" size="sm" disabled={disabled} tabIndex={-1}>
          파일 선택
        </Button>
      </div>
    </div>
  );
};
