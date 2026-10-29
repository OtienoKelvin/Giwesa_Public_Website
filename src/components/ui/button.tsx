import Link from "next/link";
import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "group inline-flex items-center justify-center gap-2 rounded-full border font-sans font-bold leading-none transition-[color,background-color,border-color,transform,box-shadow] duration-200 focus-visible:outline-offset-3 disabled:cursor-not-allowed disabled:opacity-55",
  {
    variants: {
      variant: {
        primary:
          "border-brand bg-brand text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset] hover:border-brand-dark hover:bg-brand-dark active:translate-y-px",
        secondary:
          "border-line-strong bg-transparent text-ink hover:border-brand hover:bg-brand-light",
        inverse:
          "border-white/25 bg-white text-brand-dark hover:border-white hover:bg-[#f4efe4] active:translate-y-px",
        outlineInverse:
          "border-white/35 bg-transparent text-white hover:border-white hover:bg-white/10",
        accent:
          "border-sun bg-sun text-[#2b210d] hover:border-[#c4840d] hover:bg-[#e8aa2f] active:translate-y-px",
        ghost:
          "border-transparent bg-transparent text-brand hover:bg-brand-light hover:text-brand-dark",
        danger:
          "border-danger bg-danger text-white hover:border-[#84261f] hover:bg-[#84261f] active:translate-y-px",
      },
      size: {
        sm: "min-h-9 px-4 text-[0.8125rem]",
        md: "min-h-11 px-5.5 text-sm",
        lg: "min-h-13 px-7 text-[0.9375rem]",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>;

export function ButtonLink({ className, variant, size, ...props }: ButtonLinkProps) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

type ExternalButtonLinkProps = ComponentProps<"a"> & VariantProps<typeof buttonVariants>;

export function ExternalButtonLink({
  className,
  variant,
  size,
  ...props
}: ExternalButtonLinkProps) {
  return <a className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
