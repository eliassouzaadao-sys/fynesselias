"use client"

import { useState } from "react"
import { Check, Building2, Search } from "lucide-react"
import { BANKS_LIST, BANK_DATA } from "@/lib/bank-data"
import Image from "next/image"

function BankLogoSelector({ bankId }) {
  const bankData = BANK_DATA[bankId] || BANK_DATA["outro"]

  if (bankData.logoUrl) {
    return (
      <Image
        src={bankData.logoUrl || "/placeholder.svg"}
        alt={bankData.name}
        width={64}
        height={64}
        className="h-14 w-auto max-w-[100px] object-contain"
      />
    )
  }

  // Fallback for banks without uploaded logos
  return (
    <div
      className="flex h-14 w-14 items-center justify-center rounded-xl shadow-md"
      style={{
        background: bankData.cardBg || `linear-gradient(135deg, ${bankData.primaryColor}, ${bankData.secondaryColor})`,
      }}
    >
      <Building2 className="h-7 w-7 text-white" />
    </div>
  )
}

export function BankSelector({ selectedBank, onSelect }) {
  const [search, setSearch] = useState("")

  const filteredBanks = BANKS_LIST.filter((bank) => bank.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar banco..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Banks Grid */}
      <div className="grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-1">
        {filteredBanks.map((bank) => {
          const isSelected = selectedBank === bank.id
          const bankData = BANK_DATA[bank.id]

          return (
            <button
              key={bank.id}
              onClick={() => onSelect(bank.id)}
              className={`
                relative flex flex-col items-center justify-center gap-2 rounded-xl p-4 transition-all duration-200 overflow-hidden min-h-[120px]
                ${
                  isSelected
                    ? "ring-2 ring-blue-500 ring-offset-2 shadow-lg scale-105"
                    : "hover:shadow-md hover:scale-102"
                }
              `}
              style={{
                background:
                  bankData.cardBg ||
                  `linear-gradient(135deg, ${bankData.primaryColor}, ${bankData.gradientTo || bankData.secondaryColor})`,
              }}
            >
              {/* Check mark */}
              {isSelected && (
                <div className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 shadow-lg z-10">
                  <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                </div>
              )}

              {/* Logo Container - white background for logo visibility */}
              <div
                className={`flex items-center justify-center transition-transform duration-200 ${isSelected ? "scale-105" : ""}`}
              >
                <BankLogoSelector bankId={bank.id} />
              </div>

              {/* Name */}
              <span
                className="text-[11px] font-semibold text-center leading-tight drop-shadow-sm"
                style={{ color: bankData.textColor || "#FFFFFF" }}
              >
                {bank.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
