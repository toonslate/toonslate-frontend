import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { FileEntry } from "@/pages/translate/translatePageReducer";

import { FileList } from "../FileList";

afterEach(cleanup);

const createEntry = (overrides: Partial<FileEntry> = {}): FileEntry => ({
  id: "entry-1",
  file: new File([new ArrayBuffer(2048)], "test-image.jpg", { type: "image/jpeg" }),
  previewUrl: "blob:http://localhost/preview-1",
  validation: { valid: true, errors: [] },
  uploadError: null,
  ...overrides,
});

describe("FileList", () => {
  it("entries가 비어있으면 아무것도 렌더링하지 않는다", () => {
    const { container } = render(<FileList entries={[]} disabled={false} onRemove={vi.fn()} />);

    expect(container.innerHTML).toBe("");
  });

  it('validation이 null이면 "검증 중" 뱃지를 표시한다', () => {
    const entries = [createEntry({ validation: null })];
    render(<FileList entries={entries} disabled={false} onRemove={vi.fn()} />);

    expect(screen.getByText("검증 중")).toBeDefined();
  });

  it('유효성 검증 실패 시 "실패" 뱃지를 표시한다', () => {
    const entries = [
      createEntry({
        validation: { valid: false, errors: ["FILE_SIZE"] },
      }),
    ];
    render(<FileList entries={entries} disabled={false} onRemove={vi.fn()} />);

    expect(screen.getByText("실패")).toBeDefined();
  });

  it("삭제 버튼 클릭 시 onRemove를 호출한다", () => {
    const onRemove = vi.fn();
    const entries = [createEntry({ id: "entry-42" })];
    render(<FileList entries={entries} disabled={false} onRemove={onRemove} />);

    const removeButton = screen.getByRole("button");
    fireEvent.click(removeButton);

    expect(onRemove).toHaveBeenCalledWith("entry-42");
  });
});
