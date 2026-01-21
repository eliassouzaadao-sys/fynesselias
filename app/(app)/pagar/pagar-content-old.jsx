"use client"

import { useState } from "react"
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
  TrendingDown, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  Edit,
  Trash2,
  FileText,
  DollarSign,
  X
} from "lucide-react"

// Mock data
const mockBills = [
  {
    id: "1",
    dueDate: "2026-01-15",
    fornecedor: "Fornecedor Alpha",
    tipo: "Fornecedor",
    document: "NF-12345",
    costCenter: "Operações",
    subCostCenter: "Matéria Prima",
    company: "Tech Solutions",
    amount: 4500,
    status: "Pendente",
    paymentDate: null,
    description: "Compra de material para produção",
    category: "Fornecedores",
  },
  {
    id: "2",
    dueDate: "2026-01-18",
    fornecedor: "Distribuidora Beta",
    tipo: "Fornecedor",
    document: "BOL-8821",
    costCenter: "Comercial",
    subCostCenter: "Mercadorias",
    company: "Tech Solutions",
    amount: 8200,
    status: "Pendente",
    paymentDate: null,
    description: "Estoque de mercadorias",
    category: "Fornecedores",
  },
  {
    id: "3",
    dueDate: "2026-01-10",
    fornecedor: "Energia XYZ",
    tipo: "Fornecedor",
    document: "FAT-2026-01",
    costCenter: "Despesas Administrativas",
    subCostCenter: "Energia Elétrica",
    company: "Tech Solutions",
    amount: 1250,
    status: "Vencido",
    paymentDate: null,
    description: "Conta de luz - Janeiro",
    category: "Despesas Administrativas",
  },
  {
    id: "4",
    dueDate: "2026-01-20",
    fornecedor: "Atacadão Sul",
    tipo: "Cliente",
    document: "DEV-001",
    costCenter: "Comercial",
    subCostCenter: "Devoluções",
    company: "Tech Solutions",
    amount: 2800,
    status: "Pendente",
    paymentDate: null,
    description: "Devolução de mercadoria com defeito",
    category: "Fornecedores",
  },
  {
    id: "5",
    dueDate: "2026-01-08",
    fornecedor: "Aluguel Imóveis",
    tipo: "Fornecedor",
    document: "REC-2026-01",
    costCenter: "Despesas Administrativas",
    subCostCenter: "Aluguel",
    company: "Tech Solutions",
    amount: 3500,
    status: "Pago",
    paymentDate: "2026-01-08",
    description: "Aluguel mensal - Janeiro",
    category: "Despesas Administrativas",
  },
  {
    id: "6",
    dueDate: "2026-01-22",
    fornecedor: "Material Office",
    tipo: "Fornecedor",
    document: "NF-55123",
    costCenter: "Despesas Administrativas",
    subCostCenter: "Material de Escritório",
    company: "Comércio ABC",
    amount: 890,
    status: "Pendente",
    paymentDate: null,
    description: "Material de escritório",
    category: "Despesas Administrativas",
  },
  {
    id: "7",
    dueDate: "2026-01-12",
    fornecedor: "Salários Funcionários",
    tipo: "Fornecedor",
    document: "FOL-2026-01",
    costCenter: "Folha de Pagamento",
    subCostCenter: "Salários",
    company: "Tech Solutions",
    amount: 22000,
    status: "Pago",
    paymentDate: "2026-01-12",
    description: "Folha de pagamento - Janeiro",
    category: "Folha de Pagamento",
  },
  {
    id: "8",
    dueDate: "2026-01-25",
    fornecedor: "Receita Federal",
    tipo: "Fornecedor",
    document: "DARF-001",
    costCenter: "Impostos e Taxas",
    subCostCenter: "ICMS",
    company: "Tech Solutions",
    amount: 6800,
    status: "Pendente",
    paymentDate: null,
    description: "ICMS - Janeiro/2026",
    category: "Impostos e Taxas",
  },
]

