"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { KpiCard } from "@/components/ui/kpi-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/format"
import { Check, X, Plus, Link2, AlertTriangle } from "lucide-react"

const mockBankLines = [
  {
    id: "B1",
    date: "2026-01-12",
    description: "TED Recebida - Cliente ABC",
    amount: 4500,
    status: "pendente",
    matchId: null,
  },
  {
    id: "B2",
    date: "2026-01-12",
    description: "Pagamento Boleto - Fornecedor X",
    amount: -2800,
    status: "conciliado",
    matchId: "T2",
  },
  { id: "B3", date: "2026-01-11", description: "PIX Recebido", amount: 8200, status: "conciliado", matchId: "T3" },
  {
    id: "B4",
    date: "2026-01-11",
    description: "Débito Automático Energia",
    amount: -1250,
    status: "divergente",
    matchId: null,
  },
  { id: "B5", date: "2026-01-10", description: "Depósito em Conta", amount: 12300, status: "pendente", matchId: null },
  { id: "B6", date: "2026-01-10", description: "Tarifa Bancária", amount: -45, status: "pendente", matchId: null },
  {
    id: "B7",
    date: "2026-01-09",
    description: "TED Enviada - Aluguel",
    amount: -3500,
    status: "conciliado",
    matchId: "T7",
  },
]

const mockTransactions = [
  { id: "T1", date: "2026-01-12", description: "Venda à vista - Cliente ABC", amount: 4500, matchConfidence: 95 },
  { id: "T2", date: "2026-01-12", description: "Pagamento Fornecedor XYZ", amount: -2800, matchConfidence: null },
  { id: "T3", date: "2026-01-11", description: "Recebimento Fatura #2024", amount: 8200, matchConfidence: null },
  { id: "T4", date: "2026-01-11", description: "Energia Elétrica", amount: -1350, matchConfidence: 72 },
  { id: "T5", date: "2026-01-10", description: "Venda Produto A", amount: 12300, matchConfidence: 88 },
  { id: "T7", date: "2026-01-09", description: "Aluguel Escritório", amount: -3500, matchConfidence: null },
]

