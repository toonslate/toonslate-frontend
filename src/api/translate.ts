import { api } from "./client";

export interface UploadResponse {
  uploadId: string;
  imageUrl: string;
  filename: string;
  contentType: string;
  size: number;
  createdAt: string;
}

export interface TranslateResponse {
  translateId: string;
  status: "pending" | "processing" | "completed" | "failed";
  uploadId: string;
  sourceLanguage: string;
  targetLanguage: string;
  originalUrl: string | null;
  resultUrl: string | null;
  createdAt: string;
  completedAt: string | null;
  errorMessage: string | null;
}

export interface EraseResponse {
  resultImage: string;
}

export const uploadImage = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<UploadResponse>("/upload", formData);
  return data;
};

export const createTranslate = async (
  uploadId: string,
  sourceLanguage = "ko",
  targetLanguage = "en",
): Promise<TranslateResponse> => {
  const { data } = await api.post<TranslateResponse>("/translate", {
    uploadId,
    sourceLanguage,
    targetLanguage,
  });
  return data;
};

export const getTranslate = async (translateId: string): Promise<TranslateResponse> => {
  const { data } = await api.get<TranslateResponse>(`/translate/${translateId}`);
  return data;
};

export const eraseRegion = async (
  translateId: string,
  maskImage: string,
  sourceImage: string | null,
): Promise<EraseResponse> => {
  const { data } = await api.post<EraseResponse>("/erase", {
    translateId,
    maskImage,
    ...(sourceImage !== null && { sourceImage }),
  });
  return data;
};
