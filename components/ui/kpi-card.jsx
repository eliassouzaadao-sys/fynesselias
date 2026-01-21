"use client"

import { TrendingUp, TrendingDown, Minus } from "lucide-react"

export function KpiCard({ label, value, subvalue, variant = "default", trend, trendValue, sparkline }) {
  const variantStyles = {
    default: "bg-fyn-bg border-fyn-border",
    accent: "bg-gradient-to-br from-fyn-accent/5 to-fyn-accent/10 border-fyn-accent/20",
    success: "bg-gradient-to-br from-fyn-success/5 to-fyn-success/10 border-fyn-success/20",
    warning: "bg-gradient-to-br from-fyn-warning/5 to-fyn-warning/10 border-fyn-warning/20",
    danger: "bg-gradient-to-br from-fyn-danger/5 to-fyn-danger/10 border-fyn-danger/20",
  }

  const trendColors = {
    up: "text-fyn-success bg-fyn-success-light",
    down: "text-fyn-danger bg-fyn-danger-light",
    neutral: "text-fyn-muted bg-fyn-surface",
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
              fill={variant === "danger" ? "#ef4444" : variant === "success" ? "#10b981" : "#3b82f6"}
              opacity="0.3"
            />
            <path
              d={`M 0 ${40 - sparkline[0] * 0.4} ${sparkline.map((v, i) => `L ${(i / (sparkline.length - 1)) * 100} ${40 - v * 0.4}`).join(" ")}`}
              fill="none"
              stroke={variant === "danger" ? "#ef4444" : variant === "success" ? "#10b981" : "#3b82f6"}
              strokeWidth="2"
            />
          </svg>
        </div>
      )}

      <div className="relative">
        <div className="flex items-start justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-fyn-text-muted">{label}</p>
          {trend && (
            <span
              className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium ${trendColors[trend]}`}
            >
              <TrendIcon className="h-3 w-3" />
              {trendValue && <span>{trendValue}</span>}
            </span>
          )}
        </div>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-fyn-text">{value}</p>
        {subvalue && <p className="mt-1 text-xs text-fyn-text-muted">{subvalue}</p>}
      </div>
    </div>
  )
}