export function ConciliacaoContent() {
  const [selectedBank, setSelectedBank] = useState(null)
  const [selectedTransaction, setSelectedTransaction] = useState(null)

  const kpis = {
    totalLinhas: 7,
    conciliadas: 3,
    pendentes: 3,
    divergentes: 1,
  }

  const getStatusStyle = (status) => {
    switch (status) {
      case "conciliado":
        return "border-l-4 border-l-fyn-success bg-fyn-success/5"
      case "divergente":
        return "border-l-4 border-l-fyn-danger bg-fyn-danger/5"
      default:
        return "border-l-4 border-l-fyn-warning bg-fyn-surface"
    }
  }

  const handleMatch = () => {
    if (selectedBank && selectedTransaction) {
      // Mock match action
      alert(`Conciliando: ${selectedBank.description} com ${selectedTransaction.description}`)
      setSelectedBank(null)
      setSelectedTransaction(null)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Conferir Extratos Bancários" description="Compare seus extratos bancários com os lançamentos do sistema e veja se está tudo certo." />

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Total Linhas" value={kpis.totalLinhas} />
        <KpiCard label="Conciliadas" value={kpis.conciliadas} variant="success" />
        <KpiCard label="Pendentes" value={kpis.pendentes} variant="warning" />
        <KpiCard label="Divergentes" value={kpis.divergentes} variant="danger" />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Bank Statement Column */}
        <div className="rounded border border-fyn-border bg-fyn-bg">
          <div className="flex items-center justify-between border-b border-fyn-border bg-fyn-surface px-3 py-2">
            <h2 className="text-sm font-medium text-fyn-text">Extrato Bancário</h2>
            <span className="text-xs text-fyn-muted">Banco Mock</span>
          </div>
          <div className="max-h-[500px] overflow-y-auto p-2">
            <div className="space-y-1">
              {mockBankLines.map((line) => (
                <div
                  key={line.id}
                  onClick={() => line.status === "pendente" && setSelectedBank(line)}
                  className={`cursor-pointer rounded border border-fyn-border p-2 transition-colors ${getStatusStyle(line.status)} ${
                    selectedBank?.id === line.id ? "ring-2 ring-fyn-accent" : ""
                  } ${line.status !== "pendente" ? "cursor-default opacity-70" : "hover:border-fyn-accent"}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-fyn-text">{line.description}</p>
                      <p className="text-xs text-fyn-muted">{formatDate(line.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${line.amount > 0 ? "text-fyn-success" : "text-fyn-danger"}`}>
                        {line.amount > 0 ? "+" : ""}
                        {formatCurrency(line.amount)}
                      </p>
                      <StatusBadge
                        status={
                          line.status === "conciliado"
                            ? "Conciliado"
                            : line.status === "divergente"
                              ? "Divergente"
                              : "Pendente"
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transactions Column */}
        <div className="rounded border border-fyn-border bg-fyn-bg">
          <div className="flex items-center justify-between border-b border-fyn-border bg-fyn-surface px-3 py-2">
            <h2 className="text-sm font-medium text-fyn-text">Lançamentos</h2>
            <Button size="sm" variant="secondary">
              <Plus className="mr-1 h-3 w-3" />
              Novo
            </Button>
          </div>
          <div className="max-h-[500px] overflow-y-auto p-2">
            <div className="space-y-1">
              {mockTransactions.map((t) => {
                const isMatched = mockBankLines.some((b) => b.matchId === t.id)
                return (
                  <div
                    key={t.id}
                    onClick={() => !isMatched && setSelectedTransaction(t)}
                    className={`cursor-pointer rounded border border-fyn-border p-2 transition-colors ${
                      isMatched
                        ? "border-l-4 border-l-fyn-success bg-fyn-success/5 opacity-70 cursor-default"
                        : "bg-fyn-surface hover:border-fyn-accent"
                    } ${selectedTransaction?.id === t.id ? "ring-2 ring-fyn-accent" : ""}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-fyn-text">{t.description}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-fyn-muted">{formatDate(t.date)}</p>
                          {t.matchConfidence && (
                            <span
                              className={`text-xs ${t.matchConfidence >= 90 ? "text-fyn-success" : "text-fyn-warning"}`}
                            >
                              Match: {t.matchConfidence}%
                            </span>
                          )}
                        </div>
                      </div>
                      <p className={`text-sm font-medium ${t.amount > 0 ? "text-fyn-success" : "text-fyn-danger"}`}>
                        {t.amount > 0 ? "+" : ""}
                        {formatCurrency(t.amount)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      {(selectedBank || selectedTransaction) && (
        <div className="flex items-center justify-between rounded border border-fyn-accent bg-fyn-accent/5 p-3">
          <div className="flex items-center gap-4">
            {selectedBank && (
              <div>
                <p className="text-xs text-fyn-muted">Extrato selecionado:</p>
                <p className="text-sm font-medium text-fyn-text">{selectedBank.description}</p>
              </div>
            )}
            {selectedBank && selectedTransaction && <Link2 className="h-4 w-4 text-fyn-accent" />}
            {selectedTransaction && (
              <div>
                <p className="text-xs text-fyn-muted">Lançamento selecionado:</p>
                <p className="text-sm font-medium text-fyn-text">{selectedTransaction.description}</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSelectedBank(null)
                setSelectedTransaction(null)
              }}
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Cancelar
            </Button>
            {selectedBank && selectedTransaction && (
              <Button size="sm" onClick={handleMatch}>
                <Check className="mr-1 h-3.5 w-3.5" />
                Confirmar Conciliação
              </Button>
            )}
            {selectedBank && !selectedTransaction && (
              <Button size="sm" variant="secondary">
                <Plus className="mr-1 h-3.5 w-3.5" />
                Criar Lançamento
              </Button>
            )}
            {selectedBank && (
              <Button size="sm" variant="danger">
                <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                Marcar Divergência
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
