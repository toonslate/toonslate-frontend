import type { ValidationResult } from "@/utils/imageValidation";

export const MAX_BATCH_SIZE = 10;

export interface FileEntry {
  id: string;
  file: File;
  validation: ValidationResult | null;
  uploadError: string | null;
}

export type Phase = "idle" | "validating" | "uploading" | "creating_batch" | "error";

export interface State {
  entries: FileEntry[];
  phase: Phase;
  error: string | null;
  warning: string | null;
  batchId?: string | null;
}

export type Action =
  | { type: "ADD_FILES"; entries: FileEntry[] }
  | { type: "REMOVE_FILE"; id: string }
  | { type: "VALIDATION_COMPLETE"; id: string; result: ValidationResult }
  | { type: "WARN"; message: string }
  | { type: "CLEAR_WARNING" }
  | { type: "SUBMIT_START" }
  | { type: "UPLOAD_ERROR"; id: string; error: string }
  | { type: "CREATING_BATCH" }
  | { type: "BATCH_CREATED"; batchId: string }
  | { type: "ERROR"; message: string }
  | { type: "RESET" };

export const INITIAL_STATE: State = {
  entries: [],
  phase: "idle",
  error: null,
  warning: null,
};

const allValidated = (entries: FileEntry[]): boolean => entries.every((e) => e.validation !== null);

export const translatePageReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_FILES": {
      const maxNew = MAX_BATCH_SIZE - state.entries.length;
      const accepted = action.entries.slice(0, maxNew);
      const hasOverflow = action.entries.length > maxNew;
      const entries = [...state.entries, ...accepted];

      return {
        ...state,
        entries,
        warning: hasOverflow ? "최대 10장까지 업로드할 수 있습니다" : state.warning,
        phase: accepted.some((e) => e.validation === null) ? "validating" : state.phase,
      };
    }

    case "REMOVE_FILE": {
      const entries = state.entries.filter((e) => e.id !== action.id);
      return {
        ...state,
        entries,
        phase: state.phase === "validating" && allValidated(entries) ? "idle" : state.phase,
      };
    }

    case "VALIDATION_COMPLETE": {
      const entries = state.entries.map((e) =>
        e.id === action.id ? { ...e, validation: action.result } : e,
      );
      return {
        ...state,
        entries,
        phase: state.phase === "validating" && allValidated(entries) ? "idle" : state.phase,
      };
    }

    case "WARN":
      return { ...state, warning: action.message };

    case "CLEAR_WARNING":
      return { ...state, warning: null };

    case "SUBMIT_START":
      return {
        ...state,
        phase: "uploading",
        error: null,
        entries: state.entries.map((e) => ({ ...e, uploadError: null })),
      };

    case "UPLOAD_ERROR":
      return {
        ...state,
        entries: state.entries.map((e) =>
          e.id === action.id ? { ...e, uploadError: action.error } : e,
        ),
      };

    case "CREATING_BATCH":
      return { ...state, phase: "creating_batch" };

    case "BATCH_CREATED":
      return { ...state, batchId: action.batchId };

    case "ERROR":
      return { ...state, phase: "error", error: action.message };

    case "RESET":
      return INITIAL_STATE;
  }
};
