export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const ACCEPTED_TYPES = ["image/jpeg", "image/png"] as const;
export const MAX_PIXELS = 3_000_000;
export const MAX_ASPECT_RATIO = 3.0;

export type ValidationError = "FILE_SIZE" | "FILE_TYPE" | "PIXEL_COUNT" | "ASPECT_RATIO";

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  dimensions?: { width: number; height: number };
}

const VALIDATION_ERROR_MESSAGES: Record<ValidationError, string> = {
  FILE_SIZE: "파일 크기는 5MB 이하여야 합니다",
  FILE_TYPE: "JPG, PNG 형식만 지원합니다",
  PIXEL_COUNT: "이미지 해상도가 너무 높습니다 (최대 3MP)",
  ASPECT_RATIO: "세로가 너무 긴 이미지입니다 (비율 3:1 이하)",
};

export const getValidationErrorMessage = (error: ValidationError): string =>
  VALIDATION_ERROR_MESSAGES[error];

const ACCEPTED_TYPE_SET = new Set<string>(ACCEPTED_TYPES);

const validateSync = (file: File): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (file.size > MAX_FILE_SIZE) {
    errors.push("FILE_SIZE");
  }

  if (!ACCEPTED_TYPE_SET.has(file.type)) {
    errors.push("FILE_TYPE");
  }

  return errors;
};

const loadImageDimensions = (file: File): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    const cleanup = () => URL.revokeObjectURL(url);

    img.onload = () => {
      cleanup();
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      cleanup();
      reject(new Error("이미지를 로드할 수 없습니다"));
    };

    img.src = url;
  });

const validateDimensions = (width: number, height: number): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (width * height > MAX_PIXELS) {
    errors.push("PIXEL_COUNT");
  }

  if (height / width > MAX_ASPECT_RATIO) {
    errors.push("ASPECT_RATIO");
  }

  return errors;
};

export const validateImageFile = async (file: File): Promise<ValidationResult> => {
  const syncErrors = validateSync(file);

  if (syncErrors.length > 0) {
    return { valid: false, errors: syncErrors };
  }

  const dimensions = await loadImageDimensions(file);
  const dimensionErrors = validateDimensions(dimensions.width, dimensions.height);

  return {
    valid: dimensionErrors.length === 0,
    errors: dimensionErrors,
    dimensions,
  };
};
