import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../client";
import { eraseRegion, getTranslate, uploadImage } from "../translate";

vi.mock("../client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockPost = vi.spyOn(api, "post");
const mockGet = vi.spyOn(api, "get");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("uploadImage", () => {
  it("파일을 FormData로 감싸서 업로드한다", async () => {
    const uploadResponse = {
      uploadId: "upload-1",
      imageUrl: "https://example.com/image.png",
      filename: "test.png",
      contentType: "image/png",
      size: 1024,
      createdAt: "2026-02-19T00:00:00Z",
    };
    mockPost.mockResolvedValue({ data: uploadResponse });

    const file = new File(["test"], "test.png", { type: "image/png" });
    const result = await uploadImage(file);

    expect(mockPost).toHaveBeenCalledWith("/upload", expect.any(FormData));
    expect(result).toEqual(uploadResponse);
  });
});

describe("getTranslate", () => {
  it("translateId로 번역 상태를 조회한다", async () => {
    const translateResponse = {
      translateId: "translate-1",
      status: "completed" as const,
      uploadId: "upload-1",
      sourceLanguage: "ko",
      targetLanguage: "en",
      originalUrl: "https://example.com/original.png",
      resultUrl: "https://example.com/result.png",
      createdAt: "2026-02-19T00:00:00Z",
      completedAt: "2026-02-19T00:01:00Z",
      errorMessage: null,
    };
    mockGet.mockResolvedValue({ data: translateResponse });

    const result = await getTranslate("translate-1");

    expect(mockGet).toHaveBeenCalledWith("/translate/translate-1");
    expect(result).toEqual(translateResponse);
  });
});

describe("eraseRegion", () => {
  it("sourceImage가 있으면 요청 body에 포함한다", async () => {
    const eraseResponse = { resultImage: "data:image/png;base64,abc" };
    mockPost.mockResolvedValue({ data: eraseResponse });

    const result = await eraseRegion(
      "translate-1",
      "data:image/png;base64,mask",
      "data:image/png;base64,source",
    );

    expect(mockPost).toHaveBeenCalledWith("/erase", {
      translateId: "translate-1",
      maskImage: "data:image/png;base64,mask",
      sourceImage: "data:image/png;base64,source",
    });
    expect(result).toEqual(eraseResponse);
  });

  it("sourceImage가 null이면 요청 body에서 제외한다", async () => {
    const eraseResponse = { resultImage: "data:image/png;base64,def" };
    mockPost.mockResolvedValue({ data: eraseResponse });

    await eraseRegion("translate-1", "data:image/png;base64,mask", null);

    expect(mockPost).toHaveBeenCalledWith("/erase", {
      translateId: "translate-1",
      maskImage: "data:image/png;base64,mask",
    });
  });
});
