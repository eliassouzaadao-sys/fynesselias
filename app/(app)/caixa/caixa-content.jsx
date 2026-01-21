"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { KpiCard } from "@/components/ui/kpi-card"
import { Card } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/ui/status-badge"
import { Drawer } from "@/components/ui/drawer"
import { BankSelector } from "@/components/bank/bank-selector"
import { BankAccountCard } from "@/components/bank/bank-account-card"
import { CurrencyInput } from "@/components/ui/currency-input"
import { BANK_DATA } from "@/lib/bank-data"
import { formatCurrency, formatDate } from "@/lib/format"
import { Plus, Download, Filter, ArrowRight, ArrowLeft, Upload, X, FileText, CheckCircle, Eye, Edit, CreditCard, Landmark, BadgePercent, Calendar, TrendingDown, DollarSign } from "lucide-react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"

// Mock data centros e subcentros
const centrosCusto = [
  { 
    id: "1", 
    name: "Matéria Prima",
    subcentros: [
      { id: "1-1", name: "Frios" },
      { id: "1-2", name: "Secos" },
      { id: "1-3", name: "Bebidas" },
    ]
  },
  { 
    id: "2", 
    name: "Comercial",
    subcentros: [
      { id: "2-1", name: "Vendas Diretas" },
      { id: "2-2", name: "E-commerce" },
    ]
  },
  { 
    id: "3", 
    name: "Marketing",
    subcentros: [
      { id: "3-1", name: "Redes Sociais" },
      { id: "3-2", name: "Anúncios Online" },
      { id: "3-3", name: "Eventos" },
    ]
  },
  { 
    id: "4", 
    name: "Operações",
    subcentros: [
      { id: "4-1", name: "Logística" },
      { id: "4-2", name: "Produção" },
    ]
  },
]

// Mock data
const mockTransactions = [
  {
    id: "1",
    date: "2026-01-12",
    description: "Venda à vista - Cliente ABC",
    type: "in",
    amount: 4500.0,
    centro: "Comercial",
    subcentro: "Vendas Diretas",
    origin: "manual",
    balance: 127450.32,
  },
  {
    id: "2",
    date: "2026-01-12",
    description: "Pagamento Fornecedor XYZ",
    type: "out",
    amount: 2800.0,
    centro: "Matéria Prima",
    subcentro: "Secos",
    origin: "banco",
    balance: 122950.32,
  },
  {
    id: "3",
    date: "2026-01-11",
    description: "Recebimento Fatura #2024",
    type: "in",
    amount: 8200.0,
    centro: "Comercial",
    subcentro: "E-commerce",
    origin: "banco",
    balance: 125750.32,
  },
  {
    id: "4",
    date: "2026-01-11",
    description: "Energia Elétrica",
    type: "out",
    amount: 1250.0,
    centro: "Operações",
    subcentro: "Produção",
    origin: "whatsapp",
    balance: 117550.32,
  },
  {
    id: "5",
    date: "2026-01-11",
    description: "Aluguel Escritório",
    type: "out",
    amount: 3500.0,
    centro: "Operações",
    subcentro: "Produção",
    origin: "manual",
    balance: 118800.32,
  },
  {
    id: "6",
    date: "2026-01-10",
    description: "Venda Produto A",
    type: "in",
    amount: 12300.0,
    centro: "Comercial",
    subcentro: "Vendas Diretas",
    origin: "nfe",
    balance: 122300.32,
  },
  {
    id: "7",
    date: "2026-01-10",
    description: "Combustível Frota",
    type: "out",
    amount: 890.0,
    centro: "Operações",
    subcentro: "Logística",
    origin: "banco",
    balance: 110000.32,
  },
  {
    id: "8",
    date: "2026-01-09",
    description: "Serviços Prestados",
    type: "in",
    amount: 6500.0,
    centro: "Comercial",
    subcentro: "Vendas Diretas",
    origin: "banco",
    balance: 110890.32,
  },
  {
    id: "9",
    date: "2026-01-09",
    description: "Material de Escritório",
    type: "out",
    amount: 320.0,
    centro: "Operações",
    subcentro: "Produção",
    origin: "manual",
    balance: 104390.32,
  },
  {
    id: "10",
    date: "2026-01-08",
    description: "Internet e Telefone",
    type: "out",
    amount: 450.0,
    centro: "Operações",
    subcentro: "Produção",
    origin: "banco",
    balance: 104710.32,
  },
]

