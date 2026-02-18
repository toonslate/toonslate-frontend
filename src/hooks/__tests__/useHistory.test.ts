import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useHistory } from "../useHistory";

describe("useHistory", () => {
  describe("push", () => {
    it("스냅샷을 추가한다", () => {
      const { result } = renderHook(() => useHistory());

      act(() => result.current.push("a"));
      act(() => result.current.push("b"));

      let undone: string | null = null;
      act(() => {
        undone = result.current.undo();
      });
      expect(undone).toBe("a");
    });
  });

  describe("undo", () => {
    it("이전 스냅샷을 반환한다", () => {
      const { result } = renderHook(() => useHistory());

      act(() => result.current.push("a"));
      act(() => result.current.push("b"));
      act(() => result.current.push("c"));

      let value: string | null = null;
      act(() => {
        value = result.current.undo();
      });
      expect(value).toBe("b");

      act(() => {
        value = result.current.undo();
      });
      expect(value).toBe("a");
    });

    it("시작 지점에서 null을 반환한다", () => {
      const { result } = renderHook(() => useHistory());

      act(() => result.current.push("a"));

      let value: string | null = "not-null";
      act(() => {
        value = result.current.undo();
      });
      expect(value).toBeNull();
    });

    it("빈 히스토리에서 null을 반환한다", () => {
      const { result } = renderHook(() => useHistory());

      let value: string | null = "not-null";
      act(() => {
        value = result.current.undo();
      });
      expect(value).toBeNull();
    });
  });

  describe("redo", () => {
    it("다음 스냅샷을 반환한다", () => {
      const { result } = renderHook(() => useHistory());

      act(() => result.current.push("a"));
      act(() => result.current.push("b"));
      act(() => result.current.push("c"));
      act(() => {
        result.current.undo();
      });
      act(() => {
        result.current.undo();
      });

      let value: string | null = null;
      act(() => {
        value = result.current.redo();
      });
      expect(value).toBe("b");

      act(() => {
        value = result.current.redo();
      });
      expect(value).toBe("c");
    });

    it("끝 지점에서 null을 반환한다", () => {
      const { result } = renderHook(() => useHistory());

      act(() => result.current.push("a"));
      act(() => result.current.push("b"));

      let value: string | null = "not-null";
      act(() => {
        value = result.current.redo();
      });
      expect(value).toBeNull();
    });

    it("빈 히스토리에서 null을 반환한다", () => {
      const { result } = renderHook(() => useHistory());

      let value: string | null = "not-null";
      act(() => {
        value = result.current.redo();
      });
      expect(value).toBeNull();
    });
  });

  describe("canUndo / canRedo", () => {
    it("초기 상태에서 둘 다 false이다", () => {
      const { result } = renderHook(() => useHistory());

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });

    it("스냅샷 하나일 때 canUndo는 false이다", () => {
      const { result } = renderHook(() => useHistory());

      act(() => result.current.push("a"));

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });

    it("스냅샷 두 개 이상일 때 canUndo가 true가 된다", () => {
      const { result } = renderHook(() => useHistory());

      act(() => result.current.push("a"));
      act(() => result.current.push("b"));

      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });

    it("undo 후 canRedo가 true가 된다", () => {
      const { result } = renderHook(() => useHistory());

      act(() => result.current.push("a"));
      act(() => result.current.push("b"));
      act(() => {
        result.current.undo();
      });

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);
    });

    it("undo와 redo에 따라 플래그가 정확히 갱신된다", () => {
      const { result } = renderHook(() => useHistory());

      act(() => result.current.push("a"));
      act(() => result.current.push("b"));
      act(() => result.current.push("c"));

      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);

      act(() => {
        result.current.undo();
      });
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(true);

      act(() => {
        result.current.undo();
      });
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);

      act(() => {
        result.current.redo();
      });
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(true);
    });
  });

  describe("MAX_HISTORY (5개 제한)", () => {
    it("6개를 push하면 가장 오래된 스냅샷이 제거된다", () => {
      const { result } = renderHook(() => useHistory());

      act(() => result.current.push("a"));
      act(() => result.current.push("b"));
      act(() => result.current.push("c"));
      act(() => result.current.push("d"));
      act(() => result.current.push("e"));
      act(() => result.current.push("f"));

      let value: string | null = null;
      act(() => {
        value = result.current.undo();
      });
      expect(value).toBe("e");

      act(() => {
        value = result.current.undo();
      });
      expect(value).toBe("d");

      act(() => {
        value = result.current.undo();
      });
      expect(value).toBe("c");

      act(() => {
        value = result.current.undo();
      });
      expect(value).toBe("b");

      act(() => {
        value = result.current.undo();
      });
      expect(value).toBeNull();
    });
  });

  describe("undo 후 push", () => {
    it("redo 히스토리가 잘린다", () => {
      const { result } = renderHook(() => useHistory());

      act(() => result.current.push("a"));
      act(() => result.current.push("b"));
      act(() => result.current.push("c"));
      act(() => {
        result.current.undo();
      });

      act(() => result.current.push("d"));

      expect(result.current.canRedo).toBe(false);

      let value: string | null = "not-null";
      act(() => {
        value = result.current.redo();
      });
      expect(value).toBeNull();

      act(() => {
        value = result.current.undo();
      });
      expect(value).toBe("b");

      act(() => {
        value = result.current.undo();
      });
      expect(value).toBe("a");

      act(() => {
        value = result.current.undo();
      });
      expect(value).toBeNull();
    });
  });

  describe("reset", () => {
    it("모든 히스토리를 초기화한다", () => {
      const { result } = renderHook(() => useHistory());

      act(() => result.current.push("a"));
      act(() => result.current.push("b"));
      act(() => result.current.push("c"));

      act(() => result.current.reset());

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);

      let value: string | null = "not-null";
      act(() => {
        value = result.current.undo();
      });
      expect(value).toBeNull();

      act(() => {
        value = result.current.redo();
      });
      expect(value).toBeNull();
    });

    it("reset 후 새로운 스냅샷을 push할 수 있다", () => {
      const { result } = renderHook(() => useHistory());

      act(() => result.current.push("a"));
      act(() => result.current.push("b"));
      act(() => result.current.reset());

      act(() => result.current.push("x"));
      act(() => result.current.push("y"));

      expect(result.current.canUndo).toBe(true);

      let value: string | null = null;
      act(() => {
        value = result.current.undo();
      });
      expect(value).toBe("x");
    });
  });
});
