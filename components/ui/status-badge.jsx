"use client"

import { Check, Clock, AlertCircle, XCircle, Zap, Ban, Circle, ArrowUpCircle, ArrowDownCircle } from "lucide-react"

const statusConfig = {
  pago: { bg: "bg-emerald-100", text: "text-emerald-600", icon: Check },
  pendente: { bg: "bg-amber-100", text: "text-amber-600", icon: Clock },
  vencido: { bg: "bg-red-100", text: "text-red-600", icon: AlertCircle },
  conciliado: { bg: "bg-emerald-100", text: "text-emerald-600", icon: Check },
  divergente: { bg: "bg-red-100", text: "text-red-600", icon: XCircle },
  ativo: { bg: "bg-emerald-100", text: "text-emerald-600", icon: Zap },
  inativo: { bg: "bg-muted", text: "text-muted-foreground", icon: Circle },
  bloqueado: { bg: "bg-red-100", text: "text-red-600", icon: Ban },
  aberto: { bg: "bg-primary/10", text: "text-primary", icon: Circle },
  parcial: { bg: "bg-amber-100", text: "text-amber-600", icon: Clock },
  executado: { bg: "bg-emerald-100", text: "text-emerald-600", icon: Check },
  erro: { bg: "bg-red-100", text: "text-red-600", icon: XCircle },
  baixo: { bg: "bg-emerald-100", text: "text-emerald-600", icon: ArrowDownCircle },
  médio: { bg: "bg-amber-100", text: "text-amber-600", icon: Circle },
  alto: { bg: "bg-red-100", text: "text-red-600", icon: ArrowUpCircle },
}

const defaultConfig = { bg: "bg-muted", text: "text-muted-foreground", icon: Circle }

export function StatusBadge({ status, showIcon = true, size = "sm" }) {
  if (!status) return null

  const normalizedStatus = status
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
  const config = statusConfig[normalizedStatus] || defaultConfig
  const Icon = config.icon

  const sizeClasses = {
    xs: "px-1.5 py-0.5 text-[10px] gap-1",
    sm: "px-2 py-1 text-xs gap-1.5",
    md: "px-2.5 py-1 text-sm gap-1.5",
  }

  const iconSizes = {
    xs: "h-2.5 w-2.5",
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${config.bg} ${config.text} ${sizeClasses[size]}`}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{status}</span>
    </span>
  )
}