const originLabels = {
  manual: "Manual",
  whatsapp: "WhatsApp",
  banco: "Banco",
  nfe: "NF-e",
  api: "API",
}

const mockContas = [
  {
    id: "1",
    bankId: "banco-do-brasil",
    agencia: "1234-5",
    conta: "12345-6",
    tipo: "Conta Corrente",
    saldo: 45230.5,
    limiteCredito: 50000,
    limiteChequeEspecial: 15000,
    utilizadoChequeEspecial: 0,
  },
  {
    id: "2",
    bankId: "itau",
    agencia: "0987",
    conta: "98765-4",
    tipo: "Conta Corrente",
    saldo: 32150.0,
    limiteCredito: 80000,
    limiteChequeEspecial: 20000,
    utilizadoChequeEspecial: 5000,
  },
  {
    id: "3",
    bankId: "bradesco",
    agencia: "4567",
    conta: "45678-9",
    tipo: "Conta Corrente",
    saldo: 18500.0,
    limiteCredito: 30000,
    limiteChequeEspecial: 10000,
    utilizadoChequeEspecial: 0,
  },
  {
    id: "4",
    bankId: "nubank",
    agencia: "0001",
    conta: "789456-1",
    tipo: "Conta Digital",
    saldo: 8750.0,
    limiteCredito: 25000,
    limiteChequeEspecial: 0,
    utilizadoChequeEspecial: 0,
  },
  {
    id: "5",
    bankId: "caixa",
    agencia: "2468",
    conta: "00123456-7",
    tipo: "Conta Corrente",
    saldo: 15320.82,
    limiteCredito: 40000,
    limiteChequeEspecial: 8000,
    utilizadoChequeEspecial: 0,
  },
]

const mockCreditos = [
  {
    id: "1",
    tipo: "Cartão de Crédito",
    banco: "Banco do Brasil",
    limite: 50000,
    utilizado: 32500,
    disponivel: 17500,
    vencimentoFatura: "2026-01-25",
    taxaJuros: 12.5,
    status: "Ativo",
  },
  {
    id: "2",
    tipo: "Cartão de Crédito",
    banco: "Itaú Empresas",
    limite: 80000,
    utilizado: 45000,
    disponivel: 35000,
    vencimentoFatura: "2026-01-20",
    taxaJuros: 10.8,
    status: "Ativo",
  },
  {
    id: "3",
    tipo: "Empréstimo",
    banco: "Bradesco",
    limite: 200000,
    utilizado: 200000,
    disponivel: 0,
    parcelas: "24/36",
    valorParcela: 9800,
    vencimentoParcela: "2026-01-15",
    taxaJuros: 1.89,
    status: "Em Dia",
  },
  {
    id: "4",
    tipo: "FGI PRONAMP",
    banco: "BNDES via BB",
    limite: 500000,
    utilizado: 350000,
    disponivel: 150000,
    parcelas: "12/48",
    valorParcela: 12500,
    vencimentoParcela: "2026-01-10",
    taxaJuros: 0.85,
    status: "Em Dia",
  },
  {
    id: "5",
    tipo: "Cheque Especial",
    banco: "Santander",
    limite: 30000,
    utilizado: 0,
    disponivel: 30000,
    taxaJuros: 8.5,
    status: "Disponível",
  },
  {
    id: "6",
    tipo: "Capital de Giro",
    banco: "Caixa",
    limite: 150000,
    utilizado: 150000,
    disponivel: 0,
    parcelas: "6/24",
    valorParcela: 7200,
    vencimentoParcela: "2026-01-18",
    taxaJuros: 1.45,
    status: "Em Dia",
  },
]

const tipoIcons = {
  "Cartão de Crédito": CreditCard,
  Empréstimo: Landmark,
  "FGI PRONAMP": BadgePercent,
  "Cheque Especial": TrendingDown,
  "Capital de Giro": Landmark,
  "Antecipação Recebíveis": Calendar,
}

const columns = [
  {
    accessorKey: "date",
    header: "Data",
    cell: ({ row }) => formatDate(row.original.date),
  },
  {
    accessorKey: "description",
    header: "Descrição",
  },
  {
    accessorKey: "centro",
    header: "Centro",
  },
  {
    accessorKey: "subcentro",
    header: "Subcentro",
  },
  {
    accessorKey: "origin",
    header: "Origem",
    cell: ({ row }) => (
      <span className="text-xs text-fyn-text-muted">{originLabels[row.original.origin] || row.original.origin}</span>
    ),
  },
  {
    accessorKey: "amount",
    header: "Valor",
    cell: ({ row }) => (
      <span className={row.original.type === "in" ? "text-fyn-success" : "text-fyn-danger"}>
        {row.original.type === "in" ? "+" : "-"}
        {formatCurrency(row.original.amount)}
      </span>
    ),
  },
  {
    accessorKey: "balance",
    header: "Saldo",
    cell: ({ row }) => <span className="font-medium">{formatCurrency(row.original.balance)}</span>,
  },
]

