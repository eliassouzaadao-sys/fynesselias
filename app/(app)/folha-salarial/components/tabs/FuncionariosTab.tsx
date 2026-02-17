"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import { Plus, Briefcase, Wallet, TrendingDown, Building2, Loader2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FuncionarioCard } from "../funcionarios/FuncionarioCard"
import { NovoFuncionarioModal } from "../funcionarios/NovoFuncionarioModal"
import { HistoricoFolhaModal } from "../funcionarios/HistoricoFolhaModal"

interface Funcionario {
  id: number
  nome: string
  cpf: string
  cargo: string | null
  status: string
  salarioBruto: number
  salarioLiquido: number
  custoEmpresa: number
  descontosTotal: number
  inss: number
  irrf: number
  fgts: number
  valeTransporte: number
  valeRefeicao: number
  planoSaude: number
  pago: boolean
}

interface FuncionariosTabProps {
  funcionarios: Funcionario[]
  onRefresh: () => void
}

export function FuncionariosTab({ funcionarios: initialFuncionarios, onRefresh }: FuncionariosTabProps) {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>(initialFuncionarios)
  const [loading, setLoading] = useState(false)
  const [showNovoModal, setShowNovoModal] = useState(false)
  const [funcionarioParaEditar, setFuncionarioParaEditar] = useState<any>(null)
  const [funcionarioParaHistorico, setFuncionarioParaHistorico] = useState<Funcionario | null>(null)

  // Filtro por funcionário
  const [filtroFuncionario, setFiltroFuncionario] = useState<string>("todos")

  // Atualizar lista quando props mudam
  useEffect(() => {
    setFuncionarios(initialFuncionarios)
  }, [initialFuncionarios])

  const loadFuncionarios = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/funcionarios')
      const data = await res.json()
      setFuncionarios(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error("Erro ao carregar funcionários:", e)
      setFuncionarios([])
    } finally {
      setLoading(false)
    }
  }

  const handleEditar = (funcionario: Funcionario) => {
    setFuncionarioParaEditar(funcionario)
    setShowNovoModal(true)
  }

  const handleVerHistorico = (funcionario: Funcionario) => {
    setFuncionarioParaHistorico(funcionario)
  }

  const handleExcluir = async (funcionarioId: number) => {
    if (!confirm("Tem certeza que deseja excluir este funcionário? Esta acao nao pode ser desfeita.")) return

    try {
      const res = await fetch(`/api/funcionarios?id=${funcionarioId}`, { method: "DELETE" })
      if (res.ok) {
        loadFuncionarios()
        onRefresh()
      }
    } catch (e) {
      console.error("Erro ao excluir funcionário:", e)
      alert("Erro ao excluir funcionário")
    }
  }

  const handleSuccess = () => {
    loadFuncionarios()
    onRefresh()
    setShowNovoModal(false)
    setFuncionarioParaEditar(null)
  }

  // Filtrar funcionários pelo dropdown
  const funcionariosFiltrados = funcionarios.filter(f => {
    if (filtroFuncionario !== "todos" && f.id.toString() !== filtroFuncionario) return false
    return true
  })

  // Filtrar apenas funcionários ativos para KPIs
  const funcionariosAtivos = funcionarios.filter(f => f.status === 'ativo')

  // Calcular KPIs da tab
  const qtdFuncionarios = funcionariosAtivos.length
  const totalBruto = funcionariosAtivos.reduce((acc, f) => acc + f.salarioBruto, 0)
  const totalLiquido = funcionariosAtivos.reduce((acc, f) => acc + f.salarioLiquido, 0)
  const totalCustoEmpresa = funcionariosAtivos.reduce((acc, f) => acc + f.custoEmpresa, 0)

  return (
    <div className="space-y-6">
      {/* Header da Tab */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Funcionários</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie a folha de pagamento dos funcionários
          </p>
        </div>
        <Button size="sm" onClick={() => setShowNovoModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Funcionário
        </Button>
      </div>

      {/* Filtro por funcionário */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Funcionário:</span>
        <Select value={filtroFuncionario} onValueChange={setFiltroFuncionario}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Selecione um funcionário" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {funcionarios.map((f) => (
              <SelectItem key={f.id} value={f.id.toString()}>
                {f.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPIs da Tab */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100">
              <Briefcase className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Funcionários Ativos</p>
              <p className="text-lg font-bold text-foreground">{qtdFuncionarios}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <Wallet className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Bruto</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(totalBruto)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <TrendingDown className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Líquido</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(totalLiquido)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Building2 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Custo Empresa</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(totalCustoEmpresa)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Lista de Funcionários */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : funcionarios.length === 0 ? (
        <Card className="p-12 text-center">
          <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Nenhum funcionário cadastrado</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Adicione funcionários para gerenciar a folha de pagamento.
          </p>
          <Button onClick={() => setShowNovoModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Funcionário
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {funcionariosFiltrados.map((funcionario) => (
            <FuncionarioCard
              key={funcionario.id}
              funcionario={funcionario}
              onEdit={() => handleEditar(funcionario)}
              onDelete={() => handleExcluir(funcionario.id)}
              onViewFolha={() => handleVerHistorico(funcionario)}
            />
          ))}
        </div>
      )}

      {/* Modal Novo/Editar Funcionário */}
      {showNovoModal && (
        <NovoFuncionarioModal
          funcionario={funcionarioParaEditar}
          onClose={() => {
            setShowNovoModal(false)
            setFuncionarioParaEditar(null)
          }}
          onSuccess={handleSuccess}
        />
      )}

      {/* Modal Histórico de Folha */}
      {funcionarioParaHistorico && (
        <HistoricoFolhaModal
          funcionario={funcionarioParaHistorico}
          onClose={() => setFuncionarioParaHistorico(null)}
        />
      )}
    </div>
  )
}
