"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { KpiCard } from "@/components/ui/kpi-card"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { formatCurrency, formatDate } from "@/lib/format"
import { Plus, AlertTriangle } from "lucide-react"

const mockEvents = [
  { id: "1", date: "2026-01-05", partner: "João Silva", type: "Pró-labore", amount: 8000, status: "Pago" },
  { id: "2", date: "2026-01-10", partner: "Maria Santos", type: "Retirada", amount: 5000, status: "Pendente" },
  { id: "3", date: "2025-12-28", partner: "João Silva", type: "Reembolso", amount: 1200, status: "Pago" },
  { id: "4", date: "2025-12-05", partner: "João Silva", type: "Pró-labore", amount: 8000, status: "Pago" },
  { id: "5", date: "2025-12-05", partner: "Maria Santos", type: "Pró-labore", amount: 6000, status: "Pago" },
  { id: "6", date: "2025-11-20", partner: "Maria Santos", type: "Aporte", amount: 15000, status: "Confirmado" },
  { id: "7", date: "2025-11-05", partner: "João Silva", type: "Pró-labore", amount: 8000, status: "Pago" },
]

const mockPartners = [
  { name: "João Silva", participacao: 60, prolabore: 8000, retiradas: 1200, total: 9200 },
  { name: "Maria Santos", participacao: 40, prolabore: 6000, retiradas: 5000, total: 11000 },
]

export function SociosContent() {
  const [showNewModal, setShowNewModal] = useState(false)

  const kpis = {
    prolaboreMes: 14000,
    retiradasMes: 6200,
    limiteRetirada: 20000,
    caixaMinimo: 50000,
  }

  const caixaAtual = 127450.32
  const margemDisponivel = caixaAtual - kpis.caixaMinimo - kpis.retiradasMes
  const alertaRetirada = margemDisponivel < 30000

  const columns = [
    {
      accessorKey: "date",
      header: "Data",
      cell: ({ row }) => formatDate(row.original.date),
    },
    { accessorKey: "partner", header: "Sócio" },
    { accessorKey: "type", header: "Tipo" },
    {
      accessorKey: "amount",
      header: "Valor",
      cell: ({ row }) => {
        const isPositive = row.original.type === "Aporte"
        return (
          <span className={isPositive ? "text-fyn-success" : ""}>
            {isPositive ? "+" : ""}
            {formatCurrency(row.original.amount)}
          </span>
        )
      },
    },
    { accessorKey: "status", header: "Status" },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Sócios"
        description="Gestão de pró-labore, retiradas e aportes"
        actions={
          <Button size="sm" onClick={() => setShowNewModal(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Novo Evento
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Pró-labore (Mês)" value={formatCurrency(kpis.prolaboreMes)} />
        <KpiCard label="Retiradas (Mês)" value={formatCurrency(kpis.retiradasMes)} variant="accent" />
        <KpiCard label="Limite Retirada" value={formatCurrency(kpis.limiteRetirada)} />
        <KpiCard label="Caixa Mínimo" value={formatCurrency(kpis.caixaMinimo)} />
      </div>

      {/* Alert */}
      {alertaRetirada && (
        <div className="flex items-start gap-3 rounded border border-fyn-warning/30 bg-fyn-warning/10 p-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-fyn-warning" />
          <div>
            <p className="text-sm font-medium text-fyn-text">Sistema detectou risco de violação do caixa mínimo</p>
            <p className="text-sm text-fyn-muted">
              Se retirar mais R$ 30.000,00, o caixa ficará abaixo do limite seguro de {formatCurrency(kpis.caixaMinimo)}
              .
            </p>
          </div>
        </div>
      )}

      {/* Partners Summary */}
      <div className="rounded border border-fyn-border bg-fyn-bg p-3">
        <h3 className="mb-2 text-sm font-medium text-fyn-text">Resumo por Sócio (Mês Atual)</h3>
        <table className="fyn-table w-full">
          <thead>
            <tr className="border-b border-fyn-border">
              <th className="py-2 text-left text-xs text-fyn-muted">Sócio</th>
              <th className="py-2 text-right text-xs text-fyn-muted">Participação</th>
              <th className="py-2 text-right text-xs text-fyn-muted">Pró-labore</th>
              <th className="py-2 text-right text-xs text-fyn-muted">Retiradas</th>
              <th className="py-2 text-right text-xs text-fyn-muted">Total</th>
            </tr>
          </thead>
          <tbody>
            {mockPartners.map((p, idx) => (
              <tr key={idx} className="border-b border-fyn-border last:border-0">
                <td className="py-2 text-sm">{p.name}</td>
                <td className="py-2 text-right text-sm">{p.participacao}%</td>
                <td className="py-2 text-right text-sm">{formatCurrency(p.prolabore)}</td>
                <td className="py-2 text-right text-sm">{formatCurrency(p.retiradas)}</td>
                <td className="py-2 text-right text-sm font-medium">{formatCurrency(p.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Events Table */}
      <DataTable data={mockEvents} columns={columns} searchPlaceholder="Buscar eventos..." pageSize={10} />

      {/* New Event Modal */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="Novo Evento" size="sm">
        <form className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-fyn-text">Sócio</label>
            <select className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent">
              <option value="">Selecione...</option>
              <option value="joao">João Silva</option>
              <option value="maria">Maria Santos</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-fyn-text">Tipo</label>
            <select className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent">
              <option value="prolabore">Pró-labore</option>
              <option value="retirada">Retirada</option>
              <option value="reembolso">Reembolso</option>
              <option value="aporte">Aporte</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-fyn-text">Valor</label>
            <input
              type="number"
              step="0.01"
              placeholder="0,00"
              className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-fyn-text">Data</label>
            <input
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowNewModal(false)}>
              Cancelar
            </Button>
            <Button>Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
