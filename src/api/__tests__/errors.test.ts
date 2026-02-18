import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";

import { getApiErrorMessage } from "../errors";

const createResponseError = (status: number, data: unknown): AxiosError => {
  const error = new AxiosError("Request failed");
  error.response = {
    status,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data,
  };
  return error;
};

const createNetworkError = (code: string): AxiosError => new AxiosError("Request failed", code);

describe("getApiErrorMessage", () => {
  it("detail 객체의 message를 반환한다", () => {
    const error = createResponseError(400, {
      detail: { code: "INVALID_UPLOAD_ID", message: "유효하지 않은 업로드 ID" },
    });

    expect(getApiErrorMessage(error)).toBe("유효하지 않은 업로드 ID");
  });

  it("detail이 문자열이면 그대로 반환한다", () => {
    const error = createResponseError(500, { detail: "Internal server error" });

    expect(getApiErrorMessage(error)).toBe("Internal server error");
  });

  it("네트워크 에러 시 연결 실패 메시지를 반환한다", () => {
    const error = createNetworkError("ERR_NETWORK");

    expect(getApiErrorMessage(error)).toBe("서버에 연결할 수 없습니다");
  });

  it("타임아웃 시 시간 초과 메시지를 반환한다", () => {
    const error = createNetworkError("ECONNABORTED");

    expect(getApiErrorMessage(error)).toBe("요청 시간이 초과되었습니다");
  });

  it("detail 객체에 message가 없으면 폴백 메시지를 반환한다", () => {
    const error = createResponseError(400, { detail: { code: "UNKNOWN" } });

    expect(getApiErrorMessage(error)).toBe("알 수 없는 오류가 발생했습니다");
  });

  it("응답은 있지만 detail이 없으면 폴백 메시지를 반환한다", () => {
    const error = createResponseError(500, {});

    expect(getApiErrorMessage(error)).toBe("알 수 없는 오류가 발생했습니다");
  });

  it("AxiosError가 아닌 에러는 폴백 메시지를 반환한다", () => {
    expect(getApiErrorMessage(new Error("something"))).toBe("알 수 없는 오류가 발생했습니다");
  });

  it("문자열이 전달되면 폴백 메시지를 반환한다", () => {
    expect(getApiErrorMessage("unexpected")).toBe("알 수 없는 오류가 발생했습니다");
  });

  it("null이 전달되면 폴백 메시지를 반환한다", () => {
    expect(getApiErrorMessage(null)).toBe("알 수 없는 오류가 발생했습니다");
  });
});
