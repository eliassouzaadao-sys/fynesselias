"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/format"
import { Loader2, Calendar, Wallet, TrendingDown, CreditCard, CheckCircle, Clock, DollarSign, Receipt, RefreshCw } from "lucide-react"

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

interface DetalheDesconto {
  id: string
  descricao: string
  valor: number
  tipo: 'recorrente' | 'conta_pendente' | 'conta_paga'
  vencimento?: string
  dataPagamento?: string
}

interface HistoricoItem {
  mes: number
  ano: number
  proLaboreBase: number
  descontosPrevistos?: number
  descontosReais?: number
  descontoCartao: number
  proLaboreLiquido: number
  faturaPaga: boolean
  faturaId: number | null
  dataVencimento: string | null
  detalhamentoPrevistos?: DetalheDesconto[]
  detalhamentoReais?: DetalheDesconto[]
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
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Pró-labore - {socio.nome}
          </DialogTitle>
          <DialogDescription>
            CPF: {formatCPF(socio.cpfSocio)}
          </DialogDescription>
        </DialogHeader>

        {/* Resumo atual */}
        <div className="px-6 py-4 bg-muted/30 border-y">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-muted-foreground">Resumo Atual</span>
            <Separator className="flex-1" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-xs text-muted-foreground">Bruto</span>
              </div>
              <p className="text-lg font-bold text-green-700 dark:text-green-400">
                {formatCurrency(socio.proLaboreBase)}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-xs text-muted-foreground">Descontos</span>
              </div>
              <p className="text-lg font-bold text-red-700 dark:text-red-400">
                -{formatCurrency(socio.gastosCartao)}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs text-muted-foreground">Líquido</span>
              </div>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
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
        <div className="flex-1 overflow-hidden">
          <div className="px-6 pt-4 pb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Histórico de Pró-labore</span>
          </div>

          <ScrollArea className="h-[280px] px-6">
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
              <div className="space-y-4 pb-4">
                {historico.map((item, index) => (
                  <Card key={index} className="overflow-hidden">
                    {/* Header do período */}
                    <div
                      className={`p-4 ${
                        item.faturaPaga ? "bg-green-50 dark:bg-green-900/20" : "bg-yellow-50 dark:bg-yellow-900/20"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {MESES[item.mes - 1]}/{item.ano}
                          </span>
                          {item.faturaPaga ? (
                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-800/50 dark:text-green-300">
                              <CheckCircle className="h-3 w-3" />
                              Pago
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-800/50 dark:text-yellow-300">
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

                      {/* Resumo do balancete */}
                      <div className="grid grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Bruto</p>
                          <p className="font-medium text-green-700 dark:text-green-400">
                            {formatCurrency(item.proLaboreBase)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Previstos</p>
                          <p className="font-medium text-orange-600 dark:text-orange-400">
                            -{formatCurrency(item.descontosPrevistos || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Reais</p>
                          <p className="font-medium text-red-700 dark:text-red-400">
                            -{formatCurrency(item.descontosReais || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Líquido</p>
                          <p className="font-bold text-blue-700 dark:text-blue-400">
                            {formatCurrency(item.proLaboreLiquido)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Detalhamento sempre visível */}
                    <div className="border-t border-border p-4 bg-muted/20 space-y-4">
                      {/* Descontos Previstos */}
                      {item.detalhamentoPrevistos && item.detalhamentoPrevistos.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Receipt className="h-4 w-4 text-orange-600" />
                            <span className="text-sm font-medium text-foreground">
                              Descontos Previstos ({item.detalhamentoPrevistos.length})
                            </span>
                          </div>
                          <div className="space-y-1 pl-6">
                            {item.detalhamentoPrevistos.map((d) => (
                              <div key={d.id} className="flex justify-between text-xs py-1 px-2 rounded bg-orange-50 dark:bg-orange-900/20">
                                <div className="flex items-center gap-2">
                                  {d.tipo === 'recorrente' && (
                                    <RefreshCw className="h-3 w-3 text-orange-500" />
                                  )}
                                  <span className="text-foreground truncate max-w-[200px]">{d.descricao}</span>
                                  {d.tipo === 'recorrente' && (
                                    <span className="text-[10px] px-1 py-0.5 bg-orange-100 text-orange-600 rounded">
                                      Recorrente
                                    </span>
                                  )}
                                </div>
                                <span className="text-orange-600 font-medium">-{formatCurrency(d.valor)}</span>
                              </div>
                            ))}
                            <div className="flex justify-between text-xs py-1.5 px-2 mt-1 border-t border-orange-200 dark:border-orange-800">
                              <span className="font-medium text-muted-foreground">Subtotal Previstos</span>
                              <span className="font-semibold text-orange-600">-{formatCurrency(item.descontosPrevistos || 0)}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Descontos Reais */}
                      {item.detalhamentoReais && item.detalhamentoReais.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="h-4 w-4 text-red-600" />
                            <span className="text-sm font-medium text-foreground">
                              Descontos Realizados ({item.detalhamentoReais.length})
                            </span>
                          </div>
                          <div className="space-y-1 pl-6">
                            {item.detalhamentoReais.map((d) => (
                              <div key={d.id} className="flex justify-between text-xs py-1 px-2 rounded bg-red-50 dark:bg-red-900/20">
                                <span className="text-foreground truncate max-w-[200px]">{d.descricao}</span>
                                <span className="text-red-600 font-medium">-{formatCurrency(d.valor)}</span>
                              </div>
                            ))}
                            <div className="flex justify-between text-xs py-1.5 px-2 mt-1 border-t border-red-200 dark:border-red-800">
                              <span className="font-medium text-muted-foreground">Subtotal Realizados</span>
                              <span className="font-semibold text-red-600">-{formatCurrency(item.descontosReais || 0)}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Resumo Final */}
                      <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Bruto</p>
                            <p className="font-semibold text-green-600">{formatCurrency(item.proLaboreBase)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Total Descontos</p>
                            <p className="font-semibold text-red-600">
                              -{formatCurrency((item.descontosPrevistos || 0) + (item.descontosReais || 0))}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Líquido Final</p>
                            <p className="font-bold text-primary">{formatCurrency(item.proLaboreLiquido)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Sem detalhes */}
                      {(!item.detalhamentoPrevistos || item.detalhamentoPrevistos.length === 0) &&
                       (!item.detalhamentoReais || item.detalhamentoReais.length === 0) && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          Nenhum desconto detalhado registrado neste período
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t">
          <Button variant="outline" onClick={onClose} className="w-full">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
