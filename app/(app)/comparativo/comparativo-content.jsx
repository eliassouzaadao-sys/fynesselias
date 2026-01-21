"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { formatCurrency, formatPercentage } from "@/lib/format"
import { Download, TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle, Calendar, ChevronDown } from "lucide-react"

// Mock data para comparativo
const comparativoData = {
  entradas: {
    previsto: 156000,
    realizado: 142300,
    diferenca: -13700,
  },
  saidas: {
    previsto: 98000,
    realizado: 105400,
    diferenca: 7400,
  },
  resultado: {
    previsto: 58000,
    realizado: 36900,
    diferenca: -21100,
  },
}

// Centros de Receita (Entradas)
const centrosReceita = [
  {
    nome: "Vendas de Produtos",
    subCentros: [
      { nome: "Linha Premium", previsto: 35000, realizado: 32000 },
      { nome: "Linha Standard", previsto: 28000, realizado: 26500 },
      { nome: "Linha Básica", previsto: 22000, realizado: 20000 },
    ],
  },
  {
    nome: "Prestação de Serviços",
    subCentros: [
      { nome: "Consultoria", previsto: 25000, realizado: 25000 },
      { nome: "Manutenção", previsto: 12000, realizado: 12000 },
      { nome: "Projetos Especiais", previsto: 8000, realizado: 11200 },
    ],
  },
  {
    nome: "Receitas Financeiras",
    subCentros: [
      { nome: "Rendimentos CDB", previsto: 4500, realizado: 4300 },
      { nome: "Juros Recebidos", previsto: 2000, realizado: 2100 },
      { nome: "Descontos Obtidos", previsto: 1500, realizado: 1400 },
    ],
  },
  {
    nome: "Outras Receitas",
    subCentros: [
      { nome: "Bonificações", previsto: 8000, realizado: 3500 },
      { nome: "Reversão de Provisões", previsto: 6000, realizado: 2800 },
      { nome: "Diversos", previsto: 4000, realizado: 1500 },
    ],
  },
]

// Centros de Custo (Saídas)
const centrosCusto = [
  {
    nome: "Fornecedores",
    subCentros: [
      { nome: "Matéria Prima", previsto: 25000, realizado: 27500 },
      { nome: "Mercadorias", previsto: 15000, realizado: 16200 },
      { nome: "Insumos", previsto: 5000, realizado: 5200 },
    ],
  },
  {
    nome: "Folha de Pagamento",
    subCentros: [
      { nome: "Salários", previsto: 22000, realizado: 22000 },
      { nome: "Encargos", previsto: 7000, realizado: 7000 },
      { nome: "Benefícios", previsto: 3000, realizado: 3000 },
    ],
  },
  {
    nome: "Impostos e Taxas",
    subCentros: [
      { nome: "ICMS", previsto: 6000, realizado: 6800 },
      { nome: "PIS/COFINS", previsto: 4000, realizado: 4500 },
      { nome: "ISS", previsto: 2000, realizado: 2200 },
    ],
  },
  {
    nome: "Despesas Administrativas",
    subCentros: [
      { nome: "Aluguel", previsto: 4000, realizado: 4000 },
      { nome: "Energia Elétrica", previsto: 1500, realizado: 1900 },
      { nome: "Telecomunicações", previsto: 1000, realizado: 1300 },
      { nome: "Material de Escritório", previsto: 500, realizado: 800 },
    ],
  },
  {
    nome: "Despesas Operacionais",
    subCentros: [
      { nome: "Marketing", previsto: 800, realizado: 1500 },
      { nome: "Manutenção", previsto: 700, realizado: 1100 },
      { nome: "Diversos", previsto: 500, realizado: 700 },
    ],
  },
]

