import { Link, useParams } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";

import type { BatchImage } from "@/api";
import { getApiErrorMessage } from "@/api";
import { Header } from "@/components/Header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { batchQueries } from "@/queries/batchQueries";

const StatusBanner = ({ status, images }: { status: string; images: BatchImage[] }) => {
  const completed = images.filter((img) => img.status === "completed").length;
  const total = images.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  switch (status) {
    case "processing":
      return (
        <div className="mb-6 space-y-2">
          <p className="text-sm font-medium">
            번역 중... ({completed}/{total} 완료)
          </p>
          <Progress value={progress} />
        </div>
      );
    case "completed":
      return (
        <div className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          모든 이미지 번역이 완료되었습니다
        </div>
      );
    case "partial_failure":
      return (
        <div className="mb-6 rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          일부 이미지 번역에 실패했습니다
        </div>
      );
    case "failed":
      return (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
          모든 이미지 번역에 실패했습니다
        </div>
      );
    default:
      return null;
  }
};

const ImageCard = ({ image }: { image: BatchImage }) => {
  const isProcessing = image.status === "pending" || image.status === "processing";
  const isCompleted = image.status === "completed";
  const isFailed = image.status === "failed";

  return (
    <Card>
      <CardContent className="p-3">
        <div className="mb-2 aspect-[3/4] overflow-hidden rounded-lg bg-muted">
          {isProcessing && (
            <div className="flex h-full items-center justify-center">
              <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent text-muted-foreground" />
            </div>
          )}
          {isCompleted && image.resultUrl && (
            <img
              src={image.resultUrl}
              alt={`결과 ${image.orderIndex + 1}`}
              className="h-full w-full object-cover"
            />
          )}
          {isFailed && (
            <div className="flex h-full items-center justify-center px-2 text-center">
              <p className="text-xs text-destructive">{image.errorMessage ?? "번역 실패"}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Badge variant={isCompleted ? "default" : isFailed ? "destructive" : "secondary"}>
            {isProcessing && "처리 중"}
            {isCompleted && "완료"}
            {isFailed && "실패"}
          </Badge>

          {isCompleted && (
            <Link to={`/retouch/${image.translateId}`}>
              <Button size="sm" variant="outline">
                리터치
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const ResultsPage = () => {
  const { batchId } = useParams<{ batchId: string }>();

  const { data: batch, isLoading, isError, error } = useQuery(batchQueries.detail(batchId ?? null));

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />

      <main className="mx-auto max-w-3xl px-6 py-12">
        {isLoading && (
          <div className="flex justify-center py-12">
            <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-muted-foreground" />
          </div>
        )}

        {isError && (
          <div className="space-y-4 py-12">
            <Alert variant="destructive">
              <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
            </Alert>
            <div className="flex justify-center">
              <Link to="/translate">
                <Button variant="outline">처음으로</Button>
              </Link>
            </div>
          </div>
        )}

        {batch && (
          <>
            <StatusBanner status={batch.status} images={batch.images} />

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[...batch.images]
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((image) => (
                  <ImageCard key={image.translateId} image={image} />
                ))}
            </div>

            <div className="mt-8 flex justify-center">
              <Link to="/translate">
                <Button variant="outline">처음으로</Button>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
