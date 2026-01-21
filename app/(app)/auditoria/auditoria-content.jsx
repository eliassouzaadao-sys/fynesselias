"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Drawer } from "@/components/ui/drawer"
import { formatDateTime } from "@/lib/format"
import { Download, Eye, Filter } from "lucide-react"

const mockAuditLogs = [
  {
    id: "1",
    date: "2026-01-12T14:32:15",
    user: "João Silva",
    action: "Atualizar",
    entityType: "Cliente",
    entityId: "Distribuidora Norte",
    origin: "web",
    before: { creditLimit: 70000 },
    after: { creditLimit: 80000 },
  },
  {
    id: "2",
    date: "2026-01-12T11:20:00",
    user: "Sistema",
    action: "Bloquear",
    entityType: "Cliente",
    entityId: "Comercial Centro",
    origin: "automacao",
    before: { creditBlocked: false },
    after: { creditBlocked: true },
  },
  {
    id: "3",
    date: "2026-01-12T10:45:22",
    user: "Maria Santos",
    action: "Criar",
    entityType: "Lançamento",
    entityId: "TRX-2026-0145",
    origin: "web",
    before: null,
    after: { amount: 4500, type: "in", description: "Venda à vista" },
  },
  {
    id: "4",
    date: "2026-01-12T09:30:00",
    user: "Sistema",
    action: "Importar",
    entityType: "NF-e",
    entityId: "NF-12345",
    origin: "api",
    before: null,
    after: { vendor: "Fornecedor Alpha", amount: 4500 },
  },
  {
    id: "5",
    date: "2026-01-11T16:22:10",
    user: "João Silva",
    action: "Excluir",
    entityType: "Conta a Pagar",
    entityId: "BILL-2024-089",
    origin: "web",
    before: { amount: 1200, vendor: "Fornecedor X" },
    after: null,
  },
  {
    id: "6",
    date: "2026-01-11T14:15:00",
    user: "Sistema",
    action: "Enviar",
    entityType: "Cobrança",
    entityId: "FAT-2025-089",
    origin: "automacao",
    before: { lastContact: null },
    after: { lastContact: "2026-01-11T14:15:00", channel: "whatsapp" },
  },
  {
    id: "7",
    date: "2026-01-11T10:05:33",
    user: "Maria Santos",
    action: "Conciliar",
    entityType: "Transação",
    entityId: "TRX-2026-0142",
    origin: "web",
    before: { reconciled: false },
    after: { reconciled: true, statementLineId: "B3" },
  },
  {
    id: "8",
    date: "2026-01-10T17:30:00",
    user: "João Silva",
    action: "Atualizar",
    entityType: "Configuração",
    entityId: "company-settings",
    origin: "web",
    before: { cashMin: 40000 },
    after: { cashMin: 50000 },
  },
]

const originLabels = {
  web: "Web",
  api: "API",
  whatsapp: "WhatsApp",
  automacao: "Automação",
  sistema: "Sistema",
}

