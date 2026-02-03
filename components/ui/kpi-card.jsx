"use client"

import { TrendingUp, TrendingDown, Minus } from "lucide-react"

export function KpiCard({ label, value, subvalue, variant = "default", trend, trendValue, sparkline }) {
  const variantStyles = {
    default: "bg-card border-border",
    accent: "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20",
    success: "bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-500/20",
    warning: "bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20",
    danger: "bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20",
  }

  const trendColors = {
    up: "text-emerald-600 bg-emerald-100",
    down: "text-destructive bg-destructive/10",
    neutral: "text-muted-foreground bg-muted",
  }

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border p-4 shadow-sm transition-all hover:shadow-md ${variantStyles[variant]}`}
    >
      {/* Sparkline background */}
      {sparkline && sparkline.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-12 opacity-20">
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-full w-full">
            <path
              d={`M 0 40 ${sparkline.map((v, i) => `L ${(i / (sparkline.length - 1)) * 100} ${40 - v * 0.4}`).join(" ")} L 100 40 Z`}
              fill={variant === "danger" ? "#ef4444" : variant === "success" ? "#10b981" : "#6366f1"}
              opacity="0.3"
            />
            <path
              d={`M 0 ${40 - sparkline[0] * 0.4} ${sparkline.map((v, i) => `L ${(i / (sparkline.length - 1)) * 100} ${40 - v * 0.4}`).join(" ")}`}
              fill="none"
              stroke={variant === "danger" ? "#ef4444" : variant === "success" ? "#10b981" : "#6366f1"}
              strokeWidth="2"
            />
          </svg>
        </div>
      )}

      <div className="relative">
        <div className="flex items-start justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          {trend && (
            <span
              className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium ${trendColors[trend]}`}
            >
              <TrendIcon className="h-3 w-3" />
              {trendValue && <span>{trendValue}</span>}
            </span>
          )}
        </div>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
        {subvalue && <p className="mt-1 text-xs text-muted-foreground">{subvalue}</p>}
      </div>
    </div>
  )
}
