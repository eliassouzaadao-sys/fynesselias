"use client"

import { useState, useEffect, useMemo } from "react"
import { formatCurrency, formatDate } from "@/lib/format"
import {
  TrendingUp,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  CheckCircle2,
  BarChart3,
  ChevronRight,
  RefreshCw,
  Calendar,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// KPI Card Component
function KpiCard({ label, value, trend, trendValue, subtitle }) {
  const isPositive = trend === "up"
  const isNegative = trend === "down"

  return (
    <Card className="p-5 bg-card border-border hover:border-primary/30 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
        {trendValue && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            isPositive
              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
              : isNegative
                ? "bg-red-500/10 text-red-500 border border-red-500/20"
                : "bg-muted text-muted-foreground border border-border"
          }`}>
            {isPositive && <TrendingUp className="h-3 w-3" />}
            {isNegative && <TrendingDown className="h-3 w-3" />}
            {trendValue}
          </div>
        )}
      </div>
      {subtitle && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          {isPositive && <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
          {isNegative && <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
          <span className="text-muted-foreground">{subtitle}</span>
        </div>
      )}
    </Card>
  )
}

// Chart Tooltip Component
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm font-medium text-foreground">
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  )
}

// Conta List Item Component
function ContaItem({ conta }) {
  const isVencida = !conta.pago && new Date(conta.vencimento) < new Date()
  const isPagar = conta.tipo === "pagar"

  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border hover:border-primary/30 transition-all cursor-pointer group">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${isPagar ? "bg-red-500/10" : "bg-emerald-500/10"}`}>
          {isPagar ? (
            <ArrowDownCircle className={`h-4 w-4 ${isVencida ? "text-red-500" : "text-red-400"}`} />
          ) : (
            <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            {conta.beneficiario || conta.descricao || "Sem descricao"}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDate(new Date(conta.vencimento))}
            {isVencida && (
              <span className="ml-2 text-red-500 font-medium">Vencida</span>
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`font-semibold ${isPagar ? "text-red-500" : "text-emerald-500"}`}>
          {isPagar ? "-" : "+"} {formatCurrency(conta.valor)}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  )
}

export function DashboardContent() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [centrosReceita, setCentrosReceita] = useState([])
  const [centrosCusto, setCentrosCusto] = useState([])
  const [contas, setContas] = useState([])
  const [fluxoCaixa, setFluxoCaixa] = useState([])
  const [periodoGrafico, setPeriodoGrafico] = useState("30dias")

  // Filtros de mês e ano
  const dataAtual = new Date()
  const primeiroDiaMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1)
  const ultimoDiaMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0)
  const [mesSelecionado, setMesSelecionado] = useState(dataAtual.getMonth())
  const [anoSelecionado, setAnoSelecionado] = useState(dataAtual.getFullYear())
  const [filtroTipo, setFiltroTipo] = useState('mes') // 'mes' ou 'personalizado'
  const [dataInicial, setDataInicial] = useState(primeiroDiaMes.toISOString().split('T')[0])
  const [dataFinal, setDataFinal] = useState(ultimoDiaMes.toISOString().split('T')[0])

  // Nomes dos meses
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  // Anos disponíveis (últimos 5 anos)
  const anosDisponiveis = Array.from({ length: 5 }, (_, i) => dataAtual.getFullYear() - 2 + i)

  // Calcular datas do mês selecionado
  const calcularDatasDoMes = (mes, ano) => {
    const primeiroDia = new Date(ano, mes, 1)
    const ultimoDia = new Date(ano, mes + 1, 0)
    return {
      inicio: primeiroDia.toISOString().split('T')[0],
      fim: ultimoDia.toISOString().split('T')[0]
    }
  }

  async function fetchData(inicio = dataInicial, fim = dataFinal) {
    try {
      // Parâmetros de data para centros
      const params = new URLSearchParams({
        dataInicio: inicio,
        dataFim: fim
      })

      // Fazer todas as chamadas em paralelo para melhor performance
      const [centrosReceitaRes, centrosCustoRes, contasRes, fluxoRes] = await Promise.all([
        fetch(`/api/centros?tipo=faturamento&${params.toString()}`),
        fetch(`/api/centros?tipo=despesa&${params.toString()}`),
        fetch("/api/contas"),
        fetch("/api/fluxo-caixa"),
      ])

      const [centrosReceitaData, centrosCustoData, contasData, fluxoData] = await Promise.all([
        centrosReceitaRes.json(),
        centrosCustoRes.json(),
        contasRes.json(),
        fluxoRes.json(),
      ])

      setCentrosReceita(Array.isArray(centrosReceitaData) ? centrosReceitaData.filter(c => !c.parentId) : [])
      setCentrosCusto(Array.isArray(centrosCustoData) ? centrosCustoData.filter(c => !c.parentId) : [])

      setContas(Array.isArray(contasData) ? contasData : [])
      setFluxoCaixa(Array.isArray(fluxoData) ? fluxoData : [])
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Load data on mount
  useEffect(() => {
    const { inicio, fim } = calcularDatasDoMes(mesSelecionado, anoSelecionado)
    setDataInicial(inicio)
    setDataFinal(fim)
    fetchData(inicio, fim)
  }, [])

  // Recarregar quando mês/ano mudar (filtro por mês)
  useEffect(() => {
    if (filtroTipo === 'mes') {
      const { inicio, fim } = calcularDatasDoMes(mesSelecionado, anoSelecionado)
      setDataInicial(inicio)
      setDataFinal(fim)
      fetchData(inicio, fim)
    }
  }, [mesSelecionado, anoSelecionado, filtroTipo])

  // Recarregar quando datas personalizadas mudarem
  useEffect(() => {
    if (filtroTipo === 'personalizado' && dataInicial && dataFinal) {
      fetchData(dataInicial, dataFinal)
    }
  }, [dataInicial, dataFinal, filtroTipo])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData(dataInicial, dataFinal)
  }

  // Calculate KPIs
  const totalReceitaPrevista = centrosReceita.reduce((acc, c) => acc + (c.previsto || 0), 0)
  const totalReceitaRealizada = centrosReceita.reduce((acc, c) => acc + (c.realizado || 0), 0)
  const totalCustoPrevisto = centrosCusto.reduce((acc, c) => acc + (c.previsto || 0), 0)
  const totalCustoRealizado = centrosCusto.reduce((acc, c) => acc + (c.realizado || 0), 0)

  const resultadoPrevisto = totalReceitaPrevista - totalCustoPrevisto
  const resultadoRealizado = totalReceitaRealizada - totalCustoRealizado

  // Para calcular A Pagar e A Receber corretamente:
  // - Excluir contas pai de parcelamento (que têm totalParcelas definido)
  // - Para parcelamentos, usar as parcelas individuais (que estão dentro de cada conta pai)
  // - Aplicar filtro de data

  // Obter datas do período selecionado
  const dataInicioFiltro = new Date(dataInicial + "T00:00:00")
  const dataFimFiltro = new Date(dataFinal + "T23:59:59")

  // Função para verificar se uma conta está no período
  const contaNoPeriodo = (conta) => {
    const vencimento = new Date(conta.vencimento)
    return vencimento >= dataInicioFiltro && vencimento <= dataFimFiltro
  }

  // Extrair todas as contas individuais (excluindo pais de parcelamento)
  // Para cada conta pai com parcelas, usamos as parcelas individuais
  // Para contas simples (sem totalParcelas), usamos a própria conta
  const todasContasIndividuais = contas.flatMap((conta) => {
    // Se é uma conta pai de parcelamento (tem totalParcelas > 0), usar as parcelas
    if (conta.totalParcelas && conta.totalParcelas > 0 && conta.parcelas?.length > 0) {
      // Herdar tipo do pai para parcelas que não têm tipo definido
      return conta.parcelas.map(p => ({
        ...p,
        tipo: p.tipo || conta.tipo
      }))
    }
    // Se é uma conta simples (sem parcelamento), usar a própria conta
    return [conta]
  })

  // Filtrar por tipo e período
  const contasPagar = todasContasIndividuais.filter((c) => c.tipo === "pagar" && contaNoPeriodo(c))
  const contasReceber = todasContasIndividuais.filter((c) => c.tipo === "receber" && contaNoPeriodo(c))

  const totalAPagar = contasPagar.filter((c) => !c.pago).reduce((acc, c) => acc + (c.valor || 0), 0)
  const totalAReceber = contasReceber.filter((c) => !c.pago).reduce((acc, c) => acc + (c.valor || 0), 0)

  // Contagem de contas pendentes (para exibir nos KPIs)
  const qtdContasPagarPendentes = contasPagar.filter((c) => !c.pago).length
  const qtdContasReceberPendentes = contasReceber.filter((c) => !c.pago).length

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const proximaSemana = new Date()
  proximaSemana.setDate(proximaSemana.getDate() + 7)
  // Usar todasContasIndividuais para próximos vencimentos (exclui contas pai de parcelamento)
  const contasProximas = todasContasIndividuais
    .filter((c) => !c.pago && new Date(c.vencimento) >= hoje && new Date(c.vencimento) <= proximaSemana)
    .sort((a, b) => new Date(a.vencimento) - new Date(b.vencimento))
    .slice(0, 5)

  const saldoCaixa = fluxoCaixa[0]?.fluxo || 0

  // Calculate trends
  const receitaTrend = totalReceitaPrevista > 0
    ? ((totalReceitaRealizada - totalReceitaPrevista) / totalReceitaPrevista * 100).toFixed(1)
    : 0
  const custoTrend = totalCustoPrevisto > 0
    ? ((totalCustoRealizado - totalCustoPrevisto) / totalCustoPrevisto * 100).toFixed(1)
    : 0

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!fluxoCaixa.length) return []

    const diasPeriodo = periodoGrafico === "7dias" ? 7 : periodoGrafico === "30dias" ? 30 : 90
    const dataInicio = new Date()
    dataInicio.setDate(dataInicio.getDate() - diasPeriodo)

    const fluxoFiltrado = fluxoCaixa
      .filter((f) => new Date(f.dia) >= dataInicio)
      .sort((a, b) => new Date(a.dia) - new Date(b.dia))

    const grouped = {}
    fluxoFiltrado.forEach((item) => {
      const dateKey = new Date(item.dia).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
      if (!grouped[dateKey]) {
        grouped[dateKey] = { date: dateKey, entradas: 0, saidas: 0, saldo: item.fluxo || 0 }
      }
      if (item.tipo === "entrada") {
        grouped[dateKey].entradas += item.valor || 0
      } else {
        grouped[dateKey].saidas += item.valor || 0
      }
      grouped[dateKey].saldo = item.fluxo || 0
    })

    return Object.values(grouped)
  }, [fluxoCaixa, periodoGrafico])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Visao geral das suas financas</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {filtroTipo === 'mes' ? (
            <>
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <select
                value={mesSelecionado}
                onChange={(e) => setMesSelecionado(parseInt(e.target.value))}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {meses.map((mes, index) => (
                  <option key={index} value={index}>{mes}</option>
                ))}
              </select>
              <select
                value={anoSelecionado}
                onChange={(e) => setAnoSelecionado(parseInt(e.target.value))}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {anosDisponiveis.map((ano) => (
                  <option key={ano} value={ano}>{ano}</option>
                ))}
              </select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFiltroTipo('personalizado')}
                className="text-xs"
              >
                Personalizado
              </Button>
            </>
          ) : (
            <>
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={dataInicial}
                onChange={(e) => setDataInicial(e.target.value)}
                className="w-36"
              />
              <span className="text-muted-foreground text-sm">até</span>
              <Input
                type="date"
                value={dataFinal}
                onChange={(e) => setDataFinal(e.target.value)}
                className="w-36"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFiltroTipo('mes')}
                className="text-xs"
              >
                Por Mês
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Saldo de Caixa"
          value={formatCurrency(saldoCaixa)}
          trend={saldoCaixa >= 0 ? "up" : "down"}
          trendValue={saldoCaixa >= 0 ? "Positivo" : "Negativo"}
          subtitle="Saldo atual consolidado"
        />
        <KpiCard
          label="A Receber"
          value={formatCurrency(totalAReceber)}
          trend="up"
          trendValue={`${qtdContasReceberPendentes} contas`}
          subtitle="Total pendente de recebimento"
        />
        <KpiCard
          label="A Pagar"
          value={formatCurrency(totalAPagar)}
          trend="down"
          trendValue={`${qtdContasPagarPendentes} contas`}
          subtitle="Total pendente de pagamento"
        />
        <KpiCard
          label="Resultado Realizado"
          value={formatCurrency(resultadoRealizado)}
          trend={resultadoRealizado >= 0 ? "up" : "down"}
          trendValue={resultadoRealizado >= 0 ? "Lucro" : "Prejuizo"}
          subtitle="Receitas - Despesas realizadas"
        />
      </div>

      {/* Chart Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Fluxo de Caixa</h2>
            <p className="text-sm text-muted-foreground">Evolucao do saldo ao longo do tempo</p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setPeriodoGrafico("7dias")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                periodoGrafico === "7dias"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              7 dias
            </button>
            <button
              onClick={() => setPeriodoGrafico("30dias")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                periodoGrafico === "30dias"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              30 dias
            </button>
            <button
              onClick={() => setPeriodoGrafico("90dias")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                periodoGrafico === "90dias"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              90 dias
            </button>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="saldo"
                  name="Saldo"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#colorSaldo)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhuma movimentacao no periodo</p>
            </div>
          </div>
        )}
      </Card>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Proximos Vencimentos */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Proximos Vencimentos</h3>
                <p className="text-xs text-muted-foreground">Nos proximos 7 dias</p>
              </div>
            </div>
          </div>

          {contasProximas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle2 className="h-12 w-12 text-emerald-500/50 mb-3" />
              <p className="text-muted-foreground">Nenhuma conta nos proximos 7 dias</p>
              <p className="text-sm text-muted-foreground/70">Voce esta em dia!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {contasProximas.map((conta) => (
                <ContaItem key={conta.id} conta={conta} />
              ))}
            </div>
          )}
        </Card>

        {/* Comparativo Receitas vs Despesas */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Comparativo</h3>
              <p className="text-xs text-muted-foreground">Previsto vs Realizado</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Receitas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Receitas
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  Number(receitaTrend) >= 0
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-red-500/10 text-red-500"
                }`}>
                  {Number(receitaTrend) >= 0 ? "+" : ""}{receitaTrend}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Previsto</span>
                <span className="text-foreground">{formatCurrency(totalReceitaPrevista)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Realizado</span>
                <span className="font-semibold text-emerald-500">{formatCurrency(totalReceitaRealizada)}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((totalReceitaRealizada / (totalReceitaPrevista || 1)) * 100, 100)}%`
                  }}
                />
              </div>
            </div>

            {/* Despesas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  Despesas
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  Number(custoTrend) <= 0
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-red-500/10 text-red-500"
                }`}>
                  {Number(custoTrend) >= 0 ? "+" : ""}{custoTrend}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Previsto</span>
                <span className="text-foreground">{formatCurrency(totalCustoPrevisto)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Realizado</span>
                <span className="font-semibold text-red-500">{formatCurrency(totalCustoRealizado)}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((totalCustoRealizado / (totalCustoPrevisto || 1)) * 100, 100)}%`
                  }}
                />
              </div>
            </div>

            {/* Resultado */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">Resultado</span>
                <span className={`text-lg font-bold ${resultadoRealizado >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {formatCurrency(resultadoRealizado)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
