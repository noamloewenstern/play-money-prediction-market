import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary/15 text-primary-foreground hover:bg-primary/25',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/70',
        destructive: 'border-transparent bg-destructive/15 text-destructive hover:bg-destructive/25',
        outline: 'text-foreground',
        black: 'border-transparent bg-foreground text-background hover:bg-foreground/90',
        blue: 'border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-400 hover:bg-blue-500/25',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export type BadgeProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
