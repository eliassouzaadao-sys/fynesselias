"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { KpiCard } from "@/components/ui/kpi-card"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Drawer } from "@/components/ui/drawer"
import { formatCurrency, formatDate } from "@/lib/format"
import { Plus, Eye, Edit, CreditCard, Landmark, BadgePercent, Calendar, TrendingDown } from "lucide-react"

const mockCreditos = [
  {
    id: "1",
    tipo: "Cartão de Crédito",
    banco: "Banco do Brasil",
    limite: 50000,
    utilizado: 32500,
    disponivel: 17500,
    vencimentoFatura: "2026-01-25",
    taxaJuros: 12.5,
    status: "Ativo",
  },
  {
    id: "2",
    tipo: "Cartão de Crédito",
    banco: "Itaú Empresas",
    limite: 80000,
    utilizado: 45000,
    disponivel: 35000,
    vencimentoFatura: "2026-01-20",
    taxaJuros: 10.8,
    status: "Ativo",
  },
  {
    id: "3",
    tipo: "Empréstimo",
    banco: "Bradesco",
    limite: 200000,
    utilizado: 200000,
    disponivel: 0,
    parcelas: "24/36",
    valorParcela: 9800,
    vencimentoParcela: "2026-01-15",
    taxaJuros: 1.89,
    status: "Em Dia",
  },
  {
    id: "4",
    tipo: "FGI PRONAMP",
    banco: "BNDES via BB",
    limite: 500000,
    utilizado: 350000,
    disponivel: 150000,
    parcelas: "12/48",
    valorParcela: 12500,
    vencimentoParcela: "2026-01-10",
    taxaJuros: 0.85,
    status: "Em Dia",
  },
  {
    id: "5",
    tipo: "Cheque Especial",
    banco: "Santander",
    limite: 30000,
    utilizado: 0,
    disponivel: 30000,
    taxaJuros: 8.5,
    status: "Disponível",
  },
  {
    id: "6",
    tipo: "Capital de Giro",
    banco: "Caixa",
    limite: 150000,
    utilizado: 150000,
    disponivel: 0,
    parcelas: "6/24",
    valorParcela: 7200,
    vencimentoParcela: "2026-01-18",
    taxaJuros: 1.45,
    status: "Em Dia",
  },
  {
    id: "7",
    tipo: "Antecipação Recebíveis",
    banco: "Itaú Empresas",
    limite: 100000,
    utilizado: 65000,
    disponivel: 35000,
    taxaJuros: 2.1,
    status: "Ativo",
  },
  {
    id: "8",
    tipo: "Cartão de Crédito",
    banco: "Sicredi",
    limite: 25000,
    utilizado: 8500,
    disponivel: 16500,
    vencimentoFatura: "2026-01-28",
    taxaJuros: 11.2,
    status: "Ativo",
  },
]

const mockHistorico = [
  { date: "2026-01-10", acao: "Pagamento parcela", credito: "FGI PRONAMP - BNDES", valor: 12500 },
  { date: "2026-01-05", acao: "Fatura cartão paga", credito: "Cartão BB", valor: 28000 },
  { date: "2025-12-20", acao: "Novo empréstimo", credito: "Capital de Giro - Caixa", valor: 150000 },
  { date: "2025-12-15", acao: "Antecipação", credito: "Antecipação - Itaú", valor: 45000 },
]

const tipoIcons = {
  "Cartão de Crédito": CreditCard,
  Empréstimo: Landmark,
  "FGI PRONAMP": BadgePercent,
  "Cheque Especial": TrendingDown,
  "Capital de Giro": Landmark,
  "Antecipação Recebíveis": Calendar,
}

