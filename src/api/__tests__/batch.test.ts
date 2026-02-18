import { beforeEach, describe, expect, it, vi } from "vitest";

import { createBatch, getBatch } from "../batch";
import { api } from "../client";

vi.mock("../client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockPost = vi.spyOn(api, "post");
const mockGet = vi.spyOn(api, "get");

const batchResponseDto = {
  batchId: "batch-1",
  status: "processing" as const,
  images: [
    {
      orderIndex: 0,
      uploadId: "upload-1",
      translateId: "translate-1",
      status: "completed" as const,
      originalUrl: "https://example.com/original.png",
      resultUrl: "https://example.com/result.png",
      errorMessage: null,
    },
    {
      orderIndex: 1,
      uploadId: "upload-2",
      translateId: "translate-2",
      status: "pending" as const,
      originalUrl: null,
      resultUrl: null,
      errorMessage: null,
    },
  ],
  sourceLanguage: "ko",
  targetLanguage: "en",
  createdAt: "2026-02-19T00:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createBatch", () => {
  it("기본 언어 설정(ko -> en)으로 배치를 생성한다", async () => {
    mockPost.mockResolvedValue({ data: batchResponseDto });

    const result = await createBatch(["upload-1", "upload-2"]);

    expect(mockPost).toHaveBeenCalledWith("/batch", {
      uploadIds: ["upload-1", "upload-2"],
      sourceLanguage: "ko",
      targetLanguage: "en",
    });
    expect(result.batchId).toBe("batch-1");
    expect(result.status).toBe("processing");
    expect(result.images).toHaveLength(2);
  });

  it("커스텀 언어 설정으로 배치를 생성한다", async () => {
    const customDto = {
      ...batchResponseDto,
      sourceLanguage: "ja",
      targetLanguage: "ko",
    };
    mockPost.mockResolvedValue({ data: customDto });

    const result = await createBatch(["upload-1"], "ja", "ko");

    expect(mockPost).toHaveBeenCalledWith("/batch", {
      uploadIds: ["upload-1"],
      sourceLanguage: "ja",
      targetLanguage: "ko",
    });
    expect(result.sourceLanguage).toBe("ja");
    expect(result.targetLanguage).toBe("ko");
  });
});

describe("getBatch", () => {
  it("batchId로 배치 결과를 조회한다", async () => {
    mockGet.mockResolvedValue({ data: batchResponseDto });

    const result = await getBatch("batch-1");

    expect(mockGet).toHaveBeenCalledWith("/batch/batch-1");
    expect(result.batchId).toBe("batch-1");
    expect(result.images).toHaveLength(2);
  });
});
