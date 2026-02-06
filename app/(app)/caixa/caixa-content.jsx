"use client"

import { useState, useEffect, useRef } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency, formatDate } from "@/lib/format"
import { CurrencyInput } from "@/components/ui/currency-input"
import { TrendingUp, TrendingDown, Building2, Plus, X, Trash2, Edit, Copy, ChevronDown, Calendar, Clock, CheckCircle2, ArrowDownCircle, ArrowUpCircle, Filter, Search, CreditCard, Wallet, Loader2, Eye, Truck, Check, UserPlus } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { NovoCartaoModal } from "@/app/(app)/cartoes/components/NovoCartaoModal"
import { CartaoCard } from "@/app/(app)/cartoes/components/CartaoCard"
import { FaturaModal } from "@/app/(app)/cartoes/components/FaturaModal"

export function FluxoCaixaContent() {
  const [selectedRow, setSelectedRow] = useState(null)
  const [fluxoCaixa, setFluxoCaixa] = useState([])
  const [activeTab, setActiveTab] = useState("fluxo") // "fluxo", "bancos" ou "cartoes"

  // Estados para filtro de data
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [filtroAtivo, setFiltroAtivo] = useState("todos") // todos, hoje, amanha, personalizado

  // Estados para filtros avancados
  const [filtroCodigo, setFiltroCodigo] = useState("")
  const [filtroDescricao, setFiltroDescricao] = useState("")
  const [filtroBancoId, setFiltroBancoId] = useState("")
  const [showFiltrosAvancados, setShowFiltrosAvancados] = useState(false)

  // Estados para bancos
  const [bancos, setBancos] = useState([])
  const [loadingBancos, setLoadingBancos] = useState(false)
  const [showBancoModal, setShowBancoModal] = useState(false)
  const [editingBanco, setEditingBanco] = useState(null)
  const [bancoForm, setBancoForm] = useState({
    nome: "",
    codigo: "",
    agencia: "",
    conta: "",
    chavePix: "",
    tipoChavePix: "",
    saldoInicial: 0
  })

  // Estados para cartões de crédito
  const [cartoes, setCartoes] = useState([])
  const [loadingCartoes, setLoadingCartoes] = useState(false)
  const [showNovoCartaoModal, setShowNovoCartaoModal] = useState(false)
  const [cartaoParaEditar, setCartaoParaEditar] = useState(null)
  const [cartaoParaFaturas, setCartaoParaFaturas] = useState(null)
  const [faturas, setFaturas] = useState([])
  const [loadingFaturas, setLoadingFaturas] = useState(false)
  const [faturaDetalhe, setFaturaDetalhe] = useState(null)

  // Estado para dropdown de banco na tabela
  const [openBancoDropdown, setOpenBancoDropdown] = useState(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const dropdownRef = useRef(null)

  // Estados para modal de nova movimentação
  const [showTipoSelector, setShowTipoSelector] = useState(false)
  const [showMovimentacaoModal, setShowMovimentacaoModal] = useState(false)
  const [savingMovimentacao, setSavingMovimentacao] = useState(false)
  const [centros, setCentros] = useState([])
  const [movimentacaoForm, setMovimentacaoForm] = useState({
    tipo: "saida",
    dia: new Date().toISOString().split('T')[0],
    codigoTipo: "",
    fornecedorCliente: "",
    descricao: "",
    valor: 0,
    bancoId: "",
    cartaoId: ""
  })

  // Estados para fornecedores/clientes no modal de movimentação
  const [fornecedores, setFornecedores] = useState([])
  const [loadingFornecedores, setLoadingFornecedores] = useState(false)
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState(null)
  const [searchFornecedor, setSearchFornecedor] = useState("")
  const [openFornecedorPopover, setOpenFornecedorPopover] = useState(false)

  // Estados para cadastro inline de fornecedor/cliente
  const [showCadastroInline, setShowCadastroInline] = useState(false)
  const [novoNome, setNovoNome] = useState("")
  const [savingNovo, setSavingNovo] = useState(false)

  // Estados para aba de contas pendentes
  const [contasPendentes, setContasPendentes] = useState([])
  const [loadingContas, setLoadingContas] = useState(false)
  const [showBancoSelector, setShowBancoSelector] = useState(false)
  const [selectedBancoId, setSelectedBancoId] = useState(null)
  const [contaParaPagar, setContaParaPagar] = useState(null)
  const [processandoPagamento, setProcessandoPagamento] = useState(false)

  // Buscar dados do fluxo de caixa e bancos
  useEffect(() => {
    async function fetchData() {
      try {
        // Requisições sequenciais para evitar conflitos de concorrência
        const fluxoRes = await fetch("/api/fluxo-caixa");
        const fluxoData = await fluxoRes.json();

        const bancosRes = await fetch("/api/bancos");
        const bancosData = await bancosRes.json();

        setFluxoCaixa(Array.isArray(fluxoData) ? fluxoData : []);
        setBancos(Array.isArray(bancosData) ? bancosData : []);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        setFluxoCaixa([]);
        setBancos([]);
      }
    }
    fetchData();
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenBancoDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Buscar contas pendentes junto com os dados iniciais
  useEffect(() => {
    fetchContasPendentes()
  }, [])

  async function fetchContasPendentes() {
    try {
      setLoadingContas(true)
      // Usar modo=individual para obter parcelas como contas separadas
      const res = await fetch('/api/contas?modo=individual')
      const data = await res.json()
      // Filtrar apenas contas não pagas
      const pendentes = (Array.isArray(data) ? data : []).filter(c => !c.pago)
      setContasPendentes(pendentes)
    } catch (error) {
      console.error('Erro ao buscar contas pendentes:', error)
      setContasPendentes([])
    } finally {
      setLoadingContas(false)
    }
  }

  // Abrir modal de seleção de banco para pagar
  function abrirSeletorBanco(conta) {
    setContaParaPagar(conta)
    fetchBancos()
    setSelectedBancoId(null)
    setShowBancoSelector(true)
  }

  // Confirmar pagamento com banco selecionado
  async function confirmarPagamento() {
    if (!contaParaPagar) return

    try {
      setProcessandoPagamento(true)
      await fetch('/api/contas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: contaParaPagar.id,
          pago: true,
          dataPagamento: new Date(),
          bancoId: selectedBancoId
        }),
      })
      setShowBancoSelector(false)
      setContaParaPagar(null)
      setSelectedBancoId(null)
      // Recarregar contas pendentes e fluxo
      fetchContasPendentes()
      const fluxoRes = await fetch('/api/fluxo-caixa')
      const fluxoData = await fluxoRes.json()
      setFluxoCaixa(Array.isArray(fluxoData) ? fluxoData : [])
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error)
      alert('Erro ao confirmar pagamento')
    } finally {
      setProcessandoPagamento(false)
    }
  }

  // Helper para badge de status
  function getStatusBadge(conta) {
    const vencido = new Date(conta.vencimento) < new Date()
    if (vencido) {
      return <Badge variant="destructive" className="bg-red-100 text-red-700">Vencida</Badge>
    }
    return <Badge variant="warning" className="bg-yellow-100 text-yellow-700">Pendente</Badge>
  }

  // Atualizar banco de uma movimentacao
  async function updateFluxoBanco(fluxoId, bancoId) {
    try {
      await fetch('/api/fluxo-caixa', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: fluxoId, bancoId })
      })
      // Atualizar localmente
      setFluxoCaixa(prev => prev.map(item =>
        item.id === fluxoId
          ? { ...item, bancoId, banco: bancos.find(b => b.id === bancoId) || null }
          : item
      ))
      setOpenBancoDropdown(null)
    } catch (error) {
      console.error('Erro ao atualizar banco:', error)
      alert('Erro ao atualizar banco')
    }
  }

  // Recarregar bancos quando a aba de bancos estiver ativa
  useEffect(() => {
    if (activeTab === "bancos" && bancos.length === 0) {
      fetchBancos()
    }
  }, [activeTab, bancos.length])

  async function fetchBancos() {
    try {
      setLoadingBancos(true)
      const res = await fetch('/api/bancos')
      const data = await res.json()
      setBancos(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erro ao buscar bancos:', error)
      setBancos([])
    } finally {
      setLoadingBancos(false)
    }
  }

  function openNewBancoModal() {
    setEditingBanco(null)
    setBancoForm({
      nome: "",
      codigo: "",
      agencia: "",
      conta: "",
      chavePix: "",
      tipoChavePix: "",
      saldoInicial: 0
    })
    setShowBancoModal(true)
  }

  function openEditBancoModal(banco) {
    setEditingBanco(banco)
    setBancoForm({
      nome: banco.nome || "",
      codigo: banco.codigo || "",
      agencia: banco.agencia || "",
      conta: banco.conta || "",
      chavePix: banco.chavePix || "",
      tipoChavePix: banco.tipoChavePix || "",
      saldoInicial: banco.saldoInicial || 0
    })
    setShowBancoModal(true)
  }

  async function handleSaveBanco(e) {
    e.preventDefault()

    try {
      const method = editingBanco ? 'PUT' : 'POST'
      const body = editingBanco
        ? { ...bancoForm, id: editingBanco.id }
        : bancoForm

      const response = await fetch('/api/bancos', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao salvar banco')
      }

      setShowBancoModal(false)
      fetchBancos()
    } catch (error) {
      console.error('Erro ao salvar banco:', error)
      alert(error.message || 'Erro ao salvar banco')
    }
  }

  async function handleDeleteBanco(id) {
    if (!confirm('Tem certeza que deseja excluir este banco?')) return

    try {
      await fetch('/api/bancos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      fetchBancos()
    } catch (error) {
      console.error('Erro ao excluir banco:', error)
      alert('Erro ao excluir banco')
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
  }

  // Funções para cartões de crédito
  async function fetchCartoes() {
    try {
      setLoadingCartoes(true)
      const res = await fetch("/api/cartoes")
      const data = await res.json()
      setCartoes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Erro ao carregar cartões:", error)
      setCartoes([])
    } finally {
      setLoadingCartoes(false)
    }
  }

  // Carregar cartões quando a aba de cartões estiver ativa
  useEffect(() => {
    if (activeTab === "cartoes" && cartoes.length === 0) {
      fetchCartoes()
    }
  }, [activeTab, cartoes.length])

  async function loadFaturas(cartaoId) {
    try {
      setLoadingFaturas(true)
      const res = await fetch(`/api/cartoes/${cartaoId}/faturas`)
      const data = await res.json()
      setFaturas(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Erro ao carregar faturas:", error)
      setFaturas([])
    } finally {
      setLoadingFaturas(false)
    }
  }

  function handleVerFaturas(cartao) {
    setCartaoParaFaturas(cartao)
    loadFaturas(cartao.id)
  }

  function handleEditarCartao(cartao) {
    setCartaoParaEditar(cartao)
    setShowNovoCartaoModal(true)
  }

  async function handleExcluirCartao(cartaoId) {
    if (!confirm("Tem certeza que deseja excluir este cartão?")) return

    try {
      const res = await fetch(`/api/cartoes?id=${cartaoId}`, { method: "DELETE" })
      if (res.ok) {
        fetchCartoes()
      }
    } catch (error) {
      console.error("Erro ao excluir cartão:", error)
      alert("Erro ao excluir cartão")
    }
  }

  function handleCartaoSuccess() {
    fetchCartoes()
    setShowNovoCartaoModal(false)
    setCartaoParaEditar(null)
  }

  // Calcular KPIs dos cartões
  const limiteTotal = cartoes.reduce((acc, c) => acc + c.limite, 0)
  const limiteUtilizado = cartoes.reduce((acc, c) => acc + (c.limiteUtilizado || 0), 0)
  const limiteDisponivel = limiteTotal - limiteUtilizado
  const percentUtilizado = limiteTotal > 0 ? (limiteUtilizado / limiteTotal) * 100 : 0

  // Buscar centros de custo filtrados por tipo (com hierarquia)
  async function fetchCentrosByTipo(tipoMovimentacao) {
    try {
      const tipoCentro = tipoMovimentacao === "entrada" ? "faturamento" : "despesa"
      const res = await fetch(`/api/centros?tipo=${tipoCentro}&hierarquico=true`)
      const data = await res.json()
      setCentros(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erro ao buscar centros:', error)
      setCentros([])
    }
  }

  // Buscar fornecedores/clientes baseado no tipo
  async function fetchFornecedoresByTipo(tipoMovimentacao) {
    try {
      setLoadingFornecedores(true)
      const tipoPessoa = tipoMovimentacao === "entrada" ? "cliente" : "fornecedor"
      const res = await fetch(`/api/fornecedores?status=ativo&tipo=${tipoPessoa}`)
      const data = await res.json()
      setFornecedores(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error)
      setFornecedores([])
    } finally {
      setLoadingFornecedores(false)
    }
  }

  // Filtrar fornecedores baseado na busca
  const fornecedoresFiltrados = searchFornecedor.trim()
    ? fornecedores.filter(f =>
        f.nome.toLowerCase().includes(searchFornecedor.toLowerCase()) ||
        f.documento?.includes(searchFornecedor)
      )
    : fornecedores

  // Selecionar fornecedor
  function handleSelectFornecedor(fornecedor) {
    setFornecedorSelecionado(fornecedor)
    setMovimentacaoForm(prev => ({ ...prev, fornecedorCliente: fornecedor.nome }))
    setSearchFornecedor("")
    setOpenFornecedorPopover(false)
  }

  // Cadastrar novo fornecedor/cliente inline
  async function handleCadastrarNovo() {
    if (!novoNome.trim()) return

    setSavingNovo(true)
    try {
      const tipoPessoa = movimentacaoForm.tipo === "entrada" ? "cliente" : "fornecedor"
      const res = await fetch("/api/fornecedores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: novoNome.trim(),
          tipo: tipoPessoa,
        }),
      })

      if (res.ok) {
        const novaPessoa = await res.json()
        // Adicionar à lista e selecionar
        setFornecedores(prev => [...prev, novaPessoa])
        setFornecedorSelecionado(novaPessoa)
        setMovimentacaoForm(prev => ({ ...prev, fornecedorCliente: novaPessoa.nome }))
        // Limpar form inline
        setNovoNome("")
        setShowCadastroInline(false)
        setOpenFornecedorPopover(false)
      }
    } catch (err) {
      console.error("Erro ao cadastrar:", err)
    } finally {
      setSavingNovo(false)
    }
  }

  // Abrir modal de nova movimentação
  async function openMovimentacaoModal(tipo) {
    const tipoInicial = tipo || "saida"
    setMovimentacaoForm({
      tipo: tipoInicial,
      dia: new Date().toISOString().split('T')[0],
      codigoTipo: "",
      fornecedorCliente: "",
      valor: 0,
      bancoId: "",
      cartaoId: ""
    })
    setShowTipoSelector(false)
    setShowMovimentacaoModal(true)

    // Limpar seleção de fornecedor
    setFornecedorSelecionado(null)
    setSearchFornecedor("")
    setShowCadastroInline(false)

    // Buscar centros de custo filtrados pelo tipo inicial
    fetchCentrosByTipo(tipoInicial)

    // Buscar fornecedores/clientes filtrados pelo tipo inicial
    fetchFornecedoresByTipo(tipoInicial)

    // Buscar bancos e cartões se ainda não carregados
    if (bancos.length === 0) {
      fetchBancos()
    }
    if (cartoes.length === 0) {
      fetchCartoes()
    }
  }

  // Atualizar centros e fornecedores quando tipo de movimentação mudar
  function handleTipoMovimentacaoChange(novoTipo) {
    setMovimentacaoForm(prev => ({
      ...prev,
      tipo: novoTipo,
      codigoTipo: "", // Limpa o centro selecionado ao mudar o tipo
      fornecedorCliente: "" // Limpa fornecedor ao mudar o tipo
    }))
    setFornecedorSelecionado(null)
    setSearchFornecedor("")
    fetchCentrosByTipo(novoTipo)
    fetchFornecedoresByTipo(novoTipo)
  }

  // Excluir movimentação (permite excluir lançamentos pagos, revertendo para pendente)
  async function handleDeleteMovimentacao(id, contaId) {
    const mensagem = contaId
      ? 'Tem certeza que deseja excluir esta movimentação?\n\nA conta vinculada será revertida para status PENDENTE.'
      : 'Tem certeza que deseja excluir esta movimentacao?'

    if (!confirm(mensagem)) return

    try {
      const response = await fetch('/api/fluxo-caixa', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao excluir movimentação')
      }

      // Recarregar dados do fluxo e contas pendentes
      const [fluxoRes, contasRes] = await Promise.all([
        fetch('/api/fluxo-caixa'),
        fetch('/api/contas?modo=individual')
      ])
      const fluxoData = await fluxoRes.json()
      const contasData = await contasRes.json()
      setFluxoCaixa(Array.isArray(fluxoData) ? fluxoData : [])
      setContasPendentes(Array.isArray(contasData) ? contasData.filter(c => !c.pago) : [])
      setSelectedRow(null)
    } catch (error) {
      console.error('Erro ao excluir movimentação:', error)
      alert(error.message || 'Erro ao excluir movimentação')
    }
  }

  // Editar movimentação paga (abre modal de edição)
  const [showEditFluxoModal, setShowEditFluxoModal] = useState(false)
  const [fluxoToEdit, setFluxoToEdit] = useState(null)

  function handleEditMovimentacao(item) {
    setFluxoToEdit(item)
    setShowEditFluxoModal(true)
  }

  // Salvar nova movimentação
  async function handleSaveMovimentacao(e) {
    e.preventDefault()

    if (!movimentacaoForm.valor || movimentacaoForm.valor <= 0) {
      alert('Valor deve ser maior que zero')
      return
    }

    setSavingMovimentacao(true)
    try {
      const payload = {
        tipo: movimentacaoForm.tipo,
        dia: movimentacaoForm.dia,
        codigoTipo: movimentacaoForm.codigoTipo || null,
        centroCustoSigla: movimentacaoForm.codigoTipo || null,
        fornecedorCliente: movimentacaoForm.fornecedorCliente || 'Movimentação manual',
        descricao: movimentacaoForm.descricao || null,
        valor: movimentacaoForm.valor,
        bancoId: movimentacaoForm.bancoId ? Number(movimentacaoForm.bancoId) : null,
        cartaoId: movimentacaoForm.cartaoId ? Number(movimentacaoForm.cartaoId) : null,
      }

      const response = await fetch('/api/fluxo-caixa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar movimentação')
      }

      // Recarregar dados
      const fluxoRes = await fetch('/api/fluxo-caixa')
      const fluxoData = await fluxoRes.json()
      setFluxoCaixa(Array.isArray(fluxoData) ? fluxoData : [])

      setShowMovimentacaoModal(false)
    } catch (error) {
      console.error('Erro ao salvar movimentação:', error)
      alert(error.message || 'Erro ao salvar movimentação')
    } finally {
      setSavingMovimentacao(false)
    }
  }

  // Calcular saldo atual (último fluxo)
  const saldoAtual = fluxoCaixa[0]?.fluxo || 0

  // Helper para normalizar data (evita problemas de timezone)
  const normalizarData = (dateStr) => {
    const d = new Date(dateStr)
    const ano = d.getFullYear()
    const mes = String(d.getMonth() + 1).padStart(2, '0')
    const dia = String(d.getDate()).padStart(2, '0')
    return `${ano}-${mes}-${dia}`
  }

  // Filtrar fluxo por período e filtros avancados
  const fluxoFiltrado = fluxoCaixa.filter(item => {
    const dataItemStr = item.dia.split('T')[0] // Extrai apenas YYYY-MM-DD
    if (dataInicio && dataItemStr < dataInicio) return false
    if (dataFim && dataItemStr > dataFim) return false

    // Filtro por codigo
    if (filtroCodigo && item.codigoTipo) {
      if (!item.codigoTipo.toLowerCase().includes(filtroCodigo.toLowerCase())) return false
    } else if (filtroCodigo && !item.codigoTipo) {
      return false
    }

    // Filtro por descricao/fornecedor
    if (filtroDescricao && item.fornecedorCliente) {
      if (!item.fornecedorCliente.toLowerCase().includes(filtroDescricao.toLowerCase())) return false
    } else if (filtroDescricao && !item.fornecedorCliente) {
      return false
    }

    // Filtro por banco
    if (filtroBancoId && item.bancoId !== parseInt(filtroBancoId)) return false

    return true
  })

  // Filtrar contas pendentes por período
  // Uma conta pendente aparece se a data de vencimento está no período selecionado
  const contasPendentesFiltradas = contasPendentes.filter(conta => {
    if (!dataInicio && !dataFim) return true // Sem filtro de data, mostra todas

    const dataVencimentoStr = normalizarData(conta.vencimento)

    // Verifica se vencimento está no período
    const vencimentoNoPeriodo =
      (!dataInicio || dataVencimentoStr >= dataInicio) &&
      (!dataFim || dataVencimentoStr <= dataFim)

    return vencimentoNoPeriodo
  })

  // Funções de filtro rápido
  function getDataFormatada(date) {
    // Usa data local (não UTC) para evitar problemas de timezone
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

  // Limpar filtros
  function limparFiltros() {
    setDataInicio("")
    setDataFim("")
    setFiltroAtivo("todos")
    setFiltroCodigo("")
    setFiltroDescricao("")
    setFiltroBancoId("")
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

  const temFiltro = dataInicio || dataFim || filtroCodigo || filtroDescricao || filtroBancoId

  // Calcular saldo do período filtrado (entradas - saídas)
  const saldoPeriodo = fluxoFiltrado.reduce((acc, item) => {
    if (item.tipo === 'entrada') {
      return acc + Number(item.valor)
    } else {
      return acc - Number(item.valor)
    }
  }, 0)

  // Calcular totais de entradas e saídas do período
  const totalEntradasPeriodo = fluxoFiltrado
    .filter(item => item.tipo === 'entrada')
    .reduce((acc, item) => acc + Number(item.valor), 0)

  const totalSaidasPeriodo = fluxoFiltrado
    .filter(item => item.tipo === 'saida')
    .reduce((acc, item) => acc + Number(item.valor), 0)

  // Calcular saldo por banco (saldo inicial + movimentações)
  const saldosPorBanco = bancos.reduce((acc, banco) => {
    const saldoInicial = Number(banco.saldoInicial) || 0
    const movimentacoesBanco = fluxoCaixa.filter(item => item.bancoId === banco.id)
    const saldoMovimentacoes = movimentacoesBanco.reduce((total, item) => {
      if (item.tipo === 'entrada') {
        return total + Number(item.valor)
      } else {
        return total - Number(item.valor)
      }
    }, 0)
    acc[banco.id] = saldoInicial + saldoMovimentacoes
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <PageHeader
        title="Fluxo de Caixa"
        description="Gestao de movimentacao financeira"
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("fluxo")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "fluxo"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <TrendingUp className="h-4 w-4 inline mr-2" />
          Movimentacoes
        </button>
        <button
          onClick={() => setActiveTab("bancos")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "bancos"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 className="h-4 w-4 inline mr-2" />
          Bancos
        </button>
        <button
          onClick={() => setActiveTab("cartoes")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "cartoes"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <CreditCard className="h-4 w-4 inline mr-2" />
          Cartoes
        </button>
      </div>

      {activeTab === "fluxo" && (
        <>
          {/* KPI - Saldo + Filtros de Data */}
          <Card className="p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                {/* Saldo Principal */}
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground mb-1">
                    {temFiltro ? "Saldo do Periodo" : "Saldo Atual"}
                  </p>
                  <p className={`text-2xl sm:text-3xl font-bold truncate ${temFiltro && saldoPeriodo < 0 ? 'text-red-600' : temFiltro && saldoPeriodo > 0 ? 'text-emerald-600' : 'text-foreground'}`}>
                    {formatCurrency(temFiltro ? saldoPeriodo : saldoAtual)}
                  </p>
                </div>

                {/* Entradas e Saídas do Período (só mostra com filtro) */}
                {temFiltro && (
                  <>
                    <div className="border-l border-border pl-4 sm:pl-6 min-w-0">
                      <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-emerald-600 shrink-0" />
                        Entradas
                      </p>
                      <p className="text-lg sm:text-xl font-semibold text-emerald-600 truncate">
                        {formatCurrency(totalEntradasPeriodo)}
                      </p>
                    </div>
                    <div className="border-l border-border pl-4 sm:pl-6 min-w-0">
                      <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                        <TrendingDown className="h-3 w-3 text-red-600 shrink-0" />
                        Saidas
                      </p>
                      <p className="text-lg sm:text-xl font-semibold text-red-600 truncate">
                        {formatCurrency(totalSaidasPeriodo)}
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3 flex-wrap shrink-0">
                {/* Filtros Rápidos */}
                <div className="flex items-center gap-1 lg:border-r border-border lg:pr-3">
                  <Button
                    variant={filtroAtivo === "todos" ? "default" : "ghost"}
                    size="sm"
                    onClick={limparFiltros}
                    className="h-8 text-xs px-2 sm:px-3"
                  >
                    Todos
                  </Button>
                  <Button
                    variant={filtroAtivo === "hoje" ? "default" : "ghost"}
                    size="sm"
                    onClick={filtrarHoje}
                    className="h-8 text-xs px-2 sm:px-3"
                  >
                    Hoje
                  </Button>
                  <Button
                    variant={filtroAtivo === "amanha" ? "default" : "ghost"}
                    size="sm"
                    onClick={filtrarAmanha}
                    className="h-8 text-xs px-2 sm:px-3"
                  >
                    Amanha
                  </Button>
                  <Button
                    variant={filtroAtivo === "semana" ? "default" : "ghost"}
                    size="sm"
                    onClick={filtrarSemana}
                    className="h-8 text-xs px-2 sm:px-3"
                  >
                    7 dias
                  </Button>
                </div>

                {/* Filtro Personalizado */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => handleDataInicioChange(e.target.value)}
                    className="h-8 w-32 sm:w-36 text-xs"
                  />
                  <span className="text-muted-foreground text-xs">ate</span>
                  <Input
                    type="date"
                    value={dataFim}
                    onChange={(e) => handleDataFimChange(e.target.value)}
                    className="h-8 w-32 sm:w-36 text-xs"
                  />
                </div>

                {/* Botao Filtros Avancados */}
                <Button
                  variant={showFiltrosAvancados ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowFiltrosAvancados(!showFiltrosAvancados)}
                  className="h-8 text-xs px-3"
                >
                  <Filter className="h-3 w-3 mr-1" />
                  Filtros
                  {(filtroCodigo || filtroDescricao || filtroBancoId) && (
                    <span className="ml-1 bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                      {[filtroCodigo, filtroDescricao, filtroBancoId].filter(Boolean).length}
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* Filtros Avancados */}
            {showFiltrosAvancados && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Codigo</label>
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <Input
                        placeholder="Ex: DEP-01"
                        value={filtroCodigo}
                        onChange={(e) => setFiltroCodigo(e.target.value)}
                        className="h-8 w-32 pl-7 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Descricao</label>
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <Input
                        placeholder="Ex: Fornecedor XYZ"
                        value={filtroDescricao}
                        onChange={(e) => setFiltroDescricao(e.target.value)}
                        className="h-8 w-44 pl-7 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Banco</label>
                    <select
                      value={filtroBancoId}
                      onChange={(e) => setFiltroBancoId(e.target.value)}
                      className="h-8 px-2 rounded-md border border-border bg-white text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-w-[140px]"
                    >
                      <option value="">Todos os bancos</option>
                      {bancos.map((banco) => (
                        <option key={banco.id} value={banco.id}>
                          {banco.codigo} - {banco.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(filtroCodigo || filtroDescricao || filtroBancoId) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFiltroCodigo("")
                        setFiltroDescricao("")
                        setFiltroBancoId("")
                      }}
                      className="h-8 text-xs text-red-600 hover:text-red-600"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Limpar filtros
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Card de Saldos Bancários */}
          {bancos.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Saldos Bancarios</h3>
                </div>
                <span className="text-xs text-muted-foreground">
                  Total: {formatCurrency(Object.values(saldosPorBanco).reduce((a, b) => a + b, 0))}
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {bancos.map((banco) => {
                  const saldo = saldosPorBanco[banco.id] || 0
                  return (
                    <div
                      key={banco.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border bg-muted/30 min-w-[180px]"
                    >
                      <div className={`p-1.5 rounded-full ${saldo >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                        <Building2 className={`h-3.5 w-3.5 ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground truncate">{banco.codigo} - {banco.nome}</p>
                        <p className={`text-sm font-bold ${saldo < 0 ? 'text-red-600' : saldo > 0 ? 'text-emerald-600' : 'text-foreground'}`}>
                          {formatCurrency(saldo)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Botão de Ação */}
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowTipoSelector(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Movimentacao
            </Button>
          </div>

          {/* Tabela Unificada - Fluxo de Caixa + Contas Pendentes */}
          <Card className="overflow-visible">
            <div className="overflow-x-auto overflow-y-visible">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="py-3 px-4 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-12">
                      Status
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Dia
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Cod Tipo
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Fornecedor/Cliente
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Descrição
                    </th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Fluxo
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Banco
                    </th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-16">
                      Acoes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Contas Pendentes primeiro (filtradas pelo período) */}
                  {contasPendentesFiltradas.map((conta) => {
                    const vencido = new Date(conta.vencimento) < new Date()
                    return (
                      <tr
                        key={`pendente-${conta.id}`}
                        className="border-b border-border hover:bg-yellow-50/50 transition-colors bg-yellow-50/30"
                      >
                        <td className="py-3 px-4 text-center">
                          <div className={`p-1.5 rounded-full border-2 inline-block ${
                            vencido
                              ? 'border-red-300 bg-red-50'
                              : 'border-yellow-300 bg-yellow-50'
                          }`}>
                            <Clock className={`h-4 w-4 ${vencido ? 'text-red-500' : 'text-yellow-500'}`} />
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground whitespace-nowrap">
                          {formatDate(new Date(conta.vencimento))}
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground">
                          {conta.codigoTipo || "-"}
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground">
                          {conta.beneficiario || conta.pessoa?.nome || "-"}
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground">
                          {conta.descricao || "-"}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-right">
                          <span className={conta.tipo === 'receber' ? 'text-emerald-600' : 'text-red-600'}>
                            {conta.tipo === 'receber' ? '+' : '-'} {formatCurrency(conta.valor)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground text-right">
                          -
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          -
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => abrirSeletorBanco(conta)}
                            className={`text-xs h-7 px-2 ${vencido ? 'border-red-300 text-red-600 hover:bg-red-50' : 'border-yellow-400 text-yellow-700 hover:bg-yellow-50'}`}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {conta.tipo === "pagar" ? "Pagar" : "Receber"}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}

                  {/* Movimentações já realizadas */}
                  {fluxoFiltrado.length === 0 && contasPendentesFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-8 text-center text-sm text-muted-foreground">
                        {temFiltro ? "Nenhuma movimentacao no periodo selecionado" : "Nenhuma movimentacao registrada"}
                      </td>
                    </tr>
                  ) : (
                    fluxoFiltrado.map((item) => (
                    <tr
                      key={item.id}
                      className={`border-b border-border hover:bg-muted/50 transition-colors cursor-pointer ${
                        selectedRow === item.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedRow(item.id)}
                    >
                      <td className="py-3 px-4 text-center">
                        <div className="p-1.5 rounded-full border-2 border-green-300 bg-green-50 inline-block">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground whitespace-nowrap">
                        {formatDate(new Date(item.dia))}
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">
                        {item.codigoTipo}
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">
                        {item.fornecedorCliente}
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">
                        {item.conta?.descricao || "-"}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-right">
                        <span className={item.tipo === 'entrada' ? 'text-emerald-600' : 'text-red-600'}>
                          {item.tipo === 'entrada' ? '+' : '-'} {formatCurrency(item.valor)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-foreground text-right">
                        {formatCurrency(item.fluxo)}
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const rect = e.currentTarget.getBoundingClientRect()
                            setDropdownPosition({
                              top: rect.bottom + 4,
                              left: rect.left
                            })
                            if (openBancoDropdown !== item.id) {
                              fetchBancos()
                            }
                            setOpenBancoDropdown(openBancoDropdown === item.id ? null : item.id)
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-muted border border-border transition-colors min-w-[100px]"
                        >
                          {item.banco ? (
                            <span title={`${item.banco.codigo} | Ag: ${item.banco.agencia} | Conta: ${item.banco.conta}`}>
                              {item.banco.nome}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Selecionar</span>
                          )}
                          <ChevronDown className="h-3 w-3 text-muted-foreground ml-auto" />
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Botão Editar - apenas para lançamentos com conta vinculada */}
                          {item.contaId && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditMovimentacao(item)
                              }}
                              className="text-muted-foreground hover:text-primary transition-colors"
                              title="Editar lançamento"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {/* Botão Excluir */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteMovimentacao(item.id, item.contaId)
                            }}
                            className="text-muted-foreground hover:text-red-600 transition-colors"
                            title={item.contaId ? "Excluir e reverter para pendente" : "Excluir movimentação"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {activeTab === "bancos" && (
        <>
          {/* Header Bancos */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Cadastre suas contas bancarias para selecionar ao marcar pagamentos</p>
            <Button size="sm" onClick={openNewBancoModal}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Banco
            </Button>
          </div>

          {/* Tabela de Bancos */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      N Banco
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Agencia
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Conta
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Chave Pix
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Saldo
                    </th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Acoes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loadingBancos ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-sm text-muted-foreground">
                        Carregando...
                      </td>
                    </tr>
                  ) : bancos.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-sm text-muted-foreground">
                        Nenhum banco cadastrado
                      </td>
                    </tr>
                  ) : (
                    bancos.map((banco) => (
                      <tr
                        key={banco.id}
                        className="border-b border-border hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm text-foreground">
                          <span className="font-medium">{banco.codigo}</span>
                          <span className="text-muted-foreground ml-2">({banco.nome})</span>
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground">
                          {banco.agencia}
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground">
                          {banco.conta}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {banco.chavePix ? (
                            <div className="flex items-center gap-2">
                              <span className="text-blue-600 hover:underline cursor-pointer" onClick={() => copyToClipboard(banco.chavePix)}>
                                {banco.chavePix}
                              </span>
                              <button
                                onClick={() => copyToClipboard(banco.chavePix)}
                                className="text-muted-foreground hover:text-foreground"
                                title="Copiar"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground capitalize">
                          {banco.tipoChavePix || "-"}
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-right">
                          <span className={saldosPorBanco[banco.id] < 0 ? 'text-red-600' : saldosPorBanco[banco.id] > 0 ? 'text-emerald-600' : 'text-foreground'}>
                            {formatCurrency(saldosPorBanco[banco.id] || 0)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditBancoModal(banco)}
                              className="text-muted-foreground hover:text-foreground"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteBanco(banco.id)}
                              className="text-muted-foreground hover:text-red-600"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {activeTab === "cartoes" && (
        <>
          {/* KPIs dos Cartões */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Wallet className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Limite Total</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(limiteTotal)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Limite Utilizado</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(limiteUtilizado)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <CreditCard className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Limite Disponivel</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(limiteDisponivel)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Uso do Limite</p>
                  <p className="text-lg font-bold text-foreground">{percentUtilizado.toFixed(1)}%</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Header Cartões */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Gerencie seus cartoes de credito e faturas</p>
            <Button size="sm" onClick={() => setShowNovoCartaoModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Cartao
            </Button>
          </div>

          {/* Lista de Cartões */}
          {loadingCartoes ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : cartoes.length === 0 ? (
            <Card className="p-12 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Nenhum cartao cadastrado</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Adicione seu primeiro cartao de credito para comecar a controlar suas faturas.
              </p>
              <Button onClick={() => setShowNovoCartaoModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Cartao
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cartoes.map((cartao) => (
                <CartaoCard
                  key={cartao.id}
                  cartao={cartao}
                  onEdit={() => handleEditarCartao(cartao)}
                  onDelete={() => handleExcluirCartao(cartao.id)}
                  onViewFaturas={() => handleVerFaturas(cartao)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Dropdown de seleção de banco - renderizado fora da tabela */}
      {openBancoDropdown !== null && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpenBancoDropdown(null)}
          />
          {/* Menu do dropdown */}
          <div
            ref={dropdownRef}
            className="fixed z-50 bg-white border border-border rounded-md shadow-lg py-1 min-w-[200px] max-h-[200px] overflow-y-auto"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left
            }}
          >
            {bancos.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Nenhum banco cadastrado
              </div>
            ) : (
              bancos.map((banco) => (
                <button
                  key={banco.id}
                  onClick={() => updateFluxoBanco(openBancoDropdown, banco.id)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center justify-between"
                >
                  <span>
                    <span className="font-medium">{banco.codigo}</span>
                    <span className="text-muted-foreground ml-2">- {banco.nome}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Ag: {banco.agencia}
                  </span>
                </button>
              ))
            )}
            {/* Opção para remover banco */}
            {fluxoCaixa.find(f => f.id === openBancoDropdown)?.banco && (
              <button
                onClick={() => updateFluxoBanco(openBancoDropdown, null)}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-border"
              >
                Remover banco
              </button>
            )}
          </div>
        </>
      )}

      {/* Modal Banco */}
      {showBancoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                {editingBanco ? "Editar Banco" : "Novo Banco"}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowBancoModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSaveBanco} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Codigo do Banco</label>
                  <Input
                    placeholder="237"
                    value={bancoForm.codigo}
                    onChange={(e) => setBancoForm({ ...bancoForm, codigo: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Nome do Banco</label>
                  <Input
                    placeholder="Bradesco"
                    value={bancoForm.nome}
                    onChange={(e) => setBancoForm({ ...bancoForm, nome: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Agencia</label>
                  <Input
                    placeholder="1692"
                    value={bancoForm.agencia}
                    onChange={(e) => setBancoForm({ ...bancoForm, agencia: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Conta</label>
                  <Input
                    placeholder="62419-1"
                    value={bancoForm.conta}
                    onChange={(e) => setBancoForm({ ...bancoForm, conta: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Chave Pix</label>
                <Input
                  placeholder="email@exemplo.com ou celular"
                  value={bancoForm.chavePix}
                  onChange={(e) => setBancoForm({ ...bancoForm, chavePix: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Tipo da Chave Pix</label>
                  <select
                    value={bancoForm.tipoChavePix}
                    onChange={(e) => setBancoForm({ ...bancoForm, tipoChavePix: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-border bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Selecione...</option>
                    <option value="celular">Celular</option>
                    <option value="email">E-mail</option>
                    <option value="cpf">CPF</option>
                    <option value="cnpj">CNPJ</option>
                    <option value="aleatoria">Chave Aleatoria</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Saldo Inicial</label>
                  <CurrencyInput
                    value={bancoForm.saldoInicial}
                    onValueChange={(val) => setBancoForm({ ...bancoForm, saldoInicial: val })}
                    placeholder="R$ 0,00"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowBancoModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  {editingBanco ? "Salvar" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal Selecao de Banco para Pagamento */}
      {showBancoSelector && contaParaPagar && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                {contaParaPagar.tipo === "pagar" ? "Confirmar Pagamento" : "Confirmar Recebimento"}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => {
                setShowBancoSelector(false)
                setContaParaPagar(null)
              }}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              {/* Resumo da conta */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Descricao:</span>
                  <span className="text-sm font-medium text-foreground">{contaParaPagar.descricao || contaParaPagar.beneficiario || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Valor:</span>
                  <span className="text-sm font-bold text-foreground">{formatCurrency(contaParaPagar.valor)}</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Em qual conta bancaria foi realizado o {contaParaPagar.tipo === "pagar" ? "pagamento" : "recebimento"}?
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {bancos.length === 0 ? (
                  <div className="text-center py-4">
                    <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhum banco cadastrado</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cadastre seus bancos na aba Bancos
                    </p>
                  </div>
                ) : (
                  bancos.map((banco) => {
                    const saldoBanco = saldosPorBanco[banco.id] || 0
                    return (
                      <button
                        key={banco.id}
                        onClick={() => setSelectedBancoId(banco.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedBancoId === banco.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">
                              {banco.codigo} - {banco.nome}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Ag: {banco.agencia} | Conta: {banco.conta}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Saldo</p>
                              <p className={`text-sm font-semibold ${saldoBanco < 0 ? 'text-red-600' : saldoBanco > 0 ? 'text-emerald-600' : 'text-foreground'}`}>
                                {formatCurrency(saldoBanco)}
                              </p>
                            </div>
                            {selectedBancoId === banco.id && (
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowBancoSelector(false)
                    setContaParaPagar(null)
                  }}
                  disabled={processandoPagamento}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={confirmarPagamento}
                  disabled={(bancos.length > 0 && !selectedBancoId) || processandoPagamento}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {processandoPagamento ? "Processando..." : "Confirmar"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

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
            <p className="text-sm text-muted-foreground mb-6">Escolha se deseja registrar uma saída ou entrada</p>
            <div className="grid gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex-col items-start hover:border-red-500 hover:bg-red-50"
                onClick={() => openMovimentacaoModal("saida")}
              >
                <div className="flex items-center gap-2 mb-1">
                  <ArrowDownCircle className="h-5 w-5 text-red-600" />
                  <span className="font-semibold">Saída</span>
                </div>
                <p className="text-xs text-muted-foreground">Despesas, pagamentos, saídas de caixa</p>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col items-start hover:border-emerald-500 hover:bg-emerald-50"
                onClick={() => openMovimentacaoModal("entrada")}
              >
                <div className="flex items-center gap-2 mb-1">
                  <ArrowUpCircle className="h-5 w-5 text-emerald-600" />
                  <span className="font-semibold">Entrada</span>
                </div>
                <p className="text-xs text-muted-foreground">Receitas, recebimentos, entradas de caixa</p>
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Nova Movimentação */}
      {showMovimentacaoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Nova Movimentacao</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowMovimentacaoModal(false)} disabled={savingMovimentacao}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSaveMovimentacao} className="p-4 space-y-4">
              {/* Indicador do tipo selecionado */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                {movimentacaoForm.tipo === "entrada" ? (
                  <>
                    <ArrowUpCircle className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-600">Entrada</span>
                  </>
                ) : (
                  <>
                    <ArrowDownCircle className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-medium text-red-600">Saída</span>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Data */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Data *</label>
                  <Input
                    type="date"
                    value={movimentacaoForm.dia}
                    onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, dia: e.target.value })}
                    required
                    disabled={savingMovimentacao}
                  />
                </div>

                {/* Valor */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Valor *</label>
                  <CurrencyInput
                    value={movimentacaoForm.valor}
                    onValueChange={(val) => setMovimentacaoForm({ ...movimentacaoForm, valor: val })}
                    required
                    disabled={savingMovimentacao}
                  />
                </div>
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Descrição</label>
                <Input
                  placeholder="Ex: Tarifa de manutenção, Taxa DOC, etc."
                  value={movimentacaoForm.descricao}
                  onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, descricao: e.target.value })}
                  disabled={savingMovimentacao}
                />
              </div>

              {/* Centro de Custo/Receita */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {movimentacaoForm.tipo === "entrada" ? "Centro de Receita" : "Centro de Custo"}
                </label>
                <select
                  value={movimentacaoForm.codigoTipo}
                  onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, codigoTipo: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-border bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={savingMovimentacao}
                >
                  <option value="">Selecione...</option>
                  {centros.map((centro) => (
                    <option
                      key={centro.id}
                      value={centro.sigla}
                      className={centro.level === 1 ? "pl-4" : "font-medium"}
                    >
                      {centro.level === 1 ? "  └ " : ""}{centro.sigla} - {centro.nome}{centro.isSocio ? " (Sócio)" : centro.level === 1 ? " (Sub)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Banco */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    Banco
                  </label>
                  <select
                    value={movimentacaoForm.bancoId}
                    onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, bancoId: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-border bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={savingMovimentacao}
                  >
                    <option value="">Selecione...</option>
                    {bancos.map((banco) => (
                      <option key={banco.id} value={banco.id}>
                        {banco.codigo} - {banco.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cartão de Crédito */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    Cartao de Credito
                  </label>
                  <select
                    value={movimentacaoForm.cartaoId}
                    onChange={(e) => setMovimentacaoForm({ ...movimentacaoForm, cartaoId: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-border bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={savingMovimentacao}
                  >
                    <option value="">Selecione...</option>
                    {cartoes.map((cartao) => (
                      <option key={cartao.id} value={cartao.id}>
                        {cartao.nome} (**** {cartao.ultimos4Digitos})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fornecedor/Cliente com dropdown */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {movimentacaoForm.tipo === "entrada" ? "Cliente" : "Fornecedor"}
                </label>
                <Popover open={openFornecedorPopover} onOpenChange={setOpenFornecedorPopover}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openFornecedorPopover}
                      className="w-full justify-between font-normal"
                      disabled={savingMovimentacao}
                      type="button"
                    >
                      {fornecedorSelecionado ? (
                        <span className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          {fornecedorSelecionado.nome}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          Selecione um {movimentacaoForm.tipo === "entrada" ? "cliente" : "fornecedor"}...
                        </span>
                      )}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <div className="p-2 border-b">
                      <Input
                        placeholder={`Buscar ${movimentacaoForm.tipo === "entrada" ? "cliente" : "fornecedor"}...`}
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
                          Nenhum {movimentacaoForm.tipo === "entrada" ? "cliente" : "fornecedor"} encontrado
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
                    {fornecedores.length > 0 && !searchFornecedor && !showCadastroInline && (
                      <div className="p-2 border-t text-xs text-center text-muted-foreground">
                        {fornecedores.length} {movimentacaoForm.tipo === "entrada" ? "cliente" : "fornecedor"}(s) cadastrado(s)
                      </div>
                    )}

                    {/* Botão para abrir cadastro inline */}
                    {!showCadastroInline && (
                      <div className="p-2 border-t">
                        <button
                          type="button"
                          onClick={() => {
                            setNovoNome(searchFornecedor)
                            setShowCadastroInline(true)
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-md text-left text-primary"
                        >
                          <UserPlus className="h-4 w-4" />
                          <span>Cadastrar novo {movimentacaoForm.tipo === "entrada" ? "cliente" : "fornecedor"}</span>
                        </button>
                      </div>
                    )}

                    {/* Mini formulário de cadastro inline - apenas nome */}
                    {showCadastroInline && (
                      <div className="p-3 border-t space-y-3 bg-muted/30">
                        <p className="text-xs font-medium text-muted-foreground">
                          Novo {movimentacaoForm.tipo === "entrada" ? "Cliente" : "Fornecedor"}
                        </p>
                        <Input
                          placeholder="Nome *"
                          value={novoNome}
                          onChange={(e) => setNovoNome(e.target.value)}
                          className="h-8 text-sm"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setShowCadastroInline(false)
                              setNovoNome("")
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="flex-1"
                            onClick={handleCadastrarNovo}
                            disabled={!novoNome.trim() || savingNovo}
                          >
                            {savingNovo ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Salvar"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowMovimentacaoModal(false)} disabled={savingMovimentacao}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={savingMovimentacao}>
                  {savingMovimentacao ? "Salvando..." : "Adicionar"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal Novo/Editar Cartão */}
      {showNovoCartaoModal && (
        <NovoCartaoModal
          cartao={cartaoParaEditar}
          onClose={() => {
            setShowNovoCartaoModal(false)
            setCartaoParaEditar(null)
          }}
          onSuccess={handleCartaoSuccess}
        />
      )}

      {/* Modal de Faturas do Cartão */}
      {cartaoParaFaturas && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Faturas - {cartaoParaFaturas.nome}
                </h2>
                <p className="text-sm text-muted-foreground">
                  **** {cartaoParaFaturas.ultimos4Digitos}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setCartaoParaFaturas(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              {loadingFaturas ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : faturas.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhuma fatura encontrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {faturas.map((fatura) => {
                    const meses = [
                      "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
                      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
                    ]
                    const mesNome = meses[fatura.mesReferencia - 1]

                    return (
                      <Card
                        key={fatura.id}
                        className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
                          fatura.pago ? "bg-green-50" : "bg-yellow-50"
                        }`}
                        onClick={() => setFaturaDetalhe(fatura)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-foreground">
                              {mesNome}/{fatura.anoReferencia}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              Vencimento: {new Date(fatura.dataVencimento).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-foreground">
                              {formatCurrency(fatura.valorTotal)}
                            </p>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              fatura.pago
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}>
                              {fatura.pago ? "Paga" : "Aberta"}
                            </span>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Modal Detalhe Fatura */}
      {faturaDetalhe && (
        <FaturaModal
          fatura={faturaDetalhe}
          onClose={() => setFaturaDetalhe(null)}
          onPago={() => {
            setFaturaDetalhe(null)
            if (cartaoParaFaturas) {
              loadFaturas(cartaoParaFaturas.id)
            }
            fetchCartoes()
          }}
        />
      )}

      {/* Modal Editar Lançamento Pago */}
      {showEditFluxoModal && fluxoToEdit && (
        <EditFluxoModal
          fluxo={fluxoToEdit}
          onClose={() => {
            setShowEditFluxoModal(false)
            setFluxoToEdit(null)
          }}
          onSuccess={async () => {
            setShowEditFluxoModal(false)
            setFluxoToEdit(null)
            // Recarregar dados
            const [fluxoRes, contasRes] = await Promise.all([
              fetch('/api/fluxo-caixa'),
              fetch('/api/contas?modo=individual')
            ])
            const fluxoData = await fluxoRes.json()
            const contasData = await contasRes.json()
            setFluxoCaixa(Array.isArray(fluxoData) ? fluxoData : [])
            setContasPendentes(Array.isArray(contasData) ? contasData.filter(c => !c.pago) : [])
          }}
        />
      )}
    </div>
  )
}

// Modal para editar lançamento já pago no fluxo de caixa
function EditFluxoModal({ fluxo, onClose, onSuccess }) {
  const [descricao, setDescricao] = useState(fluxo.conta?.descricao || "")
  const [valor, setValor] = useState(fluxo.valor || 0)
  const [dataPagamento, setDataPagamento] = useState(
    fluxo.dia ? new Date(fluxo.dia).toISOString().split('T')[0] : ""
  )
  const [fornecedorCliente, setFornecedorCliente] = useState(fluxo.fornecedorCliente || "")
  const [codigoTipo, setCodigoTipo] = useState(fluxo.codigoTipo || "")
  const [bancoId, setBancoId] = useState(fluxo.bancoId?.toString() || "")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  // Estados para centros e bancos
  const [centros, setCentros] = useState([])
  const [bancos, setBancos] = useState([])
  const [loadingCentros, setLoadingCentros] = useState(false)
  const [loadingBancos, setLoadingBancos] = useState(false)

  const tipo = fluxo.tipo === 'entrada' ? 'receber' : 'pagar'

  // Carregar centros e bancos (com hierarquia)
  useEffect(() => {
    const fetchData = async () => {
      setLoadingCentros(true)
      setLoadingBancos(true)
      try {
        const tipoCentro = tipo === 'pagar' ? 'despesa' : 'faturamento'
        const [centrosRes, bancosRes] = await Promise.all([
          fetch(`/api/centros?tipo=${tipoCentro}&hierarquico=true`),
          fetch('/api/bancos')
        ])
        const centrosData = await centrosRes.json()
        const bancosData = await bancosRes.json()
        setCentros(Array.isArray(centrosData) ? centrosData : [])
        setBancos(Array.isArray(bancosData) ? bancosData : [])
      } catch (err) {
        console.error("Erro ao carregar dados:", err)
      } finally {
        setLoadingCentros(false)
        setLoadingBancos(false)
      }
    }
    fetchData()
  }, [tipo])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!valor || valor <= 0) {
      setError("Valor deve ser maior que zero")
      return
    }

    if (!dataPagamento) {
      setError("Data de pagamento é obrigatória")
      return
    }

    setIsSaving(true)

    try {
      // Atualizar a conta vinculada
      if (fluxo.contaId) {
        const contaResponse = await fetch(`/api/contas/${fluxo.contaId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            descricao: descricao.trim(),
            valor: Number(valor),
            dataPagamento,
            beneficiario: fornecedorCliente.trim() || null,
            codigoTipo: codigoTipo.trim() || null,
          }),
        })

        if (!contaResponse.ok) {
          const errorData = await contaResponse.json()
          throw new Error(errorData.error || "Erro ao atualizar conta")
        }
      }

      // Atualizar o registro do fluxo de caixa
      const fluxoResponse = await fetch('/api/fluxo-caixa', {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: fluxo.id,
          bancoId: bancoId ? Number(bancoId) : null,
          fornecedorCliente: fornecedorCliente.trim() || null,
          codigoTipo: codigoTipo.trim() || null,
          valor: Number(valor),
          dia: dataPagamento,
        }),
      })

      if (!fluxoResponse.ok) {
        const errorData = await fluxoResponse.json()
        throw new Error(errorData.error || "Erro ao atualizar fluxo")
      }

      onSuccess()
    } catch (err) {
      setError(err.message || "Erro ao atualizar")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Editar Lançamento {tipo === 'pagar' ? 'Pago' : 'Recebido'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSaving}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {/* Descrição */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Descrição</label>
              <Input
                placeholder="Descrição do lançamento"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                disabled={isSaving}
              />
            </div>

            {/* Fornecedor/Cliente */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {tipo === 'pagar' ? 'Fornecedor' : 'Cliente'}
              </label>
              <Input
                placeholder={tipo === 'pagar' ? 'Nome do fornecedor' : 'Nome do cliente'}
                value={fornecedorCliente}
                onChange={(e) => setFornecedorCliente(e.target.value)}
                disabled={isSaving}
              />
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Valor</label>
              <CurrencyInput
                value={valor}
                onValueChange={setValor}
                disabled={isSaving}
              />
            </div>

            {/* Data de Pagamento */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Data do Pagamento</label>
              <Input
                type="date"
                value={dataPagamento}
                onChange={(e) => setDataPagamento(e.target.value)}
                disabled={isSaving}
              />
            </div>

            {/* Centro de Custo */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Centro de {tipo === 'pagar' ? 'Custo' : 'Receita'}
              </label>
              <select
                value={codigoTipo}
                onChange={(e) => setCodigoTipo(e.target.value)}
                disabled={isSaving || loadingCentros}
                className="w-full h-10 px-3 rounded-md border border-border bg-white text-sm"
              >
                <option value="">{loadingCentros ? 'Carregando...' : 'Selecione...'}</option>
                {centros.map((centro) => (
                  <option key={centro.id} value={centro.sigla}>
                    {centro.level === 1 ? "  └ " : ""}{centro.sigla} - {centro.nome}{centro.isSocio ? " (Sócio)" : centro.level === 1 ? " (Sub)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Banco */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Banco</label>
              <select
                value={bancoId}
                onChange={(e) => setBancoId(e.target.value)}
                disabled={isSaving || loadingBancos}
                className="w-full h-10 px-3 rounded-md border border-border bg-white text-sm"
              >
                <option value="">{loadingBancos ? 'Carregando...' : 'Selecione...'}</option>
                {bancos.map((banco) => (
                  <option key={banco.id} value={banco.id}>
                    {banco.nome} - Ag: {banco.agencia} / Cc: {banco.conta}
                  </option>
                ))}
              </select>
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
