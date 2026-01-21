"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { KpiCard } from "@/components/ui/kpi-card"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { Drawer } from "@/components/ui/drawer"
import { formatCurrency, formatDate } from "@/lib/format"
import { Plus, Download, MessageCircle, CheckCircle, Calendar, Eye } from "lucide-react"

const mockInvoices = [
  {
    id: "1",
    dueDate: "2026-01-15",
    clienteFornecedor: "Distribuidora Norte",
    tipo: "Cliente",
    invoice: "FAT-2026-001",
    amount: 15000,
    status: "Pendente",
    diasAtraso: 0,
    channel: "boleto",
  },
  {
    id: "2",
    dueDate: "2025-12-15",
    clienteFornecedor: "Atacadão Sul",
    tipo: "Cliente",
    invoice: "FAT-2025-089",
    amount: 28000,
    status: "Vencido",
    diasAtraso: 28,
    channel: "boleto",
  },
  {
    id: "3",
    dueDate: "2025-11-28",
    clienteFornecedor: "Comercial Centro",
    tipo: "Cliente",
    invoice: "FAT-2025-082",
    amount: 22000,
    status: "Vencido",
    diasAtraso: 45,
    channel: "email",
  },
  {
    id: "4",
    dueDate: "2026-01-20",
    clienteFornecedor: "Fornecedor Alpha",
    tipo: "Fornecedor",
    invoice: "CRED-2026-001",
    amount: 3500,
    status: "Pendente",
    diasAtraso: 0,
    channel: "manual",
    observacao: "Crédito por devolução de mercadoria",
  },
  {
    id: "5",
    dueDate: "2026-01-04",
    clienteFornecedor: "Mercado Bom Preço",
    tipo: "Cliente",
    invoice: "FAT-2025-095",
    amount: 12500,
    status: "Vencido",
    diasAtraso: 8,
    channel: "boleto",
  },
  {
    id: "6",
    dueDate: "2026-01-10",
    clienteFornecedor: "Supermercado Estrela",
    tipo: "Cliente",
    invoice: "FAT-2026-003",
    amount: 8000,
    status: "Pago",
    diasAtraso: 0,
    channel: "pix",
  },
  {
    id: "7",
    dueDate: "2026-01-18",
    clienteFornecedor: "Distribuidora Beta",
    tipo: "Fornecedor",
    invoice: "CRED-2026-002",
    amount: 1200,
    status: "Pendente",
    diasAtraso: 0,
    channel: "manual",
    observacao: "Bonificação contratual",
  },
  {
    id: "8",
    dueDate: "2026-01-12",
    clienteFornecedor: "Comércio Irmãos Silva",
    tipo: "Cliente",
    invoice: "FAT-2026-004",
    amount: 6000,
    status: "Pendente",
    diasAtraso: 0,
    channel: "email",
  },
]

const mockEvents = [
  { date: "2026-01-10", type: "Cobrança enviada", description: "E-mail de cobrança enviado" },
  { date: "2026-01-05", type: "WhatsApp", description: "Mensagem de lembrete enviada" },
  { date: "2025-12-20", type: "Fatura emitida", description: "Fatura criada e enviada por e-mail" },
]

const channelLabels = {
  email: "E-mail",
  whatsapp: "WhatsApp",
  boleto: "Boleto",
  pix: "PIX",
  manual: "Manual",
}

