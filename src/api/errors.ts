import axios from "axios";

const FALLBACK_MESSAGE = "알 수 없는 오류가 발생했습니다";

interface ApiErrorDetail {
  code: string;
  message: string;
}

const isApiErrorDetail = (value: unknown): value is ApiErrorDetail =>
  typeof value === "object" &&
  value !== null &&
  "message" in value &&
  typeof (value as ApiErrorDetail).message === "string";

export const getApiErrorMessage = (error: unknown): string => {
  if (!axios.isAxiosError(error)) {
    return FALLBACK_MESSAGE;
  }

  if (error.code === "ECONNABORTED") {
    return "요청 시간이 초과되었습니다";
  }

  if (!error.response) {
    return "서버에 연결할 수 없습니다";
  }

  const detail: unknown = (error.response.data as Record<string, unknown>)?.detail;

  if (isApiErrorDetail(detail)) {
    return detail.message;
  }

  if (typeof detail === "string") {
    return detail;
  }

  return FALLBACK_MESSAGE;
};
