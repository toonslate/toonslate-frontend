import { useMutation } from "@tanstack/react-query";

import { eraseRegion } from "@/api/client";

interface UseEraseActionOptions {
  translateId: string;
  onSuccess: (resultBase64: string) => void;
}

export const useEraseAction = ({ translateId, onSuccess }: UseEraseActionOptions) => {
  const mutation = useMutation({
    mutationFn: (maskBase64: string) => eraseRegion(translateId, maskBase64),
    onSuccess: (result) => {
      onSuccess(result.resultImage);
    },
  });

  const getErrorMessage = (): string | null => {
    if (!mutation.error) return null;
    if (mutation.error instanceof Error) return mutation.error.message;
    return "알 수 없는 오류가 발생했습니다.";
  };

  return {
    erase: mutation.mutate,
    isErasing: mutation.isPending,
    eraseError: getErrorMessage(),
  };
};
