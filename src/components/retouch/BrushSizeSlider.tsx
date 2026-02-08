interface BrushSizeSliderProps {
  brushSize: number;
  min: number;
  max: number;
  onChange: (size: number) => void;
}

export const BrushSizeSlider = ({ brushSize, min, max, onChange }: BrushSizeSliderProps) => {
  return (
    <div className="flex items-center gap-4">
      <label className="text-sm font-medium">브러시 크기</label>
      <input
        type="range"
        min={min}
        max={max}
        value={brushSize}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-32"
      />
      <span className="text-sm text-muted-foreground">{brushSize}px</span>
    </div>
  );
};
