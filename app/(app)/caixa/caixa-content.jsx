"use client"

import { useState, useEffect, useRef } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency, formatDate } from "@/lib/format"
import { CurrencyInput } from "@/components/ui/currency-input"
import { TrendingUp, TrendingDown, Building2, Plus, X, Trash2, Edit, Copy, ChevronDown, Calendar, Clock, CheckCircle2, ArrowDownCircle, ArrowUpCircle, Filter, Search, CreditCard, Wallet, Loader2, Eye, Truck, Check, UserPlus, Circle, RotateCcw } from "lucide-react"
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

  // Estados para filtro de data - com persistência no localStorage
  const [dataInicio, setDataInicioState] = useState("")
  const [dataFim, setDataFimState] = useState("")
  const [filtroAtivo, setFiltroAtivoState] = useState("todos") // todos, hoje, amanha, personalizado

  // Carregar filtros do localStorage na inicialização
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDataInicio = localStorage.getItem('filtro_caixa_dataInicio')
      const savedDataFim = localStorage.getItem('filtro_caixa_dataFim')
      const savedFiltroAtivo = localStorage.getItem('filtro_caixa_filtroAtivo')

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
        localStorage.setItem('filtro_caixa_dataInicio', value)
      } else {
        localStorage.removeItem('filtro_caixa_dataInicio')
      }
    }
  }

  const setDataFim = (value) => {
    setDataFimState(value)
    if (typeof window !== 'undefined') {
      if (value) {
        localStorage.setItem('filtro_caixa_dataFim', value)
      } else {
        localStorage.removeItem('filtro_caixa_dataFim')
      }
    }
  }

  const setFiltroAtivo = (value) => {
    setFiltroAtivoState(value)
    if (typeof window !== 'undefined') {
      localStorage.setItem('filtro_caixa_filtroAtivo', value)
    }
  }

  // Estados para filtros avancados (arrays para seleção múltipla)
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroCodigos, setFiltroCodigos] = useState([])
  const [filtroDescricoes, setFiltroDescricoes] = useState([])
  const [filtroBancoIds, setFiltroBancoIds] = useState([])
  const [filtroTipoFluxo, setFiltroTipoFluxo] = useState([]) // ["entrada", "saida"]
  const [filtroStatus, setFiltroStatus] = useState([]) // ["em_dia", "atencao", "atrasado", "pago", "cancelado"]
  const [filtroValores, setFiltroValores] = useState([])
  const [showFiltrosAvancados, setShowFiltrosAvancados] = useState(false)

  // Estados para opções de filtros automáticos
  const [centrosFiltro, setCentrosFiltro] = useState([])
  const [fornecedoresFiltro, setFornecedoresFiltro] = useState([])
  const [valoresUnicos, setValoresUnicos] = useState([])

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

  // Função para calcular o status real de uma conta baseado em vencimento
  const getContaStatus = (conta) => {
    if (!conta) return 'pago' // Lançamento direto sem conta vinculada

    const hoje = new Date()
    const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`

    // Normalizar data de vencimento
    const vencimentoDate = new Date(conta.vencimento)
    const vencimentoStr = `${vencimentoDate.getFullYear()}-${String(vencimentoDate.getMonth() + 1).padStart(2, '0')}-${String(vencimentoDate.getDate()).padStart(2, '0')}`

    // Prioridade: cancelado > pago > atrasado > atencao > em_dia
    if (conta.status === "cancelado") return "cancelado"
    if (conta.pago) return "pago"
    if (vencimentoStr < hojeStr) return "atrasado" // Vencido = Atrasado
    if (vencimentoStr === hojeStr) return "atencao" // Vence hoje = Atenção
    return "em_dia" // Vence no futuro = Em dia
  }

  // Estados para cartões de crédito
  const [cartoes, setCartoes] = useState([])
  const [loadingCartoes, setLoadingCartoes] = useState(false)
  const [showNovoCartaoModal, setShowNovoCartaoModal] = useState(false)
  const [cartaoParaEditar, setCartaoParaEditar] = useState(null)
  const [cartaoParaFaturas, setCartaoParaFaturas] = useState(null)
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
  const [dataPagamentoSelecionada, setDataPagamentoSelecionada] = useState(new Date().toISOString().split('T')[0])
  const [valorPago, setValorPago] = useState(0)

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

  // Carregar centros de custo e fornecedores para os filtros
  useEffect(() => {
    async function fetchDadosFiltros() {
      try {
        // Buscar todos os centros de custo (para ambos os tipos)
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

  // Extrair valores únicos do fluxoCaixa para o filtro de valor
  useEffect(() => {
    if (fluxoCaixa.length > 0) {
      const valores = [...new Set(fluxoCaixa.map(item => Math.abs(item.valor)))]
        .sort((a, b) => a - b)
      setValoresUnicos(valores)
    }
  }, [fluxoCaixa])

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
    setDataPagamentoSelecionada(new Date().toISOString().split('T')[0])
    setValorPago(conta.valor) // Inicializa com valor original
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
          dataPagamento: dataPagamentoSelecionada,
          bancoId: selectedBancoId,
          valorPago: valorPago
        }),
      })
      setShowBancoSelector(false)
      setContaParaPagar(null)
      setSelectedBancoId(null)
      setValorPago(0)
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
    const status = getContaStatus(conta)
    if (status === "atrasado") {
      return <Badge variant="destructive" className="bg-red-100 text-red-700">Atrasado</Badge>
    }
    if (status === "atencao") {
      return <Badge variant="warning" className="bg-yellow-100 text-yellow-700">Atenção</Badge>
    }
    return <Badge variant="outline" className="bg-gray-100 text-gray-700">Em dia</Badge>
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

    // Validação de campos obrigatórios
    if (!bancoForm.nome || !bancoForm.nome.trim()) {
      alert('Nome do banco é obrigatório')
      return
    }

    if (bancoForm.saldoInicial === undefined || bancoForm.saldoInicial === null || bancoForm.saldoInicial === '' || Number(bancoForm.saldoInicial) === 0) {
      alert('Saldo inicial é obrigatório e deve ser diferente de zero')
      return
    }

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

  async function handleToggleConciliacao(bancoId, estaConciliado) {
    try {
      await fetch('/api/bancos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bancoId, conciliar: !estaConciliado })
      })
      fetchBancos()
    } catch (error) {
      console.error('Erro ao atualizar conciliacao:', error)
      alert('Erro ao atualizar conciliacao')
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

  async function handleVerFaturas(cartao) {
    try {
      setLoadingFaturas(true)
      const res = await fetch(`/api/cartoes/${cartao.id}/faturas`)
      const data = await res.json()
      const faturasCarregadas = Array.isArray(data) ? data : []

      if (faturasCarregadas.length > 0) {
        // Abrir direto a fatura mais recente (primeira da lista)
        setCartaoParaFaturas(cartao)
        setFaturaDetalhe(faturasCarregadas[0])
      } else {
        alert("Nenhuma fatura encontrada para este cartão")
      }
    } catch (error) {
      console.error("Erro ao carregar faturas:", error)
      alert("Erro ao carregar faturas")
    } finally {
      setLoadingFaturas(false)
    }
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
      descricao: "",
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

  // Desfazer transação paga/recebida (reverte para pendente ao invés de excluir)
  async function handleDesfazerTransacao(id, contaId, tipo) {
    const acao = tipo === 'entrada' ? 'recebimento' : 'pagamento'
    const mensagem = contaId
      ? `Tem certeza que deseja desfazer este ${acao}?\n\nA conta será revertida para status PENDENTE e a movimentação será removida do fluxo de caixa.`
      : `Tem certeza que deseja excluir este lançamento direto?`

    if (!confirm(mensagem)) return

    try {
      const response = await fetch('/api/fluxo-caixa', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao desfazer transação')
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
      console.error('Erro ao desfazer transação:', error)
      alert(error.message || 'Erro ao desfazer transação')
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
    // Filtro por busca (searchTerm)
    if (searchTerm) {
      const termo = searchTerm.toLowerCase()
      const matchCodigo = item.codigoTipo?.toLowerCase().includes(termo)
      const matchFornecedor = item.fornecedorCliente?.toLowerCase().includes(termo)
      const matchDescricao = item.descricao?.toLowerCase().includes(termo)
      if (!matchCodigo && !matchFornecedor && !matchDescricao) return false
    }

    const dataItemStr = item.dia.split('T')[0] // Extrai apenas YYYY-MM-DD
    if (dataInicio && dataItemStr < dataInicio) return false
    if (dataFim && dataItemStr > dataFim) return false

    // Filtro por codigo (centro de custo) - seleção múltipla
    if (filtroCodigos.length > 0) {
      if (!item.codigoTipo || !filtroCodigos.includes(item.codigoTipo)) return false
    }

    // Filtro por fornecedor/cliente - seleção múltipla
    if (filtroDescricoes.length > 0) {
      if (!item.fornecedorCliente || !filtroDescricoes.includes(item.fornecedorCliente)) return false
    }

    // Filtro por banco - seleção múltipla
    if (filtroBancoIds.length > 0) {
      if (!item.bancoId || !filtroBancoIds.includes(String(item.bancoId))) return false
    }

    // Filtro por tipo (entrada/saida) - seleção múltipla
    if (filtroTipoFluxo.length > 0 && !filtroTipoFluxo.includes(item.tipo)) return false

    // Filtro por status - seleção múltipla
    if (filtroStatus.length > 0) {
      const statusItem = getContaStatus(item.conta)
      if (!filtroStatus.includes(statusItem)) return false
    }

    // Filtro por valor - seleção múltipla
    if (filtroValores.length > 0) {
      const valorItem = Math.abs(item.valor)
      if (!filtroValores.some(v => parseFloat(v) === valorItem)) return false
    }

    return true
  })

  // Filtrar contas pendentes - APLICA TODOS OS FILTROS igual ao fluxoFiltrado
  const contasPendentesFiltradas = contasPendentes.filter(conta => {
    // Filtro por busca (searchTerm)
    if (searchTerm) {
      const termo = searchTerm.toLowerCase()
      const matchCodigo = conta.codigoTipo?.toLowerCase().includes(termo)
      const matchBeneficiario = conta.beneficiario?.toLowerCase().includes(termo) || conta.pessoa?.nome?.toLowerCase().includes(termo)
      const matchDescricao = conta.descricao?.toLowerCase().includes(termo)
      if (!matchCodigo && !matchBeneficiario && !matchDescricao) return false
    }

    // Filtro por data (usa vencimento)
    const dataVencimentoStr = normalizarData(conta.vencimento)
    if (dataInicio && dataVencimentoStr < dataInicio) return false
    if (dataFim && dataVencimentoStr > dataFim) return false

    // Filtro por codigo (centro de custo) - seleção múltipla
    if (filtroCodigos.length > 0) {
      if (!conta.codigoTipo || !filtroCodigos.includes(conta.codigoTipo)) return false
    }

    // Filtro por fornecedor/cliente - seleção múltipla
    if (filtroDescricoes.length > 0) {
      const nomeConta = conta.beneficiario || conta.pessoa?.nome
      if (!nomeConta || !filtroDescricoes.includes(nomeConta)) return false
    }

    // Filtro por banco - contas pendentes não têm banco, então não aparecem se filtrar por banco
    if (filtroBancoIds.length > 0) return false

    // Filtro por tipo (entrada/saida) - seleção múltipla
    if (filtroTipoFluxo.length > 0) {
      const tipoEquivalente = conta.tipo === 'receber' ? 'entrada' : 'saida'
      if (!filtroTipoFluxo.includes(tipoEquivalente)) return false
    }

    // Filtro por status - seleção múltipla
    if (filtroStatus.length > 0) {
      const statusConta = getContaStatus(conta)
      if (!filtroStatus.includes(statusConta)) return false
    }

    // Filtro por valor - seleção múltipla
    if (filtroValores.length > 0) {
      const valorConta = Math.abs(conta.valor)
      if (!filtroValores.some(v => parseFloat(v) === valorConta)) return false
    }

    return true
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
    setSearchTerm("")
    setDataInicio("")
    setDataFim("")
    setFiltroAtivo("todos")
    setFiltroCodigos([])
    setFiltroDescricoes([])
    setFiltroBancoIds([])
    setFiltroTipoFluxo([])
    setFiltroStatus([])
    setFiltroValores([])
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

  // Helper para toggle de seleção múltipla
  const toggleFiltroMultiplo = (array, setArray, value) => {
    if (array.includes(value)) {
      setArray(array.filter(v => v !== value))
    } else {
      setArray([...array, value])
    }
  }

  const temFiltro = searchTerm || dataInicio || dataFim || filtroCodigos.length > 0 || filtroDescricoes.length > 0 || filtroBancoIds.length > 0 || filtroTipoFluxo.length > 0 || filtroStatus.length > 0 || filtroValores.length > 0

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
                {/* Barra de Pesquisa */}
                <div className="relative min-w-[180px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-8 text-xs"
                  />
                </div>

                {/* Filtros Rápidos */}
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                  <Button
                    variant={filtroAtivo === "todos" ? "default" : "ghost"}
                    size="sm"
                    onClick={limparFiltros}
                    className="h-7 text-xs px-2 sm:px-3"
                  >
                    Todos
                  </Button>
                  <Button
                    variant={filtroAtivo === "hoje" ? "default" : "ghost"}
                    size="sm"
                    onClick={filtrarHoje}
                    className="h-7 text-xs px-2 sm:px-3"
                  >
                    Hoje
                  </Button>
                  <Button
                    variant={filtroAtivo === "amanha" ? "default" : "ghost"}
                    size="sm"
                    onClick={filtrarAmanha}
                    className="h-7 text-xs px-2 sm:px-3"
                  >
                    Amanhã
                  </Button>
                  <Button
                    variant={filtroAtivo === "semana" ? "default" : "ghost"}
                    size="sm"
                    onClick={filtrarSemana}
                    className="h-7 text-xs px-2 sm:px-3"
                  >
                    7 dias
                  </Button>
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
                  {(() => {
                    const count = (dataInicio ? 1 : 0) + (dataFim ? 1 : 0) + filtroCodigos.length + filtroDescricoes.length + filtroBancoIds.length + filtroTipoFluxo.length + filtroStatus.length + filtroValores.length
                    return count > 0 ? (
                      <span className="ml-1 bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                        {count}
                      </span>
                    ) : null
                  })()}
                </Button>

                {temFiltro && (
                  <Button variant="ghost" size="sm" onClick={limparFiltros} className="h-8 text-xs text-destructive hover:text-destructive">
                    <X className="h-3 w-3 mr-1" />
                    Limpar
                  </Button>
                )}
              </div>
            </div>

            {/* Filtros Avancados */}
            {showFiltrosAvancados && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                  {/* Tipo - Seleção Múltipla */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full h-8 justify-between text-xs font-normal">
                          <span className="truncate">
                            {filtroTipoFluxo.length === 0 ? "Todos" :
                             filtroTipoFluxo.length === 1 ? (filtroTipoFluxo[0] === "entrada" ? "Entradas" : "Saídas") :
                             `${filtroTipoFluxo.length} selecionados`}
                          </span>
                          <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-2" align="start">
                        <div className="space-y-1">
                          <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filtroTipoFluxo.includes("entrada")}
                              onChange={() => toggleFiltroMultiplo(filtroTipoFluxo, setFiltroTipoFluxo, "entrada")}
                              className="rounded border-border"
                            />
                            <span className="text-sm">Entradas</span>
                          </label>
                          <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filtroTipoFluxo.includes("saida")}
                              onChange={() => toggleFiltroMultiplo(filtroTipoFluxo, setFiltroTipoFluxo, "saida")}
                              className="rounded border-border"
                            />
                            <span className="text-sm">Saídas</span>
                          </label>
                          {filtroTipoFluxo.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={() => setFiltroTipoFluxo([])} className="w-full mt-1 h-7 text-xs text-muted-foreground">
                              Limpar seleção
                            </Button>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Status - Seleção Múltipla */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Status</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full h-8 justify-between text-xs font-normal">
                          <span className="truncate">
                            {filtroStatus.length === 0 ? "Todos" :
                             filtroStatus.length === 1 ?
                               (filtroStatus[0] === "em_dia" ? "Em dia" :
                                filtroStatus[0] === "atencao" ? "Atenção" :
                                filtroStatus[0] === "atrasado" ? "Atrasado" :
                                filtroStatus[0] === "pago" ? "Pago" : "Cancelado") :
                             `${filtroStatus.length} selecionados`}
                          </span>
                          <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-2" align="start">
                        <div className="space-y-1">
                          {[
                            { value: "em_dia", label: "Em dia" },
                            { value: "atencao", label: "Atenção" },
                            { value: "atrasado", label: "Atrasado" },
                            { value: "pago", label: "Pago" },
                            { value: "cancelado", label: "Cancelado" }
                          ].map(status => (
                            <label key={status.value} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer">
                              <input
                                type="checkbox"
                                checked={filtroStatus.includes(status.value)}
                                onChange={() => toggleFiltroMultiplo(filtroStatus, setFiltroStatus, status.value)}
                                className="rounded border-border"
                              />
                              <span className="text-sm">{status.label}</span>
                            </label>
                          ))}
                          {filtroStatus.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={() => setFiltroStatus([])} className="w-full mt-1 h-7 text-xs text-muted-foreground">
                              Limpar seleção
                            </Button>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Data De */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Data De</label>
                    <Input
                      type="date"
                      value={dataInicio}
                      onChange={(e) => handleDataInicioChange(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>

                  {/* Data Até */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Data Até</label>
                    <Input
                      type="date"
                      value={dataFim}
                      onChange={(e) => handleDataFimChange(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>

                  {/* Codigo (Centro de Custo) - Seleção Múltipla */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Cód Tipo</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full h-8 justify-between text-xs font-normal">
                          <span className="truncate">
                            {filtroCodigos.length === 0 ? "Todos" :
                             filtroCodigos.length === 1 ? filtroCodigos[0] :
                             `${filtroCodigos.length} selecionados`}
                          </span>
                          <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2" align="start">
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {centrosFiltro.map((centro) => (
                            <label key={centro.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer">
                              <input
                                type="checkbox"
                                checked={filtroCodigos.includes(centro.sigla)}
                                onChange={() => toggleFiltroMultiplo(filtroCodigos, setFiltroCodigos, centro.sigla)}
                                className="rounded border-border"
                              />
                              <span className="text-sm truncate">{centro.sigla} - {centro.nome}</span>
                            </label>
                          ))}
                          {filtroCodigos.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={() => setFiltroCodigos([])} className="w-full mt-1 h-7 text-xs text-muted-foreground">
                              Limpar seleção
                            </Button>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Fornecedor/Cliente - Seleção Múltipla */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Fornecedor/Cliente</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full h-8 justify-between text-xs font-normal">
                          <span className="truncate">
                            {filtroDescricoes.length === 0 ? "Todos" :
                             filtroDescricoes.length === 1 ? filtroDescricoes[0] :
                             `${filtroDescricoes.length} selecionados`}
                          </span>
                          <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2" align="start">
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {fornecedoresFiltro.map((pessoa) => (
                            <label key={pessoa.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer">
                              <input
                                type="checkbox"
                                checked={filtroDescricoes.includes(pessoa.nome)}
                                onChange={() => toggleFiltroMultiplo(filtroDescricoes, setFiltroDescricoes, pessoa.nome)}
                                className="rounded border-border"
                              />
                              <span className="text-sm truncate">{pessoa.nome}</span>
                            </label>
                          ))}
                          {filtroDescricoes.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={() => setFiltroDescricoes([])} className="w-full mt-1 h-7 text-xs text-muted-foreground">
                              Limpar seleção
                            </Button>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Banco - Seleção Múltipla */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Banco</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full h-8 justify-between text-xs font-normal">
                          <span className="truncate">
                            {filtroBancoIds.length === 0 ? "Todos" :
                             filtroBancoIds.length === 1 ? bancos.find(b => String(b.id) === filtroBancoIds[0])?.nome || filtroBancoIds[0] :
                             `${filtroBancoIds.length} selecionados`}
                          </span>
                          <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2" align="start">
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {bancos.map((banco) => (
                            <label key={banco.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer">
                              <input
                                type="checkbox"
                                checked={filtroBancoIds.includes(String(banco.id))}
                                onChange={() => toggleFiltroMultiplo(filtroBancoIds, setFiltroBancoIds, String(banco.id))}
                                className="rounded border-border"
                              />
                              <span className="text-sm truncate">{banco.nome}</span>
                            </label>
                          ))}
                          {filtroBancoIds.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={() => setFiltroBancoIds([])} className="w-full mt-1 h-7 text-xs text-muted-foreground">
                              Limpar seleção
                            </Button>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Valor - Seleção Múltipla */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Valor</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full h-8 justify-between text-xs font-normal">
                          <span className="truncate">
                            {filtroValores.length === 0 ? "Todos" :
                             filtroValores.length === 1 ? formatCurrency(parseFloat(filtroValores[0])) :
                             `${filtroValores.length} selecionados`}
                          </span>
                          <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-2" align="start">
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {valoresUnicos.map((valor) => (
                            <label key={valor} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer">
                              <input
                                type="checkbox"
                                checked={filtroValores.includes(String(valor))}
                                onChange={() => toggleFiltroMultiplo(filtroValores, setFiltroValores, String(valor))}
                                className="rounded border-border"
                              />
                              <span className="text-sm">{formatCurrency(valor)}</span>
                            </label>
                          ))}
                          {filtroValores.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={() => setFiltroValores([])} className="w-full mt-1 h-7 text-xs text-muted-foreground">
                              Limpar seleção
                            </Button>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Botão Limpar Tudo */}
                  <div className="space-y-1.5 flex items-end">
                    {(filtroCodigos.length > 0 || filtroDescricoes.length > 0 || filtroBancoIds.length > 0 || filtroTipoFluxo.length > 0 || filtroStatus.length > 0 || filtroValores.length > 0) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFiltroCodigos([])
                          setFiltroDescricoes([])
                          setFiltroBancoIds([])
                          setFiltroTipoFluxo([])
                          setFiltroStatus([])
                          setFiltroValores([])
                        }}
                        className="h-8 text-xs text-destructive hover:text-destructive"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Limpar
                      </Button>
                    )}
                  </div>
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
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg border min-w-[180px] ${banco.conciliadoEm ? 'bg-amber-100 border-amber-300' : 'bg-muted/30 border-border'}`}
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
                      <button
                        onClick={() => handleToggleConciliacao(banco.id, !!banco.conciliadoEm)}
                        className="p-1 rounded hover:bg-muted transition-colors"
                        title={banco.conciliadoEm ? `Conciliado em ${formatDate(banco.conciliadoEm)}` : 'Marcar como conciliado'}
                      >
                        {banco.conciliadoEm ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
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
                    const statusConta = getContaStatus(conta)
                    const atrasado = statusConta === 'atrasado'
                    const atencao = statusConta === 'atencao'
                    return (
                      <tr
                        key={`pendente-${conta.id}`}
                        className={`border-b border-border transition-colors ${
                          atrasado
                            ? 'bg-red-50 hover:bg-red-100/80'
                            : atencao
                              ? 'bg-yellow-50 hover:bg-yellow-100/80'
                              : 'bg-gray-50 hover:bg-gray-100/80'
                        }`}
                      >
                        <td className="py-3 px-4 text-center">
                          <div className={`p-1.5 rounded-full border-2 inline-block ${
                            atrasado
                              ? 'border-red-200 bg-red-100'
                              : atencao
                                ? 'border-yellow-200 bg-yellow-100'
                                : 'border-gray-200 bg-gray-100'
                          }`}>
                            <Clock className={`h-4 w-4 ${atrasado ? 'text-red-600' : atencao ? 'text-yellow-600' : 'text-gray-600'}`} />
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
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          -
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => abrirSeletorBanco(conta)}
                            className={`text-xs h-7 px-2 ${atrasado ? 'border-red-200 text-red-700 hover:bg-red-100' : atencao ? 'border-yellow-200 text-yellow-700 hover:bg-yellow-100' : 'border-gray-200 text-gray-700 hover:bg-gray-100'}`}
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
                      <td colSpan="8" className="py-8 text-center text-sm text-muted-foreground">
                        {temFiltro ? "Nenhuma movimentacao no periodo selecionado" : "Nenhuma movimentacao registrada"}
                      </td>
                    </tr>
                  ) : (
                    fluxoFiltrado.map((item) => (
                    <tr
                      key={item.id}
                      className={`border-b border-border transition-colors cursor-pointer ${
                        selectedRow === item.id ? 'bg-emerald-100' : 'bg-emerald-50 hover:bg-emerald-100/80'
                      }`}
                      onClick={() => setSelectedRow(item.id)}
                    >
                      <td className="py-3 px-4 text-center">
                        <div className="p-1.5 rounded-full border-2 border-emerald-200 bg-emerald-100 inline-block">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
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
                        <div className="flex flex-col items-end">
                          <span className={item.tipo === 'entrada' ? 'text-emerald-600' : 'text-red-600'}>
                            {item.tipo === 'entrada' ? '+' : '-'} {formatCurrency(item.valor)}
                          </span>
                          {item.conta?.valorPago != null && item.conta.valorPago !== item.conta.valor && (
                            <span className="text-xs text-muted-foreground" title={`Valor original: ${formatCurrency(item.conta.valor)}`}>
                              (orig: {formatCurrency(item.conta.valor)})
                            </span>
                          )}
                        </div>
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
                          {/* Botão Editar - para todos os lançamentos (com ou sem conta vinculada) */}
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
                          {/* Botão Desfazer Transação */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDesfazerTransacao(item.id, item.contaId, item.tipo)
                            }}
                            className="text-muted-foreground hover:text-orange-600 transition-colors"
                            title={item.contaId ? "Desfazer transação e reverter para pendente" : "Excluir lançamento direto"}
                          >
                            <RotateCcw className="h-4 w-4" />
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
                    <th className="py-3 px-4 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Conciliado
                    </th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Acoes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loadingBancos ? (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-sm text-muted-foreground">
                        Carregando...
                      </td>
                    </tr>
                  ) : bancos.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-sm text-muted-foreground">
                        Nenhum banco cadastrado
                      </td>
                    </tr>
                  ) : (
                    bancos.map((banco) => (
                      <tr
                        key={banco.id}
                        className={`border-b border-border transition-colors ${banco.conciliadoEm ? 'bg-amber-100 hover:bg-amber-200' : 'hover:bg-muted/50'}`}
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
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleToggleConciliacao(banco.id, !!banco.conciliadoEm)}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded hover:bg-muted transition-colors"
                            title={banco.conciliadoEm ? `Conciliado em ${formatDate(banco.conciliadoEm)}` : 'Marcar como conciliado'}
                          >
                            {banco.conciliadoEm ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span className="text-xs text-green-600">{formatDate(banco.conciliadoEm)}</span>
                              </>
                            ) : (
                              <>
                                <Circle className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Pendente</span>
                              </>
                            )}
                          </button>
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
                  <label className="text-sm font-medium text-foreground">Nome do Banco *</label>
                  <Input
                    placeholder="Bradesco"
                    value={bancoForm.nome}
                    onChange={(e) => setBancoForm({ ...bancoForm, nome: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Saldo Inicial *</label>
                  <CurrencyInput
                    value={bancoForm.saldoInicial}
                    onValueChange={(val) => setBancoForm({ ...bancoForm, saldoInicial: val })}
                    placeholder="R$ 0,00"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Codigo do Banco</label>
                  <Input
                    placeholder="237"
                    value={bancoForm.codigo}
                    onChange={(e) => setBancoForm({ ...bancoForm, codigo: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Agencia</label>
                  <Input
                    placeholder="1692"
                    value={bancoForm.agencia}
                    onChange={(e) => setBancoForm({ ...bancoForm, agencia: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Conta</label>
                  <Input
                    placeholder="62419-1"
                    value={bancoForm.conta}
                    onChange={(e) => setBancoForm({ ...bancoForm, conta: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Chave Pix</label>
                  <Input
                    placeholder="email@exemplo.com ou celular"
                    value={bancoForm.chavePix}
                    onChange={(e) => setBancoForm({ ...bancoForm, chavePix: e.target.value })}
                  />
                </div>
              </div>

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
                  <span className="text-sm text-muted-foreground">Descrição:</span>
                  <span className="text-sm font-medium text-foreground">{contaParaPagar.descricao || contaParaPagar.beneficiario || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Valor Original:</span>
                  <span className="text-sm font-bold text-foreground">{formatCurrency(contaParaPagar.valor)}</span>
                </div>
              </div>

              {/* Campo de valor pago */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Valor {contaParaPagar.tipo === "pagar" ? "Pago" : "Recebido"}
                </label>
                <CurrencyInput
                  value={valorPago}
                  onValueChange={(value) => setValorPago(value)}
                  className="w-full"
                />
                {valorPago !== contaParaPagar.valor && (
                  <p className="text-xs text-amber-600">
                    Variação: {formatCurrency(valorPago - contaParaPagar.valor)} ({((valorPago - contaParaPagar.valor) / contaParaPagar.valor * 100).toFixed(1)}%)
                  </p>
                )}
              </div>

              {/* Campo de data de pagamento */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Data do {contaParaPagar.tipo === "pagar" ? "Pagamento" : "Recebimento"}
                </label>
                <input
                  type="date"
                  value={dataPagamentoSelecionada}
                  onChange={(e) => setDataPagamentoSelecionada(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
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

      {/* Modal Detalhe Fatura */}
      {faturaDetalhe && cartaoParaFaturas && (
        <FaturaModal
          fatura={faturaDetalhe}
          cartaoId={cartaoParaFaturas.id}
          onClose={() => {
            setFaturaDetalhe(null)
            setCartaoParaFaturas(null)
          }}
          onPago={() => {
            setFaturaDetalhe(null)
            setCartaoParaFaturas(null)
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
  const [descricao, setDescricao] = useState(fluxo.conta?.descricao || fluxo.descricao || "")
  // Usar valorPago se disponível, senão o valor do fluxo
  const [valorPago, setValorPago] = useState(fluxo.conta?.valorPago ?? fluxo.valor ?? 0)
  // Valor original (não editável)
  const valorOriginal = fluxo.conta?.valor ?? fluxo.valor ?? 0
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

    if (!valorPago || valorPago <= 0) {
      setError("Valor deve ser maior que zero")
      return
    }

    if (!dataPagamento) {
      setError("Data de pagamento é obrigatória")
      return
    }

    setIsSaving(true)

    try {
      // Atualizar a conta vinculada (apenas valorPago, mantém valor original)
      if (fluxo.contaId) {
        const contaResponse = await fetch(`/api/contas/${fluxo.contaId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            descricao: descricao.trim(),
            valorPago: Number(valorPago),
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
          descricao: descricao.trim() || null,
          valor: Number(valorPago),
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

            {/* Valor Original (não editável) */}
            {fluxo.conta && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Valor Original</label>
                <div className="h-10 px-3 flex items-center rounded-md border border-border bg-muted/50 text-sm text-muted-foreground">
                  {formatCurrency(valorOriginal)}
                </div>
              </div>
            )}

            {/* Valor Pago (editável) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Valor {fluxo.tipo === 'entrada' ? 'Recebido' : 'Pago'}
              </label>
              <CurrencyInput
                value={valorPago}
                onValueChange={setValorPago}
                disabled={isSaving}
              />
              {valorPago !== valorOriginal && (
                <p className="text-xs text-amber-600">
                  Variação: {formatCurrency(valorPago - valorOriginal)} ({((valorPago - valorOriginal) / valorOriginal * 100).toFixed(1)}%)
                </p>
              )}
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
