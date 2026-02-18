import { MemoryRouter } from "react-router-dom";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TranslatePage } from "../TranslatePage";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: vi.fn(() => vi.fn()) };
});

vi.mock("@/api", () => ({
  uploadImage: vi.fn(),
  createBatch: vi.fn(),
  getApiErrorMessage: vi.fn(() => "에러 메시지"),
}));

vi.mock("@/utils/imageValidation", () => ({
  validateImageFile: vi.fn(() =>
    Promise.resolve({ valid: true, errors: [], dimensions: { width: 800, height: 600 } }),
  ),
  getValidationErrorMessage: vi.fn((code: string) => code),
}));

let uuidCounter = 0;

beforeEach(() => {
  uuidCounter = 0;
  vi.stubGlobal(
    "crypto",
    Object.assign({}, globalThis.crypto, {
      randomUUID: () => `test-uuid-${uuidCounter++}`,
    }),
  );
  vi.stubGlobal("URL", {
    ...globalThis.URL,
    createObjectURL: () => "blob:test",
    revokeObjectURL: vi.fn(),
  });
});

afterEach(cleanup);

const renderPage = () =>
  render(
    <MemoryRouter>
      <TranslatePage />
    </MemoryRouter>,
  );

const createTestFile = (name: string) => new File(["dummy"], name, { type: "image/png" });

const addFilesToInput = (input: HTMLInputElement, files: File[]) => {
  Object.defineProperty(input, "files", {
    value: files,
    writable: true,
    configurable: true,
  });

  fireEvent.change(input);
};

describe("TranslatePage", () => {
  it("초기 상태에서 번역 시작 버튼이 없다", () => {
    renderPage();

    expect(screen.queryByRole("button", { name: /번역 시작/ })).toBeNull();
  });

  it("파일 추가 후 번역 시작 버튼이 나타난다", async () => {
    renderPage();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    addFilesToInput(input, [createTestFile("test.png")]);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /번역 시작 \(1장\)/ })).toBeDefined();
    });
  });

  it("파일 추가 후 제거하면 목록에서 사라진다", async () => {
    renderPage();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    addFilesToInput(input, [createTestFile("remove-me.png")]);

    await waitFor(() => {
      expect(screen.getByText("remove-me.png")).toBeDefined();
    });

    const removeButtons = screen.getAllByRole("button").filter((btn) => {
      return btn.querySelector("svg path[d='M6 18L18 6M6 6l12 12']");
    });
    fireEvent.click(removeButtons[0]);

    expect(screen.queryByText("remove-me.png")).toBeNull();
  });

  it("용량 초과 시 경고 메시지를 표시한다", async () => {
    renderPage();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const files = Array.from({ length: 11 }, (_, i) => createTestFile(`file-${i}.png`));
    addFilesToInput(input, files);

    await waitFor(() => {
      expect(screen.getByText("최대 10장까지 업로드할 수 있습니다")).toBeDefined();
    });
  });
});
