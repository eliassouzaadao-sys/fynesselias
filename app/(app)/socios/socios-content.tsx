"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import { Plus, Users, Wallet, TrendingDown, CreditCard, Loader2, FileText, CheckCircle, History } from "lucide-react"
import { SocioCard } from "./components/SocioCard"
import { NovoSocioModal } from "./components/NovoSocioModal"
import { ProLaboreModal } from "./components/ProLaboreModal"
import { HistoricoModal } from "./components/HistoricoModal"

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
  cartao?: {
    id: number
    nome: string
    ultimos4Digitos: string
    bandeira: string
  } | null
}

export function SociosContent() {
  const [socios, setSocios] = useState<Socio[]>([])
  const [loading, setLoading] = useState(true)
  const [showNovoModal, setShowNovoModal] = useState(false)
  const [socioParaEditar, setSocioParaEditar] = useState<Socio | null>(null)
  const [socioParaProLabore, setSocioParaProLabore] = useState<Socio | null>(null)
  const [gerandoProLabore, setGerandoProLabore] = useState(false)
  const [proLaboreJaGerado, setProLaboreJaGerado] = useState(false)
  const [showHistorico, setShowHistorico] = useState(false)

  const loadSocios = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/socios")
      const data = await res.json()
      setSocios(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error("Erro ao carregar sócios:", e)
      setSocios([])
    } finally {
      setLoading(false)
    }
  }

  const verificarProLaboreGerado = async () => {
    try {
      const res = await fetch("/api/socios/gerar-prolabore")
      const data = await res.json()
      setProLaboreJaGerado(data.jaGerado || false)
    } catch (e) {
      console.error("Erro ao verificar pró-labore:", e)
    }
  }

  const handleGerarProLabore = async () => {
    const hoje = new Date()
    const mesAtual = hoje.toLocaleString('pt-BR', { month: 'long' })
    const anoAtual = hoje.getFullYear()

    if (!confirm(`Deseja gerar o pró-labore de ${mesAtual}/${anoAtual} para todos os sócios?\n\nIsso irá:\n- Criar uma conta a pagar para cada sócio com o valor líquido\n- Zerar os descontos para o próximo mês`)) {
      return
    }

    try {
      setGerandoProLabore(true)
      const res = await fetch("/api/socios/gerar-prolabore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      })

      const data = await res.json()

      if (res.ok) {
        alert(`Pró-labore gerado com sucesso!\n\n${data.contasCriadas?.length || 0} conta(s) criada(s)`)
        setProLaboreJaGerado(true)
        loadSocios() // Recarregar para atualizar os descontos zerados
      } else {
        alert(data.error || "Erro ao gerar pró-labore")
      }
    } catch (e) {
      console.error("Erro ao gerar pró-labore:", e)
      alert("Erro ao gerar pró-labore")
    } finally {
      setGerandoProLabore(false)
    }
  }

  useEffect(() => {
    loadSocios()
    verificarProLaboreGerado()
  }, [])

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
      }
    } catch (e) {
      console.error("Erro ao excluir sócio:", e)
      alert("Erro ao excluir sócio")
    }
  }

  const handleSuccess = () => {
    loadSocios()
    setShowNovoModal(false)
    setSocioParaEditar(null)
  }

  // Calcular KPIs
  const totalProLabore = socios.reduce((acc, s) => acc + s.proLaboreBase, 0)
  const totalDescontos = socios.reduce((acc, s) => acc + s.gastosCartao, 0)
  const totalLiquido = totalProLabore - totalDescontos
  const qtdSocios = socios.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sócios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie sócios e pró-labore com descontos automáticos
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
          <Button
            size="sm"
            variant={proLaboreJaGerado ? "outline" : "default"}
            onClick={handleGerarProLabore}
            disabled={gerandoProLabore || socios.length === 0}
          >
            {gerandoProLabore ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : proLaboreJaGerado ? (
              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            {proLaboreJaGerado ? "Pró-labore Gerado" : "Gerar Pró-labore do Mês"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowNovoModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Sócio
          </Button>
        </div>
      </div>

      {/* KPIs */}
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
              <p className="text-xs text-muted-foreground">Total Pró-labore Bruto</p>
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
              <p className="text-xs text-muted-foreground">Total Pró-labore Líquido</p>
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
            Adicione sócios para gerenciar o pró-labore com descontos automáticos de cartão.
          </p>
          <Button onClick={() => setShowNovoModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Sócio
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {socios.map((socio) => (
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