// Contas individuais de entrada
const contasEntrada = [
  {
    id: 1,
    descricao: "Venda #1234 - Cliente A",
    categoria: "Vendas de Produtos",
    dataVencimento: "2026-01-05",
    previsto: 15000,
    realizado: 15000,
    status: "pago",
  },
  {
    id: 2,
    descricao: "Venda #1235 - Cliente B",
    categoria: "Vendas de Produtos",
    dataVencimento: "2026-01-08",
    previsto: 8500,
    realizado: 8500,
    status: "pago",
  },
  {
    id: 3,
    descricao: "Venda #1236 - Cliente C",
    categoria: "Vendas de Produtos",
    dataVencimento: "2026-01-12",
    previsto: 12000,
    realizado: 0,
    status: "pendente",
  },
  {
    id: 4,
    descricao: "Venda #1237 - Cliente D",
    categoria: "Vendas de Produtos",
    dataVencimento: "2026-01-15",
    previsto: 22000,
    realizado: 22000,
    status: "pago",
  },
  {
    id: 5,
    descricao: "Venda #1238 - Cliente E",
    categoria: "Vendas de Produtos",
    dataVencimento: "2026-01-18",
    previsto: 18500,
    realizado: 18500,
    status: "pago",
  },
  {
    id: 6,
    descricao: "Venda #1239 - Cliente F",
    categoria: "Vendas de Produtos",
    dataVencimento: "2026-01-22",
    previsto: 9000,
    realizado: 0,
    status: "pendente",
  },
  {
    id: 7,
    descricao: "Serviço de Consultoria - Empresa X",
    categoria: "Prestação de Serviços",
    dataVencimento: "2026-01-10",
    previsto: 25000,
    realizado: 25000,
    status: "pago",
  },
  {
    id: 8,
    descricao: "Manutenção Mensal - Cliente Y",
    categoria: "Prestação de Serviços",
    dataVencimento: "2026-01-15",
    previsto: 12000,
    realizado: 12000,
    status: "pago",
  },
  {
    id: 9,
    descricao: "Projeto Desenvolvimento - Cliente Z",
    categoria: "Prestação de Serviços",
    dataVencimento: "2026-01-20",
    previsto: 8000,
    realizado: 11200,
    status: "pago",
  },
  {
    id: 10,
    descricao: "Rendimento CDB",
    categoria: "Receitas Financeiras",
    dataVencimento: "2026-01-25",
    previsto: 4500,
    realizado: 4200,
    status: "pago",
  },
  {
    id: 11,
    descricao: "Rendimento Poupança",
    categoria: "Receitas Financeiras",
    dataVencimento: "2026-01-25",
    previsto: 3500,
    realizado: 3600,
    status: "pago",
  },
  {
    id: 12,
    descricao: "Venda de Equipamento Usado",
    categoria: "Outras Receitas",
    dataVencimento: "2026-01-08",
    previsto: 8000,
    realizado: 7800,
    status: "pago",
  },
  {
    id: 13,
    descricao: "Aluguel de Espaço",
    categoria: "Outras Receitas",
    dataVencimento: "2026-01-15",
    previsto: 10000,
    realizado: 0,
    status: "pendente",
  },
]

