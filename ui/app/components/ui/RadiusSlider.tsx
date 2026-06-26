import { Slider } from "@base-ui/react/slider";
import { cn } from "~/lib/utils";

interface RadiusSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export function RadiusSlider({ value, onChange, min = 1, max = 50, className }: RadiusSliderProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="text-xs font-semibold text-cm-on-surface-variant w-14 shrink-0">Radius</span>
      <Slider.Root
        value={[value]}
        onValueChange={(vals) => onChange(vals[0]!)}
        min={min}
        max={max}
        className="flex-1"
      >
        <Slider.Control className="relative flex items-center h-6 w-full">
          <Slider.Track className="relative h-1 w-full rounded-full bg-cm-outline-variant">
            <Slider.Indicator className="h-full rounded-full bg-cm-primary" />
            <Slider.Thumb
              className="w-6 h-6 rounded-full bg-cm-primary shadow-[0_4px_6px_rgba(0,0,0,0.1)] border-2 border-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cm-primary focus-visible:ring-offset-1 cursor-grab active:cursor-grabbing"
            />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <span className="text-xs font-bold text-cm-on-surface w-12 shrink-0 text-right">
        {value} km
      </span>
    </div>
  );
}
