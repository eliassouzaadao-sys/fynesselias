"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatDate } from "@/lib/format"
import { 
  Plus, 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageCircle,
  Mail,
  Edit,
  Trash2,
  FileText,
  DollarSign,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

export function ReceberContent() {
  // Estados para o modal completo
  const [newCliente, setNewCliente] = useState("");
  const [newDocumento, setNewDocumento] = useState("");
  const [newFormaRecebimento, setNewFormaRecebimento] = useState("");
  const [newCentroReceita, setNewCentroReceita] = useState("");
  const [newSubCentroReceita, setNewSubCentroReceita] = useState("");
  const [invoices, setInvoices] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoriaFilter, setCategoriaFilter] = useState("Todas")
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [documentToView, setDocumentToView] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const itemsPerPage = 12
  const [showNewModal, setShowNewModal] = useState(false)
  const [newDescricao, setNewDescricao] = useState("")
  const [newValor, setNewValor] = useState("")
  const [newVencimento, setNewVencimento] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  async function handleNovaConta(e) {
    e.preventDefault()
    setIsSaving(true)
    try {
      const res = await fetch("/api/contas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descricao: newDescricao,
          valor: parseFloat(newValor),
          vencimento: newVencimento,
          pago: false,
          tipo: "receber"
        })
      })
      if (res.ok) {
        setShowNewModal(false)
        setNewDescricao("")
        setNewValor("")
        setNewVencimento("")
        // Recarrega as contas
        const data = await res.json()
        setInvoices(prev => [...prev, data])
      }
    } finally {
      setIsSaving(false)
    }
  }

      useEffect(() => {
        const loadInvoices = async () => {
          try {
            const res = await fetch("/api/contas")
            const data = await res.json()
            // CRITICAL FIX: Always validate that data is an array before setting state
            // This prevents "TypeError: invoices.map is not a function"
            setInvoices(Array.isArray(data) ? data : [])
          } catch (e) {
            console.error('Failed to load invoices:', e)
            setInvoices([])
          }
        }
        loadInvoices()
      }, [])

  // Mapeia os campos do backend para o formato esperado pelo frontend
  const today = new Date()
  const mapInvoice = (conta) => ({
    id: conta.id,
    cliente: conta.pessoa?.nome || conta.descricao || "-",
    tipo: conta.tipo || "Cliente",
    invoice: conta.id,
    costCenter: conta.centroCusto || "",
    subCostCenter: conta.subCentroCusto || "",
    company: conta.empresa || "",
    amount: Number(conta.valor) || 0,
    status: conta.pago ? "Recebido" : (new Date(conta.vencimento) < today ? "Vencido" : "Pendente"),
    receivedDate: conta.dataPagamento || null,
    description: conta.descricao || "",
    category: conta.categoria || "",
    diasAtraso: !conta.pago && new Date(conta.vencimento) < today ? Math.ceil((today - new Date(conta.vencimento)) / (1000 * 60 * 60 * 24)) : 0,
    dueDate: conta.vencimento,
    documentImage: conta.documentoUrl || null,
  })

  // CRITICAL FIX: Add safety check before map operation
  // This prevents "TypeError: invoices.map is not a function" if invoices is not an array
  const realInvoices = Array.isArray(invoices) ? invoices.map(mapInvoice) : []

  // Filtrar apenas contas a receber
  const onlyReceber = Array.isArray(realInvoices) ? realInvoices.filter(i => i.tipo === "receber") : []

  // KPIs e filtros usando dados reais
  const totalPendente = onlyReceber.filter(i => i.status === "Pendente").reduce((sum, i) => sum + i.amount, 0)
  const totalVencido = onlyReceber.filter(i => i.status === "Vencido").reduce((sum, i) => sum + i.amount, 0)
  const proximos7Dias = onlyReceber.filter(i => {
    const dueDate = new Date(i.dueDate)
    const diff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))
    return diff >= 0 && diff <= 7 && i.status === "Pendente"
  }).reduce((sum, i) => sum + i.amount, 0)
  const recebidoMes = onlyReceber.filter(i => i.status === "Recebido").reduce((sum, i) => sum + i.amount, 0)

  const filteredInvoices = onlyReceber.filter(invoice => {
    const matchSearch = invoice.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoice.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCategoria = categoriaFilter === "Todas" || invoice.category === categoriaFilter
    return matchSearch && matchCategoria
  })

  const pendentes = filteredInvoices.filter(i => i.status === "Pendente")
  const vencidas = filteredInvoices.filter(i => i.status === "Vencido")
  const recebidas = filteredInvoices.filter(i => i.status === "Recebido")


  // Paginação
  const getPaginatedData = (data) => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return data.slice(startIndex, endIndex)
  }

  const getTotalPages = (data) => Math.ceil(data.length / itemsPerPage)

  const changePage = (newPage) => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentPage(newPage)
      setIsTransitioning(false)
    }, 150)
  }

  const Pagination = ({ data }) => {
    const totalPages = getTotalPages(data)
    if (totalPages <= 1) return null

    return (
      <div className="flex items-center justify-between pt-4">
        <p className="text-sm text-fyn-muted">
          Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, data.length)} a {Math.min(currentPage * itemsPerPage, data.length)} de {data.length} contas
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => changePage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-fyn-text px-3">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => changePage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status) => {
    switch(status) {
      case "Recebido": return "bg-fyn-success/10 text-fyn-success border-fyn-success/20"
      case "Pendente": return "bg-fyn-warning/10 text-fyn-warning border-fyn-warning/20"
      case "Vencido": return "bg-fyn-danger/10 text-fyn-danger border-fyn-danger/20"
      default: return "bg-fyn-border text-fyn-text"
    }
  }

  const InvoiceCard = ({ invoice }) => (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
      setSelectedInvoice(invoice)
      setShowDetail(true)
    }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-fyn-text truncate">{invoice.cliente}</h3>
          <p className="text-xs text-fyn-muted mt-0.5">{invoice.description}</p>
        </div>
        <Badge className={`ml-2 ${getStatusColor(invoice.status)}`}>
          {invoice.status}
        </Badge>
      </div>
      
      {invoice.diasAtraso > 0 && (
        <div className="mb-2 rounded bg-fyn-danger/10 px-2 py-1">
          <p className="text-xs text-fyn-danger font-medium">⚠️ {invoice.diasAtraso} dias em atraso</p>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-3 text-xs mb-3">
        <div>
          <p className="text-fyn-muted">Vencimento</p>
          <p className="text-fyn-text font-medium">{formatDate(invoice.dueDate)}</p>
        </div>
        <div>
          <p className="text-fyn-muted">Centro de Receita</p>
          <p className="text-fyn-text font-medium truncate">{invoice.costCenter}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-fyn-border">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-fyn-accent hover:text-fyn-accent hover:bg-fyn-accent/10 h-auto p-1"
          onClick={(e) => {
            e.stopPropagation()
            setDocumentToView({
              ...invoice,
              documentImage: invoice.documentImage || "https://images.unsplash.com/photo-1554224311-beee460c201f?w=800&q=80"
            })
            setShowDocumentModal(true)
          }}
        >
          <FileText className="mr-1 h-3 w-3" />
          {invoice.invoice}
        </Button>
        <span className="text-lg font-bold text-fyn-text">{formatCurrency(invoice.amount)}</span>
      </div>
    </Card>
  )

  return (
    <div className="space-y-4">
      <PageHeader
        title="Contas a Receber"
        description="Gestão completa de recebimentos de clientes e fornecedores"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button size="sm" onClick={() => setShowNewModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Conta
            </Button>
            {/* Modal Nova Conta (completo) */}
            {showNewModal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between p-4 border-b border-fyn-border">
                    <div>
                      <h2 className="text-lg font-semibold text-fyn-text">Nova Conta a Receber</h2>
                      <p className="text-xs text-fyn-muted mt-0.5">Preencha os dados da conta</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNewModal(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="p-4 overflow-y-auto flex-1">
                    <div className="grid gap-4">
                      {/* Upload de Documento com Preenchimento Automático */}
                      {/* (implementar lógica de upload se necessário) */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-fyn-text">
                          Preenchimento Automático <span className="text-xs text-fyn-muted font-normal">(opcional)</span>
                        </label>
                        <p className="text-xs text-fyn-muted">
                          Envie o documento para preenchimento automático ou preencha manualmente os campos abaixo
                        </p>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            id="file-upload-receber"
                          />
                          <label
                            htmlFor="file-upload-receber"
                            className="border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer block border-fyn-border hover:border-fyn-accent hover:bg-fyn-accent/5"
                          >
                            <div className="space-y-1">
                              <FileText className="h-6 w-6 text-fyn-muted mx-auto" />
                              <p className="text-sm text-fyn-muted">Enviar documento para análise</p>
                              <p className="text-xs text-fyn-text-light">PDF, JPG, PNG até 10MB</p>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Informações Básicas */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-fyn-text">Informações Básicas</h3>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-1.5">
                            {/* Seleção de Cliente */}
                            <label className="text-sm font-medium text-fyn-text">Cliente</label>
                            <Input placeholder="Nome do cliente" value={newCliente} onChange={e => setNewCliente(e.target.value)} />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-fyn-text">Número do Documento</label>
                            <Input placeholder="NF-12345" value={newDocumento} onChange={e => setNewDocumento(e.target.value)} />
                          </div>
                        </div>
                        {/* Forma de Recebimento */}
                        <div className="space-y-1.5 mt-2">
                          <label className="text-sm font-medium text-fyn-text">Forma de Recebimento</label>
                          <Select value={newFormaRecebimento} onValueChange={setNewFormaRecebimento}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a forma de recebimento" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pix">Pix</SelectItem>
                              <SelectItem value="boleto">Boleto</SelectItem>
                              <SelectItem value="cartao">Cartão</SelectItem>
                              <SelectItem value="transferencia">Transferência</SelectItem>
                              <SelectItem value="dinheiro">Dinheiro</SelectItem>
                              <SelectItem value="outra">Outra</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Valores e Datas */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-fyn-text">Valores e Datas</h3>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-fyn-text">Valor</label>
                            <Input type="number" placeholder="0,00" value={newValor} onChange={e => setNewValor(e.target.value.replace(/[^0-9.]/g, ""))} />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-fyn-text">Data de Vencimento</label>
                            <Input type="date" value={newVencimento} onChange={e => setNewVencimento(e.target.value)} />
                          </div>
                        </div>
                      </div>

                      {/* Centros de Receita */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-fyn-text">Centros de Receita</h3>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-fyn-text">Centro de Receita</label>
                            <Select value={newCentroReceita} onValueChange={value => {
                              if (value === "novo") {
                                setNewCentroReceita("");
                              } else {
                                setNewCentroReceita(value);
                                setNewSubCentroReceita("");
                              }
                            }}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="produtos">Vendas de Produtos</SelectItem>
                                <SelectItem value="servicos">Prestação de Serviços</SelectItem>
                                <SelectItem value="financeiras">Receitas Financeiras</SelectItem>
                                <SelectItem value="outras">Outras Receitas</SelectItem>
                                <div className="border-t my-1" />
                                <SelectItem value="novo" className="text-fyn-accent font-semibold flex items-center gap-2">
                                  <span style={{fontWeight:600, color:'#2563eb'}}>+ Novo centro de receita</span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            {newCentroReceita === "novo" && (
                              <Input
                                className="mt-2"
                                placeholder="Nome do novo centro de receita"
                                value={newCentroReceita}
                                onChange={e => setNewCentroReceita(e.target.value)}
                              />
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-fyn-text">Sub-Centro de Receita</label>
                            <Select value={newSubCentroReceita} onValueChange={value => {
                              if (value === "novo") {
                                setNewSubCentroReceita("");
                              } else {
                                setNewSubCentroReceita(value);
                              }
                            }} disabled={!newCentroReceita || newCentroReceita === "novo"}>
                              <SelectTrigger>
                                <SelectValue placeholder={newCentroReceita ? "Selecione" : "Escolha o centro de receita primeiro"} />
                              </SelectTrigger>
                              <SelectContent>
                                {newCentroReceita && newCentroReceita !== "novo" && [
                                  ...(newCentroReceita === "produtos" ? ["Atacado", "Varejo", "E-commerce"] :
                                    newCentroReceita === "servicos" ? ["Consultoria", "Manutenção", "Projetos"] :
                                    newCentroReceita === "financeiras" ? ["Juros", "Investimentos"] :
                                    newCentroReceita === "outras" ? ["Diversos"] : []
                                  ).map(sub => (
                                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                                  ))
                                ]}
                                {newCentroReceita && newCentroReceita !== "novo" && (
                                  <>
                                    <div className="border-t my-1" />
                                    <SelectItem value="novo" className="text-fyn-accent font-semibold flex items-center gap-2">
                                      <span style={{fontWeight:600, color:'#2563eb'}}>+ Novo subcentro de receita</span>
                                    </SelectItem>
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                            {newSubCentroReceita === "novo" && (
                              <Input
                                className="mt-2"
                                placeholder="Nome do novo subcentro de receita"
                                value={newSubCentroReceita}
                                onChange={e => setNewSubCentroReceita(e.target.value)}
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Descrição */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-fyn-text">Descrição</label>
                        <Input placeholder="Descrição da conta" value={newDescricao} onChange={e => setNewDescricao(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="sticky bottom-0 bg-white border-t border-fyn-border p-3 flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowNewModal(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={handleNovaConta}
                      disabled={isSaving}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {isSaving ? "Salvando..." : "Adicionar Conta"}
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="rounded-lg bg-fyn-warning/10 p-2">
              <Clock className="h-4 w-4 text-fyn-warning" />
            </div>
            <span className="text-xs text-fyn-muted">A Receber</span>
          </div>
          <p className="text-2xl font-bold text-fyn-text">{formatCurrency(totalPendente)}</p>
          <p className="text-xs text-fyn-muted mt-1">{pendentes.length} contas</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="rounded-lg bg-fyn-danger/10 p-2">
              <AlertCircle className="h-4 w-4 text-fyn-danger" />
            </div>
            <span className="text-xs text-fyn-muted">Vencido</span>
          </div>
          <p className="text-2xl font-bold text-fyn-danger">{formatCurrency(totalVencido)}</p>
          <p className="text-xs text-fyn-muted mt-1">{vencidas.length} contas</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-xs text-fyn-muted">Próx. 7 dias</span>
          </div>
          <p className="text-2xl font-bold text-fyn-text">{formatCurrency(proximos7Dias)}</p>
          <p className="text-xs text-fyn-muted mt-1">A vencer em breve</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="rounded-lg bg-fyn-success/10 p-2">
              <CheckCircle2 className="h-4 w-4 text-fyn-success" />
            </div>
            <span className="text-xs text-fyn-muted">Recebido este mês</span>
          </div>
          <p className="text-2xl font-bold text-fyn-success">{formatCurrency(recebidoMes)}</p>
          <p className="text-xs text-fyn-muted mt-1">{recebidas.length} contas</p>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fyn-muted" />
            <Input
              placeholder="Buscar por cliente, fatura..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas Categorias</SelectItem>
              <SelectItem value="Vendas de Produtos">Vendas de Produtos</SelectItem>
              <SelectItem value="Prestação de Serviços">Prestação de Serviços</SelectItem>
              <SelectItem value="Receitas Financeiras">Receitas Financeiras</SelectItem>
              <SelectItem value="Outras Receitas">Outras Receitas</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="w-full">
            <Calendar className="mr-2 h-4 w-4" />
            Este Mês
          </Button>
        </div>
      </Card>

      {/* Tabs de Contas */}
      <Tabs defaultValue="pendentes" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pendentes">
            <Clock className="mr-2 h-4 w-4" />
            Pendentes ({pendentes.length})
          </TabsTrigger>
          <TabsTrigger value="vencidas">
            <AlertCircle className="mr-2 h-4 w-4" />
            Vencidas ({vencidas.length})
          </TabsTrigger>
          <TabsTrigger value="recebidas">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Recebidas ({recebidas.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes" className="space-y-3">
          {pendentes.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-fyn-success mx-auto mb-3" />
              <p className="text-sm text-fyn-muted">Nenhuma conta pendente</p>
            </Card>
          ) : (
            <>
              <div className={`grid gap-3 md:grid-cols-2 xl:grid-cols-3 transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                {getPaginatedData(pendentes).map(invoice => <InvoiceCard key={invoice.id} invoice={invoice} />)}
              </div>
              <Pagination data={pendentes} />
            </>
          )}
        </TabsContent>

        <TabsContent value="vencidas" className="space-y-3">
          {vencidas.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-fyn-success mx-auto mb-3" />
              <p className="text-sm text-fyn-muted">Nenhuma conta vencida</p>
            </Card>
          ) : (
            <>
              <div className={`grid gap-3 md:grid-cols-2 xl:grid-cols-3 transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                {getPaginatedData(vencidas).map(invoice => <InvoiceCard key={invoice.id} invoice={invoice} />)}
              </div>
              <Pagination data={vencidas} />
            </>
          )}
        </TabsContent>

        <TabsContent value="recebidas" className="space-y-3">
          {recebidas.length === 0 ? (
            <Card className="p-8 text-center">
              <DollarSign className="h-12 w-12 text-fyn-muted mx-auto mb-3" />
              <p className="text-sm text-fyn-muted">Nenhum recebimento realizado</p>
            </Card>
          ) : (
            <>
              <div className={`grid gap-3 md:grid-cols-2 xl:grid-cols-3 transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                {getPaginatedData(recebidas).map(invoice => <InvoiceCard key={invoice.id} invoice={invoice} />)}
              </div>
              <Pagination data={recebidas} />
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Detalhes */}
      {showDetail && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-fyn-border p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-fyn-text">Detalhes da Conta</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowDetail(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status e Valor */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-fyn-text mb-1">{selectedInvoice.cliente}</h3>
                  <p className="text-sm text-fyn-muted">{selectedInvoice.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-fyn-text">{formatCurrency(selectedInvoice.amount)}</p>
                  <Badge className={`mt-2 ${getStatusColor(selectedInvoice.status)}`}>
                    {selectedInvoice.status}
                  </Badge>
                </div>
              </div>

              {selectedInvoice.diasAtraso > 0 && (
                <div className="rounded-lg bg-fyn-danger/10 border border-fyn-danger/20 p-4">
                  <p className="text-sm font-medium text-fyn-danger">
                    ⚠️ Esta conta está vencida há {selectedInvoice.diasAtraso} dias
                  </p>
                </div>
              )}

              {/* Informações Principais */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-fyn-muted">Data de Vencimento</p>
                  <p className="text-sm font-medium text-fyn-text">{formatDate(selectedInvoice.dueDate)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-fyn-muted">Fatura</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-sm font-medium text-fyn-accent hover:text-fyn-accent hover:bg-fyn-accent/10 h-auto p-1 -ml-1"
                    onClick={() => {
                      setDocumentToView({
                        ...selectedInvoice,
                        documentImage: selectedInvoice.documentImage || "https://images.unsplash.com/photo-1554224311-beee460c201f?w=800&q=80"
                      })
                      setShowDocumentModal(true)
                      setShowDetail(false)
                    }}
                  >
                    <FileText className="mr-1 h-3 w-3" />
                    {selectedInvoice.invoice}
                  </Button>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-fyn-muted">Centro de Receita</p>
                  <p className="text-sm font-medium text-fyn-text">{selectedInvoice.costCenter}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-fyn-muted">Sub-Centro</p>
                  <p className="text-sm font-medium text-fyn-text">{selectedInvoice.subCostCenter}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-fyn-muted">Empresa</p>
                  <p className="text-sm font-medium text-fyn-text">{selectedInvoice.company}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-fyn-muted">Tipo</p>
                  <p className="text-sm font-medium text-fyn-text">{selectedInvoice.tipo}</p>
                </div>
              </div>

              {selectedInvoice.receivedDate && (
                <div className="rounded-lg bg-fyn-success/10 border border-fyn-success/20 p-4">
                  <p className="text-xs text-fyn-muted mb-1">Data do Recebimento</p>
                  <p className="text-sm font-medium text-fyn-success">{formatDate(selectedInvoice.receivedDate)}</p>
                </div>
              )}

              {/* Ações */}
              <div className="flex gap-3 pt-4 border-t border-fyn-border">
                {selectedInvoice.status !== "Recebido" && (
                  <>
                    <Button className="flex-1">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Marcar como Recebido
                    </Button>
                    {selectedInvoice.status === "Vencido" && (
                      <Button variant="outline" className="flex-1">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Cobrar Cliente
                      </Button>
                    )}
                    <Button variant="outline" className="flex-1">
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  </>
                )}
                {selectedInvoice.status === "Recebido" && (
                  <Button variant="outline" className="flex-1">
                    <FileText className="mr-2 h-4 w-4" />
                    Ver Comprovante
                  </Button>
                )}
                <Button variant="outline">
                  <Trash2 className="h-4 w-4 text-fyn-danger" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Visualização do Documento */}
      {showDocumentModal && documentToView && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowDocumentModal(false)}>
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-fyn-border p-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-fyn-text">Documento: {documentToView.invoice}</h2>
                <p className="text-sm text-fyn-muted">{documentToView.cliente}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowDocumentModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {documentToView.documentImage ? (
                <div className="space-y-4">
                  <div className="rounded-lg overflow-hidden border border-fyn-border bg-gray-50">
                    <img 
                      src={documentToView.documentImage} 
                      alt={`Documento ${documentToView.invoice}`}
                      className="w-full h-auto"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-xs text-fyn-muted">Cliente</p>
                      <p className="font-medium text-fyn-text">{documentToView.cliente}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-fyn-muted">Valor</p>
                      <p className="font-medium text-fyn-text">{formatCurrency(documentToView.amount)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-fyn-muted">Vencimento</p>
                      <p className="font-medium text-fyn-text">{formatDate(documentToView.dueDate)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-fyn-muted">Status</p>
                      <Badge className={getStatusColor(documentToView.status)}>{documentToView.status}</Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 text-fyn-muted mx-auto mb-3" />
                  <p className="text-sm text-fyn-muted">Nenhum documento anexado</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-fyn-border p-4">
              <Button variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Baixar Documento
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
