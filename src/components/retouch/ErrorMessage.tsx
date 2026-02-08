interface ErrorMessageProps {
  message: string;
}

export const ErrorMessage = ({ message }: ErrorMessageProps) => {
  return (
    <div className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">{message}</div>
  );
};