// Contas individuais de saída
const contasSaida = [
  {
    id: 101,
    descricao: "Fornecedor ABC - Matéria Prima",
    categoria: "Fornecedores",
    dataVencimento: "2026-01-05",
    previsto: 18000,
    realizado: 18000,
    status: "pago",
  },
  {
    id: 102,
    descricao: "Fornecedor XYZ - Insumos",
    categoria: "Fornecedores",
    dataVencimento: "2026-01-10",
    previsto: 12500,
    realizado: 14200,
    status: "pago",
  },
  {
    id: 103,
    descricao: "Fornecedor DEF - Mercadorias",
    categoria: "Fornecedores",
    dataVencimento: "2026-01-15",
    previsto: 14500,
    realizado: 16700,
    status: "pago",
  },
  {
    id: 104,
    descricao: "Salários - Janeiro/2026",
    categoria: "Folha de Pagamento",
    dataVencimento: "2026-01-05",
    previsto: 28000,
    realizado: 28000,
    status: "pago",
  },
  {
    id: 105,
    descricao: "Encargos Sociais - Janeiro/2026",
    categoria: "Folha de Pagamento",
    dataVencimento: "2026-01-20",
    previsto: 4000,
    realizado: 4000,
    status: "pago",
  },
  {
    id: 106,
    descricao: "DAS - Simples Nacional",
    categoria: "Impostos e Taxas",
    dataVencimento: "2026-01-20",
    previsto: 8500,
    realizado: 9200,
    status: "pago",
  },
  {
    id: 107,
    descricao: "INSS - Contribuição",
    categoria: "Impostos e Taxas",
    dataVencimento: "2026-01-15",
    previsto: 3500,
    realizado: 4300,
    status: "pago",
  },
  {
    id: 108,
    descricao: "Aluguel - Sede",
    categoria: "Aluguel e Condomínio",
    dataVencimento: "2026-01-10",
    previsto: 3500,
    realizado: 3500,
    status: "pago",
  },
  {
    id: 109,
    descricao: "Condomínio - Sede",
    categoria: "Aluguel e Condomínio",
    dataVencimento: "2026-01-10",
    previsto: 1000,
    realizado: 1000,
    status: "pago",
  },
  {
    id: 110,
    descricao: "Energia Elétrica",
    categoria: "Energia e Telecomunicações",
    dataVencimento: "2026-01-15",
    previsto: 1200,
    realizado: 1580,
    status: "pago",
  },
  {
    id: 111,
    descricao: "Internet + Telefonia",
    categoria: "Energia e Telecomunicações",
    dataVencimento: "2026-01-20",
    previsto: 1300,
    realizado: 1620,
    status: "pago",
  },
  {
    id: 112,
    descricao: "Material de Escritório",
    categoria: "Despesas Operacionais",
    dataVencimento: "2026-01-08",
    previsto: 800,
    realizado: 1200,
    status: "pago",
  },
  {
    id: 113,
    descricao: "Manutenção de Equipamentos",
    categoria: "Despesas Operacionais",
    dataVencimento: "2026-01-12",
    previsto: 1200,
    realizado: 2100,
    status: "pago",
  },
]

const comparativoMensal = [
  { mes: "Jan", previstaEntrada: 140000, realizadaEntrada: 138500, previstaSaida: 95000, realizadaSaida: 98000 },
  { mes: "Fev", previstaEntrada: 145000, realizadaEntrada: 142800, previstaSaida: 92000, realizadaSaida: 94500 },
  { mes: "Mar", previstaEntrada: 152000, realizadaEntrada: 149200, previstaSaida: 96000, realizadaSaida: 99800 },
  { mes: "Abr", previstaEntrada: 148000, realizadaEntrada: 145600, previstaSaida: 98000, realizadaSaida: 102000 },
  { mes: "Mai", previstaEntrada: 156000, realizadaEntrada: 142300, previstaSaida: 98000, realizadaSaida: 105400 },
]

