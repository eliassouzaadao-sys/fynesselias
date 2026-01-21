"use client"

import { useState } from "react"

export function CurrencyInput({ value, onChange, placeholder = "R$ 0,00", className, ...props }) {
  const [displayValue, setDisplayValue] = useState("")

  const formatCurrency = (value) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, "")
    
    if (!numbers) return ""
    
    // Converte para número e divide por 100 para ter os centavos
    const amount = parseInt(numbers) / 100
    
    // Formata como moeda brasileira
    return amount.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const handleChange = (e) => {
    const inputValue = e.target.value
    const formatted = formatCurrency(inputValue)
    setDisplayValue(formatted)
    
    // Retorna o valor numérico para o parent
    if (onChange) {
      const numericValue = formatted.replace(/\./g, "").replace(",", ".")
      onChange(parseFloat(numericValue) || 0)
    }
  }

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-fyn-text">R$</span>
      <input
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder.replace("R$ ", "")}
        className={`pl-10 ${className}`}
        {...props}
      />
    </div>
  )
}
