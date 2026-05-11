import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '#/lib/utils.ts'

const DEBOUNCE_MS = 120

function Slider({
  className,
  value,
  defaultValue,
  onValueChange,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const isControlled = value !== undefined
  const thumbCount = (value ?? defaultValue ?? [0]).length

  // Controlled: keep a local copy for immediate visual feedback while debouncing the parent callback
  const [localValue, setLocalValue] = React.useState<number[]>(value ?? defaultValue ?? [0])
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync when parent changes value externally (e.g. reset), but not during drag
  React.useEffect(() => {
    if (isControlled) setLocalValue(value)
  }, [value, isControlled])

  React.useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  function handleChange(next: number[]) {
    if (isControlled) setLocalValue(next)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onValueChange?.(next), DEBOUNCE_MS)
  }

  return (
    <SliderPrimitive.Root
      value={isControlled ? localValue : undefined}
      defaultValue={defaultValue}
      onValueChange={handleChange}
      className={cn('relative flex w-full touch-none select-none items-center', className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {Array.from({ length: thumbCount }, (_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className="block h-4 w-4 rounded-full border border-primary/50 bg-white shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