export function ComparativoContent() {
  const [periodo, setPeriodo] = useState("mes-atual")
  const [categoriaFiltroEntrada, setCategoriaFiltroEntrada] = useState("todas")
  const [categoriaFiltroSaida, setCategoriaFiltroSaida] = useState("todas")
  const [categoriasExpandidas, setCategoriasExpandidas] = useState(true)
  const [contasExpandidas, setContasExpandidas] = useState(true)
  const [evolucaoExpandida, setEvolucaoExpandida] = useState(true)

  const aderenciaGeral = ((comparativoData.entradas.realizado / comparativoData.entradas.previsto) * 100).toFixed(1)

  // Filtrar contas de entrada
  const contasEntradaFiltradas =
    categoriaFiltroEntrada === "todas"
      ? contasEntrada
      : contasEntrada.filter((conta) => conta.categoria === categoriaFiltroEntrada)

  // Filtrar contas de saída
  const contasSaidaFiltradas =
    categoriaFiltroSaida === "todas"
      ? contasSaida
      : contasSaida.filter((conta) => conta.categoria === categoriaFiltroSaida)

  // Obter categorias únicas
  const categoriasEntrada = ["todas", ...new Set(contasEntrada.map((c) => c.categoria))]
  const categoriasSaida = ["todas", ...new Set(contasSaida.map((c) => c.categoria))]

  const getStatusBadge = (status) => {
    const styles = {
      pago: "bg-fyn-success/10 text-fyn-success border-fyn-success/20",
      pendente: "bg-fyn-warning/10 text-fyn-warning border-fyn-warning/20",
      atrasado: "bg-fyn-danger/10 text-fyn-danger border-fyn-danger/20",
    }
    const labels = {
      pago: "Pago",
      pendente: "Pendente",
      atrasado: "Atrasado",
    }
    return (
      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Comparativo Previsto vs Realizado"
        description="Análise comparativa entre valores previstos e realizados"
        actions={
          <div className="flex items-center gap-2">
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-44">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mes-atual">Mês Atual</SelectItem>
                <SelectItem value="mes-anterior">Mês Anterior</SelectItem>
                <SelectItem value="trimestre">Trimestre</SelectItem>
                <SelectItem value="semestre">Semestre</SelectItem>
                <SelectItem value="ano">Ano</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        }
      />

      {/* Resumo Geral */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-fyn-success/10 p-2">
                <ArrowUpCircle className="h-4 w-4 text-fyn-success" />
              </div>
              <span className="text-sm font-medium text-fyn-text">Entradas</span>
            </div>
            <span
              className={`text-xs font-medium ${comparativoData.entradas.diferenca >= 0 ? "text-fyn-success" : "text-fyn-warning"}`}
            >
              {comparativoData.entradas.diferenca >= 0 ? "+" : ""}
              {formatCurrency(comparativoData.entradas.diferenca)}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-fyn-muted">Previsto</span>
              <span className="text-sm font-medium text-fyn-text">
                {formatCurrency(comparativoData.entradas.previsto)}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-fyn-muted">Realizado</span>
              <span className="text-lg font-bold text-fyn-text">
                {formatCurrency(comparativoData.entradas.realizado)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-fyn-border">
              <div
                className={`h-full transition-all ${comparativoData.entradas.diferenca >= 0 ? "bg-fyn-success" : "bg-fyn-warning"}`}
                style={{
                  width: `${Math.min((comparativoData.entradas.realizado / comparativoData.entradas.previsto) * 100, 100)}%`,
                }}
              />
            </div>
            <div className="text-right text-xs font-medium text-fyn-accent">
              {formatPercentage((comparativoData.entradas.realizado / comparativoData.entradas.previsto) * 100)}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-fyn-danger/10 p-2">
                <ArrowDownCircle className="h-4 w-4 text-fyn-danger" />
              </div>
              <span className="text-sm font-medium text-fyn-text">Saídas</span>
            </div>
            <span
              className={`text-xs font-medium ${comparativoData.saidas.diferenca <= 0 ? "text-fyn-success" : "text-fyn-danger"}`}
            >
              {comparativoData.saidas.diferenca >= 0 ? "+" : ""}
              {formatCurrency(comparativoData.saidas.diferenca)}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-fyn-muted">Previsto</span>
              <span className="text-sm font-medium text-fyn-text">
                {formatCurrency(comparativoData.saidas.previsto)}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-fyn-muted">Realizado</span>
              <span className="text-lg font-bold text-fyn-text">
                {formatCurrency(comparativoData.saidas.realizado)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-fyn-border">
              <div
                className={`h-full transition-all ${comparativoData.saidas.diferenca <= 0 ? "bg-fyn-success" : "bg-fyn-danger"}`}
                style={{
                  width: `${Math.min((comparativoData.saidas.realizado / comparativoData.saidas.previsto) * 100, 100)}%`,
                }}
              />
            </div>
            <div className="text-right text-xs font-medium text-fyn-accent">
              {formatPercentage((comparativoData.saidas.realizado / comparativoData.saidas.previsto) * 100)}
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-fyn-accent/5 to-fyn-accent/10 border-fyn-accent/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-fyn-accent/20 p-2">
                <TrendingUp className="h-4 w-4 text-fyn-accent" />
              </div>
              <span className="text-sm font-medium text-fyn-text">Resultado</span>
            </div>
            <div
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                comparativoData.resultado.diferenca >= 0
                  ? "bg-fyn-success/20 text-fyn-success"
                  : "bg-fyn-danger/20 text-fyn-danger"
              }`}
            >
              {formatPercentage((comparativoData.resultado.realizado / comparativoData.resultado.previsto) * 100)}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-fyn-muted">Previsto</span>
              <span className="text-sm font-medium text-fyn-text">
                {formatCurrency(comparativoData.resultado.previsto)}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-fyn-muted">Realizado</span>
              <span className="text-lg font-bold text-fyn-text">
                {formatCurrency(comparativoData.resultado.realizado)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-fyn-muted">Diferença</span>
              <span
                className={`text-sm font-bold ${comparativoData.resultado.diferenca >= 0 ? "text-fyn-success" : "text-fyn-danger"}`}
              >
                {comparativoData.resultado.diferenca >= 0 ? "+" : ""}
                {formatCurrency(comparativoData.resultado.diferenca)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Insights */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="flex items-start gap-2 rounded-lg bg-fyn-danger-light p-3">
          <div className="rounded-full bg-fyn-danger p-1 mt-0.5">
            <TrendingDown className="h-3 w-3 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-fyn-text">Outras Receitas -56,7%</p>
            <p className="text-xs text-fyn-muted mt-0.5">
              {formatCurrency(7800)} / {formatCurrency(18000)}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-lg bg-fyn-warning-light p-3">
          <div className="rounded-full bg-fyn-warning p-1 mt-0.5">
            <TrendingUp className="h-3 w-3 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-fyn-text">Desp. Operacionais +65%</p>
            <p className="text-xs text-fyn-muted mt-0.5">
              {formatCurrency(3300)} / {formatCurrency(2000)}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-lg bg-fyn-success-light p-3">
          <div className="rounded-full bg-fyn-success p-1 mt-0.5">
            <TrendingUp className="h-3 w-3 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-fyn-text">Serviços +7,1%</p>
            <p className="text-xs text-fyn-muted mt-0.5">
              {formatCurrency(48200)} / {formatCurrency(45000)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Principal */}
      <Tabs defaultValue="categorias" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categorias">Por Categoria</TabsTrigger>
          <TabsTrigger value="contas">Todas as Contas</TabsTrigger>
          <TabsTrigger value="evolucao">Evolução</TabsTrigger>
        </TabsList>

        {/* Tab: Por Categoria (Centros de Custo e Receita) */}
        <TabsContent value="categorias" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            {/* Centros de Receita */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-fyn-text flex items-center gap-2">
                  <ArrowUpCircle className="h-4 w-4 text-fyn-success" />
                  Centros de Receita
                </h3>
                <span className="text-xs text-fyn-muted">
                  {centrosReceita.length} centros
                </span>
              </div>
              <div className="space-y-3">
                {centrosReceita.map((centro, idx) => {
                  const totalPrevisto = centro.subCentros.reduce((acc, sub) => acc + sub.previsto, 0)
                  const totalRealizado = centro.subCentros.reduce((acc, sub) => acc + sub.realizado, 0)
                  const variacao = totalRealizado - totalPrevisto
                  const percentual = (totalRealizado / totalPrevisto) * 100

                  return (
                    <Collapsible key={idx}>
                      <div className="rounded-lg border border-fyn-border overflow-hidden">
                        <CollapsibleTrigger className="w-full hover:bg-fyn-surface/50 transition-colors">
                          <div className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <ChevronDown className="h-4 w-4 text-fyn-muted transition-transform ui-expanded:rotate-180" />
                                <span className="text-xs font-semibold text-fyn-text truncate">{centro.nome}</span>
                              </div>
                              <span
                                className={`text-xs font-medium whitespace-nowrap ml-2 ${
                                  variacao >= 0 ? "text-fyn-success" : "text-fyn-warning"
                                }`}
                              >
                                {variacao >= 0 ? "+" : ""}
                                {formatCurrency(variacao)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs mb-2 flex-wrap gap-1">
                              <span className="text-fyn-muted whitespace-nowrap">Previsto: {formatCurrency(totalPrevisto)}</span>
                              <span className="text-fyn-text font-medium whitespace-nowrap">Real: {formatCurrency(totalRealizado)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-fyn-border">
                                <div
                                  className={`h-full transition-all ${
                                    variacao >= 0 ? "bg-fyn-success" : "bg-fyn-warning"
                                  }`}
                                  style={{ width: `${Math.min(percentual, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-fyn-accent w-12 text-right">
                                {formatPercentage(percentual)}
                              </span>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="border-t border-fyn-border bg-fyn-surface/30">
                            <div className="px-3 py-2 overflow-x-auto">
                              <div className="grid grid-cols-4 gap-2 text-xs font-medium text-fyn-muted mb-2 px-2 min-w-[500px]">
                                <span className="col-span-1">Sub-Centro</span>
                                <span className="text-right">Previsto</span>
                                <span className="text-right">Realizado</span>
                                <span className="text-right">Variação</span>
                              </div>
                              <div className="space-y-1.5">
                                {centro.subCentros.map((sub, subIdx) => {
                                  const subVariacao = sub.realizado - sub.previsto
                                  return (
                                    <div
                                      key={subIdx}
                                      className="grid grid-cols-4 gap-2 text-xs py-2 px-2 rounded hover:bg-fyn-surface/50 transition-colors min-w-[500px]"
                                    >
                                      <span className="col-span-1 text-fyn-text truncate">{sub.nome}</span>
                                      <span className="text-right text-fyn-muted whitespace-nowrap">{formatCurrency(sub.previsto)}</span>
                                      <span className="text-right text-fyn-text font-medium whitespace-nowrap">
                                        {formatCurrency(sub.realizado)}
                                      </span>
                                      <span
                                        className={`text-right font-medium whitespace-nowrap ${
                                          subVariacao >= 0 ? "text-fyn-success" : "text-fyn-warning"
                                        }`}
                                      >
                                        {subVariacao >= 0 ? "+" : ""}
                                        {formatCurrency(subVariacao)}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  )
                })}
              </div>
            </Card>

            {/* Centros de Custo */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-fyn-text flex items-center gap-2">
                  <ArrowDownCircle className="h-4 w-4 text-fyn-danger" />
                  Centros de Custo
                </h3>
                <span className="text-xs text-fyn-muted">
                  {centrosCusto.length} centros
                </span>
              </div>
              <div className="space-y-3">
                {centrosCusto.map((centro, idx) => {
                  const totalPrevisto = centro.subCentros.reduce((acc, sub) => acc + sub.previsto, 0)
                  const totalRealizado = centro.subCentros.reduce((acc, sub) => acc + sub.realizado, 0)
                  const variacao = totalRealizado - totalPrevisto
                  const percentual = (totalRealizado / totalPrevisto) * 100

                  return (
                    <Collapsible key={idx}>
                      <div className="rounded-lg border border-fyn-border overflow-hidden">
                        <CollapsibleTrigger className="w-full hover:bg-fyn-surface/50 transition-colors">
                          <div className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <ChevronDown className="h-4 w-4 text-fyn-muted transition-transform ui-expanded:rotate-180" />
                                <span className="text-xs font-semibold text-fyn-text truncate">{centro.nome}</span>
                              </div>
                              <span
                                className={`text-xs font-medium whitespace-nowrap ml-2 ${
                                  variacao <= 0 ? "text-fyn-success" : "text-fyn-danger"
                                }`}
                              >
                                {variacao >= 0 ? "+" : ""}
                                {formatCurrency(variacao)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs mb-2 flex-wrap gap-1">
                              <span className="text-fyn-muted whitespace-nowrap">Previsto: {formatCurrency(totalPrevisto)}</span>
                              <span className="text-fyn-text font-medium whitespace-nowrap">Real: {formatCurrency(totalRealizado)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-fyn-border">
                                <div
                                  className={`h-full transition-all ${
                                    variacao <= 0 ? "bg-fyn-success" : "bg-fyn-danger"
                                  }`}
                                  style={{ width: `${Math.min(percentual, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-fyn-accent w-12 text-right">
                                {formatPercentage(percentual)}
                              </span>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="border-t border-fyn-border bg-fyn-surface/30">
                            <div className="px-3 py-2 overflow-x-auto">
                              <div className="grid grid-cols-4 gap-2 text-xs font-medium text-fyn-muted mb-2 px-2 min-w-[500px]">
                                <span className="col-span-1">Sub-Centro</span>
                                <span className="text-right">Previsto</span>
                                <span className="text-right">Realizado</span>
                                <span className="text-right">Variação</span>
                              </div>
                              <div className="space-y-1.5">
                                {centro.subCentros.map((sub, subIdx) => {
                                  const subVariacao = sub.realizado - sub.previsto
                                  return (
                                    <div
                                      key={subIdx}
                                      className="grid grid-cols-4 gap-2 text-xs py-2 px-2 rounded hover:bg-fyn-surface/50 transition-colors min-w-[500px]"
                                    >
                                      <span className="col-span-1 text-fyn-text truncate">{sub.nome}</span>
                                      <span className="text-right text-fyn-muted whitespace-nowrap">{formatCurrency(sub.previsto)}</span>
                                      <span className="text-right text-fyn-text font-medium whitespace-nowrap">
                                        {formatCurrency(sub.realizado)}
                                      </span>
                                      <span
                                        className={`text-right font-medium ${
                                          subVariacao <= 0 ? "text-fyn-success" : "text-fyn-danger"
                                        }`}
                                      >
                                        {subVariacao >= 0 ? "+" : ""}
                                        {formatCurrency(subVariacao)}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  )
                })}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Todas as Contas */}
        <TabsContent value="contas" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-fyn-text flex items-center gap-2">
                  <ArrowUpCircle className="h-4 w-4 text-fyn-success" />
                  Contas de Entrada
                </h3>
                <Select value={categoriaFiltroEntrada} onValueChange={setCategoriaFiltroEntrada}>
                  <SelectTrigger className="w-48 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasEntrada.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat === "todas" ? "Todas as Categorias" : cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {contasEntradaFiltradas.map((conta) => (
                  <div
                    key={conta.id}
                    className="rounded-lg border border-fyn-border p-2.5 hover:bg-fyn-surface/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-fyn-text truncate">{conta.descricao}</p>
                        <p className="text-xs text-fyn-muted">{conta.categoria}</p>
                      </div>
                      {getStatusBadge(conta.status)}
                    </div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-fyn-muted">Venc: {new Date(conta.dataVencimento).toLocaleDateString("pt-BR")}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-fyn-muted">P: {formatCurrency(conta.previsto)}</span>
                        <span className="font-medium text-fyn-text">R: {formatCurrency(conta.realizado)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-fyn-border">
                        <div
                          className={`h-full transition-all ${
                            conta.status === "pago"
                              ? conta.realizado >= conta.previsto
                                ? "bg-fyn-success"
                                : "bg-fyn-warning"
                              : "bg-fyn-danger"
                          }`}
                          style={{
                            width: `${conta.previsto > 0 ? Math.min((conta.realizado / conta.previsto) * 100, 100) : 0}%`,
                          }}
                        />
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          conta.realizado >= conta.previsto ? "text-fyn-success" : "text-fyn-warning"
                        }`}
                      >
                        {conta.previsto > 0 ? formatPercentage((conta.realizado / conta.previsto) * 100) : "0%"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-fyn-border">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span className="text-fyn-text">Total</span>
                  <div className="flex items-center gap-3">
                    <span className="text-fyn-muted text-xs">
                      P: {formatCurrency(contasEntradaFiltradas.reduce((acc, c) => acc + c.previsto, 0))}
                    </span>
                    <span className="text-fyn-text">
                      R: {formatCurrency(contasEntradaFiltradas.reduce((acc, c) => acc + c.realizado, 0))}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-fyn-text flex items-center gap-2">
                  <ArrowDownCircle className="h-4 w-4 text-fyn-danger" />
                  Contas de Saída
                </h3>
                <Select value={categoriaFiltroSaida} onValueChange={setCategoriaFiltroSaida}>
                  <SelectTrigger className="w-48 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasSaida.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat === "todas" ? "Todas as Categorias" : cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {contasSaidaFiltradas.map((conta) => (
                  <div
                    key={conta.id}
                    className="rounded-lg border border-fyn-border p-2.5 hover:bg-fyn-surface/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-fyn-text truncate">{conta.descricao}</p>
                        <p className="text-xs text-fyn-muted">{conta.categoria}</p>
                      </div>
                      {getStatusBadge(conta.status)}
                    </div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-fyn-muted">Venc: {new Date(conta.dataVencimento).toLocaleDateString("pt-BR")}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-fyn-muted">P: {formatCurrency(conta.previsto)}</span>
                        <span className="font-medium text-fyn-text">R: {formatCurrency(conta.realizado)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-fyn-border">
                        <div
                          className={`h-full transition-all ${
                            conta.status === "pago"
                              ? conta.realizado <= conta.previsto
                                ? "bg-fyn-success"
                                : "bg-fyn-danger"
                              : "bg-fyn-warning"
                          }`}
                          style={{
                            width: `${conta.previsto > 0 ? Math.min((conta.realizado / conta.previsto) * 100, 100) : 0}%`,
                          }}
                        />
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          conta.realizado <= conta.previsto ? "text-fyn-success" : "text-fyn-danger"
                        }`}
                      >
                        {conta.previsto > 0 ? formatPercentage((conta.realizado / conta.previsto) * 100) : "0%"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-fyn-border">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span className="text-fyn-text">Total</span>
                  <div className="flex items-center gap-3">
                    <span className="text-fyn-muted text-xs">
                      P: {formatCurrency(contasSaidaFiltradas.reduce((acc, c) => acc + c.previsto, 0))}
                    </span>
                    <span className="text-fyn-text">
                      R: {formatCurrency(contasSaidaFiltradas.reduce((acc, c) => acc + c.realizado, 0))}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Evolução */}
        <TabsContent value="evolucao" className="space-y-4">
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-fyn-text mb-3">Evolução Mensal</h3>
            <div className="space-y-2.5">
              {comparativoMensal.map((item, idx) => {
                const entradaDiff = item.realizadaEntrada - item.previstaEntrada
                const saidaDiff = item.realizadaSaida - item.previstaSaida
                const resultadoRealizado = item.realizadaEntrada - item.realizadaSaida

                return (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded-lg border border-fyn-border p-2.5 hover:bg-fyn-surface/50 transition-colors"
                  >
                    <div className="w-12">
                      <span className="text-xs font-medium text-fyn-text">{item.mes}</span>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-fyn-muted">Entradas</span>
                          <span className={entradaDiff >= 0 ? "text-fyn-success" : "text-fyn-warning"}>
                            {formatCurrency(item.realizadaEntrada)}
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-fyn-border">
                          <div
                            className={`h-full ${entradaDiff >= 0 ? "bg-fyn-success" : "bg-fyn-warning"}`}
                            style={{
                              width: `${Math.min((item.realizadaEntrada / item.previstaEntrada) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-fyn-muted">Saídas</span>
                          <span className={saidaDiff <= 0 ? "text-fyn-success" : "text-fyn-danger"}>
                            {formatCurrency(item.realizadaSaida)}
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-fyn-border">
                          <div
                            className={`h-full ${saidaDiff <= 0 ? "bg-fyn-success" : "bg-fyn-danger"}`}
                            style={{
                              width: `${Math.min((item.realizadaSaida / item.previstaSaida) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="w-24 text-right">
                      <div className="text-xs text-fyn-muted">Resultado</div>
                      <div className="text-xs font-medium text-fyn-text">{formatCurrency(resultadoRealizado)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
