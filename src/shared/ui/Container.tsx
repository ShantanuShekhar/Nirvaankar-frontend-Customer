import { cn } from '@/shared/utils/helpers'
import type { HTMLAttributes } from 'react'

type Props = HTMLAttributes<HTMLDivElement> & {
  narrow?: boolean
}

export function Container({ className, narrow, ...props }: Props) {
  return (
    <div
      className={cn(narrow ? 'nv-container-narrow' : 'nv-container', className)}
      {...props}
    />
  )
}
