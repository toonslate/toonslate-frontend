export const Header = () => {
  return (
    <header className="flex items-center justify-between border-b bg-background px-8 py-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          T
        </div>
        <span className="text-lg font-bold">Toonslate</span>
      </div>
    </header>
  );
};
