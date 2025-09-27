import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
};

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-foreground text-background hover:bg-foreground/90 disabled:bg-foreground/40",
  secondary:
    "bg-secondary text-foreground hover:bg-secondary/80 disabled:bg-secondary/60",
  ghost: "bg-transparent text-foreground hover:bg-muted/80",
  danger:
    "bg-red-100 text-red-600 hover:bg-red-200 disabled:bg-red-100 disabled:text-red-400",
};

const sizeStyles: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-10 w-10 rounded-full",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/50 disabled:cursor-not-allowed gap-2",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

const buttonVariants = (props: { variant?: ButtonProps["variant"]; size?: ButtonProps["size"] }) => {
  const { variant = "primary", size = "md" } = props;
  return cn(
    "inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/50 disabled:cursor-not-allowed gap-2",
    variantStyles[variant],
    sizeStyles[size]
  );
};

export { Button, buttonVariants };
