import { useEffect, useReducer, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { createBatch, getApiErrorMessage, uploadImage } from "@/api";
import { FileList } from "@/components/FileList";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { UploadZone } from "@/components/UploadZone";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { validateImageFile } from "@/utils/imageValidation";

import {
  type FileEntry,
  INITIAL_STATE,
  MAX_BATCH_SIZE,
  translatePageReducer,
} from "./translatePageReducer";

export const TranslatePage = () => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(translatePageReducer, INITIAL_STATE);

  const entriesRef = useRef(state.entries);
  entriesRef.current = state.entries;

  useEffect(() => {
    return () => {
      for (const entry of entriesRef.current) {
        URL.revokeObjectURL(entry.previewUrl);
      }
    };
  }, []);

  const handleFilesSelect = (files: File[]) => {
    dispatch({ type: "CLEAR_WARNING" });

    const capacity = MAX_BATCH_SIZE - state.entries.length;
    if (files.length > capacity) {
      dispatch({ type: "WARN", message: "최대 10장까지 업로드할 수 있습니다" });
    }

    const entries: FileEntry[] = files.slice(0, capacity).map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      validation: null,
      uploadError: null,
    }));

    if (entries.length === 0) return;

    dispatch({ type: "ADD_FILES", entries });

    for (const entry of entries) {
      validateImageFile(entry.file).then(
        (result) => dispatch({ type: "VALIDATION_COMPLETE", id: entry.id, result }),
        () =>
          dispatch({
            type: "VALIDATION_COMPLETE",
            id: entry.id,
            result: { valid: false, errors: ["FILE_TYPE"] },
          }),
      );
    }
  };

  const handleRemove = (id: string) => {
    const entry = state.entries.find((e) => e.id === id);
    if (entry) URL.revokeObjectURL(entry.previewUrl);
    dispatch({ type: "REMOVE_FILE", id });
  };

  const isSubmittingRef = useRef(false);

  const handleSubmit = () => {
    void submitFiles();
  };

  const submitFiles = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    try {
      const validEntries = state.entries.filter((e) => e.validation?.valid);
      if (validEntries.length === 0) return;

      dispatch({ type: "SUBMIT_START" });

      const results = await Promise.allSettled(validEntries.map((e) => uploadImage(e.file)));

      const uploadIds: string[] = [];

      results.forEach((result, i) => {
        const entry = validEntries[i];
        if (result.status === "fulfilled") {
          uploadIds.push(result.value.uploadId);
        } else {
          dispatch({
            type: "UPLOAD_ERROR",
            id: entry.id,
            error: getApiErrorMessage(result.reason),
          });
        }
      });

      if (uploadIds.length === 0) {
        dispatch({ type: "ERROR", message: "모든 파일 업로드에 실패했습니다" });
        return;
      }

      const hasUploadErrors = results.some((r) => r.status === "rejected");

      dispatch({ type: "CREATING_BATCH" });

      const batch = await createBatch(uploadIds);
      dispatch({ type: "BATCH_CREATED", batchId: batch.batchId });

      if (hasUploadErrors) {
        const failedCount = validEntries.length - uploadIds.length;
        dispatch({
          type: "ERROR",
          message: `${failedCount}장 업로드 실패. 성공한 ${uploadIds.length}장으로 배치가 생성되었습니다.`,
        });
      } else {
        void navigate(`/batch/${batch.batchId}`);
      }
    } catch (error) {
      dispatch({ type: "ERROR", message: getApiErrorMessage(error) });
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const handleReset = () => {
    for (const entry of state.entries) {
      URL.revokeObjectURL(entry.previewUrl);
    }
    dispatch({ type: "RESET" });
  };

  const validCount = state.entries.filter((e) => e.validation?.valid).length;
  const hasValidFiles = validCount > 0;
  const isIdle = state.phase === "idle";
  const isValidating = state.phase === "validating";
  const isUploading = state.phase === "uploading";
  const isCreatingBatch = state.phase === "creating_batch";
  const isError = state.phase === "error";
  const isBusy = isUploading || isCreatingBatch;

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />

      <main className="mx-auto max-w-xl px-6 py-12">
        <HeroSection />

        <Card>
          <CardContent className="pt-6">
            <UploadZone
              disabled={state.entries.length >= MAX_BATCH_SIZE || isBusy}
              onFilesSelect={handleFilesSelect}
            />

            <FileList entries={state.entries} disabled={isBusy} onRemove={handleRemove} />

            {state.warning && (
              <Alert className="mb-4">
                <AlertDescription>{state.warning}</AlertDescription>
              </Alert>
            )}

            {state.error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            {isIdle && hasValidFiles && (
              <Button onClick={handleSubmit} className="w-full">
                번역 시작 ({validCount}장)
              </Button>
            )}

            {isValidating && (
              <Button disabled className="w-full">
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                검증 중...
              </Button>
            )}

            {isUploading && (
              <Button disabled className="w-full">
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                업로드 중...
              </Button>
            )}

            {isCreatingBatch && (
              <Button disabled className="w-full">
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                배치 생성 중...
              </Button>
            )}

            {isError && (
              <div className="mt-6 flex justify-center gap-3">
                <Button variant="outline" onClick={handleReset}>
                  처음으로
                </Button>
                {state.batchId && (
                  <Button onClick={() => void navigate(`/batch/${state.batchId}`)}>
                    결과 확인
                  </Button>
                )}
              </div>
            )}

            <p className="mt-4 text-center text-xs text-muted-foreground">
              작업은 세션 동안만 유지됩니다. 다운로드 전 페이지를 닫으면 결과가 사라집니다.
              <br />첫 요청 시 서버 준비로 시간이 걸릴 수 있습니다.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
