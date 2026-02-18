import { api } from "./client";

type ImageStatus = "pending" | "processing" | "completed" | "failed";
type BatchStatus = "processing" | "completed" | "partial_failure" | "failed";

interface BatchImageEntryDto {
  orderIndex: number;
  uploadId: string;
  translateId: string;
  status: ImageStatus;
  originalUrl: string | null;
  resultUrl: string | null;
  errorMessage: string | null;
}

interface BatchResponseDto {
  batchId: string;
  status: BatchStatus;
  images: BatchImageEntryDto[];
  sourceLanguage: string;
  targetLanguage: string;
  createdAt: string;
}

export interface BatchImage {
  orderIndex: number;
  uploadId: string;
  translateId: string;
  status: ImageStatus;
  originalUrl: string | null;
  resultUrl: string | null;
  errorMessage: string | null;
}

export interface BatchResult {
  batchId: string;
  status: BatchStatus;
  images: BatchImage[];
  sourceLanguage: string;
  targetLanguage: string;
  createdAt: string;
}

const mapBatchResponse = (dto: BatchResponseDto): BatchResult => ({
  batchId: dto.batchId,
  status: dto.status,
  images: dto.images.map((img) => ({
    orderIndex: img.orderIndex,
    uploadId: img.uploadId,
    translateId: img.translateId,
    status: img.status,
    originalUrl: img.originalUrl,
    resultUrl: img.resultUrl,
    errorMessage: img.errorMessage,
  })),
  sourceLanguage: dto.sourceLanguage,
  targetLanguage: dto.targetLanguage,
  createdAt: dto.createdAt,
});

export const createBatch = async (
  uploadIds: string[],
  sourceLanguage = "ko",
  targetLanguage = "en",
): Promise<BatchResult> => {
  const { data } = await api.post<BatchResponseDto>("/batch", {
    uploadIds,
    sourceLanguage,
    targetLanguage,
  });
  return mapBatchResponse(data);
};

export const getBatch = async (batchId: string): Promise<BatchResult> => {
  const { data } = await api.get<BatchResponseDto>(`/batch/${batchId}`);
  return mapBatchResponse(data);
};
