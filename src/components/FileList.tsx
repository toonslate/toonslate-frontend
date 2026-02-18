import { Badge } from "@/components/ui/badge";
import type { FileEntry } from "@/pages/translate/translatePageReducer";
import { MAX_BATCH_SIZE } from "@/pages/translate/translatePageReducer";
import { getValidationErrorMessage } from "@/utils/imageValidation";

interface FileListProps {
  entries: FileEntry[];
  disabled: boolean;
  onRemove: (id: string) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FileThumbnail = ({ src, alt }: { src: string; alt: string }) => (
  <img src={src} alt={alt} className="h-10 w-10 rounded object-cover" />
);

export const FileList = ({ entries, disabled, onRemove }: FileListProps) => {
  if (entries.length === 0) return null;

  return (
    <div className="mb-6">
      <p className="mb-2 text-xs text-muted-foreground">
        {entries.length}/{MAX_BATCH_SIZE}장
      </p>
      <ul className="space-y-2">
        {entries.map((entry) => {
          const { validation, uploadError } = entry;
          const isValidating = validation === null;
          const isInvalid = validation !== null && !validation.valid;

          return (
            <li key={entry.id} className="flex items-center gap-3 rounded-lg border px-3 py-2">
              <FileThumbnail src={entry.previewUrl} alt={entry.file.name} />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{entry.file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(entry.file.size)}</p>
                {isInvalid &&
                  validation.errors.map((error) => (
                    <p key={error} className="text-xs text-destructive">
                      {getValidationErrorMessage(error)}
                    </p>
                  ))}
                {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
              </div>

              <div className="flex items-center gap-2">
                {isValidating && <Badge variant="secondary">검증 중</Badge>}
                {isInvalid && <Badge variant="destructive">실패</Badge>}
                {validation?.valid && !uploadError && <Badge variant="secondary">준비</Badge>}
                {uploadError && <Badge variant="destructive">업로드 실패</Badge>}

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onRemove(entry.id)}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="h-4 w-4"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
