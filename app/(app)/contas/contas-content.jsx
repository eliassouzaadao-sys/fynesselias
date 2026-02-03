"use client"

import { useState, useEffect, Fragment } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/format"
import { Plus, Download, Search, ArrowUpCircle, ArrowDownCircle, X, Trash2, Calendar, Edit, Loader2, ChevronRight, ChevronDown, Layers } from "lucide-react"
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
        <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
          {pagas}/{total} pagas
        </Badge>
      )
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
      return "bg-purple-50 hover:bg-purple-100/80"
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
                        if (isContaParcelada(conta)) {
                          toggleExpand(conta.id)
                        } else {
                          setSelectedConta(conta)
                          setShowDetail(true)
                        }
                      }}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {isContaParcelada(conta) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleExpand(conta.id)
                              }}
                              className="p-0.5 hover:bg-muted rounded"
                            >
                              {expandedContas[conta.id] ? (
                                <ChevronDown className="h-4 w-4 text-purple-600" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-purple-600" />
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
                            <Layers className="h-3.5 w-3.5 text-purple-500" title="Conta parcelada" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">{conta.codigoTipo || "-"}</td>
                      <td className="py-3 px-4 text-sm text-foreground">{conta.beneficiario || conta.pessoa?.nome || "-"}</td>
                      <td className="py-3 px-4 text-sm text-foreground">
                        {conta.descricao || "-"}
                        {isContaParcelada(conta) && (
                          <span className="text-xs text-purple-600 ml-2">
                            ({conta.totalParcelas || conta.parcelas?.length}x)
                          </span>
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
                          {!isContaParcelada(conta) && (
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
                        <td className="py-2 px-4 text-xs text-muted-foreground">{parcela.codigoTipo || "-"}</td>
                        <td className="py-2 px-4 text-xs text-muted-foreground">{parcela.beneficiario || "-"}</td>
                        <td className="py-2 px-4 text-xs text-muted-foreground">
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

    </div>
  )
}

// Componente de Modal de Edição
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

  const labelPessoa = conta.tipo === "pagar" ? "Fornecedor" : "Cliente"

  // Fetch centros based on tipo
  useEffect(() => {
    const fetchCentros = async () => {
      setLoadingCentros(true)
      try {
        const tipoCentro = conta.tipo === "pagar" ? "despesa" : "faturamento"
        const res = await fetch(`/api/centros?tipo=${tipoCentro}`)
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

      const response = await fetch("/api/contas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: conta.id,
          descricao: descricao.trim(),
          valor: Number(valor),
          vencimento,
          beneficiario: beneficiario.trim() || null,
          codigoTipo: codigoTipo.trim() || null,
          numeroDocumento: numeroDocumento.trim() || null,
          numeroParcela,
          totalParcelas: totalParcelas ? parseInt(totalParcelas) : null,
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
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
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
              {/* Fornecedor/Cliente */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {labelPessoa} *
                </label>
                <Input
                  placeholder={conta.tipo === "pagar" ? "Ex: Fornecedor XYZ" : "Ex: Cliente ABC"}
                  value={beneficiario}
                  onChange={(e) => setBeneficiario(e.target.value)}
                  disabled={isSaving}
                  required
                />
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
                <Select value={codigoTipo} onValueChange={setCodigoTipo} disabled={isSaving || loadingCentros}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingCentros ? "Carregando..." : "Selecione um centro"} />
                  </SelectTrigger>
                  <SelectContent>
                    {centros.length === 0 ? (
                      <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                        Nenhum centro cadastrado
                      </div>
                    ) : (
                      centros.map((centro) => (
                        <SelectItem key={centro.id} value={centro.sigla}>
                          {centro.sigla} - {centro.nome}
                        </SelectItem>
                      ))
                    )}
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
              <div className="space-y-2 md:col-span-2">
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
