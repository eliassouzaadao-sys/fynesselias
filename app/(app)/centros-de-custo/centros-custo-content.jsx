"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { Drawer } from "@/components/ui/drawer"
import { formatCurrency, formatPercentage, formatDate } from "@/lib/format"
import { Plus, Eye, Edit, ToggleLeft } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const mockCenters = [
  {
    id: "1",
    code: "CC001",
    name: "Administrativo",
    custos: 8500,
    percentual: 27.8,
    status: "Ativo",
  },
  {
    id: "2",
    code: "CC002",
    name: "Marketing",
    custos: 4500,
    percentual: 14.7,
    status: "Ativo",
  },
  {
    id: "3",
    code: "CC003",
    name: "TI",
    custos: 3200,
    percentual: 10.5,
    status: "Ativo",
  },
  {
    id: "4",
    code: "CC004",
    name: "RH",
    custos: 2800,
    percentual: 9.2,
    status: "Ativo",
  },
  {
    id: "5",
    code: "CC005",
    name: "Logística",
    custos: 5200,
    percentual: 17.0,
    status: "Ativo",
  },
  {
    id: "6",
    code: "CC006",
    name: "Facilities",
    custos: 6300,
    percentual: 20.6,
    status: "Ativo",
  },
]

const mockEvolution = [
  { mes: "Ago", custos: 28500 },
  { mes: "Set", custos: 29200 },
  { mes: "Out", custos: 27800 },
  { mes: "Nov", custos: 30100 },
  { mes: "Dez", custos: 31500 },
  { mes: "Jan", custos: 30500 },
]

const mockTransactions = [
  { date: "2026-01-12", description: "Venda Cliente ABC", type: "in", amount: 4500 },
  { date: "2026-01-11", description: "Compra Insumos", type: "out", amount: 2800 },
  { date: "2026-01-10", description: "Serviço Prestado", type: "in", amount: 8200 },
  { date: "2026-01-09", description: "Manutenção Equip.", type: "out", amount: 1200 },
  { date: "2026-01-08", description: "Venda Produto B", type: "in", amount: 3500 },
]

export function CentrosCustoContent() {
  const [showDetailDrawer, setShowDetailDrawer] = useState(false)
  const [selectedCenter, setSelectedCenter] = useState(null)

  const totalCustos = mockCenters.reduce((acc, c) => acc + c.custos, 0)

  const columns = [
    { accessorKey: "code", header: "Código" },
    { accessorKey: "name", header: "Centro de Custo" },
    {
      accessorKey: "custos",
      header: "Custos",
      cell: ({ row }) => formatCurrency(row.original.custos),
    },
    {
      accessorKey: "percentual",
      header: "% do Total",
      cell: ({ row }) => formatPercentage(row.original.percentual),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setSelectedCenter(row.original)
              setShowDetailDrawer(true)
            }}
            className="rounded p-1 text-fyn-muted hover:bg-fyn-surface hover:text-fyn-accent"
            title="Ver detalhes"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button className="rounded p-1 text-fyn-muted hover:bg-fyn-surface hover:text-fyn-text" title="Editar">
            <Edit className="h-4 w-4" />
          </button>
          <button
            className="rounded p-1 text-fyn-muted hover:bg-fyn-surface hover:text-fyn-warning"
            title="Ativar/Desativar"
          >
            <ToggleLeft className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Centros de Custo"
        description="Análise de resultado por centro de custo"
        actions={
          <Button size="sm">
            <Plus className="mr-1 h-3.5 w-3.5" />
            Novo Centro
          </Button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded border border-fyn-border bg-fyn-surface p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-fyn-text-muted">Total de Custos</p>
          <p className="mt-1 text-xl font-semibold text-fyn-text">{formatCurrency(totalCustos)}</p>
          <p className="text-xs text-fyn-muted mt-1">Soma de todos os centros</p>
        </div>
        <div className="rounded border border-fyn-border bg-fyn-surface p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-fyn-text-muted">Centros Ativos</p>
          <p className="mt-1 text-xl font-semibold text-fyn-text">{mockCenters.filter(c => c.status === "Ativo").length}</p>
          <p className="text-xs text-fyn-muted mt-1">de {mockCenters.length} cadastrados</p>
        </div>
      </div>

      {/* Centers Table */}
      <DataTable data={mockCenters} columns={columns} searchPlaceholder="Buscar centros de custo..." pageSize={10} />

      {/* Detail Drawer */}
      <Drawer
        isOpen={showDetailDrawer}
        onClose={() => setShowDetailDrawer(false)}
        title={selectedCenter ? `${selectedCenter.code} - ${selectedCenter.name}` : "Detalhes"}
      >
        {selectedCenter && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded bg-fyn-surface p-2">
                <p className="text-[10px] uppercase text-fyn-muted">Custos</p>
                <p className="text-sm font-semibold">{formatCurrency(selectedCenter.custos)}</p>
              </div>
              <div className="rounded bg-fyn-surface p-2">
                <p className="text-[10px] uppercase text-fyn-muted">% do Total</p>
                <p className="text-sm font-semibold">{formatPercentage(selectedCenter.percentual)}</p>
              </div>
            </div>

            {/* Evolution Chart */}
            <div>
              <h3 className="mb-2 text-sm font-medium text-fyn-text">Evolução Mensal de Custos</h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockEvolution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--fyn-border)" />
                    <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "var(--fyn-muted)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--fyn-muted)" }} tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip
                      contentStyle={{
                        fontSize: 11,
                        backgroundColor: "var(--fyn-bg)",
                        border: "1px solid var(--fyn-border)",
                      }}
                      formatter={(v) => formatCurrency(v)}
                    />
                    <Line type="monotone" dataKey="custos" stroke="var(--fyn-danger)" strokeWidth={2} name="Custos" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Transactions */}
            <div>
              <h3 className="mb-2 text-sm font-medium text-fyn-text">Últimos Lançamentos</h3>
              <div className="space-y-1">
                {mockTransactions.map((t, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded border border-fyn-border bg-fyn-bg p-2"
                  >
                    <div>
                      <p className="text-sm text-fyn-text">{t.description}</p>
                      <p className="text-xs text-fyn-muted">{formatDate(t.date)}</p>
                    </div>
                    <span className={`text-sm font-medium ${t.type === "in" ? "text-fyn-success" : "text-fyn-danger"}`}>
                      {t.type === "in" ? "+" : "-"}
                      {formatCurrency(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
