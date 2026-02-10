"use client"

import { useState, useEffect, Fragment } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Drawer } from "@/components/ui/drawer"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { formatCurrency, formatPercentage } from "@/lib/format"
import { TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle, Calendar, Plus, Trash2, AlertTriangle, FolderPlus, ChevronRight, ChevronDown, Edit, PanelLeftClose, X, Loader2, Check, RefreshCw, Filter, Building2 } from "lucide-react"

// Componente de barra de progresso com suporte a valores acima de 100%
function ProgressBar({ percentage, variant = "success", showOverflow = true }) {
  const isOverflow = percentage > 100
  const basePercentage = Math.min(percentage, 100)

  const variantColors = {
    success: {
      base: "bg-emerald-500",
      overflow: "bg-emerald-500/60",
      marker: "bg-emerald-500/80"
    },
    warning: {
      base: "bg-amber-500",
      overflow: "bg-amber-500/60",
      marker: "bg-amber-500/80"
    },
    danger: {
      base: "bg-red-500",
      overflow: "bg-red-500/60",
      marker: "bg-red-500/80"
    }
  }

  const colors = variantColors[variant] || variantColors.success

  return (
    <div className="relative">
      <div className="h-2 w-full overflow-hidden rounded-full bg-border">
        {/* Barra base (até 100%) */}
        <div
          className={`h-full transition-all ${colors.base}`}
          style={{ width: `${basePercentage}%` }}
        />
      </div>

      {/* Indicador de overflow (acima de 100%) */}
      {showOverflow && isOverflow && (
        <>
          {/* Marcador do ponto 100% */}
          <div
            className="absolute top-0 h-2 w-0.5 bg-white/80 rounded-full shadow-sm"
            style={{ left: `calc(${(100 / percentage) * 100}% - 1px)` }}
            title="Meta 100%"
          />

          {/* Barra de overflow com padrão listrado */}
          <div
            className="absolute top-0 h-2 overflow-hidden rounded-r-full"
            style={{
              left: `${(100 / percentage) * 100}%`,
              width: `${100 - (100 / percentage) * 100}%`
            }}
          >
            <div
              className={`h-full w-full ${colors.overflow}`}
              style={{
                backgroundImage: `repeating-linear-gradient(
                  -45deg,
                  transparent,
                  transparent 2px,
                  rgba(255,255,255,0.3) 2px,
                  rgba(255,255,255,0.3) 4px
                )`
              }}
            />
          </div>

          {/* Badge indicando o excesso */}
          <div className="absolute -top-5 right-0 flex items-center gap-1">
            <span className={`text-[10px] font-medium ${
              variant === 'success' ? 'text-emerald-600' :
              variant === 'warning' ? 'text-amber-600' : 'text-red-600'
            }`}>
              +{Math.round(percentage - 100)}% acima
            </span>
          </div>
        </>
      )}
    </div>
  )
}

// Componente de Skeleton para estados de carregamento
// Melhora percepção de velocidade e indica ao usuário que conteúdo está sendo carregado
function Skeleton({ className = "", variant = "default" }) {
  const variants = {
    default: "bg-border/60",
    text: "bg-border/60 rounded",
    circle: "bg-border/60 rounded-full",
    card: "bg-border/40",
  }

  return (
    <div
      className={`animate-pulse ${variants[variant]} ${className}`}
      aria-hidden="true"
    />
  )
}

// Skeleton para os cards de resumo
function CardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="w-9 h-9 rounded-lg" />
          <Skeleton variant="text" className="w-20 h-4" />
        </div>
        <Skeleton variant="text" className="w-16 h-4" />
      </div>
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <Skeleton variant="text" className="w-14 h-3" />
          <Skeleton variant="text" className="w-24 h-4" />
        </div>
        <div className="flex items-baseline justify-between">
          <Skeleton variant="text" className="w-16 h-3" />
          <Skeleton variant="text" className="w-28 h-6" />
        </div>
        <div className="pt-1">
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
        <div className="text-right pt-1">
          <Skeleton variant="text" className="w-12 h-3 ml-auto" />
        </div>
      </div>
    </Card>
  )
}

// Skeleton para linhas da tabela
function TableRowSkeleton() {
  return (
    <tr className="border-b border-border">
      <td className="py-2 px-1 w-[72px]">
        <div className="flex items-center">
          <Skeleton className="w-8 h-8 rounded" />
          <Skeleton className="w-8 h-8 rounded" />
        </div>
      </td>
      <td className="py-2 px-2">
        <div className="flex items-center gap-1.5">
          <Skeleton variant="text" className="w-24 h-4" />
          <Skeleton variant="text" className="w-8 h-4 rounded" />
        </div>
      </td>
      <td className="py-2 px-1">
        <Skeleton variant="text" className="w-20 h-3 ml-auto" />
      </td>
      <td className="py-2 px-1">
        <Skeleton variant="text" className="w-20 h-3 ml-auto" />
      </td>
      <td className="py-2 px-1">
        <Skeleton variant="text" className="w-16 h-3 ml-auto" />
      </td>
      <td className="py-2 px-1 w-[68px]">
        <div className="flex items-center justify-end">
          <Skeleton className="w-7 h-7 rounded" />
          <Skeleton className="w-7 h-7 rounded" />
        </div>
      </td>
    </tr>
  )
}