export function PagarContent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("Todos")
  const [categoriaFilter, setCategoriaFilter] = useState("Todas")
  const [selectedBill, setSelectedBill] = useState(null)
  const [showDetail, setShowDetail] = useState(false)

  // Calcular KPIs
  const today = new Date()
  const totalPendente = mockBills
    .filter(b => b.status === "Pendente")
    .reduce((sum, b) => sum + b.amount, 0)
  
  const totalVencido = mockBills
    .filter(b => b.status === "Vencido")
    .reduce((sum, b) => sum + b.amount, 0)
  
  const proximos7Dias = mockBills
    .filter(b => {
      const dueDate = new Date(b.dueDate)
      const diff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))
      return diff >= 0 && diff <= 7 && b.status === "Pendente"
    })
    .reduce((sum, b) => sum + b.amount, 0)
  
  const pagoMes = mockBills
    .filter(b => b.status === "Pago")
    .reduce((sum, b) => sum + b.amount, 0)

  // Filtrar contas
  const filteredBills = mockBills.filter(bill => {
    const matchSearch = bill.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       bill.document.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       bill.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = statusFilter === "Todos" || bill.status === statusFilter
    const matchCategoria = categoriaFilter === "Todas" || bill.category === categoriaFilter
    return matchSearch && matchStatus && matchCategoria
  })

  // Agrupar por status
  const pendentes = filteredBills.filter(b => b.status === "Pendente")
  const vencidas = filteredBills.filter(b => b.status === "Vencido")
  const pagas = filteredBills.filter(b => b.status === "Pago")

  const getStatusColor = (status) => {
    switch(status) {
      case "Pago": return "bg-fyn-success/10 text-fyn-success border-fyn-success/20"
      case "Pendente": return "bg-fyn-warning/10 text-fyn-warning border-fyn-warning/20"
      case "Vencido": return "bg-fyn-danger/10 text-fyn-danger border-fyn-danger/20"
      default: return "bg-fyn-border text-fyn-text"
    }
  }

  const BillCard = ({ bill }) => (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
      setSelectedBill(bill)
      setShowDetail(true)
    }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-fyn-text truncate">{bill.fornecedor}</h3>
          <p className="text-xs text-fyn-muted mt-0.5">{bill.description}</p>
        </div>
        <Badge className={`ml-2 ${getStatusColor(bill.status)}`}>
          {bill.status}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-xs mb-3">
        <div>
          <p className="text-fyn-muted">Vencimento</p>
          <p className="text-fyn-text font-medium">{formatDate(bill.dueDate)}</p>
        </div>
        <div>
          <p className="text-fyn-muted">Centro de Custo</p>
          <p className="text-fyn-text font-medium truncate">{bill.costCenter}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-fyn-border">
        <span className="text-xs text-fyn-muted">{bill.document}</span>
        <span className="text-lg font-bold text-fyn-text">{formatCurrency(bill.amount)}</span>
      </div>
    </Card>
  )

  return (
    <div className="space-y-4">
      <PageHeader
        title="Contas a Pagar"
        description="Gestão completa de pagamentos a fornecedores e clientes"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nova Conta
            </Button>
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
            <span className="text-xs text-fyn-muted">Pendente</span>
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
            <span className="text-xs text-fyn-muted">Pago este mês</span>
          </div>
          <p className="text-2xl font-bold text-fyn-success">{formatCurrency(pagoMes)}</p>
          <p className="text-xs text-fyn-muted mt-1">{pagas.length} contas</p>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fyn-muted" />
            <Input
              placeholder="Buscar por fornecedor, documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os Status</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Vencido">Vencido</SelectItem>
              <SelectItem value="Pago">Pago</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas Categorias</SelectItem>
              <SelectItem value="Fornecedores">Fornecedores</SelectItem>
              <SelectItem value="Folha de Pagamento">Folha de Pagamento</SelectItem>
              <SelectItem value="Impostos e Taxas">Impostos e Taxas</SelectItem>
              <SelectItem value="Despesas Administrativas">Desp. Administrativas</SelectItem>
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
          <TabsTrigger value="pagas">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Pagas ({pagas.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes" className="space-y-3">
          {pendentes.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-fyn-success mx-auto mb-3" />
              <p className="text-sm text-fyn-muted">Nenhuma conta pendente</p>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {pendentes.map(bill => <BillCard key={bill.id} bill={bill} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="vencidas" className="space-y-3">
          {vencidas.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-fyn-success mx-auto mb-3" />
              <p className="text-sm text-fyn-muted">Nenhuma conta vencida</p>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {vencidas.map(bill => <BillCard key={bill.id} bill={bill} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pagas" className="space-y-3">
          {pagas.length === 0 ? (
            <Card className="p-8 text-center">
              <DollarSign className="h-12 w-12 text-fyn-muted mx-auto mb-3" />
              <p className="text-sm text-fyn-muted">Nenhum pagamento realizado</p>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {pagas.map(bill => <BillCard key={bill.id} bill={bill} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Detalhes */}
      {showDetail && selectedBill && (
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
                  <h3 className="text-xl font-bold text-fyn-text mb-1">{selectedBill.fornecedor}</h3>
                  <p className="text-sm text-fyn-muted">{selectedBill.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-fyn-text">{formatCurrency(selectedBill.amount)}</p>
                  <Badge className={`mt-2 ${getStatusColor(selectedBill.status)}`}>
                    {selectedBill.status}
                  </Badge>
                </div>
              </div>

              {/* Informações Principais */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-fyn-muted">Data de Vencimento</p>
                  <p className="text-sm font-medium text-fyn-text">{formatDate(selectedBill.dueDate)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-fyn-muted">Documento</p>
                  <p className="text-sm font-medium text-fyn-text">{selectedBill.document}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-fyn-muted">Centro de Custo</p>
                  <p className="text-sm font-medium text-fyn-text">{selectedBill.costCenter}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-fyn-muted">Sub-Centro</p>
                  <p className="text-sm font-medium text-fyn-text">{selectedBill.subCostCenter}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-fyn-muted">Empresa</p>
                  <p className="text-sm font-medium text-fyn-text">{selectedBill.company}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-fyn-muted">Tipo</p>
                  <p className="text-sm font-medium text-fyn-text">{selectedBill.tipo}</p>
                </div>
              </div>

              {selectedBill.paymentDate && (
                <div className="rounded-lg bg-fyn-success/10 border border-fyn-success/20 p-4">
                  <p className="text-xs text-fyn-muted mb-1">Data do Pagamento</p>
                  <p className="text-sm font-medium text-fyn-success">{formatDate(selectedBill.paymentDate)}</p>
                </div>
              )}

              {/* Ações */}
              <div className="flex gap-3 pt-4 border-t border-fyn-border">
                {selectedBill.status !== "Pago" && (
                  <>
                    <Button className="flex-1">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Marcar como Pago
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  </>
                )}
                {selectedBill.status === "Pago" && (
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
    </div>
  )
}
