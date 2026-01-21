"use client"

import { PageHeader } from "@/components/ui/page-header"
import { KpiCard } from "@/components/ui/kpi-card"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatPercentage, formatDate } from "@/lib/format"
import { Download, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react"

const endividamentoPorTipo = [
  { tipo: "Cartões de Crédito", saldo: 86000, limite: 155000, taxaMedia: 11.5, venceMes: 86000 },
  { tipo: "Empréstimos Bancários", saldo: 350000, limite: 350000, taxaMedia: 1.67, venceMes: 17000 },
  { tipo: "FGI PRONAMP", saldo: 350000, limite: 500000, taxaMedia: 0.85, venceMes: 12500 },
  { tipo: "Capital de Giro", saldo: 150000, limite: 150000, taxaMedia: 1.45, venceMes: 7200 },
  { tipo: "Antecipação Recebíveis", saldo: 65000, limite: 100000, taxaMedia: 2.1, venceMes: 0 },
  { tipo: "Cheque Especial", saldo: 0, limite: 30000, taxaMedia: 8.5, venceMes: 0 },
]

const cronogramaVencimentos = [
  { mes: "Jan/26", cartoes: 86000, emprestimos: 29500, total: 115500 },
  { mes: "Fev/26", cartoes: 72000, emprestimos: 29500, total: 101500 },
  { mes: "Mar/26", cartoes: 68000, emprestimos: 29500, total: 97500 },
  { mes: "Abr/26", cartoes: 65000, emprestimos: 29500, total: 94500 },
  { mes: "Mai/26", cartoes: 60000, emprestimos: 29500, total: 89500 },
  { mes: "Jun/26", cartoes: 55000, emprestimos: 29500, total: 84500 },
]

const detalheCreditos = [
  {
    banco: "Banco do Brasil",
    tipo: "Cartão de Crédito",
    limite: 50000,
    saldo: 32500,
    taxaJuros: 12.5,
    proximoVenc: "2026-01-25",
    status: "Em Dia",
  },
  {
    banco: "Itaú Empresas",
    tipo: "Cartão de Crédito",
    limite: 80000,
    saldo: 45000,
    taxaJuros: 10.8,
    proximoVenc: "2026-01-20",
    status: "Em Dia",
  },
  {
    banco: "BNDES via BB",
    /*
    // --- RELATÓRIO DE ENDIVIDAMENTO EM STANDBY ---
    // Código original comentado abaixo para fácil restauração
    export function CreditoReportContent() {
      ...código original...
    }
    */

    export function CreditoReportContent() {
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px]">
          <span className="inline-block rounded bg-fyn-surface px-4 py-2 text-fyn-text-muted text-sm mt-8">
            O relatório de Endividamento está temporariamente indisponível.<br />Entre em contato para ativar novamente.
          </span>
        </div>
      )
    }
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-fyn-muted">Cartões</span>
                  <span>{formatCurrency(mes.cartoes)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-fyn-muted">Parcelas</span>
                  <span>{formatCurrency(mes.emprestimos)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Indicadores de Risco */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-fyn-border bg-fyn-bg p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-fyn-success" />
            <h3 className="text-sm font-medium text-fyn-text">Capacidade de Pagamento</h3>
          </div>
          <p className="text-2xl font-bold text-fyn-success">Adequada</p>
          <p className="text-xs text-fyn-muted mt-1">Compromissos representam 18% da receita mensal</p>
        </div>
        <div className="rounded-lg border border-fyn-border bg-fyn-bg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-fyn-warning" />
            <h3 className="text-sm font-medium text-fyn-text">Concentração de Vencimentos</h3>
          </div>
          <p className="text-2xl font-bold text-fyn-warning">Moderada</p>
          <p className="text-xs text-fyn-muted mt-1">42% dos vencimentos concentrados na 1ª quinzena</p>
        </div>
        <div className="rounded-lg border border-fyn-border bg-fyn-bg p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="h-5 w-5 text-fyn-accent" />
            <h3 className="text-sm font-medium text-fyn-text">Custo do Capital</h3>
          </div>
          <p className="text-2xl font-bold text-fyn-text">R$ 18.420</p>
          <p className="text-xs text-fyn-muted mt-1">Juros estimados no mês atual</p>
        </div>
      </div>

      {/* Detalhes por Crédito */}
      <div className="rounded-lg border border-fyn-border bg-fyn-bg p-3">
        <h3 className="mb-2 text-sm font-medium text-fyn-text">Detalhamento por Linha de Crédito</h3>
        <DataTable data={detalheCreditos} columns={columns} showSearch={false} pageSize={10} />
      </div>
    </div>
  )
}