// Skeleton para a tabela completa
function TableSkeleton({ rows = 3, title, icon: Icon, iconColor }) {
  return (
    <Card className="p-4 min-w-0">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${iconColor}`} />
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        <Skeleton variant="text" className="w-24 h-8 rounded-md" />
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="w-[72px]"></th>
            <th className="text-left py-2 px-2">
              <Skeleton variant="text" className="w-16 h-3" />
            </th>
            <th className="text-right py-2 px-1">
              <Skeleton variant="text" className="w-14 h-3 ml-auto" />
            </th>
            <th className="text-right py-2 px-1">
              <Skeleton variant="text" className="w-16 h-3 ml-auto" />
            </th>
            <th className="text-right py-2 px-1">
              <Skeleton variant="text" className="w-14 h-3 ml-auto" />
            </th>
            <th className="w-[68px]"></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} />
          ))}
        </tbody>
      </table>
    </Card>
  )
}

// Componente de botão de ação acessível com tooltip
// Tamanhos seguem guidelines de acessibilidade: mínimo 44x44px para touch (WCAG 2.1 / iOS / Android)
function ActionButton({ onClick, icon: Icon, label, variant = "default", size = "md", className = "" }) {
  const [showTooltip, setShowTooltip] = useState(false)

  const variants = {
    default: "text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted/80",
    edit: "text-muted-foreground hover:bg-primary/10 hover:text-primary active:bg-primary/20",
    delete: "text-muted-foreground hover:bg-red-500/10 hover:text-red-600 active:bg-red-500/20",
    success: "text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-600 active:bg-emerald-500/20",
  }

  // Tamanhos com área de toque adequada para dispositivos touch
  // sm: 36x36px (compacto mas ainda acessível)
  // md: 40x40px (padrão)
  // lg: 44x44px (mínimo recomendado WCAG 2.1 para touch)
  const sizes = {
    sm: "p-2 min-w-[36px] min-h-[36px]",
    md: "p-2.5 min-w-[40px] min-h-[40px]",
    lg: "p-3 min-w-[44px] min-h-[44px]",
  }

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  return (
    <div className="relative inline-flex">
      <button
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        className={`
          rounded-md flex items-center justify-center transition-colors
          focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1
          ${variants[variant]}
          ${sizes[size]}
          ${className}
        `}
        aria-label={label}
        type="button"
      >
        <Icon className={iconSizes[size]} aria-hidden="true" />
      </button>

      {/* Tooltip acessível */}
      {showTooltip && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1
                     bg-foreground text-white text-xs rounded shadow-lg whitespace-nowrap
                     z-50 pointer-events-none animate-in fade-in-0 zoom-in-95 duration-150"
        >
          {label}
          {/* Seta do tooltip */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="border-4 border-transparent border-t-foreground" />
          </div>
        </div>
      )}
    </div>
  )
}

export function ComparativoContent() {
  // Filtro de data - padrão: mês atual
  const hoje = new Date()
  const mesAtual = hoje.getMonth() // 0-11
  const anoAtual = hoje.getFullYear()

  // Estados para filtro por mês/ano
  const [mesSelecionado, setMesSelecionado] = useState(mesAtual) // 0-11, null = personalizado
  const [anoSelecionado, setAnoSelecionado] = useState(anoAtual)
  const [filtroTipo, setFiltroTipo] = useState("mes") // "mes" ou "personalizado"

  // Calcular datas baseado no mês/ano selecionado
  const calcularDatasDoMes = (mes, ano) => {
    const primeiroDia = new Date(ano, mes, 1)
    const ultimoDia = new Date(ano, mes + 1, 0) // Último dia do mês
    return {
      inicio: primeiroDia.toISOString().split('T')[0],
      fim: ultimoDia.toISOString().split('T')[0]
    }
  }

  const datasIniciais = calcularDatasDoMes(mesAtual, anoAtual)
  const [dataInicial, setDataInicial] = useState(datasIniciais.inicio)
  const [dataFinal, setDataFinal] = useState(datasIniciais.fim)

  // Estados para controle do filtro com feedback
  const [dataInicialAplicada, setDataInicialAplicada] = useState(datasIniciais.inicio)
  const [dataFinalAplicada, setDataFinalAplicada] = useState(datasIniciais.fim)
  const [filtroAlterado, setFiltroAlterado] = useState(false)
  const [aplicandoFiltro, setAplicandoFiltro] = useState(false)
  const [filtroAplicadoSucesso, setFiltroAplicadoSucesso] = useState(false)

  // Nomes dos meses abreviados
  const meses = [
    { nome: "Jan", completo: "Janeiro" },
    { nome: "Fev", completo: "Fevereiro" },
    { nome: "Mar", completo: "Março" },
    { nome: "Abr", completo: "Abril" },
    { nome: "Mai", completo: "Maio" },
    { nome: "Jun", completo: "Junho" },
    { nome: "Jul", completo: "Julho" },
    { nome: "Ago", completo: "Agosto" },
    { nome: "Set", completo: "Setembro" },
    { nome: "Out", completo: "Outubro" },
    { nome: "Nov", completo: "Novembro" },
    { nome: "Dez", completo: "Dezembro" }
  ]

  // Handler para seleção de mês
  const selecionarMes = (mes) => {
    setMesSelecionado(mes)
    setFiltroTipo("mes")
    const { inicio, fim } = calcularDatasDoMes(mes, anoSelecionado)
    setDataInicial(inicio)
    setDataFinal(fim)
  }

  // Handler para mudança de ano
  const mudarAno = (novoAno) => {
    setAnoSelecionado(novoAno)
    if (filtroTipo === "mes" && mesSelecionado !== null) {
      const { inicio, fim } = calcularDatasDoMes(mesSelecionado, novoAno)
      setDataInicial(inicio)
      setDataFinal(fim)
    }
  }

  // Handler para modo personalizado
  const ativarPersonalizado = () => {
    setFiltroTipo("personalizado")
    setMesSelecionado(null)
  }
  const [showNewCenterDrawer, setShowNewCenterDrawer] = useState(false)
  const [showNewSubcenterDrawer, setShowNewSubcenterDrawer] = useState(false)
  const [selectedTipo, setSelectedTipo] = useState("")
  const [centrosReceita, setCentrosReceita] = useState([])
  const [centrosCusto, setCentrosCusto] = useState([])

  // Modal de filtro por centro de custo
  const [filtroModalOpen, setFiltroModalOpen] = useState(false)
  const [centroSelecionado, setCentroSelecionado] = useState(null)
  const [contasCentro, setContasCentro] = useState([])
  const [loadingContas, setLoadingContas] = useState(false)
  const [todasContas, setTodasContas] = useState([])

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [centerToDelete, setCenterToDelete] = useState(null)
  const [parentCenterForSub, setParentCenterForSub] = useState(null)
  const [expandedCenters, setExpandedCenters] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [showEditDrawer, setShowEditDrawer] = useState(false)
  const [centerToEdit, setCenterToEdit] = useState(null)
  const [showDicaVisualizacao, setShowDicaVisualizacao] = useState(false)
  const [dicaHover, setDicaHover] = useState(false)

  // Carregar preferência da dica do localStorage (apenas primeira visita)
  useEffect(() => {
    const dicaOculta = localStorage.getItem('fyness_dica_comparativo_oculta')
    if (!dicaOculta) {
      setShowDicaVisualizacao(true)
    }
  }, [])

  // Função para ocultar dica permanentemente
  const ocultarDicaPermanente = () => {
    localStorage.setItem('fyness_dica_comparativo_oculta', 'true')
    setShowDicaVisualizacao(false)
  }

  // Função para fechar dica temporariamente (volta na próxima sessão)
  const fecharDicaTemporario = () => {
    setShowDicaVisualizacao(false)
  }

  // Load centros from API com filtro de período
  const loadCentros = async (inicio = dataInicial, fim = dataFinal) => {
    try {
      setLoading(true);
      // Passar datas como parâmetros para calcular valores do período
      const params = new URLSearchParams({
        dataInicio: inicio,
        dataFim: fim,
      });

      // Requisições em paralelo para melhor performance
      const [receitaRes, custoRes] = await Promise.all([
        fetch(`/api/centros?tipo=faturamento&${params.toString()}`),
        fetch(`/api/centros?tipo=despesa&${params.toString()}`),
      ]);

      if (receitaRes.ok && custoRes.ok) {
        const [receita, custo] = await Promise.all([
          receitaRes.json(),
          custoRes.json(),
        ]);
        setCentrosReceita(Array.isArray(receita) ? receita : []);
        setCentrosCusto(Array.isArray(custo) ? custo : []);
      }
    } catch (error) {
      console.error("Failed to load centros:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load contas from API para o filtro por centro
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

  // Load data on mount
  useEffect(() => {
    loadCentros()
    loadContas()
  }, [])

  // Detectar quando o filtro foi alterado
  useEffect(() => {
    const alterado = dataInicial !== dataInicialAplicada || dataFinal !== dataFinalAplicada
    setFiltroAlterado(alterado)
    // Limpar o estado de sucesso quando alterar novamente
    if (alterado) {
      setFiltroAplicadoSucesso(false)
    }
  }, [dataInicial, dataFinal, dataInicialAplicada, dataFinalAplicada])

  // Função para aplicar o filtro
  const aplicarFiltro = async () => {
    setAplicandoFiltro(true)
    setFiltroAplicadoSucesso(false)

    try {
      await loadCentros()
      // Atualizar as datas aplicadas
      setDataInicialAplicada(dataInicial)
      setDataFinalAplicada(dataFinal)
      setFiltroAlterado(false)
      setFiltroAplicadoSucesso(true)

      // Remover o indicador de sucesso após 3 segundos
      setTimeout(() => {
        setFiltroAplicadoSucesso(false)
      }, 3000)
    } catch (error) {
      console.error("Erro ao aplicar filtro:", error)
    } finally {
      setAplicandoFiltro(false)
    }
  }

  // Calculate totals from centros data
  // Soma apenas centros pai (sem parentId) pois eles já incluem os valores dos subcentros
  const totalReceitaPrevista = centrosReceita.filter(c => !c.parentId).reduce((acc, c) => acc + (c.previsto || 0), 0)
  const totalReceitaRealizada = centrosReceita.filter(c => !c.parentId).reduce((acc, c) => acc + (c.realizado || 0), 0)
  const totalCustoPrevisto = centrosCusto.filter(c => !c.parentId).reduce((acc, c) => acc + (c.previsto || 0), 0)
  const totalCustoRealizado = centrosCusto.filter(c => !c.parentId).reduce((acc, c) => acc + (c.realizado || 0), 0)

  const comparativoData = {
    entradas: {
      previsto: totalReceitaPrevista,
      realizado: totalReceitaRealizada,
      diferenca: totalReceitaRealizada - totalReceitaPrevista,
    },
    saidas: {
      previsto: totalCustoPrevisto,
      realizado: totalCustoRealizado,
      diferenca: totalCustoRealizado - totalCustoPrevisto,
    },
    resultado: {
      previsto: totalReceitaPrevista - totalCustoPrevisto,
      realizado: totalReceitaRealizada - totalCustoRealizado,
      diferenca: (totalReceitaRealizada - totalCustoRealizado) - (totalReceitaPrevista - totalCustoPrevisto),
    },
  }

  // Helper to calculate percentage safely (avoid NaN)
  const calcPercentage = (value, total) => {
    if (total === 0) return 0
    return (value / total) * 100
  }

  const handleSaveCenter = (centerData) => {
    // Reload data from API to ensure sync
    loadCentros()
    setShowNewCenterDrawer(false)
  }

  const handleEditCenter = (centro) => {
    setCenterToEdit(centro)
    setShowEditDrawer(true)
  }

  const handleDeleteCenter = (centroId, tipo, centroNome) => {
    setCenterToDelete({ id: centroId, tipo, nome: centroNome })
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (centerToDelete) {
      try {
        const response = await fetch(`/api/centros?id=${centerToDelete.id}`, {
          method: "DELETE",
        })

        if (response.ok) {
          // Reload data from API to ensure sync
          loadCentros()
        } else {
          const error = await response.json()
          alert(error.error || "Erro ao excluir centro")
        }
      } catch (error) {
        console.error("Error deleting centro:", error)
        alert("Erro ao excluir centro")
      }
    }
    setShowDeleteConfirm(false)
    setCenterToDelete(null)
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
    setCenterToDelete(null)
  }

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
        title="Comparativo Previsto vs Realizado"
        description="Análise comparativa entre valores previstos e realizados"
      />

      {/* Filtros de Período */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Período:</span>
          </div>

          {/* Seletor de Mês */}
          <select
            value={filtroTipo === "mes" ? mesSelecionado : ""}
            onChange={(e) => {
              const value = e.target.value
              if (value !== "") {
                selecionarMes(parseInt(value))
              }
            }}
            className="h-9 px-3 rounded-md border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="" disabled>Selecione o mês</option>
            {meses.map((mes, index) => (
              <option key={index} value={index}>{mes.completo}</option>
            ))}
          </select>

          {/* Seletor de Ano */}
          <select
            value={anoSelecionado}
            onChange={(e) => mudarAno(parseInt(e.target.value))}
            className="h-9 px-3 rounded-md border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {Array.from({ length: 5 }, (_, i) => anoAtual - 4 + i).map((ano) => (
              <option key={ano} value={ano}>{ano}</option>
            ))}
          </select>

          {/* Separador */}
          <span className="text-muted-foreground text-sm">ou</span>

          {/* Botão Personalizado */}
          <Button
            size="sm"
            variant={filtroTipo === "personalizado" ? "default" : "outline"}
            className="h-9"
            onClick={ativarPersonalizado}
          >
            Personalizado
          </Button>

          {/* Campos de Data Personalizada (quando ativo) */}
          {filtroTipo === "personalizado" && (
            <>
              <Input
                type="date"
                value={dataInicial}
                onChange={(e) => setDataInicial(e.target.value)}
                className="h-9 w-36"
              />
              <span className="text-muted-foreground text-sm">até</span>
              <Input
                type="date"
                value={dataFinal}
                onChange={(e) => setDataFinal(e.target.value)}
                className="h-9 w-36"
              />
            </>
          )}

          {/* Botão Aplicar */}
          <Button
            size="sm"
            onClick={aplicarFiltro}
            disabled={aplicandoFiltro || (!filtroAlterado && !filtroAplicadoSucesso)}
            className={`h-9 min-w-[100px] transition-all ${
              filtroAplicadoSucesso
                ? "bg-emerald-500 hover:bg-emerald-500/90 text-white"
                : filtroAlterado
                  ? "bg-amber-500 hover:bg-amber-500/90 text-white animate-pulse"
                  : ""
            }`}
          >
            {aplicandoFiltro ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Aplicando...
              </>
            ) : filtroAplicadoSucesso ? (
              <>
                <Check className="h-4 w-4 mr-1.5" />
                Aplicado
              </>
            ) : filtroAlterado ? (
              <>
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Aplicar
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-1.5" />
                Ativo
              </>
            )}
          </Button>

          {/* Indicador de filtro pendente */}
          {filtroAlterado && (
            <span className="text-xs text-amber-600 font-medium animate-pulse">
              • Alterado
            </span>
          )}

          {/* Separador */}
          <div className="h-6 w-px bg-border mx-1" />

          {/* Botão Filtro por Centro de Custo */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltroModalOpen(true)}
            className="h-9 flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtro por Centro de Custo/Receita
          </Button>
        </div>
      </Card>

      {/* Resumo Geral */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-emerald-500/10 p-2">
                    <ArrowUpCircle className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Entradas</span>
                </div>
                <span
                  className={`text-xs font-medium ${comparativoData.entradas.diferenca >= 0 ? "text-emerald-600" : "text-amber-600"}`}
                >
                  {comparativoData.entradas.diferenca >= 0 ? "+" : ""}
                  {formatCurrency(comparativoData.entradas.diferenca)}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Previsto</span>
                  <span className="text-sm font-medium text-foreground">
                    {formatCurrency(comparativoData.entradas.previsto)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Realizado</span>
                  <span className="text-lg font-bold text-foreground">
                    {formatCurrency(comparativoData.entradas.realizado)}
                  </span>
                </div>
                <div className="pt-1">
                  <ProgressBar
                    percentage={calcPercentage(comparativoData.entradas.realizado, comparativoData.entradas.previsto)}
                    variant={comparativoData.entradas.diferenca >= 0 ? "success" : "warning"}
                  />
                </div>
                <div className="text-right text-xs font-medium text-primary pt-1">
                  {formatPercentage(calcPercentage(comparativoData.entradas.realizado, comparativoData.entradas.previsto))}
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-red-500/10 p-2">
                    <ArrowDownCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Saídas</span>
                </div>
                <span
                  className={`text-xs font-medium ${comparativoData.saidas.diferenca <= 0 ? "text-emerald-600" : "text-red-600"}`}
                >
                  {comparativoData.saidas.diferenca >= 0 ? "+" : ""}
                  {formatCurrency(comparativoData.saidas.diferenca)}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Previsto</span>
                  <span className="text-sm font-medium text-foreground">
                    {formatCurrency(comparativoData.saidas.previsto)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Realizado</span>
                  <span className="text-lg font-bold text-foreground">
                    {formatCurrency(comparativoData.saidas.realizado)}
                  </span>
                </div>
                <div className="pt-1">
                  <ProgressBar
                    percentage={calcPercentage(comparativoData.saidas.realizado, comparativoData.saidas.previsto)}
                    variant={comparativoData.saidas.diferenca <= 0 ? "success" : "danger"}
                  />
                </div>
                <div className="text-right text-xs font-medium text-primary pt-1">
                  {formatPercentage(calcPercentage(comparativoData.saidas.realizado, comparativoData.saidas.previsto))}
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-primary/20 p-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Resultado</span>
                </div>
                <div
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    comparativoData.resultado.diferenca >= 0
                      ? "bg-emerald-500/20 text-emerald-600"
                      : "bg-red-500/20 text-red-600"
                  }`}
                >
                  {formatPercentage(calcPercentage(comparativoData.resultado.realizado, comparativoData.resultado.previsto))}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Previsto</span>
                  <span className="text-sm font-medium text-foreground">
                    {formatCurrency(comparativoData.resultado.previsto)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Realizado</span>
                  <span className="text-lg font-bold text-foreground">
                    {formatCurrency(comparativoData.resultado.realizado)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">Diferença</span>
                  <span
                    className={`text-sm font-bold ${comparativoData.resultado.diferenca >= 0 ? "text-emerald-600" : "text-red-600"}`}
                  >
                    {comparativoData.resultado.diferenca >= 0 ? "+" : ""}
                    {formatCurrency(comparativoData.resultado.diferenca)}
                  </span>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>


      {/* Dica de visualização - compacta com opção de não mostrar novamente */}
      {showDicaVisualizacao && (
        <div
          className="relative group"
          onMouseEnter={() => setDicaHover(true)}
          onMouseLeave={() => setDicaHover(false)}
        >
          <div className={`flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg text-foreground text-xs transition-all ${
            dicaHover ? "bg-primary/10" : ""
          }`}>
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 shrink-0">
              <PanelLeftClose className="h-3 w-3 text-primary" />
            </div>
            <span className="flex-1 text-muted-foreground">
              Recolha o menu lateral para melhor visualização
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={ocultarDicaPermanente}
                className="px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors whitespace-nowrap"
                title="Não mostrar esta dica novamente"
              >
                Não mostrar mais
              </button>
              <button
                onClick={fecharDicaTemporario}
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                title="Fechar (mostrará novamente na próxima sessão)"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Centros de Custo e Receita */}
      <div className="grid gap-4 xl:grid-cols-2">
        {/* Centros de Receita */}
        {loading ? (
          <TableSkeleton
            rows={3}
            title="Centros de Receita"
            icon={ArrowUpCircle}
            iconColor="text-emerald-600"
          />
        ) : (
        <Card className="p-4 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ArrowUpCircle className="h-4 w-4 text-emerald-600" />
              Centros de Receita
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedTipo("faturamento")
                setShowNewCenterDrawer(true)
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Novo Centro
            </Button>
          </div>
          <div>
            {centrosReceita.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                {/* Ilustração contextual */}
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                  <ArrowUpCircle className="h-8 w-8 text-emerald-600/60" />
                </div>

                {/* Texto explicativo */}
                <h4 className="text-sm font-medium text-foreground mb-1">
                  Nenhum centro de receita cadastrado
                </h4>
                <p className="text-xs text-muted-foreground text-center max-w-[250px] mb-4">
                  Crie centros de receita para organizar e acompanhar suas fontes de faturamento
                </p>

                {/* CTA primário */}
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedTipo("faturamento")
                    setShowNewCenterDrawer(true)
                  }}
                  className="bg-emerald-500 hover:bg-emerald-500/90 text-white"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Criar primeiro centro de receita
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full min-w-[650px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="w-[72px]"></th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground uppercase">Centro</th>
                    <th className="text-left py-2 px-1 text-xs font-medium text-muted-foreground uppercase">Sigla</th>
                    <th className="text-right py-2 px-1 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">Previsto</th>
                    <th className="text-right py-2 px-1 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">Realizado</th>
                    <th className="text-right py-2 px-1 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">Variação</th>
                    <th className="w-[68px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {centrosReceita.filter(c => !c.parentId).map((centro) => {
                    const variacao = centro.realizado - centro.previsto
                    const subcentros = getSubcentros(centro.id, centrosReceita)
                    const hasSubcentros = subcentros.length > 0
                    const isExpanded = expandedCenters.has(centro.id)

                    return (
                      <Fragment key={centro.id}>
                        <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="py-2 px-1">
                            <div className="flex items-center">
                              {hasSubcentros ? (
                                <ActionButton
                                  onClick={() => toggleExpanded(centro.id)}
                                  icon={isExpanded ? ChevronDown : ChevronRight}
                                  label={isExpanded ? `Recolher subcentros de ${centro.nome}` : `Expandir ${subcentros.length} subcentro${subcentros.length > 1 ? 's' : ''} de ${centro.nome}`}
                                  size="sm"
                                />
                              ) : (
                                <div className="w-9"></div>
                              )}
                              <ActionButton
                                onClick={() => {
                                  setParentCenterForSub(centro)
                                  setShowNewSubcenterDrawer(true)
                                }}
                                icon={FolderPlus}
                                label={`Adicionar subcentro em ${centro.nome}`}
                                variant="success"
                                size="sm"
                              />
                            </div>
                          </td>
                          <td className="py-2 px-2">
                            <span className="text-sm text-foreground font-medium truncate">{centro.nome}</span>
                          </td>
                          <td className="py-2 px-1">
                            <span className="text-[10px] text-muted-foreground bg-muted px-1 py-0.5 rounded">{centro.sigla}</span>
                          </td>
                          <td className="py-2 px-1 text-xs text-foreground text-right tabular-nums whitespace-nowrap">{formatCurrency(centro.previsto)}</td>
                          <td className="py-2 px-1 text-xs font-medium text-foreground text-right tabular-nums whitespace-nowrap">{formatCurrency(centro.realizado)}</td>
                          <td className={`py-2 px-1 text-xs font-medium text-right tabular-nums whitespace-nowrap ${variacao >= 0 ? "text-emerald-600" : "text-amber-600"}`}>
                            {variacao >= 0 ? "+" : ""}{formatCurrency(variacao)}
                          </td>
                          <td className="py-2 px-1">
                            <div className="flex items-center justify-end">
                              <ActionButton
                                onClick={() => handleEditCenter(centro)}
                                icon={Edit}
                                label={`Editar centro ${centro.nome}`}
                                variant="edit"
                                size="sm"
                              />
                              <ActionButton
                                onClick={() => handleDeleteCenter(centro.id, "faturamento", centro.nome)}
                                icon={Trash2}
                                label={`Excluir centro ${centro.nome}`}
                                variant="delete"
                                size="sm"
                              />
                            </div>
                          </td>
                        </tr>
                        {isExpanded && subcentros.map((subcentro) => {
                          const subVariacao = subcentro.realizado - subcentro.previsto
                          return (
                            <tr key={subcentro.id} className="border-b border-border hover:bg-muted/50 transition-colors bg-muted/30">
                              <td className="py-2 px-1"></td>
                              <td className="py-2 px-2 pl-6">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-muted-foreground shrink-0">↳</span>
                                  <span className="text-sm text-foreground truncate">{subcentro.nome}</span>
                                </div>
                              </td>
                              <td className="py-2 px-1">
                                <span className="text-[10px] text-muted-foreground bg-card px-1 py-0.5 rounded">{subcentro.sigla}</span>
                              </td>
                              <td className="py-2 px-1 text-xs text-foreground text-right tabular-nums whitespace-nowrap">{formatCurrency(subcentro.previsto)}</td>
                              <td className="py-2 px-1 text-xs font-medium text-foreground text-right tabular-nums whitespace-nowrap">{formatCurrency(subcentro.realizado)}</td>
                              <td className={`py-2 px-1 text-xs font-medium text-right tabular-nums whitespace-nowrap ${subVariacao >= 0 ? "text-emerald-600" : "text-amber-600"}`}>
                                {subVariacao >= 0 ? "+" : ""}{formatCurrency(subVariacao)}
                              </td>
                              <td className="py-2 px-1">
                                <div className="flex items-center justify-end">
                                  <ActionButton
                                    onClick={() => handleEditCenter(subcentro)}
                                    icon={Edit}
                                    label={`Editar subcentro ${subcentro.nome}`}
                                    variant="edit"
                                    size="sm"
                                  />
                                  <ActionButton
                                    onClick={() => handleDeleteCenter(subcentro.id, "faturamento", subcentro.nome)}
                                    icon={Trash2}
                                    label={`Excluir subcentro ${subcentro.nome}`}
                                    variant="delete"
                                    size="sm"
                                  />
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </Card>
        )}

        {/* Centros de Custo */}
        {loading ? (
          <TableSkeleton
            rows={3}
            title="Centros de Custo"
            icon={ArrowDownCircle}
            iconColor="text-red-600"
          />
        ) : (
        <Card className="p-4 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ArrowDownCircle className="h-4 w-4 text-red-600" />
              Centros de Custo
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedTipo("despesa")
                setShowNewCenterDrawer(true)
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Novo Centro
            </Button>
          </div>
          <div>
            {centrosCusto.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                {/* Ilustração contextual */}
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                  <ArrowDownCircle className="h-8 w-8 text-red-600/60" />
                </div>

                {/* Texto explicativo */}
                <h4 className="text-sm font-medium text-foreground mb-1">
                  Nenhum centro de custo cadastrado
                </h4>
                <p className="text-xs text-muted-foreground text-center max-w-[250px] mb-4">
                  Crie centros de custo para organizar e controlar suas despesas por categoria
                </p>

                {/* CTA primário */}
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedTipo("despesa")
                    setShowNewCenterDrawer(true)
                  }}
                  className="bg-red-500 hover:bg-red-500/90 text-white"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Criar primeiro centro de custo
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full min-w-[650px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="w-[72px]"></th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground uppercase">Centro</th>
                    <th className="text-left py-2 px-1 text-xs font-medium text-muted-foreground uppercase">Sigla</th>
                    <th className="text-right py-2 px-1 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">Previsto</th>
                    <th className="text-right py-2 px-1 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">Realizado</th>
                    <th className="text-right py-2 px-1 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">Variação</th>
                    <th className="w-[68px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {centrosCusto.filter(c => !c.parentId).map((centro) => {
                    const variacao = centro.realizado - centro.previsto
                    const subcentros = getSubcentros(centro.id, centrosCusto)
                    const hasSubcentros = subcentros.length > 0
                    const isExpanded = expandedCenters.has(centro.id)

                    return (
                      <Fragment key={centro.id}>
                        <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="py-2 px-1">
                            <div className="flex items-center">
                              {hasSubcentros ? (
                                <ActionButton
                                  onClick={() => toggleExpanded(centro.id)}
                                  icon={isExpanded ? ChevronDown : ChevronRight}
                                  label={isExpanded ? `Recolher subcentros de ${centro.nome}` : `Expandir ${subcentros.length} subcentro${subcentros.length > 1 ? 's' : ''} de ${centro.nome}`}
                                  size="sm"
                                />
                              ) : (
                                <div className="w-9"></div>
                              )}
                              <ActionButton
                                onClick={() => {
                                  setParentCenterForSub(centro)
                                  setShowNewSubcenterDrawer(true)
                                }}
                                icon={FolderPlus}
                                label={`Adicionar subcentro em ${centro.nome}`}
                                variant="success"
                                size="sm"
                              />
                            </div>
                          </td>
                          <td className="py-2 px-2">
                            <span className="text-sm text-foreground font-medium truncate">{centro.nome}</span>
                          </td>
                          <td className="py-2 px-1">
                            <span className="text-[10px] text-muted-foreground bg-muted px-1 py-0.5 rounded">{centro.sigla}</span>
                          </td>
                          <td className="py-2 px-1 text-xs text-foreground text-right tabular-nums whitespace-nowrap">{formatCurrency(centro.previsto)}</td>
                          <td className="py-2 px-1 text-xs font-medium text-foreground text-right tabular-nums whitespace-nowrap">{formatCurrency(centro.realizado)}</td>
                          <td className={`py-2 px-1 text-xs font-medium text-right tabular-nums whitespace-nowrap ${variacao <= 0 ? "text-emerald-600" : "text-red-600"}`}>
                            {variacao >= 0 ? "+" : ""}{formatCurrency(variacao)}
                          </td>
                          <td className="py-2 px-1">
                            <div className="flex items-center justify-end">
                              <ActionButton
                                onClick={() => handleEditCenter(centro)}
                                icon={Edit}
                                label={`Editar centro ${centro.nome}`}
                                variant="edit"
                                size="sm"
                              />
                              <ActionButton
                                onClick={() => handleDeleteCenter(centro.id, "despesa", centro.nome)}
                                icon={Trash2}
                                label={`Excluir centro ${centro.nome}`}
                                variant="delete"
                                size="sm"
                              />
                            </div>
                          </td>
                        </tr>
                        {isExpanded && subcentros.map((subcentro) => {
                          const subVariacao = subcentro.realizado - subcentro.previsto
                          return (
                            <tr key={subcentro.id} className="border-b border-border hover:bg-muted/50 transition-colors bg-muted/30">
                              <td className="py-2 px-1"></td>
                              <td className="py-2 px-2 pl-6">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-muted-foreground shrink-0">↳</span>
                                  <span className="text-sm text-foreground truncate">{subcentro.nome}</span>
                                </div>
                              </td>
                              <td className="py-2 px-1">
                                <span className="text-[10px] text-muted-foreground bg-card px-1 py-0.5 rounded">{subcentro.sigla}</span>
                              </td>
                              <td className="py-2 px-1 text-xs text-foreground text-right tabular-nums whitespace-nowrap">{formatCurrency(subcentro.previsto)}</td>
                              <td className="py-2 px-1 text-xs font-medium text-foreground text-right tabular-nums whitespace-nowrap">{formatCurrency(subcentro.realizado)}</td>
                              <td className={`py-2 px-1 text-xs font-medium text-right tabular-nums whitespace-nowrap ${subVariacao <= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                {subVariacao >= 0 ? "+" : ""}{formatCurrency(subVariacao)}
                              </td>
                              <td className="py-2 px-1">
                                <div className="flex items-center justify-end">
                                  <ActionButton
                                    onClick={() => handleEditCenter(subcentro)}
                                    icon={Edit}
                                    label={`Editar subcentro ${subcentro.nome}`}
                                    variant="edit"
                                    size="sm"
                                  />
                                  <ActionButton
                                    onClick={() => handleDeleteCenter(subcentro.id, "despesa", subcentro.nome)}
                                    icon={Trash2}
                                    label={`Excluir subcentro ${subcentro.nome}`}
                                    variant="delete"
                                    size="sm"
                                  />
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </Card>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={cancelDelete}
        title="Confirmar Exclusão"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-red-500/10 p-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground">
                Tem certeza que deseja excluir o centro <strong>{centerToDelete?.nome}</strong>?
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={cancelDelete}>
              Cancelar
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-500/90 text-white"
            >
              Excluir
            </Button>
          </div>
        </div>
      </Modal>

      {/* New Center Form Drawer */}
      <Drawer
        isOpen={showNewCenterDrawer}
        onClose={() => setShowNewCenterDrawer(false)}
        title="Novo Centro de Custo/Receita"
      >
        <CenterForm
          key={selectedTipo || "new"}
          onSave={handleSaveCenter}
          onCancel={() => setShowNewCenterDrawer(false)}
          defaultTipo={selectedTipo}
        />
      </Drawer>

      {/* New Subcenter Form Drawer */}
      <Drawer
        isOpen={showNewSubcenterDrawer}
        onClose={() => {
          setShowNewSubcenterDrawer(false)
          setParentCenterForSub(null)
        }}
        title={parentCenterForSub ? `Novo Subcentro de ${parentCenterForSub.nome}` : "Novo Subcentro"}
      >
        <SubcenterForm
          key={parentCenterForSub?.id || "new-sub"}
          parentCenter={parentCenterForSub}
          onSave={(subcenterData) => {
            // Reload data from API to ensure sync
            loadCentros()
            setShowNewSubcenterDrawer(false)
            setParentCenterForSub(null)
          }}
          onCancel={() => {
            setShowNewSubcenterDrawer(false)
            setParentCenterForSub(null)
          }}
        />
      </Drawer>

      {/* Edit Center Form Drawer */}
      <Drawer
        isOpen={showEditDrawer}
        onClose={() => {
          setShowEditDrawer(false)
          setCenterToEdit(null)
        }}
        title="Editar Centro"
      >
        <EditCenterForm
          key={centerToEdit?.id || "edit"}
          centro={centerToEdit}
          onSave={() => {
            loadCentros()
            setShowEditDrawer(false)
            setCenterToEdit(null)
          }}
          onCancel={() => {
            setShowEditDrawer(false)
            setCenterToEdit(null)
          }}
        />
      </Drawer>

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
                            ? (comparativoData.saidas.previsto > 0 ? (totalContasCentro / comparativoData.saidas.previsto) * 100 : 0)
                            : (comparativoData.entradas.previsto > 0 ? (totalContasCentro / comparativoData.entradas.previsto) * 100 : 0)
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

function CenterForm({ onSave, onCancel, defaultTipo = "" }) {
  const [nome, setNome] = useState("")
  const [sigla, setSigla] = useState("")
  const [tipo, setTipo] = useState(defaultTipo)
  const [loading, setLoading] = useState(false)

  // Sincronizar tipo quando defaultTipo mudar
  useEffect(() => {
    setTipo(defaultTipo)
  }, [defaultTipo])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/centros", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome,
          sigla,
          tipo,
        }),
      })

      if (response.ok) {
        const newCenter = await response.json()
        onSave(newCenter)
      } else {
        const error = await response.json()
        alert(error.error || "Erro ao salvar centro")
      }
    } catch (error) {
      console.error("Error creating centro:", error)
      alert("Erro ao salvar centro")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Indicador do tipo (quando defaultTipo é fornecido) */}
      {defaultTipo && (
        <div className="rounded-md bg-muted p-3 border border-border">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
            Tipo
          </p>
          <p className="text-sm font-semibold text-foreground">
            {defaultTipo === "despesa" ? "Centro de Custo (Despesa)" : "Centro de Receita (Faturamento)"}
          </p>
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Nome *</label>
        <Input
          placeholder="Ex: Marketing Digital"
          value={nome}
          onChange={e => setNome(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Sigla *</label>
        <Input
          placeholder="Ex: MKT"
          value={sigla}
          onChange={e => setSigla(e.target.value.toUpperCase())}
          required
          maxLength={10}
        />
      </div>

      {/* Seletor de tipo apenas quando não há defaultTipo */}
      {!defaultTipo && (
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Tipo *</label>
          <select
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            value={tipo}
            onChange={e => setTipo(e.target.value)}
            required
          >
            <option value="">Selecione o tipo</option>
            <option value="despesa">Despesa (Centro de Custo)</option>
            <option value="faturamento">Faturamento (Receita)</option>
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            {tipo === "despesa" && "Será cadastrado como Centro de Custo"}
            {tipo === "faturamento" && "Será cadastrado como Centro de Receita"}
          </p>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  )
}

function SubcenterForm({ parentCenter, onSave, onCancel }) {
  const [nome, setNome] = useState("")
  const [sigla, setSigla] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      const fullSigla = `${parentCenter?.sigla}.${sigla}`
      const response = await fetch("/api/centros", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome,
          sigla: fullSigla,
          tipo: parentCenter?.tipo,
          parentId: parentCenter?.id,
        }),
      })

      if (response.ok) {
        const newSubcenter = await response.json()
        onSave(newSubcenter)
      } else {
        const error = await response.json()
        alert(error.error || "Erro ao salvar subcentro")
      }
    } catch (error) {
      console.error("Error creating subcentro:", error)
      alert("Erro ao salvar subcentro")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Info do Centro Pai */}
      {parentCenter && (
        <div className="rounded-md bg-muted p-3 border border-border">
          <p className="text-xs font-medium uppercase tracking-wider text-foreground-muted mb-1">
            Centro Pai
          </p>
          <p className="text-sm font-semibold text-foreground">
            {parentCenter.sigla} - {parentCenter.nome}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Tipo: {parentCenter.tipo === "despesa" ? "Centro de Custo" : "Centro de Receita"}
          </p>
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Nome do Subcentro *</label>
        <Input
          placeholder="Ex: Campanha Meta Ads"
          value={nome}
          onChange={e => setNome(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Sigla *</label>
        <Input
          placeholder="Ex: META"
          value={sigla}
          onChange={e => setSigla(e.target.value.toUpperCase())}
          required
          maxLength={10}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Código completo: {parentCenter?.sigla}.{sigla || "___"}
        </p>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Salvando..." : "Salvar Subcentro"}
        </Button>
      </div>
    </form>
  )
}

function EditCenterForm({ centro, onSave, onCancel }) {
  const [nome, setNome] = useState(centro?.nome || "")
  const [sigla, setSigla] = useState(centro?.sigla || "")
  const [loading, setLoading] = useState(false)

  // Atualizar campos quando o centro mudar
  useEffect(() => {
    if (centro) {
      setNome(centro.nome || "")
      setSigla(centro.sigla || "")
    }
  }, [centro])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/centros", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: centro.id,
          nome,
          sigla,
        }),
      })

      if (response.ok) {
        onSave()
      } else {
        const error = await response.json()
        alert(error.error || "Erro ao atualizar centro")
      }
    } catch (error) {
      console.error("Error updating centro:", error)
      alert("Erro ao atualizar centro")
    } finally {
      setLoading(false)
    }
  }

  if (!centro) return null

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Indicador do tipo */}
      <div className="rounded-md bg-muted p-3 border border-border">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
          Tipo
        </p>
        <p className="text-sm font-semibold text-foreground">
          {centro.tipo === "despesa" ? "Centro de Custo (Despesa)" : "Centro de Receita (Faturamento)"}
        </p>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Nome *</label>
        <Input
          placeholder="Ex: Marketing Digital"
          value={nome}
          onChange={e => setNome(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Sigla *</label>
        <Input
          placeholder="Ex: MKT"
          value={sigla}
          onChange={e => setSigla(e.target.value.toUpperCase())}
          required
          maxLength={10}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </form>
  )
}
