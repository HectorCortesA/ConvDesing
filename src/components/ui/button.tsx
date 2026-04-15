import React from "react";
import { cn } from "./utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "ghost" | "default" | "secondary" | "destructive";
  size?: "icon" | "sm" | "default" | "lg";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variantClasses = {
      ghost:
        "hover:bg-gray-100 dark:hover:bg-white/10 text-gray-900 dark:text-white",
      default:
        "bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800",
      secondary: "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white",
      destructive: "bg-red-600 text-white hover:bg-red-700",
    };

    const sizeClasses = {
      icon: "h-9 w-9",
      sm: "h-8 px-3 text-sm",
      default: "h-9 px-4 py-2",
      lg: "h-11 px-8",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button };
