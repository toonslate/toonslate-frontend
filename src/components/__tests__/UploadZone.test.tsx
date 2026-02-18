import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UploadZone } from "../UploadZone";

afterEach(cleanup);

const createMockFile = (name = "test.jpg", size = 1024, type = "image/jpeg"): File =>
  new File([new ArrayBuffer(size)], name, { type });

describe("UploadZone", () => {
  it("파일 input 변경 시 onFilesSelect를 호출한다", () => {
    const onFilesSelect = vi.fn();
    render(<UploadZone disabled={false} onFilesSelect={onFilesSelect} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = createMockFile();
    fireEvent.change(input, { target: { files: [file] } });

    expect(onFilesSelect).toHaveBeenCalledWith([file]);
  });

  it("드롭 이벤트 시 onFilesSelect를 호출한다", () => {
    const onFilesSelect = vi.fn();
    render(<UploadZone disabled={false} onFilesSelect={onFilesSelect} />);

    const dropZone = screen.getByText("이미지를 드래그하거나 클릭").parentElement!;
    const file = createMockFile();
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    expect(onFilesSelect).toHaveBeenCalledWith([file]);
  });

  it("disabled 상태에서 드롭해도 onFilesSelect를 호출하지 않는다", () => {
    const onFilesSelect = vi.fn();
    render(<UploadZone disabled={true} onFilesSelect={onFilesSelect} />);

    const dropZone = screen.getByText("이미지를 드래그하거나 클릭").parentElement!;
    const file = createMockFile();
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    expect(onFilesSelect).not.toHaveBeenCalled();
  });
});
