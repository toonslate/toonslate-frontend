// TODO: Layout 컴포넌트 분리 (Header 공통화)
// TODO: 모바일 접속 시 안내 페이지 표시 (캔버스 에디터 미지원)
import { useState } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";

import { createTranslate, uploadImage } from "@/api/client";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { TranslateResult } from "@/components/TranslateResult";
import { UploadZone } from "@/components/UploadZone";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useObjectUrl } from "@/hooks/useObjectUrl";
import { translateQueries } from "@/queries/translateQueries";

export const TranslatePage = () => {
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [translateId, setTranslateId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const previewUrl = useObjectUrl(selectedFile);

  const uploadMutation = useMutation({
    mutationFn: uploadImage,
    onSuccess: (data) => {
      setUploadId(data.uploadId);
      setFilename(data.filename);
    },
  });

  const translateMutation = useMutation({
    mutationFn: (uploadId: string) => createTranslate(uploadId),
    onSuccess: (data) => {
      setTranslateId(data.translateId);
    },
  });

  const { data: translate, isFetching } = useQuery(translateQueries.detail(translateId));

  const handleFileSelect = (file: File) => {
    setUploadId(null);
    setFilename(null);
    setTranslateId(null);
    setSelectedFile(file);
    uploadMutation.reset();
    translateMutation.reset();
    uploadMutation.mutate(file);
  };

  const handleTranslate = () => {
    if (!uploadId) return;
    translateMutation.mutate(uploadId);
  };

  // TODO: AbortController로 진행 중인 업로드 요청도 취소 (현재는 상태만 초기화)
  const handleReset = () => {
    setUploadId(null);
    setFilename(null);
    setTranslateId(null);
    setSelectedFile(null);
    uploadMutation.reset();
    translateMutation.reset();
  };

  const isProcessing = translate?.status === "pending" || translate?.status === "processing";
  const isCompleted = translate?.status === "completed";
  const isFailed = translate?.status === "failed";
  const isDone = isCompleted || isFailed;

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />

      <main className="mx-auto max-w-xl px-6 py-12">
        <HeroSection />

        <Card>
          <CardContent className="pt-6">
            <UploadZone
              filename={filename}
              previewUrl={previewUrl}
              isUploading={uploadMutation.isPending}
              hasUpload={!!uploadId}
              onFileSelect={handleFileSelect}
              onClear={handleReset}
            />

            {uploadMutation.isError ? (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{uploadMutation.error.message}</AlertDescription>
              </Alert>
            ) : null}

            {translateMutation.isError ? (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{translateMutation.error.message}</AlertDescription>
              </Alert>
            ) : null}

            {isFailed && translate?.errorMessage ? (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{translate.errorMessage}</AlertDescription>
              </Alert>
            ) : null}

            {uploadId && !translateId ? (
              <Button
                onClick={handleTranslate}
                disabled={translateMutation.isPending}
                className="w-full"
              >
                {translateMutation.isPending ? "작업 생성 중..." : "번역 시작"}
              </Button>
            ) : null}

            {translateId && !translate && isFetching ? (
              <Button disabled className="w-full">
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                상태 확인 중...
              </Button>
            ) : null}

            {isProcessing ? (
              <Button disabled className="w-full">
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                번역 중... ({translate?.status})
              </Button>
            ) : null}

            {isCompleted && translate?.resultUrl ? (
              <TranslateResult resultUrl={translate.resultUrl} />
            ) : null}

            {isDone ? (
              <div className="mt-6 flex justify-center">
                <Button variant="outline" onClick={handleReset}>
                  처음으로
                </Button>
              </div>
            ) : null}

            <p className="mt-4 text-center text-xs text-muted-foreground">
              ⚠️ 작업은 세션 동안만 유지됩니다. 다운로드 전 페이지를 닫으면 결과가 사라집니다.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
