import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import * as React from 'react'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gap-2',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-soft-xs hover:bg-primary/90 hover:shadow-soft-sm active:scale-[0.98]',
        heavy: 'bg-foreground text-background shadow-soft-xs hover:bg-foreground/90 active:scale-[0.98]',
        destructive:
          'bg-destructive text-destructive-foreground shadow-soft-xs hover:bg-destructive/90 active:scale-[0.98]',
        outline:
          'border border-input bg-background shadow-soft-xs hover:bg-accent hover:text-accent-foreground active:scale-[0.98]',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/70 active:scale-[0.98]',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-lg px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean
  }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    const renderLoader =
      size === 'icon' ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {children}
        </>
      )
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={loading || disabled}
        ref={ref}
        {...props}
      >
        {loading ? renderLoader : children}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
