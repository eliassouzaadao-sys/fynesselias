"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import { X, Loader2, Calendar, TrendingDown, Wallet, CheckCircle, Clock, ChevronDown, ChevronUp } from "lucide-react"

interface HistoricoItem {
  id: number
  mesReferencia: number
  anoReferencia: number
  periodo: string
  socioId: number
  socioNome: string
  socioCpf: string | null
  proLaboreBase: number
  totalDescontos: number
  proLaboreLiquido: number
  descontos: Array<{
    id: number
    descricao: string
    valor: number
    dataPagamento: string
  }>
  contaGeradaId: number | null
  pago: boolean
  dataPagamento: string | null
  criadoEm: string
}

interface HistoricoModalProps {
  onClose: () => void
}

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

export function HistoricoModal({ onClose }: HistoricoModalProps) {
  const [loading, setLoading] = useState(true)
  const [historico, setHistorico] = useState<HistoricoItem[]>([])
  const [porMes, setPorMes] = useState<{ [key: string]: HistoricoItem[] }>({})
  const [totais, setTotais] = useState({
    totalBase: 0,
    totalDescontos: 0,
    totalLiquido: 0,
    quantidadeRegistros: 0,
  })
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear())
  const [expandido, setExpandido] = useState<string | null>(null)

  const loadHistorico = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/socios/historico?ano=${anoSelecionado}`)
      const data = await res.json()

      setHistorico(data.historico || [])
      setPorMes(data.porMes || {})
      setTotais(data.totais || { totalBase: 0, totalDescontos: 0, totalLiquido: 0, quantidadeRegistros: 0 })
    } catch (e) {
      console.error("Erro ao carregar histórico:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistorico()
  }, [anoSelecionado])

  const toggleExpandir = (periodo: string) => {
    setExpandido(expandido === periodo ? null : periodo)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">Histórico de Pró-labore</h2>
              <p className="text-sm text-muted-foreground">Pagamentos gerados por mês</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Filtros */}
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-foreground">Ano:</label>
            <select
              value={anoSelecionado}
              onChange={(e) => setAnoSelecionado(parseInt(e.target.value))}
              className="px-3 py-1.5 border border-border rounded-md bg-background text-sm"
            >
              {[2024, 2025, 2026, 2027].map(ano => (
                <option key={ano} value={ano}>{ano}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : Object.keys(porMes).length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Nenhum histórico encontrado</h3>
              <p className="text-sm text-muted-foreground">
                Não há registros de pró-labore para {anoSelecionado}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Totais do Ano */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="p-4 bg-green-50 border-green-200">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-xs text-green-600/80">Total Bruto</p>
                      <p className="text-lg font-bold text-green-700">{formatCurrency(totais.totalBase)}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 bg-red-50 border-red-200">
                  <div className="flex items-center gap-3">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-xs text-red-600/80">Total Descontos</p>
                      <p className="text-lg font-bold text-red-700">{formatCurrency(totais.totalDescontos)}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-blue-600/80">Total Líquido</p>
                      <p className="text-lg font-bold text-blue-700">{formatCurrency(totais.totalLiquido)}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Lista por Mês */}
              {Object.entries(porMes)
                .sort(([a], [b]) => {
                  const [mesA, anoA] = a.split('/').map(Number)
                  const [mesB, anoB] = b.split('/').map(Number)
                  return (anoB * 100 + mesB) - (anoA * 100 + mesA)
                })
                .map(([periodo, items]) => {
                  const [mes] = periodo.split('/').map(Number)
                  const mesNome = meses[mes - 1]
                  const totalMesBase = items.reduce((acc, h) => acc + h.proLaboreBase, 0)
                  const totalMesDescontos = items.reduce((acc, h) => acc + h.totalDescontos, 0)
                  const totalMesLiquido = items.reduce((acc, h) => acc + h.proLaboreLiquido, 0)
                  const isExpanded = expandido === periodo

                  return (
                    <Card key={periodo} className="overflow-hidden">
                      {/* Header do Mês */}
                      <button
                        onClick={() => toggleExpandir(periodo)}
                        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Calendar className="h-4 w-4 text-primary" />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-foreground">{mesNome} {periodo.split('/')[1]}</p>
                            <p className="text-xs text-muted-foreground">{items.length} sócio(s)</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Líquido Total</p>
                            <p className="font-semibold text-foreground">{formatCurrency(totalMesLiquido)}</p>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </button>

                      {/* Detalhes Expandidos */}
                      {isExpanded && (
                        <div className="border-t border-border p-4 bg-muted/20 space-y-3">
                          {items.map(item => (
                            <div key={item.id} className="p-3 bg-background rounded-lg border border-border">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground">{item.socioNome}</span>
                                  {item.pago ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                      <CheckCircle className="h-3 w-3" />
                                      Pago
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                                      <Clock className="h-3 w-3" />
                                      Pendente
                                    </span>
                                  )}
                                </div>
                                <span className="font-semibold text-primary">{formatCurrency(item.proLaboreLiquido)}</span>
                              </div>

                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground text-xs">Base</p>
                                  <p className="font-medium">{formatCurrency(item.proLaboreBase)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground text-xs">Descontos</p>
                                  <p className="font-medium text-red-600">-{formatCurrency(item.totalDescontos)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground text-xs">Líquido</p>
                                  <p className="font-medium text-green-600">{formatCurrency(item.proLaboreLiquido)}</p>
                                </div>
                              </div>

                              {/* Detalhes dos Descontos */}
                              {item.descontos.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-border">
                                  <p className="text-xs font-medium text-muted-foreground mb-2">Detalhes dos Descontos:</p>
                                  <div className="space-y-1">
                                    {item.descontos.map((d, idx) => (
                                      <div key={idx} className="flex justify-between text-xs">
                                        <span className="text-muted-foreground truncate max-w-[200px]">{d.descricao}</span>
                                        <span className="text-red-600">-{formatCurrency(d.valor)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Resumo do Mês */}
                          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-foreground">Resumo do Mês</span>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-muted-foreground">Base: <span className="font-medium text-foreground">{formatCurrency(totalMesBase)}</span></span>
                                <span className="text-muted-foreground">Desc: <span className="font-medium text-red-600">-{formatCurrency(totalMesDescontos)}</span></span>
                                <span className="text-muted-foreground">Líquido: <span className="font-semibold text-primary">{formatCurrency(totalMesLiquido)}</span></span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  )
                })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <Button variant="outline" onClick={onClose} className="w-full">
            Fechar
          </Button>
        </div>
      </Card>
    </div>
  )
}
