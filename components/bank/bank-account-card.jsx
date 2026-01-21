"use client"

import { CreditCard, TrendingUp, TrendingDown, Pencil, Trash2, Building2 } from "lucide-react"
import { BANK_DATA } from "@/lib/bank-data"
import { formatCurrency } from "@/lib/format"
import Image from "next/image"

function BankLogo({ bankId, bankData }) {
  if (bankData.logoUrl) {
    return (
      <Image
        src={bankData.logoUrl || "/placeholder.svg"}
        alt={bankData.name}
        width={80}
        height={80}
        className="h-16 w-auto max-w-[120px] object-contain"
      />
    )
  }

  // Fallback text logos for banks without uploaded images
  const fallbackLogos = {
    outro: (
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20">
        <Building2 className="h-7 w-7 text-white" />
      </div>
    ),
  }

  return fallbackLogos[bankId] || fallbackLogos["outro"]
}

export function BankAccountCard({ conta, onEdit, onDelete }) {
  const bankData = BANK_DATA[conta.bankId] || BANK_DATA["outro"]

  const isLightCard = ["banco-do-brasil", "pan"].includes(conta.bankId)
  const textPrimary = isLightCard ? bankData.textColor : "#FFFFFF"
  const textSecondary = isLightCard ? `${bankData.textColor}99` : "rgba(255,255,255,0.7)"

  const isPremiumCard = ["safra", "daycoval", "btg-pactual"].includes(conta.bankId)
  const accentColor = bankData.accentColor || bankData.secondaryColor

  return (
    <div
      className="relative overflow-hidden rounded-lg p-2 transition-all duration-150 hover:shadow-md hover:scale-[1.01] group min-h-[160px]"
      style={{
        background: bankData.cardBg,
        boxShadow: `0 8px 32px ${bankData.primaryColor}40`,
      }}
    >
      {/* Decorative elements based on card style */}
      {bankData.style === "premium" && (
        <>
          <div
            className="absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-10"
            style={{ background: accentColor }}
          />
          <div
            className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full opacity-5"
            style={{ background: accentColor }}
          />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A961]/50 to-transparent" />
        </>
      )}
      {bankData.style === "modern" && (
        <>
          <div
            className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-xl"
            style={{ background: bankData.secondaryColor }}
          />
          <div
            className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full opacity-10 blur-lg"
            style={{ background: "#FFFFFF" }}
          />
        </>
      )}
      {bankData.style === "minimal" && conta.bankId === "c6-bank" && (
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-4 right-4 text-[120px] font-bold text-white leading-none">C6</div>
        </div>
      )}
      {bankData.style === "minimal" && conta.bankId === "pan" && (
        <div className="absolute top-3 right-3 h-3 w-3 bg-[#00D4E5]" />
      )}
      {bankData.style === "vibrant" && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
      )}

      {/* Header with logo */}
      <div className="relative mb-1 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <BankLogo bankId={conta.bankId} bankData={bankData} />
          <div>
            <h3
              className="font-semibold text-[15px]"
              style={{ color: isPremiumCard && conta.bankId === "safra" ? "#C9A961" : textPrimary }}
            >
              {bankData.name}
            </h3>
            <p className="text-[10px]" style={{ color: textSecondary }}>
              Ag: {conta.agencia} | Conta: {conta.conta}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(conta)}
            className="rounded-lg p-1.5 transition-colors hover:bg-white/20"
            style={{ color: textSecondary }}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(conta.id)}
            className="rounded-lg p-1.5 transition-colors hover:bg-red-500/20 hover:text-red-300"
            style={{ color: textSecondary }}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Balance */}
      <div className="relative mb-1 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: textSecondary }}>
            Saldo Atual
          </p>
          <p
            className="text-lg font-bold"
            style={{ color: isPremiumCard && conta.bankId === "safra" ? "#FFFFFF" : textPrimary }}
          >
            {formatCurrency(conta.saldo)}
          </p>
        </div>
        <span
          className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
          style={{
            backgroundColor: isPremiumCard ? `${accentColor}30` : "rgba(255,255,255,0.15)",
            color: isPremiumCard && conta.bankId === "safra" ? "#C9A961" : textPrimary,
            border: isPremiumCard ? `1px solid ${accentColor}50` : `1px solid ${textPrimary}30`,
          }}
        >
          {conta.tipo}
        </span>
      </div>

      {/* Limits */}
      <div className="relative grid grid-cols-2 gap-1.5">
        <div
          className="rounded-md p-1.5"
          style={{
            backgroundColor: isPremiumCard ? `${accentColor}15` : "rgba(255,255,255,0.1)",
            borderLeft: isPremiumCard ? `2px solid ${accentColor}50` : "none",
          }}
        >
          <div className="mb-0 flex items-center gap-0.5">
            <CreditCard className="h-3.5 w-3.5" style={{ color: isPremiumCard ? accentColor : textSecondary }} />
            <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: textSecondary }}>
              Limite Crédito
            </span>
          </div>
          <p className="text-[11px] font-bold" style={{ color: textPrimary }}>
            {formatCurrency(conta.limiteCredito)}
          </p>
        </div>
        <div
          className="rounded-xl p-3"
          style={{
            backgroundColor: isPremiumCard ? `${accentColor}15` : "rgba(255,255,255,0.1)",
            borderLeft: isPremiumCard ? `2px solid ${accentColor}50` : "none",
          }}
        >
          <div className="mb-1 flex items-center gap-1.5">
            {conta.utilizadoChequeEspecial > 0 ? (
              <TrendingDown className="h-3.5 w-3.5 text-orange-400" />
            ) : (
              <TrendingUp className="h-3.5 w-3.5" style={{ color: isPremiumCard ? accentColor : textSecondary }} />
            )}
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: textSecondary }}>
              Cheque Especial
            </span>
          </div>
          <p className="text-sm font-bold" style={{ color: textPrimary }}>
            {formatCurrency(conta.limiteChequeEspecial)}
          </p>
          {conta.utilizadoChequeEspecial > 0 && (
            <p className="text-[10px] text-orange-400">{formatCurrency(conta.utilizadoChequeEspecial)} usado</p>
          )}
        </div>
      </div>
    </div>
  )
}
