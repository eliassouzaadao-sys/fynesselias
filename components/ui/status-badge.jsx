"use client"

import { Check, Clock, AlertCircle, XCircle, Zap, Ban, Circle, ArrowUpCircle, ArrowDownCircle } from "lucide-react"

const statusConfig = {
  pago: { bg: "bg-fyn-success-light", text: "text-fyn-success", icon: Check },
  pendente: { bg: "bg-fyn-warning-light", text: "text-fyn-warning", icon: Clock },
  vencido: { bg: "bg-fyn-danger-light", text: "text-fyn-danger", icon: AlertCircle },
  conciliado: { bg: "bg-fyn-success-light", text: "text-fyn-success", icon: Check },
  divergente: { bg: "bg-fyn-danger-light", text: "text-fyn-danger", icon: XCircle },
  ativo: { bg: "bg-fyn-success-light", text: "text-fyn-success", icon: Zap },
  inativo: { bg: "bg-fyn-surface", text: "text-fyn-muted", icon: Circle },
  bloqueado: { bg: "bg-fyn-danger-light", text: "text-fyn-danger", icon: Ban },
  aberto: { bg: "bg-fyn-accent/10", text: "text-fyn-accent", icon: Circle },
  parcial: { bg: "bg-fyn-warning-light", text: "text-fyn-warning", icon: Clock },
  executado: { bg: "bg-fyn-success-light", text: "text-fyn-success", icon: Check },
  erro: { bg: "bg-fyn-danger-light", text: "text-fyn-danger", icon: XCircle },
  baixo: { bg: "bg-fyn-success-light", text: "text-fyn-success", icon: ArrowDownCircle },
  médio: { bg: "bg-fyn-warning-light", text: "text-fyn-warning", icon: Circle },
  alto: { bg: "bg-fyn-danger-light", text: "text-fyn-danger", icon: ArrowUpCircle },
}

const defaultConfig = { bg: "bg-fyn-surface", text: "text-fyn-text-muted", icon: Circle }

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
