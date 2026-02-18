import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BrushSizeSlider } from "../BrushSizeSlider";
import { RetouchToolbar } from "../RetouchToolbar";

afterEach(cleanup);

const defaultToolbarProps = {
  isErasing: false,
  canUndo: true,
  canRedo: true,
  onClearMask: vi.fn(),
  onErase: vi.fn(),
  onUndo: vi.fn(),
  onRedo: vi.fn(),
  onDownload: vi.fn(),
};

describe("RetouchToolbar", () => {
  it('isErasing이 true이면 "처리 중..."을 표시한다', () => {
    render(<RetouchToolbar {...defaultToolbarProps} isErasing={true} />);

    expect(screen.getByText("처리 중...")).toBeDefined();
    expect(screen.queryByText("제거")).toBeNull();
  });

  it("버튼 클릭 시 콜백을 호출한다", () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    const onClearMask = vi.fn();
    const onErase = vi.fn();
    const onDownload = vi.fn();
    render(
      <RetouchToolbar
        {...defaultToolbarProps}
        onUndo={onUndo}
        onRedo={onRedo}
        onClearMask={onClearMask}
        onErase={onErase}
        onDownload={onDownload}
      />,
    );

    fireEvent.click(screen.getByText("실행 취소"));
    fireEvent.click(screen.getByText("다시 실행"));
    fireEvent.click(screen.getByText("마킹 초기화"));
    fireEvent.click(screen.getByText("제거"));
    fireEvent.click(screen.getByText("다운로드"));

    expect(onUndo).toHaveBeenCalledOnce();
    expect(onRedo).toHaveBeenCalledOnce();
    expect(onClearMask).toHaveBeenCalledOnce();
    expect(onErase).toHaveBeenCalledOnce();
    expect(onDownload).toHaveBeenCalledOnce();
  });

  it("isErasing이 true이면 버튼들이 비활성화된다", () => {
    render(<RetouchToolbar {...defaultToolbarProps} isErasing={true} />);

    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => {
      expect((button as HTMLButtonElement).disabled).toBe(true);
    });
  });
});

describe("BrushSizeSlider", () => {
  it("슬라이더 변경 시 onChange를 호출한다", () => {
    const onChange = vi.fn();
    render(<BrushSizeSlider brushSize={20} min={5} max={50} onChange={onChange} />);

    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "35" } });

    expect(onChange).toHaveBeenCalledWith(35);
  });
});
