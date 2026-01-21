"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { formatDateTime } from "@/lib/format"
import { Plus, Play, Pause, Edit, Trash2 } from "lucide-react"

const mockRules = [
  {
    id: "1",
    name: "Cobrança automática 3 dias após vencimento",
    condition: "Fatura vencida há 3 dias",
    action: "Enviar mensagem WhatsApp",
    status: "Ativo",
    lastRun: "2026-01-12T10:30:00",
    runCount: 15,
  },
  {
    id: "2",
    name: "Alerta caixa mínimo",
    condition: "Saldo < R$ 50.000",
    action: "Notificar administrador",
    status: "Ativo",
    lastRun: "2026-01-11T14:22:00",
    runCount: 3,
  },
  {
    id: "3",
    name: "Bloqueio automático de crédito",
    condition: "Atraso > 30 dias",
    action: "Bloquear crédito do cliente",
    status: "Ativo",
    lastRun: "2026-01-10T08:15:00",
    runCount: 8,
  },
  {
    id: "4",
    name: "Categorização automática NF-e",
    condition: "Nova NF-e recebida",
    action: "Classificar por centro de custo",
    status: "Ativo",
    lastRun: "2026-01-12T09:45:00",
    runCount: 42,
  },
  {
    id: "5",
    name: "Lembrete pró-labore",
    condition: "Dia 5 do mês",
    action: "Criar lançamento pró-labore",
    status: "Inativo",
    lastRun: "2025-12-05T08:00:00",
    runCount: 12,
  },
]

const mockLogs = [
  {
    id: "1",
    date: "2026-01-12T10:30:00",
    rule: "Cobrança automática",
    action: "Enviar WhatsApp",
    result: "Executado",
    details: "Mensagem enviada para Distribuidora Norte",
  },
  {
    id: "2",
    date: "2026-01-12T09:45:00",
    rule: "Categorização NF-e",
    action: "Classificar",
    result: "Executado",
    details: "NF-e 12345 classificada como Operações",
  },
  {
    id: "3",
    date: "2026-01-11T14:22:00",
    rule: "Alerta caixa mínimo",
    action: "Notificar",
    result: "Executado",
    details: "E-mail enviado para admin@empresa.com",
  },
  {
    id: "4",
    date: "2026-01-10T08:15:00",
    rule: "Bloqueio de crédito",
    action: "Bloquear",
    result: "Executado",
    details: "Cliente Comercial Centro bloqueado",
  },
  {
    id: "5",
    date: "2026-01-09T16:00:00",
    rule: "Cobrança automática",
    action: "Enviar WhatsApp",
    result: "Erro",
    details: "Falha: número inválido",
  },
]

export function AutomacaoContent() {
  const [showNewModal, setShowNewModal] = useState(false)

  const rulesColumns = [
    { accessorKey: "name", header: "Regra" },
    { accessorKey: "condition", header: "Condição (SE)" },
    { accessorKey: "action", header: "Ação (ENTÃO)" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "lastRun",
      header: "Última Execução",
      cell: ({ row }) => <span className="text-xs text-fyn-muted">{formatDateTime(row.original.lastRun)}</span>,
    },
    {
      accessorKey: "runCount",
      header: "Execuções",
      cell: ({ row }) => <span className="text-xs">{row.original.runCount}x</span>,
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button
            className="rounded p-1 text-fyn-muted hover:bg-fyn-surface hover:text-fyn-text"
            title={row.original.status === "Ativo" ? "Pausar" : "Ativar"}
          >
            {row.original.status === "Ativo" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button className="rounded p-1 text-fyn-muted hover:bg-fyn-surface hover:text-fyn-text" title="Editar">
            <Edit className="h-4 w-4" />
          </button>
          <button className="rounded p-1 text-fyn-muted hover:bg-fyn-surface hover:text-fyn-danger" title="Excluir">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  const logsColumns = [
    {
      accessorKey: "date",
      header: "Data/Hora",
      cell: ({ row }) => <span className="text-xs">{formatDateTime(row.original.date)}</span>,
    },
    { accessorKey: "rule", header: "Regra" },
    { accessorKey: "action", header: "Ação" },
    {
      accessorKey: "result",
      header: "Resultado",
      cell: ({ row }) => <StatusBadge status={row.original.result} />,
    },
    {
      accessorKey: "details",
      header: "Detalhes",
      cell: ({ row }) => <span className="text-xs text-fyn-muted">{row.original.details}</span>,
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Automação"
        description="Regras de automação IF/THEN"
        actions={
          <Button size="sm" onClick={() => setShowNewModal(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Nova Regra
          </Button>
        }
      />

      {/* Rules Table */}
      <div className="rounded border border-fyn-border bg-fyn-bg p-3">
        <h3 className="mb-2 text-sm font-medium text-fyn-text">Regras Configuradas</h3>
        <DataTable data={mockRules} columns={rulesColumns} showSearch={false} pageSize={5} />
      </div>

      {/* Logs Table */}
      <div className="rounded border border-fyn-border bg-fyn-bg p-3">
        <h3 className="mb-2 text-sm font-medium text-fyn-text">Log de Execuções</h3>
        <DataTable data={mockLogs} columns={logsColumns} searchPlaceholder="Buscar logs..." pageSize={10} />
      </div>

      {/* New Rule Modal */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="Nova Regra de Automação" size="lg">
        <form className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-fyn-text">Nome da Regra</label>
            <input
              type="text"
              placeholder="Ex: Cobrança automática após vencimento"
              className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent"
            />
          </div>

          <div className="rounded border border-fyn-border bg-fyn-surface p-3">
            <h4 className="mb-2 text-sm font-medium text-fyn-text">SE (Condição)</h4>
            <div className="grid grid-cols-3 gap-2">
              <select className="rounded border border-fyn-border bg-fyn-bg px-2 py-1.5 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none">
                <option value="">Selecione campo...</option>
                <option value="fatura.diasAtraso">Dias de atraso da fatura</option>
                <option value="caixa.saldo">Saldo do caixa</option>
                <option value="cliente.score">Score do cliente</option>
                <option value="nfe.recebida">NF-e recebida</option>
                <option value="data.dia">Dia do mês</option>
              </select>
              <select className="rounded border border-fyn-border bg-fyn-bg px-2 py-1.5 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none">
                <option value="">Operador...</option>
                <option value="gt">Maior que</option>
                <option value="lt">Menor que</option>
                <option value="eq">Igual a</option>
                <option value="gte">Maior ou igual</option>
                <option value="lte">Menor ou igual</option>
              </select>
              <input
                type="text"
                placeholder="Valor"
                className="rounded border border-fyn-border bg-fyn-bg px-2 py-1.5 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded border border-fyn-border bg-fyn-surface p-3">
            <h4 className="mb-2 text-sm font-medium text-fyn-text">ENTÃO (Ação)</h4>
            <div className="grid grid-cols-2 gap-2">
              <select className="rounded border border-fyn-border bg-fyn-bg px-2 py-1.5 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none">
                <option value="">Selecione ação...</option>
                <option value="whatsapp">Enviar mensagem WhatsApp</option>
                <option value="email">Enviar e-mail</option>
                <option value="bloquear">Bloquear crédito</option>
                <option value="notificar">Notificar administrador</option>
                <option value="classificar">Classificar lançamento</option>
                <option value="criar">Criar lançamento</option>
              </select>
              <input
                type="text"
                placeholder="Parâmetros (opcional)"
                className="rounded border border-fyn-border bg-fyn-bg px-2 py-1.5 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowNewModal(false)}>
              Cancelar
            </Button>
            <Button>Salvar Regra</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
