"use client"

import { useState, useEffect, Fragment } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { formatCurrency, formatPercentage } from "@/lib/format"
import { ArrowUpCircle, ArrowDownCircle, Calendar, ChevronRight, ChevronDown, TrendingUp, Filter, Building2 } from "lucide-react"

export function BalanceteSimplesContent() {
  // Filtro de data - padrão: mês atual
  const hoje = new Date()
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
  const [dataInicial, setDataInicial] = useState(primeiroDiaMes.toISOString().split('T')[0])
  const [dataFinal, setDataFinal] = useState(ultimoDiaMes.toISOString().split('T')[0])

  // Filtros de mês e ano
  const [mesSelecionado, setMesSelecionado] = useState(hoje.getMonth())
  const [anoSelecionado, setAnoSelecionado] = useState(hoje.getFullYear())
  const [filtroTipo, setFiltroTipo] = useState('mes') // 'mes' ou 'personalizado'

  const [centrosReceita, setCentrosReceita] = useState([])
  const [centrosCusto, setCentrosCusto] = useState([])
  const [expandedCenters, setExpandedCenters] = useState(new Set())
  const [loading, setLoading] = useState(true)

  // Modal de filtro por centro de custo
  const [filtroModalOpen, setFiltroModalOpen] = useState(false)
  const [centroSelecionado, setCentroSelecionado] = useState(null)
  const [contasCentro, setContasCentro] = useState([])
  const [loadingContas, setLoadingContas] = useState(false)
  const [todasContas, setTodasContas] = useState([])

  // Nomes dos meses
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  // Anos disponíveis (últimos 5 anos)
  const anosDisponiveis = Array.from({ length: 5 }, (_, i) => hoje.getFullYear() - 2 + i)

  // Calcular datas do mês selecionado
  const calcularDatasDoMes = (mes, ano) => {
    const primeiroDia = new Date(ano, mes, 1)
    const ultimoDia = new Date(ano, mes + 1, 0)
    return {
      inicio: primeiroDia.toISOString().split('T')[0],
      fim: ultimoDia.toISOString().split('T')[0]
    }
  }

  // Load centros from API
  const loadCentros = async (inicio = dataInicial, fim = dataFinal) => {
    try {
      setLoading(true);
      // Parâmetros de data
      const params = new URLSearchParams({
        dataInicio: inicio,
        dataFim: fim
      });

      // Requisições sequenciais para evitar conflitos de concorrência
      const receitaRes = await fetch(
        `/api/centros?tipo=faturamento&${params.toString()}`
      );
      const custoRes = await fetch(
        `/api/centros?tipo=despesa&${params.toString()}`
      );

      if (receitaRes.ok && custoRes.ok) {
        const receita = await receitaRes.json();
        const custo = await custoRes.json();
        setCentrosReceita(Array.isArray(receita) ? receita : []);
        setCentrosCusto(Array.isArray(custo) ? custo : []);
      }
    } catch (error) {
      console.error("Failed to load centros:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load contas from API
  const loadContas = async () => {
    try {
      const res = await fetch("/api/contas")
      if (res.ok) {
        const data = await res.json()
        setTodasContas(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Failed to load contas:', error)
    }
  }

  // Load data on mount
  useEffect(() => {
    loadContas()
  }, [])

  // Recarregar quando mês/ano mudar (filtro por mês)
  useEffect(() => {
    if (filtroTipo === 'mes') {
      const { inicio, fim } = calcularDatasDoMes(mesSelecionado, anoSelecionado)
      setDataInicial(inicio)
      setDataFinal(fim)
      loadCentros(inicio, fim)
    }
  }, [mesSelecionado, anoSelecionado, filtroTipo])

  // Recarregar quando datas personalizadas mudarem
  useEffect(() => {
    if (filtroTipo === 'personalizado' && dataInicial && dataFinal) {
      loadCentros(dataInicial, dataFinal)
    }
  }, [dataInicial, dataFinal, filtroTipo])

  // Selecionar centro de custo e filtrar contas
  const selecionarCentro = (centro) => {
    setCentroSelecionado(centro)
    setLoadingContas(true)

    // Filtrar contas pelo codigoTipo (sigla do centro)
    const contasFiltradas = todasContas
      .filter(conta => conta.codigoTipo === centro.sigla)
      .sort((a, b) => b.valor - a.valor) // Ordenar do maior para o menor

    setContasCentro(contasFiltradas)
    setLoadingContas(false)
  }

  // Calcular total das contas do centro selecionado
  const totalContasCentro = contasCentro.reduce((acc, conta) => acc + (conta.valor || 0), 0)

  // Todos os centros combinados para o modal
  const todosCentros = [...centrosReceita, ...centrosCusto]

  // Calculate totals (only previsto)
  const totalReceitaPrevista = centrosReceita.reduce((acc, c) => acc + (c.previsto || 0), 0)
  const totalCustoPrevisto = centrosCusto.reduce((acc, c) => acc + (c.previsto || 0), 0)
  const resultadoPrevisto = totalReceitaPrevista - totalCustoPrevisto

  const toggleExpanded = (centroId) => {
    const newExpanded = new Set(expandedCenters)
    if (newExpanded.has(centroId)) {
      newExpanded.delete(centroId)
    } else {
      newExpanded.add(centroId)
    }
    setExpandedCenters(newExpanded)
  }

  const getSubcentros = (parentId, lista) => {
    return lista.filter(c => c.parentId === parentId)
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Balancete Simplificado - Previsto"
        description="Visão dos valores previstos por centro de custo e receita"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFiltroModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtro por Centro de Custo/Receita
            </Button>
            <div className="h-4 w-px bg-border mx-2" />

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
          </div>
        }
      />

      {/* Resumo Geral - Apenas Previstos */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-emerald-500/10 p-2">
                <ArrowUpCircle className="h-4 w-4 text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-foreground">Receitas Previstas</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted-foreground">Total Previsto</span>
              <span className="text-lg font-bold text-emerald-600">
                {formatCurrency(totalReceitaPrevista)}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-red-500/10 p-2">
                <ArrowDownCircle className="h-4 w-4 text-red-600" />
              </div>
              <span className="text-sm font-medium text-foreground">Despesas Previstas</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted-foreground">Total Previsto</span>
              <span className="text-lg font-bold text-red-600">
                {formatCurrency(totalCustoPrevisto)}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/20 p-2">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">Resultado Previsto</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted-foreground">Saldo Previsto</span>
              <span className={`text-lg font-bold ${resultadoPrevisto >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {formatCurrency(resultadoPrevisto)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Centros de Custo e Receita */}
      <div className="grid gap-4 xl:grid-cols-2">
        {/* Centros de Receita */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ArrowUpCircle className="h-4 w-4 text-emerald-600" />
              Centros de Receita
            </h3>
          </div>
          <div className="overflow-x-auto">
            {centrosReceita.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Nenhum centro de receita cadastrado</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="w-8"></th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase">Centro de Receita</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase">Sigla</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase">Previsto</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase">%</th>
                  </tr>
                </thead>
                <tbody>
                  {centrosReceita.filter(c => !c.parentId).map((centro) => {
                    const subcentros = getSubcentros(centro.id, centrosReceita)
                    const hasSubcentros = subcentros.length > 0
                    const isExpanded = expandedCenters.has(centro.id)
                    const percentual = totalReceitaPrevista > 0 ? (centro.previsto / totalReceitaPrevista) * 100 : 0

                    return (
                      <Fragment key={centro.id}>
                        <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-2">
                            {hasSubcentros ? (
                              <button
                                onClick={() => toggleExpanded(centro.id)}
                                className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                title={isExpanded ? "Recolher" : "Expandir"}
                              >
                                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                              </button>
                            ) : (
                              <div className="w-4"></div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-sm text-foreground font-medium">{centro.nome}</td>
                          <td className="py-3 px-3">
                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{centro.sigla}</span>
                          </td>
                          <td className="py-3 px-3 text-sm font-medium text-foreground text-right">{formatCurrency(centro.previsto)}</td>
                          <td className="py-3 px-3 text-sm text-muted-foreground text-right">{formatPercentage(percentual)}</td>
                        </tr>
                        {isExpanded && subcentros.map((subcentro) => {
                          const subPercentual = totalReceitaPrevista > 0 ? (subcentro.previsto / totalReceitaPrevista) * 100 : 0
                          return (
                            <tr key={subcentro.id} className="border-b border-border hover:bg-muted/50 transition-colors bg-muted/30">
                              <td className="py-2 px-2"></td>
                              <td className="py-2 px-3 text-sm text-foreground pl-8">
                                <span className="text-muted-foreground mr-1.5">↳</span>
                                {subcentro.nome}
                              </td>
                              <td className="py-2 px-3">
                                <span className="text-[10px] text-muted-foreground bg-card px-1.5 py-0.5 rounded">{subcentro.sigla}</span>
                              </td>
                              <td className="py-2 px-3 text-sm font-medium text-foreground text-right">{formatCurrency(subcentro.previsto)}</td>
                              <td className="py-2 px-3 text-sm text-muted-foreground text-right">{formatPercentage(subPercentual)}</td>
                            </tr>
                          )
                        })}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        {/* Centros de Custo */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ArrowDownCircle className="h-4 w-4 text-red-600" />
              Centros de Custo
            </h3>
          </div>
          <div className="overflow-x-auto">
            {centrosCusto.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Nenhum centro de custo cadastrado</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="w-8"></th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase">Centro de Custo</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase">Sigla</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase">Previsto</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase">%</th>
                  </tr>
                </thead>
                <tbody>
                  {centrosCusto.filter(c => !c.parentId).map((centro) => {
                    const subcentros = getSubcentros(centro.id, centrosCusto)
                    const hasSubcentros = subcentros.length > 0
                    const isExpanded = expandedCenters.has(centro.id)
                    const percentual = totalCustoPrevisto > 0 ? (centro.previsto / totalCustoPrevisto) * 100 : 0

                    return (
                      <Fragment key={centro.id}>
                        <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-2">
                            {hasSubcentros ? (
                              <button
                                onClick={() => toggleExpanded(centro.id)}
                                className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                title={isExpanded ? "Recolher" : "Expandir"}
                              >
                                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                              </button>
                            ) : (
                              <div className="w-4"></div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-sm text-foreground font-medium">{centro.nome}</td>
                          <td className="py-3 px-3">
                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{centro.sigla}</span>
                          </td>
                          <td className="py-3 px-3 text-sm font-medium text-foreground text-right">{formatCurrency(centro.previsto)}</td>
                          <td className="py-3 px-3 text-sm text-muted-foreground text-right">{formatPercentage(percentual)}</td>
                        </tr>
                        {isExpanded && subcentros.map((subcentro) => {
                          const subPercentual = totalCustoPrevisto > 0 ? (subcentro.previsto / totalCustoPrevisto) * 100 : 0
                          return (
                            <tr key={subcentro.id} className="border-b border-border hover:bg-muted/50 transition-colors bg-muted/30">
                              <td className="py-2 px-2"></td>
                              <td className="py-2 px-3 text-sm text-foreground pl-8">
                                <span className="text-muted-foreground mr-1.5">↳</span>
                                {subcentro.nome}
                              </td>
                              <td className="py-2 px-3">
                                <span className="text-[10px] text-muted-foreground bg-card px-1.5 py-0.5 rounded">{subcentro.sigla}</span>
                              </td>
                              <td className="py-2 px-3 text-sm font-medium text-foreground text-right">{formatCurrency(subcentro.previsto)}</td>
                              <td className="py-2 px-3 text-sm text-muted-foreground text-right">{formatPercentage(subPercentual)}</td>
                            </tr>
                          )
                        })}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      {/* Modal de Filtro por Centro de Custo */}
      <Modal
        isOpen={filtroModalOpen}
        onClose={() => {
          setFiltroModalOpen(false)
          setCentroSelecionado(null)
          setContasCentro([])
        }}
        title="Filtro por Centro de Custo/Receita"
        description="Selecione um centro de custo ou receita para ver as contas relacionadas"
        size="xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[400px]">
          {/* Coluna Esquerda - Lista de Centros de Custo */}
          <div className="border border-border rounded-lg p-4 overflow-auto max-h-[500px]">
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Centros de Custo e Receita
            </h4>

            {todosCentros.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Nenhum centro cadastrado</p>
              </div>
            ) : (
              <div className="space-y-1">
                {todosCentros.filter(c => !c.parentId).map((centro) => {
                  const subcentros = todosCentros.filter(c => c.parentId === centro.id)
                  const isSelected = centroSelecionado?.id === centro.id
                  const isCusto = centro.tipo === 'despesa'

                  return (
                    <div key={centro.id}>
                      <button
                        onClick={() => selecionarCentro(centro)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                          isSelected
                            ? 'bg-primary/20 border border-primary text-foreground'
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isCusto ? (
                            <ArrowDownCircle className="h-3.5 w-3.5 text-red-600" />
                          ) : (
                            <ArrowUpCircle className="h-3.5 w-3.5 text-emerald-600" />
                          )}
                          <span className="text-sm font-medium">{centro.nome}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground bg-card px-1.5 py-0.5 rounded">{centro.sigla}</span>
                      </button>

                      {/* Subcentros */}
                      {subcentros.length > 0 && (
                        <div className="ml-4 mt-1 space-y-1">
                          {subcentros.map((sub) => {
                            const isSubSelected = centroSelecionado?.id === sub.id
                            return (
                              <button
                                key={sub.id}
                                onClick={() => selecionarCentro(sub)}
                                className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                                  isSubSelected
                                    ? 'bg-primary/20 border border-primary text-foreground'
                                    : 'hover:bg-muted text-muted-foreground'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">↳</span>
                                  <span className="text-xs">{sub.nome}</span>
                                </div>
                                <span className="text-[10px] text-muted-foreground bg-card px-1.5 py-0.5 rounded">{sub.sigla}</span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Coluna Direita - Detalhes do Centro Selecionado */}
          <div className="border border-border rounded-lg p-4 overflow-auto max-h-[500px]">
            {!centroSelecionado ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Selecione um centro</p>
                <p className="text-xs text-muted-foreground/70 mt-1">para ver as contas relacionadas</p>
              </div>
            ) : (
              <div>
                {/* Header do Centro Selecionado */}
                <div className="mb-4 pb-4 border-b border-border">
                  <div className="flex items-center gap-2 mb-2">
                    {centroSelecionado.tipo === 'despesa' ? (
                      <ArrowDownCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <ArrowUpCircle className="h-5 w-5 text-emerald-600" />
                    )}
                    <h4 className="text-lg font-semibold text-foreground">{centroSelecionado.nome}</h4>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{centroSelecionado.sigla}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Valor Total</p>
                      <p className={`text-lg font-bold ${centroSelecionado.tipo === 'despesa' ? 'text-red-600' : 'text-emerald-600'}`}>
                        {formatCurrency(totalContasCentro)}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Percentual do Total</p>
                      <p className="text-lg font-bold text-primary">
                        {formatPercentage(
                          centroSelecionado.tipo === 'despesa'
                            ? (totalCustoPrevisto > 0 ? (totalContasCentro / totalCustoPrevisto) * 100 : 0)
                            : (totalReceitaPrevista > 0 ? (totalContasCentro / totalReceitaPrevista) * 100 : 0)
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tabela de Contas */}
                {loadingContas ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">Carregando contas...</p>
                  </div>
                ) : contasCentro.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">Nenhuma conta vinculada a este centro</p>
                  </div>
                ) : (
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground uppercase mb-2">
                      Contas ({contasCentro.length})
                    </h5>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Descrição</th>
                          <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Valor</th>
                          <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contasCentro.map((conta) => {
                          const percentualConta = totalContasCentro > 0 ? (conta.valor / totalContasCentro) * 100 : 0
                          return (
                            <tr key={conta.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                              <td className="py-2 px-2">
                                <div>
                                  <p className="text-sm text-foreground">{conta.descricao}</p>
                                  {conta.beneficiario && (
                                    <p className="text-xs text-muted-foreground">{conta.beneficiario}</p>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 px-2 text-right">
                                <span className={`text-sm font-medium ${conta.tipo === 'pagar' ? 'text-red-600' : 'text-emerald-600'}`}>
                                  {formatCurrency(conta.valor)}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-right">
                                <span className="text-xs text-muted-foreground">{formatPercentage(percentualConta)}</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
