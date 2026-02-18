import { describe, expect, it } from "vitest";

import type { ValidationResult } from "@/utils/imageValidation";

import {
  type FileEntry,
  INITIAL_STATE,
  MAX_BATCH_SIZE,
  type State,
  translatePageReducer,
} from "../translatePageReducer";

const createEntry = (overrides: Partial<FileEntry> = {}): FileEntry => ({
  id: crypto.randomUUID(),
  file: new File([new ArrayBuffer(1024)], "test.jpg", { type: "image/jpeg" }),
  validation: null,
  uploadError: null,
  ...overrides,
});

const validResult: ValidationResult = {
  valid: true,
  errors: [],
  dimensions: { width: 800, height: 600 },
};

const invalidResult: ValidationResult = {
  valid: false,
  errors: ["FILE_SIZE"],
};

describe("translatePageReducer", () => {
  it("초기 상태", () => {
    expect(INITIAL_STATE).toEqual({
      entries: [],
      phase: "idle",
      error: null,
      warning: null,
    });
  });

  describe("ADD_FILES", () => {
    it("엔트리를 추가한다", () => {
      const entries = [createEntry(), createEntry()];

      const state = translatePageReducer(INITIAL_STATE, {
        type: "ADD_FILES",
        entries,
      });

      expect(state.entries).toHaveLength(2);
      expect(state.entries[0].id).toBe(entries[0].id);
      expect(state.entries[1].id).toBe(entries[1].id);
    });

    it("기존 엔트리에 누적 추가한다", () => {
      const existing = createEntry();
      const prev: State = { ...INITIAL_STATE, entries: [existing] };

      const state = translatePageReducer(prev, {
        type: "ADD_FILES",
        entries: [createEntry()],
      });

      expect(state.entries).toHaveLength(2);
      expect(state.entries[0].id).toBe(existing.id);
    });

    it("10장 초과 시 기존 유지 + 신규 앞부터 허용 수만 추가하고 경고를 설정한다", () => {
      const existing = Array.from({ length: 8 }, () => createEntry());
      const prev: State = { ...INITIAL_STATE, entries: existing };

      const newEntries = Array.from({ length: 5 }, () => createEntry());
      const state = translatePageReducer(prev, {
        type: "ADD_FILES",
        entries: newEntries,
      });

      expect(state.entries).toHaveLength(MAX_BATCH_SIZE);
      expect(state.entries.slice(0, 8).map((e) => e.id)).toEqual(existing.map((e) => e.id));
      expect(state.entries.slice(8).map((e) => e.id)).toEqual(
        newEntries.slice(0, 2).map((e) => e.id),
      );
      expect(state.warning).toBe("최대 10장까지 업로드할 수 있습니다");
    });

    it("이미 10장이면 추가하지 않고 경고를 설정한다", () => {
      const existing = Array.from({ length: MAX_BATCH_SIZE }, () => createEntry());
      const prev: State = { ...INITIAL_STATE, entries: existing };

      const state = translatePageReducer(prev, {
        type: "ADD_FILES",
        entries: [createEntry()],
      });

      expect(state.entries).toHaveLength(MAX_BATCH_SIZE);
      expect(state.warning).toBe("최대 10장까지 업로드할 수 있습니다");
    });

    it("검증 대기 엔트리가 있으면 phase를 validating으로 전환한다", () => {
      const state = translatePageReducer(INITIAL_STATE, {
        type: "ADD_FILES",
        entries: [createEntry({ validation: null })],
      });

      expect(state.phase).toBe("validating");
    });
  });

  describe("REMOVE_FILE", () => {
    it("id로 엔트리를 제거한다", () => {
      const entry = createEntry();
      const prev: State = { ...INITIAL_STATE, entries: [entry] };

      const state = translatePageReducer(prev, {
        type: "REMOVE_FILE",
        id: entry.id,
      });

      expect(state.entries).toHaveLength(0);
    });

    it("존재하지 않는 id는 상태를 변경하지 않는다", () => {
      const entry = createEntry();
      const prev: State = {
        ...INITIAL_STATE,
        entries: [entry],
        phase: "validating",
        warning: "이전 경고",
      };

      const state = translatePageReducer(prev, {
        type: "REMOVE_FILE",
        id: "nonexistent",
      });

      expect(state).toEqual(prev);
    });

    it("삭제 후 모든 엔트리가 검증 완료면 phase를 idle로 전환한다", () => {
      const validated = createEntry({ validation: validResult });
      const unvalidated = createEntry({ validation: null });
      const prev: State = {
        ...INITIAL_STATE,
        entries: [validated, unvalidated],
        phase: "validating",
      };

      const state = translatePageReducer(prev, {
        type: "REMOVE_FILE",
        id: unvalidated.id,
      });

      expect(state.phase).toBe("idle");
    });
  });

  describe("VALIDATION_COMPLETE", () => {
    it("해당 엔트리의 검증 결과를 업데이트한다", () => {
      const entry = createEntry();
      const prev: State = {
        ...INITIAL_STATE,
        entries: [entry],
        phase: "validating",
      };

      const state = translatePageReducer(prev, {
        type: "VALIDATION_COMPLETE",
        id: entry.id,
        result: validResult,
      });

      expect(state.entries[0].validation).toEqual(validResult);
    });

    it("모든 엔트리 검증 완료 시 phase를 idle로 전환한다", () => {
      const entry = createEntry();
      const prev: State = {
        ...INITIAL_STATE,
        entries: [entry],
        phase: "validating",
      };

      const state = translatePageReducer(prev, {
        type: "VALIDATION_COMPLETE",
        id: entry.id,
        result: validResult,
      });

      expect(state.phase).toBe("idle");
    });

    it("아직 검증 중인 엔트리가 있으면 phase를 유지한다", () => {
      const entry1 = createEntry();
      const entry2 = createEntry();
      const prev: State = {
        ...INITIAL_STATE,
        entries: [entry1, entry2],
        phase: "validating",
      };

      const state = translatePageReducer(prev, {
        type: "VALIDATION_COMPLETE",
        id: entry1.id,
        result: validResult,
      });

      expect(state.phase).toBe("validating");
    });

    it("삭제된 파일의 검증 결과는 무시한다", () => {
      const entry = createEntry({ validation: validResult });
      const prev: State = { ...INITIAL_STATE, entries: [entry] };

      const state = translatePageReducer(prev, {
        type: "VALIDATION_COMPLETE",
        id: "deleted-id",
        result: invalidResult,
      });

      expect(state.entries).toEqual(prev.entries);
    });
  });

  describe("WARN / CLEAR_WARNING", () => {
    it("WARN: 경고 메시지를 설정한다", () => {
      const state = translatePageReducer(INITIAL_STATE, {
        type: "WARN",
        message: "경고 메시지",
      });

      expect(state.warning).toBe("경고 메시지");
    });

    it("CLEAR_WARNING: 경고를 초기화한다", () => {
      const prev: State = { ...INITIAL_STATE, warning: "이전 경고" };

      const state = translatePageReducer(prev, { type: "CLEAR_WARNING" });

      expect(state.warning).toBeNull();
    });
  });

  describe("SUBMIT_START", () => {
    it("phase를 uploading으로 전환한다", () => {
      const state = translatePageReducer(INITIAL_STATE, { type: "SUBMIT_START" });

      expect(state.phase).toBe("uploading");
    });

    it("error를 초기화한다", () => {
      const prev: State = { ...INITIAL_STATE, phase: "error", error: "이전 에러" };

      const state = translatePageReducer(prev, { type: "SUBMIT_START" });

      expect(state.error).toBeNull();
      expect(state.phase).toBe("uploading");
    });

    it("모든 엔트리의 uploadError를 초기화한다", () => {
      const entries = [
        createEntry({ uploadError: "이전 실패" }),
        createEntry({ uploadError: "이전 실패 2" }),
      ];
      const prev: State = { ...INITIAL_STATE, entries, phase: "error" };

      const state = translatePageReducer(prev, { type: "SUBMIT_START" });

      expect(state.entries.every((e) => e.uploadError === null)).toBe(true);
    });
  });

  describe("UPLOAD_ERROR", () => {
    it("해당 엔트리의 uploadError를 설정한다", () => {
      const entry = createEntry();
      const prev: State = {
        ...INITIAL_STATE,
        entries: [entry],
        phase: "uploading",
      };

      const state = translatePageReducer(prev, {
        type: "UPLOAD_ERROR",
        id: entry.id,
        error: "업로드 실패",
      });

      expect(state.entries[0].uploadError).toBe("업로드 실패");
    });

    it("존재하지 않는 id는 상태를 변경하지 않는다", () => {
      const entry = createEntry();
      const prev: State = {
        ...INITIAL_STATE,
        entries: [entry],
        phase: "uploading",
      };

      const state = translatePageReducer(prev, {
        type: "UPLOAD_ERROR",
        id: "nonexistent",
        error: "업로드 실패",
      });

      expect(state).toEqual(prev);
    });
  });

  describe("CREATING_BATCH", () => {
    it("phase를 creating_batch로 전환한다", () => {
      const prev: State = { ...INITIAL_STATE, phase: "uploading" };

      const state = translatePageReducer(prev, { type: "CREATING_BATCH" });

      expect(state.phase).toBe("creating_batch");
    });
  });

  describe("BATCH_CREATED", () => {
    it("batchId를 저장한다", () => {
      const prev: State = { ...INITIAL_STATE, phase: "creating_batch" };

      const state = translatePageReducer(prev, {
        type: "BATCH_CREATED",
        batchId: "batch_abc123",
      });

      expect(state.batchId).toBe("batch_abc123");
    });
  });

  describe("ERROR", () => {
    it("phase를 error로, 에러 메시지를 설정한다", () => {
      const prev: State = { ...INITIAL_STATE, phase: "uploading" };

      const state = translatePageReducer(prev, {
        type: "ERROR",
        message: "서버 에러 발생",
      });

      expect(state.phase).toBe("error");
      expect(state.error).toBe("서버 에러 발생");
    });
  });

  describe("RESET", () => {
    it("초기 상태로 되돌린다", () => {
      const prev: State = {
        entries: [createEntry()],
        phase: "uploading",
        error: "에러",
        warning: "경고",
      };

      const state = translatePageReducer(prev, { type: "RESET" });

      expect(state).toEqual(INITIAL_STATE);
    });
  });
});
