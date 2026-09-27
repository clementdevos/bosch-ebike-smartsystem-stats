import * as React from 'react'
import { cn } from '#/lib/utils.ts'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      className={cn(
        'border-input bg-background flex h-8 w-full rounded-md border px-2.5 py-1 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
}

export { Input }
