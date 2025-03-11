
import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

// Base horizontal slider with improved professional styling
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-editor-slider-track border border-editor-slider-border">
      <SliderPrimitive.Range className="absolute h-full bg-editor-slider-range" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-3.5 w-3.5 rounded-sm border border-zinc-600 bg-editor-slider-thumb shadow-slider ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

// Enhanced vertical slider with visual elements resembling professional equalizers
const VerticalSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    orientation="vertical"
    className={cn(
      "relative flex h-full touch-none select-none flex-col items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-full w-[1px] grow overflow-hidden rounded-full bg-editor-slider-track border border-editor-slider-border">
      <SliderPrimitive.Range className="absolute w-full bg-editor-slider-range" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-3 w-5 rounded-sm border border-zinc-600 bg-editor-slider-thumb shadow-slider ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
VerticalSlider.displayName = "VerticalSlider"

// Frequency response curve for parametric EQ
const FrequencySlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    color?: string;
  }
>(({ className, color = "#4f9ef8", ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-12 w-full grow overflow-hidden rounded-md bg-zinc-900 border border-zinc-800">
      <SliderPrimitive.Range className="absolute h-full" style={{ background: `${color}20` }} />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-6 w-6 rounded-full border-2 bg-editor-slider-thumb ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing" style={{ borderColor: color }} />
  </SliderPrimitive.Root>
))
FrequencySlider.displayName = "FrequencySlider"

// Compact slider for space-constrained areas like track controls
const CompactSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-editor-slider-track border border-editor-slider-border">
      <SliderPrimitive.Range className="absolute h-full bg-editor-slider-range" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-2.5 w-2.5 rounded-sm border border-zinc-600 bg-editor-slider-thumb shadow-slider ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
CompactSlider.displayName = "CompactSlider"

export { Slider, VerticalSlider, FrequencySlider, CompactSlider }
