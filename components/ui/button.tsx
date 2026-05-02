import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center font-semibold transition-all active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-indigo-500 text-white hover:bg-indigo-400 rounded-lg',
        secondary:
          'border border-white/[0.1] bg-white/[0.04] text-zinc-300 hover:bg-white/[0.07] hover:text-white rounded-lg',
        outline:
          'border border-white/[0.12] bg-transparent text-zinc-300 hover:bg-white/[0.06] hover:text-white rounded-lg',
        ghost: 'text-zinc-400 hover:bg-white/[0.05] hover:text-white rounded-lg',
        destructive: 'bg-red-500/90 text-white hover:bg-red-500 rounded-lg',
        link: 'text-indigo-400 hover:text-indigo-300 underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-9 px-4 text-[13px]',
        sm: 'h-8 px-3 text-[12px]',
        lg: 'h-11 px-6 text-[14px]',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