export function FluxoCaixaContent() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedCentro, setSelectedCentro] = useState("")
  const [selectedSubcentro, setSelectedSubcentro] = useState("")
  const [filters, setFilters] = useState({
    costCenter: "",
    category: "",
    origin: "",
    dateFrom: "",
    dateTo: "",
  })
  
  const selectedCentroData = centrosCusto.find(c => c.id === selectedCentro)

  const handleCentroChange = (e) => {
    setSelectedCentro(e.target.value)
    setSelectedSubcentro("") // Reset subcentro quando mudar o centro
  }
  
  // Estados para Contas Bancárias
  const [contas, setContas] = useState(mockContas)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalStep, setModalStep] = useState(1)
  const [editingConta, setEditingConta] = useState(null)
  const [selectedBankId, setSelectedBankId] = useState("")
  const [formData, setFormData] = useState({
    agencia: "",
    conta: "",
    tipo: "Conta Corrente",
    saldo: "",
    limiteCredito: "",
    limiteChequeEspecial: "",
  })
  
  // Estados para upload de extrato
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  
  // Estados para Créditos
  const [creditos, setCreditos] = useState(mockCreditos)
  const [showNovoCreditoModal, setShowNovoCreditoModal] = useState(false)
  const [showCreditoDrawer, setShowCreditoDrawer] = useState(false)
  const [selectedCredito, setSelectedCredito] = useState(null)

  const saldoAtual = 127450.32
  const entradasMes = 45200.0
  const saidasMes = 32800.0
  const saldoProjetado = 139850.32
  
  // KPIs para Contas Bancárias
  const saldoTotal = contas.reduce((acc, c) => acc + c.saldo, 0)
  const limiteTotal = contas.reduce((acc, c) => acc + c.limiteCredito, 0)
  const chequeEspecialTotal = contas.reduce((acc, c) => acc + c.limiteChequeEspecial, 0)
  const chequeEspecialUtilizado = contas.reduce((acc, c) => acc + c.utilizadoChequeEspecial, 0)
  
  // KPIs para Créditos
  const kpisCreditos = {
    limiteTotal: creditos.reduce((acc, c) => acc + c.limite, 0),
    utilizado: creditos.reduce((acc, c) => acc + c.utilizado, 0),
    disponivel: creditos.reduce((acc, c) => acc + c.disponivel, 0),
    parcelasMes: creditos.filter((c) => c.valorParcela).reduce((acc, c) => acc + c.valorParcela, 0),
  }
  
  // Colunas para tabela de Créditos
  const creditosColumns = [
    {
      accessorKey: "tipo",
      header: "Tipo",
      cell: ({ row }) => {
        const Icon = tipoIcons[row.original.tipo] || Landmark
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-fyn-muted" />
            <span>{row.original.tipo}</span>
          </div>
        )
      },
    },
    { accessorKey: "banco", header: "Banco" },
    {
      accessorKey: "limite",
      header: "Limite",
      cell: ({ row }) => formatCurrency(row.original.limite),
    },
    {
      accessorKey: "utilizado",
      header: "Utilizado",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span>{formatCurrency(row.original.utilizado)}</span>
          <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-fyn-border">
            <div
              className="h-full rounded-full bg-fyn-accent"
              style={{ width: `${(row.original.utilizado / row.original.limite) * 100}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      accessorKey: "disponivel",
      header: "Disponível",
      cell: ({ row }) => (
        <span className={row.original.disponivel > 0 ? "text-fyn-success" : "text-fyn-muted"}>
          {formatCurrency(row.original.disponivel)}
        </span>
      ),
    },
    {
      accessorKey: "taxaJuros",
      header: "Taxa a.m.",
      cell: ({ row }) => <span className="text-xs">{row.original.taxaJuros}%</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setSelectedCredito(row.original)
              setShowCreditoDrawer(true)
            }}
            className="rounded p-1 text-fyn-muted hover:bg-fyn-surface hover:text-fyn-accent"
            title="Ver detalhes"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  // Funções para Contas Bancárias
  function handleOpenModal(conta = null) {
    if (conta) {
      setEditingConta(conta)
      setSelectedBankId(conta.bankId)
      setFormData({
        agencia: conta.agencia,
        conta: conta.conta,
        tipo: conta.tipo,
        saldo: conta.saldo.toString(),
        limiteCredito: conta.limiteCredito.toString(),
        limiteChequeEspecial: conta.limiteChequeEspecial.toString(),
      })
      setModalStep(2)
    } else {
      setEditingConta(null)
      setSelectedBankId("")
      setFormData({
        agencia: "",
        conta: "",
        tipo: "Conta Corrente",
        saldo: "",
        limiteCredito: "",
        limiteChequeEspecial: "",
      })
      setModalStep(1)
    }
    setIsModalOpen(true)
  }

  function handleCloseModal() {
    setIsModalOpen(false)
    setModalStep(1)
    setSelectedBankId("")
    setEditingConta(null)
  }

  function handleNextStep() {
    if (selectedBankId) {
      setModalStep(2)
    }
  }

  function handleSave() {
    const novaConta = {
      id: editingConta?.id || Date.now().toString(),
      bankId: selectedBankId,
      agencia: formData.agencia,
      conta: formData.conta,
      tipo: formData.tipo,
      saldo: Number.parseFloat(formData.saldo) || 0,
      limiteCredito: Number.parseFloat(formData.limiteCredito) || 0,
      limiteChequeEspecial: Number.parseFloat(formData.limiteChequeEspecial) || 0,
      utilizadoChequeEspecial: editingConta?.utilizadoChequeEspecial || 0,
    }

    if (editingConta) {
      setContas(contas.map((c) => (c.id === editingConta.id ? novaConta : c)))
    } else {
      setContas([...contas, novaConta])
    }
    handleCloseModal()
  }

  function handleDelete(id) {
    setContas(contas.filter((c) => c.id !== id))
  }
  
  // Funções para upload de extrato
  function handleFileUpload(files) {
    const newFiles = Array.from(files).map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadDate: new Date().toISOString(),
      status: "processing",
      file: file
    }))
    
    setUploadedFiles(prev => [...prev, ...newFiles])
    
    // Simular processamento
    newFiles.forEach(file => {
      setTimeout(() => {
        setUploadedFiles(prev => 
          prev.map(f => f.id === file.id ? { ...f, status: "completed" } : f)
        )
      }, 2000)
    })
  }
  
  function handleDragOver(e) {
    e.preventDefault()
    setIsDragging(true)
  }
  
  function handleDragLeave(e) {
    e.preventDefault()
    setIsDragging(false)
  }
  
  function handleDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }
  
  function handleRemoveFile(id) {
    setUploadedFiles(prev => prev.filter(f => f.id !== id))
  }
  
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const selectedBank = selectedBankId ? BANK_DATA[selectedBankId] : null

  return (
    <div className="space-y-1">
      <PageHeader
        title="Fluxo de Caixa"
        description="Lançamentos, movimentação financeira e contas bancárias"
      />

      <Tabs defaultValue="lancamentos" className="w-full">
        <TabsList>
          <TabsTrigger value="lancamentos">Lançamentos</TabsTrigger>
          <TabsTrigger value="contas">Contas Bancárias</TabsTrigger>
          <TabsTrigger value="creditos">Créditos</TabsTrigger>
          <TabsTrigger value="extrato">Upload de Extrato</TabsTrigger>
        </TabsList>

        <TabsContent value="lancamentos" className="space-y-2">
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Lançamento
            </Button>
          </div>

          {/* KPIs - responsivo */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="rounded-lg bg-fyn-success/10 p-2">
                  <DollarSign className="h-4 w-4 text-fyn-success" />
                </div>
                <span className="text-xs text-fyn-muted">Saldo Atual</span>
              </div>
              <p className="text-2xl font-bold text-fyn-text">{formatCurrency(saldoAtual)}</p>
              <p className="text-xs text-fyn-muted mt-1">Saldo disponível</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="rounded-lg bg-fyn-success/10 p-2">
                  <TrendingDown className="h-4 w-4 text-fyn-success" />
                </div>
                <span className="text-xs text-fyn-muted">Entradas (Mês)</span>
              </div>
              <p className="text-2xl font-bold text-fyn-success">{formatCurrency(entradasMes)}</p>
              <p className="text-xs text-fyn-muted mt-1">Recebimentos do mês</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="rounded-lg bg-fyn-danger/10 p-2">
                  <TrendingDown className="h-4 w-4 text-fyn-danger" />
                </div>
                <span className="text-xs text-fyn-muted">Saídas (Mês)</span>
              </div>
              <p className="text-2xl font-bold text-fyn-danger">{formatCurrency(saidasMes)}</p>
              <p className="text-xs text-fyn-muted mt-1">Pagamentos do mês</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="rounded-lg bg-blue-500/10 p-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-xs text-fyn-muted">Saldo Projetado (30d)</span>
              </div>
              <p className="text-2xl font-bold text-fyn-text">{formatCurrency(saldoProjetado)}</p>
              <p className="text-xs text-fyn-muted mt-1">Projeção para 30 dias</p>
            </Card>
          </div>

      {/* Filtros estilo Contas a Pagar */}
      <Card className="p-4 mb-2">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fyn-muted" />
            <input
              type="text"
              placeholder="Buscar por centro, subcentro..."
              value={filters.search || ""}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              className="pl-9 w-full rounded border border-fyn-border bg-fyn-bg px-2 py-1 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent"
            />
          </div>
          <select
            value={filters.costCenter}
            onChange={e => setFilters({ ...filters, costCenter: e.target.value })}
            className="w-full rounded border border-fyn-border bg-fyn-bg px-2 py-1 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent"
          >
            <option value="">Todos os Centros de Custo</option>
            {centrosCusto.map((centro) => (
              <option key={centro.id} value={centro.name}>{centro.name}</option>
            ))}
          </select>
          <Button variant="outline" className="w-full">
            <Calendar className="mr-2 h-4 w-4" />
            Este Mês
          </Button>
        </div>
      </Card>

      {/* Transactions Table */}
      <DataTable data={mockTransactions} columns={columns} searchPlaceholder="Buscar lançamentos..." pageSize={15} />
        </TabsContent>

        <TabsContent value="contas" className="space-y-4 mt-4">
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={() => handleOpenModal()}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Nova Conta
            </Button>
          </div>

          {/* KPIs Contas Bancárias - responsivo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <KpiCard
              label="Saldo Total"
              value={formatCurrency(saldoTotal)}
              trend={saldoTotal >= 0 ? "up" : "down"}
              trendValue={saldoTotal >= 0 ? "Positivo" : "Negativo"}
              variant={saldoTotal >= 0 ? "default" : "danger"}
            />
            <KpiCard label="Limite de Crédito" value={formatCurrency(limiteTotal)} subvalue="Total disponível em linhas" />
            <KpiCard
              label="Cheque Especial"
              value={formatCurrency(chequeEspecialTotal)}
              subvalue={`${formatCurrency(chequeEspecialUtilizado)} utilizado`}
              variant={chequeEspecialUtilizado > 0 ? "warning" : "default"}
            />
            {/* Mostra o 4º KPI só em desktop grande */}
            <div className="hidden lg:block">
              <KpiCard label="Contas Ativas" value={contas.length.toString()} subvalue="Bancos cadastrados" />
            </div>
          </div>

          <div className="rounded-xl border border-fyn-border bg-fyn-bg p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-fyn-text">Suas Contas Bancárias</h2>
              <span className="text-xs text-fyn-muted">{contas.length} conta(s) cadastrada(s)</span>
            </div>

            {/* Lista de Contas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {contas.map((conta) => (
                <BankAccountCard key={conta.id} conta={conta} onEdit={handleOpenModal} onDelete={handleDelete} />
              ))}

              <button
                onClick={() => handleOpenModal()}
                className="group relative flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-fyn-border bg-fyn-surface/50 p-6 min-h-[180px] transition-all duration-200 hover:border-fyn-accent hover:bg-fyn-surface"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-fyn-accent/10 transition-all duration-200 group-hover:bg-fyn-accent/20 group-hover:scale-110">
                  <Plus className="h-6 w-6 text-fyn-accent" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-fyn-text">Nova Conta Bancária</p>
                  <p className="text-xs text-fyn-muted mt-0.5">Clique para adicionar</p>
                </div>
              </button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="creditos" className="space-y-4 mt-4">
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={() => setShowNovoCreditoModal(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Novo Crédito
            </Button>
          </div>

          {/* KPIs Créditos - grid compacto */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-2">
            <KpiCard label="Limite Total" value={formatCurrency(kpisCreditos.limiteTotal)} />
            <KpiCard label="Utilizado" value={formatCurrency(kpisCreditos.utilizado)} variant="warning" />
            <KpiCard label="Disponível" value={formatCurrency(kpisCreditos.disponivel)} variant="success" />
            <KpiCard label="Parcelas/Mês" value={formatCurrency(kpisCreditos.parcelasMes)} variant="accent" />
          </div>

          {/* Resumo por Tipo - grid compacto */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-fyn-border bg-fyn-bg p-2">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="h-4 w-4 text-fyn-accent" />
                <span className="text-xs font-medium text-fyn-muted">Cartões de Crédito</span>
              </div>
              <p className="text-base font-semibold text-fyn-text">
                {formatCurrency(
                  creditos.filter((c) => c.tipo === "Cartão de Crédito").reduce((acc, c) => acc + c.utilizado, 0),
                )}
              </p>
              <p className="text-xs text-fyn-muted">
                de {formatCurrency(creditos.filter((c) => c.tipo === "Cartão de Crédito").reduce((acc, c) => acc + c.limite, 0))} limite
              </p>
            </div>
            <div className="rounded-lg border border-fyn-border bg-fyn-bg p-2">
              <div className="flex items-center gap-2 mb-1">
                <Landmark className="h-4 w-4 text-fyn-warning" />
                <span className="text-xs font-medium text-fyn-muted">Empréstimos</span>
              </div>
              <p className="text-base font-semibold text-fyn-text">
                {formatCurrency(
                  creditos.filter((c) => c.tipo === "Empréstimo" || c.tipo === "Capital de Giro").reduce((acc, c) => acc + c.utilizado, 0),
                )}
              </p>
              <p className="text-xs text-fyn-muted">saldo devedor</p>
            </div>
            <div className="rounded-lg border border-fyn-border bg-fyn-bg p-2">
              <div className="flex items-center gap-2 mb-1">
                <BadgePercent className="h-4 w-4 text-fyn-success" />
                <span className="text-xs font-medium text-fyn-muted">FGI PRONAMP</span>
              </div>
              <p className="text-base font-semibold text-fyn-text">
                {formatCurrency(
                  creditos.filter((c) => c.tipo === "FGI PRONAMP").reduce((acc, c) => acc + c.utilizado, 0),
                )}
              </p>
              <p className="text-xs text-fyn-muted">taxa subsidiada</p>
            </div>
            <div className="rounded-lg border border-fyn-border bg-fyn-bg p-2">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-4 w-4 text-fyn-accent" />
                <span className="text-xs font-medium text-fyn-muted">Cheque Especial</span>
              </div>
              <p className="text-base font-semibold text-fyn-text">
                {formatCurrency(
                  creditos.filter((c) => c.tipo === "Cheque Especial").reduce((acc, c) => acc + c.disponivel, 0),
                )}
              </p>
              <p className="text-xs text-fyn-muted">disponível</p>
            </div>
          </div>

          {/* Créditos Table */}
          <DataTable data={creditos} columns={creditosColumns} searchPlaceholder="Buscar créditos..." pageSize={10} />
        </TabsContent>

        <TabsContent value="extrato" className="space-y-4 mt-4">
          <div className="space-y-2">
            {/* Upload Area */}
            <div 
              className={`rounded-xl border-2 border-dashed transition-all ${
                isDragging 
                  ? 'border-fyn-accent bg-fyn-accent/5' 
                  : 'border-fyn-border bg-fyn-surface'
              } p-8`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-fyn-accent/10">
                  <Upload className="h-8 w-8 text-fyn-accent" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-fyn-text mb-1">
                    Upload de Extrato Bancário
                  </h3>
                  <p className="text-sm text-fyn-muted mb-3">
                    Arraste e solte <span className="font-semibold text-fyn-accent">múltiplos arquivos</span> aqui ou clique para selecionar
                  </p>
                  <p className="text-xs text-fyn-muted">
                    Formatos aceitos: PDF, PNG, JPG, JPEG • Máx. 10MB por arquivo • Upload simultâneo
                  </p>
                </div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                  <Button size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Selecionar Arquivos
                  </Button>
                </label>
              </div>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="rounded-xl border border-fyn-border bg-fyn-bg p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-fyn-text">
                    Arquivos Enviados ({uploadedFiles.length})
                  </h3>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => setUploadedFiles([])}
                  >
                    Limpar Todos
                  </Button>
                </div>
                <div className="space-y-2">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between rounded-lg border border-fyn-border bg-fyn-surface p-3"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-fyn-accent/10">
                          <FileText className="h-5 w-5 text-fyn-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-fyn-text truncate">
                            {file.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-fyn-muted">
                              {formatFileSize(file.size)}
                            </span>
                            <span className="text-xs text-fyn-muted">•</span>
                            <span className="text-xs text-fyn-muted">
                              {new Date(file.uploadDate).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                        {file.status === "completed" && (
                          <div className="flex items-center gap-1.5 text-fyn-success">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-xs font-medium">Processado</span>
                          </div>
                        )}
                        {file.status === "processing" && (
                          <div className="flex items-center gap-1.5 text-fyn-accent">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-fyn-accent border-t-transparent" />
                            <span className="text-xs font-medium">Processando...</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveFile(file.id)}
                        className="ml-3 flex h-8 w-8 items-center justify-center rounded-lg text-fyn-muted hover:bg-fyn-danger/10 hover:text-fyn-danger transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">
                Como funciona?
              </h4>
              <ul className="space-y-1.5 text-xs text-blue-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Faça upload do extrato bancário em PDF ou imagem</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Nosso sistema processará automaticamente as transações</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Os lançamentos serão adicionados automaticamente ao Fluxo de Caixa</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Você pode revisar e editar antes de confirmar</span>
                </li>
              </ul>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Transaction Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Novo Lançamento" size="md">
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-fyn-text">Tipo</label>
              <select className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent">
                <option value="in">Entrada</option>
                <option value="out">Saída</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-fyn-text">Data</label>
              <input
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-fyn-text">Valor</label>
            <CurrencyInput
              placeholder="R$ 0,00"
              className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-fyn-text">Descrição</label>
            <input
              type="text"
              placeholder="Descrição do lançamento"
              className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-fyn-text">Centro de Custo/Receita</label>
              <select 
                value={selectedCentro}
                onChange={handleCentroChange}
                className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent"
              >
                <option value="">Selecione o centro...</option>
                {centrosCusto.map((centro) => (
                  <option key={centro.id} value={centro.id}>{centro.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-fyn-text">Subcentro</label>
              <select 
                value={selectedSubcentro}
                onChange={(e) => setSelectedSubcentro(e.target.value)}
                disabled={!selectedCentro}
                className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none focus:ring-1 focus:ring-fyn-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Selecione o subcentro...</option>
                {selectedCentroData?.subcentros.map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
            <Button>Salvar</Button>
          </div>
        </form>
      </Modal>

      {/* Modal - Step 1: Selecionar Banco */}
      <Modal
        isOpen={isModalOpen && modalStep === 1}
        onClose={handleCloseModal}
        title="Selecione o Banco"
        size="lg"
        variant="light"
      >
        <div className="space-y-4">
          <BankSelector selectedBank={selectedBankId} onSelect={setSelectedBankId} />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="secondary" size="sm" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleNextStep} disabled={!selectedBankId}>
              Continuar
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal - Step 2: Detalhes da Conta */}
      <Modal
        isOpen={isModalOpen && modalStep === 2}
        onClose={handleCloseModal}
        title={editingConta ? `Editar Conta - ${selectedBank?.name}` : `Nova Conta - ${selectedBank?.name}`}
        size="md"
        variant="light"
      >
        <div className="space-y-4">
          {/* Preview do card do banco */}
          {selectedBank && (
            <div className="rounded-xl p-4 mb-4" style={{ background: selectedBank.cardBg }}>
              <p
                className="text-sm font-medium"
                style={{
                  color: ["banco-do-brasil", "neon", "pan"].includes(selectedBankId)
                    ? selectedBank.textColor
                    : "#FFFFFF",
                }}
              >
                Preview do card da conta
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Agência</label>
              <input
                type="text"
                value={formData.agencia}
                onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                placeholder="0000-0"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Conta</label>
              <input
                type="text"
                value={formData.conta}
                onChange={(e) => setFormData({ ...formData, conta: e.target.value })}
                placeholder="00000-0"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Tipo de Conta</label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="Conta Corrente">Conta Corrente</option>
              <option value="Conta Digital">Conta Digital</option>
              <option value="Conta Poupança">Conta Poupança</option>
              <option value="Conta Investimento">Conta Investimento</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Saldo Atual</label>
            <input
              type="number"
              value={formData.saldo}
              onChange={(e) => setFormData({ ...formData, saldo: e.target.value })}
              placeholder="0,00"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Limite de Crédito</label>
              <input
                type="number"
                value={formData.limiteCredito}
                onChange={(e) => setFormData({ ...formData, limiteCredito: e.target.value })}
                placeholder="0,00"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Limite Cheque Especial</label>
              <input
                type="number"
                value={formData.limiteChequeEspecial}
                onChange={(e) => setFormData({ ...formData, limiteChequeEspecial: e.target.value })}
                placeholder="0,00"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="flex justify-between gap-3 pt-4 border-t border-gray-200">
            <Button variant="secondary" size="sm" onClick={() => setModalStep(1)}>
              <ArrowLeft className="mr-1 h-3.5 w-3.5" />
              Voltar
            </Button>
            <div className="flex gap-3">
              <Button variant="secondary" size="sm" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!formData.agencia || !formData.conta}>
                {editingConta ? "Salvar Alterações" : "Adicionar Conta"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Novo Crédito */}
      <Modal isOpen={showNovoCreditoModal} onClose={() => setShowNovoCreditoModal(false)} title="Novo Crédito Bancário" size="md">
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-fyn-text">Tipo</label>
              <select className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none">
                <option>Cartão de Crédito</option>
                <option>Empréstimo</option>
                <option>FGI PRONAMP</option>
                <option>Capital de Giro</option>
                <option>Cheque Especial</option>
                <option>Antecipação Recebíveis</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-fyn-text">Banco</label>
              <input
                type="text"
                placeholder="Nome do banco"
                className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-fyn-text">Limite/Valor</label>
              <input
                type="number"
                placeholder="0,00"
                className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-fyn-text">Taxa de Juros (% a.m.)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-fyn-text">Parcelas (se aplicável)</label>
              <input
                type="number"
                placeholder="Número de parcelas"
                className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-fyn-text">Dia de Vencimento</label>
              <input
                type="number"
                min="1"
                max="31"
                placeholder="Dia"
                className="w-full rounded border border-fyn-border bg-fyn-bg px-3 py-2 text-sm text-fyn-text focus:border-fyn-accent focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowNovoCreditoModal(false)}>
              Cancelar
            </Button>
            <Button>Salvar</Button>
          </div>
        </form>
      </Modal>

      {/* Drawer Detalhes Crédito */}
      <Drawer
        isOpen={showCreditoDrawer}
        onClose={() => setShowCreditoDrawer(false)}
        title={selectedCredito ? `${selectedCredito.tipo} - ${selectedCredito.banco}` : "Detalhes"}
      >
        {selectedCredito && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded bg-fyn-surface p-2">
                <p className="text-[10px] uppercase text-fyn-muted">Limite</p>
                <p className="text-sm font-semibold">{formatCurrency(selectedCredito.limite)}</p>
              </div>
              <div className="rounded bg-fyn-surface p-2">
                <p className="text-[10px] uppercase text-fyn-muted">Utilizado</p>
                <p className="text-sm font-semibold">{formatCurrency(selectedCredito.utilizado)}</p>
              </div>
              <div className="rounded bg-fyn-surface p-2">
                <p className="text-[10px] uppercase text-fyn-muted">Disponível</p>
                <p className="text-sm font-semibold text-fyn-success">{formatCurrency(selectedCredito.disponivel)}</p>
              </div>
              <div className="rounded bg-fyn-surface p-2">
                <p className="text-[10px] uppercase text-fyn-muted">Taxa a.m.</p>
                <p className="text-sm font-semibold">{selectedCredito.taxaJuros}%</p>
              </div>
            </div>

            {selectedCredito.parcelas && (
              <div className="rounded-lg border border-fyn-border bg-fyn-surface p-3">
                <h3 className="mb-2 text-sm font-medium text-fyn-text">Parcelas</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-fyn-muted">Situação:</span> {selectedCredito.parcelas}
                  </div>
                  <div>
                    <span className="text-fyn-muted">Valor:</span> {formatCurrency(selectedCredito.valorParcela)}
                  </div>
                  <div className="col-span-2">
                    <span className="text-fyn-muted">Próximo Venc.:</span>{" "}
                    {formatDate(selectedCredito.vencimentoParcela)}
                  </div>
                </div>
              </div>
            )}

            {selectedCredito.vencimentoFatura && (
              <div className="rounded-lg border border-fyn-border bg-fyn-surface p-3">
                <h3 className="mb-2 text-sm font-medium text-fyn-text">Fatura</h3>
                <p className="text-sm">
                  <span className="text-fyn-muted">Vencimento:</span> {formatDate(selectedCredito.vencimentoFatura)}
                </p>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}
