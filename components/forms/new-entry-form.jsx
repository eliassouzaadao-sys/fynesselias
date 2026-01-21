"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CurrencyInput } from "@/components/ui/currency-input"

const entryTypes = [
  { value: "transaction", label: "Lançamento de Caixa" },
  { value: "bill", label: "Conta a Pagar" },
  { value: "invoice", label: "Conta a Receber" },
]

// Mock data - em produção virá do backend
const centrosCusto = [
  { 
    id: "1", 
    name: "Matéria Prima",
    subcentros: [
      { id: "1-1", name: "Frios" },
      { id: "1-2", name: "Secos" },
      { id: "1-3", name: "Bebidas" },
    ]
  },
  { 
    id: "2", 
    name: "Comercial",
    subcentros: [
      { id: "2-1", name: "Vendas Diretas" },
      { id: "2-2", name: "E-commerce" },
    ]
  },
  { 
    id: "3", 
    name: "Marketing",
    subcentros: [
      { id: "3-1", name: "Redes Sociais" },
      { id: "3-2", name: "Anúncios Online" },
      { id: "3-3", name: "Eventos" },
    ]
  },
  { 
    id: "4", 
    name: "Operações",
    subcentros: [
      { id: "4-1", name: "Logística" },
      { id: "4-2", name: "Produção" },
    ]
  },
]

export function NewEntryForm({ onClose }) {
  const [entryType, setEntryType] = useState("transaction")
  const [selectedCentro, setSelectedCentro] = useState("")
  const [selectedSubcentro, setSelectedSubcentro] = useState("")

  const selectedCentroData = centrosCusto.find(c => c.id === selectedCentro)

  const handleCentroChange = (e) => {
    setSelectedCentro(e.target.value)
    setSelectedSubcentro("") // Reset subcentro quando mudar o centro
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-fyn-text">Tipo de Lançamento</label>
        <div className="flex gap-2">
          {entryTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setEntryType(type.value)}
              className={`rounded border px-3 py-1.5 text-sm ${
                entryType === type.value
                  ? "border-fyn-accent bg-fyn-accent/10 text-fyn-accent"
                  : "border-fyn-border text-fyn-text hover:bg-fyn-surface"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {entryType === "transaction" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-fyn-text">Tipo</label>
              <select className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent">
                <option value="in">Entrada</option>
                <option value="out">Saída</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-fyn-text">Data</label>
              <input
                type="date"
                className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-fyn-text">Valor</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-fyn-text">Número da Fatura</label>
            <label className="mb-1 block text-sm font-medium text-fyn-text">Documento</label>
            <label className="mb-1 block text-sm font-medium text-fyn-text">Descrição</label>
            <input
              type="text"
              placeholder="Descrição do lançamento"
              className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-fyn-text">Centro de Custo/Receita</label>
              <select 
                value={selectedCentro}
                onChange={handleCentroChange}
                className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent"
              >
                <option value="">Selecione o centro...</option>
                {centrosCusto.map((centro) => (
                  <option key={centro.id} value={centro.id}>{centro.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="mb-1 block text-sm font-medium text-fyn-text">Subcentro</label>
              <select 
                value={selectedSubcentro}
                onChange={(e) => setSelectedSubcentro(e.target.value)}
                disabled={!selectedCentro}
                className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Selecione o subcentro...</option>
                {selectedCentroData?.subcentros.map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}

      {entryType === "bill" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-fyn-text">Fornecedor</label>
              <select className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent">
                <option value="">Selecione...</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-fyn-text">Vencimento</label>
              <input
                type="date"
                className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-fyn-text">Valor</label>
            <CurrencyInput
              placeholder="R$ 0,00"
              className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-fyn-text">Documento</label>
            <input
              type="text"
              placeholder="NF, Boleto, etc."
              className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-fyn-text">Centro de Custo/Receita</label>
              <select 
                value={selectedCentro}
                onChange={handleCentroChange}
                className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent"
              >
                <option value="">Selecione o centro...</option>
                {centrosCusto.map((centro) => (
                  <option key={centro.id} value={centro.id}>{centro.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="mb-1 block text-sm font-medium text-fyn-text">Subcentro</label>
              <select 
                value={selectedSubcentro}
                onChange={(e) => setSelectedSubcentro(e.target.value)}
                disabled={!selectedCentro}
                className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Selecione o subcentro...</option>
                {selectedCentroData?.subcentros.map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}

      {entryType === "invoice" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-fyn-text">Cliente</label>
              <select className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent">
                <option value="">Selecione...</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-fyn-text">Vencimento</label>
              <input
                type="date"
                className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-fyn-text">Valor</label>
            <CurrencyInput
              placeholder="R$ 0,00"
              className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-fyn-text">Número da Fatura</label>
            <input
              type="text"
              placeholder="FAT-001"
              className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-fyn-text">Centro de Custo/Receita</label>
              <select 
                value={selectedCentro}
                onChange={handleCentroChange}
                className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent"
              >
                <option value="">Selecione o centro...</option>
                {centrosCusto.map((centro) => (
                  <option key={centro.id} value={centro.id}>{centro.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="mb-1 block text-sm font-medium text-fyn-text">Subcentro</label>
              <select 
                value={selectedSubcentro}
                onChange={(e) => setSelectedSubcentro(e.target.value)}
                disabled={!selectedCentro}
                className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Selecione o subcentro...</option>
                {selectedCentroData?.subcentros.map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
          </div>
        </> 
      )}      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button>Salvar</Button>
      </div>
    </div>
  )
}
