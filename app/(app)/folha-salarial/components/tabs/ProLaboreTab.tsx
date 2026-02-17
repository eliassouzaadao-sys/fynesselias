"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import { Plus, Users, Wallet, TrendingDown, CreditCard, Loader2, History } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SocioCard } from "../socios/SocioCard"
import { NovoSocioModal } from "../socios/NovoSocioModal"
import { ProLaboreModal } from "../socios/ProLaboreModal"
import { HistoricoModal } from "../socios/HistoricoModal"

interface GastoDetalhado {
  id: number | string
  descricao: string
  valor: number
  dataPagamento?: string
  tipo?: 'previsto' | 'real'
}

interface Socio {
  id: number
  nome: string
  sigla: string
  cpfSocio: string
  previsto: number
  realizado: number
  proLaboreBase: number
  gastosCartao: number
  proLaboreLiquido: number
  descontosPrevistos?: number
  descontosReais?: number
  gastosDetalhados?: GastoDetalhado[]
  cartao?: {
    id: number
    nome: string
    ultimos4Digitos: string
    bandeira: string
  } | null
}

interface ProLaboreTabProps {
  socios: Socio[]
  onRefresh: () => void
  dataInicio?: string
  dataFim?: string
}

export function ProLaboreTab({ socios: initialSocios, onRefresh, dataInicio, dataFim }: ProLaboreTabProps) {
  const [socios, setSocios] = useState<Socio[]>(initialSocios)
  const [loading, setLoading] = useState(false)
  const [showNovoModal, setShowNovoModal] = useState(false)
  const [socioParaEditar, setSocioParaEditar] = useState<Socio | null>(null)
  const [socioParaProLabore, setSocioParaProLabore] = useState<Socio | null>(null)
  const [showHistorico, setShowHistorico] = useState(false)

  // Filtro por sócio
  const [filtroSocio, setFiltroSocio] = useState<string>("todos")

  // Atualizar lista quando props mudam
  useEffect(() => {
    setSocios(initialSocios)
  }, [initialSocios])

  const loadSocios = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (dataInicio) params.append('dataInicio', dataInicio)
      if (dataFim) params.append('dataFim', dataFim)
      const res = await fetch(`/api/socios?${params.toString()}`)
      const data = await res.json()
      setSocios(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error("Erro ao carregar sócios:", e)
      setSocios([])
    } finally {
      setLoading(false)
    }
  }

  const handleEditar = (socio: Socio) => {
    setSocioParaEditar(socio)
    setShowNovoModal(true)
  }

  const handleVerProLabore = (socio: Socio) => {
    setSocioParaProLabore(socio)
  }

  const handleExcluir = async (socioId: number) => {
    if (!confirm("Tem certeza que deseja desativar este sócio?")) return

    try {
      const res = await fetch(`/api/socios?id=${socioId}`, { method: "DELETE" })
      if (res.ok) {
        loadSocios()
        onRefresh()
      }
    } catch (e) {
      console.error("Erro ao excluir sócio:", e)
      alert("Erro ao excluir sócio")
    }
  }

  const handleSuccess = () => {
    loadSocios()
    onRefresh()
    setShowNovoModal(false)
    setSocioParaEditar(null)
  }

  // Filtrar sócios pelo dropdown
  const sociosFiltrados = socios.filter(s => {
    if (filtroSocio !== "todos" && s.id.toString() !== filtroSocio) return false
    return true
  })

  // Calcular KPIs da tab
  const totalProLabore = socios.reduce((acc, s) => acc + s.proLaboreBase, 0)
  const totalDescontos = socios.reduce((acc, s) => acc + s.gastosCartao, 0)
  const totalLiquido = totalProLabore - totalDescontos
  const qtdSocios = socios.length

  return (
    <div className="space-y-6">
      {/* Header da Tab */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Pró-labore de Sócios</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie pró-labore com descontos automáticos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowHistorico(true)}
          >
            <History className="mr-2 h-4 w-4" />
            Histórico
          </Button>
          <Button size="sm" onClick={() => setShowNovoModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Sócio
          </Button>
        </div>
      </div>

      {/* Filtro por sócio */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Sócio:</span>
        <Select value={filtroSocio} onValueChange={setFiltroSocio}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Selecione um sócio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {socios.map((s) => (
              <SelectItem key={s.id} value={s.id.toString()}>
                {s.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPIs da Tab */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total de Sócios</p>
              <p className="text-lg font-bold text-foreground">{qtdSocios}</p>
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
              <p className="text-lg font-bold text-foreground">{formatCurrency(totalProLabore)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Descontos</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(totalDescontos)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <CreditCard className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Líquido</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(totalLiquido)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Lista de Sócios */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : socios.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Nenhum sócio cadastrado</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Adicione sócios para gerenciar o pró-labore com descontos automáticos.
          </p>
          <Button onClick={() => setShowNovoModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Sócio
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sociosFiltrados.map((socio) => (
            <SocioCard
              key={socio.id}
              socio={socio}
              onEdit={() => handleEditar(socio)}
              onDelete={() => handleExcluir(socio.id)}
              onViewProLabore={() => handleVerProLabore(socio)}
            />
          ))}
        </div>
      )}

      {/* Modal Novo/Editar Sócio */}
      {showNovoModal && (
        <NovoSocioModal
          socio={socioParaEditar}
          onClose={() => {
            setShowNovoModal(false)
            setSocioParaEditar(null)
          }}
          onSuccess={handleSuccess}
        />
      )}

      {/* Modal Pró-labore */}
      {socioParaProLabore && (
        <ProLaboreModal
          socio={socioParaProLabore}
          onClose={() => setSocioParaProLabore(null)}
        />
      )}

      {/* Modal Histórico */}
      {showHistorico && (
        <HistoricoModal
          onClose={() => setShowHistorico(false)}
        />
      )}
    </div>
  )
}
