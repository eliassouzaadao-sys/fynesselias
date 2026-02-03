"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/format"
import { X, Loader2, Calendar, Wallet, TrendingDown, CreditCard, CheckCircle, Clock } from "lucide-react"

interface Socio {
  id: number
  nome: string
  sigla: string
  cpfSocio: string
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

interface HistoricoItem {
  mes: number
  ano: number
  proLaboreBase: number
  descontoCartao: number
  proLaboreLiquido: number
  faturaPaga: boolean
  faturaId: number | null
  dataVencimento: string | null
}

interface ProLaboreModalProps {
  socio: Socio
  onClose: () => void
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

export function ProLaboreModal({ socio, onClose }: ProLaboreModalProps) {
  const [historico, setHistorico] = useState<HistoricoItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistorico = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/socios/${socio.id}/prolabore`)
        const data = await res.json()
        setHistorico(data.historico || [])
      } catch (e) {
        console.error("Erro ao carregar histórico:", e)
        setHistorico([])
      } finally {
        setLoading(false)
      }
    }
    fetchHistorico()
  }, [socio.id])

  const formatCPF = (cpf: string) => {
    if (!cpf) return "-"
    const cleaned = cpf.replace(/\D/g, "")
    if (cleaned.length !== 11) return cpf
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Pró-labore - {socio.nome}
            </h2>
            <p className="text-sm text-muted-foreground">
              CPF: {formatCPF(socio.cpfSocio)}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Resumo atual */}
        <div className="p-4 bg-gray-50 border-b border-border">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Wallet className="h-4 w-4 text-green-600" />
                <span className="text-xs text-muted-foreground">Bruto</span>
              </div>
              <p className="text-lg font-bold text-green-700">
                {formatCurrency(socio.proLaboreBase)}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-xs text-muted-foreground">Descontos</span>
              </div>
              <p className="text-lg font-bold text-red-700">
                -{formatCurrency(socio.gastosCartao)}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Wallet className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-muted-foreground">Líquido</span>
              </div>
              <p className="text-lg font-bold text-blue-700">
                {formatCurrency(socio.proLaboreLiquido)}
              </p>
            </div>
          </div>

          {/* Cartão vinculado */}
          {socio.cartao && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              <span>
                Cartão vinculado: {socio.cartao.nome} (**** {socio.cartao.ultimos4Digitos})
              </span>
            </div>
          )}
        </div>

        {/* Histórico */}
        <div className="p-4 overflow-y-auto flex-1">
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Histórico de Pró-labore
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : historico.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum histórico disponível</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historico.map((item, index) => (
                <Card
                  key={index}
                  className={`p-4 ${item.faturaPaga ? "bg-green-50" : "bg-yellow-50"}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {MESES[item.mes - 1]}/{item.ano}
                      </span>
                      {item.faturaPaga ? (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3" />
                          Pago
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">
                          <Clock className="h-3 w-3" />
                          Aberto
                        </span>
                      )}
                    </div>
                    {item.dataVencimento && (
                      <span className="text-xs text-muted-foreground">
                        Venc: {new Date(item.dataVencimento).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Bruto</p>
                      <p className="font-medium text-green-700">
                        {formatCurrency(item.proLaboreBase)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Desconto Cartão</p>
                      <p className="font-medium text-red-700">
                        -{formatCurrency(item.descontoCartao)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Líquido</p>
                      <p className="font-bold text-blue-700">
                        {formatCurrency(item.proLaboreLiquido)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </Card>
    </div>
  )
}