export function AuditoriaContent() {
  const [showDetailDrawer, setShowDetailDrawer] = useState(false)
  const [selectedLog, setSelectedLog] = useState(null)
  const [filters, setFilters] = useState({
    user: "",
    entityType: "",
    action: "",
  })

  const columns = [
    {
      accessorKey: "date",
      header: "Data/Hora",
      cell: ({ row }) => <span className="text-xs font-mono">{formatDateTime(row.original.date)}</span>,
    },
    { accessorKey: "user", header: "Usuário" },
    {
      accessorKey: "action",
      header: "Ação",
      cell: ({ row }) => {
        const colors = {
          Criar: "text-fyn-success",
          Atualizar: "text-fyn-accent",
          Excluir: "text-fyn-danger",
          Bloquear: "text-fyn-danger",
          Conciliar: "text-fyn-success",
          Enviar: "text-fyn-accent",
          Importar: "text-fyn-success",
        }
        return <span className={`font-medium ${colors[row.original.action] || ""}`}>{row.original.action}</span>
      },
    },
    { accessorKey: "entityType", header: "Entidade" },
    { accessorKey: "entityId", header: "ID/Nome" },
    {
      accessorKey: "origin",
      header: "Origem",
      cell: ({ row }) => <span className="text-xs text-fyn-muted">{originLabels[row.original.origin]}</span>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <button
          onClick={() => {
            setSelectedLog(row.original)
            setShowDetailDrawer(true)
          }}
          className="rounded p-1 text-fyn-muted hover:bg-fyn-surface hover:text-fyn-accent"
          title="Ver detalhes"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Auditoria"
        description="Log de todas as ações do sistema"
        actions={
          <Button variant="secondary" size="sm">
            <Download className="mr-1 h-3.5 w-3.5" />
            Exportar
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 rounded border border-fyn-border bg-fyn-surface p-3">
        <Filter className="h-4 w-4 text-fyn-muted" />
        <select
          value={filters.user}
          onChange={(e) => setFilters({ ...filters, user: e.target.value })}
          className="rounded border border-fyn-border bg-fyn-bg px-2 py-1 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none"
        >
          <option value="">Todos os usuários</option>
          <option value="joao">João Silva</option>
          <option value="maria">Maria Santos</option>
          <option value="sistema">Sistema</option>
        </select>
        <select
          value={filters.entityType}
          onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
          className="rounded border border-fyn-border bg-fyn-bg px-2 py-1 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none"
        >
          <option value="">Todas as entidades</option>
          <option value="cliente">Cliente</option>
          <option value="lancamento">Lançamento</option>
          <option value="nfe">NF-e</option>
          <option value="conta">Conta a Pagar</option>
          <option value="fatura">Fatura</option>
        </select>
        <select
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          className="rounded border border-fyn-border bg-fyn-bg px-2 py-1 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none"
        >
          <option value="">Todas as ações</option>
          <option value="criar">Criar</option>
          <option value="atualizar">Atualizar</option>
          <option value="excluir">Excluir</option>
          <option value="conciliar">Conciliar</option>
        </select>
        <input
          type="date"
          className="rounded border border-fyn-border bg-fyn-bg px-2 py-1 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none"
        />
        <button
          onClick={() => setFilters({ user: "", entityType: "", action: "" })}
          className="text-xs text-fyn-accent hover:underline"
        >
          Limpar
        </button>
      </div>

      {/* Audit Log Table */}
      <DataTable data={mockAuditLogs} columns={columns} searchPlaceholder="Buscar no log..." pageSize={15} />

      {/* Detail Drawer */}
      <Drawer isOpen={showDetailDrawer} onClose={() => setShowDetailDrawer(false)} title="Detalhes do Registro">
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded bg-fyn-surface p-2">
                <p className="text-[10px] uppercase text-fyn-muted">Data/Hora</p>
                <p className="text-sm font-mono">{formatDateTime(selectedLog.date)}</p>
              </div>
              <div className="rounded bg-fyn-surface p-2">
                <p className="text-[10px] uppercase text-fyn-muted">Usuário</p>
                <p className="text-sm font-semibold">{selectedLog.user}</p>
              </div>
              <div className="rounded bg-fyn-surface p-2">
                <p className="text-[10px] uppercase text-fyn-muted">Ação</p>
                <p className="text-sm font-semibold">{selectedLog.action}</p>
              </div>
              <div className="rounded bg-fyn-surface p-2">
                <p className="text-[10px] uppercase text-fyn-muted">Origem</p>
                <p className="text-sm">{originLabels[selectedLog.origin]}</p>
              </div>
            </div>

            <div className="rounded bg-fyn-surface p-2">
              <p className="text-[10px] uppercase text-fyn-muted">Entidade</p>
              <p className="text-sm">
                {selectedLog.entityType}: <span className="font-semibold">{selectedLog.entityId}</span>
              </p>
            </div>

            {selectedLog.before && (
              <div>
                <h4 className="mb-1 text-xs font-medium text-fyn-muted">ANTES</h4>
                <pre className="overflow-auto rounded border border-fyn-border bg-fyn-bg p-2 text-xs font-mono text-fyn-text">
                  {JSON.stringify(selectedLog.before, null, 2)}
                </pre>
              </div>
            )}

            {selectedLog.after && (
              <div>
                <h4 className="mb-1 text-xs font-medium text-fyn-muted">DEPOIS</h4>
                <pre className="overflow-auto rounded border border-fyn-border bg-fyn-bg p-2 text-xs font-mono text-fyn-text">
                  {JSON.stringify(selectedLog.after, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}
