"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatDate } from "@/lib/format"
import { Download, Check, Clock, AlertCircle } from "lucide-react"

const checklistItems = [
  { id: "1", name: "DRE Gerencial (gerado pelo sistema)", status: "pronto", generatedAt: "2026-01-10" },
  { id: "2", name: "Balancete Gerencial (gerado pelo sistema)", status: "pronto", generatedAt: "2026-01-10" },
  { id: "3", name: "Extratos Bancários Conciliados", status: "pendente", generatedAt: null },
  { id: "4", name: "Notas Fiscais de Entrada", status: "pronto", generatedAt: "2026-01-08" },
  { id: "5", name: "Notas Fiscais de Saída", status: "pronto", generatedAt: "2026-01-09" },
  { id: "6", name: "Boletos e Comprovantes", status: "pendente", generatedAt: null },
  { id: "7", name: "Folha de Pagamento", status: "pronto", generatedAt: "2026-01-05" },
  { id: "8", name: "Guias de Impostos Pagos (DAS, DARF, GPS, etc.)", status: "pendente", generatedAt: null },
  { id: "9", name: "Comprovantes de INSS/FGTS", status: "pendente", generatedAt: null },
  { id: "10", name: "Relatório de Contas a Pagar e Receber", status: "pendente", generatedAt: null },
  { id: "11", name: "Relatório de Movimentação de Estoque", status: "pendente", generatedAt: null },
  { id: "12", name: "Comprovantes de Empréstimos/Financiamentos", status: "pendente", generatedAt: null },
]

const historicoPacotes = [
  { mes: "Dezembro/2025", status: "Enviado", enviadoEm: "2026-01-05", itens: 8 },
  { mes: "Novembro/2025", status: "Enviado", enviadoEm: "2025-12-05", itens: 8 },
  { mes: "Outubro/2025", status: "Enviado", enviadoEm: "2025-11-05", itens: 8 },
]

export function ContadorContent() {
  const [autoSend, setAutoSend] = useState(true)
  const [sendDay, setSendDay] = useState(5)

  const itemsProntos = checklistItems.filter((i) => i.status === "pronto").length
  const totalItems = checklistItems.length
  const allReady = itemsProntos === totalItems

  const getStatusIcon = (status) => {
    switch (status) {
      case "pronto":
        return <Check className="h-4 w-4 text-fyn-success" />
      case "pendente":
        return <Clock className="h-4 w-4 text-fyn-warning" />
      case "erro":
        return <AlertCircle className="h-4 w-4 text-fyn-danger" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Contador"
        description="Pacote mensal para a contabilidade"
        actions={
          <Button size="sm" disabled={!allReady}>
            <Download className="mr-1 h-3.5 w-3.5" />
            Gerar Pacote
          </Button>
        }
      />

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded border border-fyn-border bg-fyn-bg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-fyn-muted">Pacote Janeiro/2026</p>
              <p className="mt-1 text-2xl font-semibold text-fyn-text">
                {itemsProntos}/{totalItems}
              </p>
              <p className="text-xs text-fyn-muted">itens prontos</p>
            </div>
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-full ${allReady ? "bg-fyn-success/10" : "bg-fyn-warning/10"}`}
            >
              {allReady ? (
                <Check className="h-8 w-8 text-fyn-success" />
              ) : (
                <Clock className="h-8 w-8 text-fyn-warning" />
              )}
            </div>
          </div>
        </div>

        <div className="col-span-2 rounded border border-fyn-border bg-fyn-bg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-fyn-text">Configuração de Envio Automático</h3>
              <p className="text-xs text-fyn-muted">Enviar pacote automaticamente todo dia {sendDay}</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={sendDay}
                onChange={(e) => setSendDay(Number(e.target.value))}
                className="rounded border border-fyn-border bg-fyn-bg px-2 py-1 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => (
                  <option key={d} value={d}>
                    Dia {d}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setAutoSend(!autoSend)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoSend ? "bg-fyn-accent" : "bg-fyn-muted"}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoSend ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="rounded border border-fyn-border bg-fyn-bg">
        <div className="flex items-center justify-between border-b border-fyn-border bg-fyn-surface px-4 py-2">
          <h3 className="text-sm font-medium text-fyn-text">Checklist do Pacote</h3>
          <span className="text-xs text-fyn-muted">Janeiro/2026</span>
        </div>
        <div className="divide-y divide-fyn-border">
          {checklistItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                {getStatusIcon(item.status)}
                <span className="text-sm text-fyn-text">{item.name}</span>
              </div>
              <div className="flex items-center gap-3">
                {item.generatedAt && (
                  <span className="text-xs text-fyn-muted">Gerado em {formatDate(item.generatedAt)}</span>
                )}
                <StatusBadge status={item.status === "pronto" ? "Pronto" : "Pendente"} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Package Items Description */}
      <div className="rounded border border-fyn-border bg-fyn-surface p-4">
        <h3 className="mb-2 text-sm font-medium text-fyn-text">Itens do Pacote</h3>
        <ul className="grid grid-cols-2 gap-2 text-sm text-fyn-muted">
          <li>- DRE (Demonstração do Resultado)</li>
          <li>- Balancete Contábil</li>
          <li>- Razão Contábil por Conta</li>
          <li>- Extratos Bancários Conciliados</li>
          <li>- Notas Fiscais de Entrada (XML)</li>
          <li>- Notas Fiscais de Saída (XML)</li>
          <li>- Boletos e Comprovantes de Pagamento</li>
          <li>- Folha de Pagamento e Encargos</li>
        </ul>
      </div>

      {/* History */}
      <div className="rounded border border-fyn-border bg-fyn-bg">
        <div className="border-b border-fyn-border bg-fyn-surface px-4 py-2">
          <h3 className="text-sm font-medium text-fyn-text">Histórico de Pacotes</h3>
        </div>
        <table className="fyn-table w-full">
          <thead>
            <tr className="border-b border-fyn-border bg-fyn-surface">
              <th className="px-4 py-2 text-left text-xs text-fyn-muted">Mês</th>
              <th className="px-4 py-2 text-left text-xs text-fyn-muted">Status</th>
              <th className="px-4 py-2 text-left text-xs text-fyn-muted">Enviado em</th>
              <th className="px-4 py-2 text-left text-xs text-fyn-muted">Itens</th>
              <th className="px-4 py-2 text-right text-xs text-fyn-muted">Ações</th>
            </tr>
          </thead>
          <tbody>
            {historicoPacotes.map((p, idx) => (
              <tr key={idx} className="border-b border-fyn-border last:border-0">
                <td className="px-4 py-2 text-sm text-fyn-text">{p.mes}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-2 text-sm text-fyn-muted">{formatDate(p.enviadoEm)}</td>
                <td className="px-4 py-2 text-sm text-fyn-muted">{p.itens} arquivos</td>
                <td className="px-4 py-2 text-right">
                  <Button variant="ghost" size="sm">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
