"use client"

import { useState, useEffect, Fragment, useMemo, useRef, lazy, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/format"
import { Plus, Download, Search, ArrowUpCircle, ArrowDownCircle, X, Trash2, Edit, ChevronRight, ChevronDown, Layers, RefreshCw, Filter } from "lucide-react"
import { useContas } from "@/lib/hooks/use-cached-fetch"

// Lazy load modais para reduzir bundle inicial
const SimpleContaModal = lazy(() => import("./components/SimpleContaModal").then(m => ({ default: m.SimpleContaModal })))
const EditParcelamentoModal = lazy(() => import("./components/EditParcelamentoModal").then(m => ({ default: m.EditParcelamentoModal })))
const EditContaModal = lazy(() => import("./components/EditContaModal").then(m => ({ default: m.EditContaModal })))

// Virtualização: quantidade máxima de itens visíveis (carrega mais ao scroll)
const ITEMS_PER_PAGE = 50

export function ContasContent() {
  // Cache SWR - dados persistem entre navegações
  const { data: contas, isLoading: loading, refresh: loadContas } = useContas()

  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const searchTimeoutRef = useRef(null)

  // Virtualização: quantos itens mostrar
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE)
  const [showNewModal, setShowNewModal] = useState(false)
  const [showTipoSelector, setShowTipoSelector] = useState(false)
  const [tipoSelecionado, setTipoSelecionado] = useState(null)
  const [selectedConta, setSelectedConta] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [contaToEdit, setContaToEdit] = useState(null)
  const [showEditParceladaModal, setShowEditParceladaModal] = useState(false)
  const [contaParceladaToEdit, setContaParceladaToEdit] = useState(null)
  const [expandedContas, setExpandedContas] = useState({}) // {contaId: true/false}

  // Estados para filtros - com persistência no localStorage
  const [dataInicio, setDataInicioState] = useState("")
  const [dataFim, setDataFimState] = useState("")
  const [filtroTipo, setFiltroTipo] = useState("") // "", "pagar", "receber"
  const [filtroStatus, setFiltroStatus] = useState("") // "", "pendente", "vencida", "paga", "cancelada"
  const [filtroCentro, setFiltroCentro] = useState("")
  const [filtroAtivo, setFiltroAtivoState] = useState("todos") // todos, hoje, amanha, semana, personalizado

  // Carregar filtros do localStorage na inicialização
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDataInicio = localStorage.getItem('filtro_contas_dataInicio')
      const savedDataFim = localStorage.getItem('filtro_contas_dataFim')
      const savedFiltroAtivo = localStorage.getItem('filtro_contas_filtroAtivo')

      if (savedDataInicio) setDataInicioState(savedDataInicio)
      if (savedDataFim) setDataFimState(savedDataFim)
      if (savedFiltroAtivo) setFiltroAtivoState(savedFiltroAtivo)
    }
  }, [])

  // Funções wrapper para salvar no localStorage
  const setDataInicio = (value) => {
    setDataInicioState(value)
    if (typeof window !== 'undefined') {
      if (value) {
        localStorage.setItem('filtro_contas_dataInicio', value)
      } else {
        localStorage.removeItem('filtro_contas_dataInicio')
      }
    }
  }

  const setDataFim = (value) => {
    setDataFimState(value)
    if (typeof window !== 'undefined') {
      if (value) {
        localStorage.setItem('filtro_contas_dataFim', value)
      } else {
        localStorage.removeItem('filtro_contas_dataFim')
      }
    }
  }

  const setFiltroAtivo = (value) => {
    setFiltroAtivoState(value)
    if (typeof window !== 'undefined') {
      localStorage.setItem('filtro_contas_filtroAtivo', value)
    }
  }

  // Filtros avançados por coluna
  const [filtroCodigoTipo, setFiltroCodigoTipo] = useState("")
  const [filtroFornecedor, setFiltroFornecedor] = useState("")
  const [filtroDescricao, setFiltroDescricao] = useState("")
  const [filtroNfParcela, setFiltroNfParcela] = useState("")
  const [filtroValor, setFiltroValor] = useState("") // Valor único selecionado
  const [showFiltrosAvancados, setShowFiltrosAvancados] = useState(false)

  // Estados para opções de filtros automáticos
  const [centrosFiltro, setCentrosFiltro] = useState([])
  const [fornecedoresFiltro, setFornecedoresFiltro] = useState([])
  const [valoresUnicos, setValoresUnicos] = useState([])

  // loadContas agora vem do hook useContas (SWR com cache)

  // Debounce para o termo de busca (300ms)
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm])

  // Carregar centros de custo e fornecedores para os filtros
  useEffect(() => {
    async function fetchDadosFiltros() {
      try {
        const [centrosResD, centrosResR, fornecedoresRes] = await Promise.all([
          fetch('/api/centros?tipo=despesa&hierarquico=true'),
          fetch('/api/centros?tipo=receita&hierarquico=true'),
          fetch('/api/fornecedores?status=ativo')
        ])

        const centrosDespesa = await centrosResD.json()
        const centrosReceita = await centrosResR.json()
        const fornecedoresData = await fornecedoresRes.json()

        // Combinar centros únicos por sigla
        const todosCentros = [...(Array.isArray(centrosDespesa) ? centrosDespesa : []), ...(Array.isArray(centrosReceita) ? centrosReceita : [])]
        const centrosUnicosBySigla = todosCentros.reduce((acc, centro) => {
          if (!acc[centro.sigla]) {
            acc[centro.sigla] = centro
          }
          return acc
        }, {})

        setCentrosFiltro(Object.values(centrosUnicosBySigla))
        setFornecedoresFiltro(Array.isArray(fornecedoresData) ? fornecedoresData : [])
      } catch (error) {
        console.error('Erro ao buscar dados para filtros:', error)
      }
    }
    fetchDadosFiltros()
  }, [])

  // Extrair valores únicos das contas para o filtro de valor
  useEffect(() => {
    if (contas && contas.length > 0) {
      const valores = [...new Set(contas.map(conta => Math.abs(conta.valor)))]
        .sort((a, b) => a - b)
      setValoresUnicos(valores)
    }
  }, [contas])

  const handleNovaContaSuccess = () => {
    loadContas()
    setShowNewModal(false)
    setShowTipoSelector(false)
    setTipoSelecionado(null)
  }

  const handleOpenModal = (tipo) => {
    setTipoSelecionado(tipo)
    setShowTipoSelector(false)
    setShowNewModal(true)
  }

  // Helper para normalizar data (sempre usa data local, não UTC)
  const normalizarData = (dateStr) => {
    // Sempre converte para Date e extrai componentes LOCAIS
    // Isso evita problemas de timezone onde "2026-01-29T21:00:00Z" vira "2026-01-30" no Brasil
    const d = new Date(dateStr)
    const ano = d.getFullYear()
    const mes = String(d.getMonth() + 1).padStart(2, '0')
    const dia = String(d.getDate()).padStart(2, '0')
    return `${ano}-${mes}-${dia}`
  }

  // Retorna o status da conta (paga, vencida, pendente, cancelada)
  const getContaStatus = (conta) => {
    const hoje = new Date()
    const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`
    const vencimentoStr = normalizarData(conta.vencimento)
    const vencido = vencimentoStr < hojeStr

    if (conta.status === "cancelado") return "cancelada"
    if (conta.pago) return "paga"
    if (vencido) return "vencida"
    return "pendente"
  }

  // Funções de filtro rápido
  function getDataFormatada(date) {
    const ano = date.getFullYear()
    const mes = String(date.getMonth() + 1).padStart(2, '0')
    const dia = String(date.getDate()).padStart(2, '0')
    return `${ano}-${mes}-${dia}`
  }

  function filtrarHoje() {
    const hoje = getDataFormatada(new Date())
    setDataInicio(hoje)
    setDataFim(hoje)
    setFiltroAtivo("hoje")
  }

  function filtrarAmanha() {
    const amanha = new Date()
    amanha.setDate(amanha.getDate() + 1)
    const dataAmanha = getDataFormatada(amanha)
    setDataInicio(dataAmanha)
    setDataFim(dataAmanha)
    setFiltroAtivo("amanha")
  }

  function filtrarSemana() {
    const hoje = new Date()
    const fimSemana = new Date()
    fimSemana.setDate(hoje.getDate() + 7)
    setDataInicio(getDataFormatada(hoje))
    setDataFim(getDataFormatada(fimSemana))
    setFiltroAtivo("semana")
  }

  // Ao mudar manualmente as datas, marca como personalizado
  function handleDataInicioChange(value) {
    setDataInicio(value)
    setFiltroAtivo("personalizado")
  }

  function handleDataFimChange(value) {
    setDataFim(value)
    setFiltroAtivo("personalizado")
  }

  // Helper para verificar se é conta parcelada (conta macro ou tem parcelas/grupoParcelamentoId)
  const isContaParcelada = (conta) => conta.isContaMacro || (conta.parcelas && conta.parcelas.length > 0) || conta.grupoParcelamentoId

  // Helper para calcular status de conta parcelada
  const getParcelasStatus = (conta) => {
    if (!conta.parcelas || conta.parcelas.length === 0) return null
    const pagas = conta.parcelas.filter(p => p.pago).length
    const total = conta.parcelas.length
    return { pagas, total, todasPagas: pagas === total }
  }

  // Helper para verificar se é conta recorrente (template)
  const isContaRecorrente = (conta) => conta.isRecorrente && !conta.recorrenciaParentId

  // Helper para calcular status de conta recorrente
  const getRecorrenciaStatus = (conta) => {
    if (!conta.recorrencias || conta.recorrencias.length === 0) return null
    const pagas = conta.recorrencias.filter(r => r.pago).length
    const total = conta.recorrencias.length
    return { pagas, total, todasPagas: pagas === total }
  }

  // Helper para obter label da frequência
  const getFrequenciaLabel = (frequencia) => {
    const labels = {
      semanal: "Semanal",
      quinzenal: "Quinzenal",
      mensal: "Mensal",
      anual: "Anual"
    }
    return labels[frequencia] || frequencia
  }

  // Toggle expansão de conta parcelada
  const toggleExpand = (contaId) => {
    setExpandedContas(prev => ({
      ...prev,
      [contaId]: !prev[contaId]
    }))
  }

  // Filtrar contas por texto e período (memoizado para performance)
  const filteredContas = useMemo(() => contas.filter(conta => {
    // Filtro de texto - considera também as parcelas (usa debouncedSearchTerm)
    const searchLower = debouncedSearchTerm.toLowerCase()
    const matchTexto =
      conta.descricao?.toLowerCase().includes(searchLower) ||
      conta.pessoa?.nome?.toLowerCase().includes(searchLower) ||
      conta.beneficiario?.toLowerCase().includes(searchLower)

    if (!matchTexto) return false

    // Para contas parceladas, verificar se alguma parcela está no período
    if (isContaParcelada(conta)) {
      if ((dataInicio || dataFim) && conta.parcelas && conta.parcelas.length > 0) {
        // Verificar se alguma parcela está no período
        const algumaParcelaNoPeriodo = conta.parcelas.some(parcela => {
          const dataVencimentoStr = normalizarData(parcela.vencimento)
          const dataPagamentoStr = parcela.dataPagamento ? normalizarData(parcela.dataPagamento) : null

          const vencimentoNoPeriodo =
            (!dataInicio || dataVencimentoStr >= dataInicio) &&
            (!dataFim || dataVencimentoStr <= dataFim)

          const pagamentoNoPeriodo = dataPagamentoStr &&
            (!dataInicio || dataPagamentoStr >= dataInicio) &&
            (!dataFim || dataPagamentoStr <= dataFim)

          return vencimentoNoPeriodo || pagamentoNoPeriodo
        })

        if (!algumaParcelaNoPeriodo) return false
      }

      // Filtro por status para contas parceladas
      if (filtroStatus) {
        const parcelasStatus = getParcelasStatus(conta)

        // Se filtrar por "paga", mostrar apenas parcelamentos quitados
        if (filtroStatus === "paga" && !parcelasStatus?.todasPagas) return false

        // Se filtrar por "pendente", "vencida" ou "cancelada", verificar se alguma parcela corresponde
        if (filtroStatus !== "paga") {
          const temParcelaComStatus = conta.parcelas.some(parcela => {
            const statusParcela = getContaStatus(parcela)
            return statusParcela === filtroStatus
          })

          if (!temParcelaComStatus) return false
        }
      }
    } else {
      // Conta simples - filtro de período normal
      if (dataInicio || dataFim) {
        const dataVencimentoStr = normalizarData(conta.vencimento)
        const dataPagamentoStr = conta.dataPagamento ? normalizarData(conta.dataPagamento) : null

        const vencimentoNoPeriodo =
          (!dataInicio || dataVencimentoStr >= dataInicio) &&
          (!dataFim || dataVencimentoStr <= dataFim)

        const pagamentoNoPeriodo = dataPagamentoStr &&
          (!dataInicio || dataPagamentoStr >= dataInicio) &&
          (!dataFim || dataPagamentoStr <= dataFim)

        if (!vencimentoNoPeriodo && !pagamentoNoPeriodo) return false
      }

      // Filtro por status para contas simples
      if (filtroStatus) {
        const status = getContaStatus(conta)
        if (status !== filtroStatus) return false
      }
    }

    // Filtro por tipo (pagar/receber)
    if (filtroTipo && conta.tipo !== filtroTipo) return false

    // Filtro por centro de custo
    if (filtroCentro && conta.codigoTipo !== filtroCentro) return false

    // Filtros por coluna (inline)
    // Filtro por Código Tipo (comparação exata)
    if (filtroCodigoTipo) {
      if (!conta.codigoTipo || conta.codigoTipo !== filtroCodigoTipo) return false
    }

    // Filtro por Fornecedor/Cliente (comparação exata)
    if (filtroFornecedor) {
      const fornecedor = conta.beneficiario || conta.pessoa?.nome || ""
      if (fornecedor !== filtroFornecedor) return false
    }

    // Filtro por Descrição
    if (filtroDescricao) {
      const descricao = conta.descricao?.toLowerCase() || ""
      if (!descricao.includes(filtroDescricao.toLowerCase())) return false
    }

    // Filtro por NF/Parcela
    if (filtroNfParcela) {
      const nfParcela = (conta.numeroDocumento || conta.numeroParcela?.toString() || "").toLowerCase()
      if (!nfParcela.includes(filtroNfParcela.toLowerCase())) return false
    }

    // Filtro por Valor (valor exato)
    if (filtroValor) {
      const valorFiltro = parseFloat(filtroValor)
      if (!isNaN(valorFiltro) && Math.abs(conta.valor) !== valorFiltro) return false
    }

    return true
  }), [contas, debouncedSearchTerm, dataInicio, dataFim, filtroTipo, filtroStatus, filtroCentro, filtroCodigoTipo, filtroFornecedor, filtroDescricao, filtroNfParcela, filtroValor])

  // Reset virtualização quando filtros mudam
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE)
  }, [debouncedSearchTerm, dataInicio, dataFim, filtroTipo, filtroStatus])

  // Limpar filtros
  function limparFiltros() {
    setDataInicio("")
    setDataFim("")
    setFiltroTipo("")
    setFiltroStatus("")
    setFiltroCentro("")
    setFiltroAtivo("todos")
    // Limpar filtros de coluna
    setFiltroCodigoTipo("")
    setFiltroFornecedor("")
    setFiltroDescricao("")
    setFiltroNfParcela("")
    setFiltroValor("")
    setVisibleCount(ITEMS_PER_PAGE)
  }

  const temFiltro = dataInicio || dataFim || filtroTipo || filtroStatus || filtroCentro ||
    filtroCodigoTipo || filtroFornecedor || filtroDescricao || filtroNfParcela || filtroValor

  const getStatusBadge = (conta) => {
    // Para contas parceladas
    if (isContaParcelada(conta)) {
      const parcelasStatus = getParcelasStatus(conta)
      if (parcelasStatus) {
        if (parcelasStatus.todasPagas) {
          return <Badge variant="success" className="bg-blue-100 text-blue-700">Quitada</Badge>
        }
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
            {parcelasStatus.pagas}/{parcelasStatus.total} pagas
          </Badge>
        )
      }
      // Conta macro sem parcelas carregadas
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
          {conta.totalParcelas || 0} parcelas
        </Badge>
      )
    }

    // Para contas recorrentes (template)
    if (isContaRecorrente(conta)) {
      const status = getRecorrenciaStatus(conta)
      if (status) {
        if (status.todasPagas) {
          return <Badge variant="success" className="bg-blue-100 text-blue-700">Quitada</Badge>
        }
        return (
          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
            {status.pagas}/{status.total} pagas
          </Badge>
        )
      }
    }

    // Para contas simples
    const status = getContaStatus(conta)

    if (status === "cancelada") {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-700">Cancelada</Badge>
    } else if (status === "paga") {
      return <Badge variant="success" className="bg-blue-100 text-blue-700">Paga</Badge>
    } else if (status === "vencida") {
      return <Badge variant="destructive" className="bg-red-100 text-red-700">Vencida</Badge>
    } else {
      return <Badge variant="warning" className="bg-yellow-100 text-yellow-700">Pendente</Badge>
    }
  }

  // Retorna a classe de cor de fundo da linha baseado no status
  const getRowClassName = (conta) => {
    // Para contas parceladas
    if (isContaParcelada(conta)) {
      const parcelasStatus = getParcelasStatus(conta)
      if (parcelasStatus?.todasPagas) {
        return "bg-blue-50 hover:bg-blue-100/80"
      }
      // Verificar se alguma parcela está vencida
      if (conta.parcelas && conta.parcelas.length > 0) {
        const hoje = new Date()
        const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`
        const temVencida = conta.parcelas.some(p => {
          if (p.pago) return false
          const vencimentoStr = normalizarData(p.vencimento)
          return vencimentoStr < hojeStr
        })
        if (temVencida) {
          return "bg-red-50 hover:bg-red-100/80"
        }
      }
      return "bg-yellow-50 hover:bg-yellow-100/80"
    }

    // Para contas recorrentes (template)
    if (isContaRecorrente(conta)) {
      const status = getRecorrenciaStatus(conta)
      if (status?.todasPagas) {
        return "bg-blue-50 hover:bg-blue-100/80"
      }
      return "bg-green-50 hover:bg-green-100/80"
    }

    // Para contas simples
    const status = getContaStatus(conta)

    if (status === "cancelada") {
      return "bg-gray-50 hover:bg-gray-100/80"
    } else if (status === "paga") {
      return "bg-blue-50 hover:bg-blue-100/80"
    } else if (status === "vencida") {
      return "bg-red-50 hover:bg-red-100/80"
    } else {
      return "bg-yellow-50 hover:bg-yellow-100/80"
    }
  }

  async function deletarConta(id, conta = null) {
    // Verificar se é parcelamento para mensagem adequada
    const isParcelamento = conta && (conta.isContaMacro || (conta.parcelas && conta.parcelas.length > 0) || conta.grupoParcelamentoId)
    const totalParcelas = conta?.parcelas?.length || conta?.totalParcelas || 0

    const mensagem = isParcelamento
      ? `Tem certeza que deseja excluir este parcelamento?\n\nIsso irá excluir a conta principal e todas as ${totalParcelas} parcelas.`
      : 'Tem certeza que deseja excluir esta conta?'

    if (!confirm(mensagem)) {
      return
    }

    try {
      const response = await fetch(`/api/contas/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir')
      }

      // Mostrar resultado
      if (data.parcelasExcluidas > 0) {
        console.log(`✅ ${data.message}`)
      }

      setShowDetail(false)
      loadContas()
    } catch (error) {
      console.error('Erro ao deletar conta:', error)
      alert(error.message || 'Erro ao excluir conta')
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contas</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie suas contas a pagar e a receber</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button size="sm" onClick={() => setShowTipoSelector(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Conta
          </Button>
        </div>
      </div>

      {/* Barra de Filtros Principal */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Busca */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar contas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtros Rápidos de Período */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            <Button
              variant={filtroAtivo === "todos" ? "default" : "ghost"}
              size="sm"
              onClick={limparFiltros}
              className="h-7 text-xs px-3"
            >
              Todos
            </Button>
            <Button
              variant={filtroAtivo === "hoje" ? "default" : "ghost"}
              size="sm"
              onClick={filtrarHoje}
              className="h-7 text-xs px-3"
            >
              Hoje
            </Button>
            <Button
              variant={filtroAtivo === "amanha" ? "default" : "ghost"}
              size="sm"
              onClick={filtrarAmanha}
              className="h-7 text-xs px-3"
            >
              Amanhã
            </Button>
            <Button
              variant={filtroAtivo === "semana" ? "default" : "ghost"}
              size="sm"
              onClick={filtrarSemana}
              className="h-7 text-xs px-3"
            >
              7 dias
            </Button>
          </div>

          {/* Botão Filtros Avançados */}
          <Button
            variant={showFiltrosAvancados ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFiltrosAvancados(!showFiltrosAvancados)}
            className="h-9"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            {(filtroTipo || filtroStatus || filtroCodigoTipo || filtroFornecedor || filtroDescricao || filtroNfParcela || filtroValor || dataInicio || dataFim) && (
              <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {[filtroTipo, filtroStatus, filtroCodigoTipo, filtroFornecedor, filtroDescricao, filtroNfParcela, filtroValor, dataInicio, dataFim].filter(Boolean).length}
              </Badge>
            )}
          </Button>

          {temFiltro && (
            <Button variant="ghost" size="sm" onClick={limparFiltros} className="h-9 text-destructive hover:text-destructive">
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        {/* Filtros Avançados (Expansível) */}
        {showFiltrosAvancados && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {/* Tipo */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="w-full h-8 px-2 rounded-md border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Todos</option>
                  <option value="pagar">A Pagar</option>
                  <option value="receber">A Receber</option>
                </select>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="w-full h-8 px-2 rounded-md border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Todos</option>
                  <option value="pendente">Pendente</option>
                  <option value="vencida">Vencida</option>
                  <option value="paga">Paga</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>

              {/* Período */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Vencimento De</label>
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => handleDataInicioChange(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Vencimento Até</label>
                <Input
                  type="date"
                  value={dataFim}
                  onChange={(e) => handleDataFimChange(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>

              {/* Código Tipo (Centro de Custo) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Cód Tipo</label>
                <select
                  value={filtroCodigoTipo}
                  onChange={(e) => setFiltroCodigoTipo(e.target.value)}
                  className="w-full h-8 px-2 rounded-md border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Todos</option>
                  {centrosFiltro.map((centro) => (
                    <option key={centro.id} value={centro.sigla}>
                      {centro.sigla} - {centro.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fornecedor/Cliente */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Fornecedor/Cliente</label>
                <select
                  value={filtroFornecedor}
                  onChange={(e) => setFiltroFornecedor(e.target.value)}
                  className="w-full h-8 px-2 rounded-md border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Todos</option>
                  {fornecedoresFiltro.map((pessoa) => (
                    <option key={pessoa.id} value={pessoa.nome}>
                      {pessoa.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Descrição */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Descrição</label>
                <Input
                  placeholder="Buscar..."
                  value={filtroDescricao}
                  onChange={(e) => setFiltroDescricao(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>

              {/* Valor */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Valor</label>
                <select
                  value={filtroValor}
                  onChange={(e) => setFiltroValor(e.target.value)}
                  className="w-full h-8 px-2 rounded-md border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Todos</option>
                  {valoresUnicos.map((valor) => (
                    <option key={valor} value={valor}>
                      {formatCurrency(valor)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Tabela de Contas */}
      <Card>
        <div>
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase w-[120px]">Tipo</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase w-[100px]">Cód Tipo</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase w-[15%]">Fornecedor/Cliente</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Descrição</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase w-[80px]">NF/Parcela</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase w-[100px]">Valor</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase w-[100px]">Vencimento</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase w-[80px]">Status</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground uppercase w-[80px]">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                    Carregando...
                  </td>
                </tr>
              ) : filteredContas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                    {temFiltro || searchTerm ? "Nenhuma conta encontrada no periodo/busca selecionado" : "Nenhuma conta cadastrada"}
                  </td>
                </tr>
              ) : (
                filteredContas.slice(0, visibleCount).map((conta) => (
                  <Fragment key={conta.id}>
                    {/* Linha principal da conta */}
                    <tr
                      className={`border-b border-border cursor-pointer ${getRowClassName(conta)}`}
                      onClick={() => {
                        if (isContaParcelada(conta) || isContaRecorrente(conta)) {
                          toggleExpand(conta.id)
                        } else {
                          setSelectedConta(conta)
                          setShowDetail(true)
                        }
                      }}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {(isContaParcelada(conta) || isContaRecorrente(conta)) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleExpand(conta.id)
                              }}
                              className="p-0.5 hover:bg-muted rounded"
                            >
                              {expandedContas[conta.id] ? (
                                <ChevronDown className={`h-4 w-4 ${isContaRecorrente(conta) ? 'text-green-600' : 'text-muted-foreground'}`} />
                              ) : (
                                <ChevronRight className={`h-4 w-4 ${isContaRecorrente(conta) ? 'text-green-600' : 'text-muted-foreground'}`} />
                              )}
                            </button>
                          )}
                          {conta.tipo === "pagar" ? (
                            <>
                              <ArrowDownCircle className="h-4 w-4 text-red-600" />
                              <span className="text-sm text-foreground">A Pagar</span>
                            </>
                          ) : (
                            <>
                              <ArrowUpCircle className="h-4 w-4 text-blue-600" />
                              <span className="text-sm text-foreground">A Receber</span>
                            </>
                          )}
                          {isContaParcelada(conta) && (
                            <Layers className="h-3.5 w-3.5 text-muted-foreground" title="Conta parcelada" />
                          )}
                          {isContaRecorrente(conta) && (
                            <RefreshCw className="h-3.5 w-3.5 text-green-500" title={`Conta recorrente (${getFrequenciaLabel(conta.frequencia)})`} />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">{conta.codigoTipo || "-"}</td>
                      <td className="py-3 px-4 text-sm text-foreground break-words">{conta.beneficiario || conta.pessoa?.nome || "-"}</td>
                      <td className="py-3 px-4 text-sm text-foreground break-words">
                        {conta.descricao || "-"}
                        {isContaParcelada(conta) && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({conta.totalParcelas || conta.parcelas?.length}x)
                          </span>
                        )}
                        {isContaRecorrente(conta) && (
                          <Badge variant="outline" className="ml-2 text-xs bg-green-100 text-green-700 border-green-300">
                            {getFrequenciaLabel(conta.frequencia)}
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">
                        {conta.numeroDocumento || "-"}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-foreground text-right">
                        <div className="flex flex-col items-end">
                          <span>{formatCurrency(conta.valorTotal || conta.valor)}</span>
                          {!conta.isContaMacro && conta.pago && conta.valorPago != null && conta.valorPago !== conta.valor && (
                            <span className="text-xs text-amber-600">
                              (pago: {formatCurrency(conta.valorPago)})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">
                        {isContaParcelada(conta) ? (
                          <span className="text-xs text-muted-foreground">Ver parcelas</span>
                        ) : (
                          formatDate(conta.vencimento)
                        )}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(conta)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          {isContaParcelada(conta) ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setContaParceladaToEdit(conta)
                                setShowEditParceladaModal(true)
                              }}
                              className="rounded p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                              title="Editar lançamento parcelado"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          ) : !isContaRecorrente(conta) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setContaToEdit(conta)
                                setShowEditModal(true)
                              }}
                              className="rounded p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deletarConta(conta.id, conta)
                            }}
                            className="rounded p-1.5 text-muted-foreground hover:bg-red-100 hover:text-red-600 transition-colors"
                            title={isContaParcelada(conta) ? "Excluir parcelamento" : "Excluir"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* Linhas das parcelas (quando expandido) */}
                    {isContaParcelada(conta) && expandedContas[conta.id] && conta.parcelas.map((parcela) => (
                      <tr
                        key={`parcela-${parcela.id}`}
                        className={`border-b border-border transition-colors cursor-pointer ${getRowClassName(parcela)} bg-opacity-50`}
                        onClick={() => {
                          setSelectedConta(parcela)
                          setShowDetail(true)
                        }}
                      >
                        <td className="py-2 px-4 pl-12">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="text-xs">└</span>
                            {parcela.tipo === "pagar" ? (
                              <ArrowDownCircle className="h-3.5 w-3.5 text-red-400" />
                            ) : (
                              <ArrowUpCircle className="h-3.5 w-3.5 text-blue-400" />
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-4 text-xs text-muted-foreground">{parcela.codigoTipo || "-"}</td>
                        <td className="py-2 px-4 text-xs text-muted-foreground break-words">{parcela.beneficiario || "-"}</td>
                        <td className="py-2 px-4 text-xs text-muted-foreground">
                          Parcela {parcela.numeroParcela}
                        </td>
                        <td className="py-2 px-4 text-xs text-muted-foreground">
                          {parcela.numeroParcela}
                        </td>
                        <td className="py-2 px-4 text-xs font-medium text-foreground text-right">
                          <div className="flex flex-col items-end">
                            <span>{formatCurrency(parcela.valor)}</span>
                            {parcela.pago && parcela.valorPago != null && parcela.valorPago !== parcela.valor && (
                              <span className="text-amber-600" title={`Pago: ${formatCurrency(parcela.valorPago)}`}>
                                (pago: {formatCurrency(parcela.valorPago)})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-4 text-xs text-foreground">
                          {formatDate(parcela.vencimento)}
                        </td>
                        <td className="py-2 px-4">
                          {parcela.pago ? (
                            <Badge variant="success" className="bg-blue-100 text-blue-700 text-xs">Paga</Badge>
                          ) : getContaStatus(parcela) === "vencida" ? (
                            <Badge variant="destructive" className="bg-red-100 text-red-700 text-xs">Vencida</Badge>
                          ) : (
                            <Badge variant="warning" className="bg-yellow-100 text-yellow-700 text-xs">Pendente</Badge>
                          )}
                        </td>
                        <td className="py-2 px-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                // Passa o pai (conta) que tem todas as parcelas
                                setContaParceladaToEdit(conta)
                                setShowEditParceladaModal(true)
                              }}
                              className="rounded p-1 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                              title="Editar parcelamento"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {/* Linhas das recorrências (quando expandido) */}
                    {isContaRecorrente(conta) && expandedContas[conta.id] && conta.recorrencias?.map((recorrencia) => (
                      <tr
                        key={`recorrencia-${recorrencia.id}`}
                        className={`border-b border-border transition-colors cursor-pointer ${getRowClassName(recorrencia)} bg-opacity-50`}
                        onClick={() => {
                          setSelectedConta(recorrencia)
                          setShowDetail(true)
                        }}
                      >
                        <td className="py-2 px-4 pl-12">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="text-xs">└</span>
                            <RefreshCw className="h-3.5 w-3.5 text-green-400" />
                          </div>
                        </td>
                        <td className="py-2 px-4 text-xs text-muted-foreground">{recorrencia.codigoTipo || "-"}</td>
                        <td className="py-2 px-4 text-xs text-muted-foreground break-words">{recorrencia.beneficiario || "-"}</td>
                        <td className="py-2 px-4 text-xs text-muted-foreground break-words">
                          {recorrencia.descricao}
                        </td>
                        <td className="py-2 px-4 text-xs text-muted-foreground">
                          -
                        </td>
                        <td className="py-2 px-4 text-xs font-medium text-foreground text-right">
                          {formatCurrency(recorrencia.valor)}
                        </td>
                        <td className="py-2 px-4 text-xs text-foreground">
                          {formatDate(recorrencia.vencimento)}
                        </td>
                        <td className="py-2 px-4">
                          {recorrencia.pago ? (
                            <Badge variant="success" className="bg-blue-100 text-blue-700 text-xs">Paga</Badge>
                          ) : getContaStatus(recorrencia) === "vencida" ? (
                            <Badge variant="destructive" className="bg-red-100 text-red-700 text-xs">Vencida</Badge>
                          ) : (
                            <Badge variant="warning" className="bg-yellow-100 text-yellow-700 text-xs">Pendente</Badge>
                          )}
                        </td>
                        <td className="py-2 px-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setContaToEdit(recorrencia)
                                setShowEditModal(true)
                              }}
                              className="rounded p-1 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                              title="Editar recorrência"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Botão Carregar Mais - Virtualização */}
        {filteredContas.length > visibleCount && (
          <div className="p-4 border-t border-border text-center">
            <Button
              variant="outline"
              onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
              className="w-full"
            >
              Carregar mais ({filteredContas.length - visibleCount} restantes)
            </Button>
          </div>
        )}
      </Card>

      {/* Modal Seletor de Tipo */}
      {showTipoSelector && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Selecione o Tipo de Conta</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowTipoSelector(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">Escolha se deseja criar uma conta a pagar ou a receber</p>
            <div className="grid gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex-col items-start hover:border-red-500 hover:bg-red-50"
                onClick={() => handleOpenModal("pagar")}
              >
                <div className="flex items-center gap-2 mb-1">
                  <ArrowDownCircle className="h-5 w-5 text-red-600" />
                  <span className="font-semibold">Conta a Pagar</span>
                </div>
                <p className="text-xs text-muted-foreground">Despesas, fornecedores, contas a pagar</p>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col items-start hover:border-blue-500 hover:bg-blue-50"
                onClick={() => handleOpenModal("receber")}
              >
                <div className="flex items-center gap-2 mb-1">
                  <ArrowUpCircle className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold">Conta a Receber</span>
                </div>
                <p className="text-xs text-muted-foreground">Receitas, clientes, contas a receber</p>
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Nova Conta - Lazy loaded */}
      {showNewModal && tipoSelecionado && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"><div className="bg-white p-4 rounded-lg">Carregando...</div></div>}>
          <SimpleContaModal
            tipo={tipoSelecionado}
            onClose={() => {
              setShowNewModal(false)
              setTipoSelecionado(null)
            }}
            onSuccess={handleNovaContaSuccess}
          />
        </Suspense>
      )}

      {/* Modal de Detalhes */}
      {showDetail && selectedConta && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-border p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Detalhes da Conta</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowDetail(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status e Valor */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {selectedConta.tipo === "pagar" ? (
                      <ArrowDownCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <ArrowUpCircle className="h-5 w-5 text-blue-600" />
                    )}
                    <h3 className="text-xl font-bold text-foreground">
                      {selectedConta.descricao || "Sem descrição"}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedConta.pessoa?.nome || "-"}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(selectedConta.valor)}</p>
                  {selectedConta.pago && selectedConta.valorPago != null && selectedConta.valorPago !== selectedConta.valor && (
                    <p className="text-sm text-amber-600">
                      Pago: {formatCurrency(selectedConta.valorPago)} ({selectedConta.valorPago > selectedConta.valor ? '+' : ''}{((selectedConta.valorPago - selectedConta.valor) / selectedConta.valor * 100).toFixed(1)}%)
                    </p>
                  )}
                  {getStatusBadge(selectedConta)}
                </div>
              </div>

              {/* Informações Principais */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Código Tipo</p>
                  <p className="text-sm font-medium text-foreground">{selectedConta.codigoTipo || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Data de Vencimento</p>
                  <p className="text-sm font-medium text-foreground">{formatDate(new Date(selectedConta.vencimento))}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Número Documento</p>
                  <p className="text-sm font-medium text-foreground">{selectedConta.numeroDocumento || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Número Parcela</p>
                  <p className="text-sm font-medium text-foreground">{selectedConta.numeroParcela || "-"}</p>
                </div>
              </div>

              {selectedConta.observacoes && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Observações</p>
                  <p className="text-sm text-foreground">{selectedConta.observacoes}</p>
                </div>
              )}

              {selectedConta.dataPagamento && (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Data do Pagamento</p>
                  <p className="text-sm font-medium text-emerald-600">{formatDate(new Date(selectedConta.dataPagamento))}</p>
                </div>
              )}

              {/* Acoes */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground flex-1">
                  Para marcar como {selectedConta.tipo === "pagar" ? "pago" : "recebido"}, acesse o Fluxo de Caixa
                </p>
                <Button variant="outline" onClick={() => {
                  setShowDetail(false)
                  // Se a conta é parcelada ou tem grupoParcelamentoId, abrir modal de parcelamento
                  if (isContaParcelada(selectedConta)) {
                    // Se clicou numa parcela individual (tem grupoParcelamentoId mas não tem array de parcelas com itens)
                    const temParcelasCarregadas = selectedConta.parcelas && selectedConta.parcelas.length > 0
                    if (selectedConta.grupoParcelamentoId && !temParcelasCarregadas) {
                      // Encontrar o grupo na lista de contas
                      const grupoParcelado = contas.find(c =>
                        c.grupoParcelamentoId === selectedConta.grupoParcelamentoId &&
                        c.parcelas &&
                        c.parcelas.length > 0
                      )
                      if (grupoParcelado) {
                        setContaParceladaToEdit(grupoParcelado)
                      } else {
                        // Se não encontrou o grupo, usar a parcela individual mesmo
                        // O modal vai mostrar mensagem apropriada
                        setContaParceladaToEdit(selectedConta)
                      }
                    } else {
                      setContaParceladaToEdit(selectedConta)
                    }
                    setShowEditParceladaModal(true)
                  } else {
                    setContaToEdit(selectedConta)
                    setShowEditModal(true)
                  }
                }}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => deletarConta(selectedConta.id)}>
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Edição - Lazy loaded */}
      {showEditModal && contaToEdit && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"><div className="bg-white p-4 rounded-lg">Carregando...</div></div>}>
          <EditContaModal
            conta={contaToEdit}
            onClose={() => {
              setShowEditModal(false)
              setContaToEdit(null)
            }}
            onSuccess={() => {
              loadContas()
              setShowEditModal(false)
              setContaToEdit(null)
            }}
          />
        </Suspense>
      )}

      {/* Modal de Edição de Parcelamento - Lazy loaded */}
      {showEditParceladaModal && contaParceladaToEdit && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"><div className="bg-white p-4 rounded-lg">Carregando...</div></div>}>
          <EditParcelamentoModal
            conta={contaParceladaToEdit}
            onClose={() => {
              setShowEditParceladaModal(false)
              setContaParceladaToEdit(null)
            }}
            onSuccess={() => {
              loadContas()
              setShowEditParceladaModal(false)
              setContaParceladaToEdit(null)
            }}
          />
        </Suspense>
      )}

    </div>
  )
}
