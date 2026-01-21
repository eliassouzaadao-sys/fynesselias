"use client"

import { forwardRef } from "react"

const variants = {
  primary: "bg-fyn-accent text-white hover:opacity-90 focus:ring-fyn-accent",
  secondary: "bg-fyn-surface text-fyn-text border border-fyn-border hover:bg-fyn-surface/80 focus:ring-fyn-accent",
  ghost: "text-fyn-text hover:bg-fyn-surface focus:ring-fyn-accent",
  danger: "bg-fyn-danger text-white hover:opacity-90 focus:ring-fyn-danger",
}

const sizes = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
  lg: "px-4 py-2 text-sm",
}

export const Button = forwardRef(function Button(
  { children, variant = "primary", size = "md", className = "", disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
})