export function CreditosContent() {
  const [showNovoModal, setShowNovoModal] = useState(false)
  const [showDetailDrawer, setShowDetailDrawer] = useState(false)
  const [selectedCredito, setSelectedCredito] = useState(null)

  const kpis = {
    limiteTotal: mockCreditos.reduce((acc, c) => acc + c.limite, 0),
    utilizado: mockCreditos.reduce((acc, c) => acc + c.utilizado, 0),
    disponivel: mockCreditos.reduce((acc, c) => acc + c.disponivel, 0),
    parcelasMes: mockCreditos.filter((c) => c.valorParcela).reduce((acc, c) => acc + c.valorParcela, 0),
  }

  const columns = [
    {
      accessorKey: "tipo",
      header: "Tipo",
      cell: ({ row }) => {
        const Icon = tipoIcons[row.original.tipo] || Landmark
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-fyn-muted" />
            <span>{row.original.tipo}</span>
          </div>
        )
      },
    },
    { accessorKey: "banco", header: "Banco" },
    {
      accessorKey: "limite",
      header: "Limite",
      cell: ({ row }) => formatCurrency(row.original.limite),
    },
    {
      accessorKey: "utilizado",
      header: "Utilizado",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span>{formatCurrency(row.original.utilizado)}</span>
          <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-fyn-border">
            <div
              className="h-full rounded-full bg-fyn-accent"
              style={{ width: `${(row.original.utilizado / row.original.limite) * 100}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      accessorKey: "disponivel",
      header: "Disponível",
      cell: ({ row }) => (
        <span className={row.original.disponivel > 0 ? "text-fyn-success" : "text-fyn-muted"}>
          {formatCurrency(row.original.disponivel)}
        </span>
      ),
    },
    {
      accessorKey: "taxaJuros",
      header: "Taxa a.m.",
      cell: ({ row }) => <span className="text-xs">{row.original.taxaJuros}%</span>,
    },
    {
      accessorKey: "parcelas",
      header: "Parcelas",
      cell: ({ row }) =>
        row.original.parcelas ? (
          <div className="flex flex-col text-xs">
            <span>{row.original.parcelas}</span>
            <span className="text-fyn-muted">{formatCurrency(row.original.valorParcela)}/mês</span>
          </div>
        ) : (
          <span className="text-fyn-muted">-</span>
        ),
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
              setSelectedCredito(row.original)
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
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Créditos Bancários"
        description="Cartões de crédito, empréstimos, FGI PRONAMP e outras linhas"
        actions={
          <Button size="sm" onClick={() => setShowNovoModal(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Novo Crédito
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Limite Total" value={formatCurrency(kpis.limiteTotal)} />
        <KpiCard label="Utilizado" value={formatCurrency(kpis.utilizado)} variant="warning" />
        <KpiCard label="Disponível" value={formatCurrency(kpis.disponivel)} variant="success" />
        <KpiCard label="Parcelas/Mês" value={formatCurrency(kpis.parcelasMes)} variant="accent" />
      </div>

      {/* Resumo por Tipo */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-lg border border-fyn-border bg-fyn-bg p-3">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-4 w-4 text-fyn-accent" />
            <span className="text-xs font-medium text-fyn-muted">Cartões de Crédito</span>
          </div>
          <p className="text-lg font-semibold text-fyn-text">
            {formatCurrency(
              mockCreditos.filter((c) => c.tipo === "Cartão de Crédito").reduce((acc, c) => acc + c.utilizado, 0),
            )}
          </p>
          <p className="text-xs text-fyn-muted">
            de{" "}
            {formatCurrency(
              mockCreditos.filter((c) => c.tipo === "Cartão de Crédito").reduce((acc, c) => acc + c.limite, 0),
            )}{" "}
            limite
          </p>
        </div>
        <div className="rounded-lg border border-fyn-border bg-fyn-bg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Landmark className="h-4 w-4 text-fyn-warning" />
            <span className="text-xs font-medium text-fyn-muted">Empréstimos</span>
          </div>
          <p className="text-lg font-semibold text-fyn-text">
            {formatCurrency(
              mockCreditos
                .filter((c) => c.tipo === "Empréstimo" || c.tipo === "Capital de Giro")
                .reduce((acc, c) => acc + c.utilizado, 0),
            )}
          </p>
          <p className="text-xs text-fyn-muted">saldo devedor</p>
        </div>
        <div className="rounded-lg border border-fyn-border bg-fyn-bg p-3">
          <div className="flex items-center gap-2 mb-2">
            <BadgePercent className="h-4 w-4 text-fyn-success" />
            <span className="text-xs font-medium text-fyn-muted">FGI PRONAMP</span>
          </div>
          <p className="text-lg font-semibold text-fyn-text">
            {formatCurrency(
              mockCreditos.filter((c) => c.tipo === "FGI PRONAMP").reduce((acc, c) => acc + c.utilizado, 0),
            )}
          </p>
          <p className="text-xs text-fyn-muted">taxa subsidiada</p>
        </div>
        <div className="rounded-lg border border-fyn-border bg-fyn-bg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-fyn-accent" />
            <span className="text-xs font-medium text-fyn-muted">Antecipações</span>
          </div>
          <p className="text-lg font-semibold text-fyn-text">
            {formatCurrency(
              mockCreditos.filter((c) => c.tipo === "Antecipação Recebíveis").reduce((acc, c) => acc + c.utilizado, 0),
            )}
          </p>
          <p className="text-xs text-fyn-muted">em aberto</p>
        </div>
      </div>

      {/* Creditos Table */}
      <DataTable data={mockCreditos} columns={columns} searchPlaceholder="Buscar créditos..." pageSize={10} />

      {/* Novo Crédito Modal */}
      <Modal isOpen={showNovoModal} onClose={() => setShowNovoModal(false)} title="Novo Crédito Bancário" size="md">
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-fyn-text">Tipo</label>
              <select className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none">
                <option>Cartão de Crédito</option>
                <option>Empréstimo</option>
                <option>FGI PRONAMP</option>
                <option>Capital de Giro</option>
                <option>Cheque Especial</option>
                <option>Antecipação Recebíveis</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-fyn-text">Banco</label>
              <input
                type="text"
                placeholder="Nome do banco"
                className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-fyn-text">Limite/Valor</label>
              <input
                type="number"
                placeholder="0,00"
                className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-fyn-text">Taxa de Juros (% a.m.)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-fyn-text">Parcelas (se aplicável)</label>
              <input
                type="number"
                placeholder="Número de parcelas"
                className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-fyn-text">Dia de Vencimento</label>
              <input
                type="number"
                min="1"
                max="31"
                placeholder="Dia"
                className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowNovoModal(false)}>
              Cancelar
            </Button>
            <Button>Salvar</Button>
          </div>
        </form>
      </Modal>

      {/* Detail Drawer */}
      <Drawer
        isOpen={showDetailDrawer}
        onClose={() => setShowDetailDrawer(false)}
        title={selectedCredito ? `${selectedCredito.tipo} - ${selectedCredito.banco}` : "Detalhes"}
      >
        {selectedCredito && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded bg-fyn-surface p-2">
                <p className="text-[10px] uppercase text-fyn-muted">Limite</p>
                <p className="text-sm font-semibold">{formatCurrency(selectedCredito.limite)}</p>
              </div>
              <div className="rounded bg-fyn-surface p-2">
                <p className="text-[10px] uppercase text-fyn-muted">Utilizado</p>
                <p className="text-sm font-semibold">{formatCurrency(selectedCredito.utilizado)}</p>
              </div>
              <div className="rounded bg-fyn-surface p-2">
                <p className="text-[10px] uppercase text-fyn-muted">Disponível</p>
                <p className="text-sm font-semibold text-fyn-success">{formatCurrency(selectedCredito.disponivel)}</p>
              </div>
              <div className="rounded bg-fyn-surface p-2">
                <p className="text-[10px] uppercase text-fyn-muted">Taxa a.m.</p>
                <p className="text-sm font-semibold">{selectedCredito.taxaJuros}%</p>
              </div>
            </div>

            {selectedCredito.parcelas && (
              <div className="rounded-lg border border-fyn-border bg-fyn-surface p-3">
                <h3 className="mb-2 text-sm font-medium text-fyn-text">Parcelas</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-fyn-muted">Situação:</span> {selectedCredito.parcelas}
                  </div>
                  <div>
                    <span className="text-fyn-muted">Valor:</span> {formatCurrency(selectedCredito.valorParcela)}
                  </div>
                  <div className="col-span-2">
                    <span className="text-fyn-muted">Próximo Venc.:</span>{" "}
                    {formatDate(selectedCredito.vencimentoParcela)}
                  </div>
                </div>
              </div>
            )}

            {selectedCredito.vencimentoFatura && (
              <div className="rounded-lg border border-fyn-border bg-fyn-surface p-3">
                <h3 className="mb-2 text-sm font-medium text-fyn-text">Fatura</h3>
                <p className="text-sm">
                  <span className="text-fyn-muted">Vencimento:</span> {formatDate(selectedCredito.vencimentoFatura)}
                </p>
              </div>
            )}

            <div>
              <h3 className="mb-2 text-sm font-medium text-fyn-text">Últimas Movimentações</h3>
              <div className="space-y-1">
                {mockHistorico.slice(0, 3).map((h, idx) => (
                  <div key={idx} className="rounded border border-fyn-border bg-fyn-bg p-2 text-xs">
                    <div className="flex justify-between">
                      <span className="font-medium text-fyn-text">{h.acao}</span>
                      <span className="text-fyn-muted">{formatDate(h.date)}</span>
                    </div>
                    <p className="text-fyn-muted">
                      {h.credito} - {formatCurrency(h.valor)}
                    </p>
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
