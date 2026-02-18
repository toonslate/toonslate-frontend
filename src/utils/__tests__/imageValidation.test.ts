import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ACCEPTED_TYPES,
  MAX_ASPECT_RATIO,
  MAX_FILE_SIZE,
  MAX_PIXELS,
  getValidationErrorMessage,
  validateImageFile,
} from "../imageValidation";

const createFile = (options: { size?: number; type?: string; name?: string } = {}): File => {
  const { size = 1024, type = "image/jpeg", name = "test.jpg" } = options;
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type });
};

const mockImageLoad = (width: number, height: number): void => {
  vi.spyOn(globalThis, "Image" as never, "get").mockReturnValue(function (this: HTMLImageElement) {
    Object.defineProperty(this, "width", { get: () => width });
    Object.defineProperty(this, "height", { get: () => height });
    Object.defineProperty(this, "src", {
      set: () => {
        setTimeout(() => {
          this.onload?.(new Event("load"));
        });
      },
    });
  } as unknown as never);
};

const mockImageError = (): void => {
  vi.spyOn(globalThis, "Image" as never, "get").mockReturnValue(function (this: HTMLImageElement) {
    Object.defineProperty(this, "src", {
      set: () => {
        setTimeout(() => {
          this.onerror?.("load error");
        });
      },
    });
  } as unknown as never);
};

describe("상수", () => {
  it("MAX_FILE_SIZE는 5MB", () => {
    expect(MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
  });

  it("ACCEPTED_TYPES는 JPEG, PNG", () => {
    expect(ACCEPTED_TYPES).toEqual(["image/jpeg", "image/png"]);
  });

  it("MAX_PIXELS는 3MP", () => {
    expect(MAX_PIXELS).toBe(3_000_000);
  });

  it("MAX_ASPECT_RATIO는 3.0", () => {
    expect(MAX_ASPECT_RATIO).toBe(3.0);
  });
});

describe("validateImageFile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("유효한 파일은 통과한다", async () => {
    mockImageLoad(1000, 1500);
    const file = createFile({ size: 1024, type: "image/jpeg" });

    const result = await validateImageFile(file);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.dimensions).toEqual({ width: 1000, height: 1500 });
  });

  it("PNG 파일도 통과한다", async () => {
    mockImageLoad(800, 600);
    const file = createFile({ type: "image/png", name: "test.png" });

    const result = await validateImageFile(file);

    expect(result.valid).toBe(true);
  });

  it("파일 크기 초과 시 FILE_SIZE 에러", async () => {
    const file = createFile({ size: MAX_FILE_SIZE + 1 });

    const result = await validateImageFile(file);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("FILE_SIZE");
  });

  it("지원하지 않는 포맷은 FILE_TYPE 에러", async () => {
    const file = createFile({ type: "image/webp", name: "test.webp" });

    const result = await validateImageFile(file);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("FILE_TYPE");
  });

  it("동기 검증 실패 시 비동기 검증(이미지 로드)을 스킵한다", async () => {
    const imageSpy = vi.spyOn(globalThis, "Image" as never, "get");
    const file = createFile({ size: MAX_FILE_SIZE + 1, type: "image/gif" });

    const result = await validateImageFile(file);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("FILE_SIZE");
    expect(result.errors).toContain("FILE_TYPE");
    expect(result.dimensions).toBeUndefined();
    expect(imageSpy).not.toHaveBeenCalled();
  });

  it("총 픽셀수 초과 시 PIXEL_COUNT 에러", async () => {
    mockImageLoad(2000, 2000); // 4MP > 3MP
    const file = createFile();

    const result = await validateImageFile(file);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("PIXEL_COUNT");
  });

  it("비율 초과 시 ASPECT_RATIO 에러", async () => {
    mockImageLoad(600, 1900); // 1900/600 = 3.17 > 3.0
    const file = createFile();

    const result = await validateImageFile(file);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("ASPECT_RATIO");
  });

  it("픽셀수와 비율 모두 초과 시 두 에러 모두 반환", async () => {
    mockImageLoad(1000, 4000); // 4MP > 3MP, 4000/1000 = 4.0 > 3.0
    const file = createFile();

    const result = await validateImageFile(file);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("PIXEL_COUNT");
    expect(result.errors).toContain("ASPECT_RATIO");
  });

  it("경계값: 정확히 5MB는 통과", async () => {
    mockImageLoad(800, 600);
    const file = createFile({ size: MAX_FILE_SIZE });

    const result = await validateImageFile(file);

    expect(result.valid).toBe(true);
  });

  it("경계값: 정확히 3MP는 통과", async () => {
    mockImageLoad(1500, 2000); // 3MP
    const file = createFile();

    const result = await validateImageFile(file);

    expect(result.valid).toBe(true);
  });

  it("경계값: 정확히 비율 3.0은 통과", async () => {
    mockImageLoad(600, 1800); // 1800/600 = 3.0
    const file = createFile();

    const result = await validateImageFile(file);

    expect(result.valid).toBe(true);
  });

  it("이미지 로드 실패 시 에러를 던진다", async () => {
    mockImageError();
    const file = createFile();

    await expect(validateImageFile(file)).rejects.toThrow();
  });

  it("비동기 검증 시 object URL을 생성하고 해제한다", async () => {
    mockImageLoad(800, 600);
    const createSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const file = createFile();

    await validateImageFile(file);

    expect(createSpy).toHaveBeenCalledOnce();
    expect(revokeSpy).toHaveBeenCalledWith("blob:mock");
  });
});

describe("getValidationErrorMessage", () => {
  it("FILE_SIZE 에러 메시지", () => {
    expect(getValidationErrorMessage("FILE_SIZE")).toBe("파일 크기는 5MB 이하여야 합니다");
  });

  it("FILE_TYPE 에러 메시지", () => {
    expect(getValidationErrorMessage("FILE_TYPE")).toBe("JPG, PNG 형식만 지원합니다");
  });

  it("PIXEL_COUNT 에러 메시지", () => {
    expect(getValidationErrorMessage("PIXEL_COUNT")).toBe(
      "이미지 해상도가 너무 높습니다 (최대 3MP)",
    );
  });

  it("ASPECT_RATIO 에러 메시지", () => {
    expect(getValidationErrorMessage("ASPECT_RATIO")).toBe(
      "세로가 너무 긴 이미지입니다 (비율 3:1 이하)",
    );
  });
});
