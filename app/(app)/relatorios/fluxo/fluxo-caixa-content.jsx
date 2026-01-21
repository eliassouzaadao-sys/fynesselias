"use client"

import { PageHeader } from "@/components/ui/page-header"
import { KpiCard } from "@/components/ui/kpi-card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/format"
import { Download } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"

const projecaoData = [
  { periodo: "Sem 1", entradas: 32000, saidas: 28000, saldo: 4000, acumulado: 131450 },
  { periodo: "Sem 2", entradas: 28000, saidas: 32000, saldo: -4000, acumulado: 127450 },
  { periodo: "Sem 3", entradas: 35000, saidas: 30000, saldo: 5000, acumulado: 132450 },
  { periodo: "Sem 4", entradas: 30000, saidas: 35000, saldo: -5000, acumulado: 127450 },
  { periodo: "Fev 1", entradas: 28000, saidas: 25000, saldo: 3000, acumulado: 130450 },
  { periodo: "Fev 2", entradas: 32000, saidas: 28000, saldo: 4000, acumulado: 134450 },
  { periodo: "Fev 3", entradas: 30000, saidas: 32000, saldo: -2000, acumulado: 132450 },
  { periodo: "Fev 4", entradas: 35000, saidas: 30000, saldo: 5000, acumulado: 137450 },
  { periodo: "Mar 1", entradas: 28000, saidas: 30000, saldo: -2000, acumulado: 135450 },
  { periodo: "Mar 2", entradas: 32000, saidas: 28000, saldo: 4000, acumulado: 139450 },
  { periodo: "Mar 3", entradas: 30000, saidas: 35000, saldo: -5000, acumulado: 134450 },
  { periodo: "Mar 4", entradas: 38000, saidas: 32000, saldo: 6000, acumulado: 140450 },
]

const detalheProjecao = [
  { categoria: "Recebimentos Clientes", d30: 85000, d60: 82000, d90: 88000 },
  { categoria: "Pagamentos Fornecedores", d30: -45000, d60: -42000, d90: -48000 },
  { categoria: "Folha de Pagamento", d30: -15000, d60: -15000, d90: -15000 },
  { categoria: "Impostos", d30: -8000, d60: -7500, d90: -8500 },
  { categoria: "Aluguel e Utilidades", d30: -5000, d60: -5000, d90: -5000 },
  { categoria: "Outras Despesas", d30: -3000, d60: -3500, d90: -3000 },
]

/*
// --- RELATÓRIO DE FLUXO DE CAIXA EM STANDBY ---
// Código original comentado abaixo para fácil restauração
export function FluxoCaixaContent() {
  ...código original...
}
*/

export function FluxoCaixaContent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px]">
      <span className="inline-block rounded bg-fyn-surface px-4 py-2 text-fyn-text-muted text-sm mt-8">
        O relatório de Fluxo de Caixa está temporariamente indisponível.<br />Entre em contato para ativar novamente.
      </span>
    </div>
  )
}
