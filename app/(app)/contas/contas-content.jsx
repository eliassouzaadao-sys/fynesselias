"use client"

import { useState, useEffect, Fragment } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/format"
import { Plus, Download, Search, ArrowUpCircle, ArrowDownCircle, X, Trash2, Calendar, Edit, Loader2, ChevronRight, ChevronDown, Layers, RefreshCw, CreditCard, Truck, Check, UserPlus, Building2 } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { SimpleContaModal } from "./components/SimpleContaModal"

export function ContasContent() {
  const [contas, setContas] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
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

  // Estados para filtros
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [filtroTipo, setFiltroTipo] = useState("") // "", "pagar", "receber"
  const [filtroStatus, setFiltroStatus] = useState("") // "", "pendente", "vencida", "paga"
  const [filtroCentro, setFiltroCentro] = useState("")
  const [filtroAtivo, setFiltroAtivo] = useState("todos") // todos, hoje, amanha, semana, personalizado

  const loadContas = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/contas")
      const data = await res.json()
      setContas(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed to load contas:', e)
      setContas([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContas()
  }, [])

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

  // Retorna o status da conta (paga, vencida, pendente)
  const getContaStatus = (conta) => {
    const hoje = new Date()
    const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`
    const vencimentoStr = normalizarData(conta.vencimento)
    const vencido = vencimentoStr < hojeStr

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

  // Helper para verificar se é conta parcelada (tem parcelas)
  const isContaParcelada = (conta) => conta.parcelas && conta.parcelas.length > 0

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

  // Filtrar contas por texto e período
  const filteredContas = contas.filter(conta => {
    // Filtro de texto - considera também as parcelas
    const matchTexto =
      conta.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conta.pessoa?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conta.beneficiario?.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchTexto) return false

    // Para contas parceladas, verificar se alguma parcela está no período
    if (isContaParcelada(conta)) {
      if (dataInicio || dataFim) {
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
        if (filtroStatus === "paga" && !parcelasStatus.todasPagas) return false
        if (filtroStatus === "pendente" && parcelasStatus.todasPagas) return false
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

    return true
  })

  // Limpar filtros
  function limparFiltros() {
    setDataInicio("")
    setDataFim("")
    setFiltroTipo("")
    setFiltroStatus("")
    setFiltroCentro("")
    setFiltroAtivo("todos")
  }

  const temFiltro = dataInicio || dataFim || filtroTipo || filtroStatus || filtroCentro

  const getStatusBadge = (conta) => {
    // Para contas parceladas
    if (isContaParcelada(conta)) {
      const { pagas, total, todasPagas } = getParcelasStatus(conta)
      if (todasPagas) {
        return <Badge variant="success" className="bg-blue-100 text-blue-700">Quitada</Badge>
      }
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
          {pagas}/{total} pagas
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

    if (status === "paga") {
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
      const { todasPagas } = getParcelasStatus(conta)
      if (todasPagas) {
        return "bg-blue-50 hover:bg-blue-100/80"
      }
      return "bg-gray-50 hover:bg-gray-100/80"
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

    if (status === "paga") {
      return "bg-blue-50 hover:bg-blue-100/80"
    } else if (status === "vencida") {
      return "bg-red-50 hover:bg-red-100/80"
    } else {
      return "bg-yellow-50 hover:bg-yellow-100/80"
    }
  }

  async function deletarConta(id) {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) {
      return
    }

    try {
      await fetch('/api/contas', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setShowDetail(false)
      loadContas()
    } catch (error) {
      console.error('Erro ao deletar conta:', error)
      alert('Erro ao excluir conta')
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

      {/* Filtros */}
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

        {/* Filtro por Tipo */}
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Todos os tipos</option>
          <option value="pagar">A Pagar</option>
          <option value="receber">A Receber</option>
        </select>

        {/* Filtro por Status */}
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="vencida">Vencida</option>
          <option value="paga">Paga</option>
        </select>

        {temFiltro && (
          <Button variant="ghost" size="sm" onClick={limparFiltros}>
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Filtros de Data */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Periodo:</span>
        </div>

        {/* Filtros Rápidos */}
        <div className="flex items-center gap-1">
          <Button
            variant={filtroAtivo === "todos" ? "default" : "ghost"}
            size="sm"
            onClick={limparFiltros}
            className="h-8 text-xs px-3"
          >
            Todos
          </Button>
          <Button
            variant={filtroAtivo === "hoje" ? "default" : "ghost"}
            size="sm"
            onClick={filtrarHoje}
            className="h-8 text-xs px-3"
          >
            Hoje
          </Button>
          <Button
            variant={filtroAtivo === "amanha" ? "default" : "ghost"}
            size="sm"
            onClick={filtrarAmanha}
            className="h-8 text-xs px-3"
          >
            Amanha
          </Button>
          <Button
            variant={filtroAtivo === "semana" ? "default" : "ghost"}
            size="sm"
            onClick={filtrarSemana}
            className="h-8 text-xs px-3"
          >
            7 dias
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={dataInicio}
            onChange={(e) => handleDataInicioChange(e.target.value)}
            className="h-9 w-40"
          />
          <span className="text-muted-foreground">ate</span>
          <Input
            type="date"
            value={dataFim}
            onChange={(e) => handleDataFimChange(e.target.value)}
            className="h-9 w-40"
          />
        </div>
      </div>

      {/* Tabela de Contas */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Tipo</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Cód Tipo</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Fornecedor/Cliente</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Descrição</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">NF/Parcela</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Valor</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Vencimento</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Status</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground uppercase w-24">Ações</th>
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
                filteredContas.map((conta) => (
                  <Fragment key={conta.id}>
                    {/* Linha principal da conta */}
                    <tr
                      className={`border-b border-border transition-colors cursor-pointer ${getRowClassName(conta)}`}
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
                      <td className="py-3 px-4 text-sm text-foreground whitespace-nowrap">{conta.codigoTipo || "-"}</td>
                      <td className="py-3 px-4 text-sm text-foreground whitespace-nowrap">{conta.beneficiario || conta.pessoa?.nome || "-"}</td>
                      <td className="py-3 px-4 text-sm text-foreground whitespace-nowrap">
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
                        {formatCurrency(conta.valorTotal || conta.valor)}
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
                              deletarConta(conta.id)
                            }}
                            className="rounded p-1.5 text-muted-foreground hover:bg-red-100 hover:text-red-600 transition-colors"
                            title="Excluir"
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
                        <td className="py-2 px-4 text-xs text-muted-foreground whitespace-nowrap">{parcela.codigoTipo || "-"}</td>
                        <td className="py-2 px-4 text-xs text-muted-foreground whitespace-nowrap">{parcela.beneficiario || "-"}</td>
                        <td className="py-2 px-4 text-xs text-muted-foreground whitespace-nowrap">
                          Parcela {parcela.numeroParcela}
                        </td>
                        <td className="py-2 px-4 text-xs text-muted-foreground">
                          {parcela.numeroParcela}
                        </td>
                        <td className="py-2 px-4 text-xs font-medium text-foreground text-right">
                          {formatCurrency(parcela.valor)}
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
                                setContaToEdit(parcela)
                                setShowEditModal(true)
                              }}
                              className="rounded p-1 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                              title="Editar parcela"
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
                        <td className="py-2 px-4 text-xs text-muted-foreground whitespace-nowrap">{recorrencia.codigoTipo || "-"}</td>
                        <td className="py-2 px-4 text-xs text-muted-foreground whitespace-nowrap">{recorrencia.beneficiario || "-"}</td>
                        <td className="py-2 px-4 text-xs text-muted-foreground whitespace-nowrap">
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

      {/* Modal Nova Conta */}
      {showNewModal && tipoSelecionado && (
        <SimpleContaModal
          tipo={tipoSelecionado}
          onClose={() => {
            setShowNewModal(false)
            setTipoSelecionado(null)
          }}
          onSuccess={handleNovaContaSuccess}
        />
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
                  setContaToEdit(selectedConta)
                  setShowEditModal(true)
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

      {/* Modal de Edição */}
      {showEditModal && contaToEdit && (
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
      )}

      {/* Modal de Edição de Conta Parcelada */}
      {showEditParceladaModal && contaParceladaToEdit && (
        <EditContaParceladaModal
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
      )}

    </div>
  )
}

// Componente de Modal de Edição Expandido
function EditContaModal({ conta, onClose, onSuccess }) {
  // Parse parcela existente (formato "1/12" ou apenas "1")
  const parseParcela = (numeroParcela) => {
    if (!numeroParcela) return { atual: "", total: "" }
    const parts = numeroParcela.split("/")
    return {
      atual: parts[0]?.trim() || "",
      total: parts[1]?.trim() || ""
    }
  }

  const parcelaInicial = parseParcela(conta.numeroParcela)

  // Estados básicos
  const [beneficiario, setBeneficiario] = useState(conta.beneficiario || conta.pessoa?.nome || "")
  const [descricao, setDescricao] = useState(conta.descricao || "")
  const [codigoTipo, setCodigoTipo] = useState(conta.codigoTipo || "")
  const [numeroDocumento, setNumeroDocumento] = useState(conta.numeroDocumento || "")
  const [parcelaAtual, setParcelaAtual] = useState(parcelaInicial.atual)
  const [totalParcelas, setTotalParcelas] = useState(parcelaInicial.total)
  const [vencimento, setVencimento] = useState(conta.vencimento ? conta.vencimento.split('T')[0] : "")
  const [valor, setValor] = useState(conta.valor || 0)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  const [centros, setCentros] = useState([])
  const [loadingCentros, setLoadingCentros] = useState(false)

  // Estados novos para campos adicionais
  const [cartaoId, setCartaoId] = useState(conta.cartaoId?.toString() || "")
  const [cartoes, setCartoes] = useState([])
  const [loadingCartoes, setLoadingCartoes] = useState(false)
  const [bancoContaId, setBancoContaId] = useState(conta.bancoContaId?.toString() || "")
  const [bancos, setBancos] = useState([])
  const [loadingBancos, setLoadingBancos] = useState(false)
  const [formaPagamento, setFormaPagamento] = useState(conta.formaPagamento || "")
  const [observacoes, setObservacoes] = useState(conta.observacoes || "")
  const [banco, setBanco] = useState(conta.banco || "")
  const [categoria, setCategoria] = useState(conta.categoria || "")
  const [fonte, setFonte] = useState(conta.fonte || "")

  // Estados para fornecedores/clientes
  const [fornecedores, setFornecedores] = useState([])
  const [loadingFornecedores, setLoadingFornecedores] = useState(false)
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState(conta.pessoa || null)
  const [searchFornecedor, setSearchFornecedor] = useState("")
  const [openFornecedorPopover, setOpenFornecedorPopover] = useState(false)

  const labelPessoa = conta.tipo === "pagar" ? "Fornecedor" : "Cliente"

  // Filtrar fornecedores baseado na busca
  const fornecedoresFiltrados = searchFornecedor.trim()
    ? fornecedores.filter(f =>
        f.nome.toLowerCase().includes(searchFornecedor.toLowerCase()) ||
        f.documento?.includes(searchFornecedor)
      )
    : fornecedores

  // Fetch centros based on tipo (com hierarquia)
  useEffect(() => {
    const fetchCentros = async () => {
      setLoadingCentros(true)
      try {
        const tipoCentro = conta.tipo === "pagar" ? "despesa" : "faturamento"
        const res = await fetch(`/api/centros?tipo=${tipoCentro}&hierarquico=true`)
        const data = await res.json()
        setCentros(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("Error fetching centros:", err)
        setCentros([])
      } finally {
        setLoadingCentros(false)
      }
    }
    fetchCentros()
  }, [conta.tipo])

  // Fetch cartões de crédito (apenas para tipo "pagar")
  useEffect(() => {
    if (conta.tipo !== "pagar") return
    const fetchCartoes = async () => {
      setLoadingCartoes(true)
      try {
        const res = await fetch("/api/cartoes")
        const data = await res.json()
        setCartoes(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("Error fetching cartoes:", err)
        setCartoes([])
      } finally {
        setLoadingCartoes(false)
      }
    }
    fetchCartoes()
  }, [conta.tipo])

  // Fetch contas bancárias
  useEffect(() => {
    const fetchBancos = async () => {
      setLoadingBancos(true)
      try {
        const res = await fetch("/api/bancos")
        const data = await res.json()
        setBancos(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("Error fetching bancos:", err)
        setBancos([])
      } finally {
        setLoadingBancos(false)
      }
    }
    fetchBancos()
  }, [])

  // Fetch fornecedores/clientes
  useEffect(() => {
    const fetchPessoas = async () => {
      setLoadingFornecedores(true)
      try {
        const tipoPessoa = conta.tipo === "pagar" ? "fornecedor" : "cliente"
        const res = await fetch(`/api/fornecedores?status=ativo&tipo=${tipoPessoa}`)
        const data = await res.json()
        setFornecedores(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("Error fetching pessoas:", err)
        setFornecedores([])
      } finally {
        setLoadingFornecedores(false)
      }
    }
    fetchPessoas()
  }, [conta.tipo])

  // Selecionar fornecedor
  const handleSelectFornecedor = (fornecedor) => {
    setFornecedorSelecionado(fornecedor)
    setBeneficiario(fornecedor.nome)
    setSearchFornecedor("")
    setOpenFornecedorPopover(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!beneficiario.trim()) {
      setError(`${labelPessoa} é obrigatório`)
      return
    }

    if (!descricao.trim()) {
      setError("Descrição é obrigatória")
      return
    }

    if (!valor || valor <= 0) {
      setError("Valor deve ser maior que zero")
      return
    }

    if (!vencimento) {
      setError("Data de vencimento é obrigatória")
      return
    }

    setIsSaving(true)

    try {
      // Formatar número da parcela
      const numeroParcela = parcelaAtual && totalParcelas
        ? `${parcelaAtual}/${totalParcelas}`
        : parcelaAtual || null

      const response = await fetch(`/api/contas/${conta.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descricao: descricao.trim(),
          valor: Number(valor),
          vencimento,
          beneficiario: beneficiario.trim() || null,
          codigoTipo: codigoTipo.trim() || null,
          numeroDocumento: numeroDocumento.trim() || null,
          numeroParcela,
          totalParcelas: totalParcelas ? parseInt(totalParcelas) : null,
          cartaoId: cartaoId && cartaoId !== "none" ? parseInt(cartaoId) : null,
          bancoContaId: bancoContaId && bancoContaId !== "none" ? parseInt(bancoContaId) : null,
          formaPagamento: formaPagamento || null,
          observacoes: observacoes.trim() || null,
          banco: banco.trim() || null,
          categoria: categoria.trim() || null,
          fonte: fonte.trim() || null,
          pessoaId: fornecedorSelecionado?.id || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao atualizar conta")
      }

      onSuccess()
    } catch (err) {
      setError(err.message || "Erro ao atualizar conta")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Editar Conta {conta.tipo === "pagar" ? "a Pagar" : "a Receber"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSaving}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Fornecedor/Cliente com busca */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {labelPessoa} *
                </label>
                <Popover open={openFornecedorPopover} onOpenChange={setOpenFornecedorPopover}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openFornecedorPopover}
                      className="w-full justify-between font-normal"
                      disabled={isSaving}
                    >
                      {fornecedorSelecionado ? (
                        <span className="flex items-center gap-2 whitespace-nowrap">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          {fornecedorSelecionado.nome}
                        </span>
                      ) : beneficiario ? (
                        <span className="flex items-center gap-2 whitespace-nowrap">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          {beneficiario}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Selecione um {labelPessoa.toLowerCase()}...</span>
                      )}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <div className="p-2 border-b">
                      <Input
                        placeholder={`Buscar ${labelPessoa.toLowerCase()}...`}
                        value={searchFornecedor}
                        onChange={(e) => setSearchFornecedor(e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div className="max-h-[200px] overflow-y-auto">
                      {loadingFornecedores ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                          Carregando...
                        </div>
                      ) : fornecedoresFiltrados.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          Nenhum {labelPessoa.toLowerCase()} encontrado
                        </div>
                      ) : (
                        fornecedoresFiltrados.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => handleSelectFornecedor(f)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
                          >
                            {fornecedorSelecionado?.id === f.id && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{f.nome}</p>
                              {f.documento && (
                                <p className="text-xs text-muted-foreground">{f.documento}</p>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                    {/* Opção para digitar manualmente */}
                    <div className="p-2 border-t">
                      <Input
                        placeholder={`Ou digite o nome do ${labelPessoa.toLowerCase()}...`}
                        value={beneficiario}
                        onChange={(e) => {
                          setBeneficiario(e.target.value)
                          setFornecedorSelecionado(null)
                        }}
                        className="h-8"
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Descrição *</label>
                <Input
                  placeholder="Ex: Serviço de manutenção"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  disabled={isSaving}
                  required
                />
              </div>

              {/* Centro de Custo/Receita */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Centro de {conta.tipo === "pagar" ? "Custo" : "Receita"}
                </label>
                <Select value={codigoTipo || "none"} onValueChange={(v) => setCodigoTipo(v === "none" ? "" : v)} disabled={isSaving || loadingCentros}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingCentros ? "Carregando..." : "Selecione um centro"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {centros.map((centro) => (
                      <SelectItem
                        key={centro.id}
                        value={centro.sigla}
                        className={centro.level === 1 ? "pl-6" : ""}
                      >
                        <span className="flex items-center gap-2 whitespace-nowrap">
                          {centro.level === 1 && (
                            <span className="text-muted-foreground">└</span>
                          )}
                          <span className={centro.isParent ? "font-medium" : ""}>
                            {centro.sigla}
                          </span>
                          <span className="text-muted-foreground">-</span>
                          <span className={centro.isSocio ? "text-primary" : ""}>
                            {centro.nome}
                          </span>
                          {centro.isSocio ? (
                            <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                              Sócio
                            </span>
                          ) : centro.level === 1 && (
                            <span className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground rounded">
                              Sub
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Número do Documento */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">NF</label>
                <Input
                  placeholder="Ex: NF-12345"
                  value={numeroDocumento}
                  onChange={(e) => setNumeroDocumento(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              {/* Cartão de Crédito (apenas para tipo pagar) */}
              {conta.tipo === "pagar" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Cartão de Crédito
                  </label>
                  <Select value={cartaoId} onValueChange={setCartaoId} disabled={isSaving || loadingCartoes}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingCartoes ? "Carregando..." : "Selecione um cartão (opcional)"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum (pagamento normal)</SelectItem>
                      {cartoes.map((cartao) => (
                        <SelectItem key={cartao.id} value={cartao.id.toString()}>
                          <span className="whitespace-nowrap">{cartao.nome} (**** {cartao.ultimos4Digitos})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Conta Bancária */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Conta Bancária
                </label>
                <Select value={bancoContaId} onValueChange={setBancoContaId} disabled={isSaving || loadingBancos}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingBancos ? "Carregando..." : "Selecione uma conta (opcional)"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {bancos.map((b) => (
                      <SelectItem key={b.id} value={b.id.toString()}>
                        <span className="whitespace-nowrap">{b.nome} - Ag: {b.agencia} / Cc: {b.conta}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Forma de Pagamento */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Forma de Pagamento</label>
                <Select value={formaPagamento || "none"} onValueChange={(v) => setFormaPagamento(v === "none" ? "" : v)} disabled={isSaving}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                    <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Parcelas */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Parcela</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={parcelaAtual}
                    onChange={(e) => setParcelaAtual(e.target.value)}
                    disabled={isSaving}
                    className="w-20"
                  />
                  <span className="text-muted-foreground">/</span>
                  <Input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={totalParcelas}
                    onChange={(e) => setTotalParcelas(e.target.value)}
                    disabled={isSaving}
                    className="w-20"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Ex: parcela 1 de 12
                </p>
              </div>

              {/* Valor */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Valor *</label>
                <CurrencyInput
                  value={valor}
                  onValueChange={setValor}
                  required
                  disabled={isSaving}
                />
              </div>

              {/* Data de Vencimento */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Vencimento *</label>
                <Input
                  type="date"
                  value={vencimento}
                  onChange={(e) => setVencimento(e.target.value)}
                  required
                  disabled={isSaving}
                  className="w-48"
                />
              </div>

              {/* Banco */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Banco</label>
                <Input
                  placeholder="Ex: Bradesco, Itaú..."
                  value={banco}
                  onChange={(e) => setBanco(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              {/* Fonte (apenas para receber) */}
              {conta.tipo === "receber" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Fonte da Receita</label>
                  <Input
                    placeholder="Ex: Vendas, Serviços..."
                    value={fonte}
                    onChange={(e) => setFonte(e.target.value)}
                    disabled={isSaving}
                  />
                </div>
              )}

              {/* Categoria */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Categoria</label>
                <Input
                  placeholder="Ex: Manutenção, Aluguel..."
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              {/* Observações */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Observações</label>
                <Textarea
                  placeholder="Observações adicionais..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  disabled={isSaving}
                  rows={3}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-900">{error}</p>
              </div>
            )}
          </div>

          <div className="border-t border-border p-4 flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

// Componente de Modal de Edição de Conta Parcelada
function EditContaParceladaModal({ conta, onClose, onSuccess }) {
  const [descricao, setDescricao] = useState(conta.descricao || "")
  const [beneficiario, setBeneficiario] = useState(conta.beneficiario || conta.pessoa?.nome || "")
  const [codigoTipo, setCodigoTipo] = useState(conta.codigoTipo || "")
  const [numeroDocumento, setNumeroDocumento] = useState(conta.numeroDocumento || "")
  const [valorTotal, setValorTotal] = useState(conta.valorTotal || conta.valor || 0)
  const [totalParcelas, setTotalParcelas] = useState(conta.totalParcelas || conta.parcelas?.length || 1)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [centros, setCentros] = useState([])
  const [loadingCentros, setLoadingCentros] = useState(false)

  // Estados adicionais para edição completa
  const [cartaoId, setCartaoId] = useState(conta.cartaoId?.toString() || "")
  const [cartoes, setCartoes] = useState([])
  const [loadingCartoes, setLoadingCartoes] = useState(false)
  const [bancoContaId, setBancoContaId] = useState(conta.bancoContaId?.toString() || "")
  const [bancos, setBancos] = useState([])
  const [loadingBancos, setLoadingBancos] = useState(false)
  const [formaPagamento, setFormaPagamento] = useState(conta.formaPagamento || "")
  const [observacoes, setObservacoes] = useState(conta.observacoes || "")

  const labelPessoa = conta.tipo === "pagar" ? "Fornecedor" : "Cliente"

  // Calcular parcelas pagas e não pagas
  const parcelasPagas = conta.parcelas?.filter(p => p.pago) || []
  const parcelasNaoPagas = conta.parcelas?.filter(p => !p.pago) || []

  // Calcular valor por parcela
  const valorParcela = totalParcelas > 0 ? valorTotal / totalParcelas : 0

  // Verificar se pode reduzir parcelas (mínimo = parcelas já pagas)
  const minParcelas = parcelasPagas.length || 1

  // Fetch centros based on tipo
  // Fetch centros based on tipo (com hierarquia)
  useEffect(() => {
    const fetchCentros = async () => {
      setLoadingCentros(true)
      try {
        const tipoCentro = conta.tipo === "pagar" ? "despesa" : "faturamento"
        const res = await fetch(`/api/centros?tipo=${tipoCentro}&hierarquico=true`)
        const data = await res.json()
        setCentros(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("Error fetching centros:", err)
        setCentros([])
      } finally {
        setLoadingCentros(false)
      }
    }
    fetchCentros()
  }, [conta.tipo])

  // Fetch cartões de crédito (apenas para tipo "pagar")
  useEffect(() => {
    if (conta.tipo !== "pagar") return
    const fetchCartoes = async () => {
      setLoadingCartoes(true)
      try {
        const res = await fetch("/api/cartoes")
        const data = await res.json()
        setCartoes(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("Error fetching cartoes:", err)
        setCartoes([])
      } finally {
        setLoadingCartoes(false)
      }
    }
    fetchCartoes()
  }, [conta.tipo])

  // Fetch contas bancárias
  useEffect(() => {
    const fetchBancos = async () => {
      setLoadingBancos(true)
      try {
        const res = await fetch("/api/bancos")
        const data = await res.json()
        setBancos(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("Error fetching bancos:", err)
        setBancos([])
      } finally {
        setLoadingBancos(false)
      }
    }
    fetchBancos()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!descricao.trim()) {
      setError("Descrição é obrigatória")
      return
    }

    if (!valorTotal || valorTotal <= 0) {
      setError("Valor total deve ser maior que zero")
      return
    }

    if (!totalParcelas || totalParcelas < minParcelas) {
      setError(`Total de parcelas deve ser no mínimo ${minParcelas} (parcelas já pagas)`)
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch(`/api/contas/${conta.id}/parcelas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descricao: descricao.trim(),
          valorTotal: Number(valorTotal),
          totalParcelas: parseInt(totalParcelas),
          beneficiario: beneficiario.trim() || null,
          codigoTipo: codigoTipo.trim() || null,
          numeroDocumento: numeroDocumento.trim() || null,
          cartaoId: cartaoId && cartaoId !== "none" ? parseInt(cartaoId) : null,
          bancoContaId: bancoContaId && bancoContaId !== "none" ? parseInt(bancoContaId) : null,
          formaPagamento: formaPagamento || null,
          observacoes: observacoes.trim() || null,
          propagarParaFuturas: true,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erro ao atualizar conta parcelada")
      }

      setSuccessMessage(result.message)

      // Aguardar um pouco para mostrar a mensagem de sucesso
      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (err) {
      setError(err.message || "Erro ao atualizar conta parcelada")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-foreground" />
            <h2 className="text-lg font-semibold text-foreground">
              Editar Lançamento Parcelado
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSaving}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {/* Info do parcelamento */}
            <div className="rounded-lg bg-muted/50 border border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Status do Parcelamento</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {parcelasPagas.length} de {conta.parcelas?.length || 0} parcelas pagas
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Valor atual por parcela</p>
                  <p className="text-lg font-bold text-foreground">
                    {formatCurrency(conta.valorTotal / (conta.totalParcelas || 1))}
                  </p>
                </div>
              </div>
              {parcelasPagas.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">
                  As alterações serão aplicadas apenas às {parcelasNaoPagas.length} parcelas não pagas
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Descrição */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Descrição *</label>
                <Input
                  placeholder="Ex: Compra parcelada"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  disabled={isSaving}
                  required
                />
              </div>

              {/* Fornecedor/Cliente */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{labelPessoa}</label>
                <Input
                  placeholder={conta.tipo === "pagar" ? "Ex: Fornecedor XYZ" : "Ex: Cliente ABC"}
                  value={beneficiario}
                  onChange={(e) => setBeneficiario(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              {/* Centro de Custo/Receita */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Centro de {conta.tipo === "pagar" ? "Custo" : "Receita"}
                </label>
                <Select value={codigoTipo || "none"} onValueChange={(v) => setCodigoTipo(v === "none" ? "" : v)} disabled={isSaving || loadingCentros}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingCentros ? "Carregando..." : "Selecione um centro"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {centros.map((centro) => (
                      <SelectItem
                        key={centro.id}
                        value={centro.sigla}
                        className={centro.level === 1 ? "pl-6" : ""}
                      >
                        <span className="flex items-center gap-2 whitespace-nowrap">
                          {centro.level === 1 && (
                            <span className="text-muted-foreground">└</span>
                          )}
                          <span className={centro.isParent ? "font-medium" : ""}>
                            {centro.sigla}
                          </span>
                          <span className="text-muted-foreground">-</span>
                          <span className={centro.isSocio ? "text-primary" : ""}>
                            {centro.nome}
                          </span>
                          {centro.isSocio ? (
                            <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                              Sócio
                            </span>
                          ) : centro.level === 1 && (
                            <span className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground rounded">
                              Sub
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Número do Documento */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">NF</label>
                <Input
                  placeholder="Ex: NF-12345"
                  value={numeroDocumento}
                  onChange={(e) => setNumeroDocumento(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              {/* Valor Total */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Valor Total *</label>
                <CurrencyInput
                  value={valorTotal}
                  onValueChange={setValorTotal}
                  required
                  disabled={isSaving}
                />
              </div>

              {/* Total de Parcelas */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Total de Parcelas *</label>
                <Input
                  type="number"
                  min={minParcelas}
                  max="48"
                  value={totalParcelas}
                  onChange={(e) => setTotalParcelas(e.target.value)}
                  disabled={isSaving}
                  className="w-24"
                />
                {minParcelas > 1 && (
                  <p className="text-xs text-muted-foreground">
                    Mínimo: {minParcelas} (parcelas já pagas)
                  </p>
                )}
              </div>

              {/* Cartão de Crédito (apenas para tipo pagar) */}
              {conta.tipo === "pagar" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Cartão de Crédito
                  </label>
                  <Select value={cartaoId} onValueChange={setCartaoId} disabled={isSaving || loadingCartoes}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingCartoes ? "Carregando..." : "Selecione um cartão (opcional)"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum (pagamento normal)</SelectItem>
                      {cartoes.map((cartao) => (
                        <SelectItem key={cartao.id} value={cartao.id.toString()}>
                          <span className="whitespace-nowrap">{cartao.nome} (**** {cartao.ultimos4Digitos})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Conta Bancária */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Conta Bancária
                </label>
                <Select value={bancoContaId} onValueChange={setBancoContaId} disabled={isSaving || loadingBancos}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingBancos ? "Carregando..." : "Selecione uma conta (opcional)"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {bancos.map((b) => (
                      <SelectItem key={b.id} value={b.id.toString()}>
                        <span className="whitespace-nowrap">{b.nome} - Ag: {b.agencia} / Cc: {b.conta}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Forma de Pagamento */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Forma de Pagamento</label>
                <Select value={formaPagamento || "none"} onValueChange={(v) => setFormaPagamento(v === "none" ? "" : v)} disabled={isSaving}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                    <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Observações */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Observações</label>
                <Textarea
                  placeholder="Observações adicionais..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  disabled={isSaving}
                  rows={3}
                />
              </div>

              {/* Preview do novo valor por parcela */}
              <div className="space-y-2 md:col-span-2">
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-primary">Novo valor por parcela</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatCurrency(valorTotal)} ÷ {totalParcelas} parcelas
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(valorParcela)}
                    </p>
                  </div>
                  {totalParcelas != conta.totalParcelas && (
                    <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-primary/20">
                      {totalParcelas > conta.totalParcelas
                        ? `Serão criadas ${totalParcelas - conta.totalParcelas} novas parcelas`
                        : `Serão removidas ${conta.totalParcelas - totalParcelas} parcelas não pagas`
                      }
                    </p>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-900">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                <p className="text-sm text-green-900">{successMessage}</p>
              </div>
            )}
          </div>

          <div className="border-t border-border p-4 flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Layers className="h-4 w-4 mr-2" />
                  Salvar e Propagar
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
