import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { eraseRegion } from "@/api";

import { useEraseAction } from "../useEraseAction";

vi.mock("@/api", () => ({
  eraseRegion: vi.fn(),
}));

const createQueryWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) =>
    QueryClientProvider({ client: queryClient, children });
};

describe("useEraseAction", () => {
  describe("erase 호출", () => {
    it("eraseRegion을 올바른 파라미터로 호출한다", async () => {
      vi.mocked(eraseRegion).mockResolvedValue({
        resultImage: "resultBase64",
      });

      const { result } = renderHook(
        () =>
          useEraseAction({
            translateId: "test-id",
            onSuccess: vi.fn(),
          }),
        { wrapper: createQueryWrapper() },
      );

      act(() => {
        result.current.erase({
          maskBase64: "maskData",
          sourceBase64: "sourceData",
        });
      });

      await waitFor(() => {
        expect(eraseRegion).toHaveBeenCalledWith("test-id", "maskData", "sourceData");
      });
    });

    it("성공 시 onSuccess 콜백이 resultImage를 받는다", async () => {
      vi.mocked(eraseRegion).mockResolvedValue({
        resultImage: "resultBase64",
      });
      const onSuccess = vi.fn();

      const { result } = renderHook(
        () =>
          useEraseAction({
            translateId: "test-id",
            onSuccess,
          }),
        { wrapper: createQueryWrapper() },
      );

      act(() => {
        result.current.erase({
          maskBase64: "maskData",
          sourceBase64: null,
        });
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith("resultBase64");
      });
    });

    it("실패 시 eraseError에 에러 메시지가 설정된다", async () => {
      vi.mocked(eraseRegion).mockRejectedValue(new Error("네트워크 오류"));

      const { result } = renderHook(
        () =>
          useEraseAction({
            translateId: "test-id",
            onSuccess: vi.fn(),
          }),
        { wrapper: createQueryWrapper() },
      );

      act(() => {
        result.current.erase({
          maskBase64: "maskData",
          sourceBase64: null,
        });
      });

      await waitFor(() => {
        expect(result.current.eraseError).toBe("네트워크 오류");
      });
    });

    it("Error 인스턴스가 아닌 에러는 기본 메시지를 반환한다", async () => {
      vi.mocked(eraseRegion).mockRejectedValue("unknown error");

      const { result } = renderHook(
        () =>
          useEraseAction({
            translateId: "test-id",
            onSuccess: vi.fn(),
          }),
        { wrapper: createQueryWrapper() },
      );

      act(() => {
        result.current.erase({
          maskBase64: "maskData",
          sourceBase64: null,
        });
      });

      await waitFor(() => {
        expect(result.current.eraseError).toBe("알 수 없는 오류가 발생했습니다.");
      });
    });
  });
});