export function ReceberContent() {
  const [showDetailDrawer, setShowDetailDrawer] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)

  const kpis = {
    totalReceber: 96200,
    vencido: 62500,
    aVencer: 33700,
    recebidoMes: 8000,
  }

  const columns = [
    {
      accessorKey: "dueDate",
      header: "Vencimento",
      cell: ({ row }) => formatDate(row.original.dueDate),
    },
    {
      accessorKey: "clienteFornecedor",
      header: "Cliente/Fornecedor",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span>{row.original.clienteFornecedor}</span>
          <span className={`text-[10px] ${row.original.tipo === "Fornecedor" ? "text-fyn-accent" : "text-fyn-muted"}`}>
            {row.original.tipo}
          </span>
        </div>
      ),
    },
    { accessorKey: "invoice", header: "Documento" },
    {
      accessorKey: "amount",
      header: "Valor",
      cell: ({ row }) => formatCurrency(row.original.amount),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "diasAtraso",
      header: "Dias Atraso",
      cell: ({ row }) => (
        <span className={row.original.diasAtraso > 15 ? "font-medium text-fyn-danger" : ""}>
          {row.original.diasAtraso > 0 ? `${row.original.diasAtraso}d` : "-"}
        </span>
      ),
    },
    {
      accessorKey: "channel",
      header: "Canal",
      cell: ({ row }) => <span className="text-xs text-fyn-muted">{channelLabels[row.original.channel]}</span>,
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {row.original.status !== "Pago" && (
            <>
              {row.original.tipo === "Cliente" && (
                <button
                  className="rounded p-1 text-fyn-muted hover:bg-fyn-surface hover:text-fyn-success"
                  title="Cobrar via WhatsApp"
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
              )}
              <button
                className="rounded p-1 text-fyn-muted hover:bg-fyn-surface hover:text-fyn-success"
                title="Registrar pagamento"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
              <button
                className="rounded p-1 text-fyn-muted hover:bg-fyn-surface hover:text-fyn-warning"
                title="Ajustar vencimento"
              >
                <Calendar className="h-4 w-4" />
              </button>
            </>
          )}
          <button
            onClick={() => {
              setSelectedInvoice(row.original)
              setShowDetailDrawer(true)
            }}
            className="rounded p-1 text-fyn-muted hover:bg-fyn-surface hover:text-fyn-accent"
            title="Detalhes"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Contas a Receber"
        description="Gestão de recebimentos de clientes e fornecedores"
        actions={
          <>
            <Button variant="secondary" size="sm">
              <Download className="mr-1 h-3.5 w-3.5" />
              Exportar
            </Button>
            <Button size="sm">
              <Plus className="mr-1 h-3.5 w-3.5" />
              Novo Recebível
            </Button>
          </>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Total a Receber" value={formatCurrency(kpis.totalReceber)} />
        <KpiCard label="Vencido" value={formatCurrency(kpis.vencido)} variant="danger" />
        <KpiCard label="A Vencer" value={formatCurrency(kpis.aVencer)} variant="warning" />
        <KpiCard label="Recebido (Mês)" value={formatCurrency(kpis.recebidoMes)} variant="success" />
      </div>

      {/* Invoices Table */}
      <DataTable data={mockInvoices} columns={columns} searchPlaceholder="Buscar recebíveis..." pageSize={10} />

      {/* Detail Drawer */}
      <Drawer
        isOpen={showDetailDrawer}
        onClose={() => setShowDetailDrawer(false)}
        title={`Recebível - ${selectedInvoice?.invoice || ""}`}
      >
        {selectedInvoice && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded bg-fyn-surface p-2">
                <p className="text-[10px] uppercase text-fyn-muted">
                  {selectedInvoice.tipo === "Fornecedor" ? "Fornecedor" : "Cliente"}
                </p>
                <p className="text-sm font-semibold">{selectedInvoice.clienteFornecedor}</p>
              </div>
              <div className="rounded bg-fyn-surface p-2">
                <p className="text-[10px] uppercase text-fyn-muted">Valor</p>
                <p className="text-sm font-semibold">{formatCurrency(selectedInvoice.amount)}</p>
              </div>
              <div className="rounded bg-fyn-surface p-2">
                <p className="text-[10px] uppercase text-fyn-muted">Vencimento</p>
                <p className="text-sm font-semibold">{formatDate(selectedInvoice.dueDate)}</p>
              </div>
              <div className="rounded bg-fyn-surface p-2">
                <p className="text-[10px] uppercase text-fyn-muted">Status</p>
                <StatusBadge status={selectedInvoice.status} />
              </div>
            </div>

            {selectedInvoice.observacao && (
              <div className="rounded-lg border border-fyn-border bg-fyn-surface p-3">
                <p className="text-xs text-fyn-muted">Observação</p>
                <p className="text-sm text-fyn-text">{selectedInvoice.observacao}</p>
              </div>
            )}

            {/* Régua de Cobrança - apenas para clientes */}
            {selectedInvoice.tipo === "Cliente" && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-fyn-text">Régua de Cobrança</h3>
                <div className="space-y-1">
                  {mockEvents.map((event, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 rounded border border-fyn-border bg-fyn-surface p-2"
                    >
                      <div className="mt-0.5 h-2 w-2 rounded-full bg-fyn-accent" />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="text-xs font-medium text-fyn-text">{event.type}</span>
                          <span className="text-xs text-fyn-muted">{formatDate(event.date)}</span>
                        </div>
                        <p className="text-xs text-fyn-muted">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedInvoice.status !== "Pago" && (
              <div className="flex gap-2 pt-2">
                {selectedInvoice.tipo === "Cliente" && (
                  <Button size="sm" className="flex-1">
                    <MessageCircle className="mr-1 h-3.5 w-3.5" />
                    Cobrar
                  </Button>
                )}
                <Button variant="secondary" size="sm" className="flex-1">
                  <CheckCircle className="mr-1 h-3.5 w-3.5" />
                  Registrar Pagamento
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}
