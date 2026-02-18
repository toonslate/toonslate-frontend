import { MemoryRouter } from "react-router-dom";
import { useParams } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { BatchResult } from "@/api";

import { ResultsPage } from "../ResultsPage";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useParams: vi.fn() };
});

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return { ...actual, useQuery: vi.fn() };
});

vi.mock("@/api", async () => {
  const actual = await vi.importActual("@/api");
  return { ...actual, getApiErrorMessage: (err: unknown) => (err as Error)?.message ?? "에러" };
});

afterEach(cleanup);

const mockUseParams = vi.mocked(useParams);
const mockUseQuery = vi.mocked(useQuery);

const renderPage = () =>
  render(
    <MemoryRouter>
      <ResultsPage />
    </MemoryRouter>,
  );

const makeImage = (
  overrides: Partial<BatchResult["images"][number]> = {},
): BatchResult["images"][number] => ({
  orderIndex: 0,
  uploadId: "upload-1",
  translateId: "translate-1",
  status: "completed",
  originalUrl: "http://example.com/original.png",
  resultUrl: "http://example.com/result.png",
  errorMessage: null,
  ...overrides,
});

const makeBatch = (overrides: Partial<BatchResult> = {}): BatchResult => ({
  batchId: "batch-1",
  status: "completed",
  images: [makeImage()],
  sourceLanguage: "ko",
  targetLanguage: "en",
  createdAt: "2026-02-19T00:00:00Z",
  ...overrides,
});

const mockQueryReturn = (partial: Partial<ReturnType<typeof useQuery>>) =>
  mockUseQuery.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    isPending: false,
    isSuccess: false,
    isFetching: false,
    isLoadingError: false,
    isRefetchError: false,
    isRefetching: false,
    isPlaceholderData: false,
    isStale: false,
    status: "pending",
    fetchStatus: "idle",
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    isFetched: false,
    isFetchedAfterMount: false,
    isInitialLoading: false,
    refetch: vi.fn(),
    promise: Promise.resolve(undefined as never),
    ...partial,
  } as ReturnType<typeof useQuery>);

describe("ResultsPage", () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ batchId: "batch-1" });
  });

  it("로딩 중일 때 스피너를 표시한다", () => {
    mockQueryReturn({
      isLoading: true,
      isPending: true,
      status: "pending",
      fetchStatus: "fetching",
    });

    renderPage();

    expect(screen.getByRole("main").querySelector(".animate-spin")).not.toBeNull();
  });

  it("에러 시 에러 메시지와 '처음으로' 버튼을 표시한다", () => {
    mockQueryReturn({
      isError: true,
      error: new Error("서버 오류 발생"),
      status: "error",
    });

    renderPage();

    expect(screen.getByText("서버 오류 발생")).toBeDefined();
    const backButton = screen.getByRole("link", { name: "처음으로" });
    expect(backButton.getAttribute("href")).toBe("/translate");
  });

  it("완료 상태에서 성공 배너를 표시한다", () => {
    mockQueryReturn({
      data: makeBatch({ status: "completed" }),
      isSuccess: true,
      status: "success",
    });

    renderPage();

    expect(screen.getByText("모든 이미지 번역이 완료되었습니다")).toBeDefined();
  });

  it("processing 상태에서 진행 상황을 표시한다", () => {
    mockQueryReturn({
      data: makeBatch({
        status: "processing",
        images: [
          makeImage({ orderIndex: 0, status: "completed", translateId: "t-1" }),
          makeImage({ orderIndex: 1, status: "processing", translateId: "t-2" }),
          makeImage({ orderIndex: 2, status: "pending", translateId: "t-3" }),
        ],
      }),
      isSuccess: true,
      status: "success",
    });

    renderPage();

    expect(screen.getByText("번역 중... (1/3 완료)")).toBeDefined();
  });

  it("완료된 이미지에 '리터치' 버튼을 표시한다", () => {
    mockQueryReturn({
      data: makeBatch({
        images: [makeImage({ translateId: "t-abc", status: "completed" })],
      }),
      isSuccess: true,
      status: "success",
    });

    renderPage();

    const retouchLink = screen.getByRole("link", { name: "리터치" });
    expect(retouchLink.getAttribute("href")).toBe("/retouch/t-abc");
  });

  it("실패한 이미지에 에러 메시지를 표시한다", () => {
    mockQueryReturn({
      data: makeBatch({
        status: "partial_failure",
        images: [
          makeImage({
            orderIndex: 0,
            status: "failed",
            translateId: "t-1",
            errorMessage: "OCR 실패",
            resultUrl: null,
          }),
        ],
      }),
      isSuccess: true,
      status: "success",
    });

    renderPage();

    expect(screen.getByText("OCR 실패")).toBeDefined();
    expect(screen.getByText("실패")).toBeDefined();
  });

  it("partial_failure 상태에서 경고 배너를 표시한다", () => {
    mockQueryReturn({
      data: makeBatch({ status: "partial_failure" }),
      isSuccess: true,
      status: "success",
    });

    renderPage();

    expect(screen.getByText("일부 이미지 번역에 실패했습니다")).toBeDefined();
  });

  it("failed 상태에서 실패 배너를 표시한다", () => {
    mockQueryReturn({
      data: makeBatch({ status: "failed" }),
      isSuccess: true,
      status: "success",
    });

    renderPage();

    expect(screen.getByText("모든 이미지 번역에 실패했습니다")).toBeDefined();
  });
});
